import React, { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { CheckCircle, Clock, User, Shield, FileText } from "lucide-react";
import { UserOutlined } from "@ant-design/icons";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#f0f2f5",
      }}
    >
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
          marginLeft: sidebarCollapsed ? 80 : 300,
          transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1) 0s",
          width: `calc(100% - ${sidebarCollapsed ? 80 : 300}px)`,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <div
          style={{
            padding: "24px",
            flex: 1,
            overflowY: "auto",
            background: "#f0f2f5",
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
