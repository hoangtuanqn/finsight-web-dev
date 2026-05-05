import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';
import { getMarketService } from '../config.js';
import { type AgentGraphState } from '../graph-state.js';
import { getChatModel } from '../llm-provider.js';
import { type AgentWorker, type WorkerOutput } from '../worker.interface.js';

// ─── Tool timeout helper ─────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

// ─── Tool: get_gold_price ────────────────────────────────────────────────────

const getGoldPriceTool = tool(
  async () => {
    try {
      const gold = await withTimeout(getMarketService().fetchGoldPrice(), 5000, {
        buy: 0,
        sell: 0,
        unit: 'VND/chỉ',
        source: 'SJC',
        updatedAt: new Date().toISOString(),
        error: 'timeout',
      });

      if ((gold as any).error) {
        return JSON.stringify({ error: 'Không thể lấy giá vàng lúc này. Vui lòng thử lại sau.' });
      }

      return JSON.stringify({
        buy: gold.buy ? `${gold.buy.toLocaleString('vi-VN')} ${gold.unit}` : 'N/A',
        sell: gold.sell ? `${gold.sell.toLocaleString('vi-VN')} ${gold.unit}` : 'N/A',
        source: gold.source,
        updatedAt: gold.updatedAt,
      });
    } catch (err: any) {
      console.error('[getGoldPriceTool] error:', err.message);
      return JSON.stringify({ error: 'Không thể lấy giá vàng lúc này. Vui lòng thử lại sau.' });
    }
  },
  {
    name: 'get_gold_price',
    description: 'Lấy giá vàng SJC mua/bán hiện tại. Sử dụng khi người dùng hỏi về giá vàng.',
    schema: z.object({}),
  },
);

// ─── Tool: get_fear_and_greed_index ─────────────────────────────────────────

const getFearAndGreedIndexTool = tool(
  async () => {
    try {
      const data = await withTimeout(getMarketService().fetchFearGreedIndex(), 5000, {
        value: 50,
        label: 'Neutral',
        labelVi: 'Trung lập',
        previousValue: 50,
        trend: 'STABLE',
        updatedAt: new Date().toISOString(),
        error: 'timeout',
      });

      if ((data as any).error && (data as any).error !== 'timeout') {
        return JSON.stringify({ error: 'Không thể lấy chỉ số tâm lý thị trường lúc này.' });
      }

      return JSON.stringify({
        value: data.value,
        label: data.label,
        labelVi: (data as any).labelVi || null,
        previousValue: (data as any).previousValue || null,
        trend: (data as any).trend || null,
        interpretation:
          data.value >= 75
            ? 'Thị trường đang tham lam quá mức — rủi ro điều chỉnh cao.'
            : data.value >= 55
              ? 'Tâm lý thị trường tích cực — nhà đầu tư đang tự tin.'
              : data.value >= 45
                ? 'Tâm lý trung lập — thị trường đang cân bằng.'
                : data.value >= 25
                  ? 'Tâm lý sợ hãi — nhà đầu tư thận trọng, có thể là cơ hội mua.'
                  : 'Tâm lý sợ hãi cực độ — biến động mạnh, cần thận trọng cao.',
      });
    } catch (err: any) {
      console.error('[getFearAndGreedIndexTool] error:', err.message);
      return JSON.stringify({ error: 'Không thể lấy chỉ số tâm lý thị trường lúc này.' });
    }
  },
  {
    name: 'get_fear_and_greed_index',
    description:
      'Lấy chỉ số Fear & Greed Index của thị trường crypto/tài sản. Luôn kèm 1 câu giải thích ngữ cảnh. ' +
      'Sử dụng khi người dùng hỏi về tâm lý thị trường, tham lam, sợ hãi.',
    schema: z.object({}),
  },
);

// ─── Tool: get_stock_index ────────────────────────────────────────────────────

