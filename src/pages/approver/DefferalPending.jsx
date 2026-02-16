import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
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
  Modal,
  Form,
  Input as AntInput,
  DatePicker,
  message,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  CustomerServiceOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileDoneOutlined,
  PaperClipOutlined,
  MailOutlined,
  BankOutlined,
  BellOutlined,
  UploadOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import deferralApi from "../../service/deferralApi.js";

// Theme Colors (same as other queues)
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";

const { Text, Title } = Typography;
const { TextArea } = AntInput;

// Removed mock data here (now using live API)
// Removed mock items (now using live API)

// Helpers and detailed Deferral modal (matches RM view)
const customStyles = `
  .ant-modal-header { background-color: ${PRIMARY_BLUE} !important; padding: 18px 24px !important; }
  .ant-modal-title { color: white !important; font-size: 1.15rem !important; font-weight: 700 !important; letter-spacing: 0.5px; }
  .ant-modal-close-x { color: white !important; }
  .deferral-info-card .ant-card-head { border-bottom: 2px solid ${ACCENT_LIME} !important; }
  .deferral-info-card .ant-descriptions-item-label { font-weight: 600 !important; color: ${SECONDARY_PURPLE} !important; padding-bottom: 4px !important; }
  .deferral-info-card .ant-descriptions-item-content { color: ${PRIMARY_BLUE} !important; font-weight: 700 !important; font-size: 13px !important; }
`;

const getFileExtension = (filename) => {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  if (["jpg", "jpeg", "png", "gif", "bmp"].includes(ext)) return "image";
  return "other";
};

const getFileIcon = (type) => {
  switch (type) {
    case "pdf":
      return <FilePdfOutlined style={{ color: ERROR_RED }} />;
    case "word":
      return <FileWordOutlined style={{ color: PRIMARY_BLUE }} />;
    case "excel":
      return <FileExcelOutlined style={{ color: SUCCESS_GREEN }} />;
    case "image":
      return <FileImageOutlined style={{ color: SECONDARY_PURPLE }} />;
    default:
      return <FileTextOutlined />;
  }
};

const formatUsername = (username) => {
  if (!username) return "System";
  return username.replace(/\s*\([^)]*\)\s*$/, "").trim();
};

const getRoleTag = (role) => {
  let color = "blue";
  const roleLower = (role || "").toLowerCase();
  switch (roleLower) {
    case "rm":
      color = "purple";
      break;
    case "deferral management":
      color = "green";
      break;
    case "creator":
      color = "green";
      break;
    case "co_checker":
      color = "volcano";
      break;
    case "system":
      color = "default";
      break;
    default:
      color = "blue";
  }
  return (
    <Tag color={color} style={{ marginLeft: 8, textTransform: "uppercase" }}>
      {roleLower.replace(/_/g, " ")}
    </Tag>
  );
};

