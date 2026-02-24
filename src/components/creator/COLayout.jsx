import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import { message } from "antd";
import { getSidebarWidth } from "../../utils/sidebarUtils";

// Pages
import CoChecklistPage from "../../pages/creator/CoChecklistPage";
import Reportss from "../../pages/creator/Reports";
import MyQueue from "../../pages/creator/MyQueue";
import CreatorReview from "../../pages/creator/CreatorReview";
import Completed from "../../pages/creator/Completed";
import Deferrals from "../../pages/creator/Deferrals";
import StatsReportModal from "../modals/StatsReportModal";
import CreatorSidebar from "./CreatorSidebar";
import Navbar from "../Navbar"
import Queue from "../../pages/creator/Queue";
import CompletedQueue from "../../pages/creator/CompletedQueue";
import DraftsPage from "../shared/DraftsPage";
// import CheckerSidebar from "./CheckerSidebar";
// import CheckerNavbar from "./CheckerAdmin";

const MainLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;

  const [selectedKey, setSelectedKey] = useState("creatchecklist");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768);
  const [modalOpen, setModalOpen] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState(null);
  const [reviewChecklistToRestore, setReviewChecklistToRestore] = useState(null);

  // Handle restoring a draft - check if it's a new checklist or editing existing one
  const handleRestoreDraft = (draft) => {
    // If draft has a checklistId, it's for editing an existing checklist
    if (draft.data?.checklistId || draft.data?.dclNo) {
      // This is an edit draft - should open ReviewChecklistModal
      // Navigate to My Queue first, then the modal will open with the draft data
      setSelectedKey("myqueue");
      setReviewChecklistToRestore(draft);
      message.info("Opening draft for editing...");
    } else {
      // This is a new checklist draft - should open Create DCL form
      setDraftToRestore(draft.id);
      setSelectedKey("creatchecklist");
    }
  };

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

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const renderContent = () => {
    switch (selectedKey) {
      case "creatchecklist":
        return <CoChecklistPage userId={userId} draftToRestore={draftToRestore} setDraftToRestore={setDraftToRestore} />;
      case "drafts":
        return <DraftsPage type="cocreator" onSelectDraft={handleRestoreDraft} />;
      case "myqueue":
        return <MyQueue draftToRestore={reviewChecklistToRestore} setDraftToRestore={setReviewChecklistToRestore} />;
      case "completed":
        return <Completed />;
      case "deferrals":
        return <Deferrals />;
      case "report":
        return <Reportss />;
      default:
        return <h1>Dashboard</h1>;
    }
  };

  // Calculate sidebar width based on screen size
  const sidebarWidth = getSidebarWidth(sidebarCollapsed);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", margin: 0, padding: 0, boxSizing: "border-box" }}>
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

      <CreatorSidebar
        selectedKey={selectedKey}
        setSelectedKey={setSelectedKey}
        collapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebar}
        onMenuItemClick={(e) => {
          setSelectedKey(e.key);
          // Close sidebar on mobile when menu item is clicked
          if (isMobile) setSidebarCollapsed(true);
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: isMobile ? 0 : sidebarWidth,
          width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
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
            <Route path="/" element={renderContent()} />
            <Route path="/creator/review/:id" element={<CreatorReview />} />
            <Route
              path="/reports"
              element={
                <>
                  <button onClick={() => setModalOpen(true)}>
                    Open Stats Report
                  </button>
                  <StatsReportModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                  />
                </>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
