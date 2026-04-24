// =====================================================================
// agent.js — Bộ não chính của FinSight Agentic Chatbot
// =====================================================================
// File này điều phối TOÀN BỘ luồng xử lý khi người dùng gửi tin nhắn:
//   1. Guard (rào cản)      → Chặn spam, lạc đề
//   2. Intent Router         → Phân loại mục đích: KNOWLEDGE / DEBT / ...
//   3. Semantic Cache         → Kiểm tra câu trả lời đã có sẵn chưa
//   4. Session & Memory      → Tạo/nạp phiên trò chuyện + lịch sử
//   5. ReAct Agent (LLM)     → Gọi LLM + Tools để sinh câu trả lời
//   6. Post-processing       → Gắn disclaimer, lưu DB, cache
//
// 💡 Tất cả log đều có prefix [Agent] để dễ grep trên server.
//    Log chi tiết NỘI DUNG MESSAGE để debug prompt/context issues.
// =====================================================================

import { getChatModel } from './llm-provider.js';           // Khởi tạo model LLM (Gemini/OpenAI)
import { getToolsByIntent, createBoundTools } from './tools/index.js'; // Lấy tools theo intent
import { routeIntent } from './router.js';                  // Phân loại intent từ câu hỏi
import { checkIsOffTopicGuard, OFF_TOPIC_REPLY, MAX_LENGTH_REPLY } from './guard.js'; // Bộ lọc bảo vệ
import { checkSemanticCache, setSemanticCache } from './cache.js';     // Cache ngữ nghĩa
import { getOrCreateSession, getSessionHistory, getCompactHistory, saveMessage, updateSessionTitle } from './memory.js'; // Quản lý phiên
import { FINSIGHT_PERSONA, DISCLAIMER_TEXT, TOOL_LABELS } from './prompts.js'; // Prompt hệ thống
import { SystemMessage, HumanMessage } from '@langchain/core/messages';        // Message types của LangChain
import { createReactAgent } from "@langchain/langgraph/prebuilt";              // ReAct Agent pattern

// Thời gian tối đa cho 1 request (ms). Nếu quá → timeout, trả lỗi cho user.
const AGENT_TIMEOUT_MS = 30_000; // 30 giây

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

/**
 * Trích xuất tiêu đề phiên trò chuyện thông minh từ câu hỏi đầu tiên.
 * Nếu câu hỏi bắt đầu bằng OCR prefix, lấy phần "Yêu cầu của tôi:" thay vì nội dung OCR rác.
 * @param {string} query - Câu hỏi của người dùng.
 * @returns {string} - Tiêu đề phiên phù hợp.
 */
function extractSessionTitle(query) {
  // Nếu là OCR, lấy phần yêu cầu thực sự thay vì đoạn text bóc tách
  const ocrReqMatch = query.match(/Yêu cầu của tôi:\s*(.+)/s);
  if (ocrReqMatch) {
    const req = ocrReqMatch[1].trim();
    return req.length > 47 ? `📷 ${req.substring(0, 44)}...` : `📷 ${req}`;
  }
  return query.length > 50 ? query.substring(0, 47) + '...' : query;
}

/**
 * Hàm chính — Xử lý 1 lượt chat từ người dùng.
 *
 * @param {string}   userId        - ID người dùng (từ JWT auth, KHÔNG phải client gửi)
 * @param {string}   query         - Nội dung tin nhắn người dùng gửi lên
 * @param {string}   sessionId     - ID phiên chat (null nếu là phiên mới)
 * @param {Function} onTokenStream - Callback nhận từng chunk text khi LLM streaming
 * @param {Function} onToolStatus  - Callback thông báo trạng thái tool cho client
 * @param {Function} isAborted     - Hàm kiểm tra client đã disconnect chưa
 * @returns {{ response, sessionId, actionType, triggerPayload }}
 */
