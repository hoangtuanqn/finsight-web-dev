import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import prisma from '../lib/prisma';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import {
  calcEAR,
  calcDebtToIncomeRatio,
  detectDominoRisk,
  formatVND,
  simulateRepayment
} from '../utils/calculations';

const LOGO_URL = 'https://i.ibb.co/84xLmWTK/LOGO.png';
const LOGO_PATH = path.resolve(process.cwd(), '..', 'LOGO.png');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FONT_REGULAR = path.join(__dirname, '..', 'assets', 'fonts', 'Arial.ttf');
const FONT_BOLD = path.join(__dirname, '..', 'assets', 'fonts', 'ArialBold.ttf');

class ReportService {
  async getReportData(userId: string) {
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      include: {
        debts: { where: { status: 'ACTIVE' } },
        investorProfile: true,
      },
    });

    if (!user) throw new Error('User not found');

    const debts = user.debts;
    const totalBalance = debts.reduce((sum: number, d: any) => sum + d.balance, 0);
    const totalMinPayment = debts.reduce((sum: number, d: any) => sum + d.minPayment, 0);
    const dtiRatio = calcDebtToIncomeRatio(totalMinPayment, user.monthlyIncome);
    const dominoAlerts = detectDominoRisk(debts, user.monthlyIncome);

    const detailedDebts = debts.map((d: any) => ({
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
      reportId: `FS-${Date.now().toString().slice(-6)}`,
      generatedAt: new Date().toLocaleDateString('vi-VN'),
    };
  }

  async generateExcel(userId: string) {
    const data = await this.getReportData(userId);
    const workbook = new ExcelJS.Workbook();
    
    const sheet = workbook.addWorksheet('Báo cáo phân tích tài chính');
    
    sheet.mergeCells('A1:E1');
    const brandCell = sheet.getCell('A1');
    brandCell.value = 'FINSIGHT - BÁO CÁO PHÂN TÍCH TÀI CHÍNH';
    brandCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    brandCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    brandCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 40;

    sheet.addRows([
      [], 
      ['THÔNG TIN CHUNG', '', '', '', ''],
      ['Mã báo cáo', data.reportId],
      ['Ngày lập', data.generatedAt],
      ['Khách hàng', data.user.fullName.toUpperCase()],
      [],
      ['CHỈ SỐ SỨC KHỎE TÀI CHÍNH', '', '', '', ''],
      ['Thu nhập hàng tháng', data.user.monthlyIncome],
      ['Tổng dư nợ hiện tại', data.summary.totalBalance],
      ['Tổng trả tối thiểu', data.summary.totalMinPayment],
      ['Tỷ lệ DTI (%)', `${data.summary.dtiRatio.toFixed(2)}%`],
      ['Trạng thái', data.summary.dtiRatio > 50 ? 'KHỦNG HOẢNG' : (data.summary.dtiRatio > 30 ? 'CẢNH BÁO' : 'AN TOÀN')],
      [] 
    ]);

    sheet.getColumn('A').width = 35;
    sheet.getColumn('B').width = 25;
    sheet.getColumn('C').width = 15;
    sheet.getColumn('D').width = 15;
    sheet.getColumn('E').width = 15;

    for (let i = 3; i <= 13; i++) {
      const row = sheet.getRow(i);
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
      row.height = 22; 
    }

    [8, 9, 10].forEach(rowIdx => {
      sheet.getRow(rowIdx).getCell(2).numFmt = '#,##0 "₫"';
    });

    const sectionHeaders = [
      { row: 2, text: 'THÔNG TIN CHUNG' },
      { row: 7, text: 'CHỈ SỐ SỨC KHỎE TÀI CHÍNH' },
      { row: 15, text: 'DANH SÁCH CHI TIẾT CÁC KHOẢN NỢ' }
    ];

    sectionHeaders.forEach(sh => {
      sheet.mergeCells(`A${sh.row}:E${sh.row}`);
      const cell = sheet.getCell(`A${sh.row}`);
      cell.value = sh.text;
      cell.font = { bold: true, size: 12 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { vertical: 'middle' };
      sheet.getRow(sh.row).height = 25;
    });

    const debtStartRow = 15;
    const tableHeaderRow = debtStartRow + 1;
    sheet.getRow(tableHeaderRow).values = ['Tên khoản nợ', 'Nền tảng', 'Lãi suất EAR (%)', 'Dư nợ hiện tại', 'Trả tối thiểu'];
    const headerRow = sheet.getRow(tableHeaderRow);
    headerRow.height = 30;
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    data.debts.forEach((d: any, idx: number) => {
      const rowIdx = tableHeaderRow + 1 + idx;
      sheet.getRow(rowIdx).values = [
        d.name,
        d.platform,
        `${d.ear.toFixed(2)}%`,
        d.balance,
        d.minPayment
      ];
      
      const row = sheet.getRow(rowIdx);
      row.height = 25; 
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      
      row.getCell(4).numFmt = '#,##0 "₫"';
      row.getCell(5).numFmt = '#,##0 "₫"';

      row.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    return workbook;
  }

  async generatePDF(userId: string, res: any) {
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

    const headerY = 45;
    try {
      const response = await axios.get(LOGO_URL, { responseType: 'arraybuffer' });
      const logoBuffer = Buffer.from(response.data);
      doc.image(logoBuffer, 50, headerY, { height: 55 });
    } catch (e: any) {
      console.warn('URL Logo Error, trying local:', e.message);
      try {
        doc.image(LOGO_PATH, 50, headerY, { height: 55 });
      } catch (localErr: any) {
        console.error('Local Logo Error:', localErr.message);
        doc.fontSize(18).font('MainBold').fillColor('#1e40af').text('FINSIGHT', 50, headerY + 15);
      }
    }

    const infoX = 220;
    doc.fillColor('#1e40af').font('MainBold').fontSize(13).text('CÔNG TY TNHH FINSIGHT', infoX, headerY, { align: 'right', width: 325 });
    doc.fillColor('#475569').font('Main').fontSize(9);
    doc.text('Dự án trực thuộc: Đại học FPT (FPTU) & FPT Aptech', infoX, headerY + 18, { align: 'right', width: 325, lineGap: 2 });
    doc.text('Dự án: Cuộc thi Webdev Adventure 2026', infoX, headerY + 32, { align: 'right', width: 325 });
    doc.text('Email: support@finsight.vn', infoX, headerY + 46, { align: 'right', width: 325 });

    doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#cbd5e1').lineWidth(0.8).stroke();

    let currentY = 135;
    doc.fillColor('#0f172a').font('MainBold').fontSize(22).text('BÁO CÁO PHÂN TÍCH TÀI CHÍNH', 50, currentY, { align: 'center', width: 495 });

    currentY += 35;
    doc.fillColor('#64748b').font('Main').fontSize(10);
    doc.text(`Mã số: ${data.reportId}  |  Ngày lập: ${data.generatedAt}`, 50, currentY, { align: 'center', width: 495, lineGap: 5 });

    doc.fontSize(11).fillColor('#334155');
    const labelStr = 'Khách hàng: ';
    const nameStr = data.user.fullName.toUpperCase();
    const totalW = doc.widthOfString(labelStr) + doc.widthOfString(nameStr);
    const centerStartX = 50 + (495 - totalW) / 2;

    doc.font('Main').text(labelStr, centerStartX, doc.y);
    doc.font('MainBold').text(nameStr, centerStartX + doc.widthOfString(labelStr), doc.y - 12); 

    currentY = doc.y + 25;
    doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor('#cbd5e1').lineWidth(0.8).stroke();

    currentY += 30;
    doc.fillColor('#0f172a').font('MainBold').fontSize(16).text('1. TỔNG QUAN SỨC KHỎE TÀI CHÍNH', 50, currentY);
    currentY += 35;

    const dti = data.summary.dtiRatio;
    const healthStatus = dti > 50 ? 'KHỦNG HOẢNG' : dti > 35 ? 'CẢNH BÁO' : dti > 20 ? 'CẦN CHÚ Ý' : 'AN TOÀN';
    const healthColor = dti > 50 ? '#ef4444' : dti > 35 ? '#f97316' : dti > 20 ? '#eab308' : '#10b981';

    doc.rect(50, currentY, 495, 80).fill('#f8fafc').strokeColor('#e2e8f0').lineWidth(0.5).stroke();

    const boxY = currentY + 20;
    doc.fillColor('#64748b').fontSize(8.5).font('Main').text('TỔNG DƯ NỢ', 80, boxY);
    doc.fillColor('#0f172a').fontSize(15).font('MainBold').text(formatVND(data.summary.totalBalance), 80, boxY + 18);

    doc.fillColor('#64748b').fontSize(8.5).font('Main').text('TỶ LỆ DTI', 230, boxY);
    doc.fillColor('#0f172a').fontSize(15).font('MainBold').text(`${dti.toFixed(1)}%`, 230, boxY + 18);

    doc.fillColor('#64748b').fontSize(8.5).font('Main').text('TRẠNG THÁI', 380, boxY);
    doc.fillColor(healthColor).fontSize(15).font('MainBold').text(healthStatus, 380, boxY + 18);

    doc.y = currentY + 80 + 35; 

    if (doc.y > 750) doc.addPage();
    doc.fillColor('#0f172a').font('MainBold').fontSize(15).text('2. PHÂN TÍCH CHI TIẾT', 50, doc.y);
    doc.y += 20; 

    doc.fillColor('#334155').fontSize(10.5).font('Main').text(`Dựa trên dữ liệu tài chính của bạn, hệ thống ghi nhận bạn đang có `, 50, doc.y, { continued: true, align: 'justify', width: 495, lineGap: 6 });
    doc.font('MainBold').text(`${data.debts.length} khoản nợ `, { continued: true });
    doc.font('Main').text(`đang hoạt động. Với mức thu nhập hàng tháng là `, { continued: true });
    doc.font('MainBold').text(`${formatVND(data.user.monthlyIncome)}`, { continued: true });
    doc.font('Main').text(`, việc dành ra khoản thanh toán `, { continued: true });
    doc.font('MainBold').text(`${formatVND(data.summary.totalMinPayment)} `, { continued: true });
    doc.font('Main').text(`mỗi tháng đang đẩy tỷ lệ nợ trên thu nhập (DTI) của bạn lên mức `, { continued: true });
    doc.font('MainBold').text(`${dti.toFixed(1)}%`, { continued: true });
    doc.font('Main').text(`.`);

    doc.moveDown(0.8);
    doc.fillColor('#475569').fontSize(10.5).font('Main').text(`Theo tiêu chuẩn quản lý tài chính bền vững, tỷ lệ DTI lý tưởng nên được duy trì dưới mức 30%. Khi DTI vượt quá ngưỡng này, khả năng thanh khoản của bạn bị đe dọa, đồng thời hạn chế các cơ hội đầu tư và tích lũy trong tương lai.`, { align: 'justify', width: 495, lineGap: 6 });

    doc.moveDown(1.2);

    if (data.summary.dominoAlerts.length > 0) {
      if (doc.y > 680) doc.addPage(); 
      const alertY = doc.y;
      const alertBoxHeight = 40 + (data.summary.dominoAlerts.length * 22);
      doc.rect(50, alertY, 495, alertBoxHeight).fill('#fff1f2').strokeColor('#fecaca').lineWidth(0.5).stroke();
      doc.fillColor('#991b1b').font('MainBold').fontSize(11).text('! CẢNH BÁO RỦI RO:', 75, alertY + 15);
      data.summary.dominoAlerts.forEach((a: any, idx: number) => {
        doc.fillColor('#b91c1c').font('Main').fontSize(10).text(`• ${a.message}`, 85, alertY + 38 + (idx * 20), { width: 440, lineGap: 4 });
      });
      doc.y = alertY + alertBoxHeight + 45; 
    } else {
      doc.y += 45; 
    }

    const drawTableHeader = (y: number) => {
      doc.rect(50, y, 495, 28).fill('#1e40af');
      doc.fillColor('#ffffff').font('MainBold').fontSize(10);
      doc.text('Tên khoản nợ', 65, y + 10, { width: 160 });
      doc.text('Lãi suất EAR', 230, y + 10, { width: 80 });
      doc.text('Dư nợ hiện tại', 320, y + 10, { width: 100 });
      doc.text('Trả tối thiểu', 430, y + 10, { width: 100 });
      return y + 28;
    };

    if (doc.y > 680) doc.addPage(); 
    doc.fillColor('#0f172a').font('MainBold').fontSize(15).text('3. DANH SÁCH CÁC KHOẢN NỢ', 50, doc.y);
    doc.moveDown(1);

    let tableRowY = drawTableHeader(doc.y);
    doc.font('Main').fontSize(10);

    data.debts.forEach((d: any, i: number) => {
      if (tableRowY > 750) {
        doc.addPage();
        tableRowY = drawTableHeader(50);
        doc.font('Main').fontSize(10);
      }

      if (i % 2 === 0) doc.rect(50, tableRowY, 495, 25).fill('#f8fafc');
      doc.fillColor('#334155');
      doc.text(d.name, 65, tableRowY + 8, { width: 160 });
      doc.text(`${d.ear.toFixed(2)}%`, 230, tableRowY + 8, { width: 80 });
      doc.text(formatVND(d.balance), 320, tableRowY + 8, { width: 100 });
      doc.text(formatVND(d.minPayment), 430, tableRowY + 8, { width: 100 });
      tableRowY += 25;
    });

    if (tableRowY > 720) {
      doc.addPage();
    } else {
      doc.y = tableRowY + 45;
    }

    if (doc.y > 600) doc.addPage();
    doc.fillColor('#0f172a').font('MainBold').fontSize(15).text('4. KIẾN NGHỊ CHIẾN LƯỢC TỪ FINSIGHT', 50, doc.y);
    doc.moveDown(1.2);

    doc.fillColor('#1e40af').font('MainBold').fontSize(11).text('4.1 Chiến lược ưu tiên: Phương pháp Avalanche (Lãi suất cao nhất)', 50, doc.y);
    doc.fillColor('#334155').font('Main').fontSize(10).text(
      `Dựa trên cơ cấu nợ của bạn, FinSight đề xuất tập trung thanh toán các khoản có lãi suất EAR cao nhất trước. Phương pháp này giúp bạn giảm tối đa tổng tiền lãi phải trả cho ngân hàng, từ đó rút ngắn thời gian nợ nần hiệu quả nhất về mặt toán học.`,
      50, doc.y + 18, { width: 495, lineGap: 4, align: 'justify' }
    );

    doc.moveDown(1.2);

    doc.fillColor('#1e40af').font('MainBold').fontSize(11).text('4.2 Quy tắc phân bổ ngân sách 50/30/20', 50, doc.y);
    doc.fillColor('#334155').font('Main').fontSize(10).text(
      `Để kiểm soát tài chính bền vững, hãy thử áp dụng mô hình chia thu nhập: 50% cho nhu cầu thiết yếu, 30% cho sở thích cá nhân và 20% cho việc trả nợ và tích lũy. Với thu nhập hiện tại (${formatVND(data.user.monthlyIncome)}), bạn nên dành ít nhất ${formatVND(data.user.monthlyIncome * 0.2)} mỗi tháng cho mục tiêu tài chính.`,
      50, doc.y + 18, { width: 495, lineGap: 4, align: 'justify' }
    );

    doc.moveDown(1.2);

    doc.fillColor('#1e40af').font('MainBold').fontSize(11).text('4.3 Xây dựng quỹ dự phòng (Emergency Fund)', 50, doc.y);
    doc.fillColor('#334155').font('Main').fontSize(10).text(
      `Trước khi dồn toàn bộ nguồn lực để trả nợ nhanh, hãy đảm bảo bạn có một khoản dự phòng ít nhất 1-2 tháng chi phí cơ bản. Điều này giúp bạn tránh phải vay mượn thêm (tín dụng đen, vay nhanh) khi có sự cố bất ngờ xảy ra trong quá trình trả nợ.`,
      50, doc.y + 18, { width: 495, lineGap: 4, align: 'justify' }
    );

    doc.moveDown(1.5);

    const summaryY = doc.y;
    doc.rect(50, summaryY, 495, 75).fill('#f0f9ff').strokeColor('#bae6fd').lineWidth(0.5).stroke();
    doc.fillColor('#0369a1').font('MainBold').fontSize(11).text('DỰ BÁO KẾT QUẢ:', 70, summaryY + 15);
    doc.fillColor('#0c4a6e').font('Main').fontSize(11).text(
      `Nếu kiên trì bổ sung thêm 10% thu nhập (${formatVND(data.user.monthlyIncome * 0.1)}) vào kế hoạch trả nợ hàng tháng, bạn sẽ hoàn tất toàn bộ nghĩa vụ tài chính trong vòng `,
      70, summaryY + 35, { width: 450, continued: true }
    );
    doc.font('MainBold').text(`${data.simulation.months} tháng`, { continued: true });
    doc.font('Main').text(`. Đừng bỏ cuộc, mỗi bước nhỏ đều đưa bạn đến gần hơn với tự do tài chính!`);

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fillColor('#94a3b8').fontSize(8).text(
        `Trang ${i + 1} / ${pages.count}  |  FinSight - Giải pháp quản lý tài chính thông minh  |  © 2026`,
        50, 795, { align: 'center', width: 495 }
      );
    }

    doc.end();
  }
}

export default new ReportService();
