import { motion } from 'framer-motion';
import { Briefcase, Building, Mail, Phone, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth() as any;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="px-8 pb-8 relative">
          <div className="absolute -top-12 left-8 w-24 h-24 bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
            <UserIcon size={40} className="text-slate-400" />
          </div>

          <div className="pt-16">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.fullName || 'Người dùng'}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <Briefcase size={16} />
              {user?.roleTitle || 'Administrator'}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6"
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
            Thông tin cá nhân
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Mail size={18} className="text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</p>
                <p className="text-slate-900 dark:text-white font-medium">{user?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Phone size={18} className="text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Số điện thoại</p>
                <p className="text-slate-900 dark:text-white font-medium">{user?.phoneNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6"
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
            Thông tin Tổ chức
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Building size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổ chức</p>
                <p className="text-slate-900 dark:text-white font-medium">
                  FinSight Enterprise ID: {user?.organizationId || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
