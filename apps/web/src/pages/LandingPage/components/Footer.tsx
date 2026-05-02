import { Heart, Info, Mail, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="pt-24 pb-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1121]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2.5 mb-6 group">
              <img
                src="https://i.ibb.co/84xLmWTK/LOGO.png"
                alt="FinSight Logo"
                className="h-8 w-auto object-contain group-hover:opacity-80 transition-all"
              />
            </Link>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed max-w-sm">
              Nền tảng quản lý nợ và tư vấn tài chính thông minh. Xây dựng tương lai tài chính vững chắc bằng công nghệ
              dữ liệu minh bạch.
            </p>
            <div className="flex gap-3">
              {[Mail, MessageSquare, Info].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900 transition-all"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Sản phẩm</h5>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Tính năng
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Cách hoạt động
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Hỏi đáp
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Về chúng tôi</h5>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Câu chuyện
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Tuyển dụng
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Blog chia sẻ
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h5 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Chính sách</h5>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Bảo mật dữ liệu
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Điều khoản dịch vụ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Liên hệ
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            © {new Date().getFullYear()} FinSight. Phát triển với{' '}
            <Heart size={14} className="text-red-500 fill-red-500" /> tại Việt Nam.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Quyền riêng tư
            </a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Điều khoản
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
