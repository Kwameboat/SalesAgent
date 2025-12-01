import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSeller } from '@/hooks/useSeller';
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';
import OnboardingPage from '@/pages/OnboardingPage';
import AddProductPage from '@/pages/AddProductPage';
import DashboardPage from '@/pages/DashboardPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import InsightsPage from '@/pages/InsightsPage';
import { Toaster } from '@/components/ui/sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-ghana-green border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

function SellerRoute({ children }: { children: React.ReactNode }) {
  const { seller, loading: sellerLoading } = useSeller();
  const { loading: authLoading } = useAuth();

  if (authLoading || sellerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-ghana-green border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!seller) {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-product"
          element={
            <ProtectedRoute>
              <SellerRoute>
                <AddProductPage />
              </SellerRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <SellerRoute>
                <DashboardPage />
              </SellerRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:id"
          element={
            <ProtectedRoute>
              <SellerRoute>
                <ProductDetailPage />
              </SellerRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <SellerRoute>
                <InsightsPage />
              </SellerRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
