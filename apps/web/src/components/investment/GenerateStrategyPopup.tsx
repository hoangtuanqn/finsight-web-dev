import { motion } from 'framer-motion';
import { Sparkles, X, Zap } from 'lucide-react';
import { useState } from 'react';
import AssetFilterPanel from './AssetFilterPanel';

const VALID_ASSETS = ['savings', 'gold', 'stocks', 'bonds', 'crypto'];
const TOTAL_ASSETS = VALID_ASSETS.length;

interface GenerateStrategyPopupProps {
  quota: number;
  generating: boolean;
  riskLevel?: string;
  onGenerate: (excludedAssets: string[]) => void;
  onClose: () => void;
}

export default function GenerateStrategyPopup({
  quota,
  generating,
  riskLevel,
  onGenerate,
  onClose,
}: GenerateStrategyPopupProps) {
  const [excludedAssets, setExcludedAssets] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('finsight_excluded_assets') || '[]');
      return saved.filter((a: string) => VALID_ASSETS.includes(a));
    } catch {
      return [];
    }
  });

  const handleGenerate = () => {
    localStorage.setItem('finsight_excluded_assets', JSON.stringify(excludedAssets));
    onGenerate(excludedAssets);
  };

  const selectedCount = TOTAL_ASSETS - excludedAssets.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', duration: 0.35 }}
        className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Tạo chiến lược đầu tư mới</h2>
              <p className="text-xs text-slate-400 mt-0.5">Chọn các kênh bạn muốn tối ưu trong chiến lược này</p>
            </div>
          </div>

          {/* Asset selector — edit mode (unlocked) */}
          <div className="mb-4">
            <AssetFilterPanel
              excludedAssets={excludedAssets}
              onChange={setExcludedAssets}
              riskLevel={riskLevel}
              locked={false}
            />
          </div>

          {/* Summary pill */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/8 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <p className="text-xs text-slate-300">
              Hệ thống sẽ tối ưu <span className="font-black text-white">{selectedCount} kênh</span> bạn đã chọn
              {excludedAssets.length > 0 && (
                <span className="text-slate-500"> (bỏ qua {excludedAssets.length} kênh)</span>
              )}
            </p>
          </div>

          {/* Quota badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/8 mb-5">
            <Zap size={13} className={quota > 3 ? 'text-amber-400' : 'text-red-400'} />
            <span className="text-xs text-slate-300">
              Bạn còn <span className={`font-black ${quota > 3 ? 'text-amber-400' : 'text-red-400'}`}>{quota}</span>{' '}
              lượt tạo chiến lược
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors"
            >
              Huỷ
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || quota <= 0}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Tạo ngay
                </>
              )}
            </button>
          </div>

          {quota <= 0 && (
            <p className="mt-3 text-center text-xs text-red-400">
              Hết lượt.{' '}
              <a href="/upgrade" className="underline text-blue-400">
                Nâng cấp tài khoản
              </a>{' '}
              để nhận thêm lượt.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
