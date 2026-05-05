import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { type AgentGraphState } from './graph-state.js';
import { checkIsOffTopicGuard, MAX_LENGTH_REPLY, OFF_TOPIC_REPLY } from './guard';
import { getChatModel } from './llm-provider';
import { getCompactHistory, getOrCreateSession, saveMessage, updateSessionTitle } from './memory';
import { memoryCompressorNode } from './memory-compressor.js';
import { getAgentUserProfile } from './personal-data.repository.js';
import { DISCLAIMER_TEXT, FINSIGHT_PERSONA, TOOL_LABELS } from './prompts';
import { routeIntent } from './router';
import { routerNode } from './router-node.js';
import { createBoundTools, getToolsByIntent } from './tools/index.js';
import { buildDefaultWorkerRegistry } from './worker.interface.js';

const AGENT_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AGENT_TIMEOUT')), ms)),
  ]);
}

function extractSessionTitle(query: string): string {
  const ocrReqMatch = query.match(/Yêu cầu của tôi:\s*(.+)/s);
  if (ocrReqMatch) {
    const req = ocrReqMatch[1].trim();
    return req.length > 47 ? `📷 ${req.substring(0, 44)}...` : `📷 ${req}`;
  }
  return query.length > 50 ? query.substring(0, 47) + '...' : query;
}

