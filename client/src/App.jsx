import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import PublicRoute from './components/layout/PublicRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DebtOverviewPage from './pages/debt/DebtOverviewPage';
import AddDebtPage from './pages/debt/AddDebtPage';
import DebtDetailPage from './pages/debt/DebtDetailPage';
import EditDebtPage from './pages/debt/EditDebtPage';
import EarAnalysisPage from './pages/debt/EarAnalysisPage';
import RepaymentPlanPage from './pages/debt/RepaymentPlanPage';
import DtiAnalysisPage from './pages/debt/DtiAnalysisPage';
import InvestmentPage from './pages/InvestmentPage';
import RiskAssessmentPage from './pages/RiskAssessmentPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import UpgradePage from './pages/UpgradePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster richColors position="top-right" />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route element={<Layout />}>
              <Route path="/home" element={<DashboardPage />} />
              <Route path="/debts" element={<DebtOverviewPage />} />
              <Route path="/debts/add" element={<AddDebtPage />} />
              <Route path="/debts/ear-analysis" element={<EarAnalysisPage />} />
              <Route path="/debts/repayment" element={<RepaymentPlanPage />} />
              <Route path="/debts/dti" element={<DtiAnalysisPage />} />
              <Route path="/debts/:id" element={<DebtDetailPage />} />
              <Route path="/debts/:id/edit" element={<EditDebtPage />} />
              <Route path="/investment" element={<InvestmentPage />} />
              <Route path="/risk-assessment" element={<RiskAssessmentPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/upgrade" element={<UpgradePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
