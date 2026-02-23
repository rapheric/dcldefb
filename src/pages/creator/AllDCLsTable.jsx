import { Table, Tag, Spin, Empty } from "antd";
import { useState, useEffect } from "react";
import {
  FileTextOutlined,
  CustomerServiceOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import { formatDate } from "../../utils/checklistUtils";
import { getStatusColor } from "../../utils/statusColors";
import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";

import {
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";

import ReviewChecklistModal from "../../components/modals/ReviewChecklistModalComponents/ReviewChecklistModal";
import RmReviewChecklistModal from "../../components/modals/RmReviewChecklistModalComponents/RmReviewChecklistModal";
import CheckerReviewChecklistModal from "../../components/modals/CheckerReviewChecklistModalComponents/CheckerReviewChecklistModal";
import CompletedChecklistModal from "../../components/modals/CompletedChecklistModalComponents/CompletedChecklistModal";
import CreatorCompletedChecklistModal from "../../components/modals/CreatorCompletedChecklistModal/CreatorCompletedChecklistModal";

const CHECKLIST_STATUS_META = {
  co_creator_review: {
    label: "Co-Creator Review",
    color: "#1890FF", // Bright Blue - distinct for Co-Creator stage
    bgColor: "#E6F7FF",
    borderColor: "#1890FF",
    icon: <SyncOutlined />,
  },
  rm_review: {
    label: "RM Review",
    color: "#722ED1", // Purple - distinct for RM Review stage
    bgColor: "#F9F0FF",
    borderColor: "#722ED1",
    icon: <ClockCircleOutlined />,
  },
  revived: {
    label: "Revived",
    color: "#FA8C16", // Orange - for revived items
    bgColor: "#FFF7E6",
    borderColor: "#FA8C16",
    icon: <ClockCircleOutlined />,
  },
  co_checker_review: {
    label: "Co-Checker Review",
    color: "#13C2C2", // Cyan/Teal - distinct for Checker Review stage
    bgColor: "#E6FFFB",
    borderColor: "#13C2C2",
    icon: <SyncOutlined />,
  },
  approved: {
    label: "Approved",
    color: "#52C41A", // Green - success state
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
    icon: <CheckCircleOutlined />,
  },
  rejected: {
    label: "Rejected",
    color: "#FF4D4F", // Red - rejection state
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
    icon: <CloseCircleOutlined />,
  },
  active: {
    label: "Active",
    color: "#1677FF", // Primary blue - active state
    bgColor: "#E6F7FF",
    borderColor: "#1677FF",
    icon: <SyncOutlined />,
  },
  completed: {
    label: "Completed",
    color: "#52C41A", // Green - completion state
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
    icon: <CheckCircleOutlined />,
  },
  pending: {
    label: "Pending",
    color: "#FF4D4F", // Red - pending state (consistent with other pending statuses)
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
    icon: <ClockCircleOutlined />,
  },
  closed: {
    label: "Revived",
    color: "#FA8C16", // Orange - same as revived
    bgColor: "#FFF7E6",
    borderColor: "#FA8C16",
    icon: <ClockCircleOutlined />,
  },
};

// ✅ Helper function to normalize status to lowercase with underscores
const normalizeStatus = (status) => {
  if (!status) return null;
  
  // Convert CamelCase to snake_case and lowercase
  return status
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
};

const renderChecklistStatus = (status) => {
  const statusConfig = getStatusColor(status);

  return (
    <Tag
      style={{
        fontWeight: 600,
        fontSize: 11,
        borderRadius: 4,
        border: `1px solid ${statusConfig.borderColor}`,
        color: statusConfig.textColor,
        backgroundColor: statusConfig.bgColor,
        padding: "4px 8px",
      }}
    >
      {status || "Unknown"}
    </Tag>
  );
};

// ✅ Helper function to get assigned checker info
const getCheckerInfo = (record) => {
  // Priority: assignedToCoChecker → assignedChecker → checkerAssigned → coChecker
  return (
    record.assignedToCoChecker ||
    record.assignedChecker ||
    record.checkerAssigned ||
    record.coChecker ||
    null
  );
};

/* ---------------- THEME COLORS ---------------- */
const PRIMARY_BLUE = "#164679";
const SECONDARY_PURPLE = "#2B1C67";
const LIGHT_YELLOW = "#FFF7CC";
const HIGHLIGHT_GOLD = "#E6C200";
const SUCCESS_GREEN = "#52c41a";

// Function to determine which modal to show based on status
const getModalComponent = (status) => {
  switch (status) {
    case "rm_review":
      return RmReviewChecklistModal;
    case "co_checker_review":
      return CheckerReviewChecklistModal;
    case "approved":
    case "completed":
      return CompletedChecklistModal;
    case "co_creator_review":
      return ReviewChecklistModal;
    case "closed":
    case "revived":
      return CreatorCompletedChecklistModal;
    case "active":
    case "pending":
    default:
      return ReviewChecklistModal; // default fallback
  }
};

export default function AllDCLsTable({ filters, onDataLoaded }) {
  // State for modal
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data = [], isLoading } = useGetAllCoCreatorChecklistsQuery();

  // 🔍 Debug logging to identify data structure from API
  useEffect(() => {
    if (data?.length > 0) {
      const firstItem = data[0];
      console.log("📊 AllDCLsTable API Response (First Item):", {
        keys: Object.keys(firstItem),
        data: firstItem,
        checkerFields: {
          approvedBy: firstItem?.approvedBy,
          assignedChecker: firstItem?.assignedChecker,
          checkerAssigned: firstItem?.checkerAssigned,
          checker: firstItem?.checker,
        },
        status: firstItem?.status,
        statusType: typeof firstItem?.status,
      });
      // Notify parent of loaded data
      if (onDataLoaded) {
        onDataLoaded(data);
      }
    }
  }, [data, onDataLoaded]);

  const filtered = data.filter((d) =>
    !filters.searchText
      ? true
      : d.dclNo?.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        d.customerName
          ?.toLowerCase()
          .includes(filters.searchText.toLowerCase()),
  );

  // Handle row click to open modal
  const handleRowClick = (record) => {
    setSelectedChecklist(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedChecklist(null);
  };

  if (isLoading) return <Spin />;
  if (!filtered.length) return <Empty />;

  /* ---------------- COLUMNS ---------------- */
  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 140,
      fixed: "left",
      render: (text) => (
        <div
          style={{
            fontWeight: "bold",
            color: PRIMARY_BLUE,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: "Customer No",
      dataIndex: "customerNumber",
      width: 110,
      render: (text) => (
        <div style={{ color: SECONDARY_PURPLE, fontWeight: 500, fontSize: 13 }}>
          {text || "—"}
        </div>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 160,
      render: (text) => (
        <div
          style={{
            fontWeight: 600,
            color: PRIMARY_BLUE,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
           <UserOutlined style={{ color: PRIMARY_BLUE, fontSize: 12 }} />
          {/* <CustomerServiceOutlined style={{ fontSize: 12 }} /> */}
          {text}
        </div>
      ),
    },
    {
      title: "IBPS No",
      dataIndex: "ibpsNo",
      width: 140,
      render: (text) => (
        <span
          style={{
            color: PRIMARY_BLUE,
            fontWeight: 500,
            fontFamily: "monospace",
            backgroundColor: text ? "rgba(181, 211, 52, 0.1)" : "transparent",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {text || "Not set"}
        </span>
      ),
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      width: 120,
      render: (text) => (
        <div style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>
          {text}
        </div>
      ),
    },
    {
      title: "Checker - Approver",
      dataIndex: "assignedToCoChecker", // primary field to check for checker info
      width: 160,
      render: (checkerValue, record) => {
        // 🔍 Debug: Log what we're getting
        console.log("🔍 Checker Column Debug:", {
          checkerValue,
          record_assignedToCoChecker: record?.assignedToCoChecker,
          record_assignedChecker: record?.assignedChecker,
          record_approvedBy: record?.approvedBy,
          record_checkerAssigned: record?.checkerAssigned,
          record_checker: record?.checker,
          allKeys: Object.keys(record || {}),
        });
        
        // ✅ Use helper to get assigned checker info from various field names
        const approver = getCheckerInfo(record);
        
        // ✅ Handle different possible name field variations
        const checkerName = 
          approver?.name || 
          approver?.checkerName || 
          approver?.fullName || 
          approver?.userName ||
          "Not Assigned";
        
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <UserOutlined style={{ color: PRIMARY_BLUE, fontSize: 12 }} />
            <div
              style={{
                color: PRIMARY_BLUE,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {checkerName}
            </div>
          </div>
        );
      },
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 70,
      align: "center",
      render: (docs = []) => {
        const totalDocs =
          docs.reduce(
            (total, category) => total + (category.docList?.length || 0),
            0,
          ) || 0;

        return (
          <Tag
            color={LIGHT_YELLOW}
            style={{
              fontSize: 11,
              borderRadius: 999,
              fontWeight: "bold",
              color: PRIMARY_BLUE,
              border: `1px solid ${HIGHLIGHT_GOLD}`,
              minWidth: 28,
              textAlign: "center",
            }}
          >
            {totalDocs}
          </Tag>
        );
      },
    },
    {
      title: "Completed Date",
      dataIndex: "updatedAt",
      width: 120,
      render: (date) => (
        <div style={{ fontSize: 12, fontWeight: 500 }}>
          {date ? formatDate(date) : "—"}
        </div>
      ),
    },

    {
      title: "Status",
      dataIndex: "status",
      width: 150,
      fixed: "right",
      render: (status) => renderChecklistStatus(status),
    },
  ];

  // Get the appropriate modal component based on checklist status
  const ModalComponent = selectedChecklist
    ? getModalComponent(selectedChecklist.status)
    : null;

  return (
    <>
      {/* Custom styles */}
      <style>{customTableStyles}</style>

      <Table
        className="creator-completed-table"
        rowKey="_id"
        dataSource={filtered}
        columns={columns}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1400 }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
        })}
      />

      {/* Render the appropriate modal based on status */}
      {selectedChecklist && ModalComponent && (
        <ModalComponent
          open={isModalOpen}
          checklist={selectedChecklist}
          onClose={handleCloseModal}
          readOnly={true}
        />
      )}
    </>
  );
}

const customTableStyles = `
.creator-completed-table .ant-table-wrapper {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
  border: 1px solid #e0e0e0;
}

/* ✅ Thick green line below header - Professional separator */
.creator-completed-table .ant-table-thead > tr > th {
  background-color: #f7f7f7 !important;
  color: #164679 !important;
  font-weight: 700;
  padding: 16px 12px !important;
  border-bottom: 4px solid #52c41a !important;
  text-align: left !important;
  font-size: 13px;
}

/* ✅ Add thick green separator line between header and body */
.creator-completed-table .ant-table-thead {
  border-bottom: 4px solid #52c41a;
}

.creator-completed-table .ant-table-tbody > tr {
  transition: background-color 0.2s ease;
}
.creator-completed-table .ant-table-tbody > tr:hover > td {
  background-color: rgba(82, 196, 26, 0.1) !important;
  cursor: pointer;
}
.creator-completed-table .ant-table-tbody > tr > td {
  padding: 14px 12px !important;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0 !important;
  vertical-align: middle;
}
`;
