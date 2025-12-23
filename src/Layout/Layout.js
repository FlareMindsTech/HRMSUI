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
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

 
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        position: "relative",
      }}
    >
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            top: "15px",
            left: "15px",
            zIndex: 1100,
            backgroundColor: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "6px",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            fontSize: "20px",
          }}
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
      )}

      {/* Sidebar */}
      <div
        style={{
          width: isMobile ? (sidebarOpen ? "280px" : "0") : "240px",
          maxWidth: isMobile && sidebarOpen ? "85%" : "none",
          minHeight: "100vh",
          backgroundColor: "#1e1e2f",
          transition: "width 0.3s ease",
          position: isMobile ? "fixed" : "relative",
          zIndex: 1000,
          overflow: "hidden",
          boxShadow:
            isMobile && sidebarOpen
              ? "5px 0 25px rgba(0,0,0,0.3)"
              : "none",
        }}
      >
        {(!isMobile || sidebarOpen) && <Sidebar />}
      </div>

      {/* Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
        />
      )}

      {/* Right Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          width: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            height: isMobile ? "60px" : "70px",
            backgroundColor: "#1e1e2f",
            color: "white",
            display: "flex",
            alignItems: "center",
            padding: isMobile ? "0 15px 0 60px" : "0 30px",
            position: "sticky",
            top: 0,
            zIndex: 900,
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <Header isMobile={isMobile} />
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            padding: isMobile ? "15px" : "25px 30px",
            backgroundColor: "#f8fafc",
            overflowY: "auto",
          }}
        >
          <Outlet />
        </div>

        {/* Footer */}
        <div
          style={{
            height: isMobile ? "50px" : "60px",
            backgroundColor: "#2c3e50",
            color: "#e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isMobile ? "12px" : "14px",
            borderTop: "1px solid #34495e",
          }}
        >
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Layout;
