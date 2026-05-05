import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportDebtToExcel = async (debt: any) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Chi tiết Khoản nợ');

  // Set default column widths
  worksheet.columns = [
    { width: 5 }, // A
    { width: 20 }, // B - Period/Date
    { width: 25 }, // C - Code/Name
    { width: 20 }, // D - Principal
    { width: 20 }, // E - Interest
    { width: 20 }, // F - Total
    { width: 20 }, // G - Status/Snapshot
  ];

  // 1. Header Section
  const titleRow = worksheet.addRow(['', 'BÁO CÁO CHI TIẾT HỒ SƠ NỢ']);
  worksheet.mergeCells('B1:G1');
  titleRow.getCell(2).font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF10B981' } }; // Emerald-500
  titleRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 30;
  worksheet.addRow([]); // Empty row

  // 2. Summary Info Section
  const infoSectionHeader = worksheet.addRow(['', 'THÔNG TIN CHUNG']);
  worksheet.mergeCells('B3:G3');
  infoSectionHeader.getCell(2).font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FF1E293B' } };
  infoSectionHeader.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

  const infoData = [
    [
      '',
      'Mã tham chiếu:',
      debt.internalCode,
      '',
      'Ngày phát sinh:',
      new Date(debt.issueDate).toLocaleDateString('vi-VN'),
    ],
    ['', 'Đối tác:', debt.party?.name, '', 'Trạng thái:', debt.status],
    ['', 'Mã số thuế:', debt.party?.taxCode || 'N/A', '', 'Bên bảo lãnh:', debt.guarantor?.name || 'N/A'],
    ['', 'Phương thức lãi:', debt.interestMethod, '', 'Loại nghiệp vụ:', debt.type],
  ];

  infoData.forEach((data) => {
    const row = worksheet.addRow(data);
    row.getCell(2).font = { name: 'Arial', bold: true, color: { argb: 'FF64748B' } };
    row.getCell(3).font = { name: 'Arial' };
    row.getCell(5).font = { name: 'Arial', bold: true, color: { argb: 'FF64748B' } };
    row.getCell(6).font = { name: 'Arial' };
  });

  worksheet.addRow([]); // Empty row

  // 3. Financial Summary Section
  const financialSectionHeader = worksheet.addRow(['', 'TÓM TẮT TÀI CHÍNH']);
  worksheet.mergeCells(`B${worksheet.rowCount}:G${worksheet.rowCount}`);
  financialSectionHeader.getCell(2).font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FF1E293B' } };
  financialSectionHeader.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

  const financials = [
    ['', 'Số tiền gốc:', debt.principal, '', 'Dư nợ hiện tại:', debt.outstanding],
    ['', 'Tổng phạt tích lũy:', debt.totalPenaltyAccrued, '', 'Phạt chưa thanh toán:', debt.unpaidPenalty],
  ];

  financials.forEach((data) => {
    const row = worksheet.addRow(data);
    row.getCell(2).font = { name: 'Arial', bold: true, color: { argb: 'FF64748B' } };
    row.getCell(5).font = { name: 'Arial', bold: true, color: { argb: 'FF64748B' } };
    row.getCell(3).numFmt = '#,##0 "VND"';
    row.getCell(3).font = { name: 'Arial', bold: true };
    row.getCell(6).numFmt = '#,##0 "VND"';
    row.getCell(6).font = {
      name: 'Arial',
      bold: true,
      color: { argb: debt.unpaidPenalty > 0 ? 'FFEF4444' : 'FF1E293B' },
    };
  });

  worksheet.addRow([]);
  worksheet.addRow([]);

  // 4. Repayment Schedule Table
  const scheduleHeader = worksheet.addRow(['', 'LỊCH TRÌNH THANH TOÁN CHI TIẾT']);
  worksheet.mergeCells(`B${worksheet.rowCount}:G${worksheet.rowCount}`);
  scheduleHeader.getCell(2).font = { name: 'Arial', bold: true, color: { argb: 'FF334155' } };

  const scheduleTableHead = worksheet.addRow([
    '',
    'Kỳ thứ',
    'Ngày đến hạn',
    'Tiền gốc',
    'Tiền lãi',
    'Tổng kỳ',
    'Trạng thái',
  ]);
  scheduleTableHead.height = 20;
  scheduleTableHead.eachCell((cell, colNumber) => {
    if (colNumber > 1) {
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; // Slate-700
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });

  debt.schedules.forEach((s: any) => {
    const row = worksheet.addRow([
      '',
      s.period,
      new Date(s.dueDate).toLocaleDateString('vi-VN'),
      s.principalAmount,
      s.interestAmount,
      s.totalAmount,
      s.status,
    ]);
    row.eachCell((cell, colNumber) => {
      if (colNumber > 1) {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.font = { name: 'Arial' };
        if (colNumber >= 4 && colNumber <= 6) {
          cell.numFmt = '#,##0 "VND"';
          cell.font = { name: 'Arial' };
        }
        if (colNumber === 7) {
          cell.alignment = { horizontal: 'center' };
          if (s.status === 'PAID') cell.font = { name: 'Arial', color: { argb: 'FF10B981' }, bold: true };
          if (s.status === 'OVERDUE') cell.font = { name: 'Arial', color: { argb: 'FFEF4444' }, bold: true };
        }
      }
    });
  });

  worksheet.addRow([]);
  worksheet.addRow([]);

  // 5. Transaction History Table
  const transHeader = worksheet.addRow(['', 'LỊCH SỬ GIAO DỊCH GẦN ĐÂY']);
  worksheet.mergeCells(`B${worksheet.rowCount}:G${worksheet.rowCount}`);
  transHeader.getCell(2).font = { name: 'Arial', bold: true, color: { argb: 'FF334155' } };

  const transTableHead = worksheet.addRow([
    '',
    'Ngày giao dịch',
    'Mã GD',
    'Loại hình',
    'Số tiền',
    'Dư nợ sau GD',
    'Ghi chú',
  ]);
  transTableHead.height = 20;
  transTableHead.eachCell((cell, colNumber) => {
    if (colNumber > 1) {
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });

  debt.transactions.forEach((t: any) => {
    const row = worksheet.addRow([
      '',
      new Date(t.paidAt || t.createdAt).toLocaleDateString('vi-VN'),
      t.id.substring(0, 8).toUpperCase(),
      t.type,
      t.amount,
      t.balanceSnapshot,
      t.notes || '',
    ]);
    row.eachCell((cell, colNumber) => {
      if (colNumber > 1) {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.font = { name: 'Arial' };
        if (colNumber === 5 || colNumber === 6) {
          cell.numFmt = '#,##0 "VND"';
          cell.font = { name: 'Arial' };
        }
        if (colNumber === 4) {
          if (t.type === 'PAYMENT') cell.font = { name: 'Arial', color: { argb: 'FF10B981' }, bold: true };
          if (t.type === 'REVERSAL') cell.font = { name: 'Arial', color: { argb: 'FFEF4444' }, bold: true };
        }
      }
    });
  });

  // Footer / Metadata
  worksheet.addRow([]);
  const footer = worksheet.addRow([
    '',
    `Tài liệu được trích xuất từ hệ thống FinSight Enterprise vào lúc: ${new Date().toLocaleString('vi-VN')}`,
  ]);
  footer.getCell(2).font = { name: 'Arial', italic: true, size: 9, color: { argb: 'FF64748B' } };

  // Write and Save
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `DebtReport_${debt.internalCode}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
