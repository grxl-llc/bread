import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Home, BookOpen, ShoppingCart, Package, User, Shield, LogIn } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BreadLogo from "./components/branding/BreadLogo";
import RouteTransition from "./components/shared/RouteTransition";

const BASE_TABS = [
  { name: "Feed", icon: Home, page: "Home" },
  { name: "My Recipes", icon: BookOpen, page: "Recipes" },
  { name: "Pantry", icon: Package, page: "Pantry" },
  { name: "Grocery", icon: ShoppingCart, page: "GroceryList" },
  { name: "Profile", icon: User, page: "UserProfile" },
];

const ADMIN_TABS = [
  { name: "Feed", icon: Home, page: "Home" },
  { name: "My Recipes", icon: BookOpen, page: "Recipes" },
  { name: "Pantry", icon: Package, page: "Pantry" },
  { name: "Grocery", icon: ShoppingCart, page: "GroceryList" },
  { name: "Admin", icon: Shield, page: "AdminDashboard" },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const hideNav = currentPageName === "Onboarding";
  const isAdmin = user?.is_admin || user?.email === "grxl.llc@gmail.com";
  const tabs = isAdmin ? ADMIN_TABS : BASE_TABS;

  const handleTabClick = (e, page) => {
    if (!user && page !== "Home") {
      e.preventDefault();
      navigate("/signin");
    }
  };

  if (currentPageName === "Onboarding") {
    return <div className="min-h-screen bg-[#15233A]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#15233A] flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <style>{`
        :root {
          --navy: #15233A;
          --navy-light: #1A2744;
          --navy-mid: #243352;
          --cream: #F5F5F0;
          --cream-dim: #C4C4BA;
          --accent: #FF6B35;
        }
      `}</style>

      <div className="flex-1 pb-20 overflow-y-auto overflow-x-hidden">
        {/* Header with Logo and Sign In */}
        <div className="max-w-lg mx-auto px-4 py-3 relative flex items-center justify-center">
          <BreadLogo size="2xl" />
          {!user && (
            <div className="absolute right-4 flex items-center gap-2">
              <Link
                to="/signin"
                className="flex items-center gap-1.5 text-[#C4C4BA] text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 active:scale-95 transition-transform whitespace-nowrap"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-1.5 bg-[#FF6B35] text-white text-xs font-semibold px-3 py-2 rounded-xl active:scale-95 transition-transform whitespace-nowrap"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
        <RouteTransition>
          {children}
        </RouteTransition>
      </div>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A1220] border-t border-white/5 backdrop-blur-xl" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
              const isActive = currentPageName === tab.page;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.name}
                  to={createPageUrl(tab.page)}
                  onClick={(e) => handleTabClick(e, tab.page)}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl tab-transition ${
                    isActive
                      ? "text-[#FF6B35]"
                      : "text-[#C4C4BA]/50 hover:text-[#C4C4BA]/80"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[10px] font-medium tracking-wide">{tab.name}</span>
                </Link>
              );
            })}
          </div>

        </nav>
      )}
    </div>
  );
}