export const runAgenticChat = async (userId, query, sessionId, onTokenStream, onToolStatus, isAborted = null) => {
  const startTime = Date.now();
  // Helper: tính thời gian đã trôi qua kể từ khi bắt đầu request
  const elapsed = () => `${Date.now() - startTime}ms`;

  console.log('\n' + '='.repeat(70));
  console.log('[Agent] 🚀 NEW REQUEST — Bắt đầu xử lý tin nhắn mới');
  console.log('[Agent] 👤 User ID:', userId);
  console.log('[Agent] 💬 Session ID:', sessionId || '(phiên mới, chưa có ID)');
  console.log('[Agent] 📩 Query đầy đủ từ user:');
  // ⚡ LOG TOÀN BỘ nội dung query để debug — xem chính xác user gửi gì
  console.log('--- START USER QUERY ---');
  console.log(query);
  console.log('--- END USER QUERY ---');
  console.log('[Agent] 📏 Độ dài query:', query.length, 'ký tự');
  console.log('='.repeat(70));
  // --- BƯỚC 1: Cổng bảo vệ (Guard) rào cản độ dài ---
  // Chặn ngay những yêu cầu quá dài để tiết kiệm chi phí và tránh lỗi LLM
  if (query.length > 2000) {
    if (onTokenStream) onTokenStream(MAX_LENGTH_REPLY);
    console.log(`[Agent] ❌ BLOCKED by length guard (${query.length} > 2000) [${elapsed()}]`);
    return { response: MAX_LENGTH_REPLY, actionType: null };
  }
  console.log(`[Agent] ✅ STEP 1: Length guard passed [${elapsed()}]`);

  // --- BƯỚC 2: Cổng bảo vệ (Guard) chống lạc đề ---
  // Kiểm tra nhanh bằng regex xem câu hỏi có chứa từ khóa nhạy cảm, cấm kỵ không
  if (checkIsOffTopicGuard(query)) {
    if (onTokenStream) {
      const words = OFF_TOPIC_REPLY.split(' ');
      for (let w of words) {
        onTokenStream(w + ' ');
      }
    }
    console.log(`[Agent] ❌ BLOCKED by off-topic guard [${elapsed()}]`);
    return { response: OFF_TOPIC_REPLY, actionType: null };
  }
  console.log(`[Agent] ✅ STEP 2: Off-topic guard passed [${elapsed()}]`);

  // --- BƯỚC 3: Phân loại Mục đích (Intent Routing) ---
  // Gọi sang router.js: dùng regex/keyword matching để phân loại query
  // Kết quả intent quyết định TOOLS nào được cấp cho Agent (hard-filter)
  // Các intent có thể: KNOWLEDGE, DEBT_ADD, DEBT_QUERY, INVESTMENT_ADVICE, ...
  const intent = await routeIntent(query);
  console.log(`[Agent] ✅ STEP 3: Intent routed → "${intent}" [${elapsed()}]`);
  console.log(`[Agent]   ℹ️  Intent "${intent}" nghĩa là: user muốn ${intent === 'KNOWLEDGE' ? 'hỏi kiến thức tài chính' : intent === 'DEBT_ADD' ? 'thêm khoản nợ' : intent === 'DEBT_QUERY' ? 'xem thông tin nợ' : intent}`);

  // --- BƯỚC 4: Semantic Cache — TẠM TẮT ---
  // Cache đã gây lỗi nghiêm trọng: lưu response rỗng/sai → trả lại cho user trong 24h.
  // TODO: Bật lại khi chuyển sang Redis với invalidation strategy phù hợp.
  console.log(`[Agent] ⏭️ STEP 4: Semantic Cache DISABLED — luôn gọi LLM [${elapsed()}]`);

  // --- BƯỚC 5: Khởi tạo Dữ liệu Phiên (Context Initialization) ---
  const session = await getOrCreateSession(userId, sessionId);
  console.log(`[Agent] ✅ STEP 5: Session ready → ${session.id} (${sessionId ? 'existing' : 'NEW'}) [${elapsed()}]`);

  // Tự động đặt tên cho phiên trò chuyện dựa trên câu hỏi đầu tiên
  // Sử dụng extractSessionTitle để tránh title rác từ nội dung OCR
  if (!sessionId) {
    const title = extractSessionTitle(query);
    await updateSessionTitle(session.id, title);
    console.log(`[Agent]   📝 Session title set: "${title}"`);
  }

  // --- BƯỚC 5b: Lấy Compact History (Sliding Window + Sanitized) ---
  // Lấy lịch sử TRƯỚC KHI lưu câu hỏi mới để tránh trùng lặp
  // getCompactHistory: 8 messages gần nhất + AI content đã sanitize
  // → LLM có context để hiểu follow-up nhưng KHÔNG có text để copy
  const compactHistory = await getCompactHistory(session.id);
  console.log(`[Agent] ✅ STEP 5b: Compact history loaded → ${compactHistory.length} items [${elapsed()}]`);
  // ⚡ LOG từng message trong compact history — verify sanitization
  compactHistory.forEach((msg, i) => {
    const type = msg.constructor.name;
    const preview = msg.content.substring(0, 120).replace(/\n/g, '\\n');
    console.log(`[Agent]   📜 CompactHistory[${i}] (${type}): "${preview}${msg.content.length > 120 ? '...' : ''}"`);
  });

  // Lưu câu hỏi người dùng vào DB SAU KHI đã lấy history
  await saveMessage(session.id, 'user', query);
  console.log(`[Agent] 💾 User message saved to DB [${elapsed()}]`);

  // Khởi tạo LLM hỗ trợ chức năng Streaming
  const llm = getChatModel({ streaming: true });
  console.log(`[Agent] ✅ STEP 6: LLM initialized [${elapsed()}]`);

  // --- HARD-FILTER: Chỉ cấp tools phù hợp với intent ---
  const intentTools = getToolsByIntent(intent);
  console.log(`[Agent] 🔧 Tools filtered by intent (${intent}):`, intentTools.map(t => t.name).join(', ') || '(none)');

  // --- SECURITY: Bind userId cứng từ auth vào tools ---
  const boundTools = createBoundTools(intentTools, userId);
  console.log(`[Agent] 🔒 Tools bound with userId: ${userId.substring(0, 8)}...`);

  // Tạo bộ não Agent (ReAct) từ LangGraph
  const agent = createReactAgent({
    llm,
    tools: boundTools,
  });
  console.log(`[Agent] 🤖 ReAct Agent created [${elapsed()}]`);

  // --- Xây dựng System Prompt ---
  // Chèn userId + intent vào prompt để LLM biết đang phục vụ ai, mục đích gì
  const userContextStr = `User ID: ${userId}\nMã Intent được gán: ${intent}`;
  const sysMsg = new SystemMessage(FINSIGHT_PERSONA.replace('{user_context}', userContextStr));

  // ⚡ LOG System Prompt đầy đủ — đây là "tính cách" + chỉ dẫn cho LLM
  console.log(`[Agent] 📋 SYSTEM PROMPT gửi cho LLM (${sysMsg.content.length} chars):`);
  console.log('--- START SYSTEM PROMPT ---');
  console.log(sysMsg.content);
  console.log('--- END SYSTEM PROMPT ---');

  // --- Tập hợp toàn bộ messages gửi cho LLM ---
  // Thứ tự: [SystemMessage, ...CompactHistory(sanitized), HumanMessage(query mới)]
  const inputs = {
    messages: [sysMsg, ...compactHistory, new HumanMessage(query)],
  };
  const totalTokenEstimate = inputs.messages.reduce((sum, m) => sum + m.content.length, 0);
  console.log(`[Agent] 📨 Tổng hợp messages gửi LLM: 1 system + ${compactHistory.length} history + 1 query = ${inputs.messages.length} messages (~${totalTokenEstimate} chars) [${elapsed()}]`);
  // ⚡ LOG danh sách tất cả messages theo thứ tự — chính xác LLM nhận được gì
  console.log('[Agent] 📬 CHI TIẾT TỪNG MESSAGE GỬI LLM:');
  inputs.messages.forEach((msg, i) => {
    const role = msg.constructor.name.replace('Message', ''); // System, Human, AI
    const content = msg.content.substring(0, 200).replace(/\n/g, '\\n');
    console.log(`[Agent]   [${i}] ${role}: "${content}${msg.content.length > 200 ? '...' : ''}"`);
  });

  // --- BƯỚC 6: Thực thi Agent (Agent Execution) bằng luồng sự kiện (StreamEvents) ---
  let fullResponse = "";
  let actionTypeResponse = "text_response";
  let triggerPayload = null;
  let iterationCount = 0;
  let tokenCount = 0;
  const MAX_ITERATIONS = 5;

  console.log(`[Agent] ▶️ STEP 7: Starting ReAct stream execution... [${elapsed()}]`);
  console.log('-'.repeat(50));

  try {
    // Thông báo cho Client biết Agent bắt đầu suy nghĩ
    if (onToolStatus) onToolStatus('🤔 Đang suy nghĩ...');

    const streamPromise = (async () => {
      const stream = await agent.streamEvents(inputs, { version: "v2" });
      console.log(`[Agent] 📡 Stream connection established [${elapsed()}]`);

      for await (const event of stream) {
        // Kiểm tra abort signal: dừng stream sớm nếu client đã disconnect
        if (isAborted && isAborted()) {
          console.log('[Agent] Aborted due to client disconnect');
          break;
        }

        // Sự kiện: LLM đang nhả từng chữ (Streaming Token)
        // Mỗi chunk là 1 mảnh nhỏ text mà LLM sinh ra theo thời gian thực
        if (event.event === "on_chat_model_stream") {
          if (event.data.chunk.content) {
            tokenCount++;
            fullResponse += event.data.chunk.content;
            if (onToolStatus) onToolStatus(null);  // Xóa status "đang suy nghĩ"
            if (onTokenStream) {
              onTokenStream(event.data.chunk.content); // Gửi chunk cho client hiển thị real-time
            }
            // Log chunk đầu tiên để biết LLM bắt đầu trả lời
            if (tokenCount === 1) {
              console.log(`[Agent] 📝 LLM bắt đầu trả lời, chunk đầu tiên: "${event.data.chunk.content}" [${elapsed()}]`);
            }
            // Log mỗi 20 chunks để theo dõi tiến trình mà không spam console
            if (tokenCount % 20 === 0) {
              console.log(`[Agent] 📝 Đang streaming... (${tokenCount} chunks, ${fullResponse.length} chars) [${elapsed()}]`);
            }
          }
        }

        // Sự kiện: LLM quyết định gọi Tool — đây là "hành động" trong ReAct loop
        // ReAct = Reasoning + Acting: LLM suy nghĩ → chọn tool → nhận kết quả → suy nghĩ tiếp
        if (event.event === "on_tool_start") {
          iterationCount++;
          if (iterationCount > MAX_ITERATIONS) {
            console.log(`[Agent] ❌ Vượt quá giới hạn lặp (${iterationCount}/${MAX_ITERATIONS})`);
            throw new Error('MAX_ITERATIONS_EXCEEDED');
          }
          const toolName = event.name;
          // ⚡ LOG ĐẦY ĐỦ input mà LLM truyền cho tool — debug xem LLM hiểu đúng user chưa
          const toolInputFull = JSON.stringify(event.data?.input || {}, null, 2);
          console.log(`[Agent] 🔧 TOOL CALL #${iterationCount}: "${toolName}" [${elapsed()}]`);
          console.log(`[Agent]   📥 Input đầy đủ gửi vào tool:`);
          console.log(toolInputFull);
          const label = TOOL_LABELS[toolName] || `🔧 Đang sử dụng công cụ: ${toolName}...`;
          if (onToolStatus) onToolStatus(label); // Thông báo client tool nào đang chạy
        }

        // Sự kiện: Tool chạy xong → LLM sẽ nhận output này để tiếp tục suy luận
        if (event.event === "on_tool_end") {
          // ⚡ LOG ĐẦY ĐỦ output của tool — xem tool trả về dữ liệu gì cho LLM
          const toolOutputRaw = typeof event.data.output === 'string'
            ? event.data.output
            : JSON.stringify(event.data.output, null, 2);
          console.log(`[Agent] ✅ TOOL DONE: "${event.name}" [${elapsed()}]`);
          console.log(`[Agent]   📤 Output đầy đủ từ tool:`);
          console.log(toolOutputRaw.substring(0, 500) + (toolOutputRaw.length > 500 ? '\n... (truncated)' : ''));
          if (onToolStatus) onToolStatus('🤔 Đang phân tích kết quả...');
        }

        // --- Xử lý Đặc biệt: Trigger Popup xác nhận nợ cho Client ---
        // Nếu công cụ vừa chạy là "parse_debt_from_text" và có kết quả yêu cầu xác nhận
        if (event.event === "on_tool_end" && event.name === "parse_debt_from_text") {
          try {
            const raw = typeof event.data.output === 'string'
              ? event.data.output
              : (event.data.output?.content || JSON.stringify(event.data.output));
            const parsed = JSON.parse(raw);
            if (parsed.action === "FORM_POPULATION_REQUIRED") {
              actionTypeResponse = "form_population";
              triggerPayload = parsed;
              console.log(`[Agent] 🎯 FORM TRIGGER detected! parsedData keys:`, Object.keys(parsed.parsedData || {}));
            }
          } catch (e) {
            console.error(`[Agent] ⚠️ Parse debt event parsing error:`, e.message);
          }
        }
      }
      console.log('-'.repeat(50));
      console.log(`[Agent] 🏁 Stream hoàn tất: ${tokenCount} chunks, ${fullResponse.length} chars [${elapsed()}]`);
      // ⚡ LOG TOÀN BỘ câu trả lời cuối cùng mà LLM sinh ra
      console.log('[Agent] 📄 FULL RESPONSE TỪ LLM:');
      console.log('--- START LLM RESPONSE ---');
      console.log(fullResponse);
      console.log('--- END LLM RESPONSE ---');
    })();

    await withTimeout(streamPromise, AGENT_TIMEOUT_MS);

  } catch (err) {
    if (onToolStatus) onToolStatus(null);

    let errorMsg;
    if (err.message === 'AGENT_TIMEOUT') {
      console.error(`[Agent] ❌ TIMEOUT after ${AGENT_TIMEOUT_MS}ms [${elapsed()}]`);
      errorMsg = "⏰ Xin lỗi, hệ thống mất quá nhiều thời gian để xử lý. Vui lòng thử lại với câu hỏi ngắn gọn hơn.";
    } else if (err.message === 'MAX_ITERATIONS_EXCEEDED') {
      console.error(`[Agent] ❌ MAX_ITERATIONS_EXCEEDED (${iterationCount}) [${elapsed()}]`);
      errorMsg = "⚠️ Câu hỏi này cần xử lý quá nhiều bước. Vui lòng chia nhỏ câu hỏi để tôi hỗ trợ tốt hơn.";
    } else if (err.message?.includes("429") || err.message?.includes("rate")) {
      console.error(`[Agent] ❌ RATE LIMITED [${elapsed()}]`);
      errorMsg = "🔄 Hệ thống AI đang quá tải, vui lòng thử lại sau 30 giây.";
    } else if (err.message?.includes("ECONNREFUSED") || err.message?.includes("fetch")) {
      console.error(`[Agent] ❌ CONNECTION REFUSED [${elapsed()}]`);
      errorMsg = "🔌 Không thể kết nối đến dịch vụ AI. Vui lòng kiểm tra kết nối mạng.";
    } else {
      console.error(`[Agent] ❌ UNEXPECTED ERROR [${elapsed()}]:`, err.message || err);
      console.error(`[Agent]   Stack:`, err.stack?.split('\n').slice(0, 3).join('\n'));
      errorMsg = "❌ Hệ thống tư vấn đang gặp sự cố, vui lòng thử lại sau.";
    }

    if (fullResponse.length > 0) {
      console.log(`[Agent] ⚠️ Partial response exists (${fullResponse.length} chars), appending error`);
      fullResponse += `\n\n---\n${errorMsg}`;
      if (onTokenStream) onTokenStream(`\n\n---\n${errorMsg}`);
    } else {
      fullResponse = errorMsg;
      if (onTokenStream) onTokenStream(fullResponse);
    }
  }

  // --- FIX: GUARD — Không cho phép response rỗng lưu vào DB/cache ---
  if (!fullResponse || fullResponse.trim().length === 0) {
    console.warn(`[Agent] ⚠️ EMPTY RESPONSE detected! Generating fallback. [${elapsed()}]`);
    fullResponse = "Xin lỗi, tôi chưa thể xử lý yêu cầu này. Vui lòng thử lại hoặc diễn đạt khác.";
    if (onTokenStream) onTokenStream(fullResponse);
  }

  // --- FIX: POST-VALIDATION — Intent DATA_ENTRY nhưng tool không được gọi ---
  // Phát hiện LLM copy câu canned response từ history thay vì gọi parse_debt_from_text
  if (intent === 'DATA_ENTRY' && iterationCount === 0 && actionTypeResponse === 'text_response') {
    // Bắt cả 2 dạng: canned response gốc VÀ override text cũ từ Fix 3 trước đó
    const isCannedCopy = (fullResponse.includes('trích xuất thông tin khoản nợ') && fullResponse.includes('Xác nhận'))
      || fullResponse.includes('Để tôi hỗ trợ khai báo khoản nợ, vui lòng cung cấp');
    if (isCannedCopy) {
      console.warn(`[Agent] ⚠️ DATA_ENTRY but tool not called & canned response detected — overriding. [${elapsed()}]`);
      fullResponse = "Xin lỗi, tôi gặp sự cố khi xử lý khoản nợ này. Vui lòng thử lại bằng cách gửi lại thông tin khoản vay của bạn.";
      if (onTokenStream) onTokenStream(fullResponse);
    }
  }

  // --- BƯỚC 7: Xử lý Hậu kỳ (Post-Processing) ---
  if (intent === 'INVESTMENT_ADVICE' && fullResponse && !fullResponse.includes('Từ chối trách nhiệm')) {
    fullResponse += DISCLAIMER_TEXT;
    if (onTokenStream) onTokenStream(DISCLAIMER_TEXT);
    console.log(`[Agent] 📎 Disclaimer appended for INVESTMENT_ADVICE`);
  }

  if (onToolStatus) onToolStatus(null);

  // --- BƯỚC 8: Lưu trữ kết quả vào DB ---
  // Lưu response của assistant vào DB để hiện lại khi user mở lại phiên chat
  await saveMessage(session.id, 'assistant', fullResponse, actionTypeResponse, triggerPayload);
  // Semantic Cache DISABLED — không lưu cache nữa
  console.log(`[Agent] 💾 Đã lưu response vào DB (${fullResponse.length} chars) và cache`);

  // --- TÓM TẮT CUỐI CÙNG ---
  console.log('\n' + '='.repeat(70));
  console.log(`[Agent] ✅ HOÀN TẤT REQUEST [${elapsed()}]`);
  console.log(`[Agent]   🎯 Intent: ${intent}`);
  console.log(`[Agent]   🔄 Action type: ${actionTypeResponse}`);
  console.log(`[Agent]   🔧 Số lần gọi tool: ${iterationCount}`);
  console.log(`[Agent]   📝 Số chunks đã stream: ${tokenCount}`);
  console.log(`[Agent]   📏 Độ dài response: ${fullResponse.length} chars`);
  console.log('='.repeat(70) + '\n');

  return {
    response: fullResponse,
    sessionId: session.id,
    actionType: actionTypeResponse,
    triggerPayload
  };
};
