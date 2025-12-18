import React from "react";
import Header from "../Components/Header/Header";
import Sidebar from "../Components/Sidebar/Sidebar";
import Footer from "../Components/Footer/Footer";
import { Outlet } from 'react-router-dom';


function Layout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "20%",
          minHeight: "100vh",
          backgroundColor: "gray",
          color: "white",
        }}
      >
        <Sidebar />
      </div>

      {/* Right Side Layout */}
      <div style={{ width: "80%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            height: "80px",
            color: "white",
          }}
        >
          <Header />
        </div>

        {/* Main Content Area */}
        <div
          style={{
            flex: 1,
            padding: "20px",
            backgroundColor: "#f5f5f5",
          }}
        >
            <Outlet />
        </div>

        {/* Footer */}
        <div
          style={{
            height: "50px",
            backgroundColor: "black",
            color: "white",
          }}
        >
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Layout;
