import { DebtScheduleInput, generateSchedule } from '../../../packages/financial-core/src/debt-engine.ts';

const input: DebtScheduleInput = {
  principal: 120000000, // 120M
  issueDate: new Date('2026-01-01'),
  termMonths: 12,
  interestMethod: 'EMI',
  interestRates: [
    { rate: 10, effectiveDate: new Date('2026-01-01') },
    { rate: 12, effectiveDate: new Date('2026-06-01') }, // Floating rate increase
  ],
};

console.log('--- EMI with Floating Rate ---');
const schedule = generateSchedule(input);
schedule.forEach((p) => {
  console.log(
    `Period ${p.period} (${p.dueDate.toISOString().split('T')[0]}): Total: ${p.totalAmount.toLocaleString()} | Interest: ${p.interestAmount.toLocaleString()} | Principal: ${p.principalAmount.toLocaleString()} | Remaining: ${p.remainingPrincipal.toLocaleString()}`,
  );
});

const inputRB: DebtScheduleInput = {
  principal: 120000000,
  issueDate: new Date('2026-01-01'),
  termMonths: 12,
  interestMethod: 'REDUCING_BALANCE',
  interestRates: [{ rate: 10, effectiveDate: new Date('2026-01-01') }],
};

console.log('\n--- Reducing Balance ---');
const scheduleRB = generateSchedule(inputRB);
scheduleRB.forEach((p) => {
  console.log(
    `Period ${p.period}: Total: ${p.totalAmount.toLocaleString()} | Interest: ${p.interestAmount.toLocaleString()} | Principal: ${p.principalAmount.toLocaleString()} | Remaining: ${p.remainingPrincipal.toLocaleString()}`,
  );
});
