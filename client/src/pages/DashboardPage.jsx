// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
// import { PageSkeleton } from '../components/common/LoadingSpinner';
// import { debtAPI, marketAPI } from '../api/index.js';
// import { useAuth } from '../context/AuthContext';
// import { formatVND, formatPercent } from '../utils/calculations';

// const QUICK_ACTIONS = [
//   { to: '/debts/add', icon: '➕', label: 'Thêm khoản nợ', desc: 'Nhập nợ mới', gradient: 'from-blue-600/20 to-blue-800/20', border: 'border-blue-500/20', hoverBorder: 'hover:border-blue-500/40' },
//   { to: '/debts/repayment', icon: '📋', label: 'Kế hoạch trả nợ', desc: 'Avalanche vs Snowball', gradient: 'from-emerald-600/20 to-emerald-800/20', border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-500/40' },
//   { to: '/risk-assessment', icon: '🎯', label: 'Đánh giá rủi ro', desc: '5 câu hỏi nhanh', gradient: 'from-purple-600/20 to-purple-800/20', border: 'border-purple-500/20', hoverBorder: 'hover:border-purple-500/40' },
//   { to: '/investment', icon: '📈', label: 'Phân bổ đầu tư', desc: 'Tư vấn AI', gradient: 'from-cyan-600/20 to-cyan-800/20', border: 'border-cyan-500/20', hoverBorder: 'hover:border-cyan-500/40' },
//   { to: '/debts/ear-analysis', icon: '🔍', label: 'Phân tích EAR', desc: 'Chi phí ẩn', gradient: 'from-amber-600/20 to-amber-800/20', border: 'border-amber-500/20', hoverBorder: 'hover:border-amber-500/40' },
//   { to: '/profile', icon: '👤', label: 'Hồ sơ', desc: 'Cập nhật thu nhập', gradient: 'from-slate-600/20 to-slate-700/20', border: 'border-slate-500/20', hoverBorder: 'hover:border-slate-500/40' },
// ];

// const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

// const tooltipStyle = {
//   background: '#111827',
//   border: '1px solid rgba(255,255,255,0.08)',
//   borderRadius: '12px',
//   fontSize: '12px',
//   boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
// };

// const stagger = {
//   container: { animate: { transition: { staggerChildren: 0.06 } } },
//   item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
// };

