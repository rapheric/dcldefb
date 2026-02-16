import React, { useState, useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { CheckCircle, Clock, User, Shield, FileText } from "lucide-react";
import { UserOutlined } from "@ant-design/icons";
import { getSidebarWidth } from "../../utils/sidebarUtils";

import AdminDashboard from "../../pages/admin/AdminDashboard.jsx";
import CreateUserDrawer from "../../pages/admin/createUserDrawer.jsx";
import LiveUsers from "../../pages/admin/LiveUsers.jsx";
import AuditLogsPage from "../../pages/admin/AuditLogsPage";
import Navbar from "../Navbar.jsx";
import SharedSidebar from "../common/SharedSidebar";
import DeactivatedUsers from "../../pages/admin/DeactivatedUsers.jsx";

const AdminLayout = () => {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState("all-users");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 375;
      const tablet = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarCollapsed(tablet);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keep form data state for the drawer
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "rm",
  });

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const menuItems = [
    {
      key: "all-users",
      label: "All Users",
      icon: <CheckCircle size={18} style={{ color: "#e5e7eb" }} />,
    },

    {
      key: "deactivated-users",
      label: "Deactivated Users",
      icon: <CheckCircle size={18} style={{ color: "#e5e7eb" }} />,
    },

    {
      key: "live-users",
      label: "Live Users",
      icon: <UserOutlined style={{ color: "#e5e7eb", fontSize: "18px" }} />,
    },
    {
      key: "audit-logs",
      label: "Audit Logs",
      icon: <Clock size={18} style={{ color: "#e5e7eb" }} />,
    },
  ];

  const handleClick = (e) => {
    setSelectedKey(e.key);
    navigate(`/admin/${e.key}`);
    // Close sidebar on mobile when menu item is clicked
    if (isMobile) setSidebarCollapsed(true);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "#f0f2f5",
        boxSizing: "border-box",
      }}
    >
      {/* Overlay for mobile sidebar */}
      {isMobile && !sidebarCollapsed && (
        <div
          onClick={() => setSidebarCollapsed(true)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 99,
          }}
        />
      )}
      
      <SharedSidebar
        selectedKey={selectedKey}
        setSelectedKey={setSelectedKey}
        onMenuItemClick={handleClick}
        collapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebar}
        menuItems={menuItems}
        title="Admin Dashboard"
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: isMobile ? 0 : getSidebarWidth(sidebarCollapsed),
          width: isMobile ? "100%" : `calc(100% - ${getSidebarWidth(sidebarCollapsed)}px)`,
          maxWidth: "100vw",
          transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1) 0s",
          height: "100vh",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <div
          style={{
            padding: isMobile ? "8px 2px" : "24px",
            margin: 0,
            width: "100%",
            flex: 1,
            overflowY: "auto",
            overflowX: isMobile ? "auto" : "hidden",
            background: "#f0f2f5",
            boxSizing: "border-box",
          }}
        >
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/all-users" element={<AdminDashboard />} />
            <Route path="/live-users" element={<LiveUsers />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/deactivated-users" element={<DeactivatedUsers />} />
          </Routes>
        </div>

        {/* Drawer for creating users - kept from original layout */}
        <CreateUserDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          formData={formData}
          setFormData={setFormData}
          loading={false}
          onCreate={() => {
            console.log("FORM VALUES:", formData);
            setFormData({ name: "", email: "", password: "", role: "rm" });
            setDrawerOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default AdminLayout;
