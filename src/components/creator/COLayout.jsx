import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";

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
// import CheckerSidebar from "./CheckerSidebar";
// import CheckerNavbar from "./CheckerAdmin";

const MainLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;

  const [selectedKey, setSelectedKey] = useState("creatchecklist");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const renderContent = () => {
    switch (selectedKey) {
      case "creatchecklist":
        return <CoChecklistPage userId={userId} />;
      case "myqueue":
        return <MyQueue />;
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

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <CreatorSidebar
        selectedKey={selectedKey}
        setSelectedKey={setSelectedKey}
        collapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebar}
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
            padding: 24,
            flex: 1,
            overflowY: "auto",
            background: "#f0f2f5",
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