const CommentTrail = ({ history, isLoading }) => {
  if (isLoading) return <Spin className="block m-5" />;
  if (!history || history.length === 0)
    return <i className="pl-4">No historical comments yet.</i>;
  return (
    <div className="max-h-52 overflow-y-auto">
      <List
        dataSource={history}
        itemLayout="horizontal"
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} />}
              title={
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <b>{formatUsername(item.user) || "System"}</b>
                    {item.userRole ? getRoleTag(item.userRole) : null}
                  </div>
                  <span style={{ fontSize: 12, color: "#999" }}>
                    {dayjs(item.date).format("DD MMM YYYY HH:mm")}
                  </span>
                </div>
              }
              description={
                <div className="break-words">
                  {item.comment || item.notes || "No comment provided."}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

const DeferralReviewModal = ({ deferral, open, onClose, onDecision }) => {
  const [loadingComments, setLoadingComments] = useState(false);
  const [localDeferral, setLocalDeferral] = useState(deferral);

  useEffect(() => {
    setLocalDeferral(deferral);
  }, [deferral]);
  if (!localDeferral) return null;

  const status = localDeferral.status || "deferral_requested";
  const isPendingApproval = status === "deferral_requested";

  const getAllDocuments = () => {
    const all = [];
    (localDeferral.attachments || []).forEach((att, i) => {
      const isDCL = att.name && att.name.toLowerCase().includes("dcl");
      all.push({
        id: att.id || `att_${i}`,
        name: att.name,
        type: getFileExtension(att.name || ""),
        url: att.url,
        isDCL,
        isUploaded: true,
        source: "attachments",
        uploadDate: att.uploadDate,
      });
    });
    (localDeferral.additionalFiles || []).forEach((f, i) => {
      all.push({
        id: `add_${i}`,
        name: f.name,
        type: getFileExtension(f.name || ""),
        url: f.url,
        isAdditional: true,
        isUploaded: true,
        source: "additionalFiles",
      });
    });
    (localDeferral.selectedDocuments || []).forEach((d, i) => {
      all.push({
        id: `req_${i}`,
        name: typeof d === "string" ? d : d.name || d.label || "Document",
        type: d.type || "",
        isRequested: true,
        isSelected: true,
        source: "selected",
      });
    });
    (localDeferral.documents || []).forEach((d, i) => {
      all.push({
        id: d.id || `doc_${i}`,
        name: d.name,
        type: d.type || getFileExtension(d.name || ""),
        url: d.url,
        isDocument: true,
        isUploaded: !!d.url,
        source: "documents",
      });
    });
    return all;
  };

  const allDocs = getAllDocuments();
  const dclDocs = allDocs.filter((d) => d.isDCL);
  const uploadedDocs = allDocs.filter((d) => d.isUploaded && !d.isDCL);
  const requestedDocs = allDocs.filter((d) => d.isRequested || d.isSelected);

  // Determine an approver email from multiple possible sources so the Send Reminder button
  // can be shown/disabled appropriately when the deferral is pending approval.
  const approverEmail =
    localDeferral?.currentApprover?.email ||
    (localDeferral?.approverFlow &&
      (localDeferral.approverFlow[0]?.email ||
        localDeferral.approverFlow[0]?.user?.email)) ||
    (localDeferral?.approvers &&
      (localDeferral.approvers[0]?.email ||
        (typeof localDeferral.approvers[0] === "string" &&
          localDeferral.approvers[0].includes("@") &&
          localDeferral.approvers[0]))) ||
    null;

  const facilityColumns = [
    {
      title: "Facility Type",
      dataIndex: "facilityType",
      key: "facilityType",
      render: (t) => <Text strong>{t || "N/A"}</Text>,
    },
    {
      title: "Sanctioned (KES '000)",
      dataIndex: "sanctioned",
      key: "sanctioned",
      align: "right",
      render: (v, r) => {
        const val = v ?? r.amount ?? 0;
        return Number(val || 0).toLocaleString();
      },
    },
    {
      title: "Balance (KES '000)",
      dataIndex: "balance",
      key: "balance",
      align: "right",
      render: (v, r) => Number(v ?? r.balance ?? 0).toLocaleString(),
    },
    {
      title: "Headroom (KES '000)",
      dataIndex: "headroom",
      key: "headroom",
      align: "right",
      render: (v, r) =>
        Number(
          v ?? r.headroom ?? Math.max(0, (r.amount || 0) - (r.balance || 0)),
        ).toLocaleString(),
    },
  ];

  // Approval actions
  const token = useSelector((state) => state.auth.token);
  const currentUser = useSelector((state) => state.auth.user);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  const handleSendReminder = async () => {
    if (!localDeferral || !localDeferral._id) {
      message.error("No deferral selected");
      return;
    }

    setSendingReminder(true);
    try {
      const r = await deferralApi.sendReminder(localDeferral._id, token);
      if (r && r.success) {
        message.success(`Reminder sent to ${r.email || "approver"}`);
        try {
          const updated = await deferralApi.getDeferralById(localDeferral._id);
          setLocalDeferral(updated);
          try {
            window.dispatchEvent(
              new CustomEvent("deferral:updated", { detail: updated }),
            );
          } catch (e) {
            /* ignore */
          }
          if (onDecision) onDecision("refreshQueue");
        } catch (err) {
          console.debug("Failed to refresh deferral after reminder", err);
        }
      } else {
        message.error("Failed to send reminder");
      }
    } catch (err) {
      console.error("sendReminder error", err);
      message.error(err.message || "Failed to send reminder");
    } finally {
      setSendingReminder(false);
    }
  };

  const isCurrentUserApprover = (() => {
    const idx = localDeferral.currentApproverIndex ?? 0;
    const appr = localDeferral.approvers && localDeferral.approvers[idx];
    if (appr && appr.user) {
      const approverId = (appr.user._id || appr.user).toString();
      return (
        currentUser &&
        (currentUser._id || currentUser.id).toString() === approverId
      );
    }
    const first =
      (localDeferral.approverFlow && localDeferral.approverFlow[0]) ||
      (localDeferral.approvers &&
        localDeferral.approvers[0] &&
        (localDeferral.approvers[0].email || localDeferral.approvers[0].name));
    if (typeof first === "string") {
      return (
        (currentUser?.email && first.includes(currentUser.email)) ||
        (currentUser?.name && first.includes(currentUser.name))
      );
    }
    return false;
  })();

  const handleApprove = async () => {
    setApproving(true);
    try {
      const updated = await deferralApi.approveDeferral(
        localDeferral._id,
        token,
      );
      message.success("Deferral approved");
      setLocalDeferral(updated);
      if (onDecision) onDecision("approve", localDeferral._id, updated);
      if (onDecision) onDecision("refreshQueue");
      try {
        window.dispatchEvent(
          new CustomEvent("deferral:updated", { detail: updated }),
        );
      } catch (e) {
        console.debug("Failed to dispatch deferral:updated", e);
      }
    } catch (err) {
      message.error(err.message || "Failed to approve");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = () => {
    Modal.confirm({
      title: "Reject Deferral Request",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to reject this deferral request?</p>
          <p>
            <strong>{localDeferral?.deferralNumber}</strong> -{" "}
            {localDeferral?.customerName}
          </p>
          <p>Please provide a reason for rejection:</p>
          <Input.TextArea
            rows={3}
            placeholder="Enter rejection reason..."
            style={{ marginTop: 8 }}
            id={`rejectionComment_${localDeferral?._id}`}
          />
        </div>
      ),
      okText: "Yes, Reject",
      okType: "danger",
      okButtonProps: {
        style: { background: ERROR_RED, borderColor: ERROR_RED },
      },
      cancelText: "Cancel",
      async onOk() {
        const commentInput = document.getElementById(
          `rejectionComment_${localDeferral?._id}`,
        );
        const comment = commentInput?.value;
        if (!comment || comment.trim() === "") {
          message.error("Please provide a rejection reason");
          throw new Error("Rejection reason required");
        }
        setRejecting(true);
        try {
          const updated = await deferralApi.rejectDeferral(
            localDeferral._id,
            comment,
            token,
          );
          message.success("Deferral rejected");
          setLocalDeferral(updated);
          if (onDecision) onDecision("reject", localDeferral._id, updated);
          if (onDecision) onDecision("refreshQueue");
          try {
            window.dispatchEvent(
              new CustomEvent("deferral:updated", { detail: updated }),
            );
          } catch (e) {
            console.debug("Failed to dispatch deferral:updated", e);
          }
        } catch (err) {
          message.error(err.message || "Failed to reject");
        } finally {
          setRejecting(false);
        }
      },
    });
  };

  const footerButtons = [];
  const isWithdrawn = status === "withdrawn";

  if (isCurrentUserApprover && isPendingApproval && !isWithdrawn) {
    footerButtons.push(
      <Popconfirm
        key="confirmReject"
        title="Are you sure you want to reject this deferral?"
        onConfirm={handleReject}
        okText="Reject"
        cancelText="Cancel"
      >
        <Button key="reject" danger loading={rejecting}>
          Reject
        </Button>
      </Popconfirm>,
    );
    footerButtons.push(
      <Button
        key="approve"
        type="primary"
        onClick={handleApprove}
        loading={approving}
        style={{ backgroundColor: PRIMARY_BLUE, borderColor: PRIMARY_BLUE }}
      >
        Approve
      </Button>,
    );
  } else if (isWithdrawn) {
    footerButtons.push(
      <Button
        key="reject"
        danger
        disabled
        style={{
          backgroundColor: "#d9d9d9",
          borderColor: "#d9d9d9",
          color: "#8c8c8c",
        }}
      >
        Reject
      </Button>,
    );
    footerButtons.push(
      <Button
        key="approve"
        type="primary"
        disabled
        style={{
          backgroundColor: "#d9d9d9",
          borderColor: "#d9d9d9",
          color: "#8c8c8c",
        }}
      >
        Approve
      </Button>,
    );
  }
  footerButtons.push(
    <Button key="close" onClick={onClose}>
      Close
    </Button>,
  );

  return (
    <>
      <style>{customStyles}</style>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BankOutlined />{" "}
            <span>Deferral Request: {localDeferral.deferralNumber}</span>
          </div>
        }
        open={open}
        onCancel={onClose}
        width={950}
        styles={{ body: { padding: "0 24px 24px" } }}
        footer={footerButtons}
      >
        <Card
          className="deferral-info-card"
          size="small"
          title={
            <span style={{ color: PRIMARY_BLUE }}>Customer Information</span>
          }
          style={{ marginBottom: 18, marginTop: 24 }}
        >
          <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
            <Descriptions.Item label="Customer Name">
              <Text strong style={{ color: PRIMARY_BLUE }}>
                {localDeferral.customerName}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Customer Number">
              <Text strong style={{ color: PRIMARY_BLUE }}>
                {localDeferral.customerNumber}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Loan Type">
              <Text strong style={{ color: PRIMARY_BLUE }}>
                {localDeferral.loanType}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              <div>
                <Text strong style={{ color: PRIMARY_BLUE }}>
                  {dayjs(
                    localDeferral.createdAt || localDeferral.requestedDate,
                  ).format("DD MMM YYYY")}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                  {dayjs(
                    localDeferral.createdAt || localDeferral.requestedDate,
                  ).format("HH:mm")}
                </Text>
              </div>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          className="deferral-info-card"
          size="small"
          title={<span style={{ color: PRIMARY_BLUE }}>Deferral Details</span>}
          style={{ marginBottom: 18 }}
        >
          <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
            <Descriptions.Item label="Deferral Number">
              <Text strong style={{ color: PRIMARY_BLUE }}>
                {localDeferral.deferralNumber}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="DCL No">
              <Text strong style={{ color: PRIMARY_BLUE }}>
                {localDeferral.dclNo || localDeferral.dclNumber}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {status === "deferral_requested" ||
                status === "pending_approval" ? (
                <Tag color="processing" style={{ fontWeight: 700, color: WARNING_ORANGE }}>
                  Pending
                </Tag>
              ) : status === "deferral_approved" || status === "approved" ? (
                <Tag color="success" style={{ fontWeight: 700, color: SUCCESS_GREEN }}>
                  Approved
                </Tag>
              ) : status === "deferral_rejected" || status === "rejected" ? (
                <Tag color="error" style={{ fontWeight: 700, color: ERROR_RED }}>
                  Rejected
                </Tag>
              ) : (
                <div style={{ fontWeight: 500 }}>{status}</div>
              )}
            </Descriptions.Item>

            {/* Creator Status */}
            <Descriptions.Item label="Creator Status">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {(() => {
                  const creatorStatus =
                    localDeferral.creatorApprovalStatus || "pending";
                  if (creatorStatus === "approved") {
                    return (
                      <Tag
                        color="success"
                        style={{
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CheckCircleOutlined />
                        Approved
                      </Tag>
                    );
                  } else if (creatorStatus === "rejected") {
                    return (
                      <Tag
                        color="error"
                        style={{
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CloseCircleOutlined />
                        Rejected
                      </Tag>
                    );
                  }
                  return (
                    <Tag color="processing" style={{ fontWeight: 700 }}>
                      Pending
                    </Tag>
                  );
                })()}
                {localDeferral.creatorApprovalDate && (
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {dayjs(localDeferral.creatorApprovalDate).format(
                      "DD/MM/YY HH:mm",
                    )}
                  </span>
                )}
              </div>
            </Descriptions.Item>

            {/* Checker Status */}
            <Descriptions.Item label="Checker Status">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {(() => {
                  const checkerStatus =
                    localDeferral.checkerApprovalStatus || "pending";
                  if (checkerStatus === "approved") {
                    return (
                      <Tag
                        color="success"
                        style={{
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CheckCircleOutlined />
                        Approved
                      </Tag>
                    );
                  } else if (checkerStatus === "rejected") {
                    return (
                      <Tag
                        color="error"
                        style={{
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CloseCircleOutlined />
                        Rejected
                      </Tag>
                    );
                  }
                  return (
                    <Tag color="processing" style={{ fontWeight: 700 }}>
                      Pending
                    </Tag>
                  );
                })()}
                {localDeferral.checkerApprovalDate && (
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {dayjs(localDeferral.checkerApprovalDate).format(
                      "DD/MM/YY HH:mm",
                    )}
                  </span>
                )}
              </div>
            </Descriptions.Item>

            {/* Approvers Status */}
            <Descriptions.Item label="Approvers Status">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {(() => {
                  const approvers = localDeferral.approvals || [];
                  const approvedCount = approvers.filter(
                    (a) => a.status === "approved",
                  ).length;
                  const totalCount = approvers.length;

                  if (totalCount === 0) {
                    return (
                      <Tag color="processing" style={{ fontWeight: 700 }}>
                        No approvers
                      </Tag>
                    );
                  }

                  if (approvedCount === totalCount && totalCount > 0) {
                    return (
                      <Tag
                        color="success"
                        style={{
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CheckCircleOutlined />
                        All Approved
                      </Tag>
                    );
                  }

                  return (
                    <Tag color="processing" style={{ fontWeight: 700 }}>
                      {approvedCount} of {totalCount} Approved
                    </Tag>
                  );
                })()}
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
                    const amt = Number(localDeferral.loanAmount || 0);
                    if (!amt) return "Not specified";
                    return `KSh ${amt.toLocaleString()}`;
                  })()}
                </div>
                {(function () {
                  const amt = Number(localDeferral.loanAmount || 0);
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
                    localDeferral.daysSought > 45
                      ? ERROR_RED
                      : localDeferral.daysSought > 30
                        ? WARNING_ORANGE
                        : PRIMARY_BLUE,
                }}
              >
                {localDeferral.daysSought || 0} days
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Next Due Date">
              <div
                style={{
                  color:
                    localDeferral.nextDueDate ||
                      localDeferral.nextDocumentDueDate ||
                      localDeferral.requestedExpiry
                      ? dayjs(
                        localDeferral.nextDueDate ||
                        localDeferral.nextDocumentDueDate ||
                        localDeferral.requestedExpiry,
                      ).isBefore(dayjs())
                        ? ERROR_RED
                        : SUCCESS_GREEN
                      : PRIMARY_BLUE,
                }}
              >
                {localDeferral.nextDueDate ||
                  localDeferral.nextDocumentDueDate ||
                  localDeferral.requestedExpiry
                  ? `${dayjs(localDeferral.nextDueDate || localDeferral.nextDocumentDueDate || localDeferral.requestedExpiry).format("DD MMM YYYY")}`
                  : "Not calculated"}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="SLA Expiry">
              <div
                style={{
                  color:
                    localDeferral.slaExpiry &&
                      dayjs(localDeferral.slaExpiry).isBefore(dayjs())
                      ? ERROR_RED
                      : PRIMARY_BLUE,
                }}
              >
                {localDeferral.slaExpiry
                  ? dayjs(localDeferral.slaExpiry).format("DD MMM YYYY HH:mm")
                  : "Not set"}
              </div>
            </Descriptions.Item>

            {/* Created At */}
            <Descriptions.Item label="Created At">
              <div>
                <Text strong style={{ color: PRIMARY_BLUE }}>
                  {dayjs(
                    localDeferral.createdAt || localDeferral.requestedDate,
                  ).format("DD MMM YYYY")}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                  {dayjs(
                    localDeferral.createdAt || localDeferral.requestedDate,
                  ).format("HH:mm")}
                </Text>
              </div>
            </Descriptions.Item>
          </Descriptions>

          {localDeferral.deferralDescription && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Deferral Description
              </Text>
              <div
                style={{
                  padding: 12,
                  backgroundColor: "#f8f9fa",
                  borderRadius: 6,
                  border: "1px solid #e8e8e8",
                }}
              >
                <Text>{localDeferral.deferralDescription}</Text>
              </div>
            </div>
          )}
        </Card>

        {localDeferral.facilities && localDeferral.facilities.length > 0 && (
          <Card
            size="small"
            title={
              <span style={{ color: PRIMARY_BLUE }}>
                Facility Details ({localDeferral.facilities.length})
              </span>
            }
            style={{ marginBottom: 18 }}
          >
            <Table
              dataSource={localDeferral.facilities}
              columns={facilityColumns}
              pagination={false}
              size="small"
              rowKey={(r) =>
                r.facilityNumber ||
                r._id ||
                `facility-${Math.random().toString(36).slice(2)}`
              }
              scroll={{ x: 600 }}
            />
          </Card>
        )}

        {requestedDocs.length > 0 && (
          <Card
            size="small"
            title={
              <span style={{ color: PRIMARY_BLUE }}>
                Documents Requested for Deferrals ({requestedDocs.length})
              </span>
            }
            style={{ marginBottom: 18 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {requestedDocs.map((doc, idx) => {
                const isUploaded = uploadedDocs.some((u) =>
                  (u.name || "")
                    .toLowerCase()
                    .includes((doc.name || "").toLowerCase()),
                );
                const uploadedVersion = uploadedDocs.find((u) =>
                  (u.name || "")
                    .toLowerCase()
                    .includes((doc.name || "").toLowerCase()),
                );
                return (
                  <div
                    key={doc.id || idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      backgroundColor: isUploaded ? "#f6ffed" : "#fff7e6",
                      borderRadius: 6,
                      border: isUploaded
                        ? "1px solid #b7eb8f"
                        : "1px solid #ffd591",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <FileDoneOutlined
                        style={{
                          color: isUploaded ? SUCCESS_GREEN : WARNING_ORANGE,
                          fontSize: 16,
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontWeight: 500,
                            fontSize: 14,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {doc.name}
                          <Tag
                            color={isUploaded ? "green" : "orange"}
                            style={{ fontSize: 10 }}
                          >
                            {isUploaded ? "Uploaded" : "Requested"}
                          </Tag>
                        </div>
                        {doc.type && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#666",
                              marginTop: 4,
                            }}
                          >
                            <b>Type:</b> {doc.type}
                          </div>
                        )}
                        {uploadedVersion && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#666",
                              marginTop: 4,
                            }}
                          >
                            Uploaded as: {uploadedVersion.name}{" "}
                            {uploadedVersion.uploadDate
                              ? `• ${dayjs(uploadedVersion.uploadDate).format("DD MMM YYYY HH:mm")}`
                              : ""}
                          </div>
                        )}
                      </div>
                    </div>
                    <Space>
                      {isUploaded && uploadedVersion && uploadedVersion.url && (
                        <>
                          <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() =>
                              openFileInNewTab(uploadedVersion.url)
                            }
                            size="small"
                          >
                            View
                          </Button>
                          <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            onClick={() => {
                              downloadFile(
                                uploadedVersion.url,
                                uploadedVersion.name,
                              );
                              message.success(
                                `Downloading ${uploadedVersion.name}...`,
                              );
                            }}
                            size="small"
                          >
                            Download
                          </Button>
                        </>
                      )}
                    </Space>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card
          size="small"
          title={
            <span style={{ color: PRIMARY_BLUE }}>
              Mandatory: DCL Upload {dclDocs.length > 0 ? "✓" : ""}
            </span>
          }
          style={{ marginBottom: 18 }}
        >
          {dclDocs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dclDocs.map((doc, i) => (
                <div
                  key={doc.id || i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: "#f6ffed",
                    borderRadius: 6,
                    border: "1px solid #b7eb8f",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    {getFileIcon(doc.type)}
                    <div>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: 14,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {doc.name}
                        <Tag
                          color="red"
                          style={{ fontSize: 10, padding: "0 6px" }}
                        >
                          DCL Document
                        </Tag>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#666",
                          display: "flex",
                          gap: 12,
                          marginTop: 4,
                        }}
                      >
                        {doc.size && (
                          <span>
                            {doc.size > 1024
                              ? `${(doc.size / 1024).toFixed(2)} MB`
                              : `${doc.size} KB`}
                          </span>
                        )}
                        {doc.uploadDate && (
                          <span>
                            Uploaded:{" "}
                            {dayjs(doc.uploadDate).format("DD MMM YYYY HH:mm")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Space>
                    {doc.url && (
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => openFileInNewTab(doc.url)}
                        size="small"
                      >
                        View
                      </Button>
                    )}
                    {doc.url && (
                      <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        onClick={() => {
                          downloadFile(doc.url, doc.name);
                          message.success(`Downloading ${doc.name}...`);
                        }}
                        size="small"
                      >
                        Download
                      </Button>
                    )}
                  </Space>
                </div>
              ))}
              <div
                style={{
                  padding: 8,
                  backgroundColor: "#f6ffed",
                  borderRadius: 4,
                  marginTop: 8,
                }}
              >
                <Text type="success" style={{ fontSize: 12 }}>
                  ✓ {dclDocs.length} DCL document
                  {dclDocs.length !== 1 ? "s" : ""} uploaded successfully
                </Text>
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: 16,
                color: WARNING_ORANGE,
              }}
            >
              <UploadOutlined
                style={{ fontSize: 24, marginBottom: 8, color: WARNING_ORANGE }}
              />
              <div>No DCL document uploaded</div>
              <Text
                type="secondary"
                style={{ fontSize: 12, display: "block", marginTop: 4 }}
              >
                DCL document is required for submission
              </Text>
            </div>
          )}
        </Card>

        <Card
          size="small"
          title={
            <span style={{ color: PRIMARY_BLUE }}>
              <PaperClipOutlined style={{ marginRight: 8 }} /> Additional
              Uploaded Documents ({uploadedDocs.length})
            </span>
          }
          style={{ marginBottom: 18 }}
        >
          {uploadedDocs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {uploadedDocs.map((doc, i) => (
                <div
                  key={doc.id || i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: 6,
                    border: "1px solid #e8e8e8",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    {getFileIcon(doc.type)}
                    <div>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: 14,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {doc.name}
                        <Tag color="blue" style={{ fontSize: 10 }}>
                          Uploaded
                        </Tag>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#666",
                          display: "flex",
                          gap: 12,
                          marginTop: 4,
                        }}
                      >
                        {doc.size && (
                          <span>
                            {doc.size > 1024
                              ? `${(doc.size / 1024).toFixed(2)} MB`
                              : `${doc.size} KB`}
                          </span>
                        )}
                        {doc.uploadDate && (
                          <span>
                            Uploaded:{" "}
                            {dayjs(doc.uploadDate).format("DD MMM YYYY HH:mm")}
                          </span>
                        )}
                        {doc.isAdditional && (
                          <Tag
                            color="cyan"
                            style={{ fontSize: 10, padding: "0 4px" }}
                          >
                            Additional
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                  <Space>
                    {doc.url && (
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => openFileInNewTab(doc.url)}
                        size="small"
                      >
                        View
                      </Button>
                    )}
                    {doc.url && (
                      <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        onClick={() => {
                          downloadFile(doc.url, doc.name);
                          message.success(`Downloading ${doc.name}...`);
                        }}
                        size="small"
                      >
                        Download
                      </Button>
                    )}
                  </Space>
                </div>
              ))}
              <div
                style={{
                  padding: 8,
                  backgroundColor: "#f6ffed",
                  borderRadius: 4,
                  marginTop: 8,
                }}
              >
                <Text type="success" style={{ fontSize: 12 }}>
                  ✓ {uploadedDocs.length} document
                  {uploadedDocs.length !== 1 ? "s" : ""} uploaded
                </Text>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 16, color: "#999" }}>
              <PaperClipOutlined
                style={{ fontSize: 24, marginBottom: 8, color: "#d9d9d9" }}
              />
              <div>No additional documents uploaded</div>
              <Text
                type="secondary"
                style={{ fontSize: 12, display: "block", marginTop: 4 }}
              >
                You can upload additional supporting documents if needed
              </Text>
            </div>
          )}
        </Card>

        <Card
          size="small"
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>
                  Approval Flow{" "}
                  {isPendingApproval && (
                    <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>
                      Pending Approval
                    </Tag>
                  )}
                </span>
              </div>
              {isPendingApproval ? (
                <div style={{ marginLeft: 12 }}>
                  <Button
                    size="small"
                    icon={<BellOutlined />}
                    onClick={handleSendReminder}
                    loading={sendingReminder}
                    disabled={!approverEmail}
                    type="default"
                    style={{
                      borderColor: ACCENT_LIME,
                      color: PRIMARY_BLUE,
                      fontWeight: 600,
                    }}
                  >
                    Send Reminder
                  </Button>
                </div>
              ) : null}
            </div>
          }
          style={{ marginBottom: 18 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {localDeferral.approverFlow &&
              localDeferral.approverFlow.length > 0 ? (
              localDeferral.approverFlow.map((approver, index) => {
                const isCurrentApprover = index === 0;
                const hasEmail =
                  isCurrentApprover && localDeferral.currentApprover?.email;
                return (
                  <div
                    key={index}
                    style={{
                      padding: "12px 16px",
                      backgroundColor: isCurrentApprover
                        ? "#e6f7ff"
                        : "#fafafa",
                      borderRadius: 6,
                      border: isCurrentApprover
                        ? `2px solid ${PRIMARY_BLUE}`
                        : "1px solid #e8e8e8",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Badge
                      count={index + 1}
                      style={{
                        backgroundColor: isCurrentApprover
                          ? PRIMARY_BLUE
                          : "#bfbfbf",
                        fontSize: 12,
                        height: 24,
                        minWidth: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 14 }}>
                        {typeof approver === "object"
                          ? approver.name ||
                          approver.user?.name ||
                          approver.userId?.name ||
                          approver.email ||
                          approver.role ||
                          String(approver)
                          : approver}
                      </Text>
                      {isCurrentApprover && (
                        <div
                          style={{
                            fontSize: 12,
                            color: PRIMARY_BLUE,
                            marginTop: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <ClockCircleOutlined style={{ fontSize: 11 }} />
                          Current Approver • Pending Approval
                          {localDeferral.slaExpiry && (
                            <span
                              style={{ marginLeft: 8, color: WARNING_ORANGE }}
                            >
                              SLA:{" "}
                              {dayjs(localDeferral.slaExpiry).format(
                                "DD MMM HH:mm",
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {isCurrentApprover && isPendingApproval && hasEmail && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#666",
                          marginLeft: "auto",
                        }}
                      >
                        <MailOutlined style={{ marginRight: 4 }} />
                        {localDeferral.currentApprover.email}
                      </div>
                    )}
                  </div>
                );
              })
            ) : localDeferral.approvers &&
              localDeferral.approvers.length > 0 ? (
              localDeferral.approvers
                .filter((a) => a && a !== "")
                .map((approver, index) => {
                  const isCurrentApprover = index === 0;
                  const hasEmail =
                    isCurrentApprover && localDeferral.currentApprover?.email;
                  const isEmail =
                    typeof approver === "string" && approver.includes("@");
                  return (
                    <div
                      key={index}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: isCurrentApprover
                          ? "#e6f7ff"
                          : "#fafafa",
                        borderRadius: 6,
                        border: isCurrentApprover
                          ? `2px solid ${PRIMARY_BLUE}`
                          : "1px solid #e8e8e8",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Badge
                        count={index + 1}
                        style={{
                          backgroundColor: isCurrentApprover
                            ? PRIMARY_BLUE
                            : "#bfbfbf",
                          fontSize: 12,
                          height: 24,
                          minWidth: 24,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ fontSize: 14 }}>
                          {typeof approver === "string"
                            ? isEmail
                              ? approver.split("@")[0]
                              : approver
                            : approver.name ||
                            approver.user?.name ||
                            approver.userId?.name ||
                            approver.email ||
                            approver.role ||
                            String(approver)}
                        </Text>
                        {isCurrentApprover && (
                          <div
                            style={{
                              fontSize: 12,
                              color: PRIMARY_BLUE,
                              marginTop: 2,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <ClockCircleOutlined style={{ fontSize: 11 }} />
                            Current Approver • Pending Approval
                            {localDeferral.slaExpiry && (
                              <span
                                style={{ marginLeft: 8, color: WARNING_ORANGE }}
                              >
                                SLA:{" "}
                                {dayjs(localDeferral.slaExpiry).format(
                                  "DD MMM HH:mm",
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {isCurrentApprover && isPendingApproval && isEmail && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#666",
                            marginLeft: "auto",
                          }}
                        >
                          <MailOutlined style={{ marginRight: 4 }} />
                          {approver}
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              <div style={{ textAlign: "center", padding: 16, color: "#999" }}>
                <UserOutlined
                  style={{ fontSize: 24, marginBottom: 8, color: "#d9d9d9" }}
                />
                <div>No approvers specified</div>
              </div>
            )}
          </div>
        </Card>

        {/* Comments Input Section */}
        <Card size="small" style={{ marginBottom: 24, marginTop: 24 }}>
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
          >
            <div
              style={{
                width: 4,
                height: 20,
                backgroundColor: "#b5d334",
                marginRight: 12,
                borderRadius: 2,
              }}
            />
            <h4 style={{ color: PRIMARY_BLUE, margin: 0 }}>Comments</h4>
          </div>

          <AntInput.TextArea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={4}
            placeholder="Add any notes or comments for the deferral (optional)"
            maxLength={500}
            showCount
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 12,
              gap: 8,
            }}
          >
            <Button
              type="default"
              onClick={() => setNewComment("")}
              disabled={postingComment}
            >
              Clear
            </Button>
            <Button
              type="primary"
              onClick={handlePostComment}
              loading={postingComment}
              disabled={!newComment.trim()}
            >
              Post Comment
            </Button>
          </div>
        </Card>

        <div style={{ marginTop: 24 }}>
          <h4 style={{ color: PRIMARY_BLUE, marginBottom: 16 }}>
            Comment Trail & History
          </h4>
          {(function renderHistory() {
            const events = [];

            // Initial request - show requestor's real name and role
            const requesterName = localDeferral.requestor?.name || localDeferral.requestedBy || localDeferral.rmName || 'RM';
            const requesterRole = localDeferral.requestor?.role || 'RM';
            const requestComment = localDeferral.rmReason || 'Deferral request submitted';

            // Add initial request only if there's actual comment text
            if (requestComment && requestComment.trim() !== '') {
              events.push({
                user: requesterName,
                userRole: requesterRole,
                date: localDeferral.requestedDate || localDeferral.createdAt,
                comment: requestComment
              });
            }

            // Add all user-provided comments (includes co-creator and co-checker comments)
            if (localDeferral.comments && Array.isArray(localDeferral.comments) && localDeferral.comments.length > 0) {
              localDeferral.comments.forEach(c => {
                const commentAuthorName = c.author?.name || 'Unknown';
                const commentAuthorRole = c.author?.role || '';
                const commentText = c.text || '';

                // Only add if there's actual comment text
                if (commentText && commentText.trim() !== '') {
                  events.push({
                    user: commentAuthorName,
                    userRole: commentAuthorRole,
                    date: c.createdAt,
                    comment: commentText
                  });
                }
              });
            }

            // Add history items, but ONLY those with actual user comments (not system-generated messages)
            if (localDeferral.history && Array.isArray(localDeferral.history) && localDeferral.history.length > 0) {
              localDeferral.history.forEach(h => {
                // Skip system actions without user comments
                if (h.action === 'moved') {
                  return;
                }

                // Only include history items that have a 'comment' field with actual user input
                // Skip system-generated 'notes' that don't have corresponding user comments
                const userComment = h.comment || '';

                if (userComment && userComment.trim() !== '') {
                  const userName = h.user?.name || h.userName || h.user || 'Unknown';
                  const userRole = h.user?.role || h.userRole || h.role || '';
                  events.push({
                    user: userName,
                    userRole: userRole,
                    date: h.date || h.createdAt || h.timestamp || h.entryDate,
                    comment: userComment
                  });
                }
              });
            }

            // Sort events by date ascending
            const sorted = events.sort((a, b) => (new Date(a.date || 0)) - (new Date(b.date || 0)));
            return <CommentTrail history={sorted} isLoading={loadingComments} />;
          })()}
        </div>
      </Modal>
    </>
  );
};

// Main DeferralPending Component
const DeferralPending = ({ userId = "creator_current" }) => {
  const [selectedDeferral, setSelectedDeferral] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deferrals, setDeferrals] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");

  const token = useSelector((state) => state.auth.token);

  // Handle posting comments
  const handlePostComment = async () => {
    if (!newComment.trim()) {
      message.error("Please enter a comment before posting");
      return;
    }

    if (!selectedDeferral || !selectedDeferral._id) {
      message.error("No deferral selected");
      return;
    }

    setPostingComment(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      const commentData = {
        text: newComment.trim(),
        author: {
          name: currentUser.name || currentUser.user?.name || "User",
          role: currentUser.role || currentUser.user?.role || "user",
        },
        createdAt: new Date().toISOString(),
      };

      // Post comment to the backend
      await deferralApi.postComment(selectedDeferral._id, commentData, token);

      message.success("Comment posted successfully");

      // Clear the input
      setNewComment("");

      // Refresh the deferral to show the new comment
      const refreshedDeferral = await deferralApi.getDeferralById(
        selectedDeferral._id,
        token,
      );
      setSelectedDeferral(refreshedDeferral);

      // Update in the list
      const updatedDeferrals = deferrals.map((d) =>
        d._id === refreshedDeferral._id ? refreshedDeferral : d,
      );
      setDeferrals(updatedDeferrals);
    } catch (error) {
      console.error("Failed to post comment:", error);
      message.error(error.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  // Load data
  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/deferrals/approver/queue`,
        {
          headers: token ? { authorization: `Bearer ${token}` } : {},
        },
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDeferrals(data);
    } catch (err) {
      message.error("Failed to load pending deferrals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // Table dynamic height so it stretches to bottom of viewport
  const [tableHeight, setTableHeight] = useState(
    typeof window !== "undefined"
      ? Math.max(300, window.innerHeight - 480)
      : 600,
  );

  useEffect(() => {
    const handleResize = () => {
      setTableHeight(Math.max(300, window.innerHeight - 480));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = deferrals.filter(
      (d) => d.status === "pending_creator_review",
    );

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(
        (d) =>
          d.deferralNumber.toLowerCase().includes(searchText.toLowerCase()) ||
          d.dclNo.toLowerCase().includes(searchText.toLowerCase()) ||
          d.customerNumber.toLowerCase().includes(searchText.toLowerCase()) ||
          d.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
          d.businessName.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    return filtered;
  }, [deferrals, searchText]);

  // Handle decision
  const handleDecision = async (decisionData) => {
    setLoading(true);
    setTimeout(() => {
      setDeferrals((prev) =>
        prev.filter((d) => d._id !== selectedDeferral._id),
      );
      setLoading(false);
      setModalOpen(false);
      setSelectedDeferral(null);

      // Show success message
      message.success(
        decisionData.decision === "accept"
          ? "Deferral accepted successfully"
          : "Deferral rejected successfully",
      );
    }, 500);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchText("");
  };

  // Updated Columns as per your request
  const columns = [
    {
      title: "Deferral No",
      dataIndex: "deferralNumber",
      key: "deferralNumber",
      width: 140,
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
          <FileTextOutlined style={{ color: SECONDARY_PURPLE }} />
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
        <div style={{ color: SECONDARY_PURPLE, fontWeight: 500, fontSize: 13 }}>
          {text}
        </div>
      ),
      sorter: (a, b) => a.dclNo.localeCompare(b.dclNo),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      key: "customerName",
      width: 180,
      render: (text, record) => (
        <div
          style={{
            fontWeight: 600,
            color: PRIMARY_BLUE,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <CustomerServiceOutlined style={{ fontSize: 12 }} />
          <div>
            <div>{text}</div>
            <div style={{ fontSize: 11, color: "#666", fontWeight: "normal" }}>
              {record.businessName}
            </div>
            <div style={{ fontSize: 10, color: "#999" }}>
              {record.customerNumber}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
    },

    {
      title: "Days Sought",
      dataIndex: "daysSought",
      key: "daysSought",
      width: 100,
      align: "center",
      render: (days) => (
        <div
          style={{
            fontWeight: "bold",
            color:
              days > 45 ? ERROR_RED : days > 30 ? WARNING_ORANGE : PRIMARY_BLUE,
            fontSize: 14,
            backgroundColor:
              days > 45 ? "#fff2f0" : days > 30 ? "#fff7e6" : "#f0f7ff",
            padding: "4px 8px",
            borderRadius: 4,
            display: "inline-block",
          }}
        >
          {days} days
        </div>
      ),
      sorter: (a, b) => a.daysSought - b.daysSought,
    },
    {
      title: "RM",
      dataIndex: "rmRequestedBy",
      key: "rmRequestedBy",
      width: 130,
      render: (rm) => (
        <div style={{ fontSize: 12 }}>
          <div
            style={{
              fontWeight: 500,
              color: PRIMARY_BLUE,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <UserOutlined style={{ fontSize: 11 }} />
            {rm?.name}
          </div>
          <div style={{ color: "#666", fontSize: 11, fontStyle: "italic" }}>
            Relationship Manager
          </div>
        </div>
      ),
      sorter: (a, b) =>
        a.rmRequestedBy?.name?.localeCompare(b.rmRequestedBy?.name),
    },
    {
      title: "SLA",
      dataIndex: "slaExpiry",
      key: "slaExpiry",
      width: 100,
      fixed: "right",
      render: (date) => {
        const daysLeft = dayjs(date).diff(dayjs(), "days");
        const hoursLeft = dayjs(date).diff(dayjs(), "hours");

        let color = SUCCESS_GREEN;
        let text = `${daysLeft}d`;

        if (daysLeft <= 0 && hoursLeft <= 0) {
          color = ERROR_RED;
          text = "Expired";
        } else if (daysLeft <= 0) {
          color = ERROR_RED;
          text = `${hoursLeft}h`;
        } else if (daysLeft <= 1) {
          color = ERROR_RED;
          text = `${daysLeft}d`;
        } else if (daysLeft <= 3) {
          color = WARNING_ORANGE;
          text = `${daysLeft}d`;
        }

        return (
          <Tag
            color={color}
            style={{
              fontWeight: "bold",
              fontSize: 11,
              minWidth: 50,
              textAlign: "center",
            }}
          >
            {text}
          </Tag>
        );
      },
      sorter: (a, b) => dayjs(a.slaExpiry).diff(dayjs(b.slaExpiry)),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setSelectedDeferral(record);
            setModalOpen(true);
          }}
          style={{
            color: PRIMARY_BLUE,
            fontWeight: 500,
          }}
        >
          <EyeOutlined /> Review
        </Button>
      ),
    },
  ];

  // Custom table styles
  const customTableStyles = `
    .deferral-pending-table .ant-table-wrapper {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
      border: 1px solid #e0e0e0;
    }
    .deferral-pending-table .ant-table-thead > tr > th {
      background-color: #f7f7f7 !important;
      color: ${PRIMARY_BLUE} !important;
      font-weight: 700;
      fontSize: 13px;
      padding: 14px 12px !important;
      border-bottom: 3px solid ${ACCENT_LIME} !important;
      border-right: none !important;
    }
    .deferral-pending-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid #f0f0f0 !important;
      border-right: none !important;
      padding: 12px 12px !important;
      fontSize: 13px;
      color: #333;
    }
    .deferral-pending-table .ant-table-tbody > tr.ant-table-row:hover > td {
      background-color: rgba(181, 211, 52, 0.1) !important;
      cursor: pointer;
    }
    .deferral-pending-table .ant-table-row:hover .ant-table-cell:last-child {
      background-color: rgba(181, 211, 52, 0.1) !important;
    }
    .deferral-pending-table .ant-pagination .ant-pagination-item-active {
      background-color: ${ACCENT_LIME} !important;
      border-color: ${ACCENT_LIME} !important;
    }
    .deferral-pending-table .ant-pagination .ant-pagination-item-active a {
      color: ${PRIMARY_BLUE} !important;
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
        }}
        bodyStyle={{ padding: 16 }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <h2
              style={{
                margin: 0,
                color: PRIMARY_BLUE,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              Pending Deferrals
              <Badge
                count={filteredData.length}
                style={{
                  backgroundColor: ACCENT_LIME,
                  fontSize: 12,
                }}
              />
            </h2>
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
              Review and approve/reject deferral requests from Relationship
              Managers
            </p>
          </Col>
          <Col>
            <Button
              type="primary"
              onClick={() => {
                // Add any export or additional action
              }}
              style={{
                backgroundColor: PRIMARY_BLUE,
                borderColor: PRIMARY_BLUE,
              }}
            >
              Export to Excel
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card
        style={{
          marginBottom: 16,
          background: "#fafafa",
          border: `1px solid ${PRIMARY_BLUE}20`,
          borderRadius: 8,
        }}
        size="small"
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by Deferral No, DCL No, Customer, or Document"
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
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Summary Stats */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <Card size="small" style={{ flex: 1, minWidth: 150 }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: 24, fontWeight: "bold", color: PRIMARY_BLUE }}
            >
              {filteredData.length}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>Total Pending</div>
          </div>
        </Card>
        <Card size="small" style={{ flex: 1, minWidth: 150 }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: WARNING_ORANGE,
              }}
            >
              {
                filteredData.filter(
                  (d) => dayjs(d.slaExpiry).diff(dayjs(), "days") <= 1,
                ).length
              }
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>Urgent (≤1 day)</div>
          </div>
        </Card>
      </div>

      {/* Table Title */}
      <Divider style={{ margin: "12px 0" }}>
        <span style={{ color: PRIMARY_BLUE, fontSize: 16, fontWeight: 600 }}>
          Pending Deferral Review ({filteredData.length} items)
        </span>
      </Divider>

      {/* Table */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
          }}
        >
          <Spin tip="Loading deferral requests..." />
        </div>
      ) : filteredData.length === 0 ? (
        <Empty
          description={
            <div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>
                No pending deferral requests
              </p>
              <p style={{ color: "#999" }}>
                {searchText
                  ? "Try changing your search term"
                  : "All deferral requests have been processed"}
              </p>
            </div>
          }
          style={{ padding: 40 }}
        />
      ) : (
        <div
          className="deferral-pending-table"
          style={{ display: "flex", flexDirection: "column", flex: 1 }}
        >
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
                `${range[0]}-${range[1]} of ${total} deferrals`,
            }}
            scroll={{ x: 1200, y: tableHeight }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedDeferral(record);
                setModalOpen(true);
              },
            })}
            style={{ flex: 1 }}
          />
        </div>
      )}

      {/* Footer Info */}
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
            Report generated on: {dayjs().format("DD/MM/YYYY HH:mm:ss")}
          </Col>
          <Col>
            <Text type="secondary">
              Showing {filteredData.length} items • Data as of latest system
              update
            </Text>
          </Col>
        </Row>
      </div>

      {/* Deferral Review Modal */}
      {selectedDeferral && (
        <DeferralReviewModal
          deferral={selectedDeferral}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedDeferral(null);
          }}
          onDecision={handleDecision}
        />
      )}
    </div>
  );
};

export default DeferralPending;