import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../Components/Sidebar/Sidebar";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useBranch } from "../context/BranchContext";
import { fetchTheme } from "../redux/slices/themeSlice";
import { selectAuthUser, selectIsSystemAdmin, selectAuthStatus } from "../redux/slices/authSlice";
import OrgSetupWizard from "../Components/Organisation/OrgSetupWizard";
import "./Layout.css";

function Layout() {
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const authStatus = useSelector(selectAuthStatus);
  const authLoading = authStatus === 'loading';
  const { organization, loading: branchLoading, refreshOrganization, refreshBranches } = useBranch();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const storedOrgId = localStorage.getItem("organizationId") || localStorage.getItem("tenantId");
  const isOwner = user?.roleCode === "OWNER" || isSystemAdmin || user?.priority === 1;
  const hasNoOrg = isOwner && !branchLoading && !authLoading && !organization && !user?.organizationId && !storedOrgId;

  // Initialize theme for authenticated tenant context
  useEffect(() => {
    if (storedOrgId || user?.organizationId || organization) {
      dispatch(fetchTheme());
    }
  }, [dispatch, storedOrgId, user?.organizationId, organization]);

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

  // ── Show subtle loader while checking initial context ──
  if ((branchLoading || authLoading) && !organization && !storedOrgId && !user?.organizationId) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-warning mb-2" role="status" />
          <div className="small text-muted fw-semibold">Loading TeamHub HRMS...</div>
        </div>
      </div>
    );
  }

  // ── FULL SCREEN ONBOARDING WHEN OWNER LOGS IN & NO ORG EXISTS ──
  if (hasNoOrg) {
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
          aria-expanded={sidebarOpen}
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
        <div onClick={toggleSidebar} className="app-layout-backdrop" aria-hidden="true" />
      )}

      {/* ── Main Workspace ── */}
      <div className="app-layout-main">
        {/* Header */}
        <div className={`app-layout-header-wrapper${isMobile ? " is-mobile" : ""}`}>
          <Header isMobile={isMobile} />
        </div>

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

