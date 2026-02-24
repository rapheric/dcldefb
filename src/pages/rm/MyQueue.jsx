// export default MyQueue;
import React, { useState, useMemo } from "react";
import {
  Button,
  Divider,
  Table,
  Tag,
  Spin,
  Empty,
  Card,
  Row,
  Col,
  Input,
  Badge,
  Typography,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { formatDateTime } from "../../utils/checklistUtils";
import { getStatusColor, getStatusTagProps } from "../../utils/statusColors";

import RmReviewChecklistModal from "../../components/modals/RmReviewChecklistModalComponents/RmReviewChecklistModal";
import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";
import { useEffect } from "react";

const { Text } = Typography;

// Theme colors
const PRIMARY_PURPLE = "#2B1C67";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_BLUE = "#164679";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";
const INFO_BLUE = "#1890ff";

// const STATUS_CONFIG = {
//   Submitted: { color: SUCCESS_GREEN, textColor: "white" },
//   "Pending from RM": { color: WARNING_ORANGE, textColor: "white" },
//   "Pending from CO": { color: INFO_BLUE, textColor: "white" },
//   Deferred: { color: SECONDARY_BLUE, textColor: "white" },
//   Waived: { color: PRIMARY_PURPLE, textColor: "white" },
//   TBO: { color: "#666666", textColor: "white" },
// };

const MyQueue = ({ userId, draftToRestore = null, setDraftToRestore = null }) => {
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Handle draft restoration - open modal with draft data
  useEffect(() => {
    if (draftToRestore && draftToRestore.data) {
      console.log("🔄 RM MyQueue - Restoring draft:", draftToRestore);

      // Reconstruct documents in nested format (categories with docList)
      const draftDocuments = draftToRestore.data.documents || [];

      // Group documents by category
      const groupedDocs = {};
      draftDocuments.forEach((doc) => {
        const category = doc.category || "General Documents";
        if (!groupedDocs[category]) {
          groupedDocs[category] = [];
        }
        groupedDocs[category].push(doc);
      });

      // Convert to nested format
      const nestedDocuments = Object.keys(groupedDocs).map((category) => ({
        category,
        docList: groupedDocs[category],
      }));

      console.log("📋 RM MyQueue - Reconstructed nested documents:", nestedDocuments);

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
        // Documents in nested format that RM modal expects
        documents: nestedDocuments,
        // Also include the draft metadata for debugging
        _draftRestored: true,
        _rmComment: draftToRestore.data.creatorComment || "",
        _supportingDocs: draftToRestore.data.supportingDocs || [],
      };

      console.log("✅ RM MyQueue - Opening modal with restored checklist:", draftChecklist);
      setSelectedChecklist(draftChecklist);
      setModalOpen(true);

      // Clear the draft restore after a delay to ensure modal has received the data
      setTimeout(() => {
        if (setDraftToRestore) {
          setDraftToRestore(null);
        }
      }, 100);
    }
  }, [draftToRestore, setDraftToRestore]);

  // Fetch all checklists
  const {
    data: checklists = [],
    isLoading,
    refetch,
  } = useGetAllCoCreatorChecklistsQuery();

  // ... (Theme colors and other constants) ...

  // Filter checklists assigned to this RM and queue status
  const filteredData = useMemo(() => {
    if (!checklists) return [];

    return (
      checklists
        .filter((c) => (c.assignedToRM?.id || c.assignedToRM?._id) === userId)
        .filter((c) => {
          const status = (c.status || "").toLowerCase();

          // 1. Filter out only "approved" and "rejected"
          // Keep "pending" status because newly created checklists start as pending
          return status !== "approved" && status !== "rejected";
        })

        // Map and Inject the displayStatus field
        .map((c) => {
          const backendStatus = (c.status || "default").toLowerCase();
          const statusConfig = getStatusColor(backendStatus);

          return {
            ...c,
            // Set the displayStatus property for the Table column
            displayStatus: c.status,
          };
        })

        .filter((c) => {
          if (!searchText) return true;
          const q = searchText.toLowerCase();
          return (
            c.dclNo?.toLowerCase().includes(q) ||
            c.customerNumber?.toLowerCase().includes(q) ||
            c.customerName?.toLowerCase().includes(q) ||
            c.loanType?.toLowerCase().includes(q) ||
            c.createdBy?.name?.toLowerCase().includes(q)
          );
        })
        // Sort by most recent first (using updatedAt or createdAt)
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB - dateA; // Descending order (most recent first)
        })
    );
  }, [checklists, userId, searchText]);

  const clearFilters = () => setSearchText("");

  const renderStatusTag = (status) => {
    const statusConfig = getStatusColor(status);
    return (
      <Tag
        style={{
          fontWeight: "bold",
          fontSize: 10,
          padding: "4px 8px",
          borderRadius: 4,
          border: `1px solid ${statusConfig.borderColor}`,
          color: statusConfig.textColor,
          backgroundColor: statusConfig.bgColor,
          minWidth: 80,
          textAlign: "center",
        }}
      >
        {status}
      </Tag>
    );
  };

  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 120,
      render: (text) => (
        <div
          style={{
            fontWeight: "bold",
            color: PRIMARY_PURPLE,
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
      title: "Customer Number",
      dataIndex: "customerNumber",
      width: 110,
      render: (text) => (
        <div style={{ color: SECONDARY_BLUE, fontWeight: 500, fontSize: 13 }}>
          {text}
        </div>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 130,
      render: (text) => (
        <div
          style={{
            fontWeight: 600,
            color: PRIMARY_PURPLE,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
         <UserOutlined style={{ color: SECONDARY_BLUE, fontSize: 12 }} />
          {text}
        </div>
      ),
    },
    {
      title: "IBPS No",
      dataIndex: "ibpsNo",
      width: 85,
      render: (text) => (
        <div
          style={{
            color: SECONDARY_BLUE,
            fontWeight: 500,
            fontFamily: "monospace",
            borderRadius: 4,
            fontSize: 12, 
            textAlign: "center",
          }}
        >
          {text || "Not set"}
        </div>
      ),
    },

    {
      title: "Loan Type",
      dataIndex: "loanType",
      width: 110,
      render: (text) => (
        <div style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>
          {text}
        </div>
      ),
    },
    {
      title: "Creator",
      dataIndex: "createdBy",
      width: 115,
      render: (creator) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <UserOutlined style={{ color: SECONDARY_BLUE, fontSize: 12 }} />
          <span
            style={{ color: PRIMARY_PURPLE, fontWeight: 500, fontSize: 13 }}
          >
            {creator?.name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      title: "RM",
      dataIndex: "assignedToRM",
      width: 115,
      render: (rm) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <UserOutlined style={{ color: SECONDARY_BLUE, fontSize: 12 }} />
          <span
            style={{ color: PRIMARY_PURPLE, fontWeight: 500, fontSize: 13 }}
          >
            {rm?.name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 80,
      align: "center",
      render: (docs) => {
        const totalDocs =
          docs?.reduce(
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
              color: PRIMARY_PURPLE,
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
      title: "Status",
      dataIndex: "displayStatus",
      width: 135,
      render: (status) => renderStatusTag(status),
    },
    {
      title: "SLA",
      dataIndex: "slaExpiry",
      width: 100,
      fixed: "right",
      render: (date) => {
        const daysLeft = dayjs(date).diff(dayjs(), "days");
        return (
          <Tag
            color={
              daysLeft <= 2
                ? ERROR_RED
                : daysLeft <= 5
                  ? WARNING_ORANGE
                  : SUCCESS_GREEN
            }
            style={{ fontWeight: "bold", fontSize: 11 }}
          >
            {daysLeft > 0 ? `${daysLeft}d` : "Expired"}
          </Tag>
        );
      },
    },
  ];

  const customTableStyles = `
    .rm-myqueue-table .ant-table-wrapper { 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 10px 30px rgba(43, 28, 103, 0.08); 
      border: 1px solid #e0e0e0; 
    }
    .rm-myqueue-table .ant-table-thead > tr > th { 
      background-color: #f7f7f7 !important; 
      color: ${PRIMARY_PURPLE} !important; 
      font-weight: 700; 
      fontSize: 13px; 
      padding: 14px 12px !important; 
      border-bottom: 3px solid ${ACCENT_LIME} !important; 
      border-right: none !important; 
    }
    .rm-myqueue-table .ant-table-tbody > tr > td { 
      border-bottom: 1px solid #f0f0f0 !important; 
      border-right: none !important; 
      padding: 12px 12px !important; 
      fontSize: 13px; 
      color: #374151; 
    }
    .rm-myqueue-table .ant-table-tbody > tr.ant-table-row:hover > td { 
      background-color: rgba(43, 28, 103, 0.1) !important; 
      cursor: pointer;
    }
    .rm-myqueue-table .ant-pagination .ant-pagination-item-active { 
      background-color: ${ACCENT_LIME} !important; 
      border-color: ${ACCENT_LIME} !important; 
    }
    .rm-myqueue-table .ant-pagination .ant-pagination-item-active a { 
      color: ${PRIMARY_PURPLE} !important; 
      font-weight: 600; 
    }
  `;

  return (
    <div style={{ padding: 24 }}>
      <style>{customTableStyles}</style>

      {/* Header */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: `4px solid ${ACCENT_LIME}`,
          background: "#fafafa",
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <h2
              style={{
                margin: 0,
                color: PRIMARY_PURPLE,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              My Queue
              <Badge
                count={filteredData.length}
                style={{ backgroundColor: ACCENT_LIME, fontSize: 12 }}
              />
            </h2>
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
              Upload documents for DCLs assigned to you
            </p>
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card
        style={{
          marginBottom: 16,
          background: "#fafafa",
          border: `1px solid ${PRIMARY_PURPLE}20`,
          borderRadius: 8,
        }}
        size="small"
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by DCL No, Customer, Loan Type, or Creator"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="middle"
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              onClick={clearFilters}
              style={{ width: "100%" }}
              size="middle"
            >
              Clear
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
            minHeight: 300,
          }}
        >
          <Spin size="large" />
        </div>
      ) : filteredData.length === 0 ? (
        <Empty
          description={
            <div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>
                No DCLs pending upload
              </p>
              <p style={{ color: "#999" }}>
                {searchText
                  ? "Try changing your search term"
                  : "No DCLs assigned to you yet"}
              </p>
            </div>
          }
          style={{ padding: 40 }}
        />
      ) : (
        <div className="rm-myqueue-table">
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="_id"
            size="middle"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              position: ["bottomCenter"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} DCLs`,
            }}
            scroll={{ x: 1130 }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedChecklist(record);
                setModalOpen(true);
              },
            })}
          />
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: "#f8f9fa",
          borderRadius: 8,
          fontSize: 12,
          color: "#666",
          border: `1px solid ${PRIMARY_PURPLE}10`,
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            Report generated on: {formatDateTime(new Date())}
          </Col>
          <Col>
            <Text type="secondary">
              Showing {filteredData.length} items • Data as of latest system
              update
            </Text>
          </Col>
        </Row>
      </div>

      {/* Modal */}
      {selectedChecklist && (
        <RmReviewChecklistModal
          checklist={selectedChecklist}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedChecklist(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default MyQueue;
