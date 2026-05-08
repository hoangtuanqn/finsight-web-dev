import { describe, expect, test } from 'bun:test';
import { searchLocalKnowledge } from '../rag/retriever.js';

describe('RAG local keyword fallback', () => {
  test('retrieves the DTI definition for a short acronym question', () => {
    const results = searchLocalKnowledge('DTI là gì ?', 3);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('DTI');
    expect(results[0].chunk).toContain('DTI (Debt-to-Income Ratio) là tỷ lệ');
    expect(parseFloat(results[0].similarity)).toBeGreaterThanOrEqual(0.9);
  });

  test('does not over-match a Bitcoin history question from generic money terms', () => {
    const results = searchLocalKnowledge('Lịch sử hình thành của đồng tiền Bitcoin là gì?', 3);

    expect(results).toEqual([]);
  });
});
