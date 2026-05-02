import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PublicRoute from './components/layout/PublicRoute';
import ScrollToTop from './components/layout/ScrollToTop';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AffiliatePage from './pages/AffiliatePage';
import DashboardPage from './pages/DashboardPage';
import AddDebtPage from './pages/debt/AddDebtPage';
import CustomRepaymentPlanPage from './pages/debt/CustomRepaymentPlanPage';
import DebtDetailPage from './pages/debt/DebtDetailPage';
import DebtGoalPage from './pages/debt/DebtGoalPage';
import DebtOverviewPage from './pages/debt/DebtOverviewPage';
import DtiAnalysisPage from './pages/debt/DtiAnalysisPage';
import EarAnalysisPage from './pages/debt/EarAnalysisPage';
import EditDebtPage from './pages/debt/EditDebtPage';
import RepaymentPlanPage from './pages/debt/RepaymentPlanPage';
import ExpensePage from './pages/ExpensePage';
import InvestmentPage from './pages/InvestmentPage';
import InvoicePage from './pages/InvoicePage';
import KnowledgeBasePage from './pages/knowledge/KnowledgeBasePage';
import KycPage from './pages/KycPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import MyPortfolioPage from './pages/MyPortfolioPage';
import ProfilePage from './pages/ProfilePage';
import QRConfirmPage from './pages/QRConfirmPage';
import RegisterPage from './pages/RegisterPage';
import RiskAssessmentPage from './pages/RiskAssessmentPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import UpgradePage from './pages/UpgradePage';
import WalletDetailPage from './pages/WalletDetailPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Toaster richColors position="top-right" />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/qr-confirm"
                element={
                  <ProtectedRoute>
                    <QRConfirmPage />
                  </ProtectedRoute>
                }
              />
              <Route element={<Layout />}>
                <Route path="/home" element={<DashboardPage />} />
                <Route path="/knowledge" element={<KnowledgeBasePage />} />
                <Route path="/debts" element={<DebtOverviewPage />} />
                <Route path="/debts/add" element={<AddDebtPage />} />
                <Route path="/debts/ear-analysis" element={<EarAnalysisPage />} />
                <Route path="/debts/goal" element={<DebtGoalPage />} />
                <Route path="/debts/repayment" element={<RepaymentPlanPage />} />
                <Route path="/debts/plan/:planId" element={<CustomRepaymentPlanPage />} />
                <Route path="/debts/dti" element={<DtiAnalysisPage />} />
                <Route path="/debts/:id" element={<DebtDetailPage />} />
                <Route path="/debts/:id/edit" element={<EditDebtPage />} />
                <Route path="/investment" element={<InvestmentPage />} />
                <Route path="/investment/my-portfolio" element={<MyPortfolioPage />} />
                <Route path="/risk-assessment" element={<RiskAssessmentPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/upgrade" element={<UpgradePage />} />
                <Route path="/invoice/:id" element={<InvoicePage />} />
                <Route path="/transactions" element={<TransactionHistoryPage />} />
                <Route path="/expenses" element={<ExpensePage />} />
                <Route path="/wallets/:id" element={<WalletDetailPage />} />
                <Route path="/affiliate" element={<AffiliatePage />} />
                <Route path="/kyc" element={<KycPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
