import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/auth-context';
import { AppShell } from './components/app-shell';
import { Loading } from './components/ui';
import { I18nProvider } from './i18n/i18n';
import { AccountPage } from './pages/account-page';
import { AssistantPage } from './pages/assistant-page';
import { CataloguePage } from './pages/catalogue-page';
import { InvoiceDetailPage } from './pages/invoice-detail-page';
import { InvoicesPage } from './pages/invoices-page';
import { LoginPage } from './pages/login-page';
import { OfferDetailPage } from './pages/offer-detail-page';
import { OffersPage } from './pages/offers-page';
import { TeamPage } from './pages/team-page';

function Gate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="shell">
        <Loading />
      </div>
    );
  }
  if (!user) return <LoginPage />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/catalogue" element={<CataloguePage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/offers/:id" element={<OfferDetailPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="*" element={<Navigate to="/offers" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
