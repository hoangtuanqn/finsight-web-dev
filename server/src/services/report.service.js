import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import prisma from '../lib/prisma.js';
import path from 'path';
import { 
  calcEAR, 
  calcDebtToIncomeRatio, 
  detectDominoRisk, 
  formatVND, 
  simulateRepayment 
} from '../utils/calculations.js';

const LOGO_PATH = path.resolve(process.cwd(), 'LOGO.png');
const FONT_REGULAR = '/System/Library/Fonts/Supplemental/Arial.ttf';
const FONT_BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf';

class ReportService {
  async getReportData(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        debts: { where: { status: 'ACTIVE' } },
        investorProfile: true,
      },
    });

    if (!user) throw new Error('User not found');

    const debts = user.debts;
    const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
    const dtiRatio = calcDebtToIncomeRatio(totalMinPayment, user.monthlyIncome);
    const dominoAlerts = detectDominoRisk(debts, user.monthlyIncome);
    
    const detailedDebts = debts.map(d => ({
      ...d,
      ear: calcEAR(d.apr, d.feeProcessing || 0, d.feeInsurance || 0, d.feeManagement || 0, d.termMonths || 12)
    }));

    const simulation = simulateRepayment(debts, user.monthlyIncome * 0.1, 'AVALANCHE');

    return {
      user: {
        fullName: user.fullName,
        email: user.email,
        monthlyIncome: user.monthlyIncome,
      },
      summary: {
        totalBalance,
        totalMinPayment,
        dtiRatio,
        dominoAlerts,
      },
      debts: detailedDebts,
      simulation,
      generatedAt: new Date().toLocaleDateString('vi-VN'),
    };
  }

  async generateExcel(userId) {
    const data = await this.getReportData(userId);
    const workbook = new ExcelJS.Workbook();
    const summarySheet = workbook.addWorksheet('Tổng quan');
    summarySheet.columns = [
      { header: 'Hạng mục', key: 'label', width: 25 },
      { header: 'Giá trị', key: 'value', width: 35 },
    ];
    summarySheet.addRows([
      { label: 'Người sở hữu', value: data.user.fullName },
      { label: 'Ngày xuất báo cáo', value: data.generatedAt },
      { label: 'Thu nhập hàng tháng', value: formatVND(data.user.monthlyIncome) },
      { label: 'Tổng dư nợ hiện tại', value: formatVND(data.summary.totalBalance) },
      { label: 'Tổng trả tối thiểu', value: formatVND(data.summary.totalMinPayment) },
      { label: 'Tỷ lệ DTI (%)', value: `${data.summary.dtiRatio.toFixed(2)}%` },
    ]);
    summarySheet.getRow(1).font = { bold: true };
    return workbook;
  }

  async generatePDF(userId, res) {
    const data = await this.getReportData(userId);
    const doc = new PDFDocument({ 
      margin: 50, 
      size: 'A4',
      bufferPages: true 
    });

    doc.registerFont('Main', FONT_REGULAR);
    doc.registerFont('MainBold', FONT_BOLD);
    doc.font('Main');

    doc.pipe(res);

    // --- 1. HEADER (Logo + Company Name + Metadata) ---
    const headerTop = 50;
    try {
      doc.image(LOGO_PATH, 50, headerTop - 5, { width: 45 });
    } catch (e) {
      console.error('Logo Error:', e.message);
    }
    
    doc.fillColor('#1e40af').font('MainBold').fontSize(22).text('FINSIGHT', 105, headerTop, { align: 'left' });
    doc.fillColor('#64748b').fontSize(10).font('Main').text('Advisor Tài chính Cá nhân Thông minh', 105, headerTop + 24, { align: 'left' });
    
    // Metadata (Explicitly Right Aligned)
    doc.fillColor('#475569').fontSize(9);
    doc.text(`Mã báo cáo: #FS-${Date.now().toString().slice(-6)}`, 350, headerTop, { width: 200, align: 'right' });
    doc.text(`Ngày lập: ${data.generatedAt}`, 350, headerTop + 14, { width: 200, align: 'right' });
    doc.text(`Người sở hữu: ${data.user.fullName}`, 350, headerTop + 28, { width: 200, align: 'right' });

    doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#e2e8f0').lineWidth(1).stroke();
    
    // --- 2. EXECUTIVE SUMMARY ---
    let currentY = 135;
    doc.fillColor('#0f172a').font('MainBold').fontSize(16).text('1. TỔNG QUAN SỨC KHỎE TÀI CHÍNH', 50, currentY, { align: 'left' });
    currentY += 25;

    // Health Score Box
    const dti = data.summary.dtiRatio;
    const healthStatus = dti > 50 ? 'KHỦNG HOẢNG' : dti > 35 ? 'CẢNH BÁO' : dti > 20 ? 'CẦN CHÚ Ý' : 'AN TOÀN';
    const healthColor = dti > 50 ? '#ef4444' : dti > 35 ? '#f97316' : dti > 20 ? '#eab308' : '#10b981';

    doc.rect(50, currentY, 495, 70).fill('#f8fafc').strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    
    const boxContentY = currentY + 15;
    doc.fillColor('#64748b').fontSize(8).font('Main').text('TỔNG DƯ NỢ', 75, boxContentY, { align: 'left' });
    doc.fillColor('#0f172a').fontSize(14).font('MainBold').text(formatVND(data.summary.totalBalance), 75, boxContentY + 14, { align: 'left' });
    
    doc.fillColor('#64748b').fontSize(8).font('Main').text('TỶ LỆ DTI', 225, boxContentY, { align: 'left' });
    doc.fillColor('#0f172a').fontSize(14).font('MainBold').text(`${dti.toFixed(1)}%`, 225, boxContentY + 14, { align: 'left' });
    
    doc.fillColor('#64748b').fontSize(8).font('Main').text('TRẠNG THÁI', 375, boxContentY, { align: 'left' });
    doc.fillColor(healthColor).fontSize(14).font('MainBold').text(healthStatus, 375, boxContentY + 14, { align: 'left' });

    currentY += 95;

    // --- 3. DETAILED ANALYSIS ---
    doc.fillColor('#0f172a').font('MainBold').fontSize(14).text('2. PHÂN TÍCH CHI TIẾT', 50, currentY, { align: 'left' });
    currentY += 22;

    doc.fillColor('#334155').fontSize(10).font('Main').text(`Hiện tại bạn đang có `, 50, currentY, { continued: true, align: 'left' });
    doc.font('MainBold').text(`${data.debts.length} khoản nợ `, { continued: true });
    doc.font('Main').text(`đang hoạt động. Tổng số tiền phải trả tối thiểu hàng tháng là `, { continued: true });
    doc.font('MainBold').text(`${formatVND(data.summary.totalMinPayment)}`, { continued: true });
    doc.font('Main').text(`, chiếm khoảng `);
    doc.font('MainBold').text(`${dti.toFixed(1)}% tổng thu nhập hàng tháng của bạn.`);

    currentY = doc.y + 15;

    // Domino Alert
    if (data.summary.dominoAlerts.length > 0) {
      doc.rect(50, currentY, 495, 20 + (data.summary.dominoAlerts.length * 15)).fill('#fff1f2');
      doc.fillColor('#991b1b').font('MainBold').fontSize(9).text('🚨 CẢNH BÁO RỦI RO:', 65, currentY + 8, { align: 'left' });
      data.summary.dominoAlerts.forEach((a, idx) => {
        doc.fillColor('#b91c1c').font('Main').fontSize(9).text(`• ${a.message}`, 75, currentY + 22 + (idx * 14), { align: 'left' });
      });
      currentY = doc.y + 25;
    } else {
      currentY += 10;
    }

    // --- 4. DEBT TABLE ---
    doc.fillColor('#0f172a').font('MainBold').fontSize(14).text('3. DANH SÁCH CÁC KHOẢN NỢ', 50, currentY, { align: 'left' });
    currentY += 22;

    // Table Header
    doc.rect(50, currentY, 495, 22).fill('#1e40af');
    doc.fillColor('#ffffff').font('MainBold').fontSize(9);
    doc.text('Tên khoản nợ', 65, currentY + 7, { width: 160, align: 'left' });
    doc.text('Lãi suất EAR', 230, currentY + 7, { width: 80, align: 'left' });
    doc.text('Dư nợ hiện tại', 320, currentY + 7, { width: 100, align: 'left' });
    doc.text('Trả tối thiểu', 430, currentY + 7, { width: 100, align: 'left' });

    currentY += 22;
    doc.font('Main').fontSize(9);

    data.debts.forEach((d, i) => {
      if (i % 2 === 0) doc.rect(50, currentY, 495, 20).fill('#f1f5f9');
      doc.fillColor('#334155');
      doc.text(d.name, 65, currentY + 6, { width: 160, align: 'left' });
      doc.text(`${d.ear.toFixed(2)}%`, 230, currentY + 6, { width: 80, align: 'left' });
      doc.text(formatVND(d.balance), 320, currentY + 6, { width: 100, align: 'left' });
      doc.text(formatVND(d.minPayment), 430, currentY + 6, { width: 100, align: 'left' });
      currentY += 20;
    });

    currentY += 30;

    // --- 5. AI ADVISORY ---
    doc.fillColor('#0f172a').font('MainBold').fontSize(14).text('4. KIẾN NGHỊ TỪ TRỢ LÝ AI (FINSIGHT ADVISOR)', 50, currentY, { align: 'left' });
    currentY += 22;
    
    doc.rect(50, currentY, 495, 85).fill('#f0f9ff').strokeColor('#bae6fd').lineWidth(0.5).stroke();
    
    const advContentY = currentY + 12;
    doc.fillColor('#0369a1').font('MainBold').fontSize(10).text('Chiến lược tối ưu:', 70, advContentY, { align: 'left' });
    doc.fillColor('#0c4a6e').font('Main').fontSize(10).text(`Hệ thống khuyến nghị bạn sử dụng phương pháp Avalanche (Ưu tiên trả nợ lãi cao trước).`, 70, advContentY + 16, { align: 'left' });
    
    doc.text(`Dành thêm 10% thu nhập (${formatVND(data.user.monthlyIncome * 0.1)}) giúp bạn:`, 70, advContentY + 36, { align: 'left' });
    doc.text(`- Rút ngắn thời gian trả nợ xuống còn `, 80, advContentY + 52, { continued: true, align: 'left' });
    doc.font('MainBold').text(`${data.simulation.months} tháng`, { continued: true });
    doc.font('Main').text(`.`);

    // --- FOOTER ---
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fillColor('#94a3b8').fontSize(7).text(
        `Trang ${i + 1} / ${pages.count} — Báo cáo bảo mật cấp bởi FinSight Advisor AI.`,
        50, 790, { align: 'center', width: 495 }
      );
    }

    doc.end();
  }
}

export default new ReportService();
