import { z } from 'zod';

// ─── Signal type enum ───────────────────────────────────────────────
export const UiSignalType = {
  SHOW_POPUP: 'SHOW_POPUP',
  SHOW_INTERACTIVE_CARD: 'SHOW_INTERACTIVE_CARD',
  REDIRECT: 'REDIRECT',
  NONE: 'NONE',
} as const;
export type UiSignalType = (typeof UiSignalType)[keyof typeof UiSignalType];

// ─── Action enum ────────────────────────────────────────────────────
export const UiSignalAction = {
  DEBT_CONFIRMATION: 'DEBT_CONFIRMATION',
  REPAYMENT_CONFIRMATION: 'REPAYMENT_CONFIRMATION',
  INVESTMENT_CONFIRMATION: 'INVESTMENT_CONFIRMATION',
  DEBT_SUMMARY_ACTIONS: 'DEBT_SUMMARY_ACTIONS',
} as const;
export type UiSignalAction = (typeof UiSignalAction)[keyof typeof UiSignalAction];

// ─── Popup data schemas (all fields nullable) ───────────────────────

export const DebtConfirmationDataSchema = z.object({
  loanName: z.string().nullable().optional(),
  principalAmount: z.number().nullable().optional(),
  interestRateAPR: z.number().nullable().optional(),
  borrowDate: z.string().nullable().optional(),
  termMonths: z.number().nullable().optional(),
  rateType: z.enum(['FLAT', 'REDUCING']).nullable().optional(),
  balance: z.number().nullable().optional(),
  minPayment: z.number().nullable().optional(),
  dueDay: z.number().nullable().optional(),
  feeProcessing: z.number().nullable().optional(),
  feeInsurance: z.number().nullable().optional(),
  feeManagement: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type DebtConfirmationData = z.infer<typeof DebtConfirmationDataSchema>;

export const RepaymentConfirmationDataSchema = z.object({
  extraBudget: z.number().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  strategy: z.enum(['AVALANCHE', 'SNOWBALL', 'CUSTOM']).nullable().optional(),
});
export type RepaymentConfirmationData = z.infer<typeof RepaymentConfirmationDataSchema>;

export const InvestmentConfirmationDataSchema = z.object({
  monthlyIncome: z.number().nullable().optional(),
  capital: z.number().nullable().optional(),
  riskLevel: z.string().nullable().optional(),
  strategyQuotaRemaining: z.number().nullable().optional(),
});
export type InvestmentConfirmationData = z.infer<typeof InvestmentConfirmationDataSchema>;

// ─── Interactive card button schema ─────────────────────────────────

export const CardButtonSchema = z.object({
  label: z.string(),
  targetRoute: z.string(),
});
export type CardButton = z.infer<typeof CardButtonSchema>;

// ─── Discriminated union: one schema per signal type ────────────────

export const ShowPopupSignalSchema = z.discriminatedUnion('action', [
  z.object({
    type: z.literal(UiSignalType.SHOW_POPUP),
    action: z.literal(UiSignalAction.DEBT_CONFIRMATION),
    data: DebtConfirmationDataSchema.nullable().optional(),
  }),
  z.object({
    type: z.literal(UiSignalType.SHOW_POPUP),
    action: z.literal(UiSignalAction.REPAYMENT_CONFIRMATION),
    data: RepaymentConfirmationDataSchema.nullable().optional(),
  }),
  z.object({
    type: z.literal(UiSignalType.SHOW_POPUP),
    action: z.literal(UiSignalAction.INVESTMENT_CONFIRMATION),
    data: InvestmentConfirmationDataSchema.nullable().optional(),
  }),
]);

export const ShowInteractiveCardSignalSchema = z.object({
  type: z.literal(UiSignalType.SHOW_INTERACTIVE_CARD),
  action: z.literal(UiSignalAction.DEBT_SUMMARY_ACTIONS),
  buttons: z.array(CardButtonSchema).min(1),
});

export const RedirectSignalSchema = z.object({
  type: z.literal(UiSignalType.REDIRECT),
  targetRoute: z.string(),
  message: z.string().nullable().optional(),
});

export const NoneSignalSchema = z.object({
  type: z.literal(UiSignalType.NONE),
});

// ─── Main UiSignal schema (discriminated union on `type`) ───────────

export const UiSignalSchema = z.discriminatedUnion('type', [
  ShowPopupSignalSchema,
  ShowInteractiveCardSignalSchema,
  RedirectSignalSchema,
  NoneSignalSchema,
]);

export type UiSignal = z.infer<typeof UiSignalSchema>;

// ─── Convenience: validate and narrow ───────────────────────────────

export function parseUiSignal(raw: unknown): UiSignal {
  return UiSignalSchema.parse(raw);
}

export function safeParseUiSignal(raw: unknown) {
  return UiSignalSchema.safeParse(raw);
}
