import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MockMarketControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [mockValue, setMockValue] = useState(50);
  const [isActive, setIsActive] = useState(false);

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleMock = () => {
    setIsActive(!isActive);
    if (!isActive) {
      window.__MOCK_SENTIMENT__ = mockValue;
    } else {
      delete window.__MOCK_SENTIMENT__;
    }
    window.dispatchEvent(new CustomEvent('mockSentimentChange', { detail: { active: !isActive, value: mockValue } }));
  };

  const updateValue = (val) => {
    setMockValue(val);
    if (isActive) {
      window.__MOCK_SENTIMENT__ = val;
      window.dispatchEvent(new CustomEvent('mockSentimentChange', { detail: { active: true, value: val } }));
    }
  };

  const getLabel = (v) => {
    if (v <= 24) return { text: 'Sợ hãi cực độ', color: 'text-red-500' };
    if (v <= 49) return { text: 'Sợ hãi', color: 'text-orange-500' };
    if (v === 50) return { text: 'Trung lập', color: 'text-yellow-500' };
    if (v <= 74) return { text: 'Tham lam', color: 'text-green-500' };
    return { text: 'Tham lam cực độ', color: 'text-emerald-500' };
  };

  const label = getLabel(mockValue);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed bottom-4 right-4 z-50 w-80 glass-card bg-slate-900/95 border-yellow-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-yellow-400">🎮 Mock Market Control</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white text-lg">&times;</button>
          </div>

          <p className="text-xs text-slate-500 mb-3">Ctrl+Shift+D để toggle panel này</p>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={toggleMock}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isActive ? '✅ ACTIVE' : '⬜ INACTIVE'}
            </button>
            <span className={`text-sm font-bold ${label.color}`}>{label.text}</span>
          </div>

          <div className="mb-2">
            <label className="text-xs text-slate-400">Fear & Greed: {mockValue}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={mockValue}
              onChange={(e) => updateValue(parseInt(e.target.value))}
              className="w-full mt-1 accent-yellow-500"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>😱 0</span><span>😐 50</span><span>🤑 100</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