export const runAgenticChat = async (
  userId: string,
  query: string,
  sessionId: string | null,
  onTokenStream: (token: string) => void,
  onToolStatus: (status: string | null) => void,
  isAborted: (() => boolean) | null = null,
) => {
  const startTime = Date.now();
  const elapsed = () => `${Date.now() - startTime}ms`;

  console.log('\n' + '='.repeat(70));
  console.log('[Agent] 🚀 NEW REQUEST');
  console.log('[Agent] 👤 User ID:', userId);
  console.log('[Agent] 💬 Session ID:', sessionId || '(new)');
  console.log('[Agent] 📏 Query length:', query.length);
  console.log('='.repeat(70));

  if (query.length > 2000) {
    if (onTokenStream) onTokenStream(MAX_LENGTH_REPLY);
    return { response: MAX_LENGTH_REPLY, actionType: null };
  }

  if (checkIsOffTopicGuard(query)) {
    if (onTokenStream) {
      const words = OFF_TOPIC_REPLY.split(' ');
      for (let w of words) {
        onTokenStream(w + ' ');
      }
    }
    return { response: OFF_TOPIC_REPLY, actionType: null };
  }

  const isV2Enabled = process.env.AGENT_GRAPH_V2 === 'true';

  if (isV2Enabled) {
    console.log('[Agent] 🚀 Using V2 Orchestrator Pipeline');
    try {
      const session = await getOrCreateSession(userId, sessionId);
      if (!sessionId) {
        const title = extractSessionTitle(query);
        await updateSessionTitle(session.id, title);
      }

      const state: AgentGraphState = {
        userId,
        sessionId: session.id,
        input: query,
        summary: '',
        recentMessages: [],
        activeContext: '',
        intent: 'GENERAL_CHAT' as any,
        worker: 'general',
        textResponse: '',
        uiSignal: null,
        errors: [],
      };

      const compressed = await memoryCompressorNode(state);
      state.summary = compressed.summary;
      state.recentMessages = compressed.recentMessages;
      state.activeContext = compressed.activeContext;
      if (compressed.errors) state.errors.push(...compressed.errors);

      const userProfile = await getAgentUserProfile(userId);
      const strategyQuota = userProfile?.strategyQuota ?? null;

      const routeResult = await routerNode(state, strategyQuota);
      state.intent = routeResult.intent;
      state.worker = routeResult.worker;
      state.errors = routeResult.errors;

      // Per-worker flag to allow selective rollout. Defaults to true if V2 is on.
      const isWorkerV2Enabled = process.env[`AGENT_GRAPH_V2_${state.worker.toUpperCase()}`] !== 'false';

      if (!isWorkerV2Enabled) {
        console.log(`[Agent] 🕰️ Falling back to V1 Legacy Pipeline for worker: ${state.worker}`);
        // Break out of V2 block to run V1 below
      } else {
        const registry = buildDefaultWorkerRegistry();
        const worker = registry.resolve(state.worker) || registry.resolve('general')!;

        const workerOutput = await worker.run(
          state,
          onTokenStream || (() => {}),
          onToolStatus || (() => {}),
          isAborted,
        );

        let actionTypeResponse = 'text_response';
        let triggerPayload: any = null;

        if (workerOutput.uiSignal && workerOutput.uiSignal.type !== 'NONE') {
          actionTypeResponse = workerOutput.uiSignal.type;
          triggerPayload = workerOutput.uiSignal;
        } else if (workerOutput.uiSignal && workerOutput.uiSignal.type === 'NONE') {
          actionTypeResponse = 'text_response';
          triggerPayload = null;
        }

        await saveMessage(session.id, 'assistant', workerOutput.text, actionTypeResponse, triggerPayload);

        console.log(`[Agent] ✅ V2 REQUEST COMPLETE [${elapsed()}]`);

        return {
          response: workerOutput.text,
          sessionId: session.id,
          actionType: actionTypeResponse,
          triggerPayload,
        };
      }
    } catch (e: any) {
      console.error('[Agent] V2 error:', e);
      const errorMsg = '❌ Hệ thống tư vấn đang gặp sự cố, vui lòng thử lại sau.';
      if (onTokenStream) onTokenStream(errorMsg);
      return { response: errorMsg, actionType: null };
    }
  } else {
    console.log('[Agent] 🕰️ Using V1 Legacy Pipeline');
  }

  const intent = await routeIntent(query);
  const session = await getOrCreateSession(userId, sessionId);

  if (!sessionId) {
    const title = extractSessionTitle(query);
    await updateSessionTitle(session.id, title);
  }

  const compactHistory = await getCompactHistory(session.id);
  await saveMessage(session.id, 'user', query);

  const llm = getChatModel({ streaming: true });
  const intentTools = getToolsByIntent(intent);
  const boundTools = createBoundTools(intentTools, userId);

  const agent = createReactAgent({
    llm,
    tools: boundTools as any,
  });

  const userContextStr = `User ID: ${userId}\nMã Intent được gán: ${intent}`;
  const sysMsg = new SystemMessage(FINSIGHT_PERSONA.replace('{user_context}', userContextStr));

  const inputs = {
    messages: [sysMsg, ...compactHistory, new HumanMessage(query)],
  };

  let fullResponse = '';
  let actionTypeResponse = 'text_response';
  let triggerPayload: any = null;
  let iterationCount = 0;
  let tokenCount = 0;
  const MAX_ITERATIONS = 5;

  try {
    if (onToolStatus) onToolStatus('🤔 Đang suy nghĩ...');

    const streamPromise = (async () => {
      const stream = await agent.streamEvents(inputs, { version: 'v2' });

      for await (const event of stream) {
        if (isAborted && isAborted()) {
          console.log('[Agent] Aborted');
          break;
        }

        if (event.event === 'on_chat_model_stream') {
          if (event.data.chunk.content) {
            tokenCount++;
            fullResponse += event.data.chunk.content;
            if (onToolStatus) onToolStatus(null);
            if (onTokenStream) {
              onTokenStream(event.data.chunk.content);
            }
          }
        }

        if (event.event === 'on_tool_start') {
          iterationCount++;
          if (iterationCount > MAX_ITERATIONS) {
            throw new Error('MAX_ITERATIONS_EXCEEDED');
          }
          const toolName = event.name;
          const label = TOOL_LABELS[toolName] || `🔧 Đang sử dụng công cụ: ${toolName}...`;
          if (onToolStatus) onToolStatus(label);
        }

        if (event.event === 'on_tool_end' && event.name === 'parse_debt_from_text') {
          try {
            const raw =
              typeof event.data.output === 'string'
                ? event.data.output
                : event.data.output?.content || JSON.stringify(event.data.output);
            const parsed = JSON.parse(raw);
            if (parsed.action === 'FORM_POPULATION_REQUIRED') {
              actionTypeResponse = 'form_population';
              triggerPayload = parsed;
            }
          } catch (e: any) {
            console.error(`[Agent] Tool end parse error:`, e.message);
          }
        }
      }
    })();

    await withTimeout(streamPromise, AGENT_TIMEOUT_MS);
  } catch (err: any) {
    if (onToolStatus) onToolStatus(null);
    let errorMsg;
    if (err.message === 'AGENT_TIMEOUT') {
      errorMsg = '⏰ Xin lỗi, hệ thống mất quá nhiều thời gian để xử lý. Vui lòng thử lại với câu hỏi ngắn gọn hơn.';
    } else if (err.message === 'MAX_ITERATIONS_EXCEEDED') {
      errorMsg = '⚠️ Câu hỏi này cần xử lý quá nhiều bước. Vui lòng chia nhỏ câu hỏi để tôi hỗ trợ tốt hơn.';
    } else if (err.message?.includes('429') || err.message?.includes('rate')) {
      errorMsg = '🔄 Hệ thống AI đang quá tải, vui lòng thử lại sau 30 giây.';
    } else {
      errorMsg = '❌ Hệ thống tư vấn đang gặp sự cố, vui lòng thử lại sau.';
    }

    if (fullResponse.length > 0) {
      fullResponse += `\n\n---\n${errorMsg}`;
      if (onTokenStream) onTokenStream(`\n\n---\n${errorMsg}`);
    } else {
      fullResponse = errorMsg;
      if (onTokenStream) onTokenStream(fullResponse);
    }
  }

  if (!fullResponse || fullResponse.trim().length === 0) {
    fullResponse = 'Xin lỗi, tôi chưa thể xử lý yêu cầu này. Vui lòng thử lại hoặc diễn đạt khác.';
    if (onTokenStream) onTokenStream(fullResponse);
  }

  if (intent === 'DATA_ENTRY' && iterationCount === 0 && actionTypeResponse === 'text_response') {
    const isCannedCopy =
      (fullResponse.includes('trích xuất thông tin khoản nợ') && fullResponse.includes('Xác nhận')) ||
      fullResponse.includes('Để tôi hỗ trợ khai báo khoản nợ, vui lòng cung cấp');
    if (isCannedCopy) {
      fullResponse =
        'Xin lỗi, tôi gặp sự cố khi xử lý khoản nợ này. Vui lòng thử lại bằng cách gửi lại thông tin khoản vay của bạn.';
      if (onTokenStream) onTokenStream(fullResponse);
    }
  }

  if (intent === 'INVESTMENT_ADVICE' && fullResponse && !fullResponse.includes('Từ chối trách nhiệm')) {
    fullResponse += DISCLAIMER_TEXT;
    if (onTokenStream) onTokenStream(DISCLAIMER_TEXT);
  }

  if (onToolStatus) onToolStatus(null);

  await saveMessage(session.id, 'assistant', fullResponse, actionTypeResponse, triggerPayload);

  console.log(`[Agent] ✅ REQUEST COMPLETE [${elapsed()}]`);

  return {
    response: fullResponse,
    sessionId: session.id,
    actionType: actionTypeResponse,
    triggerPayload,
  };
};