// export default function DashboardPage() {
//   const { user } = useAuth();
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const [debtsRes, sentimentRes] = await Promise.all([
//           debtAPI.getAll().catch(() => ({ data: { data: { debts: [], summary: {} } } })),
//           marketAPI.getSentiment().catch(() => ({ data: { data: { fearGreed: { value: 50, labelVi: 'Trung lập' } } } })),
//         ]);
//         setData({
//           debts: debtsRes.data.data,
//           sentiment: sentimentRes.data.data.fearGreed,
//         });
//       } catch (e) {
//         console.error('Dashboard load error:', e);
//       } finally {
//         setTimeout(() => setLoading(false), 600);
//       }
//     };
//     load();
//   }, []);

//   if (loading) return <PageSkeleton />;

//   const debtSummary = data?.debts?.summary || {};
//   const debts = data?.debts?.debts || [];
//   const sentiment = data?.sentiment || {};

//   const dtiScore = Math.max(0, 100 - (debtSummary.debtToIncomeRatio || 0) * 2);
//   const healthScore = Math.round(dtiScore);

//   const getHealthColor = (v) => v > 70 ? '#10b981' : v > 40 ? '#f59e0b' : '#ef4444';
//   const getHealthLabel = (v) => v > 70 ? 'Tốt' : v > 40 ? 'Trung bình' : 'Cần cải thiện';
//   const getSentimentColor = (val) => {
//     if (val <= 24) return '#ef4444';
//     if (val <= 49) return '#f97316';
//     if (val <= 74) return '#22c55e';
//     return '#15803d';
//   };

//   // Prepare EAR comparison chart data (top 5 debts)
//   const earChartData = debts
//     .slice(0, 5)
//     .map(d => ({
//       name: d.name.length > 12 ? d.name.slice(0, 12) + '...' : d.name,
//       APR: d.apr,
//       EAR: d.ear,
//     }));

//   // Platform distribution pie chart
//   const platformCounts = {};
//   debts.forEach(d => {
//     platformCounts[d.platform] = (platformCounts[d.platform] || 0) + 1;
//   });
//   const platformPieData = Object.entries(platformCounts).map(([k, v]) => ({ name: k, value: v }));

//   // Hours greeting
//   const hour = new Date().getHours();
//   const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

//   return (
//     <motion.div initial="initial" animate="animate" variants={stagger.container}>
//       {/* Header */}
//       <motion.div variants={stagger.item} className="mb-8">
//         <h1 className="text-2xl font-bold text-white tracking-tight">
//           {greeting}, {user?.fullName || 'bạn'} 👋
//         </h1>
//         <p className="text-slate-500 text-sm mt-1.5">Tổng quan tài chính của bạn • {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
//       </motion.div>

//       {/* Domino Risk Alerts */}
//       {debtSummary.dominoAlerts?.length > 0 && (
//         <motion.div variants={stagger.item} className="mb-6 space-y-2.5">
//           {debtSummary.dominoAlerts.map((alert, i) => (
//             <div
//               key={i}
//               className={`px-5 py-3.5 rounded-2xl border text-sm font-medium ${
//                 alert.severity === 'DANGER'
//                   ? 'bg-red-500/[0.06] border-red-500/20 text-red-400 pulse-danger'
//                   : 'bg-amber-500/[0.06] border-amber-500/20 text-amber-400'
//               }`}
//             >
//               {alert.severity === 'DANGER' ? '🚨' : '⚠️'} {alert.message}
//             </div>
//           ))}
//         </motion.div>
//       )}

//       {/* ====== ROW 1: Key Metrics ====== */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
//         {/* Health Score */}
//         <motion.div variants={stagger.item} className="relative overflow-hidden rounded-2xl border p-5" style={{ background: 'rgba(17, 24, 39, 0.7)', borderColor: `${getHealthColor(healthScore)}22` }}>
//           <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-10" style={{ background: getHealthColor(healthScore) }} />
//           <div className="relative z-10">
//             <div className="flex items-center justify-between mb-4">
//               <div className="flex items-center gap-2.5">
//                 <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${getHealthColor(healthScore)}15` }}>🏥</div>
//                 <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sức khỏe</span>
//               </div>
//             </div>
//             <p className="text-3xl font-extrabold tracking-tight" style={{ color: getHealthColor(healthScore) }}>{healthScore}<span className="text-base font-normal text-slate-600">/100</span></p>
//             <p className="text-xs text-slate-500 mt-1.5">{getHealthLabel(healthScore)}</p>
//             {/* Mini progress bar */}
//             <div className="mt-3 h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
//               <motion.div initial={{ width: 0 }} animate={{ width: `${healthScore}%` }} transition={{ duration: 1, delay: 0.3 }} className="h-full rounded-full" style={{ background: getHealthColor(healthScore) }} />
//             </div>
//           </div>
//         </motion.div>

//         {/* Total Debt */}
//         <motion.div variants={stagger.item} className="relative overflow-hidden rounded-2xl border p-5" style={{ background: 'rgba(17, 24, 39, 0.7)', borderColor: 'rgba(239, 68, 68, 0.12)' }}>
//           <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-10 bg-red-500" />
//           <div className="relative z-10">
//             <div className="flex items-center gap-2.5 mb-4">
//               <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-red-500/10">💳</div>
//               <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng nợ</span>
//             </div>
//             <p className="text-3xl font-extrabold tracking-tight text-red-400">{formatVND(debtSummary.totalBalance || 0)}</p>
//             <p className="text-xs text-slate-500 mt-1.5">{debts.length} khoản nợ • Trả tối thiểu {formatVND(debtSummary.totalMinPayment || 0)}/tháng</p>
//           </div>
//         </motion.div>

//         {/* Average EAR */}
//         <motion.div variants={stagger.item} className="relative overflow-hidden rounded-2xl border p-5" style={{ background: 'rgba(17, 24, 39, 0.7)', borderColor: 'rgba(139, 92, 246, 0.12)' }}>
//           <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-10 bg-purple-500" />
//           <div className="relative z-10">
//             <div className="flex items-center gap-2.5 mb-4">
//               <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-purple-500/10">📊</div>
//               <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">EAR trung bình</span>
//             </div>
//             <p className="text-3xl font-extrabold tracking-tight text-purple-400">{formatPercent(debtSummary.averageEAR || 0)}</p>
//             <p className="text-xs text-slate-500 mt-1.5">Chi phí thực tế/năm</p>
//           </div>
//         </motion.div>

//         {/* Market Sentiment */}
//         <motion.div variants={stagger.item} className="relative overflow-hidden rounded-2xl border p-5" style={{ background: 'rgba(17, 24, 39, 0.7)', borderColor: `${getSentimentColor(sentiment.value || 50)}18` }}>
//           <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-10" style={{ background: getSentimentColor(sentiment.value || 50) }} />
//           <div className="relative z-10">
//             <div className="flex items-center gap-2.5 mb-4">
//               <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${getSentimentColor(sentiment.value || 50)}15` }}>🌡️</div>
//               <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tâm lý thị trường</span>
//             </div>
//             <p className="text-3xl font-extrabold tracking-tight" style={{ color: getSentimentColor(sentiment.value || 50) }}>{sentiment.value || 50}<span className="text-base font-normal text-slate-600">/100</span></p>
//             <p className="text-xs text-slate-500 mt-1.5">{sentiment.labelVi || 'Trung lập'}</p>
//           </div>
//         </motion.div>
//       </div>

//       {/* ====== ROW 2: Charts + Due this week ====== */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
//         {/* EAR vs APR Chart */}
//         <motion.div variants={stagger.item} className="lg:col-span-2 rounded-2xl border p-6" style={{ background: 'rgba(17, 24, 39, 0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>
//           <h2 className="text-[15px] font-semibold text-white mb-1 flex items-center gap-2.5">
//             <span className="text-lg">📊</span> APR vs EAR — Chi phí ẩn
//           </h2>
//           <p className="text-xs text-slate-500 mb-5">So sánh lãi suất quảng cáo (APR) và chi phí thực tế (EAR)</p>
//           {earChartData.length > 0 ? (
//             <div className="h-52">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={earChartData} barGap={4}>
//                   <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
//                   <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} tickFormatter={v => `${v}%`} />
//                   <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v.toFixed(1)}%`, '']} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
//                   <Bar dataKey="APR" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={20} name="APR (quảng cáo)" />
//                   <Bar dataKey="EAR" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} name="EAR (thực tế)" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           ) : (
//             <div className="h-52 flex items-center justify-center">
//               <p className="text-sm text-slate-600">Chưa có dữ liệu nợ</p>
//             </div>
//           )}
//           <div className="flex items-center gap-5 mt-3">
//             <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> APR (quảng cáo)</div>
//             <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2.5 h-2.5 rounded-sm bg-red-500" /> EAR (thực tế)</div>
//           </div>
//         </motion.div>

//         {/* Debts Due This Week */}
//         <motion.div variants={stagger.item} className="rounded-2xl border p-6" style={{ background: 'rgba(17, 24, 39, 0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
//               <span className="text-lg">📅</span> Đáo hạn sắp tới
//             </h2>
//             <Link to="/debts" className="text-blue-400 text-xs hover:text-blue-300 transition-colors font-medium">
//               Xem tất cả →
//             </Link>
//           </div>
//           {(debtSummary.dueThisWeek?.length > 0) ? (
//             <div className="space-y-1.5">
//               {debtSummary.dueThisWeek.map(d => (
//                 <div key={d.id} className="flex items-center justify-between py-3 px-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
//                   <div>
//                     <p className="text-sm font-medium text-slate-200">{d.name}</p>
//                     <p className="text-[11px] text-slate-600 mt-0.5">Ngày {d.dueDay}</p>
//                   </div>
//                   <p className="text-sm font-bold text-red-400">{formatVND(d.minPayment)}</p>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="py-10 text-center">
//               <p className="text-4xl mb-3">🎉</p>
//               <p className="text-sm text-slate-500 font-medium">Không có nợ đáo hạn</p>
//               <p className="text-xs text-slate-600 mt-1">Tuyệt vời! Hãy giữ vững phong độ 💪</p>
//             </div>
//           )}
//         </motion.div>
//       </div>

//       {/* ====== ROW 3: Top Debts + Platform Distribution + DTI ====== */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
//         {/* Top debts by balance */}
//         <motion.div variants={stagger.item} className="rounded-2xl border p-6" style={{ background: 'rgba(17, 24, 39, 0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>
//           <h2 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
//             <span className="text-lg">🔥</span> Top nợ lớn nhất
//           </h2>
//           {debts.length > 0 ? (
//             <div className="space-y-2">
//               {debts
//                 .sort((a, b) => b.balance - a.balance)
//                 .slice(0, 5)
//                 .map((d, i) => (
//                   <Link key={d.id} to={`/debts/${d.id}`} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/[0.04] transition-colors group">
//                     <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs font-bold text-slate-500">{i + 1}</div>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-medium text-slate-300 truncate group-hover:text-blue-400 transition-colors">{d.name}</p>
//                       <p className="text-[11px] text-slate-600">{d.platform}</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm font-bold text-red-400">{formatVND(d.balance)}</p>
//                       <p className="text-[10px] text-slate-600">EAR {formatPercent(d.ear)}</p>
//                     </div>
//                   </Link>
//                 ))}
//             </div>
//           ) : (
//             <p className="text-sm text-slate-600 text-center py-8">Chưa có khoản nợ nào</p>
//           )}
//         </motion.div>

//         {/* Platform Distribution */}
//         <motion.div variants={stagger.item} className="rounded-2xl border p-6" style={{ background: 'rgba(17, 24, 39, 0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>
//           <h2 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
//             <span className="text-lg">🧩</span> Phân bổ nền tảng
//           </h2>
//           {platformPieData.length > 0 ? (
//             <>
//               <div className="h-40 mb-3">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie data={platformPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
//                       {platformPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
//                     </Pie>
//                     <Tooltip contentStyle={tooltipStyle} />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//               <div className="space-y-2">
//                 {platformPieData.map((p, i) => (
//                   <div key={i} className="flex items-center justify-between text-xs">
//                     <div className="flex items-center gap-2">
//                       <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
//                       <span className="text-slate-400">{p.name}</span>
//                     </div>
//                     <span className="text-slate-300 font-medium">{p.value} khoản</span>
//                   </div>
//                 ))}
//               </div>
//             </>
//           ) : (
//             <div className="h-40 flex items-center justify-center">
//               <p className="text-sm text-slate-600">Chưa có dữ liệu</p>
//             </div>
//           )}
//         </motion.div>

//         {/* DTI Ratio + Key Stats */}
//         <motion.div variants={stagger.item} className="rounded-2xl border p-6" style={{ background: 'rgba(17, 24, 39, 0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>
//           <h2 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
//             <span className="text-lg">📐</span> Chỉ số tài chính
//           </h2>
//           <div className="space-y-4">
//             {/* DTI Gauge */}
//             <div className="text-center py-3">
//               <div className="relative w-28 h-28 mx-auto mb-3">
//                 <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
//                   <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
//                   <motion.circle
//                     cx="60" cy="60" r="50" fill="none"
//                     stroke={(debtSummary.debtToIncomeRatio || 0) > 35 ? '#ef4444' : (debtSummary.debtToIncomeRatio || 0) > 20 ? '#f59e0b' : '#10b981'}
//                     strokeWidth="10" strokeLinecap="round"
//                     strokeDasharray={`${Math.min(100, debtSummary.debtToIncomeRatio || 0) * 3.14} 314`}
//                     initial={{ strokeDasharray: '0 314' }}
//                     animate={{ strokeDasharray: `${Math.min(100, debtSummary.debtToIncomeRatio || 0) * 3.14} 314` }}
//                     transition={{ duration: 1.2, delay: 0.3 }}
//                   />
//                 </svg>
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <span className="text-xl font-bold" style={{ color: (debtSummary.debtToIncomeRatio || 0) > 35 ? '#ef4444' : (debtSummary.debtToIncomeRatio || 0) > 20 ? '#f59e0b' : '#10b981' }}>
//                     {formatPercent(debtSummary.debtToIncomeRatio || 0)}
//                   </span>
//                 </div>
//               </div>
//               <p className="text-xs text-slate-500 font-medium">Tỉ lệ Nợ/Thu nhập (DTI)</p>
//               <p className="text-[11px] text-slate-600 mt-0.5">
//                 {(debtSummary.debtToIncomeRatio || 0) > 35 ? 'Rủi ro cao — cần giảm nợ' : (debtSummary.debtToIncomeRatio || 0) > 20 ? 'Trung bình — cần chú ý' : 'Lành mạnh — tốt lắm!'}
//               </p>
//             </div>

//             <div className="h-px bg-white/[0.04]" />

//             {/* Quick stats */}
//             <div className="space-y-2.5">
//               <div className="flex justify-between text-sm">
//                 <span className="text-slate-500">Thu nhập/tháng</span>
//                 <span className="text-emerald-400 font-semibold">{formatVND(user?.monthlyIncome || 0)}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-slate-500">Trả nợ/tháng</span>
//                 <span className="text-red-400 font-semibold">{formatVND(debtSummary.totalMinPayment || 0)}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-slate-500">Còn lại/tháng</span>
//                 <span className="text-blue-400 font-semibold">{formatVND((user?.monthlyIncome || 0) - (debtSummary.totalMinPayment || 0))}</span>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </div>

//       {/* ====== ROW 4: Quick Actions ====== */}
//       <motion.div variants={stagger.item} className="rounded-2xl border p-6" style={{ background: 'rgba(17, 24, 39, 0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>
//         <h2 className="text-[15px] font-semibold text-white mb-5 flex items-center gap-2">
//           <span className="text-lg">⚡</span> Thao tác nhanh
//         </h2>
//         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
//           {QUICK_ACTIONS.map(action => (
//             <Link
//               key={action.to}
//               to={action.to}
//               className={`p-4 rounded-xl border bg-gradient-to-br ${action.gradient} ${action.border} ${action.hoverBorder} transition-all duration-200 text-center group hover:scale-[1.03] active:scale-[0.98]`}
//             >
//               <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform duration-200">{action.icon}</span>
//               <p className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">{action.label}</p>
//               <p className="text-[10px] text-slate-600 mt-0.5">{action.desc}</p>
//             </Link>
//           ))}
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// }

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { PageSkeleton } from '../components/common/LoadingSpinner';
import { debtAPI, marketAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import { formatVND, formatPercent } from '../utils/calculations';

const QUICK_ACTIONS = [
  { to: '/debts/add', icon: '➕', label: 'Thêm khoản nợ', desc: 'Nhập nợ mới', color: '#3b82f6' },
  { to: '/debts/repayment', icon: '📋', label: 'Kế hoạch trả nợ', desc: 'Avalanche vs Snowball', color: '#10b981' },
  { to: '/risk-assessment', icon: '🎯', label: 'Đánh giá rủi ro', desc: '5 câu hỏi nhanh', color: '#8b5cf6' },
  { to: '/investment', icon: '📈', label: 'Phân bổ đầu tư', desc: 'Tư vấn AI', color: '#06b6d4' },
  { to: '/debts/ear-analysis', icon: '🔍', label: 'Phân tích EAR', desc: 'Chi phí ẩn', color: '#f59e0b' },
  { to: '/profile', icon: '👤', label: 'Hồ sơ', desc: 'Cập nhật thu nhập', color: '#64748b' },
];

const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

const tooltipStyle = {
  background: '#0f172a',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  fontSize: '12px',
  padding: '8px 12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32 } },
};
const stagger = {
  container: { animate: { transition: { staggerChildren: 0.055 } } },
};

/* ─── Reusable Card shell ─── */
const Card = ({ children, className = '', style = {} }) => (
  <div
    className={`rounded-2xl border ${className}`}
    style={{
      background: 'rgba(15, 23, 42, 0.75)',
      borderColor: 'rgba(255,255,255,0.07)',
      backdropFilter: 'blur(16px)',
      ...style,
    }}
  >
    {children}
  </div>
);

const CardHeader = ({ icon, title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-5">
    <div className="flex items-center gap-2.5">
      <span className="text-xl leading-none">{icon}</span>
      <div>
        <h2 className="text-[14px] font-semibold text-slate-100 leading-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [debtsRes, sentimentRes] = await Promise.all([
          debtAPI.getAll().catch(() => ({ data: { data: { debts: [], summary: {} } } })),
          marketAPI.getSentiment().catch(() => ({
            data: { data: { fearGreed: { value: 50, labelVi: 'Trung lập' } } },
          })),
        ]);
        setData({
          debts: debtsRes.data.data,
          sentiment: sentimentRes.data.data.fearGreed,
        });
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };
    load();
  }, []);

  if (loading) return <PageSkeleton />;

  const debtSummary = data?.debts?.summary || {};
  const debts = data?.debts?.debts || [];
  const sentiment = data?.sentiment || {};

  const dtiRatio = debtSummary.debtToIncomeRatio || 0;
  const dtiScore = Math.max(0, 100 - dtiRatio * 2);
  const healthScore = Math.round(dtiScore);

  const healthColor = healthScore > 70 ? '#10b981' : healthScore > 40 ? '#f59e0b' : '#ef4444';
  const healthLabel = healthScore > 70 ? 'Tốt' : healthScore > 40 ? 'Trung bình' : 'Cần cải thiện';

  const sentimentColor =
    (sentiment.value || 50) <= 24
      ? '#ef4444'
      : (sentiment.value || 50) <= 49
        ? '#f97316'
        : (sentiment.value || 50) <= 74
          ? '#22c55e'
          : '#15803d';

  const dtiColor = dtiRatio > 35 ? '#ef4444' : dtiRatio > 20 ? '#f59e0b' : '#10b981';
  const dtiLabel =
    dtiRatio > 35 ? 'Rủi ro cao — cần giảm nợ' : dtiRatio > 20 ? 'Trung bình — cần chú ý' : 'Lành mạnh — tốt lắm!';

  const earChartData = debts.slice(0, 5).map((d) => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
    APR: d.apr,
    EAR: d.ear,
  }));

  const platformCounts = {};
  debts.forEach((d) => {
    platformCounts[d.platform] = (platformCounts[d.platform] || 0) + 1;
  });
  const platformPieData = Object.entries(platformCounts).map(([k, v]) => ({ name: k, value: v }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  /* Gauge circle helper */
  const circumference = 2 * Math.PI * 50;
  const dtiDash = Math.min(100, dtiRatio) / 100;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="space-y-5! pb-8"
    >
      {/* ── PAGE HEADER ── */}
      <motion.div variants={fade} className="pt-1 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight">
              {greeting},{' '}
              <span className="text-blue-400">{user?.fullName || 'bạn'}</span> 👋
            </h1>
            <p className="text-slate-500 text-[13px] mt-1">
              Tổng quan tài chính •{' '}
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <Link
            to="/debts/add"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
          >
            <span>➕</span> Thêm khoản nợ
          </Link>
        </div>
      </motion.div>

      {/* ── DOMINO ALERTS ── */}
      {debtSummary.dominoAlerts?.length > 0 && (
        <motion.div variants={fade} className="space-y-2">
          {debtSummary.dominoAlerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium ${alert.severity === 'DANGER'
                ? 'bg-red-500/[0.07] border-red-500/25 text-red-400 pulse-danger'
                : 'bg-amber-500/[0.07] border-amber-500/25 text-amber-400'
                }`}
            >
              <span className="text-base shrink-0">{alert.severity === 'DANGER' ? '🚨' : '⚠️'}</span>
              {alert.message}
            </div>
          ))}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════
          ROW 1 — KPI CARDS (4 equal columns)
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Health Score */}
        <motion.div variants={fade}>
          <Card className="p-5! h-full" style={{ borderColor: `${healthColor}20` }}>
            <div
              className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top right, ${healthColor}, transparent 70%)` }}
            />
            <div className="relative flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: `${healthColor}18` }}
                >
                  🏥
                </div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Sức khỏe</span>
              </div>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-[32px] font-extrabold leading-none tracking-tight" style={{ color: healthColor }}>
                  {healthScore}
                </span>
                <span className="text-slate-600 text-sm mb-0.5">/100</span>
              </div>
              <p className="text-[12px] text-slate-500 mb-3">{healthLabel}</p>
              <div className="mt-auto h-1.5 bg-slate-800/70 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${healthScore}%` }}
                  transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${healthColor}aa, ${healthColor})` }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Total Debt */}
        <motion.div variants={fade}>
          <Card className="p-5! h-full relative overflow-hidden" style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
            <div className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top right, #ef4444, transparent 70%)' }} />
            <div className="relative flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center text-base shrink-0">💳</div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Tổng nợ</span>
              </div>
              <div className="text-[28px] font-extrabold text-red-400 leading-tight tracking-tight mb-1">
                {formatVND(debtSummary.totalBalance || 0)}
              </div>
              <p className="text-[12px] text-slate-500 mt-auto">
                {debts.length} khoản nợ
                <span className="mx-1.5 text-slate-700">·</span>
                Tối thiểu {formatVND(debtSummary.totalMinPayment || 0)}/tháng
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Average EAR */}
        <motion.div variants={fade}>
          <Card className="p-5! h-full relative overflow-hidden" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
            <div className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top right, #8b5cf6, transparent 70%)' }} />
            <div className="relative flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-base shrink-0">📊</div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">EAR trung bình</span>
              </div>
              <div className="text-[32px] font-extrabold text-purple-400 leading-none tracking-tight mb-1">
                {formatPercent(debtSummary.averageEAR || 0)}
              </div>
              <p className="text-[12px] text-slate-500 mt-auto">Chi phí thực tế mỗi năm</p>
            </div>
          </Card>
        </motion.div>

        {/* Market Sentiment */}
        <motion.div variants={fade}>
          <Card className="p-5! h-full relative overflow-hidden" style={{ borderColor: `${sentimentColor}20` }}>
            <div className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top right, ${sentimentColor}, transparent 70%)` }} />
            <div className="relative flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: `${sentimentColor}18` }}>🌡️</div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Tâm lý thị trường</span>
              </div>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-[32px] font-extrabold leading-none tracking-tight" style={{ color: sentimentColor }}>
                  {sentiment.value || 50}
                </span>
                <span className="text-slate-600 text-sm mb-0.5">/100</span>
              </div>
              <p className="text-[12px] text-slate-500 mt-auto">{sentiment.labelVi || 'Trung lập'}</p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════
          ROW 2 — CHART (left 55%) + DUE (right 45%)
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-4">
        {/* APR vs EAR Chart — 6 of 11 cols */}
        <motion.div variants={fade} className="lg:col-span-6">
          <Card className="p-5 h-full flex flex-col">
            <CardHeader
              icon="📊"
              title="APR vs EAR — Chi phí ẩn"
              subtitle="So sánh lãi suất quảng cáo (APR) và chi phí thực tế (EAR)"
            />
            <div className="flex-1 min-h-[200px]">
              {earChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earChartData} barGap={3} barCategoryGap="28%">
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v, name) => [`${v.toFixed(1)}%`, name]}
                      cursor={{ fill: 'rgba(255,255,255,0.025)' }}
                    />
                    <Bar dataKey="APR" fill="#3b82f6" radius={[5, 5, 0, 0]} barSize={18} name="APR (quảng cáo)" />
                    <Bar dataKey="EAR" fill="#ef4444" radius={[5, 5, 0, 0]} barSize={18} name="EAR (thực tế)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <span className="text-3xl">📭</span>
                  <p className="text-sm text-slate-600">Chưa có dữ liệu nợ</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-5 pt-3 mt-1 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <div className="w-3 h-3 rounded-sm bg-blue-500" />APR (quảng cáo)
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <div className="w-3 h-3 rounded-sm bg-red-500" />EAR (thực tế)
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Đáo hạn sắp tới — 5 of 11 cols */}
        <motion.div variants={fade} className="lg:col-span-5">
          <Card className="p-5 h-full flex flex-col">
            <CardHeader
              icon="📅"
              title="Đáo hạn sắp tới"
              action={
                <Link to="/debts" className="text-blue-400 text-[12px] hover:text-blue-300 transition-colors font-medium shrink-0">
                  Xem tất cả →
                </Link>
              }
            />
            <div className="flex-1 flex flex-col">
              {debtSummary.dueThisWeek?.length > 0 ? (
                <div className="space-y-1.5">
                  {debtSummary.dueThisWeek.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between py-3 px-3.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.025)' }}
                    >
                      <div>
                        <p className="text-[13px] font-semibold text-slate-200">{d.name}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">Ngày {d.dueDay}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-red-400">{formatVND(d.minPayment)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <span className="text-5xl mb-3 block">🎉</span>
                  <p className="text-[13px] font-semibold text-slate-400">Không có nợ đáo hạn</p>
                  <p className="text-[11px] text-slate-600 mt-1">Tuyệt vời! Hãy giữ vững phong độ 💪</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════
          ROW 3 — TOP DEBTS | PIE CHART | DTI
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Top Debts */}
        <motion.div variants={fade}>
          <Card className="p-5 h-full flex flex-col">
            <CardHeader icon="🔥" title="Top nợ lớn nhất" />
            {debts.length > 0 ? (
              <div className="space-y-1 flex-1">
                {debts
                  .sort((a, b) => b.balance - a.balance)
                  .slice(0, 5)
                  .map((d, i) => (
                    <Link
                      key={d.id}
                      to={`/debts/${d.id}`}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors group"
                      style={{ '--hover-bg': 'rgba(255,255,255,0.04)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-300 truncate group-hover:text-blue-400 transition-colors">
                          {d.name}
                        </p>
                        <p className="text-[11px] text-slate-600 truncate">{d.platform}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold text-red-400">{formatVND(d.balance)}</p>
                        <p className="text-[10px] text-slate-600">EAR {formatPercent(d.ear)}</p>
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[13px] text-slate-600">Chưa có khoản nợ nào</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Platform Distribution */}
        <motion.div variants={fade}>
          <Card className="p-5 h-full flex flex-col">
            <CardHeader icon="🧩" title="Phân bổ nền tảng" />
            {platformPieData.length > 0 ? (
              <div className="flex-1 flex flex-col">
                {/* Pie — fixed height so it doesn't overflow */}
                <div className="h-[160px] w-full shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={68}
                        paddingAngle={4}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {platformPieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="space-y-2 mt-3">
                  {platformPieData.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-[12px] text-slate-400 truncate max-w-[120px]">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-slate-300">{p.value} khoản</span>
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.round((p.value / platformPieData.reduce((s, x) => s + x.value, 0)) * 60)}px`,
                            background: PIE_COLORS[i % PIE_COLORS.length] + '60',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[13px] text-slate-600">Chưa có dữ liệu</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Financial Metrics — DTI */}
        <motion.div variants={fade} className="md:col-span-2 xl:col-span-1">
          <Card className="p-5 h-full flex flex-col">
            <CardHeader icon="📐" title="Chỉ số tài chính" />
            <div className="flex-1 flex flex-col gap-4">
              {/* DTI Donut */}
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={dtiColor}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${dtiDash * circumference} ${circumference}`}
                      initial={{ strokeDasharray: `0 ${circumference}` }}
                      animate={{ strokeDasharray: `${dtiDash * circumference} ${circumference}` }}
                      transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[17px] font-bold leading-none" style={{ color: dtiColor }}>
                      {formatPercent(dtiRatio)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-slate-400">Tỉ lệ Nợ / Thu nhập</p>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{dtiLabel}</p>
                  <div
                    className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: `${dtiColor}18`, color: dtiColor }}
                  >
                    DTI Score
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Cashflow breakdown */}
              <div className="space-y-2.5">
                {[
                  { label: 'Thu nhập / tháng', value: user?.monthlyIncome || 0, color: '#10b981' },
                  { label: 'Trả nợ / tháng', value: debtSummary.totalMinPayment || 0, color: '#ef4444' },
                  { label: 'Còn lại / tháng', value: (user?.monthlyIncome || 0) - (debtSummary.totalMinPayment || 0), color: '#3b82f6' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-500">{label}</span>
                    <span className="text-[13px] font-bold" style={{ color }}>
                      {formatVND(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}