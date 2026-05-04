import { motion } from 'framer-motion';
import React from 'react';

interface AgingData {
  partyName: string;
  buckets: {
    current: number;
    '1-30': number;
    '31-90': number;
    '91-180': number;
    '181-360': number;
    over360: number;
  };
  total: number;
  provision: number;
}

interface AgingReportProps {
  data: AgingData[];
  type: 'RECEIVABLE' | 'PAYABLE';
}

export const AgingReport: React.FC<AgingReportProps> = ({ data, type }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h3 className="font-bold text-slate-900 dark:text-white">
          Báo cáo tuổi nợ {type === 'RECEIVABLE' ? 'phải thu' : 'phải trả'}
        </h3>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          VN Standard (Dự phòng tự động)
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đối tác</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                Chưa hạn
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                1-30 ngày
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                31-90 ngày
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                91-180 ngày
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                &gt;180 ngày
              </th>
              <th className="px-6 py-3 text-[10px] font-bold text-emerald-500 uppercase tracking-wider text-right">
                Tổng
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((row, i) => (
              <motion.tr
                key={row.partyName}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{row.partyName}</div>
                  <div className="text-[10px] text-slate-400 mt-1 italic">
                    Dự phòng: {formatCurrency(row.provision)}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-right text-slate-600 dark:text-slate-400">
                  {formatCurrency(row.buckets.current)}
                </td>
                <td className="px-4 py-4 text-sm text-right text-blue-500 font-medium">
                  {formatCurrency(row.buckets['1-30'])}
                </td>
                <td className="px-4 py-4 text-sm text-right text-orange-500 font-medium">
                  {formatCurrency(row.buckets['31-90'])}
                </td>
                <td className="px-4 py-4 text-sm text-right text-rose-500 font-medium">
                  {formatCurrency(row.buckets['91-180'])}
                </td>
                <td className="px-4 py-4 text-sm text-right text-red-600 font-bold">
                  {formatCurrency(row.buckets['181-360'] + row.buckets.over360)}
                </td>
                <td className="px-6 py-4 text-sm text-right font-black text-emerald-500">
                  {formatCurrency(row.total)}
                </td>
              </motion.tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic text-sm">
                  Chưa có dữ liệu nợ để hiển thị báo cáo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
