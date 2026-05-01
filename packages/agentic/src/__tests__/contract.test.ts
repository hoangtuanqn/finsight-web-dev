import { describe, expect, mock, test } from 'bun:test';

mock.module('../llm-provider.js', () => ({
  getChatModel: () => ({
    invoke: async () => ({ content: 'MARKET_OVERVIEW' }),
  }),
}));

import {
  debtExtractionHappyPath,
  debtSummaryHappyPath,
  marketOverviewHappyPath,
  ragHappyPath,
} from '../__fixtures__/agent-contract.fixtures.js';
import { AgentIntent, normalizeIntent } from '../graph-state.js';
import { routerNode } from '../router-node.js';
import { buildDefaultWorkerRegistry } from '../worker.interface.js';

describe('Task 5.2 - Contract tests cho Router và Worker outputs', () => {
  describe('Router routing tests based on Phase 0 fixtures', () => {
    test('Prompt "DTI là gì?" -> KNOWLEDGE', async () => {
      const state = {
        userId: 'test',
        sessionId: 'test',
        input: ragHappyPath.input, // "DTI là gì và tôi nên duy trì ở mức nào?"
        summary: '',
        recentMessages: [],
        activeContext: '',
        intent: AgentIntent.GENERAL_CHAT,
        worker: 'general',
        textResponse: '',
        uiSignal: null,
        errors: [],
      };

      const result = await routerNode(state);
      expect(result.intent).toBe(AgentIntent.KNOWLEDGE);
      expect(result.worker).toBe('rag');
      expect(result.errors.length).toBe(0);
    });

    test('Prompt "Tôi vay FE 10 triệu..." -> DEBT_EXTRACTION', async () => {
      const state = {
        userId: 'test',
        sessionId: 'test',
        input: debtExtractionHappyPath.input, // "Tôi vừa vay FE Credit 10 triệu..."
        summary: '',
        recentMessages: [],
        activeContext: '',
        intent: AgentIntent.GENERAL_CHAT,
        worker: 'general',
        textResponse: '',
        uiSignal: null,
        errors: [],
      };

      const result = await routerNode(state);
      expect(result.intent).toBe(AgentIntent.DEBT_EXTRACTION);
      expect(result.worker).toBe('debt_extraction');
    });

    test('Prompt "Tình trạng nợ của tôi thế nào?" -> DEBT_SUMMARY', async () => {
      const state = {
        userId: 'test',
        sessionId: 'test',
        input: debtSummaryHappyPath.input, // "Tình trạng nợ của tôi hiện nay thế nào?"
        summary: '',
        recentMessages: [],
        activeContext: '',
        intent: AgentIntent.GENERAL_CHAT,
        worker: 'general',
        textResponse: '',
        uiSignal: null,
        errors: [],
      };

      const result = await routerNode(state);
      expect(result.intent).toBe(AgentIntent.DEBT_SUMMARY);
      expect(result.worker).toBe('debt_summary');
    });

    test('Prompt market tổng quan -> MARKET_OVERVIEW', async () => {
      const state = {
        userId: 'test',
        sessionId: 'test',
        input: marketOverviewHappyPath.input, // "Tình hình thị trường hiện tại như thế nào?"
        summary: '',
        recentMessages: [],
        activeContext: '',
        intent: AgentIntent.GENERAL_CHAT,
        worker: 'general',
        textResponse: '',
        uiSignal: null,
        errors: [],
      };

      // Since it might not hit fast path, it will use LLM mock which returns MARKET_OVERVIEW
      const result = await routerNode(state);
      expect(result.intent).toBe(AgentIntent.MARKET_OVERVIEW);
      expect(result.worker).toBe('market');
    });

    test('Legacy OFF_TOPIC classifier output -> GENERAL_CHAT', () => {
      expect(normalizeIntent('OFF_TOPIC')).toBe(AgentIntent.GENERAL_CHAT);
    });

    test('Registry không còn worker off_topic', () => {
      const registry = buildDefaultWorkerRegistry();
      expect(registry.has('off_topic')).toBe(false);
      expect(registry.resolve('general')).toBeDefined();
    });

    test('Max-length guard dùng max_length worker mà không tạo OFF_TOPIC intent', async () => {
      const state = {
        userId: 'test',
        sessionId: 'test',
        input: 'a'.repeat(2001),
        summary: '',
        recentMessages: [],
        activeContext: '',
        intent: AgentIntent.GENERAL_CHAT,
        worker: 'general',
        textResponse: '',
        uiSignal: null,
        errors: [],
      };

      const result = await routerNode(state);
      expect(result.intent).toBe(AgentIntent.GENERAL_CHAT);
      expect(result.worker).toBe('max_length');
    });
  });
});
