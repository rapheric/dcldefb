import React, { useState, useEffect } from "react";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import { getSidebarWidth } from "../../utils/sidebarUtils";
import {
  CheckCircle,
  Inbox,
  BarChart2,
  Clock,
  FileText,
  ListChecks,
  FileEdit,
} from "lucide-react";

// Import your RM components
import MyQueue from "../../pages/rm/MyQueue";
import Completed from "../../pages/rm/Completed";
import ReportsPage from "../../pages/rm/Reports";
import Navbar from "../Navbar";
import SharedSidebar from "../common/SharedSidebar";
import DraftsPage from "../shared/DraftsPage";

// Import Deferral Components
import DeferralForm from "../../pages/deferrals/DeferralForm";
import DeferralPending from "../../pages/deferrals/DeferralPending";
import Reports from "../../pages/creator/Reports";

const RmLayout = ({ userId, rmId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState("myqueue");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768);
  const [draftToRestore, setDraftToRestore] = useState(null);

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

  // 🔄 Sync selectedKey with current route
  useEffect(() => {
    const pathname = location.pathname;
    
    if (pathname.includes("/deferrals")) {
      setSelectedKey("deferral");
    } else if (pathname.includes("/completed")) {
      setSelectedKey("completed");
    } else if (pathname.includes("/reports")) {
      setSelectedKey("reports");
    } else if (pathname.includes("/myqueue") || pathname === "/rm" || pathname === "/rm/") {
      setSelectedKey("myqueue");
    }
  }, [location.pathname]);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  // Handle restoring a draft - navigate to MyQueue and pass draft data
  const handleRestoreDraft = (draft) => {
    console.log("🔄 RmLayout - handleRestoreDraft called with:", draft);
    if (draft.data?.checklistId || draft.data?.dclNo) {
      // Set draft first, then navigate to ensure MyQueue receives the draft
      setDraftToRestore(draft);
      setSelectedKey("myqueue");

      // Navigate to myqueue to trigger the page load
      navigate("/rm/myqueue");
    }
  };

  const menuItems = [
    {
      key: "myqueue",
      label: "My Queue",
      icon: <Inbox size={18} style={{ color: "#e5e7eb" }} />,
    },
    {
      key: "drafts",
      label: "Drafts",
      icon: <FileEdit size={18} style={{ color: "#e5e7eb" }} />,
    },
    {
      key: "completed",
      label: "Completed",
      icon: <CheckCircle size={18} style={{ color: "#e5e7eb" }} />,
    },
    {
      key: "deferral",
      label: "Deferrals",
      icon: <Clock size={16} style={{ color: "#e5e7eb" }} />,
    },
    {
      key: "reports",
      label: "Reports",
      icon: <BarChart2 size={18} style={{ color: "#e5e7eb" }} />,
    },
  ];

  const handleClick = (e) => {
    console.log("Menu clicked:", e.key);

    setSelectedKey(e.key);

    // Handle special routes
    if (e.key === "deferral") {
      navigate("/rm/deferrals/pending");
    } else {
      navigate(`/rm/${e.key}`);
    }

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
      />
      
      {/* Calculate sidebar width based on screen size */}
      {/* < 768px: Fully collapsed/hidden */}
      {/* 768px - 1099px: Half size (40→150px) */}
      {/* >= 1100px: Full size (80→300px) */}
      
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
            {/* Main RM Routes */}
            <Route
              path="/"
              element={<MyQueue userId={userId || "rm_current"} draftToRestore={draftToRestore} setDraftToRestore={setDraftToRestore} />}
            />
            <Route
              path="/myqueue"
              element={<MyQueue userId={userId || "rm_current"} draftToRestore={draftToRestore} setDraftToRestore={setDraftToRestore} />}
            />
            <Route
              path="/drafts"
              element={<DraftsPage type="rm" onSelectDraft={handleRestoreDraft} />}
            />
            <Route
              path="/completed"
              element={<Completed userId={userId || "rm_current"} />}
            />
            <Route
              path="/reports"
              element={<Reports userId={userId || "rm_current"} />}
            />

            {/* Deferral Routes */}
            <Route path="/deferrals">
              <Route
                path="request"
                element={<DeferralForm userId={userId || "rm_current"} />}
              />
              <Route
                path="pending"
                element={<DeferralPending userId={userId || "rm_current"} />}
              />
            </Route>
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default RmLayout;
