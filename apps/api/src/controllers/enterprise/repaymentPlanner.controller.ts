import { Request, Response } from 'express';
import { RepaymentPlannerService, RepaymentStrategy } from '../../services/enterprise/repaymentPlanner.service.js';

const plannerService = new RepaymentPlannerService();

export const calculateSimulation = async (req: Request, res: Response) => {
  try {
    const { budget, strategy, excludeDebtIds } = req.body;
    const organizationId = (req as any).organizationId;

    if (!budget || !strategy) {
      return res.status(400).json({ error: 'Ngân sách và chiến lược là bắt buộc' });
    }

    const result = await plannerService.calculateSimulation(
      organizationId,
      Number(budget),
      strategy as RepaymentStrategy,
      excludeDebtIds || [],
    );

    return res.json(result);
  } catch (error: any) {
    console.error('Planner Simulation Error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi tính toán kế hoạch' });
  }
};

export const commitPlan = async (req: Request, res: Response) => {
  try {
    const { name, budget, strategy, items } = req.body;
    const organizationId = (req as any).organizationId;
    const userId = (req as any).userId;

    if (!name || !budget || !strategy || !items) {
      return res.status(400).json({ error: 'Thông tin kế hoạch không đầy đủ' });
    }

    const plan = await plannerService.commitPlan(organizationId, userId, {
      name,
      budget: Number(budget),
      strategy: strategy as RepaymentStrategy,
      items,
    });

    return res.status(201).json(plan);
  } catch (error: any) {
    console.error('Planner Commit Error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi lưu kế hoạch' });
  }
};
