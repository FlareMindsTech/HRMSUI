import React, { useState, useEffect } from "react";
import Header from "../Components/Header/Header";
import Sidebar from "../Components/Sidebar/Sidebar";
import Footer from "../Components/Footer/Footer";
import { Outlet, useLocation } from "react-router-dom";

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
    <div style={{
      display: "flex",
      height: "100vh",
      maxHeight: "100vh",
      fontFamily: "'Inter','Segoe UI',sans-serif",
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #0b1a14 0%, #0f2a1e 40%, #0a1f18 70%, #061610 100%)",
    }}>

      {/* ── Mobile hamburger ── */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          style={{
            position: "fixed", top: 14, left: 14, zIndex: 1200,
            background: "linear-gradient(135deg,#2DC58A 0%,#20a673 100%)",
            color: "#fff", border: "none", borderRadius: 8,
            width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(45,197,138,0.35)",
            fontSize: 17, fontWeight: 700,
          }}
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
      )}

      {/* ── Sidebar ── */}
      <div style={{
        width: isMobile ? (sidebarOpen ? "240px" : "0") : "220px",
        height: "100vh",
        flexShrink: 0,
        background: "rgba(255, 255, 255, 0.07)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(45, 197, 138, 0.18)",
        transition: "width 0.3s cubic-bezier(.4,0,.2,1)",
        position: isMobile ? "fixed" : "relative",
        zIndex: 1100,
        overflow: "hidden",
        boxShadow: isMobile && sidebarOpen
          ? "6px 0 32px rgba(45, 197, 138, 0.15), 0 0 0 1px rgba(45,197,138,0.08)"
          : "4px 0 32px rgba(0, 0, 0, 0.25), inset -1px 0 0 rgba(45,197,138,0.12)",
      }}>
        {(!isMobile || sidebarOpen) && <Sidebar />}
      </div>

      {/* ── Backdrop (mobile) ── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={toggleSidebar}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,25,12,0.35)",
            backdropFilter: "blur(2px)",
            zIndex: 1050,
          }}
        />
      )}

      {/* ── Main ── */}
      <div style={{
        flex: 1,
        display: "flex", flexDirection: "column",
        minWidth: 0, height: "100vh", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          height: isMobile ? 54 : 62,
          flexShrink: 0,
          background: "#fff",
          borderBottom: "1px solid #e8f0ec",
          boxShadow: "0 1px 6px rgba(0,40,20,0.05)",
          zIndex: 900,
        }}>
          <Header isMobile={isMobile} />
        </div>

        {/* Content */}
        <div
          className="no-scrollbar"
          style={{
            flex: 1,
            padding: isMobile ? "12px" : "20px 24px",
            background: "#f0f4f2",
            overflowY: "auto",
          }}
        >
          <Outlet />
        </div>

        {/* Footer */}
        <div style={{
          height: isMobile ? 28 : 34,
          flexShrink: 0,
          background: "#fff",
          borderTop: "1px solid #e8f0ec",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Layout;
