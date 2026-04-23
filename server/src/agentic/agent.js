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
 * Hàm hỗ trợ giới hạn thời gian chạy (Timeout) cho một Promise.
 * Tránh trường hợp Agent bị treo vĩnh viễn không trả về kết quả.
 * @param {Promise} promise - Promise cần chạy.
 * @param {number} ms - Thời gian tối đa (milliseconds).
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
  // --- BƯỚC 1: Cổng bảo vệ (Guard) rào cản độ dài ---
  // Chặn ngay những yêu cầu quá dài để tiết kiệm chi phí và tránh lỗi LLM
  if (query.length > 2000) {
    if (onTokenStream) onTokenStream(MAX_LENGTH_REPLY);
    return { response: MAX_LENGTH_REPLY, actionType: null };
  }

  // --- BƯỚC 2: Cổng bảo vệ (Guard) chống lạc đề ---
  // Kiểm tra nhanh bằng regex xem câu hỏi có chứa từ khóa nhạy cảm, cấm kỵ không
  if (checkIsOffTopicGuard(query)) {
    if (onTokenStream) {
      const words = OFF_TOPIC_REPLY.split(' ');
      for (let w of words) {
        onTokenStream(w + ' ');
      }
    }
    return { response: OFF_TOPIC_REPLY, actionType: null };
  }

  // --- BƯỚC 3: Phân loại Mục đích (Intent Routing) ---
  // Gọi sang router.js để xác định người dùng đang muốn hỏi về cái gì
  const intent = await routeIntent(query);
  
  // --- BƯỚC 4: Kiểm tra Bộ nhớ tạm (Semantic Cache) ---
  // Nếu là câu hỏi kiến thức và đã có người từng hỏi, trả về luôn câu trả lời cũ
  const cachedResponse = await checkSemanticCache(query);
  if (cachedResponse && intent === 'KNOWLEDGE') {
    if (onTokenStream) onTokenStream(cachedResponse);
    return { response: cachedResponse, actionType: null };
  }

  // --- BƯỚC 5: Khởi tạo Dữ liệu Phiên (Context Initialization) ---
  const session = await getOrCreateSession(userId, sessionId);

  // Tự động đặt tên cho phiên trò chuyện dựa trên câu hỏi đầu tiên
  if (!sessionId) {
    const title = query.length > 50 ? query.substring(0, 47) + '...' : query;
    await updateSessionTitle(session.id, title);
  }
  
  // Lấy lịch sử trò chuyện TRƯỚC KHI lưu câu hỏi mới để tránh trùng lặp tin nhắn
  // (Bug fix: trước đây saveMessage được gọi trước getSessionHistory
  // → query xuất hiện trong history VÀ lại được append thêm ở cuối → LLM nhận query 2 lần)
  const history = await getSessionHistory(session.id, 6);
  
  // Lưu câu hỏi người dùng vào DB SAU KHI đã lấy history
  await saveMessage(session.id, 'user', query);
  
  // Khởi tạo LLM (ví dụ: Google Gemini) hỗ trợ chức năng Streaming
  const llm = getChatModel({ streaming: true });
  
  // Tạo bộ não Agent (ReAct) từ LangGraph với LLM và các công cụ được cấp quyền
  const agent = createReactAgent({
    llm,
    tools: ALL_TOOLS,
  });

  // Chèn linh hoạt thông tin User và Intent vào System Prompt (Lời giới thiệu của AI)
  const userContextStr = `User ID: ${userId}\nMã Intent được gán: ${intent}`;
  const sysMsg = new SystemMessage(FINSIGHT_PERSONA.replace('{user_context}', userContextStr));

  // Tập hợp các câu thoại để gửi cho LLM (System + History + Current Query)
  const inputs = {
    messages: [sysMsg, ...history, new HumanMessage(query)],
  };
  
  // --- BƯỚC 6: Thực thi Agent (Agent Execution) bằng luồng sự kiện (StreamEvents) ---
  let fullResponse = "";
  let actionTypeResponse = "text_response";
  let triggerPayload = null;
  let iterationCount = 0;
  const MAX_ITERATIONS = 5; // Giới hạn số lần suy nghĩ/gọi công cụ tối đa để tránh vòng lặp vô hạn

  try {
    // Thông báo cho Client biết Agent bắt đầu suy nghĩ
    if (onToolStatus) onToolStatus('🤔 Đang suy nghĩ...');

    const streamPromise = (async () => {
      // Bắt đầu nhận stream sự kiện từ LangGraph
      const stream = await agent.streamEvents(inputs, { version: "v2" });
      
      for await (const event of stream) {
        // Sự kiện: LLM đang nhả từng chữ (Streaming Token)
        if (event.event === "on_chat_model_stream") {
          if (event.data.chunk.content) {
            fullResponse += event.data.chunk.content;
            if (onToolStatus) onToolStatus(null); // Xóa dòng chữ trạng thái công cụ khi bắt đầu trả lời
            if (onTokenStream) {
              onTokenStream(event.data.chunk.content);
            }
          }
        }

        // Sự kiện: LLM bắt đầu quyết định dùng một Công cụ (Tool) nào đó
        if (event.event === "on_tool_start") {
          iterationCount++;
          if (iterationCount > MAX_ITERATIONS) {
            throw new Error('MAX_ITERATIONS_EXCEEDED');
          }
          const toolName = event.name;
          const label = TOOL_LABELS[toolName] || `🔧 Đang sử dụng công cụ: ${toolName}...`;
          if (onToolStatus) onToolStatus(label); // Cập nhật trạng thái giao diện Client
        }

        // Sự kiện: Công cụ chạy xong, LLM phân tích kết quả
        if (event.event === "on_tool_end") {
          if (onToolStatus) onToolStatus('🤔 Đang phân tích kết quả...');
        }
        
        // --- Xử lý Đặc biệt: Trigger Popup xác nhận nợ cho Client ---
        // Nếu công cụ vừa chạy là "parse_debt_from_text" và có kết quả yêu cầu xác nhận
        if (event.event === "on_tool_end" && event.name === "parse_debt_from_text") {
           try {
             // LangGraph v2: Dữ liệu output có thể là string, ToolMessage, hoặc Object
             const raw = typeof event.data.output === 'string'
               ? event.data.output
               : (event.data.output?.content || JSON.stringify(event.data.output));
             const parsed = JSON.parse(raw);
             if (parsed.action === "FORM_POPULATION_REQUIRED") {
               // Đánh dấu luồng này cần bật Popup
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
    if (onToolStatus) onToolStatus(null); // Xóa trạng thái nếu có lỗi xảy ra

    // Bắt các lỗi thường gặp trong quá trình LLM chạy
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

  // --- BƯỚC 7: Xử lý Hậu kỳ (Post-Processing) ---
  // Tự động chèn câu "Miễn trừ trách nhiệm" nếu đây là câu tư vấn về rủi ro đầu tư
  if (intent === 'INVESTMENT_ADVICE' && fullResponse && !fullResponse.includes('Từ chối trách nhiệm')) {
    fullResponse += DISCLAIMER_TEXT;
    if (onTokenStream) onTokenStream(DISCLAIMER_TEXT);
  }

  // Xóa mọi trạng thái hoạt động trên giao diện
  if (onToolStatus) onToolStatus(null);

  // --- BƯỚC 8: Lưu trữ (Save & Cache) ---
  // Lưu câu trả lời của AI vào Database và lưu vào Cache để dùng lại
  await saveMessage(session.id, 'assistant', fullResponse, actionTypeResponse, triggerPayload);
  await setSemanticCache(query, fullResponse, intent);

  return {
    response: fullResponse,
    sessionId: session.id,
    actionType: actionTypeResponse,
    triggerPayload
  };
};
