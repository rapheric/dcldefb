// CoChecklistPage.jsx
import React, { useState } from "react";
import { Button, Divider, Tabs } from "antd";
import ChecklistsPage from "./ChecklistsPageCreator";
import ChecklistTable from "./ChecklistTable"; // We'll keep table reusable
import ReviewChecklistModal from "../../components/modals/ReviewChecklistModalComponents/ReviewChecklistModal";
import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";

const { TabPane } = Tabs;

const Queue = ({ userId }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  const { data: checklists = [], refetch } =
    useGetAllCoCreatorChecklistsQuery();

  // Filtered queues
  const myCurrentQueue = checklists.filter(
    (c) =>
      c.createdBy?._id === userId &&
      ["co_creator_review", "rm_review"].includes(c.status?.toLowerCase()),
  );

  console.log(myCurrentQueue);

  const myPreviousQueue = checklists.filter(
    (c) =>
      c.createdBy?._id === userId &&
      c.status?.toLowerCase() === "co_checker_review",
  );

  return (
    <div style={{ padding: 16 }}>
      <Button
        type="primary"
        onClick={() => setDrawerOpen(true)}
        className="create-dcl-btn"
        style={{
          background: "linear-gradient(180deg, #164679 0%, #0f3a56 100%)",
          borderColor: "transparent",
          color: "#fff !important",
          fontWeight: 600,
          fontSize: "14px",
          padding: "8px 24px",
          height: "auto",
          borderRadius: "6px",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.boxShadow = "0 4px 12px rgba(22, 70, 121, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.target.style.boxShadow = "none";
        }}
      >
        Create New DCL
      </Button>

      {drawerOpen && (
        <ChecklistsPage
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            refetch();
          }}
          coCreatorId={userId}
        />
      )}

      <Divider>My Checklists</Divider>

      <Tabs defaultActiveKey="current" type="line">
        <TabPane tab="Current Queue" key="current">
          <ChecklistTable data={myCurrentQueue} onView={setSelectedChecklist} />
        </TabPane>
        <TabPane tab="Previous Queue" key="previous">
          <ChecklistTable
            data={myPreviousQueue}
            onView={setSelectedChecklist}
          />
        </TabPane>
      </Tabs>

      {selectedChecklist && (
        <ReviewChecklistModal
          checklist={selectedChecklist}
          open={!!selectedChecklist}
          onClose={() => setSelectedChecklist(null)}
        />
      )}
    </div>
  );
};

export default Queue;