const getStockIndexTool = tool(
  async () => {
    try {
      // Use crypto prices as proxy since no dedicated stock index API is wired
      const crypto = await withTimeout(getMarketService().fetchCryptoPrices(), 5000, {
        bitcoin: { price: 0, change24h: 0, error: 'timeout' },
        ethereum: { price: 0, change24h: 0, error: 'timeout' },
      });

      const btcError = (crypto.bitcoin as any).error;
      const ethError = (crypto.ethereum as any).error;

      return JSON.stringify({
        BTC: btcError
          ? 'N/A'
          : {
              price: `$${crypto.bitcoin.price.toLocaleString('en-US')}`,
              change24h: `${crypto.bitcoin.change24h?.toFixed(2) ?? 'N/A'}%`,
            },
        ETH: ethError
          ? 'N/A'
          : {
              price: `$${crypto.ethereum.price.toLocaleString('en-US')}`,
              change24h: `${crypto.ethereum.change24h?.toFixed(2) ?? 'N/A'}%`,
            },
        source: 'CoinGecko',
        note: 'Dữ liệu chỉ số chứng khoán VN-Index/HNX-Index chưa khả dụng trong phiên bản này.',
      });
    } catch (err: any) {
      console.error('[getStockIndexTool] error:', err.message);
      return JSON.stringify({ error: 'Không thể lấy dữ liệu thị trường lúc này.' });
    }
  },
  {
    name: 'get_stock_index',
    description:
      'Lấy giá các tài sản số (BTC, ETH) và thông tin biến động 24h. Sử dụng khi người dùng hỏi về chứng khoán, crypto, Bitcoin, Ethereum.',
    schema: z.object({}),
  },
);

// ─── Tool: get_market_prices (backward compat wrapper) ───────────────────────

