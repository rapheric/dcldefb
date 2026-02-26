// export default AllChecklists;
import React, { useState, useEffect } from "react";
import { Table, Button, Divider } from "antd";
import ChecklistsPage from "./ChecklistsPage.jsx";
import CheckerReviewChecklistModal from "../../components/modals/CheckerReviewChecklistModalComponents/CheckerReviewChecklistModal";
import { useGetCheckerMyQueueQuery } from "../../api/checklistApi.js";

const PRIMARY_BLUE = "#164679";
const SECONDARY_PURPLE = "#7e6496";
const LIGHT_YELLOW = "#fcd716";

const AllChecklists = ({ userId, draftToRestore = null, setDraftToRestore = null }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle draft restoration - open modal with draft data
  useEffect(() => {
    if (draftToRestore && draftToRestore.data) {
      // Reconstruct checklist object from draft data
      const draftChecklist = {
        id: draftToRestore.data.checklistId || draftToRestore.id,
        _id: draftToRestore.data.checklistId || draftToRestore.id,
        dclNo: draftToRestore.data.dclNo,
        title: draftToRestore.data.title,
        customerName: draftToRestore.data.customerName,
        customerNumber: draftToRestore.data.customerNumber,
        loanType: draftToRestore.data.loanType,
        status: draftToRestore.data.status,
        // Documents are in flat format, modal will handle them
        documents: draftToRestore.data.documents || [],
      };

      setSelectedChecklist(draftChecklist);

      // Clear the draft restore after opening
      if (setDraftToRestore) {
        setDraftToRestore(null);
      }
    }
  }, [draftToRestore, setDraftToRestore]);

  // ✅ FIX: Use the dedicated endpoint that filters by checker ID on the backend
  const { data: myChecklists = [], refetch } =
    useGetCheckerMyQueueQuery(userId);

  console.log("🔍 All Checklists for Co-Checker:", myChecklists);
  console.log("📋 Total checklists fetched:", myChecklists.length);
  console.log("👤 Current User ID:", userId);

  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      render: (text) => (
        <span style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>{text}</span>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      render: (text) => (
        <span style={{ color: SECONDARY_PURPLE }}>{text || "N/A"}</span>
      ),
    },
    {
      title: "Customer Number",
      dataIndex: "customerNumber",
      render: (text) => (
        <span style={{ fontWeight: "500", color: PRIMARY_BLUE }}>
          {text || "N/A"}
        </span>
      ),
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
    },
    {
      title: "Assigned RM",
      dataIndex: "assignedToRM",
      render: (rm) => (
        <span style={{ color: PRIMARY_BLUE }}>
          {rm?.name || "Not Assigned"}
        </span>
      ),
    },
    {
      title: "# Docs",
      dataIndex: "documents",
      render: (docs) => (
        <span
          style={{
            backgroundColor: LIGHT_YELLOW,
            padding: "2px 8px",
            borderRadius: 12,
            fontWeight: "bold",
          }}
        >
          {docs?.length || 0}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const lowerStatus = status?.toLowerCase();
        let display = status || "Pending Checker";
        let color = PRIMARY_BLUE;

        switch (lowerStatus) {
          case "co_creator_review":
            color = "#faad14"; // yellow
            display = "Co-Creator Review";
            break;
          case "rm_review":
            color = "#1890ff"; // blue
            display = "RM Review";
            break;
          case "co_checker_review":
            color = "#52c41a"; // green
            display = "Co-Checker Review";
            break;
          case "approved":
            color = "#52c41a";
            break;
          case "rejected":
            color = "#ff4d4f";
            break;
          case "pending":
            color = "#faad14";
            break;
          default:
            color = PRIMARY_BLUE;
        }

        return (
          <span style={{ fontWeight: "bold", color: color }}>{display}</span>
        );
      },
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          style={{ color: SECONDARY_PURPLE, fontWeight: "bold" }}
          onClick={() => setSelectedChecklist(record)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* Drawer for creating new DCL */}
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

      <Divider style={{ margin: "12px 0" }}>DCLs Assigned</Divider>

      <Table
        columns={columns}
        dataSource={myChecklists}
        rowKey="_id"
        pagination={{ pageSize: 5, showSizeChanger: true }}
        onRow={(record) => ({
          onClick: () => setSelectedChecklist(record),
          style: { cursor: "pointer" },
        })}
      />

      {selectedChecklist && (
        <CheckerReviewChecklistModal
          checklist={selectedChecklist}
          open={!!selectedChecklist}
          onClose={() => {
            setSelectedChecklist(null);
            refetch();
          }}
          sidebarWidth={300}
          sidebarCollapsed={sidebarCollapsed}
        />
      )}
    </div>
  );
};

export default AllChecklists;
