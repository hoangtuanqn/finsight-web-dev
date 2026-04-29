import { Response } from 'express';
import prisma from '../lib/prisma';
import { success, error } from '../utils/apiResponse';
import { invalidateCache } from '../middleware/cache.middleware';
import { RISK_CONFIG } from '../constants/investmentConstants';
import { AuthenticatedRequest } from '../types';

export async function submitRiskAssessment(req: AuthenticatedRequest, res: Response) {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return error(res, 'Answers are required', 400);
    }

    const weights = RISK_CONFIG.questionWeights as Record<string, number>;
    let weightedSum = 0, totalWeight = 0;
    answers.forEach((a, i) => {
      const qId = a.id || `q${i + 1}`;
      const w = weights[qId] ?? 1.0;
      weightedSum += (a.score || 0) * w;
      totalWeight += w;
    });
    const avgScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : Math.round(answers.reduce((s: number, a: any) => s + (a.score || 0), 0) / answers.length);

    let riskLevel = 'LOW';
    let riskDescription = 'Bạn ưu tiên bảo toàn vốn. Phân bổ tập trung vào tiết kiệm và vàng.';
    if (avgScore >= RISK_CONFIG.thresholds.HIGH) {
      riskLevel = 'HIGH';
      riskDescription = 'Bạn sẵn sàng chấp nhận rủi ro cao để tối đa hóa lợi nhuận. Phân bổ nhiều vào chứng khoán và crypto.';
    } else if (avgScore >= RISK_CONFIG.thresholds.MEDIUM) {
      riskLevel = 'MEDIUM';
      riskDescription = 'Bạn chấp nhận rủi ro vừa phải. Phân bổ cân bằng giữa các kênh đầu tư.';
    }

    const scores = answers.map((a: any) => a.score || 0);
    const mean = scores.reduce((s: number, v: number) => s + v, 0) / scores.length;
    const stdDev = Math.sqrt(scores.reduce((s: number, v: number) => s + Math.pow(v - mean, 2), 0) / scores.length);
    const consistencyWarning = stdDev > 30
      ? 'Câu trả lời của bạn có độ phân tán cao — một số câu mâu thuẫn nhau. Kết quả đã được xử lý theo trọng số để phản ánh tốt hơn.'
      : null;

    await (prisma as any).investorProfile.upsert({
      where: { userId: req.userId },
      update: { riskScore: avgScore, riskLevel, lastUpdated: new Date() },
      create: { userId: req.userId, riskScore: avgScore, riskLevel },
    });
    invalidateCache([`investment:allocation:${req.userId}:*`]);

    return success(res, { riskScore: avgScore, riskLevel, riskDescription, consistencyWarning });
  } catch (err) {
    console.error('submitRiskAssessment error:', err);
    return error(res, 'Internal server error');
  }
}