const getMarketPricesWrapperTool = tool(
  async () => {
    try {
      const [crypto, gold] = await Promise.allSettled([
        withTimeout(getMarketService().fetchCryptoPrices(), 5000, {
          bitcoin: { price: 0, change24h: 0, error: 'timeout' },
          ethereum: { price: 0, change24h: 0, error: 'timeout' },
        }),
        withTimeout(getMarketService().fetchGoldPrice(), 5000, {
          buy: 0,
          sell: 0,
          unit: 'VND/chỉ',
          source: 'SJC',
          updatedAt: new Date().toISOString(),
          error: 'timeout',
        }),
      ]);

      const cryptoData = crypto.status === 'fulfilled' ? crypto.value : null;
      const goldData = gold.status === 'fulfilled' ? gold.value : null;

      return JSON.stringify({
        prices: {
          'BTC/USD':
            cryptoData && !('error' in cryptoData.bitcoin)
              ? `$${cryptoData.bitcoin.price.toLocaleString('en-US')}`
              : 'N/A',
          'BTC 24h':
            cryptoData && !('error' in cryptoData.bitcoin) ? `${cryptoData.bitcoin.change24h?.toFixed(2)}%` : 'N/A',
          'ETH/USD':
            cryptoData && !('error' in cryptoData.ethereum)
              ? `$${cryptoData.ethereum.price.toLocaleString('en-US')}`
              : 'N/A',
          'ETH 24h':
            cryptoData && !('error' in cryptoData.ethereum) ? `${cryptoData.ethereum.change24h?.toFixed(2)}%` : 'N/A',
          'Vàng SJC (mua)':
            goldData && !('error' in goldData) && goldData.buy
              ? `${goldData.buy.toLocaleString('vi-VN')} ${goldData.unit}`
              : 'N/A',
          'Vàng SJC (bán)':
            goldData && !('error' in goldData) && goldData.sell
              ? `${goldData.sell.toLocaleString('vi-VN')} ${goldData.unit}`
              : 'N/A',
        },
        source: 'CoinGecko, BTMC/SJC',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[getMarketPricesWrapperTool] error:', err.message);
      return JSON.stringify({ error: 'Không thể lấy giá thị trường lúc này.' });
    }
  },
  {
    name: 'get_market_prices',
    description:
      'Lấy tổng hợp giá vàng SJC, Bitcoin và Ethereum trong một lần gọi. Sử dụng cho câu hỏi tổng quan thị trường.',
    schema: z.object({}),
  },
);

// ─── Market tools set ─────────────────────────────────────────────────────────

const MARKET_TOOLS = [getGoldPriceTool, getFearAndGreedIndexTool, getStockIndexTool, getMarketPricesWrapperTool];

// ─── System prompt ────────────────────────────────────────────────────────────

const MARKET_OVERVIEW_SYSTEM = `Bạn là FinSight Market Analyst. Nhiệm vụ của bạn:
1. Phân tích câu hỏi và gọi các tool phù hợp:
   - Câu hỏi về vàng → "get_gold_price"
   - Câu hỏi về tâm lý/Fear & Greed → "get_fear_and_greed_index"
   - Câu hỏi về Bitcoin, Ethereum, crypto → "get_stock_index"
   - Câu hỏi tổng quan thị trường → gọi "get_market_prices" VÀ "get_fear_and_greed_index" song song
2. Trình bày kết quả súc tích bằng tiếng Việt, có số liệu cụ thể.
3. Với Fear & Greed, LUÔN thêm 1 câu giải thích ngữ cảnh về ý nghĩa của chỉ số.
4. Nếu có lỗi API, thông báo tự nhiên — KHÔNG lộ error code hay stack trace.
5. KHÔNG bịa số liệu; nếu tool trả "N/A" thì nói rõ dữ liệu chưa khả dụng.
6. Không gửi popup hay card UI — chỉ trả lời text.`;

// ─── Worker ───────────────────────────────────────────────────────────────────

export const marketWorker: AgentWorker = {
  id: 'market',

  async run(
    state: AgentGraphState,
    onToken: (token: string) => void,
    onToolStatus: (status: string | null) => void,
    isAborted?: (() => boolean) | null,
  ): Promise<WorkerOutput> {
    const llm = getChatModel({ streaming: true });

    const agent = createReactAgent({
      llm,
      tools: MARKET_TOOLS as any,
    });

    // Build context from memory
    const recentCtx = state.recentMessages
      .map((m) => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`)
      .join('\n');

    const contextBlock = state.summary ? `Tóm tắt ngữ cảnh trước: ${state.summary}\n\n${recentCtx}` : recentCtx;
    const userContent = contextBlock ? `${contextBlock}\n\nNgười dùng: ${state.input}` : state.input;

    const inputs = {
      messages: [new SystemMessage(MARKET_OVERVIEW_SYSTEM), new HumanMessage(userContent)],
    };

    let fullText = '';

    // Status label depends on intent
    const statusLabel =
      state.intent === 'MARKET_SPECIFIC'
        ? '📊 Đang tra cứu dữ liệu thị trường...'
        : '🌐 Đang tổng hợp thông tin thị trường...';

    onToolStatus(statusLabel);

    try {
      const stream = await agent.streamEvents(inputs, { version: 'v2' });

      for await (const event of stream) {
        if (isAborted?.()) break;

        if (event.event === 'on_chat_model_stream') {
          const chunk = event.data?.chunk?.content;
          if (chunk) {
            fullText += chunk;
            onToolStatus(null);
            onToken(chunk);
          }
        }
      }
    } catch (err: any) {
      console.error('[MarketWorker] stream error:', err.message);
    }

    onToolStatus(null);

    if (!fullText.trim()) {
      fullText =
        'Xin lỗi, tôi không thể lấy thông tin thị trường lúc này. Vui lòng thử lại sau hoặc kiểm tra nguồn dữ liệu trực tiếp.';
      onToken(fullText);
    }

    return { text: fullText, uiSignal: null };
  },
};
