import React, { useState, useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import { Inbox, CheckCircle, BarChart2, FileEdit } from "lucide-react";
import { getSidebarWidth } from "../../utils/sidebarUtils";

import Navbar from "../Navbar";
import SharedSidebar from "../common/SharedSidebar";

// Pages
import AllChecklists from "../../pages/checker/allChecklists";
import CompletedChecklists from "../../pages/checker/Completed";
import Reportss from "../../pages/creator/Reports";
import Deferrals from "../../pages/checker/Deferral";
import DraftsPage from "../../components/shared/DraftsPage";

const CheckerLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;

  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState("myQueue");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const [draftToRestore, setDraftToRestore] = useState(null);

  // Handle restoring a draft - navigate to MyQueue and pass draft data
  const handleRestoreDraft = (draft) => {
    console.log("🔄 CheckerLayout - handleRestoreDraft called with:", draft);
    if (draft.data?.checklistId || draft.data?.dclNo) {
      // Set draft first, then navigate to ensure AllChecklists receives the draft
      setDraftToRestore(draft);
      setSelectedKey("myQueue");

      // Navigate to myQueue to trigger the page load
      navigate("/cochecker/myQueue");
    }
  };

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 375;
      const tablet = window.innerWidth < 768;
      setIsMobile(mobile);
      setCollapsed(tablet);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      key: "drafts",
      icon: <FileEdit size={18} style={{ color: "#e5e7eb" }} />,
      label: "Drafts",
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
    // Close sidebar on mobile when menu item is clicked
    if (isMobile) setCollapsed(true);
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
      {isMobile && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
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
          marginLeft: isMobile ? 0 : getSidebarWidth(collapsed),
          width: isMobile ? "100%" : `calc(100% - ${getSidebarWidth(collapsed)}px)`,
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
            <Route path="/" element={<AllChecklists userId={userId} draftToRestore={draftToRestore} setDraftToRestore={setDraftToRestore} />} />
            <Route
              path="/myQueue"
              element={<AllChecklists userId={userId} draftToRestore={draftToRestore} setDraftToRestore={setDraftToRestore} />}
            />
            <Route
              path="/completed"
              element={<CompletedChecklists userId={userId} />}
            />
            <Route path="/deferrals" element={<Deferrals userId={userId} />} />
            <Route path="/drafts" element={<DraftsPage type="checker" onSelectDraft={handleRestoreDraft} />} />
            <Route path="/reports" element={<Reportss />} />
          </Routes>
        </div>

        <footer
          style={{
            background: "#ffffff",
            borderTop: "1px solid #e5e7eb",
            padding: isMobile ? "12px 16px" : "16px 24px",
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
