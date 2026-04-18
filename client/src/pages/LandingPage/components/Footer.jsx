import { Link } from 'react-router-dom';
import { Heart, Mail, MessageSquare, Info } from 'lucide-react';
import { GradientText } from './Shared';

export default function Footer() {
  return (
    <footer className="relative pt-32 pb-12 border-t border-white/10 bg-[#030712] overflow-hidden z-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[300px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 mb-20">
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-3 mb-8 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all">
                F
              </div>
              <span className="font-black text-2xl text-white tracking-tight">Fin<GradientText>Sight</GradientText></span>
            </Link>
            <p className="text-slate-400 mb-8 max-w-sm font-medium leading-relaxed">
              Nền tảng quản lý nợ và tư vấn đầu tư thông minh. Xây dựng tương lai tài chính vững chắc với sức mạnh của Web3 & AI.
            </p>
            <div className="flex gap-4">
              {[Mail, MessageSquare, Info].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-all">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-10">
            <div>
              <h5 className="font-black text-white mb-6 text-sm uppercase tracking-widest">Sản phẩm</h5>
              <ul className="space-y-4 text-sm text-slate-400 font-medium">
                <li><a href="#features" className="hover:text-cyan-400 transition-colors">Tính năng</a></li>
                <li><a href="#how-it-works" className="hover:text-cyan-400 transition-colors">Giao thức</a></li>
                <li><a href="#faq" className="hover:text-cyan-400 transition-colors">Hỗ trợ</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-black text-white mb-6 text-sm uppercase tracking-widest">Mạng lưới</h5>
              <ul className="space-y-4 text-sm text-slate-400 font-medium">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Tuyển dụng</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Cộng đồng</a></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h5 className="font-black text-white mb-6 text-sm uppercase tracking-widest">Giao thức an toàn</h5>
              <ul className="space-y-4 text-sm text-slate-400 font-medium">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Bảo mật dữ liệu</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Smart Contract</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Điều khoản</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-white/10 text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            © 2026 FinSight Protocol. Built with <Heart size={14} className="text-pink-500 fill-pink-500" /> in Vietnam.
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Quyền riêng tư</a>
            <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
