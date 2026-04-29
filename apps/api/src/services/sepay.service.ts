import axios from 'axios';

const SEPAY_BASE_URL = 'https://my.sepay.vn/userapi';

export interface SepayTransaction {
  id: string;
  bank_brand_name: string;
  account_number: string;
  transaction_date: string;
  amount_out: string;
  amount_in: string;
  accumulated: string;
  transaction_content: string;
  reference_number: string | null;
  code: string | null;
  sub_account: string | null;
  bank_account_id: string;
}

export interface FetchTransactionsOptions {
  token: string;
  accountNumber?: string;
  transactionDateMin?: string; // yyyy-mm-dd
  transactionDateMax?: string; // yyyy-mm-dd
  sinceId?: string;
  limit?: number;
  referenceNumber?: string;
  amountIn?: number;
  amountOut?: number;
}

export interface FetchTransactionsResult {
  transactions: SepayTransaction[];
  /** Số dư tài khoản mới nhất (từ accumulated của giao dịch đầu tiên). null nếu không có GD hoặc ngân hàng ko hỗ trợ */
  latestBalance: number | null;
}

/**
 * Fetch danh sách giao dịch từ SePay API.
 * Hàm này là pure-function, không ghi gì xuống DB — caller tự quyết định.
 */
export async function fetchSepayTransactions(
  opts: FetchTransactionsOptions,
): Promise<FetchTransactionsResult> {
  const params: Record<string, string | number> = {
    limit: opts.limit ?? 5000,
  };

  if (opts.accountNumber) params.account_number = opts.accountNumber;
  if (opts.transactionDateMin) params.transaction_date_min = opts.transactionDateMin;
  if (opts.transactionDateMax) params.transaction_date_max = opts.transactionDateMax;
  if (opts.sinceId) params.since_id = opts.sinceId;
  if (opts.referenceNumber) params.reference_number = opts.referenceNumber;
  if (opts.amountIn !== undefined) params.amount_in = opts.amountIn;
  if (opts.amountOut !== undefined) params.amount_out = opts.amountOut;

  const response = await axios.get<{ transactions: SepayTransaction[] }>(
    `${SEPAY_BASE_URL}/transactions/list`,
    {
      headers: {
        Authorization: `Bearer ${opts.token}`,
        'Content-Type': 'application/json',
      },
      params,
      timeout: 15_000,
    },
  );

  const transactions: SepayTransaction[] = response.data?.transactions ?? [];

  // accumulated của item đầu tiên (mới nhất) là số dư thật, trừ khi = 0 thì NH ko hỗ trợ
  let latestBalance: number | null = null;
  if (transactions.length > 0) {
    const acc = parseFloat(transactions[0].accumulated || '0');
    latestBalance = acc > 0 ? acc : null;
  }

  return { transactions, latestBalance };
}

/** Format Date → yyyy-mm-dd cho SePay query param */
export function toSepayDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
