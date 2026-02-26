// export default Completed;
import React, { useMemo, useState } from "react";
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

import { useGetCompletedDCLsForCheckerQuery } from "../../api/checklistApi";

// Theme Colors
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";
const SUCCESS_GREEN = "#52c41a";

const { Text } = Typography;

const Completed = ({ userId }) => {
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const {
    data: checklists = [],
    isLoading,
    refetch,
  } = useGetCompletedDCLsForCheckerQuery(userId);

  console.log("🔍 All Completed Checklists for Checker:", checklists);
  React.useEffect(() => {
    if (selectedChecklist) {
      console.log("✅ Selected Checklist:", selectedChecklist);
      console.log(
        "📄 Documents in selected checklist:",
        selectedChecklist.documents,
      );
      if (selectedChecklist.documents) {
        const docCount = selectedChecklist.documents.reduce(
          (sum, cat) => sum + (cat.docList?.length || 0),
          0,
        );
        console.log("📊 Total documents in selected checklist:", docCount);
      }
    }
  }, [selectedChecklist]);

  // ✅ No filtering needed - backend already filters by checker and approved status
  const filteredData = useMemo(() => {
    if (!checklists || !userId) return [];

    return checklists.filter((c) => {
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

  console.log("user:", userId);
  console.log("Completed Checklists for Checker:", filteredData);

  const clearFilters = () => setSearchText("");

  console.log("🔎 Filtered Completed Data:", filteredData);

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 140,
      fixed: "left",
      render: (text) => (
        <div style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
          {text}
        </div>
      ),
    },
    {
      title: "Customer No",
      dataIndex: "customerNumber",
      width: 120,
      render: (text) => (
        <span style={{ color: SECONDARY_PURPLE, fontWeight: 500 }}>{text}</span>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 180,
      render: (text) => (
        <span style={{ fontWeight: 600, color: PRIMARY_BLUE }}>
          {text}
        </span>
      ),
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      width: 140,
      render: (text) => <span style={{ fontSize: 12 }}>{text}</span>,
    },
    {
      title: "Checker",
      dataIndex: "assignedToCoChecker",
      width: 140,
      render: (checker) => {
        const checkerName = checker?.name || checker || "-";
        return (
          <span style={{ fontSize: 12, color: PRIMARY_BLUE, fontWeight: 500 }}>
            {checkerName}
          </span>
        );
      },
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 80,
      align: "center",
      render: (docs = []) => {
        const total =
          docs.reduce((sum, cat) => sum + (cat.docList?.length || 0), 0) || 0;
        return (
          <Tag
            color={LIGHT_YELLOW}
            style={{
              fontWeight: "bold",
              border: `1px solid ${HIGHLIGHT_GOLD}`,
              color: PRIMARY_BLUE,
            }}
          >
            {total}
          </Tag>
        );
      },
    },
    {
      title: "Completed Date",
      dataIndex: "completionDate",
      width: 130,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 140,
      fixed: "right",
      render: (status) => {
        const isApproved = status === "approved";
        const isApprovedRevisions = status === "approved_with_revisions";
        const displayText = isApproved ? "Approved" : isApprovedRevisions ? "Approved (Revised)" : status;

        return (
          <Tag
            style={{
              fontWeight: "bold",
              backgroundColor: isApproved ? "#f6ffed" : isApprovedRevisions ? "#e6f7ff" : undefined,
              borderColor: isApproved ? SUCCESS_GREEN : isApprovedRevisions ? "#1890ff" : undefined,
              color: isApproved ? SUCCESS_GREEN : isApprovedRevisions ? "#1890ff" : undefined,
            }}
          >
            {displayText}
          </Tag>
        );
      },
    },
  ];

  /* ================= UI ================= */
  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Card
        style={{
          marginBottom: 24,
          borderLeft: `4px solid ${SUCCESS_GREEN}`,
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <h2 style={{ color: PRIMARY_BLUE }}>
              Completed Checklists <Badge count={filteredData.length} />
            </h2>
            <p style={{ margin: 0 }}>Checklists approved by you</p>
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Input
              placeholder="Search DCL, Customer, Loan, Checker"
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} md={4}>
            <Button onClick={() => setSearchText("")} block>
              Clear
            </Button>
          </Col>
        </Row>
      </Card>

      <Divider>Approved Checklists ({filteredData.length})</Divider>

      {/* Table */}
      {isLoading ? (
        <Spin tip="Loading completed checklists..." />
      ) : filteredData.length === 0 ? (
        <Empty description="No completed checklists found" />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          onRow={(record) => ({
            onClick: () => {
              console.log("🖱️ Clicked on checklist:", record.dclNo, record);
              setSelectedChecklist(record);
              setModalOpen(true);
            },
          })}
        />
      )}

      {/* Footer */}
      <div style={{ marginTop: 16, fontSize: 12 }}>
        Generated: {dayjs().format("DD/MM/YYYY HH:mm")}
      </div>

      {/* Modal */}
      {selectedChecklist && (
        <CompletedChecklistModal
          checklist={selectedChecklist}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
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

export default Completed;
