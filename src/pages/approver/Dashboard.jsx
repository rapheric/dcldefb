import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Input,
  Badge,
  Typography,
  Modal,
  message,
  Descriptions,
  Space,
  Divider,
  Select,
  DatePicker,
  Statistic,
  Timeline,
  Tabs,
  Avatar,
  Popconfirm,
  Upload,
  Spin,
  Empty,
  Tooltip,
  Progress,
  Alert,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  DownloadOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckOutlined,
  CloseOutlined,
  FilePdfOutlined,
  HistoryOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  SettingOutlined,
  BellOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import deferralApi from "../../service/deferralApi.js";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate } from "react-router-dom";

dayjs.extend(relativeTime);

// Theme colors matching NCBA system
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const PRIMARY_PURPLE = "#2B1C67";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";
const SECONDARY_PURPLE = "#7e6496";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

// Removed mock queue data (now using live API)

const isPendingStatus = (s) => s === "pending_approval" || s === "in_review";

// Deferral Review Modal Component
const DeferralReviewModal = ({
  deferral,
  open,
  onClose,
  onApprove,
  onReject,
}) => {
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const handleApprove = async () => {
    if (!comments.trim() && deferral.category === "Non-Allowable") {
      message.warning(
        "Please provide comments for non-allowable document deferral",
      );
      return;
    }

    setLoading(true);
    setSelectedAction("approve");
    try {
      await onApprove(deferral._id, comments);
      message.success("Deferral approved successfully");
      onClose();
    } catch (error) {
      message.error("Failed to approve deferral");
    } finally {
      setLoading(false);
      setSelectedAction(null);
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      message.warning("Please provide rejection reason");
      return;
    }

    setLoading(true);
    setSelectedAction("reject");
    try {
      await onReject(deferral._id, comments);
      message.success("Deferral rejected successfully");
      onClose();
    } catch (error) {
      message.error("Failed to reject deferral");
    } finally {
      setLoading(false);
      setSelectedAction(null);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "High":
        return ERROR_RED;
      case "Medium":
        return WARNING_ORANGE;
      case "Low":
        return SUCCESS_GREEN;
      default:
        return "#d9d9d9";
    }
  };

  const getCreditScoreColor = (score) => {
    switch (score) {
      case "A+":
        return SUCCESS_GREEN;
      case "A":
        return "#52c41a";
      case "B":
        return WARNING_ORANGE;
      case "C":
        return ERROR_RED;
      default:
        return "#d9d9d9";
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <FileTextOutlined style={{ color: PRIMARY_BLUE, fontSize: 20 }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: PRIMARY_BLUE }}>
            Deferral Request Review
          </span>
          <Tag
            color={deferral.category === "Allowable" ? "green" : "red"}
            style={{ fontWeight: 600 }}
          >
            {deferral.category}
          </Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={null}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ maxHeight: "75vh", overflowY: "auto" }}>
        {/* Header Section */}
        <Card
          size="small"
          style={{
            borderBottom: `1px solid #f0f0f0`,
            borderRadius: 0,
          }}
          bodyStyle={{ padding: 16 }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0, color: PRIMARY_BLUE }}>
                {deferral.deferralNumber}
              </Title>
              <Text type="secondary">DCL: {deferral.dclNo}</Text>
            </Col>
            <Col>
              <Space>
                <Tag
                  color={
                    deferral.priority === "high"
                      ? "red"
                      : deferral.priority === "medium"
                        ? "orange"
                        : "blue"
                  }
                  style={{ fontWeight: 600 }}
                >
                  {deferral.priority?.toUpperCase()} PRIORITY
                </Tag>
                {isPendingStatus(deferral.status) && (
                  <Badge
                    status="processing"
                    text="Pending Approval"
                    style={{ color: WARNING_ORANGE }}
                  />
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        <div style={{ padding: 24 }}>
          {/* Customer & Risk Info */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={16}>
              <Card size="small" title="Customer Information">
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Customer Name" span={2}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 16,
                        color: PRIMARY_BLUE,
                      }}
                    >
                      {deferral.customerName}
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {deferral.businessName}
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="Customer Number">
                    <Tag color="blue">{deferral.customerNumber}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="RM">
                    <div>
                      <div style={{ fontWeight: 500 }}>{deferral.rmName}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        <MailOutlined /> {deferral.rmEmail}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        <PhoneOutlined /> {deferral.rmPhone}
                      </div>
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="Risk Assessment">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>Credit Score:</Text>
                    <Tag
                      color={getCreditScoreColor(deferral.creditScore)}
                      style={{ fontWeight: 600 }}
                    >
                      {deferral.creditScore}
                    </Tag>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>Risk Level:</Text>
                    <Tag
                      color={getRiskColor(deferral.riskLevel)}
                      style={{ fontWeight: 600 }}
                    >
                      {deferral.riskLevel}
                    </Tag>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>Previous Deferrals:</Text>
                    <Text strong>{deferral.previousDeferrals}</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Deferral Details */}
          <Card
            size="small"
            style={{ marginBottom: 24 }}
            title="Deferral Details"
          >
            <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
              <Descriptions.Item label="Deferral Number">
                <div style={{ fontWeight: 700, color: PRIMARY_BLUE }}>
                  {deferral.deferralNumber}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="DCL No">
                {deferral.dclNo || deferral.dclNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <div style={{ fontWeight: 500 }}>
                  {deferral.status || "Pending"}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Loan Amount">
                <div
                  style={{
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    {(function () {
                      const amt = Number(deferral.loanAmount || 0);
                      if (!amt) return "Not specified";
                      if (amt > 1000) {
                        return `KSh ${amt.toLocaleString()}`;
                      }
                      return `${amt} M`;
                    })()}
                  </div>
                  {(function () {
                    const amt = Number(deferral.loanAmount || 0);
                    if (!amt) return null;
                    const isAbove75 =
                      amt > 75 && amt <= 1000
                        ? true
                        : amt > 75000000
                          ? true
                          : false;
                    return isAbove75 ? (
                      <Tag color={"red"} style={{ fontSize: 12 }}>
                        Above 75 million
                      </Tag>
                    ) : (
                      <span style={{ color: SUCCESS_GREEN, fontWeight: 600 }}>
                        Under 75 million
                      </span>
                    );
                  })()}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Days Sought">
                <div
                  style={{
                    fontWeight: "bold",
                    color:
                      deferral.daysSought > 45
                        ? ERROR_RED
                        : deferral.daysSought > 30
                          ? WARNING_ORANGE
                          : PRIMARY_BLUE,
                  }}
                >
                  {deferral.daysSought || 0} days
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Next Due Date">
                <div
                  style={{
                    color:
                      deferral.nextDueDate ||
                        deferral.nextDocumentDueDate ||
                        deferral.requestedExpiry
                        ? dayjs(
                          deferral.nextDueDate ||
                          deferral.nextDocumentDueDate ||
                          deferral.requestedExpiry,
                        ).isBefore(dayjs())
                          ? ERROR_RED
                          : SUCCESS_GREEN
                        : PRIMARY_BLUE,
                  }}
                >
                  {deferral.nextDueDate ||
                    deferral.nextDocumentDueDate ||
                    deferral.requestedExpiry
                    ? `${dayjs(deferral.nextDueDate || deferral.nextDocumentDueDate || deferral.requestedExpiry).format("DD MMM YYYY")}`
                    : "Not calculated"}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="SLA Expiry">
                <div
                  style={{
                    color:
                      deferral.slaExpiry &&
                        dayjs(deferral.slaExpiry).isBefore(dayjs())
                        ? ERROR_RED
                        : PRIMARY_BLUE,
                  }}
                >
                  {deferral.slaExpiry
                    ? dayjs(deferral.slaExpiry).format("DD MMM YYYY HH:mm")
                    : "Not set"}
                </div>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Timeline */}
          <Card size="small" style={{ marginBottom: 24 }} title="Timeline">
            <Timeline>
              <Timeline.Item color="blue" dot={<CalendarOutlined />}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <Text strong>Original Due Date</Text>
                    <div>
                      {dayjs(deferral.originalDueDate).format("DD MMM YYYY")}
                    </div>
                  </div>
                  <Text type="secondary">
                    {dayjs(deferral.originalDueDate).fromNow()}
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="orange" dot={<ClockCircleOutlined />}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <Text strong>Requested Extension</Text>
                    <div style={{ color: WARNING_ORANGE, fontWeight: 500 }}>
                      {dayjs(deferral.requestedExpiry).format("DD MMM YYYY")}
                    </div>
                  </div>
                  <Text type="secondary">
                    {dayjs(deferral.requestedExpiry).fromNow()}
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="red" dot={<ExclamationCircleOutlined />}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <Text strong>SLA Expiry</Text>
                    <div style={{ color: ERROR_RED, fontWeight: 500 }}>
                      {dayjs(deferral.slaExpiry).format("DD MMM YYYY HH:mm")}
                    </div>
                  </div>
                  <Text type="secondary" style={{ color: ERROR_RED }}>
                    {dayjs(deferral.slaExpiry).diff(dayjs(), "hours")}h
                    remaining
                  </Text>
                </div>
              </Timeline.Item>
            </Timeline>
          </Card>

          {/* RM's Reason */}
          <Card
            size="small"
            style={{ marginBottom: 24 }}
            title={
              <span>
                <UserOutlined style={{ marginRight: 8 }} />
                RM's Request Reason
              </span>
            }
          >
            <div
              style={{
                padding: 16,
                background: "#f8f9fa",
                borderRadius: 6,
                borderLeft: `4px solid ${SECONDARY_PURPLE}`,
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {deferral.rmReason}
            </div>
          </Card>

          {/* Attachments */}
          {deferral.attachments && deferral.attachments.length > 0 && (
            <Card size="small" style={{ marginBottom: 24 }} title="Attachments">
              <Space direction="vertical" style={{ width: "100%" }}>
                {deferral.attachments.map((att) => (
                  <Card size="small" key={att.id}>
                    <Row align="middle" justify="space-between">
                      <Col>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <FilePdfOutlined style={{ color: ERROR_RED }} />
                          <div>
                            <div style={{ fontWeight: 500 }}>{att.name}</div>
                            <div style={{ fontSize: 12, color: "#666" }}>
                              {att.size} • PDF Document
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col>
                        <Button
                          icon={<DownloadOutlined />}
                          size="small"
                          type="primary"
                          ghost
                        >
                          Download
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            </Card>
          )}

          {/* Decision Section - Only show for pending deferrals */}
          {isPendingStatus(deferral.status) && (
            <Card
              size="small"
              style={{
                marginBottom: 16,
                border: `2px solid ${PRIMARY_BLUE}20`,
              }}
              title={
                <span style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>
                  <CheckCircleOutlined style={{ marginRight: 8 }} />
                  Make Decision
                </span>
              }
            >
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  Decision Comments
                </Text>
                <TextArea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter your decision comments here..."
                  rows={4}
                  style={{ marginBottom: 8 }}
                />
                {deferral.category === "Non-Allowable" && (
                  <Alert
                    message="Non-Allowable Document"
                    description="This document is classified as Non-Allowable. Please ensure proper justification is provided before approval."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
              </div>

              <div
                style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
              >
                <Popconfirm
                  title="Reject Deferral Request"
                  description={
                    <div>
                      <p>
                        Are you sure you want to reject this deferral request?
                      </p>
                      {!comments.trim() && (
                        <Text
                          type="warning"
                          style={{ display: "block", marginTop: 8 }}
                        >
                          Please provide rejection reason in the comments above.
                        </Text>
                      )}
                    </div>
                  }
                  onConfirm={handleReject}
                  okText="Yes, Reject"
                  okType="danger"
                  disabled={!comments.trim()}
                >
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    loading={loading && selectedAction === "reject"}
                    disabled={!comments.trim()}
                    size="large"
                    style={{ minWidth: 120 }}
                  >
                    Reject
                  </Button>
                </Popconfirm>

                <Popconfirm
                  title="Approve Deferral Request"
                  description={
                    <div>
                      <p>
                        Are you sure you want to approve this deferral request?
                      </p>
                      {deferral.category === "Non-Allowable" &&
                        !comments.trim() && (
                          <Text
                            type="warning"
                            style={{ display: "block", marginTop: 8 }}
                          >
                            Comments are required for Non-Allowable documents.
                          </Text>
                        )}
                    </div>
                  }
                  onConfirm={handleApprove}
                  okText="Yes, Approve"
                  disabled={
                    deferral.category === "Non-Allowable" && !comments.trim()
                  }
                >
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={loading && selectedAction === "approve"}
                    disabled={
                      deferral.category === "Non-Allowable" && !comments.trim()
                    }
                    size="large"
                    style={{
                      minWidth: 120,
                      backgroundColor:
                        deferral.category === "Allowable"
                          ? SUCCESS_GREEN
                          : WARNING_ORANGE,
                      borderColor:
                        deferral.category === "Allowable"
                          ? SUCCESS_GREEN
                          : WARNING_ORANGE,
                    }}
                  >
                    Approve
                  </Button>
                </Popconfirm>
              </div>
            </Card>
          )}

          {/* View Only for Approved/Rejected */}
          {(deferral.status === "approved" ||
            deferral.status === "rejected") && (
              <Card size="small" title="Decision Details">
                <Alert
                  message={
                    deferral.status === "approved" ? "Approved" : "Rejected"
                  }
                  description={`By ${deferral.approvedBy || deferral.rejectedBy} on ${dayjs(deferral.approvedDate || deferral.rejectedDate).format("DD MMM YYYY HH:mm")}`}
                  type={deferral.status === "approved" ? "success" : "error"}
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                {deferral.creatorComments && (
                  <div
                    style={{
                      padding: 16,
                      background:
                        deferral.status === "approved" ? "#f6ffed" : "#fff2f0",
                      borderRadius: 6,
                      borderLeft: `4px solid ${deferral.status === "approved" ? SUCCESS_GREEN : ERROR_RED}`,
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    {deferral.creatorComments}
                  </div>
                )}
              </Card>
            )}
        </div>
      </div>
    </Modal>
  );
};

// Main Approver Component
const Approver = ({ userId = "approver_current" }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedDeferral, setSelectedDeferral] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [queueData, setQueueData] = useState([]); // current approver queue
  const [actionedData, setActionedData] = useState([]); // approved/rejected by this approver

  // Filters
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState([]);

  // Load data: approver queue + actioned items
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const q = await deferralApi.getApproverQueue();
        const a = await deferralApi.getActionedDeferrals();
        setQueueData(Array.isArray(q) ? q : []);
        setActionedData(Array.isArray(a) ? a : []);
      } catch (err) {
        message.error("Failed to load approver data");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();

    const onCreated = () => fetchAll();
    const onUpdated = () => fetchAll();
    window.addEventListener("deferral:created", onCreated);
    window.addEventListener("deferral:updated", onUpdated);
    return () => {
      window.removeEventListener("deferral:created", onCreated);
      window.removeEventListener("deferral:updated", onUpdated);
    };
  }, []);

  // Filter data based on active tab and filters
  const filteredData = useMemo(() => {
    const isPendingStatus = (s) =>
      s === "pending_approval" || s === "in_review";

    let base = [];
    if (activeTab === "pending") base = queueData.slice();
    else if (activeTab === "approved")
      base = actionedData.filter((d) => d.status === "approved");
    else if (activeTab === "rejected")
      base = actionedData.filter((d) => d.status === "rejected");
    else base = [...queueData, ...actionedData];

    let filtered = base.filter((d) => {
      if (activeTab === "pending") return isPendingStatus(d.status);
      if (activeTab === "approved") return d.status === "approved";
      if (activeTab === "rejected") return d.status === "rejected";
      return true;
    });

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(
        (d) =>
          d.deferralNumber.toLowerCase().includes(searchText.toLowerCase()) ||
          d.dclNo.toLowerCase().includes(searchText.toLowerCase()) ||
          d.customerNumber.toLowerCase().includes(searchText.toLowerCase()) ||
          d.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
          d.rmName.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((d) => d.category === categoryFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((d) => d.deferralType === typeFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((d) => d.priority === priorityFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    // Apply date range filter
    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((d) => {
        const date = dayjs(d.createdAt);
        return date.isAfter(dateRange[0]) && date.isBefore(dateRange[1]);
      });
    }

    return filtered;
  }, [
    queueData,
    actionedData,
    activeTab,
    searchText,
    categoryFilter,
    typeFilter,
    priorityFilter,
    statusFilter,
    dateRange,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const isPendingStatus = (s) =>
      s === "pending_approval" || s === "in_review";
    const pending = queueData.filter((d) => isPendingStatus(d.status));
    const approvedCount = actionedData.filter(
      (d) => d.status === "approved",
    ).length;
    const rejectedCount = actionedData.filter(
      (d) => d.status === "rejected",
    ).length;
    return {
      pending: pending.length,
      approved: approvedCount,
      rejected: rejectedCount,
      total: queueData.length + actionedData.length,
      highPriority: pending.filter((d) => d.priority === "high").length,
      expiringToday: pending.filter(
        (d) => dayjs(d.slaExpiry).diff(dayjs(), "hours") <= 24,
      ).length,
      nonAllowable: pending.filter((d) => d.category === "Non-Allowable")
        .length,
    };
  }, [queueData, actionedData]);

  const handleApprove = async (id, comments) => {
    try {
      const updated = await deferralApi.approveDeferral(id, { comment: comments || "" });
      // Remove from queue and add to actioned list (so actioned tab shows it)
      setQueueData((prev) => prev.filter((d) => d._id !== id));
      setActionedData((prev) => {
        // Avoid duplicates
        const exists = prev.some((p) => p._id === updated._id);
        if (exists)
          return prev.map((p) => (p._id === updated._id ? updated : p));
        return [updated, ...prev];
      });

      // Notify other dashboards to refresh (CO/RM) — include the full updated deferral so listeners can act immediately
      window.dispatchEvent(
        new CustomEvent("deferral:updated", { detail: updated }),
      );
      console.debug("Dispatched deferral:updated with", {
        id: updated._id,
        status: updated.status,
      });

      // Debug log: show updated status returned from server
      console.debug("approveDeferral returned", {
        id: updated._id,
        status: updated.status,
        currentApproverIndex: updated.currentApproverIndex,
      });

      message.success("Deferral approved successfully");
      return updated;
    } catch (err) {
      message.error("Failed to approve deferral");
      throw err;
    }
  };

  const handleReject = async (id, comments) => {
    try {
      const updated = await deferralApi.rejectDeferral(id, { reason: comments || "" });
      setQueueData((prev) => prev.filter((d) => d._id !== id));
      setActionedData((prev) => {
        const exists = prev.some((p) => p._id === updated._id);
        if (exists)
          return prev.map((p) => (p._id === updated._id ? updated : p));
        return [updated, ...prev];
      });

      window.dispatchEvent(
        new CustomEvent("deferral:updated", { detail: updated }),
      );

      message.success("Deferral rejected successfully");
      return updated;
    } catch (err) {
      message.error("Failed to reject deferral");
      throw err;
    }
  };

  const columns = [
    {
      title: "Deferral No",
      dataIndex: "deferralNumber",
      key: "deferralNumber",
      width: 140,
      fixed: "left",
      render: (text) => (
        <div style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
          <FileTextOutlined
            style={{ marginRight: 8, color: SECONDARY_PURPLE }}
          />
          {text}
        </div>
      ),
      sorter: (a, b) => a.deferralNumber.localeCompare(b.deferralNumber),
    },
    {
      title: "DCL No",
      dataIndex: "dclNo",
      key: "dclNo",
      width: 120,
      render: (text) => (
        <div style={{ color: SECONDARY_PURPLE, fontWeight: 500 }}>{text}</div>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      width: 160,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{text}</div>
          <div style={{ fontSize: 11, color: "#666" }}>
            {record.customerNumber}
          </div>
        </div>
      ),
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
    },

    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 100,
      render: (category) => (
        <Tag
          color={category === "Allowable" ? "green" : "red"}
          style={{ fontWeight: 600 }}
        >
          {category}
        </Tag>
      ),
      filters: [
        { text: "Allowable", value: "Allowable" },
        { text: "Non-Allowable", value: "Non-Allowable" },
      ],
      onFilter: (value, record) => record.category === value,
    },
    {
      title: "RM",
      dataIndex: "rmName",
      key: "rmName",
      width: 120,
      render: (text) => (
        <div style={{ fontSize: 12 }}>
          <UserOutlined style={{ marginRight: 4 }} />
          {text}
        </div>
      ),
    },
    {
      title: "Days",
      dataIndex: "daysSought",
      key: "daysSought",
      width: 80,
      align: "center",
      render: (days) => (
        <Badge
          count={days}
          style={{
            backgroundColor:
              days > 30
                ? ERROR_RED
                : days > 15
                  ? WARNING_ORANGE
                  : SUCCESS_GREEN,
            fontSize: 11,
          }}
        />
      ),
      sorter: (a, b) => a.daysSought - b.daysSought,
    },
    {
      title: "SLA",
      dataIndex: "slaExpiry",
      key: "slaExpiry",
      width: 100,
      render: (date, record) => {
        if (!isPendingStatus(record.status)) {
          return <Tag color="default">N/A</Tag>;
        }

        const hoursLeft = dayjs(date).diff(dayjs(), "hours");
        let color = SUCCESS_GREEN;
        let text = `${Math.ceil(hoursLeft / 24)}d`;

        if (hoursLeft <= 0) {
          color = ERROR_RED;
          text = "Expired";
        } else if (hoursLeft <= 24) {
          color = ERROR_RED;
          text = `${hoursLeft}h`;
        } else if (hoursLeft <= 72) {
          color = WARNING_ORANGE;
        }

        return (
          <Tag color={color} style={{ fontWeight: "bold", fontSize: 11 }}>
            {text}
          </Tag>
        );
      },
      sorter: (a, b) => dayjs(a.slaExpiry).diff(dayjs(b.slaExpiry)),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => (
        <Tag
          color={
            priority === "high"
              ? "red"
              : priority === "medium"
                ? "orange"
                : "blue"
          }
          style={{ fontWeight: 600 }}
        >
          {priority?.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: "High", value: "high" },
        { text: "Medium", value: "medium" },
        { text: "Low", value: "low" },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setSelectedDeferral(record);
              setModalOpen(true);
            }}
            icon={<EyeOutlined />}
          >
            {record.status === "pending_approval" ||
              record.status === "in_review"
              ? "Review"
              : "View"}
          </Button>
          {(record.status === "pending_approval" ||
            record.status === "in_review") && (
              <Tooltip title="Quick Approve">
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined style={{ color: SUCCESS_GREEN }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(record._id, "Quick approved");
                  }}
                />
              </Tooltip>
            )}
        </Space>
      ),
    },
  ];

  const clearFilters = () => {
    setSearchText("");
    setCategoryFilter("all");
    setTypeFilter("all");
    setPriorityFilter("all");
    setStatusFilter("all");
    setDateRange([]);
  };

  const getSlaPercentage = () => {
    const expiringSoon = queueData.filter(
      (d) =>
        isPendingStatus(d.status) &&
        dayjs(d.slaExpiry).diff(dayjs(), "hours") <= 24,
    ).length;
    const totalPending = stats.pending;
    return totalPending > 0
      ? Math.round((expiringSoon / totalPending) * 100)
      : 0;
  };

  return (
    <div
      style={{ padding: 24, backgroundColor: "#f5f5f5", minHeight: "100vh" }}
    >
      {/* Header Section */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(22, 70, 121, 0.1)",
          borderLeft: `6px solid ${ACCENT_LIME}`,
          background: `linear-gradient(135deg, ${PRIMARY_BLUE}15 0%, #ffffff 100%)`,
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Avatar
                size={64}
                style={{
                  backgroundColor: PRIMARY_BLUE,
                  fontSize: 24,
                }}
                icon={<TeamOutlined />}
              />
              <div>
                <Title level={2} style={{ margin: 0, color: PRIMARY_BLUE }}>
                  Deferral Approver Dashboard
                </Title>
                <Text type="secondary" style={{ fontSize: 15 }}>
                  Welcome back,{" "}
                  <Text strong style={{ color: PRIMARY_BLUE }}>
                    Approver
                  </Text>{" "}
                  • Last login: Today at {dayjs().format("HH:mm")}
                </Text>
              </div>
            </div>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<HistoryOutlined />}
                onClick={() => navigate("/approver/history")}
                size="large"
              >
                Decision History
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => navigate("/approver/settings")}
                size="large"
              >
                Settings
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            size="small"
            style={{
              borderTop: `4px solid ${WARNING_ORANGE}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Statistic
              title="Pending Review"
              value={stats.pending}
              valueStyle={{ color: WARNING_ORANGE, fontSize: 28 }}
              prefix={<ClockCircleOutlined />}
              suffix={
                <Badge
                  count={stats.highPriority}
                  style={{
                    backgroundColor: ERROR_RED,
                    marginLeft: 8,
                  }}
                />
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            size="small"
            style={{
              borderTop: `4px solid ${SUCCESS_GREEN}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Statistic
              title="Approved"
              value={stats.approved}
              valueStyle={{ color: SUCCESS_GREEN, fontSize: 28 }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            size="small"
            style={{
              borderTop: `4px solid ${ERROR_RED}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Statistic
              title="Rejected"
              value={stats.rejected}
              valueStyle={{ color: ERROR_RED, fontSize: 28 }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            size="small"
            style={{
              borderTop: `4px solid ${ERROR_RED}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Statistic
              title="Non-Allowable"
              value={stats.nonAllowable}
              valueStyle={{ color: ERROR_RED, fontSize: 28 }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            size="small"
            style={{
              borderTop: `4px solid ${PRIMARY_BLUE}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Statistic
              title="Expiring Today"
              value={stats.expiringToday}
              valueStyle={{ color: PRIMARY_BLUE, fontSize: 28 }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            size="small"
            style={{
              borderTop: `4px solid ${ACCENT_LIME}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Statistic
              title="Total Requests"
              value={stats.total}
              valueStyle={{ color: ACCENT_LIME, fontSize: 28 }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* SLA Alert */}
      {stats.expiringToday > 0 && (
        <Alert
          message="SLA Alert"
          description={`${stats.expiringToday} deferral(s) are expiring within 24 hours. Please review them promptly.`}
          type="warning"
          showIcon
          icon={<BellOutlined />}
          style={{ marginBottom: 24 }}
          action={
            <Button
              size="small"
              type="primary"
              onClick={() => setPriorityFilter("high")}
            >
              Show High Priority
            </Button>
          }
        />
      )}

      {/* Main Content */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(22, 70, 121, 0.1)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginBottom: 24 }}
          tabBarExtraContent={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Progress
                percent={getSlaPercentage()}
                size="small"
                strokeColor={
                  getSlaPercentage() > 50 ? ERROR_RED : WARNING_ORANGE
                }
                style={{ width: 100 }}
                format={(percent) => `${percent}% SLA Risk`}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {getSlaPercentage()}% of pending items near SLA expiry
              </Text>
            </div>
          }
        >
          <TabPane
            tab={
              <span>
                <ClockCircleOutlined />
                Pending Review
                {stats.pending > 0 && (
                  <Badge
                    count={stats.pending}
                    style={{ marginLeft: 8, backgroundColor: WARNING_ORANGE }}
                  />
                )}
              </span>
            }
            key="pending"
          />
          <TabPane
            tab={
              <span>
                <CheckCircleOutlined />
                Approved
              </span>
            }
            key="approved"
          />
          <TabPane
            tab={
              <span>
                <CloseCircleOutlined />
                Rejected
              </span>
            }
            key="rejected"
          />
          <TabPane
            tab={
              <span>
                <ProfileOutlined />
                All Deferrals
              </span>
            }
            key="all"
          />
        </Tabs>

        {/* Filters */}
        <Card
          size="small"
          style={{
            marginBottom: 24,
            backgroundColor: "#fafafa",
            border: `1px solid ${PRIMARY_BLUE}20`,
          }}
          bodyStyle={{ padding: 16 }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={6}>
              <Input
                placeholder="Search deferrals..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                size="middle"
              />
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Category"
                style={{ width: "100%" }}
                value={categoryFilter}
                onChange={setCategoryFilter}
                size="middle"
              >
                <Option value="all">All Categories</Option>
                <Option value="Allowable">Allowable</Option>
                <Option value="Non-Allowable">Non-Allowable</Option>
              </Select>
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Type"
                style={{ width: "100%" }}
                value={typeFilter}
                onChange={setTypeFilter}
                size="middle"
              >
                <Option value="all">All Types</Option>
                <Option value="New">New</Option>
                <Option value="Extension">Extension</Option>
              </Select>
            </Col>
            <Col xs={24} md={4}>
              <Select
                placeholder="Priority"
                style={{ width: "100%" }}
                value={priorityFilter}
                onChange={setPriorityFilter}
                size="middle"
              >
                <Option value="all">All Priorities</Option>
                <Option value="high">High</Option>
                <Option value="medium">Medium</Option>
                <Option value="low">Low</Option>
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
                size="middle"
              />
            </Col>
            <Col xs={24} md={4}>
              <Button
                onClick={clearFilters}
                icon={<ReloadOutlined />}
                style={{ width: "100%" }}
                size="middle"
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" tip="Loading deferral requests..." />
          </div>
        ) : filteredData.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  No deferrals found
                </Title>
                <Text type="secondary">
                  {searchText
                    ? "Try adjusting your search terms or filters"
                    : activeTab === "pending"
                      ? "No pending deferrals at the moment"
                      : activeTab === "approved"
                        ? "No approved deferrals"
                        : "No rejected deferrals"}
                </Text>
              </div>
            }
            style={{ padding: 60 }}
          />
        ) : (
          <div
            style={{
              border: "1px solid #f0f0f0",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="_id"
              size="middle"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
                position: ["bottomRight"],
              }}
              scroll={{ x: 1500 }}
              onRow={(record) => ({
                onClick: () => {
                  setSelectedDeferral(record);
                  setModalOpen(true);
                },
                style: {
                  cursor: "pointer",
                  backgroundColor:
                    (record.status === "pending_approval" ||
                      record.status === "in_review") &&
                      record.priority === "high"
                      ? `${ERROR_RED}08`
                      : "white",
                },
              })}
              rowClassName={(record) =>
                (record.status === "pending_approval" ||
                  record.status === "in_review") &&
                  record.priority === "high"
                  ? "high-priority-row"
                  : ""
              }
            />
          </div>
        )}

        {/* Summary Footer */}
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "#f8f9fa",
            borderRadius: 8,
            fontSize: 12,
            color: "#666",
            border: `1px solid ${PRIMARY_BLUE}10`,
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Text type="secondary">
                Showing {filteredData.length} of {stats.total} total deferrals
              </Text>
            </Col>
            <Col>
              <Space>
                <Text type="secondary">
                  Report generated: {dayjs().format("DD/MM/YYYY HH:mm:ss")}
                </Text>
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => message.info("Export feature coming soon")}
                >
                  Export
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Review Modal */}
      {selectedDeferral && (
        <DeferralReviewModal
          deferral={selectedDeferral}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedDeferral(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Custom CSS for table rows */}
      <style>
        {`
          .high-priority-row:hover > td {
            background-color: #fff2f0 !important;
          }
          .ant-table-thead > tr > th {
            background-color: #fafafa !important;
            font-weight: 600 !important;
            color: ${PRIMARY_BLUE} !important;
          }
          .ant-table-tbody > tr:hover > td {
            background-color: rgba(181, 211, 52, 0.08) !important;
          }
        `}
      </style>
    </div>
  );
};

export default Approver;