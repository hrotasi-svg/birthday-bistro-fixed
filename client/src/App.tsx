import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import BookingPage from "./pages/BookingPage";
import MyBookingPage from "./pages/MyBookingPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLoginPage from "./pages/AdminLoginPage";
import MemberPage from "./pages/MemberPage";
import InviteCodePage from "./pages/InviteCodePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import MenuItemsPage from "./pages/MenuItemsPage";
import BrandInfoPage from "@/pages/BrandInfoPage";
import MainFunctionPage from "@/pages/MainFunctionPage";
import MyNpcPage from "@/pages/MyNpcPage";
import RitualPage from "@/pages/RitualPage";
import MorePage from "@/pages/MorePage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import SopPage from "@/pages/SopPage";
import TextOverridesApplier from "@/components/TextOverridesApplier";
import PageBackgroundApplier from "@/components/PageBackgroundApplier";
import VisualEditorElementsRenderer from "@/components/VisualEditorElementsRenderer";
import ExperienceWallPage from "@/pages/ExperienceWallPage";
import StoreSelectPage from "@/pages/StoreSelectPage";
import BookingCalendarPage from "@/pages/BookingCalendarPage";
import PaymentResultPage from "@/pages/PaymentResultPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/store-select" component={StoreSelectPage} />
      <Route path="/main" component={MainFunctionPage} />
      <Route path="/booking" component={BookingPage} />
      <Route path="/my-booking" component={MyBookingPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin-login" component={AdminLoginPage} />
      <Route path="/member" component={MemberPage} />
      <Route path="/invite" component={InviteCodePage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/menu" component={MenuItemsPage} />
      <Route path="/experience" component={ExperienceWallPage} />
      <Route path="/booking-calendar" component={BookingCalendarPage} />
      <Route path="/payment-result" component={PaymentResultPage} />
      <Route path="/brand" component={BrandInfoPage} />
      <Route path="/npc" component={MyNpcPage} />
      <Route path="/ritual" component={RitualPage} />
      <Route path="/more" component={MorePage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/sop" component={SopPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

/** 在 iframe 即時預覽內，將 SPA 路由切換回報給後台，以讀寫相同的 pageId。 */
function VisualEditorPreviewRouteBridge() {
  const [location] = useLocation();
  useEffect(() => {
    // Wouter navigation replaces the URL and may remove the original ?veditor=1
    // query. Frame identity remains stable, so use the actual iframe context.
    if (window.parent === window) return;
    window.parent.postMessage({ type: "birthday-bistro-editor-route", path: location }, window.location.origin);
  }, [location]);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <VisualEditorPreviewRouteBridge />
          <TextOverridesApplier />
          <PageBackgroundApplier />
          <VisualEditorElementsRenderer />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
