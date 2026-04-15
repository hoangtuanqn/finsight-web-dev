import { getChatModel } from './llm-provider.js';
import { ALL_TOOLS, toolsByName } from './tools/index.js';
import { routeIntent } from './router.js';
import { checkIsOffTopicGuard, OFF_TOPIC_REPLY, MAX_LENGTH_REPLY } from './guard.js';
import { checkSemanticCache, setSemanticCache } from './cache.js';
import { getOrCreateSession, getSessionHistory, saveMessage, updateSessionTitle } from './memory.js';
import { FINSIGHT_PERSONA, DISCLAIMER_TEXT, TOOL_LABELS } from './prompts.js';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const AGENT_TIMEOUT_MS = 30_000; // 30 seconds max

/**
 * Wrap a promise with a timeout.
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AGENT_TIMEOUT')), ms)
    ),
  ]);
}

export const runAgenticChat = async (userId, query, sessionId, onTokenStream, onToolStatus) => {
  // 1. Max Length Guard
  if (query.length > 2000) {
    if (onTokenStream) onTokenStream(MAX_LENGTH_REPLY);
    return { response: MAX_LENGTH_REPLY, actionType: null };
  }

  // 2. Off-Topic Guard Fast Check
  if (checkIsOffTopicGuard(query)) {
    if (onTokenStream) {
      const words = OFF_TOPIC_REPLY.split(' ');
      for (let w of words) {
        onTokenStream(w + ' ');
      }
    }
    return { response: OFF_TOPIC_REPLY, actionType: null };
  }

  // 3. Intent Routing Layer
  const intent = await routeIntent(query);
  
  // 4. Semantic Cache Layer
  const cachedResponse = await checkSemanticCache(query);
  if (cachedResponse && intent === 'KNOWLEDGE') {
    if (onTokenStream) onTokenStream(cachedResponse);
    return { response: cachedResponse, actionType: null };
  }

  // 5. Initialization
  const session = await getOrCreateSession(userId, sessionId);
  await saveMessage(session.id, 'user', query);

  // Auto-title: set title from first user message
  if (!sessionId) {
    const title = query.length > 50 ? query.substring(0, 47) + '...' : query;
    await updateSessionTitle(session.id, title);
  }
  
  const history = await getSessionHistory(session.id, 6);
  
  const llm = getChatModel({ streaming: true });
  
  // Create LangChain React Agent with max iterations limit
  const agent = createReactAgent({
    llm,
    tools: ALL_TOOLS,
  });

  // Inject user profile dynamically into persona
  const userContextStr = `User ID: ${userId}\nMã Intent được gán: ${intent}`;
  const sysMsg = new SystemMessage(FINSIGHT_PERSONA.replace('{user_context}', userContextStr));

  const inputs = {
    messages: [sysMsg, ...history, new HumanMessage(query)],
  };
  
  // 6. Run Execution via streamEvents with timeout
  let fullResponse = "";
  let actionTypeResponse = "text_response";
  let triggerPayload = null;
  let iterationCount = 0;
  const MAX_ITERATIONS = 5;

  try {
    // Notify client: agent is thinking
    if (onToolStatus) onToolStatus('🤔 Đang suy nghĩ...');

    const streamPromise = (async () => {
      const stream = await agent.streamEvents(inputs, { version: "v2" });
      
      for await (const event of stream) {
        // Token streaming
        if (event.event === "on_chat_model_stream") {
          if (event.data.chunk.content) {
            fullResponse += event.data.chunk.content;
            if (onToolStatus) onToolStatus(null); // Clear tool status when text starts
            if (onTokenStream) {
              onTokenStream(event.data.chunk.content);
            }
          }
        }

        // Tool execution status broadcasting
        if (event.event === "on_tool_start") {
          iterationCount++;
          if (iterationCount > MAX_ITERATIONS) {
            throw new Error('MAX_ITERATIONS_EXCEEDED');
          }
          const toolName = event.name;
          const label = TOOL_LABELS[toolName] || `🔧 Đang sử dụng công cụ: ${toolName}...`;
          if (onToolStatus) onToolStatus(label);
        }

        if (event.event === "on_tool_end") {
          if (onToolStatus) onToolStatus('🤔 Đang phân tích kết quả...');
        }
        
        // Look for custom tool triggers (debt form population)
        if (event.event === "on_tool_end" && event.name === "parse_debt_from_text") {
           try {
             // LangGraph v2: output can be a string, ToolMessage, or object
             const raw = typeof event.data.output === 'string'
               ? event.data.output
               : (event.data.output?.content || JSON.stringify(event.data.output));
             const parsed = JSON.parse(raw);
             if (parsed.action === "FORM_POPULATION_REQUIRED") {
               actionTypeResponse = "form_population";
               triggerPayload = parsed;
             }
           } catch(e) {
             console.error("parse_debt event parsing error:", e.message, "raw:", event.data.output);
           }
        }
      }
    })();

    await withTimeout(streamPromise, AGENT_TIMEOUT_MS);

  } catch (err) {
    if (onToolStatus) onToolStatus(null); // Clear status on error

    if (err.message === 'AGENT_TIMEOUT') {
      fullResponse = "⏰ Xin lỗi, hệ thống mất quá nhiều thời gian để xử lý. Vui lòng thử lại với câu hỏi ngắn gọn hơn.";
    } else if (err.message === 'MAX_ITERATIONS_EXCEEDED') {
      fullResponse = "⚠️ Câu hỏi này cần xử lý quá nhiều bước. Vui lòng chia nhỏ câu hỏi để tôi hỗ trợ tốt hơn.";
    } else if (err.message?.includes("429") || err.message?.includes("rate")) {
      fullResponse = "🔄 Hệ thống AI đang quá tải, vui lòng thử lại sau 30 giây.";
    } else if (err.message?.includes("ECONNREFUSED") || err.message?.includes("fetch")) {
      fullResponse = "🔌 Không thể kết nối đến dịch vụ AI. Vui lòng kiểm tra kết nối mạng.";
    } else {
      fullResponse = "❌ Hệ thống tư vấn đang gặp sự cố, vui lòng thử lại sau.";
    }
    if (onTokenStream) onTokenStream(fullResponse);
    console.error("Agent error: ", err);
  }

  // 7. Post-Processing: auto-append disclaimer for investment advice
  if (intent === 'INVESTMENT_ADVICE' && fullResponse && !fullResponse.includes('Từ chối trách nhiệm')) {
    fullResponse += DISCLAIMER_TEXT;
    if (onTokenStream) onTokenStream(DISCLAIMER_TEXT);
  }

  // Clear tool status
  if (onToolStatus) onToolStatus(null);

  // 8. Save & Cache
  await saveMessage(session.id, 'assistant', fullResponse, actionTypeResponse, triggerPayload);
  await setSemanticCache(query, fullResponse, intent);

  return {
    response: fullResponse,
    sessionId: session.id,
    actionType: actionTypeResponse,
    triggerPayload
  };
};
