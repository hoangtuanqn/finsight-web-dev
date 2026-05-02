import { ASSET_ORDER } from '../constants/assetTickers.js';

export interface StressScenario {
  id: string;
  name: string;
  description: string;
  shocks: Record<string, number>; // Percentage change for each asset
}

export interface StressTestResult {
  scenarioId: string;
  scenarioName: string;
  description: string;
  portfolioLossPercent: number;
  portfolioLossAmount: number;
  remainingCapital: number;
}

export const STRESS_SCENARIOS: StressScenario[] = [
  {
    id: 'financial_crisis_2008',
    name: 'Khủng hoảng tài chính 2008',
    description:
      'Thị trường chứng khoán toàn cầu sụp đổ, thanh khoản cạn kiệt. Vàng và Trái phiếu đóng vai trò trú ẩn an toàn.',
    shocks: {
      savings: 0,
      gold: 0.15, // Vàng tăng nhẹ trong giai đoạn đầu
      stocks: -0.65, // VN-Index giảm cực mạnh năm 2008
      stocks_us: -0.5, // S&P 500 giảm ~50%
      bonds: 0.05, // Lãi suất trái phiếu giảm, giá tăng
      crypto: -0.8, // Proxy: Sụt giảm mạnh mẽ tương đương bong bóng dot-com
    },
  },
  {
    id: 'covid_19_crash',
    name: 'Cú sốc COVID-19 (Tháng 3/2020)',
    description: 'Bán tháo hoảng loạn trên mọi lớp tài sản do đại dịch, trước khi có gói kích thích kinh tế.',
    shocks: {
      savings: 0,
      gold: 0.05,
      stocks: -0.33,
      stocks_us: -0.3,
      bonds: 0.02,
      crypto: -0.5,
    },
  },
  {
    id: 'crypto_winter_2022',
    name: 'Mùa đông Crypto & Lạm phát 2022',
    description: 'Lãi suất tăng đột ngột làm xì hơi các tài sản rủi ro cao như Crypto và Cổ phiếu công nghệ.',
    shocks: {
      savings: 0,
      gold: -0.05,
      stocks: -0.32,
      stocks_us: -0.2,
      bonds: -0.1, // Trái phiếu giảm giá do lãi suất tăng
      crypto: -0.65,
    },
  },
];

export function runStressTests(weights: number[], capital: number): StressTestResult[] {
  return STRESS_SCENARIOS.map((scenario) => {
    let portfolioLossPercent = 0;

    // Tính toán thay đổi của danh mục dựa trên shock của từng tài sản
    ASSET_ORDER.forEach((asset, index) => {
      const weight = weights[index] || 0;
      const shock = scenario.shocks[asset] || 0;
      portfolioLossPercent += weight * shock;
    });

    const portfolioLossAmount = capital * Math.abs(portfolioLossPercent);
    const remainingCapital = capital * (1 + portfolioLossPercent);

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      description: scenario.description,
      portfolioLossPercent: Number(portfolioLossPercent.toFixed(4)),
      portfolioLossAmount: Number(portfolioLossAmount.toFixed(0)),
      remainingCapital: Number(remainingCapital.toFixed(0)),
    };
  });
}
