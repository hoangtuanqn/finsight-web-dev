import { Request, Response } from 'express';
import { AnalyticsService } from '../../services/enterprise/analytics.service.js';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getSummary(req: Request, res: Response) {
    try {
      const organizationId = (req as any).organizationId;
      const summary = await analyticsService.getSummary(organizationId);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getAgingReport(req: Request, res: Response) {
    try {
      const organizationId = (req as any).organizationId;
      const { type } = req.query;
      const report = await analyticsService.getAgingReport(organizationId, (type as any) || 'RECEIVABLE');
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getCashFlow(req: Request, res: Response) {
    try {
      const organizationId = (req as any).organizationId;
      const projection = await analyticsService.getCashFlowProjection(organizationId);
      res.json(projection);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getActionItems(req: Request, res: Response) {
    try {
      const organizationId = (req as any).organizationId;
      const items = await analyticsService.getActionItems(organizationId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
