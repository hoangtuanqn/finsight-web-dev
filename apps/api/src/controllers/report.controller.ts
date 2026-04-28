import { Response } from 'express';
import reportService from '../services/report.service';
import { error } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export async function exportReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { format } = req.query;
    const userId = req.userId as string;

    if (format === 'excel') {
      const workbook = await reportService.generateExcel(userId);
      
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=FinSight_Report_${new Date().getTime()}.xlsx`
      );

      return workbook.xlsx.write(res).then(() => {
        res.status(200).end();
      });
    } 
    
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=FinSight_Report_${new Date().getTime()}.pdf`
      );
      
      await reportService.generatePDF(userId, res);
      return;
    }

    return error(res, 'Định dạng không hợp lệ. Chỉ hỗ trợ excel hoặc pdf.', 400);
  } catch (err) {
    console.error('exportReport error:', err);
    return error(res, 'Lỗi hệ thống khi tạo báo cáo', 500);
  }
}
