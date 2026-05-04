import { Globe, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-40 border-t border-[var(--color-border)] pt-24 pb-12 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <img src="https://i.ibb.co/84xLmWTK/LOGO.png" alt="FinSight Logo" className="h-16 w-auto self-start" />
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed font-medium max-w-sm">
                Nâng tầm quản trị tài chính cá nhân với trí tuệ nhân tạo. FinSight giúp bạn kiến tạo sự tự do và bứt phá
                mọi giới hạn.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-[var(--color-bg-primary)] bg-[var(--color-bg-secondary)] flex items-center justify-center text-[10px] font-black text-blue-400 shadow-xl"
                  >
                    U{i}
                  </div>
                ))}
              </div>
              <p className="text-[13px] text-[var(--color-text-muted)] font-bold">
                <span className="text-blue-400 font-black">1,200+</span> nhà đầu tư tin dùng
              </p>
            </div>
          </div>

          {/* Navigation Group 1 */}
          <div className="flex flex-col gap-6 items-start text-left">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--color-text-primary)] text-left w-full">
              Nền tảng
            </h4>
            <nav className="flex flex-col gap-4 items-start w-full">
              {['Dashboard', 'Thị trường', 'Phân tích AI', 'Giao dịch'].map((item) => (
                <span
                  key={item}
                  className="text-[14px] font-semibold text-[var(--color-text-muted)] hover:text-blue-400 transition-all cursor-pointer flex items-center gap-0 group"
                >
                  <div className="w-0 group-hover:w-2 h-[1px] bg-blue-500 transition-all duration-300" />
                  {item}
                </span>
              ))}
            </nav>
          </div>

          {/* Navigation Group 2 */}
          <div className="flex flex-col gap-6 items-start text-left">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--color-text-primary)] text-left w-full">
              Tài nguyên
            </h4>
            <nav className="flex flex-col gap-4 items-start w-full">
              {['Tài liệu API', 'Hướng dẫn', 'Cộng đồng', 'Hỗ trợ 24/7'].map((item) => (
                <span
                  key={item}
                  className="text-[14px] font-semibold text-[var(--color-text-muted)] hover:text-blue-400 transition-all cursor-pointer flex items-center gap-0 group"
                >
                  <div className="w-0 group-hover:w-2 h-[1px] bg-blue-500 transition-all duration-300" />
                  {item}
                </span>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-24 pt-12 border-t border-[var(--color-border)] flex flex-col md:flex-row justify-between items-end gap-12">
          <div className="flex flex-col gap-5 max-w-md w-full">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-emerald-400 transition-colors cursor-help">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">AES-256 SECURED</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-blue-400 transition-colors cursor-help">
                <Globe size={16} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">GLOBAL NETWORK</span>
              </div>
            </div>
            <p className="text-[14px] text-[var(--color-text-muted)] font-medium leading-relaxed">
              © {new Date().getFullYear()} FinSight Ecosystem. Tất cả quyền được bảo lưu. Dữ liệu được bảo mật bởi hạ
              tầng đám mây phân tán của Golden Hands.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-5 w-full md:w-auto">
            <div className="text-center md:text-right">
              <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.5em] mb-3 opacity-60">
                Architected & Engineered by
              </p>
              <h2 className="text-5xl font-black text-gradient tracking-tighter uppercase mb-1 leading-none">
                Golden Hands
              </h2>
              <p className="text-[12px] font-black text-blue-500/50 tracking-[0.3em] uppercase">
                Premium Software Craftsmanship
              </p>
            </div>
            <div className="flex items-center gap-5 text-[10px] font-black text-[var(--color-text-muted)] tracking-[0.2em]">
              <span className="hover:text-blue-400 cursor-pointer transition-colors">VIETNAM HQ</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-border)]" />
              <span className="hover:text-blue-400 cursor-pointer transition-colors">VERSION 1.0.0-RELEASE</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
