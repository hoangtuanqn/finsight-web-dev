import { describe, expect, test } from 'bun:test';
import {
  DebtConfirmationDataSchema,
  InvestmentConfirmationDataSchema,
  RepaymentConfirmationDataSchema,
  UiSignalSchema,
} from '../ui-signal.js';
import { simulateFinancialRiskSchema } from '../workers/simulation.worker.js';

describe('Task 5.1 - Unit tests for tool schemas', () => {
  describe('DebtConfirmationDataSchema', () => {
    test('allows nullable fields', () => {
      const data = {
        loanName: null,
        principalAmount: null,
        interestRateAPR: null,
        borrowDate: null,
        termMonths: null,
        rateType: null,
        balance: null,
        minPayment: null,
        dueDay: null,
        notes: null,
      };
      const result = DebtConfirmationDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('fails on invalid types', () => {
      const data = {
        loanName: 'Bank',
        principalAmount: '10000', // invalid type
      };
      const result = DebtConfirmationDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('RepaymentConfirmationDataSchema', () => {
    test('allows nullable fields', () => {
      const data = {
        extraBudget: null,
        targetDate: null,
        strategy: null,
      };
      const result = RepaymentConfirmationDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('fails on invalid types', () => {
      const data = {
        extraBudget: 'null', // invalid type
      };
      const result = RepaymentConfirmationDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('InvestmentConfirmationDataSchema', () => {
    test('allows nullable fields', () => {
      const data = {
        monthlyIncome: null,
        capital: null,
        riskLevel: null,
        strategyQuotaRemaining: null,
      };
      const result = InvestmentConfirmationDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('fails on invalid types', () => {
      const data = {
        monthlyIncome: 100,
        riskLevel: 2, // invalid type, should be string
      };
      const result = InvestmentConfirmationDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('simulateFinancialRiskSchema', () => {
    test('allows nullable fields', () => {
      const data = {
        userId: 'user123',
        additionalDebt: null,
        additionalMonthlyPayment: null,
        incomeShockPercent: null,
        oneTimeExpense: null,
      };
      const result = simulateFinancialRiskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('fails on invalid types', () => {
      const data = {
        userId: 123, // invalid type
      };
      const result = simulateFinancialRiskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('UiSignalSchema', () => {
    test('fails if type is missing', () => {
      const data = {
        action: 'DEBT_CONFIRMATION',
        data: {
          loanName: 'Test',
        },
      };
      const result = UiSignalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('passes with valid SHOW_POPUP signal and nullable data', () => {
      const data = {
        type: 'SHOW_POPUP',
        action: 'DEBT_CONFIRMATION',
        data: null, // nullable data
      };
      const result = UiSignalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
