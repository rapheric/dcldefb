import React, { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import { Inbox, CheckCircle, BarChart2 } from "lucide-react";

import Navbar from "../Navbar";
import SharedSidebar from "../common/SharedSidebar";

// Pages
import AllChecklists from "../../pages/checker/allChecklists";
import CompletedChecklists from "../../pages/checker/Completed";
import Reportss from "../../pages/creator/Reports";
import Deferrals from "../../pages/checker/Deferral";

const CheckerLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;

  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState("myQueue");
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  const menuItems = [
    {
      key: "myQueue",
      icon: <Inbox size={18} style={{ color: "#e5e7eb" }} />,
      label: "My Queue",
    },
    {
      key: "completed",
      icon: <CheckCircle size={18} style={{ color: "#e5e7eb" }} />,
      label: "Completed",
    },
    {
      key: "deferrals",
      icon: <BarChart2 size={18} style={{ color: "#e5e7eb" }} />,
      label: "Deferrals",
    },
    {
      key: "reports",
      icon: <BarChart2 size={18} style={{ color: "#e5e7eb" }} />,
      label: "Reports",
    },
  ];

  const handleClick = (e) => {
    setSelectedKey(e.key);
    navigate(`/cochecker/${e.key}`);
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
        collapsed={collapsed}
        toggleCollapse={toggleSidebar}
        menuItems={menuItems}
        title="CO Checker"
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: collapsed ? 80 : 300,
          transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1) 0s",
          width: `calc(100% - ${collapsed ? 80 : 300}px)`,
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
            <Route path="/" element={<AllChecklists userId={userId} />} />
            <Route
              path="/myQueue"
              element={<AllChecklists userId={userId} />}
            />
            <Route
              path="/completed"
              element={<CompletedChecklists userId={userId} />}
            />
            <Route path="/deferrals" element={<Deferrals userId={userId} />} />
            <Route path="/reports" element={<Reportss />} />
          </Routes>
        </div>

        <footer
          style={{
            background: "#ffffff",
            borderTop: "1px solid #e5e7eb",
            padding: "16px 24px",
            textAlign: "center",
            fontSize: 12,
            color: "#6b7280",
            flexShrink: 0,
            width: "100%",
          }}
        >
          © {new Date().getFullYear()} NCBA Bank PLC. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
};

export default CheckerLayout;
