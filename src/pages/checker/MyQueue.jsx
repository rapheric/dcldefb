import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Table, Divider, Button, Tag, Spin, Empty } from "antd";
import CheckerReviewChecklistModal from "../../components/modals/CheckerReviewChecklistModal.jsx";
import { useGetCheckerMyQueueQuery } from "../../api/checklistApi.js";

const PRIMARY_BLUE = "#164679";
const SECONDARY_PURPLE = "#7e6496";
const SUCCESS_GREEN = "#52c41a";
const PENDING_ORANGE = "#faad14";

const MyQueuePage = () => {
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  // Get checker ID from Redux auth
  const auth = useSelector((state) => state.auth);
  const checkerId = auth?.id || auth?._id;

  // 🔍 DEBUG LOGS
  console.log("🔍 MyQueue Component Loaded");
  console.log("📋 Auth State:", auth);
  console.log("🔑 Checker ID:", checkerId);
  console.log("🔐 Auth ID fields:", { id: auth?.id, _id: auth?._id });

  // Fetch checklists assigned to this checker for review
  const {
    data: myQueue = [],
    isLoading,
    error,
    refetch,
  } = useGetCheckerMyQueueQuery(checkerId, {
    skip: !checkerId, // Skip query if no checkerId
  });

  // 🔍 DEBUG: Log API response
  console.log("📊 My Queue Data:", myQueue);
  console.log("⏳ Is Loading:", isLoading);
  console.log("❌ API Error:", error);
  console.log("🚀 Query Endpoint: /checkerChecklist/my-queue/" + checkerId);

  /**
   * ✅ PENDING CHECKLISTS FOR THIS CHECKER
   * These are checklists in CoCheckerReview status assigned to this specific checker
   */
  const pendingChecklists = useMemo(() => {
    const filtered = myQueue.filter(
      (c) =>
        c.status?.toLowerCase() === "cocheckerreview" ||
        c.status?.toLowerCase() === "co_checker_review",
    );
    console.log(
      "🔍 Filtering checklists by status 'cocheckerreview'/'co_checker_review'",
    );
    console.log("📋 All queue items:", myQueue);
    console.log("✅ Filtered pending checklists:", filtered);
    console.log("Status comparison - Sample item status:", myQueue[0]?.status);
    return filtered;
  }, [myQueue]);

  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 120,
      render: (text) => (
        <span style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>{text}</span>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 150,
      render: (text) => (
        <span style={{ color: SECONDARY_PURPLE }}>{text || "N/A"}</span>
      ),
    },
    {
      title: "Customer Number",
      dataIndex: "customerNumber",
      width: 110,
      render: (text) => (
        <span style={{ fontWeight: 500, color: PRIMARY_BLUE }}>
          {text || "N/A"}
        </span>
      ),
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      width: 120,
      render: (text) => (
        <span style={{ color: SECONDARY_PURPLE }}>{text || "−"}</span>
      ),
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 80,
      render: (docs) => {
        const totalDocs =
          docs?.reduce((sum, cat) => sum + (cat.docList?.length || 0), 0) || 0;
        return <span>{totalDocs}</span>;
      },
    },
    {
      title: "Co-Creator",
      dataIndex: "createdBy",
      width: 130,
      render: (creator) => (
        <span style={{ color: PRIMARY_BLUE }}>{creator?.name || "N/A"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 110,
      render: (status) => {
        const isReview =
          (status || "").toLowerCase() === "cocheckerreview" ||
          (status || "").toLowerCase() === "co_checker_review";
        return (
          <Tag
            color={isReview ? PENDING_ORANGE : SUCCESS_GREEN}
            style={{ fontWeight: "bold", padding: "2px 6px", fontSize: 11 }}
          >
            {isReview ? "Pending Review" : "Approved"}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          style={{ fontWeight: "bold", color: SECONDARY_PURPLE }}
          onClick={() => setSelectedChecklist(record)}
        >
          Review
        </Button>
      ),
    },
  ];

  if (isLoading) {
    console.log("⏳ Component in loading state...");
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <style>{`
        .my-queue-table {
          background-color: white !important;
        }
        .my-queue-table .ant-table-cell {
          background-color: white !important;
        }
        .my-queue-table .ant-table-tbody > tr > td {
          background-color: transparent !important;
        }
        .my-queue-table .ant-table-tbody > tr:nth-child(n) > td:nth-child(6) {
          background-color: transparent !important;
          color: #000 !important;
        }
        .my-queue-table span[style*="fontWeight"] {
          background-color: transparent !important;
          color: #000 !important;
        }
        .my-queue-table .ant-badge {
          display: none !important;
        }
      `}</style>
      <Divider style={{ margin: "12px 0" }}>
        🔍 My Review Queue ({pendingChecklists.length})
      </Divider>
      {console.log(
        "🎯 Final render - Pending checklists count:",
        pendingChecklists.length,
      )}

      {pendingChecklists.length === 0 ? (
        <Empty
          description="No checklists pending review"
          style={{ marginTop: 50 }}
        />
      ) : (
        <Table
          className="my-queue-table"
          columns={columns}
          dataSource={pendingChecklists}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          onRow={(record) => ({
            onClick: () => setSelectedChecklist(record),
            style: { cursor: "pointer" },
          })}
        />
      )}

      {selectedChecklist && (
        <CheckerReviewChecklistModal
          checklist={selectedChecklist}
          open={!!selectedChecklist}
          onClose={() => {
            setSelectedChecklist(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default MyQueuePage;
