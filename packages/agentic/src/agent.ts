import { type AgentGraphState } from './graph-state.js';
import { getOrCreateSession, saveMessage, updateSessionTitle } from './memory';
import { memoryCompressorNode } from './memory-compressor.js';
import { getAgentUserProfile } from './personal-data.repository.js';
import { routerNode } from './router-node.js';
import { buildDefaultWorkerRegistry } from './worker.interface.js';

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

  try {
    // 1. Session bootstrap
    const session = await getOrCreateSession(userId, sessionId);
    if (!sessionId) {
      const title = extractSessionTitle(query);
      await updateSessionTitle(session.id, title);
    }

    // 2. Persist user message immediately so it is never lost
    await saveMessage(session.id, 'user', query);

    // 3. Build initial state
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

    // 4. Memory compression (sliding window + optional summarization)
    const compressed = await memoryCompressorNode(state);
    state.summary = compressed.summary;
    state.recentMessages = compressed.recentMessages;
    state.activeContext = compressed.activeContext;
    if (compressed.errors) state.errors.push(...compressed.errors);

    // 5. User profile (needed for investment quota pre-check in router)
    const userProfile = await getAgentUserProfile(userId);
    const strategyQuota = userProfile?.strategyQuota ?? null;

    // 6. Router: classify intent and select worker
    const routeResult = await routerNode(state, strategyQuota);
    state.intent = routeResult.intent;
    state.worker = routeResult.worker;
    state.errors = routeResult.errors;

    // 7. Resolve and run the worker
    const registry = buildDefaultWorkerRegistry();
    const worker = registry.resolve(state.worker) || registry.resolve('general')!;

    const workerOutput = await worker.run(state, onTokenStream || (() => {}), onToolStatus || (() => {}), isAborted);

    // 8. Derive action type from UI signal
    let actionTypeResponse = 'text_response';
    let triggerPayload: any = null;

    if (workerOutput.uiSignal && workerOutput.uiSignal.type !== 'NONE') {
      actionTypeResponse = workerOutput.uiSignal.type;
      triggerPayload = workerOutput.uiSignal;
    }

    // 9. Persist assistant message
    await saveMessage(session.id, 'assistant', workerOutput.text, actionTypeResponse, triggerPayload);

    console.log(`[Agent] ✅ REQUEST COMPLETE [${elapsed()}]`);

    return {
      response: workerOutput.text,
      sessionId: session.id,
      actionType: actionTypeResponse,
      triggerPayload,
    };
  } catch (e: any) {
    console.error('[Agent] Fatal error:', e);
    const errorMsg = '❌ Hệ thống tư vấn đang gặp sự cố, vui lòng thử lại sau.';
    if (onToolStatus) onToolStatus(null);
    if (onTokenStream) onTokenStream(errorMsg);
    return { response: errorMsg, actionType: null };
  }
};
