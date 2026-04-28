import prisma from "../lib/prisma";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { getChatModel } from "./llm-provider";

export const getOrCreateSession = async (userId: string, sessionId: string | null = null) => {
  if (sessionId) {
    const session = await (prisma as any).chatSession.findUnique({
      where: { id: sessionId },
    });
    if (session && session.userId === userId) return session;
  }

  return (prisma as any).chatSession.create({
    data: { userId, title: "Cuộc trò chuyện mới" },
  });
};

export const saveMessage = async (sessionId: string, role: string, content: string, actionType: string | null = null, payload: any = null) => {
  return (prisma as any).chatMessage.create({
    data: {
      sessionId,
      role,
      content,
      actionType,
      payload
    }
  });
};

async function summarizeOldHistory(oldMessages: any[]): Promise<string> {
  try {
    const model = getChatModel({ temperature: 0.1, streaming: false, maxTokens: 256 });

    const transcript = oldMessages.map(m => {
      const role = m.role === 'user' ? 'Người dùng' : 'AI';
      const content = m.content.length > 200
        ? m.content.substring(0, 200) + '...'
        : m.content;
      return `${role}: ${content}`;
    }).join('\n');

    const response = await model.invoke([
      new SystemMessage(
        `Bạn là trợ lý tóm tắt. Hãy tóm tắt cuộc hội thoại sau thành 2-3 câu ngắn gọn bằng tiếng Việt. 
Tập trung vào: thông tin khoản nợ đã khai báo, số liệu quan trọng, và các quyết định đã thực hiện.
CHỈ trả về bản tóm tắt, không thêm lời giải thích.`
      ),
      new HumanMessage(transcript),
    ]);

    return (response.content as string).trim();
  } catch (err: any) {
    console.error('[Memory] Summarization failed:', err.message);
    return oldMessages.map(m => {
      const role = m.role === 'user' ? '[User]' : '[AI]';
      return `${role}: ${m.content.substring(0, 80)}...`;
    }).join('\n');
  }
}

export const getSessionHistory = async (sessionId: string, limit: number = 10, summarize: boolean = true): Promise<BaseMessage[]> => {
  const messages = await (prisma as any).chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  messages.reverse();

  if (summarize && messages.length >= 8) {
    const oldMessages = messages.slice(0, messages.length - 4);
    const recentMessages = messages.slice(messages.length - 4);

    const summary = await summarizeOldHistory(oldMessages);
    console.log('[Memory] Summarized', oldMessages.length, 'old messages');

    return [
      new SystemMessage(`[Tóm tắt hội thoại trước đó]:\n${summary}`),
      ...recentMessages.map(m => mapDbMessageToLangChain(m)),
    ];
  }

  return messages.map((m: any) => mapDbMessageToLangChain(m));
};

const WINDOW_SIZE = 8;       
const DB_FETCH_LIMIT = 16;   

function sanitizeAIContent(msg: any): string {
  const content = msg.content || '';
  const actionType = msg.actionType || null;

  if (actionType === 'form_population') {
    return '(Trợ lý đã gọi tool phân tích khoản nợ và hiển thị form xác nhận.)';
  }

  if (content.includes('trích xuất thông tin khoản nợ') || content.includes('bấm **Xác nhận**')) {
    return '(Trợ lý đã trích xuất khoản nợ, chờ user xác nhận trên form.)';
  }

  if (content.includes('vui lòng cung cấp') || content.includes('thông tin còn thiếu')) {
    return '(Trợ lý đã hỏi user bổ sung thông tin còn thiếu.)';
  }

  if (content.includes('Xin lỗi') && content.includes('thử lại')) {
    return '(Trợ lý gặp lỗi, yêu cầu user thử lại.)';
  }

  const firstSentence = content.split(/[.\n]/)[0].trim();
  const truncated = firstSentence.length > 80
    ? firstSentence.substring(0, 77) + '...'
    : firstSentence;
  return `(Trợ lý đã trả lời: ${truncated})`;
}

export const getCompactHistory = async (sessionId: string): Promise<BaseMessage[]> => {
  const messages = await (prisma as any).chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: DB_FETCH_LIMIT,
  });

  messages.reverse();

  if (messages.length === 0) return [];

  let summaryPart = '';
  let detailMessages = messages;

  if (messages.length > WINDOW_SIZE) {
    const oldPart = messages.slice(0, messages.length - WINDOW_SIZE);
    detailMessages = messages.slice(messages.length - WINDOW_SIZE);

    summaryPart = await summarizeOldHistory(oldPart);
  }

  const lines = detailMessages.map((m: any) => {
    if (m.role === 'user') {
      let content = m.content;
      if (content.length > 300) {
        const ocrMatch = content.match(/Yêu cầu của tôi:\s*(.+)/s);
        if (ocrMatch) {
          content = `(ảnh đính kèm) ${ocrMatch[1].trim().substring(0, 200)}`;
        } else {
          content = content.substring(0, 300) + '...';
        }
      }
      return `- Người dùng: ${content}`;
    }
    if (m.role === 'assistant') {
      return `- Hệ thống: ${sanitizeAIContent(m)}`;
    }
    return null;
  }).filter(Boolean);

  let contextBlock = '=== NGỮ CẢNH HỘI THOẠI (chỉ để tham khảo, KHÔNG sao chép) ===\n';

  if (summaryPart) {
    contextBlock += `Tóm tắt phần trước: ${summaryPart}\n---\n`;
  }

  contextBlock += `Các lượt trao đổi gần đây:\n${lines.join('\n')}`;
  contextBlock += '\n=== HẾT NGỮ CẢNH ===';

  return [new SystemMessage(contextBlock)];
};

function mapDbMessageToLangChain(m: any): BaseMessage {
  if (m.role === 'user') return new HumanMessage(m.content);
  if (m.role === 'assistant') {
    const msg = new AIMessage(m.content);
    if (m.actionType) {
      msg.additional_kwargs = { ...msg.additional_kwargs, actionType: m.actionType };
    }
    return msg;
  }
  if (m.role === 'system') return new SystemMessage(m.content);
  return new HumanMessage(m.content); 
}

export const updateSessionTitle = async (sessionId: string, title: string) => {
  return (prisma as any).chatSession.update({
    where: { id: sessionId },
    data: { title },
  });
};
