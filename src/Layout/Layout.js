import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar/Sidebar";
import Footer from "../Components/Footer/Footer";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useBranch } from "../context/BranchContext";
import { useAuth } from "../context/AuthContext";
import OrgSetupWizard from "../Components/Organisation/OrgSetupWizard";
import "./Layout.css";

function Layout() {
  const { user, isSystemAdmin } = useAuth();
  const { organization, loading: branchLoading, refreshOrganization, refreshBranches } = useBranch();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const storedOrgId = localStorage.getItem("organizationId") || localStorage.getItem("tenantId");
  const isOwner = user?.roleCode === "OWNER" || isSystemAdmin || user?.priority === 1;
  const hasNoOrg = isOwner && !organization && !user?.organizationId && !storedOrgId;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => setSidebarOpen((p) => !p);

  const handleOrgCreated = async () => {
    if (refreshOrganization) await refreshOrganization();
    if (refreshBranches) await refreshBranches();
    navigate("/dashboard");
  };

  // ── FULL SCREEN ONBOARDING WHEN OWNER LOGS IN & NO ORG EXISTS ──
  // Do NOT flash the dashboard on refresh: if user is owner and no organization is present,
  // stay immediately on the setup wizard without rendering the underlying dashboard first.
  if (hasNoOrg || (isOwner && !storedOrgId && !organization && !user?.organizationId)) {
    return (
      <div className="app-layout-fullscreen-onboarding">
        <OrgSetupWizard onOrgCreated={handleOrgCreated} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* ── Mobile hamburger ── */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          className="app-layout-menu-toggle"
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
      )}

      {/* ── Sidebar (Mini collapsed by default, smoothly expands on hover) ── */}
      <div
        className={`app-layout-sidebar${isMobile ? " is-mobile" : ""}${sidebarOpen ? " sidebar-open" : ""}${sidebarHovered ? " is-hovered" : ""}`}
        onMouseEnter={() => !isMobile && setSidebarHovered(true)}
        onMouseLeave={() => !isMobile && setSidebarHovered(false)}
      >
        {(!isMobile || sidebarOpen) && (
          <Sidebar isExpanded={sidebarHovered || sidebarOpen || isMobile} />
        )}
      </div>

      {/* ── Backdrop (mobile) ── */}
      {isMobile && sidebarOpen && (
        <div onClick={toggleSidebar} className="app-layout-backdrop" />
      )}

      {/* ── Main Workspace ── */}
      <div className="app-layout-main">
        {/* Content */}
        <div className={`app-layout-content no-scrollbar${isMobile ? " is-mobile" : ""}`}>
          <Outlet />
        </div>

        {/* Footer */}
        <div className={`app-layout-footer-wrapper${isMobile ? " is-mobile" : ""}`}>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Layout;

