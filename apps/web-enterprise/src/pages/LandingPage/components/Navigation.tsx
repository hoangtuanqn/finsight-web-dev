import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, LayoutDashboard, LogIn, Menu, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ToggleMode } from '../../../components/layout/components/ToggleMode';
import { useAuth } from '../../../context/AuthContext';
import { useDarkMode } from '../../../hooks/useDarkMode';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useDarkMode() as [boolean, (val: boolean) => void];
  const { token } = useAuth();
  const isLoggedIn = !!token;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Tính năng', href: '#features' },
    { name: 'Quy trình', href: '#how-it-works' },
    { name: 'Hỏi đáp', href: '#faq' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4' : 'py-8'}`}>
      <div className={`max-w-7xl mx-auto px-6`}>
        <div
          className={`relative flex items-center justify-between px-6 py-3 rounded-2xl border transition-all duration-500 ${scrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-slate-200 dark:border-white/10 shadow-2xl' : 'bg-transparent border-transparent'}`}
        >
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="https://i.ibb.co/84xLmWTK/LOGO.png"
              alt="FinSight Logo"
              className="h-9 md:h-10 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-widest"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ToggleMode dark={dark} setDark={setDark} />
            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-2" />
            {isLoggedIn ? (
              <Link
                to="/home"
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-black text-sm rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105"
              >
                Dashboard <LayoutDashboard size={16} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-black text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest px-4 py-2"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="group relative flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-black text-sm rounded-xl transition-all hover:scale-105 shadow-xl"
                >
                  Bắt đầu <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 text-slate-600 dark:text-slate-400" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 p-6 md:hidden"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-3xl">
              <div className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter"
                  >
                    {link.name}
                  </a>
                ))}
                <hr className="border-slate-100 dark:border-white/5" />
                <div className="flex flex-col gap-4">
                  <ToggleMode dark={dark} setDark={setDark} />
                  {isLoggedIn ? (
                    <Link
                      to="/home"
                      className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-black rounded-2xl"
                    >
                      Dashboard <LayoutDashboard size={20} />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 px-6 py-4 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black rounded-2xl"
                      >
                        Đăng nhập <LogIn size={20} />
                      </Link>
                      <Link
                        to="/register"
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-black rounded-2xl"
                      >
                        Bắt đầu ngay <ChevronRight size={20} />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
