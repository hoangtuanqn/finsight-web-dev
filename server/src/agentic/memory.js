import prisma from "../lib/prisma.js";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

export const getOrCreateSession = async (userId, sessionId = null) => {
  if (sessionId) {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    if (session && session.userId === userId) return session;
  }

  // Create new if not exist or no sessionId provided
  return prisma.chatSession.create({
    data: { userId, title: "Cuộc trò chuyện mới" },
  });
};

export const saveMessage = async (sessionId, role, content, actionType = null, payload = null) => {
  return prisma.chatMessage.create({
    data: {
      sessionId,
      role,
      content,
      actionType,
      payload
    }
  });
};

export const getSessionHistory = async (sessionId, limit = 10) => {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: limit, // take last N messages to keep context window small
  });

  return messages.map(m => {
    if (m.role === 'user') return new HumanMessage(m.content);
    if (m.role === 'assistant') return new AIMessage(m.content);
    if (m.role === 'system') return new SystemMessage(m.content);
    return new HumanMessage(m.content); // Default fallback
  });
};

export const updateSessionTitle = async (sessionId, title) => {
  return prisma.chatSession.update({
    where: { id: sessionId },
    data: { title },
  });
};

