import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DebtOverviewPage from './pages/debt/DebtOverviewPage';
import AddDebtPage from './pages/debt/AddDebtPage';
import DebtDetailPage from './pages/debt/DebtDetailPage';
import EarAnalysisPage from './pages/debt/EarAnalysisPage';
import RepaymentPlanPage from './pages/debt/RepaymentPlanPage';
import InvestmentPage from './pages/InvestmentPage';
import RiskAssessmentPage from './pages/RiskAssessmentPage';
import ProfilePage from './pages/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/debts" element={<DebtOverviewPage />} />
              <Route path="/debts/add" element={<AddDebtPage />} />
              <Route path="/debts/ear-analysis" element={<EarAnalysisPage />} />
              <Route path="/debts/repayment" element={<RepaymentPlanPage />} />
              <Route path="/debts/:id" element={<DebtDetailPage />} />
              <Route path="/investment" element={<InvestmentPage />} />
              <Route path="/risk-assessment" element={<RiskAssessmentPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
