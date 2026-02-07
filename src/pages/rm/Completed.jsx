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

import CompletedChecklistModal from "../../components/modals/CompletedChecklistModalComponents/CompletedChecklistModal";

import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";

const { Text } = Typography;

// Theme colors (UNCHANGED)
const PRIMARY_PURPLE = "#2B1C67";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_BLUE = "#164679";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";
const INFO_BLUE = "#1890ff";

const STATUS_CONFIG = {
  Submitted: { color: SUCCESS_GREEN, textColor: "white" },
  "Pending from RM": { color: WARNING_ORANGE, textColor: "white" },
  "Pending from CO": { color: INFO_BLUE, textColor: "white" },
  Deferred: { color: SECONDARY_BLUE, textColor: "white" },
  Waived: { color: PRIMARY_PURPLE, textColor: "white" },
  TBO: { color: "#666666", textColor: "white" },
  Approved: { color: SUCCESS_GREEN, textColor: "white" },
  Completed: { color: SUCCESS_GREEN, textColor: "white" },
};

const Completed = ({ userId }) => {
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const {
    data: checklists = [],
    isLoading,
    refetch,
  } = useGetAllCoCreatorChecklistsQuery();

  console.log("All Checklists in Completed:", checklists);

  /**
   * COMPLETED LOGIC
   * ----------------
   * This is the inverse of MyQueue.
   * Anything that MyQueue filters OUT appears here.
   */
  const filteredData = useMemo(() => {
    if (!checklists) return [];

    return checklists
      .filter((c) => (c.assignedToRM?.id || c.assignedToRM?._id) === userId)
      .filter((c) => {
        const status = (c.status || "").toLowerCase();

        // MyQueue REMOVES approved & rejected
        // Completed MUST SHOW them
        return status === "approved" || status === "completed";
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
      });
  }, [checklists, userId, searchText]);

  console.log("filteredCompleted:", filteredData);

  const clearFilters = () => setSearchText("");

  const renderStatusTag = (status) => {
    const config = STATUS_CONFIG[status] || {
      color: "#d9d9d9",
      textColor: "#000",
    };
    return (
      <Tag
        color={config.color}
        style={{
          fontWeight: "bold",
          fontSize: 10,
          padding: "2px 8px",
          borderRadius: 10,
          border: "none",
          color: config.textColor,
          minWidth: 100,
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
      width: 140,
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
          <FileTextOutlined style={{ color: SECONDARY_BLUE }} />
          {text}
        </div>
      ),
    },
    {
      title: "Customer No",
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
      width: 160,
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
          <CustomerServiceOutlined style={{ fontSize: 12 }} />
          {text}
        </div>
      ),
    },

    {
      title: "IBPS No", // ✅ New IBPS NO column
      dataIndex: "ibpsNo",
      width: 120,
      render: (text) => (
        <div
          style={{
            color: SECONDARY_BLUE,
            fontWeight: 500,
            fontFamily: "monospace",
            backgroundColor: text ? "rgba(181, 211, 52, 0.1)" : "transparent",
            padding: "2px 6px",
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
      width: 120,
      render: (text) => (
        <div style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>
          {text}
        </div>
      ),
    },
    {
      title: "Creator",
      dataIndex: "createdBy",
      width: 120,
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
      width: 120,
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
      width: 70,
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
      dataIndex: "status",
      width: 120,
      render: (status) => renderStatusTag(status),
    },
  ];

  const customTableStyles = `
    .rm-completed-table .ant-table-wrapper {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(43, 28, 103, 0.08);
      border: 1px solid #e0e0e0;
    }
  `;

  return (
    <div style={{ padding: 24 }}>
      <style>{customTableStyles}</style>

      <Card
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: `4px solid ${SUCCESS_GREEN}`,
          background: "#fafafa",
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <h2 style={{ margin: 0, color: PRIMARY_PURPLE }}>
              Completed
              <Badge
                count={filteredData.length}
                style={{ backgroundColor: SUCCESS_GREEN, marginLeft: 12 }}
              />
            </h2>
          </Col>
        </Row>
      </Card>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Input
              placeholder="Search completed DCLs"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Button onClick={clearFilters}>Clear</Button>
          </Col>
        </Row>
      </Card>

      {isLoading ? (
        <Spin size="large" />
      ) : filteredData.length === 0 ? (
        <Empty description="No completed DCLs" />
      ) : (
        <div className="rm-completed-table">
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedChecklist(record);
                setModalOpen(true);
              },
            })}
          />
        </div>
      )}

      {selectedChecklist && (
        <CompletedChecklistModal
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

export default Completed;
