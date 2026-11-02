import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import TopNavbar from "../Components/Navigation/TopNavbar";
import { useBranch } from "../context/BranchContext";
import { fetchTheme } from "../redux/slices/themeSlice";
import { selectAuthUser, selectIsSystemAdmin, selectAuthStatus } from "../redux/slices/authSlice";
import OrgSetupWizard from "../Components/Organisation/OrgSetupWizard";
import LoadingSpinner from "../Components/Common/LoadingSpinner";
import Sidebar from "../Components/Sidebar/Sidebar";
import PageSkeleton from "../Components/skeleton/PageSkeleton";
import "./Layout.css";

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide sidebar completely on Dashboard and Settings
  const isDashboard = location.pathname === "/dashboard" || location.pathname === "/";
  const hideSidebar = isDashboard || location.pathname.startsWith("/settings");

  // Track if user explicitly pinned the sidebar open (persisted in localStorage)
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    try {
      return localStorage.getItem("teamhub:sidebar-pinned") === "true";
    } catch (e) {
      return false;
    }
  });

  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebarPin = () => {
    setIsSidebarPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("teamhub:sidebar-pinned", String(next));
      } catch (e) {}
      return next;
    });
  };

  // Close mobile sidebar automatically on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname, location.search]);

  // Global listeners for TopNavbar toggle button and close events
  useEffect(() => {
    const handleToggle = () => {
      if (window.innerWidth <= 768) {
        setIsMobileSidebarOpen((prev) => !prev);
      } else {
        toggleSidebarPin();
      }
    };
    const handleClose = () => setIsMobileSidebarOpen(false);

    window.addEventListener("teamhub:toggle-sidebar", handleToggle);
    window.addEventListener("teamhub:close-sidebar", handleClose);
    return () => {
      window.removeEventListener("teamhub:toggle-sidebar", handleToggle);
      window.removeEventListener("teamhub:close-sidebar", handleClose);
    };
  }, []);

  const user = useSelector(selectAuthUser);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const authStatus = useSelector(selectAuthStatus);
  const authLoading = authStatus === "loading";
  const { organization, loading: branchLoading, refreshOrganization, refreshBranches } = useBranch();

  const storedOrgId = localStorage.getItem("organizationId") || localStorage.getItem("tenantId");
  const isOwner = user?.roleCode === "OWNER" || isSystemAdmin || user?.priority === 1;
  const hasNoOrg = isOwner && !branchLoading && !authLoading && !organization && !user?.organizationId && !storedOrgId;

  // Initialize tenant theme if needed
  useEffect(() => {
    if (storedOrgId || user?.organizationId || organization) {
      dispatch(fetchTheme());
    }
  }, [dispatch, storedOrgId, user?.organizationId, organization]);

  const handleOrgCreated = async () => {
    if (refreshOrganization) await refreshOrganization();
    if (refreshBranches) await refreshBranches();
    navigate("/dashboard");
  };

  if ((branchLoading || authLoading) && !organization && !storedOrgId && !user?.organizationId) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100" style={{ background: "var(--ink-bg-canvas)" }}>
        <LoadingSpinner variant="page" message="Loading TeamHub HRMS..." />
      </div>
    );
  }

  if (hasNoOrg) {
    return (
      <div className="app-layout-fullscreen-onboarding">
        <OrgSetupWizard onOrgCreated={handleOrgCreated} />
      </div>
    );
  }

  return (
    <div className="th-app-shell">
      {/* ── Top Navigation Bar ── */}
      <TopNavbar />

      {/* ── Main App Body: Sidebar (Icon rail default, expands on hover; hidden on dashboard) + Workspace Content ── */}
      <div className="th-body-container">
        {/* Mobile Backdrop Overlay */}
        {!hideSidebar && isMobileSidebarOpen && (
          <div
            className="th-sidebar-backdrop"
            onClick={() => setIsMobileSidebarOpen(false)}
            role="presentation"
            aria-label="Close sidebar overlay"
          />
        )}

        {!hideSidebar && (
          <aside
            className={`th-sidebar-container ${isSidebarPinned ? "is-pinned is-expanded" : ""} ${isSidebarHovered ? "is-hovered" : ""} ${isMobileSidebarOpen ? "is-mobile-open is-expanded" : ""}`}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
            aria-label="Sidebar Navigation"
          >
            <Sidebar
              isHovered={isSidebarHovered}
              isPinned={isSidebarPinned}
              isMobileOpen={isMobileSidebarOpen}
              onClose={() => setIsMobileSidebarOpen(false)}
              onTogglePin={toggleSidebarPin}
            />
          </aside>
        )}
        <main
          className="th-workspace-content"
          id="main-content"
        >
          <React.Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}