import React, { useState, useEffect } from "react";
import Header from "../Components/Header/Header";
import Sidebar from "../Components/Sidebar/Sidebar";
import Footer from "../Components/Footer/Footer";
import { Outlet, useLocation } from "react-router-dom";
import "./Layout.css";

function Layout() {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

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

  const toggleSidebar = () => setSidebarOpen(p => !p);

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

      {/* ── Sidebar ── */}
      <div className={`app-layout-sidebar${isMobile ? " is-mobile" : ""}${sidebarOpen ? " sidebar-open" : ""}`}>
        {(!isMobile || sidebarOpen) && <Sidebar />}
      </div>

      {/* ── Backdrop (mobile) ── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="app-layout-backdrop"
        />
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

