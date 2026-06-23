import SignIn from './pages/SignIn.jsx';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Tutorials from './pages/Tutorials';
import AdminDashboard from './pages/AdminDashboard';
import PublicProfile from './pages/PublicProfile';
import Chat from './pages/Chat';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CreatorFAQ from './pages/CreatorFAQ';
import BrandOpportunities from './pages/BrandOpportunities';
import DataDeletionRequest from './pages/DataDeletionRequest';
import CreatorApplication from './pages/CreatorApplication';
import CreatorPayoutHistory from './pages/CreatorPayoutHistory';
import BrandApplication from './pages/BrandApplication';
import AccountSettings from './pages/AccountSettings';
import NotificationPreferences from './pages/NotificationPreferences';
import SubscriptionManagement from './pages/SubscriptionManagement';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PostSignupOnboarding from './pages/PostSignupOnboarding';
import RegisterPage from './pages/RegisterPage';
import SignInPage from './pages/SignInPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RecipeSearch from './pages/RecipeSearch';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Redirect creators to their dashboard on first load, and new users to onboarding
function CreatorRedirect() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoadingAuth || !user) return;
    
    // Check if on home page and needs signup onboarding
    const isHome = location.pathname === "/" || location.pathname === "/Home";
    if (isHome && user && !user.signup_onboarding_complete) {
      navigate("/post-signup-onboarding", { replace: true });
      return;
    }
    
    // Redirect creators to their dashboard
    if (isHome && user.is_creator && user.email !== "grxl.llc@gmail.com") {
      navigate("/CreatorDashboard", { replace: true });
    }
    if (isHome && user.email === "grxl.llc@gmail.com") {
      navigate("/AdminDashboard", { replace: true });
    }

  }, [user, isLoadingAuth, location.pathname]);

  return null;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    // auth_required — allow rendering so public Home feed is visible
  }

  // Render the main app
  return (
    <>
    <CreatorRedirect />
    <Routes>
      <Route path="/AdminDashboard" element={
        user?.email === "grxl.llc@gmail.com"
          ? <LayoutWrapper currentPageName="AdminDashboard"><AdminDashboard /></LayoutWrapper>
          : <PageNotFound />
      } />
      <Route path="/login" element={<SignIn />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/RecipeSearch" element={
        <LayoutWrapper currentPageName="RecipeSearch"><RecipeSearch /></LayoutWrapper>
      } />
      <Route path="/post-signup-onboarding" element={<PostSignupOnboarding />} />
      <Route path="/" element={
        <LayoutWrapper currentPageName="Home">
          <MainPage />
        </LayoutWrapper>
      }/>
      <Route path="/Home" element={
        <LayoutWrapper currentPageName="Home">
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Tutorials" element={<LayoutWrapper currentPageName="Tutorials"><Tutorials /></LayoutWrapper>} />
      <Route path="/PublicProfile" element={<LayoutWrapper currentPageName="PublicProfile"><PublicProfile /></LayoutWrapper>} />
      <Route path="/Chat" element={<LayoutWrapper currentPageName="Chat"><Chat /></LayoutWrapper>} />
      <Route path="/TermsOfService" element={<LayoutWrapper currentPageName="TermsOfService"><TermsOfService /></LayoutWrapper>} />
      <Route path="/PrivacyPolicy" element={<LayoutWrapper currentPageName="PrivacyPolicy"><PrivacyPolicy /></LayoutWrapper>} />
      <Route path="/CreatorFAQ" element={<LayoutWrapper currentPageName="CreatorFAQ"><CreatorFAQ /></LayoutWrapper>} />
      <Route path="/BrandOpportunities" element={<LayoutWrapper currentPageName="BrandOpportunities"><BrandOpportunities /></LayoutWrapper>} />
      <Route path="/DataDeletionRequest" element={<LayoutWrapper currentPageName="DataDeletionRequest"><DataDeletionRequest /></LayoutWrapper>} />
      <Route path="/CreatorApplication" element={<LayoutWrapper currentPageName="CreatorApplication"><CreatorApplication /></LayoutWrapper>} />
      <Route path="/CreatorPayoutHistory" element={<LayoutWrapper currentPageName="CreatorPayoutHistory"><CreatorPayoutHistory /></LayoutWrapper>} />
      <Route path="/BrandApplication" element={<LayoutWrapper currentPageName="BrandApplication"><BrandApplication /></LayoutWrapper>} />
      <Route path="/AccountSettings" element={<LayoutWrapper currentPageName="AccountSettings"><AccountSettings /></LayoutWrapper>} />
      <Route path="/NotificationPreferences" element={<LayoutWrapper currentPageName="NotificationPreferences"><NotificationPreferences /></LayoutWrapper>} />
      <Route path="/SubscriptionManagement" element={<LayoutWrapper currentPageName="SubscriptionManagement"><SubscriptionManagement /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App