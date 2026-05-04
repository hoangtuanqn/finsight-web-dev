import { motion } from 'framer-motion';
import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  promoContent: React.ReactNode;
  isFromAuth?: boolean;
}

export function AuthLayout({ children, promoContent, isFromAuth }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0f172a] flex items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden">
      <div className="max-w-[1000px] w-full flex bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative">
        {/* LEFT COLUMN - PROMO */}
        <motion.div
          initial={isFromAuth ? { x: 500, zIndex: 30 } : { zIndex: 30 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="hidden lg:flex w-[48%] bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 relative flex-col items-center justify-center p-14 text-center z-30 overflow-hidden"
        >
          {/* Animated Floating Blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                x: [0, -40, 0],
                y: [0, 60, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-[80px]"
            />
            <motion.div
              animate={{
                x: [0, 30, 0],
                y: [0, -50, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-20 -left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-[100px]"
            />
          </div>

          {/* Subtle Pattern Background */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14 14V6h2v8h8v2h-8v8h-2v-8H6v-2h8z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Animated Waves at the bottom */}
          <div className="absolute bottom-0 left-0 w-full leading-[0] z-10 pointer-events-none opacity-30">
            <svg className="relative block w-[200%] h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <motion.path
                animate={{ x: [-600, 0, -600] }}
                transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C49.1,1.5,95.74,14.27,141.45,28.33,186.27,42.11,232.14,55.6,280.57,58.55,294.09,59.36,307.73,58.6,321.39,56.44Z"
                fill="#FFFFFF"
              />
            </svg>
          </div>

          {/* S-Curve SVG Divider */}
          <svg
            className="absolute top-0 -right-[59px] w-[60px] h-full text-white dark:text-slate-900 fill-current z-10 pointer-events-none drop-shadow-[10px_0_15px_rgba(0,0,0,0.05)] hidden lg:block"
            viewBox="0 0 60 1000"
            preserveAspectRatio="none"
          >
            <motion.path
              animate={{
                d: [
                  'M 60 0 C 60 300 -20 700 60 1000 L 70 1000 L 70 0 Z',
                  'M 60 0 C 60 400 10 600 60 1000 L 70 1000 L 70 0 Z',
                  'M 60 0 C 60 300 -20 700 60 1000 L 70 1000 L 70 0 Z',
                ],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>

          <div className="relative z-20 flex flex-col items-center">{promoContent}</div>
        </motion.div>

        {/* RIGHT COLUMN - AUTH FORM */}
        <motion.div
          initial={isFromAuth ? { x: -500, opacity: 0 } : { opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex-1 p-8 sm:p-12 lg:p-14 relative z-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 overflow-hidden"
        >
          {/* Aesthetic Soft Blobs */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-teal-100/50 dark:bg-teal-900/20 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full max-w-[360px] relative z-10 flex flex-col items-center">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
