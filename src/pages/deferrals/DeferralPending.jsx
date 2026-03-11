import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Tabs,
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
  message,
  Descriptions,
  Space,
  Upload,
  Form,
  Input as AntdInput,
  Progress,
  List,
  Avatar,
  Popconfirm,
  Dropdown,
  Menu,
  Collapse,
  Alert,
  Steps,
  Tooltip,
  Select,
  InputNumber,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  BankOutlined,
  LoadingOutlined,
  ReloadOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  MailOutlined,
  PaperClipOutlined,
  FileDoneOutlined,
  EyeOutlined,
  SendOutlined,
  BellOutlined,
  RightOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileImageOutlined,
  CloudUploadOutlined,
  FolderOpenOutlined,
  FileOutlined,
  PlusOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import getFacilityColumns from "../../utils/facilityColumns";
import dayjs from "dayjs";
import { openFileInNewTab, downloadFile } from "../../utils/fileUtils";
import { formatDeferralDocumentType } from "../../utils/deferralDocumentType";
import { getDeferralDocumentBuckets } from "../../utils/deferralDocuments";
import { getLoanDisplay } from "../../utils/loanUtils";
import deferralApi from "../../service/deferralApi.js";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import UniformTag from "../../components/common/UniformTag";
import ncbaLogoPNG from "../../assets/ncbabanklogo.png";
// Extension components removed — fresh extension flow will be implemented later
import { useGetApproversQuery } from "../../api/userApi";

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
const { TextArea } = AntdInput;
const { Panel } = Collapse;
const { Step } = Steps;
const { Option } = Select;

// Custom CSS for modal styling
const customStyles = `
  /* Core Modal Styling */
  .ant-modal-header { background-color: ${PRIMARY_BLUE} !important; padding: 18px 24px !important; }
  .ant-modal-title { color: white !important; font-size: 1.15rem !important; font-weight: 700 !important; letter-spacing: 0.5px; }
  .ant-modal-close-x { color: white !important; }

  /* Deferral Info Card Styling */
  .deferral-info-card .ant-card-head { border-bottom: 2px solid ${ACCENT_LIME} !important; }
  .deferral-info-card .ant-descriptions-item-label { font-weight: 600 !important; color: ${SECONDARY_PURPLE} !important; padding-bottom: 4px; }
  .deferral-info-card .ant-descriptions-item-content { color: ${PRIMARY_BLUE} !important; font-weight: 700 !important; font-size: 13px !important; }

  /* Form Controls */
  .ant-input, .ant-select-selector { border-radius: 6px !important; border-color: #e0e0e0 !important; }
  .ant-input:focus, .ant-select-focused .ant-select-selector { box-shadow: 0 0 0 2px rgba(22, 70, 121, 0.2) !important; border-color: ${PRIMARY_BLUE} !important; }

  /* Status Tags */
  .status-tag { font-weight: 700 !important; border-radius: 999px !important; padding: 3px 8px !important; text-transform: capitalize; min-width: 80px; text-align: center; display: inline-flex; align-items: center; gap: 4px; justify-content: center; }

  /* Deferral Modal Overlay - Full Screen */
  .deferral-modal-overlay {
    position: fixed;
    top: 65px;
    left: var(--sidebar-width, 150px);
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    z-index: 990;
    overflow: auto;
    padding-top: 20px;
    padding-bottom: 20px;
    transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
    max-height: 100vh;
  }

  /* Deferral Modal Container */
  .deferral-modal-container {
    background: white;
    border-radius: 12px;
    overflow: visible;
    width: 1200px;
    max-width: calc(100vw - 310px);
    box-shadow: none;
    border: 1px solid #e5e7eb;
    margin: 0 16px 0 96px;
    position: relative;
    z-index: 1001;
    display: flex;
    flex-direction: column;
    max-height: auto;
  }

  /* Deferral Modal Header */
  .deferral-modal-header {
    background-color: ${PRIMARY_BLUE} !important;
    padding: 18px 24px !important;
    border-radius: 12px 12px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    flex-shrink: 0;
  }

  .deferral-modal-header h3 {
    color: white !important;
    font-weight: 700 !important;
    margin: 0 !important;
  }

  /* Deferral Modal Body - Full scrolling */
  .deferral-modal-body {
    padding: 24px 24px 0 24px;
    overflow: auto;
    flex: 1;
    min-height: 0;
  }

  /* Deferral Modal Footer */
  .deferral-modal-footer {
    padding: 16px 24px;
    background: #fafafa;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    border-radius: 0 0 12px 12px;
    flex-shrink: 0;
  }

  .deferral-modal-footer .ant-btn {
    height: 32px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .deferral-modal-footer .ant-btn-primary {
    background-color: #164679 !important;
    border-color: #164679 !important;
    color: #ffffff !important;
  }

  .deferral-modal-footer .ant-btn-primary:hover {
    background-color: #0f3a5f !important;
    border-color: #0f3a5f !important;
    color: #ffffff !important;
  }

  .deferral-modal-footer .ant-btn-default {
    background-color: #ffffff !important;
    border-color: #d9d9d9 !important;
    color: #000000 !important;
  }

  .deferral-modal-footer .ant-btn-default:hover {
    background-color: #fafafa !important;
    border-color: #b3b3b3 !important;
    color: #000000 !important;
  }

  /* Comment List Styling - Compact Horizontal Layout */
  .deferral-comments-list .ant-list-item {
    padding: 8px 0 !important;
    border-bottom: 1px solid #f0f0f0 !important;
  }

  .deferral-comments-list .ant-list-item:last-child {
    border-bottom: none !important;
  }

  .deferral-comments-list .ant-list-item-meta {
    align-items: flex-start !important;
    margin-bottom: 0 !important;
  }

  .deferral-comments-list .ant-list-item-meta-content {
    flex: 1;
    min-width: 0;
  }

  .deferral-comments-list .ant-avatar {
    flex-shrink: 0;
  }

  /* Comment content row layout */
  .comment-content-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    line-height: 1.4;
  }

  .comment-author {
    font-weight: 600;
    color: ${PRIMARY_BLUE} !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
    font-size: 13px;
  }

  .comment-text {
    color: #4a4a4a;
    font-size: 13px;
    flex: 1;
    min-width: 200px;
  }

  .comment-timestamp {
    font-size: 11px;
    color: #999;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* Responsive adjustments */
  @media (min-width: 768px) and (max-width: 1099px) {
    .deferral-modal-overlay {
      left: var(--sidebar-width, 40px);
    }
  }

  @media (max-width: 767px) {
    .deferral-modal-overlay {
      left: 0;
      padding-left: 0;
      padding-right: 16px;
    }
    .deferral-modal-container {
      width: calc(100vw - 32px) !important;
      max-width: calc(100vw - 32px) !important;
      margin: 0 !important;
    }
    .comment-content-row {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;

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

const getRoleTag = (role) => {
  let color = "blue";
  const roleLower = (role || "").toLowerCase();
  switch (roleLower) {
    case "rm":
      color = "blue";
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
    <UniformTag
      color={color}
      text={roleLower.replace(/_/g, " ")}
      uppercase
      maxChars={14}
      style={{ marginLeft: 8 }}
    />
  );
};

// Helper function to remove role from username in brackets
const formatUsername = (username) => {
  if (!username) return "System";
  return username.replace(/\s*\([^)]*\)\s*$/, "").trim();
};

// Status Display Component - Shows real-time deferral status
const DeferralStatusAlert = ({ deferral, hideApprovedStatus }) => {
  if (!deferral) return null;

  const status = (deferral.status || "").toLowerCase();

  // Determine approval status
  const hasCreatorApproved = deferral.creatorApprovalStatus === "approved";
  const hasCheckerApproved = deferral.checkerApprovalStatus === "approved";
  const isFullyApproved =
    deferral.deferralApprovalStatus === "approved" ||
    (hasCreatorApproved && hasCheckerApproved);
  const isRejected =
    status === "deferral_rejected" ||
    status === "rejected" ||
    deferral.deferralApprovalStatus === "rejected";
  const isReturned =
    status === "returned_for_rework" ||
    deferral.deferralApprovalStatus === "returned";

  const getReturnedForReworkReason = () => {
    const directReason =
      deferral.returnReason || deferral.reworkReason || deferral.reworkComment;

    if (typeof directReason === "string" && directReason.trim()) {
      return directReason.trim();
    }

    const rawReworkComments = deferral.reworkComments;
    if (typeof rawReworkComments === "string" && rawReworkComments.trim()) {
      try {
        const parsed = JSON.parse(rawReworkComments);
        if (
          parsed &&
          typeof parsed.reworkComment === "string" &&
          parsed.reworkComment.trim()
        ) {
          return parsed.reworkComment.trim();
        }
      } catch {
        return rawReworkComments.trim();
      }
    }

    if (rawReworkComments && typeof rawReworkComments === "object") {
      const objectReason = rawReworkComments.reworkComment;
      if (typeof objectReason === "string" && objectReason.trim()) {
        return objectReason.trim();
      }
    }

    if (Array.isArray(deferral.comments) && deferral.comments.length > 0) {
      const rolePriority = [
        "creator",
        "cocreator",
        "co_creator",
        "checker",
        "cochecker",
        "co_checker",
      ];
      const normalizedRole = (value) =>
        String(value || "")
          .trim()
          .toLowerCase();
      const hasPreferredRole = (role) =>
        rolePriority.includes(normalizedRole(role));

      const preferredComment = [...deferral.comments]
        .reverse()
        .find((comment) => {
          const role =
            comment?.author?.role || comment?.authorRole || comment?.role;
          const text = comment?.text || comment?.comment;
          return (
            hasPreferredRole(role) && typeof text === "string" && text.trim()
          );
        });

      if (preferredComment) {
        return (preferredComment.text || preferredComment.comment || "").trim();
      }

      const latestComment = [...deferral.comments].reverse().find((comment) => {
        const text = comment?.text || comment?.comment;
        return typeof text === "string" && text.trim();
      });

      if (latestComment) {
        return (latestComment.text || latestComment.comment || "").trim();
      }
    }

    return "";
  };

  const returnedForReworkReason = getReturnedForReworkReason();

  // Check for approvers approval
  let allApproversApprovedLocal = false;
  if (deferral.approvals && deferral.approvals.length > 0) {
    allApproversApprovedLocal = deferral.approvals.every(
      (app) => app.status === "approved",
    );
  }

  // Also check allApproversApproved field directly
  if (typeof deferral.allApproversApproved !== "undefined") {
    allApproversApprovedLocal = deferral.allApproversApproved === true;
  }

  const isPartiallyApproved =
    (hasCreatorApproved || hasCheckerApproved || allApproversApprovedLocal) &&
    !isFullyApproved;
  const isUnderReview =
    status === "deferral_requested" ||
    status === "pending_approval" ||
    status === "in_review";
  const isClosed =
    status === "closed" ||
    status === "deferral_closed" ||
    status === "closed_by_co" ||
    status === "closed_by_creator";

  // Withdrawn by RM (closed metadata)
  const isWithdrawn =
    Boolean(deferral.closedByName) ||
    Boolean(deferral.ClosedByName) ||
    Boolean(deferral.closedAt) ||
    Boolean(deferral.ClosedAt) ||
    (isClosed && (deferral.closedByName || deferral.ClosedByName));

  const withdrawnByName =
    deferral.closedByName || deferral.ClosedByName || null;
  const withdrawnAt = deferral.closedAt || deferral.ClosedAt || null;

  // Withdrawn status (takes precedence over fully-approved banner)
  if (isWithdrawn) {
    return (
      <div
        style={{
          backgroundColor: `${ERROR_RED}15`,
          borderColor: `${ERROR_RED}40`,
          border: "1px solid",
          borderRadius: 8,
          padding: 16,
          marginBottom: 18,
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <CloseCircleOutlined style={{ color: ERROR_RED, fontSize: 24 }} />
          <div>
            <h3 style={{ margin: 0, color: ERROR_RED, fontWeight: 700 }}>
              Deferral Withdrawn
            </h3>
            <p style={{ margin: 4, color: "#666", fontSize: 14 }}>
              This deferral has been withdrawn by{" "}
              {withdrawnByName || "the Relationship Manager"}
              {withdrawnAt
                ? ` on ${dayjs(withdrawnAt).format("DD MMM YYYY")}`
                : ""}
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fully Approved Status
  if (isFullyApproved && !hideApprovedStatus) {
    return (
      <div
        style={{
          backgroundColor: `${SUCCESS_GREEN}15`,
          borderColor: `${SUCCESS_GREEN}40`,
          border: "1px solid",
          borderRadius: 8,
          padding: 16,
          marginBottom: 18,
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <CheckCircleOutlined style={{ color: SUCCESS_GREEN, fontSize: 24 }} />
          <div>
            <h3 style={{ margin: 0, color: SUCCESS_GREEN, fontWeight: 700 }}>
              Deferral Fully Approved ✓
            </h3>
            <p style={{ margin: 4, color: "#666", fontSize: 14 }}>
              All approvers, Creator, and Checker have approved this deferral
              request. You can now submit the deferred document before or during
              the next due date.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Rejected Status
  if (isRejected) {
    return (
      <div
        style={{
          backgroundColor: `${ERROR_RED}15`,
          borderColor: `${ERROR_RED}40`,
          border: "1px solid",
          borderRadius: 8,
          padding: 16,
          marginBottom: 18,
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <CloseCircleOutlined style={{ color: ERROR_RED, fontSize: 24 }} />
          <div>
            <h3 style={{ margin: 0, color: ERROR_RED, fontWeight: 700 }}>
              Deferral Rejected ✗
            </h3>
            <p style={{ margin: 4, color: "#666", fontSize: 14 }}>
              This deferral request has been rejected.{" "}
              {deferral.rejectionReason &&
                `Reason: ${deferral.rejectionReason}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Returned for Rework Status
  if (isReturned) {
    return (
      <div
        style={{
          backgroundColor: `${WARNING_ORANGE}15`,
          borderColor: `${WARNING_ORANGE}40`,
          border: "1px solid",
          borderRadius: 8,
          padding: 16,
          marginBottom: 18,
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <WarningOutlined style={{ color: WARNING_ORANGE, fontSize: 24 }} />
          <div>
            <h3 style={{ margin: 0, color: WARNING_ORANGE, fontWeight: 700 }}>
              Returned for Rework
            </h3>
            <p style={{ margin: 4, color: "#666", fontSize: 14 }}>
              This deferral has been returned for rework.{" "}
              {returnedForReworkReason && `Reason: ${returnedForReworkReason}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Partially Approved Status
  if (isPartiallyApproved) {
    return (
      <div
        style={{
          backgroundColor: `${PRIMARY_BLUE}15`,
          borderColor: `${PRIMARY_BLUE}40`,
          border: "1px solid",
          borderRadius: 8,
          padding: 16,
          marginBottom: 18,
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: PRIMARY_BLUE, fontWeight: 700 }}>
              {allApproversApprovedLocal
                ? "Pending CO Creator & Checker Approval"
                : "Deferral Partially Approved"}
            </h3>
            <p style={{ margin: 4, color: "#666", fontSize: 14 }}>
              {allApproversApprovedLocal
                ? "All approvers have approved. Awaiting CO Creator and CO Checker approval to complete the process."
                : "Awaiting approvals from remaining parties."}
            </p>
          </div>
        </div>
        <div
          style={{ fontSize: 13, color: "#666", marginTop: 8, paddingLeft: 36 }}
        >
          <div>
            Approvers: {allApproversApprovedLocal ? "All Approved" : "Pending"}
          </div>
          <div>CO Creator: {hasCreatorApproved ? "Approved" : "Pending"}</div>
          <div>CO Checker: {hasCheckerApproved ? "Approved" : "Pending"}</div>
        </div>
      </div>
    );
  }

  // Under Review Status
  if (isUnderReview) {
    return (
      <div
        style={{
          backgroundColor: `${PRIMARY_BLUE}15`,
          borderColor: `${PRIMARY_BLUE}40`,
          border: "1px solid",
          borderRadius: 8,
          padding: 16,
          marginBottom: 18,
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <ClockCircleOutlined style={{ color: PRIMARY_BLUE, fontSize: 24 }} />
          <div>
            <h3 style={{ margin: 0, color: PRIMARY_BLUE, fontWeight: 700 }}>
              Under Review by Approvers
            </h3>
            <p style={{ margin: 4, color: "#666", fontSize: 14 }}>
              This deferral request is currently awaiting approval from the
              approval chain
            </p>
          </div>
        </div>
        {deferral.slaExpiry && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: "#fff",
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            <span style={{ fontWeight: 600, color: SECONDARY_PURPLE }}>
              SLA Expiry:{" "}
            </span>
            <span
              style={{
                color: "#333",
              }}
            >
              {dayjs(deferral.slaExpiry).format("DD MMM YYYY HH:mm")}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Closed Status
  if (isClosed) {
    return (
      <div
        style={{
          backgroundColor: `${ACCENT_LIME}15`,
          borderColor: `${ACCENT_LIME}40`,
          border: "1px solid",
          borderRadius: 8,
          padding: 16,
          marginBottom: 18,
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <CheckCircleOutlined style={{ color: ACCENT_LIME, fontSize: 24 }} />
          <div>
            <h3 style={{ margin: 0, color: ACCENT_LIME, fontWeight: 700 }}>
              Document Submitted - Awaiting Approval
            </h3>
            <p style={{ margin: 4, color: "#666", fontSize: 14 }}>
              The deferred document has been submitted and is awaiting final
              approval from the Checker.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Helper function to get file extension type
const getFileExtension = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  if (["jpg", "jpeg", "png", "gif", "bmp"].includes(ext)) return "image";
  return "other";
};

// Enhanced Return for Rework Modal Component with Approver Selection
const ReturnForReworkModal = ({ open, onClose, deferral, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [selectedDocuments, setSelectedDocuments] = useState(
    deferral?.selectedDocuments || [],
  );
  const [dclFile, setDclFile] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [approverSlots, setApproverSlots] = useState([]);
  const [approverCustomized, setApproverCustomized] = useState(false);
  const { data: availableApprovers = [], isLoading: loadingApprovers } =
    useGetApproversQuery();

  const getRequestedDocuments = useCallback((deferralData) => {
    if (!deferralData) return [];

    const { requestedDocs = [] } = getDeferralDocumentBuckets(deferralData);
    if (requestedDocs.length > 0) {
      return requestedDocs.map((doc) => {
        if (typeof doc === "string") {
          return doc;
        }

        const docName = doc.name || doc.label || "Document";
        // Try to merge persisted per-document days (if present on deferral.selectedDocuments)
        // Use explicit undefined checks so 0 values are preserved
        let days =
          typeof doc.daysSought !== "undefined"
            ? doc.daysSought
            : typeof doc.requestedDaysSought !== "undefined"
              ? doc.requestedDaysSought
              : undefined;
        let nextDate =
          typeof doc.nextDocumentDueDate !== "undefined"
            ? doc.nextDocumentDueDate
            : typeof doc.nextDueDate !== "undefined"
              ? doc.nextDueDate
              : undefined;
        if (
          (typeof days === "undefined" || typeof nextDate === "undefined") &&
          Array.isArray(deferralData.selectedDocuments)
        ) {
          const match = deferralData.selectedDocuments.find((sd) => {
            const sdName = (sd && (sd.name || sd.label)) || String(sd || "");
            return (
              sdName &&
              sdName.toLowerCase().trim() === docName.toLowerCase().trim()
            );
          });
          if (match) {
            if (typeof days === "undefined")
              days =
                typeof match.daysSought !== "undefined"
                  ? match.daysSought
                  : typeof match.requestedDaysSought !== "undefined"
                    ? match.requestedDaysSought
                    : undefined;
            if (typeof nextDate === "undefined")
              nextDate =
                typeof match.nextDocumentDueDate !== "undefined"
                  ? match.nextDocumentDueDate
                  : typeof match.nextDueDate !== "undefined"
                    ? match.nextDueDate
                    : undefined;
          }
        }

        return {
          ...doc,
          name: docName,
          label: doc.label || docName,
          type: doc.type || "",
          documentType: doc.documentType || doc.docType || doc.type || "",
          category:
            doc.category || doc.documentCategory || doc.classification || "",
          allowability: doc.allowability || doc.allowableType || "",
          daysSought: typeof days !== "undefined" ? days : undefined,
          nextDocumentDueDate:
            typeof nextDate !== "undefined" ? nextDate : undefined,
        };
      });
    }

    return Array.isArray(deferralData.selectedDocuments)
      ? deferralData.selectedDocuments
      : [];
  }, []);

  // Pre-populate form with existing data
  useEffect(() => {
    if (deferral && open) {
      form.setFieldsValue({
        deferralDescription: deferral.deferralDescription || "",
        comments: "",
      });

      setSelectedDocuments(getRequestedDocuments(deferral));

      console.log("Deferral data in rework modal:", deferral);
      console.log("Approver flow:", deferral.approverFlow);
      console.log("Approvals:", deferral.approvals);
      console.log("Approvers:", deferral.approvers);

      // Initialize approver slots from existing approval flow
      // Check multiple possible field names for approver list
      const approverList =
        deferral.approverFlow || deferral.approvals || deferral.approvers;

      if (
        approverList &&
        Array.isArray(approverList) &&
        approverList.length > 0
      ) {
        console.log("Using existing approvers:", approverList);
        setApproverSlots(
          approverList.map((approver) => {
            // Extract userId - handle different possible field structures
            let extractedUserId = "";
            let extractedName = "";

            if (typeof approver.userId === "string") {
              extractedUserId = approver.userId;
            } else if (approver.userId?._id) {
              extractedUserId = approver.userId._id;
              extractedName = approver.userId.name || "";
            } else if (approver.user?._id) {
              extractedUserId = approver.user._id;
              extractedName = approver.user.name || "";
            } else if (approver._id) {
              extractedUserId = approver._id;
            }

            // Get name from various possible locations
            if (!extractedName) {
              extractedName =
                approver.name ||
                approver.user?.name ||
                approver.userId?.name ||
                "";
            }

            console.log(
              "Approver:",
              approver,
              "Extracted userId:",
              extractedUserId,
              "Name:",
              extractedName,
            );

            return {
              role: approver.role || "Approver",
              userId: extractedUserId,
              userName: extractedName,
              approved:
                approver.approved || approver.status === "approved" || false,
              locked:
                approver.approved === true || approver.status === "approved", // Lock approvers who have already approved
            };
          }),
        );
        setApproverCustomized(true);
      } else {
        console.log("No existing approvers found, using default roles");
        // Use default roles based on loan amount
        const defaultRoles = computeDefaultRoles(deferral);
        setApproverSlots(
          defaultRoles.map((role) => ({
            role,
            userId: "",
            approved: false,
            locked: false,
          })),
        );
        setApproverCustomized(false);
      }
    }
  }, [deferral, open, form, getRequestedDocuments]);

  // Compute default approver roles based on loan amount and document category
  const computeDefaultRoles = (deferralData) => {
    const loanAmount = deferralData?.loanAmount || 0;
    const documentCategory = deferralData?.selectedDocuments?.some(
      (d) =>
        (typeof d === "string" && d.toLowerCase().includes("primary")) ||
        (d.type && d.type.toLowerCase() === "primary"),
    )
      ? "Primary"
      : "Secondary";

    const LOAN_THRESHOLD = 75000000; // 75M

    if (documentCategory === "Primary") {
      if (loanAmount < LOAN_THRESHOLD) {
        return [
          "Head of Business Segment",
          "Director of Business Unit",
          "Senior Manager, Retail & Corporate Credit Approvals",
        ];
      }
      return [
        "Head of Business Segment",
        "Group Director of Business Unit",
        "Senior Manager, Retail & Corporate Credit Approvals",
      ];
    }

    // Secondary documents
    return [
      "Head of Business Segment",
      "Director of Business Unit",
      "Head of Credit Operations",
    ];
  };

  const handleSubmit = async (values) => {
    console.log("[Submit] Form values:", values);
    console.log("[Submit] Selected documents:", selectedDocuments);
    console.log("[Submit] Approver slots:", approverSlots);

    setLoading(true);
    try {
      // Filter out empty approver slots
      const validApprovers = approverSlots
        .filter((slot) => slot.userId)
        .map((slot) => ({
          role: slot.role,
          userId: slot.userId,
          name:
            availableApprovers.find((a) => a._id === slot.userId)?.name ||
            "Unknown",
        }));

      console.log("[Submit] Valid approvers:", validApprovers);

      if (validApprovers.length === 0) {
        message.error("Please select at least one approver");
        setLoading(false);
        return;
      }

      // Update deferral with new documents, description, and approvers
      console.log("[Submit] Sending update to backend...");
      const updatedDeferral = await deferralApi.updateDeferral(deferral._id, {
        deferralDescription: values.deferralDescription,
        selectedDocuments,
        approverFlow: validApprovers,
        status: "pending",
        resubmissionComments: values.comments,
        resubmittedAt: new Date().toISOString(),
      });

      console.log("[Submit] Backend response:", updatedDeferral);

      // Upload any new files
      if (dclFile) {
        console.log("[Submit] Uploading DCL file...");
        await deferralApi.uploadDocument(deferral._id, dclFile, {
          isDCL: true,
        });
      }

      if (additionalFiles.length > 0) {
        console.log(
          `[Submit] Uploading ${additionalFiles.length} additional files...`,
        );
        for (const file of additionalFiles) {
          await deferralApi.uploadDocument(deferral._id, file, {
            isAdditional: true,
          });
        }
      }

      message.success("Deferral resubmitted for review successfully!");

      // Update local state with the resubmitted deferral
      console.log("[Submit] Refreshing deferral...");
      const refreshedDeferral = await deferralApi.getDeferralById(deferral._id);
      console.log("[Submit] Refreshed deferral:", refreshedDeferral);

      onUpdate(refreshedDeferral);
      onClose();
    } catch (error) {
      console.error("[Submit] Error resubmitting deferral:", error);
      message.error(error?.message || "Failed to resubmit deferral for review");
    } finally {
      setLoading(false);
    }
  };

  // Remove a requested document from the list (persist immediately)
  const handleRemoveRequestedDocument = async (indexToRemove) => {
    try {
      const docToRemove = selectedDocuments[indexToRemove];
      const docName =
        typeof docToRemove === "string"
          ? docToRemove
          : docToRemove?.name ||
            docToRemove?.label ||
            docToRemove?.documentName;

      console.log(`[Delete] Attempting to remove index ${indexToRemove}`);
      console.log(`[Delete] Document to remove:`, docToRemove);
      console.log(`[Delete] Document name being removed: "${docName}"`);
      console.log(
        `[Delete] Full selectedDocuments list before delete:`,
        selectedDocuments,
      );

      const newSelected = selectedDocuments.filter(
        (_, i) => i !== indexToRemove,
      );

      console.log(
        `[Delete] Filtered selectedDocuments (deleted index ${indexToRemove}):`,
        newSelected,
      );
      console.log(
        `[Delete] Names being kept:`,
        newSelected.map((d) =>
          typeof d === "string" ? d : d?.name || d?.label || d?.documentName,
        ),
      );

      setSelectedDocuments(newSelected);

      // Persist change to backend so other modals reflect removal
      if (deferral && deferral._id) {
        try {
          // Normalize the data being sent to backend to match SelectedDocumentData structure
          const docsToSend = newSelected.map((d) => {
            if (typeof d === "string") {
              return { name: d, type: "", category: "" };
            }
            return {
              name: d?.name || d?.label || d?.documentName || "",
              type: d?.type || "",
              category: d?.category || d?.documentCategory || "",
              daysSought: d?.daysSought,
              nextDocumentDueDate: d?.nextDocumentDueDate,
            };
          });

          console.log(
            `[Delete] Normalized documents to send to backend:`,
            docsToSend,
          );
          console.log(
            `[Delete] Document names being sent:`,
            docsToSend.map((d) => d.name),
          );

          // Send the new (filtered) selectedDocuments to backend
          const updateResponse = await deferralApi.updateDeferral(
            deferral._id,
            {
              selectedDocuments: docsToSend,
            },
          );

          console.log(
            `[Delete] Backend update response for deferral ${deferral._id}:`,
            updateResponse,
          );

          // Refresh from backend to ensure consistency for multiple deletions
          const refreshed = await deferralApi.getDeferralById(deferral._id);

          console.log(
            `[Delete] Refreshed from backend - selectedDocuments:`,
            refreshed?.selectedDocuments,
          );
          console.log(
            `[Delete] Refreshed document names:`,
            refreshed?.selectedDocuments?.map((d) => d?.name || d) || [],
          );

          // Update the modal's selectedDocuments state with what the backend now has
          // This ensures indices remain correct for multiple deletions
          if (refreshed && refreshed.selectedDocuments) {
            console.log(
              `[Delete] Updating modal state with refreshed data from backend`,
            );
            setSelectedDocuments(refreshed.selectedDocuments);
          }

          // Notify other components (do NOT call parent onUpdate to avoid closing this modal)
          window.dispatchEvent(
            new CustomEvent("deferral:updated", { detail: refreshed }),
          );

          message.success(`"${docName}" removed from deferral`);
          // Intentionally do not call onUpdate(refreshed) here so the modal stays open
        } catch (err) {
          console.error("Failed to persist removed document", err);
          message.error("Failed to persist removed document");
          // Restore the document if persistence failed
          setSelectedDocuments(selectedDocuments);
        }
      }
    } catch (err) {
      console.error("Error removing requested document", err);
      message.error("Failed to remove document");
    }
  };

  // Approver management functions
  const addApprover = (insertIndex, role) => {
    setApproverCustomized(true);
    const next = [...approverSlots];
    const slot = {
      role: role || "Approver",
      userId: "",
      approved: false,
      locked: false,
    };

    if (typeof insertIndex === "number" && Number.isFinite(insertIndex)) {
      const clamped = Math.max(1, Math.min(insertIndex, next.length - 1));
      next.splice(clamped, 0, slot);
      setApproverSlots(next);
      return;
    }

    setApproverSlots([...approverSlots, slot]);
  };

  const updateApprover = (index, userId) => {
    setApproverCustomized(true);
    const arr = [...approverSlots];
    arr[index] = { ...arr[index], userId };
    setApproverSlots(arr);
  };

  const removeApprover = (index) => {
    setApproverCustomized(true);
    setApproverSlots(approverSlots.filter((_, i) => i !== index));
  };

  const resetToDefaultApprovers = () => {
    const defaultRoles = computeDefaultRoles(deferral);
    setApproverSlots(
      defaultRoles.map((role) => ({
        role,
        userId: "",
        approved: false,
        locked: false,
      })),
    );
    setApproverCustomized(false);
    message.info("Reset to default approvers");
  };

  // File upload handlers
  const handleDCLUpload = (file) => {
    // Check file type
    const allowedTypes = [
      ".pdf",
      ".PDF",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".png",
      ".jpg",
      ".jpeg",
    ];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      message.error(
        `File type not allowed. Please upload: ${allowedTypes.join(", ")}`,
      );
      return false;
    }

    setDclFile(file);
    message.success(`${file.name} selected for DCL upload`);
    return false;
  };

  const handleAdditionalFileUpload = (file) => {
    // Check file type
    const allowedTypes = [
      ".pdf",
      ".PDF",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".png",
      ".jpg",
      ".jpeg",
    ];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      message.error(
        `File type not allowed. Please upload: ${allowedTypes.join(", ")}`,
      );
      return false;
    }

    setAdditionalFiles((prev) => [...prev, file]);
    message.success(`${file.name} added to additional documents`);
    return false;
  };

  const removeDCLFile = () => {
    setDclFile(null);
    message.info("DCL file removed");
  };

  const removeAdditionalFile = (file) => {
    setAdditionalFiles((prev) => prev.filter((f) => f.uid !== file.uid));
    message.info(`${file.name} removed`);
  };

  // Document preview and download functions
  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return <FilePdfOutlined style={{ color: ERROR_RED }} />;
      case "doc":
      case "docx":
        return <FileWordOutlined style={{ color: PRIMARY_BLUE }} />;
      case "xls":
      case "xlsx":
        return <FileExcelOutlined style={{ color: SUCCESS_GREEN }} />;
      case "png":
      case "jpg":
      case "jpeg":
        return <FileImageOutlined style={{ color: WARNING_ORANGE }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  const handleViewDocument = (file) => {
    if (file && file.originFileObj) {
      const fileURL = URL.createObjectURL(file.originFileObj);
      window.open(fileURL, "_blank");
      setTimeout(() => {
        URL.revokeObjectURL(fileURL);
      }, 10000);
    } else if (file && file instanceof File) {
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, "_blank");
      setTimeout(() => {
        URL.revokeObjectURL(fileURL);
      }, 10000);
    } else if (file && file.url) {
      openFileInNewTab(file.url);
    } else {
      message.info("No preview available");
    }
  };

  const renderDocumentItem = (file, allowDelete = true, isDCL = false) => {
    const fileSize = file.size
      ? `${(file.size / 1024).toFixed(2)} KB`
      : "Size unknown";

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          border: "1px solid #f0f0f0",
          borderRadius: "6px",
          marginBottom: "8px",
          backgroundColor: "#fafafa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {getFileIcon(file.name)}
          <div>
            <Text strong style={{ display: "block", fontSize: "13px" }}>
              {file.name}
            </Text>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              {fileSize}
              {isDCL && (
                <Tag color="red" style={{ marginLeft: 8, fontSize: 10 }}>
                  DCL
                </Tag>
              )}
            </Text>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Tooltip title="View document">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: PRIMARY_BLUE }} />}
              onClick={() => handleViewDocument(file)}
            />
          </Tooltip>
          {allowDelete && (
            <Tooltip title="Delete document">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  isDCL ? removeDCLFile() : removeAdditionalFile(file)
                }
              />
            </Tooltip>
          )}
        </div>
      </div>
    );
  };

  // Helper to get existing documents from deferral
  const getAllDocuments = () => {
    const all = [];
    (deferral?.attachments || []).forEach((att, i) => {
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
    (deferral?.documents || []).forEach((d, i) => {
      const isDCL = d.isDCL || d.name?.toLowerCase().includes("dcl");
      all.push({
        id: d._id || d.id || `doc_${i}`,
        name: d.name,
        type: d.type || getFileExtension(d.name || ""),
        url: d.url,
        isDCL,
        isUploaded: true,
        source: "documents",
        uploadDate: d.uploadDate || d.uploadedAt,
      });
    });
    return all;
  };

  const existingDocs = getAllDocuments();

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ReloadOutlined style={{ color: WARNING_ORANGE }} />
          <span>Resubmit Deferral for Review</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={900}
      styles={{
        body: { maxHeight: "70vh", overflowY: "auto", paddingRight: 8 },
      }}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={async () => {
            try {
              console.log("[Button] Submit button clicked");
              console.log("[Button] Form values:", form.getFieldsValue(true));
              console.log("[Button] Approver slots:", approverSlots);

              // Validate form first
              const values = await form.validateFields();
              console.log(
                "[Button] Form validation passed, submitting...",
                values,
              );
              await handleSubmit(values);
            } catch (errorInfo) {
              console.error("[Button] Form validation failed:", errorInfo);
              if (errorInfo.errorFields && errorInfo.errorFields.length > 0) {
                const firstErrorField = errorInfo.errorFields[0];
                console.error(
                  `[Button] Validation error in ${firstErrorField.name.join(".")}:`,
                  firstErrorField.errors,
                );
                message.error(
                  `${firstErrorField.name.join(".")}: ${firstErrorField.errors.join(", ")}`,
                );
              }
            }
          }}
          style={{
            backgroundColor: PRIMARY_BLUE,
            borderColor: PRIMARY_BLUE,
            color: "#FFFFFF !important",
          }}
        >
          {loading ? "Resubmitting..." : "Resubmit for Review"}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Document Picker Section */}
        <Card
          size="small"
          title={
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: 4,
                  height: 20,
                  backgroundColor: ACCENT_LIME,
                  marginRight: 12,
                  borderRadius: 2,
                }}
              />
              <Title level={4} style={{ color: PRIMARY_BLUE, margin: 0 }}>
                Documents Requested for Deferrals ({selectedDocuments.length})
              </Title>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          {/* Document Cards Display */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {selectedDocuments.map((doc, index) => {
              const docName =
                typeof doc === "string" ? doc : doc.name || doc.label;
              const docType = formatDeferralDocumentType(
                typeof doc === "object"
                  ? {
                      name: doc.name || doc.label || docName,
                      type: doc.type || "",
                      documentType:
                        doc.documentType || doc.docType || doc.type || "",
                      category:
                        doc.category ||
                        doc.documentCategory ||
                        doc.classification ||
                        "",
                      allowability: doc.allowability || doc.allowableType || "",
                    }
                  : { name: docName },
              );

              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: 12,
                    backgroundColor: "#fffbf0",
                    border: "1px solid #ffe58f",
                    borderRadius: 6,
                  }}
                >
                  <FileTextOutlined
                    style={{ fontSize: 20, color: PRIMARY_BLUE, marginTop: 2 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <Text strong>{docName}</Text>
                      <Badge status="processing" text="Requested" />
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Type: {docType}
                    </Text>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Popconfirm
                      title={`Remove "${docName}" from deferral?`}
                      onConfirm={() => handleRemoveRequestedDocument(index)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      >
                        Remove
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* DCL Upload Section */}
        <Card
          size="small"
          title={
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: 4,
                  height: 20,
                  backgroundColor: ACCENT_LIME,
                  marginRight: 12,
                  borderRadius: 2,
                }}
              />
              <Title level={4} style={{ color: PRIMARY_BLUE, margin: 0 }}>
                Mandatory: DCL Upload
              </Title>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Upload
            accept=".pdf,.PDF,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            beforeUpload={handleDCLUpload}
            fileList={[]}
            maxCount={1}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              Upload DCL Document
            </Button>
          </Upload>

          <Text
            type="secondary"
            style={{ display: "block", marginTop: 8, fontSize: 13 }}
          >
            Upload a new DCL document if needed
          </Text>

          {dclFile && (
            <div style={{ marginTop: 16 }}>
              {renderDocumentItem(dclFile, true, true)}
            </div>
          )}
        </Card>

        {/* Additional Documents Section */}
        <Card
          size="small"
          title={
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: 4,
                  height: 20,
                  backgroundColor: ACCENT_LIME,
                  marginRight: 12,
                  borderRadius: 2,
                }}
              />
              <Title level={4} style={{ color: PRIMARY_BLUE, margin: 0 }}>
                Additional Documents
              </Title>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Upload
            accept=".pdf,.PDF,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            beforeUpload={handleAdditionalFileUpload}
            fileList={[]}
            multiple
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>
              Upload Additional Documents
            </Button>
          </Upload>

          <Text
            type="secondary"
            style={{ display: "block", marginTop: 8, fontSize: 13 }}
          >
            Upload any new supporting documents
          </Text>

          {additionalFiles.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {additionalFiles.map((file, index) => (
                <div key={file.uid || index}>{renderDocumentItem(file)}</div>
              ))}
            </div>
          )}
        </Card>

        {/* Approval Flow Section */}
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
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    width: 4,
                    height: 20,
                    backgroundColor: ACCENT_LIME,
                    marginRight: 12,
                    borderRadius: 2,
                  }}
                />
                <Title level={4} style={{ color: PRIMARY_BLUE, margin: 0 }}>
                  Approval Flow
                </Title>
              </div>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          {loadingApprovers ? (
            <div style={{ textAlign: "center", padding: 24 }}>
              <Spin tip="Loading approvers..." />
            </div>
          ) : (
            <>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {approverSlots.map((slot, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      backgroundColor: index % 2 === 0 ? "#fafafa" : "#fff",
                      borderRadius: 6,
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <Badge
                      count={index + 1}
                      style={{
                        backgroundColor: PRIMARY_BLUE,
                        minWidth: 24,
                        height: 24,
                        fontSize: 12,
                      }}
                    />

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          marginBottom: 8,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Text
                          strong
                          style={{ fontSize: 13, color: PRIMARY_BLUE }}
                        >
                          {slot.role}
                        </Text>
                        {slot.approved && (
                          <Tag
                            color="success"
                            icon={<CheckCircleOutlined />}
                            style={{ fontSize: 11 }}
                          >
                            Approved
                          </Tag>
                        )}
                      </div>

                      <Select
                        style={{ width: "100%" }}
                        placeholder="Select approver"
                        value={slot.userId || undefined}
                        onChange={(value) => updateApprover(index, value)}
                        disabled={slot.locked || slot.approved}
                        showSearch
                        optionFilterProp="children"
                      >
                        <Option key="placeholder" value="">
                          -- Choose Approver --
                        </Option>
                        {/* Show current approver even if not in availableApprovers yet */}
                        {slot.userId &&
                          slot.userName &&
                          !availableApprovers.find(
                            (a) => a._id === slot.userId,
                          ) && (
                            <Option value={slot.userId}>{slot.userName}</Option>
                          )}
                        {/* Show all available approvers */}
                        {Array.isArray(availableApprovers) &&
                        availableApprovers.length > 0 ? (
                          availableApprovers.map((approver) => (
                            <Option key={approver._id} value={approver._id}>
                              {approver.name}
                              {approver.position
                                ? ` — ${approver.position}`
                                : ""}
                            </Option>
                          ))
                        ) : (
                          <Option
                            key="no-approvers"
                            value="__no_approvers__"
                            disabled
                          >
                            No approvers available
                          </Option>
                        )}
                      </Select>
                    </div>

                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      {index < approverSlots.length - 1 && (
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => addApprover(index + 1, "Approver")}
                          style={{ marginRight: 6 }}
                        />
                      )}
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeApprover(index)}
                        disabled={
                          slot.locked ||
                          slot.approved ||
                          approverSlots.length <= 1
                        }
                        title={
                          slot.approved
                            ? "Cannot remove approver who has already approved"
                            : ""
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Note: Adding approvers is only allowed between existing approvers */}
              {(() => {
                const canAppendAfterFinal =
                  deferral &&
                  (String(deferral.status || "").toLowerCase() ===
                    "returned_by_creator" ||
                    (Array.isArray(approverSlots) &&
                      approverSlots.length > 0 &&
                      approverSlots.every((s) => s.approved)));
                if (canAppendAfterFinal) {
                  return (
                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        onClick={() => addApprover(undefined, "Approver")}
                        icon={<PlusOutlined />}
                      >
                        Add approver
                      </Button>
                    </div>
                  );
                }
                return null;
              })()}
            </>
          )}
        </Card>

        {/* Deferral Description */}
        <Form.Item
          name="deferralDescription"
          label="Deferral Description"
          rules={[
            { required: true, message: "Please enter deferral description" },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Update the reason for deferral..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* Comments for Resubmission */}
        <Form.Item
          name="comments"
          label="Comments for Resubmission"
          rules={[
            { required: true, message: "Please explain what changes you made" },
          ]}
        >
          <TextArea
            rows={3}
            placeholder="Explain what changes you made to the deferral request..."
            maxLength={300}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Enhanced Deferral Details Modal
const DeferralDetailsModal = ({
  deferral,
  open,
  onClose,
  onAction,
  headerTag,
  overrideDaysSought,
  overrideNextDueDate,
  readOnly = false,
  overrideApprovals,
}) => {
  const [addCommentVisible, setAddCommentVisible] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [localDeferral, setLocalDeferral] = useState(deferral);
  const [loadingRecall, setLoadingRecall] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingApproveClose, setLoadingApproveClose] = useState(false);
  const [closeRequestVisible, setCloseRequestVisible] = useState(false);
  const [closeRequestComment, setCloseRequestComment] = useState("");
  const [closeRequestDocumentInputs, setCloseRequestDocumentInputs] = useState(
    {},
  );
  const [withdrawConfirmVisible, setWithdrawConfirmVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [returnForReworkVisible, setReturnForReworkVisible] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [allApproversApproved, setAllApproversApproved] = useState(false);
  const [isEditingApprovers, setIsEditingApprovers] = useState(false);
  const [editableApproverSlots, setEditableApproverSlots] = useState([]);
  const [fixedBoundaryRoles, setFixedBoundaryRoles] = useState({
    first: "",
    last: "",
  });
  const [savingApproverChanges, setSavingApproverChanges] = useState(false);
  const {
    data: availableApprovers = [],
    isLoading: loadingAvailableApprovers,
  } = useGetApproversQuery();

  useEffect(() => {
    // Ensure loanType is resolved from various possible shapes so modal shows accurate value
    const resolveLoanType = (d) => {
      if (!d) return null;
      return (
        d.loanType ||
        d.deferralLoanType ||
        d.deferral?.loanType ||
        d.deferral?.loan?.loanType ||
        d.deferral?.loan?.type ||
        d.loan?.type ||
        null
      );
    };

    if (deferral) {
      console.log("DeferralDetailsModal - raw deferral prop:", deferral);
      const resolved = { ...deferral };
      const lt = resolveLoanType(deferral);
      if (lt) resolved.loanType = lt;
      setLocalDeferral(resolved);
      // Expose for easy copying from the browser console during debugging
      try {
        window.__lastDeferral = resolved;
      } catch (e) {
        /* ignore */
      }
      console.log("DeferralDetailsModal - resolved localDeferral:", resolved);
    } else {
      setLocalDeferral(deferral);
    }

    // Calculate if all approvers are approved
    // Use override approvals if provided (for extensions)
    if (deferral) {
      let allApproved = false;
      if (overrideApprovals) {
        // Use extension approval data
        allApproved = overrideApprovals.allApproversApproved || false;
      } else if (deferral.approverFlow || deferral.approvers) {
        const approvers = deferral.approverFlow || deferral.approvers || [];
        allApproved =
          approvers.length > 0 &&
          approvers.every((app) => app.approved || app.approved === true);
      }
      setAllApproversApproved(allApproved);
    }
  }, [deferral, overrideApprovals]);

  useEffect(() => {
    if (!open) {
      setCloseRequestVisible(false);
      setCloseRequestComment("");
      setCloseRequestDocumentInputs({});
    }
  }, [open]);

  const toApproverEditSlots = useCallback((targetDeferral) => {
    const sourceApprovers =
      targetDeferral?.approverFlow || targetDeferral?.approvers || [];

    if (!Array.isArray(sourceApprovers) || sourceApprovers.length === 0) {
      return [];
    }

    return sourceApprovers.map((approver) => {
      let extractedUserId = "";
      let extractedName = "";

      if (typeof approver?.userId === "string") {
        extractedUserId = approver.userId;
      } else if (approver?.userId?._id) {
        extractedUserId = approver.userId._id;
        extractedName = approver.userId.name || "";
      } else if (typeof approver?.user === "string") {
        extractedUserId = approver.user;
      } else if (approver?.user?._id) {
        extractedUserId = approver.user._id;
        extractedName = approver.user.name || "";
      } else if (approver?._id) {
        extractedUserId = approver._id;
      }

      if (!extractedName) {
        extractedName =
          approver?.name ||
          approver?.user?.name ||
          approver?.userId?.name ||
          "";
      }

      const isApproved =
        approver?.approved === true || approver?.approvalStatus === "approved";

      return {
        role: approver?.role || "Approver",
        userId: extractedUserId,
        userName: extractedName,
        approved: isApproved,
        locked: isApproved,
      };
    });
  }, []);

  const startEditingApprovers = () => {
    const slots = toApproverEditSlots(localDeferral);
    setEditableApproverSlots(slots);
    setFixedBoundaryRoles({
      first: slots[0]?.role || "",
      last: slots.length > 1 ? slots[slots.length - 1]?.role || "" : "",
    });
    setIsEditingApprovers(true);
  };

  const cancelEditingApprovers = () => {
    setIsEditingApprovers(false);
    setEditableApproverSlots([]);
    setFixedBoundaryRoles({ first: "", last: "" });
  };

  const updateEditableApprover = (index, userId) => {
    setEditableApproverSlots((prev) => {
      const next = [...prev];
      if (!next[index] || next[index].locked) return prev;
      const approverMeta = Array.isArray(availableApprovers)
        ? availableApprovers.find((a) => a._id === userId)
        : null;
      next[index] = {
        ...next[index],
        userId,
        userName: approverMeta?.name || next[index].userName || "",
      };
      return next;
    });
  };

  const addEditableApproverAt = (insertionIndex) => {
    setEditableApproverSlots((prev) => {
      const newSlot = {
        role: "Approver",
        userId: "",
        userName: "",
        approved: false,
        locked: false,
      };
      if (prev.length < 2) {
        return [...prev, newSlot];
      }

      const safeInsertionIndex = Math.max(
        1,
        Math.min(insertionIndex, prev.length - 1),
      );

      return [
        ...prev.slice(0, safeInsertionIndex),
        newSlot,
        ...prev.slice(safeInsertionIndex),
      ];
    });
  };

  const removeEditableApprover = (index) => {
    setEditableApproverSlots((prev) => {
      const lastIndex = prev.length - 1;
      if (index === 0 || index === lastIndex) return prev;
      if (!prev[index] || prev[index].locked) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const confirmApproverChanges = async () => {
    if (!localDeferral?._id) {
      message.error("Unable to update approvers: deferral id is missing");
      return;
    }

    if (!editableApproverSlots.length) {
      message.error("At least one approver is required");
      return;
    }

    const incompleteSlot = editableApproverSlots.find((slot) => !slot.userId);
    if (incompleteSlot) {
      message.error(
        "Please select users for all approver slots before confirming",
      );
      return;
    }

    setSavingApproverChanges(true);
    try {
      const normalizedSlots = editableApproverSlots.map((slot, index, arr) => {
        if (index === 0 && fixedBoundaryRoles.first) {
          return { ...slot, role: fixedBoundaryRoles.first };
        }

        if (index === arr.length - 1 && fixedBoundaryRoles.last) {
          return { ...slot, role: fixedBoundaryRoles.last };
        }

        return slot;
      });

      const approverFlow = normalizedSlots.map((slot) => {
        const approverMeta = Array.isArray(availableApprovers)
          ? availableApprovers.find((a) => a._id === slot.userId)
          : null;

        return {
          role: slot.role || "Approver",
          userId: slot.userId,
          name: approverMeta?.name || slot.userName || "Approver",
        };
      });

      const normalizedStatus = String(
        localDeferral?.status || "",
      ).toLowerCase();
      const shouldResetToPending = [
        "returned_for_rework",
        "returned_by_creator",
      ].includes(normalizedStatus);

      const approverUpdatePayload = shouldResetToPending
        ? { approverFlow, status: "pending" }
        : { approverFlow };

      await deferralApi.updateDeferral(
        localDeferral._id,
        approverUpdatePayload,
      );
      const refreshedDeferral = await deferralApi.getDeferralById(
        localDeferral._id,
      );

      setLocalDeferral(refreshedDeferral);
      setIsEditingApprovers(false);
      setEditableApproverSlots([]);
      setFixedBoundaryRoles({ first: "", last: "" });
      window.dispatchEvent(
        new CustomEvent("deferral:updated", { detail: refreshedDeferral }),
      );
      onAction &&
        onAction({
          status: "approversUpdated",
          updatedDeferral: refreshedDeferral,
        });
      message.success("Approver flow updated successfully");
    } catch (error) {
      console.error("Error updating approver flow:", error);
      message.error(error.message || "Failed to update approver flow");
    } finally {
      setSavingApproverChanges(false);
    }
  };

  // Send reminder to current approver
  const sendReminderToCurrentApprover = async () => {
    try {
      setSendingReminder(true);

      // Find current approver (first unapproved approver)
      let currentApprover = null;
      const approvers =
        localDeferral.approverFlow || localDeferral.approvers || [];

      for (const approver of approvers) {
        if (!approver.approved && !approver.rejected && !approver.returned) {
          currentApprover = approver;
          break;
        }
      }

      if (!currentApprover) {
        message.info(
          "All approvers have already approved or no approvers assigned",
        );
        return;
      }

      const stored = JSON.parse(localStorage.getItem("user") || "null");
      const token = stored?.token;
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      // Use API helper that logs a permanent system comment as well
      await deferralApi.sendReminderAndLog(localDeferral._id, token, {
        actorName: currentUser?.name || "System",
        text: `Reminder sent to ${currentApprover.name || currentApprover.email}`,
      });

      // Persist lastReminderSent locally so the Remind button stays hidden for an hour
      const lastSentISO = new Date().toISOString();
      try {
        localStorage.setItem(
          `deferral_reminder_${localDeferral._id}`,
          lastSentISO,
        );
      } catch (e) {
        console.warn("Failed to save reminder timestamp to localStorage", e);
      }

      // Also try to persist on server (best-effort) so other clients may see it
      try {
        await deferralApi.updateDeferral(
          localDeferral._id,
          { lastReminderSent: lastSentISO },
          token,
        );
      } catch (updErr) {
        console.warn(
          "Failed to persist lastReminderSent on server (non-fatal):",
          updErr,
        );
      }

      // Refresh the deferral so history is authoritative; localStorage timestamp will keep the button hidden locally
      try {
        const refreshed = await deferralApi.getDeferralById(
          localDeferral._id,
          token,
        );
        setLocalDeferral(refreshed);
        window.dispatchEvent(
          new CustomEvent("deferral:updated", { detail: refreshed }),
        );
      } catch (refreshErr) {
        console.warn("Failed to refresh deferral after reminder:", refreshErr);
      }

      message.success(
        `Reminder sent to ${currentApprover.name || currentApprover.email}`,
      );
    } catch (error) {
      console.error("Error sending reminder:", error);
      if (error.response?.status === 429) {
        message.warning(
          error.response?.data?.message ||
            "Please wait before sending another reminder",
        );
      } else {
        message.error("Failed to send reminder");
      }
    } finally {
      setSendingReminder(false);
    }
  };

  // Check if reminder can be sent (not sent in last hour)
  const canSendReminder = () => {
    // Prefer server-side timestamp when available
    let lastSentIso = localDeferral.lastReminderSent || null;

    // Fallback: check localStorage in case server doesn't persist the timestamp
    if (!lastSentIso) {
      try {
        lastSentIso =
          localStorage.getItem(`deferral_reminder_${localDeferral._id}`) ||
          null;
      } catch (e) {
        // ignore localStorage failures
      }
    }

    if (!lastSentIso) return true;

    const lastSent = new Date(lastSentIso);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return lastSent <= oneHourAgo;
  };

  // Calculate approver statistics
  const getApproverStats = () => {
    // Use override approvals if provided (for extensions)
    const approvers = overrideApprovals
      ? overrideApprovals.approvers || []
      : localDeferral.approverFlow || localDeferral.approvers || [];
    const totalApprovers = approvers.length;
    const approvedCount = approvers.filter(
      (a) => a.approved || a.approvalStatus === "approved",
    ).length;
    const pendingCount = totalApprovers - approvedCount;

    return {
      total: totalApprovers,
      approved: approvedCount,
      pending: pendingCount,
      percentage:
        totalApprovers > 0
          ? Math.round((approvedCount / totalApprovers) * 100)
          : 0,
    };
  };

  // Download Deferral as PDF - Professional NCBA Styling (Matching ReviewChecklistModal)
  const downloadDeferralAsPDF = async () => {
    if (!localDeferral || !localDeferral._id) {
      message.error("No deferral selected");
      return;
    }

    setActionLoading(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        putOnlyUsedFonts: true,
        compress: true,
      });

      // Professional Setup - Matching pdfGeneratorImproved standards
      const PRIMARY_BLUE_RGB = [22, 70, 121]; // #164679
      const BODY_TEXT_RGB = [40, 40, 40];
      const LIGHT_BLUE_RGB = [230, 240, 250];
      const PAGE_WIDTH = 210;
      const MARGIN_LEFT = 15;
      const MARGIN_RIGHT = 15;
      const MARGIN_RIGHT_POS = PAGE_WIDTH - MARGIN_RIGHT;
      const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 180mm

      // Set default font
      doc.setFont("courier", "normal");

      // Add NCBA Logo - top-right corner
      try {
        if (ncbaLogoPNG) {
          doc.addImage(ncbaLogoPNG, "PNG", MARGIN_RIGHT_POS - 40, 10, 40, 15);
          console.log("✅ NCBA Logo added successfully");
        }
      } catch (logoError) {
        console.warn("⚠️ Could not add logo:", logoError);
      }

      // Professional Header
      doc.setFontSize(20);
      doc.setFont("courier", "bold");
      doc.setTextColor(...PRIMARY_BLUE_RGB);
      doc.text("Deferral Request", 105, 18, { align: "center" });

      // Deferral number and date
      doc.setFontSize(10);
      doc.setFont("courier", "normal");
      doc.setTextColor(...BODY_TEXT_RGB);
      doc.text(
        `Deferral No: ${localDeferral.deferralNumber || "N/A"}`,
        MARGIN_LEFT,
        30,
      );
      doc.text(`Generated: ${dayjs().format("DD/MM/YYYY")}`, MARGIN_LEFT, 36);

      // Horizontal line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(MARGIN_LEFT, 40, MARGIN_RIGHT_POS, 40);

      let yPos = 50;

      // ===== DEFERRAL INFORMATION SECTION =====
      doc.setFontSize(14);
      doc.setFont("courier", "bold");
      doc.setTextColor(...PRIMARY_BLUE_RGB);
      doc.text("Deferral Information", MARGIN_LEFT, yPos);
      yPos += 8;

      const deferralInfoRows = [
        [
          "Deferral Number",
          localDeferral.deferralNumber || "N/A",
          "Status",
          localDeferral.status || "N/A",
        ],
        [
          "DCL Number",
          localDeferral.dclNumber || localDeferral.dclNo || "N/A",
          "Created Date",
          dayjs(localDeferral.createdAt).format("DD/MM/YYYY") || "N/A",
        ],
      ];

      if (typeof doc.autoTable === "function") {
        doc.autoTable({
          startY: yPos,
          head: [],
          body: deferralInfoRows,
          theme: "plain",
          styles: {
            fontSize: 10,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            textColor: BODY_TEXT_RGB,
            font: "courier",
          },
          columnStyles: {
            0: {
              cellWidth: 44,
              fontStyle: "bold",
              textColor: PRIMARY_BLUE_RGB,
            },
            1: { cellWidth: 46, textColor: BODY_TEXT_RGB },
            2: {
              cellWidth: 44,
              fontStyle: "bold",
              textColor: PRIMARY_BLUE_RGB,
            },
            3: { cellWidth: 46, textColor: BODY_TEXT_RGB },
          },
          margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
          didDrawCell: (data) => {
            if (data.column.index % 2 === 0 && data.section === "body") {
              data.cell.styles.fillColor = LIGHT_BLUE_RGB;
              data.cell.styles.textColor = PRIMARY_BLUE_RGB;
            }
          },
        });
        yPos = doc.lastAutoTable.finalY + 10;
      }

      // ===== CUSTOMER INFORMATION SECTION =====
      doc.setFontSize(14);
      doc.setFont("courier", "bold");
      doc.setTextColor(...PRIMARY_BLUE_RGB);
      doc.text("Customer Information", MARGIN_LEFT, yPos);
      yPos += 8;

      const customerRows = [
        [
          "Customer Name",
          localDeferral.customerName || "N/A",
          "Customer Number",
          localDeferral.customerNumber || "N/A",
        ],
        [
          "Loan Type",
          localDeferral.loanType || "N/A",
          "Loan Amount",
          localDeferral.loanAmount
            ? `KES ${new Intl.NumberFormat().format(localDeferral.loanAmount)}`
            : "N/A",
        ],
      ];

      if (typeof doc.autoTable === "function") {
        doc.autoTable({
          startY: yPos,
          head: [],
          body: customerRows,
          theme: "plain",
          styles: {
            fontSize: 10,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            textColor: BODY_TEXT_RGB,
            font: "courier",
          },
          columnStyles: {
            0: {
              cellWidth: 44,
              fontStyle: "bold",
              textColor: PRIMARY_BLUE_RGB,
            },
            1: { cellWidth: 46, textColor: BODY_TEXT_RGB },
            2: {
              cellWidth: 44,
              fontStyle: "bold",
              textColor: PRIMARY_BLUE_RGB,
            },
            3: { cellWidth: 46, textColor: BODY_TEXT_RGB },
          },
          margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
          didDrawCell: (data) => {
            if (data.column.index % 2 === 0 && data.section === "body") {
              data.cell.styles.fillColor = LIGHT_BLUE_RGB;
              data.cell.styles.textColor = PRIMARY_BLUE_RGB;
            }
          },
        });
        yPos = doc.lastAutoTable.finalY + 10;
      }

      // ===== APPROVAL STATUS SECTION =====
      const stats = getApproverStats();
      doc.setFontSize(14);
      doc.setFont("courier", "bold");
      doc.setTextColor(...PRIMARY_BLUE_RGB);
      doc.text("Approval Status", MARGIN_LEFT, yPos);
      yPos += 8;

      const approvalRows = [
        [
          "Creator Status",
          localDeferral.creatorApprovalStatus || "Pending",
          "Creator Date",
          localDeferral.creatorApprovalDate
            ? dayjs(localDeferral.creatorApprovalDate).format("DD/MM/YYYY")
            : "N/A",
        ],
        [
          "Checker Status",
          localDeferral.checkerApprovalStatus || "Pending",
          "Checker Date",
          localDeferral.checkerApprovalDate
            ? dayjs(localDeferral.checkerApprovalDate).format("DD/MM/YYYY")
            : "N/A",
        ],
        [
          "Approvers",
          `${stats.approved} of ${stats.total} Approved`,
          "Overall Status",
          localDeferral.overallStatus || "N/A",
        ],
      ];

      if (typeof doc.autoTable === "function") {
        doc.autoTable({
          startY: yPos,
          head: [],
          body: approvalRows,
          theme: "plain",
          styles: {
            fontSize: 10,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            textColor: BODY_TEXT_RGB,
            font: "courier",
          },
          columnStyles: {
            0: {
              cellWidth: 44,
              fontStyle: "bold",
              textColor: PRIMARY_BLUE_RGB,
            },
            1: { cellWidth: 46, textColor: BODY_TEXT_RGB },
            2: {
              cellWidth: 44,
              fontStyle: "bold",
              textColor: PRIMARY_BLUE_RGB,
            },
            3: { cellWidth: 46, textColor: BODY_TEXT_RGB },
          },
          margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
          didDrawCell: (data) => {
            if (data.column.index % 2 === 0 && data.section === "body") {
              data.cell.styles.fillColor = LIGHT_BLUE_RGB;
              data.cell.styles.textColor = PRIMARY_BLUE_RGB;
            }
          },
        });
        yPos = doc.lastAutoTable.finalY + 10;
      }

      // ===== DOCUMENTS TO BE DEFERRED (Professional Grid Table) =====
      if (requestedDocs && requestedDocs.length > 0) {
        doc.setFontSize(14);
        doc.setFont("courier", "bold");
        doc.setTextColor(...PRIMARY_BLUE_RGB);
        doc.text("Documents to be Deferred", MARGIN_LEFT, yPos);
        yPos += 8;

        const docTableRows = requestedDocs.map((doc_item, idx) => [
          (idx + 1).toString(),
          doc_item.name || "N/A",
          formatDeferralDocumentType(doc_item) || "N/A",
          typeof doc_item.daysSought !== "undefined"
            ? `${doc_item.daysSought || 0} days`
            : "-",
          doc_item.status === "uploaded"
            ? "Uploaded"
            : doc_item.status === "none"
              ? "Requested"
              : doc_item.status || "Pending",
        ]);

        if (typeof doc.autoTable === "function") {
          doc.autoTable({
            startY: yPos,
            head: [["#", "Document Name", "Type", "Days Sought", "Status"]],
            body: docTableRows,
            theme: "grid",
            styles: {
              fontSize: 7,
              cellPadding: 2,
              lineColor: PRIMARY_BLUE_RGB,
              textColor: BODY_TEXT_RGB,
              font: "courier",
              valign: "top",
            },
            headStyles: {
              fillColor: PRIMARY_BLUE_RGB,
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 7,
              font: "courier",
            },
            columnStyles: {
              0: { cellWidth: 12 },
              1: { cellWidth: 80 },
              2: { cellWidth: 40 },
              3: { cellWidth: 35 },
              4: { cellWidth: 33 },
            },
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
          });
          yPos = doc.lastAutoTable.finalY + 10;
        }
      }

      // ===== COMMENT TRAIL (Professional Grid Table) =====
      if (localDeferral.comments && localDeferral.comments.length > 0) {
        doc.setFontSize(14);
        doc.setFont("courier", "bold");
        doc.setTextColor(...PRIMARY_BLUE_RGB);
        doc.text("Comment Trail", MARGIN_LEFT, yPos);
        yPos += 8;

        const commentTableRows = localDeferral.comments.map((comment) => {
          const authorName =
            comment.author?.name || comment.authorName || "User";
          const commentText = comment.text || comment.comment || "";
          const commentDate = comment.createdAt
            ? dayjs(comment.createdAt).format("DD/MM/YYYY HH:mm")
            : "";

          return [
            commentDate,
            authorName,
            commentText.substring(0, 100) +
              (commentText.length > 100 ? "..." : ""),
          ];
        });

        if (typeof doc.autoTable === "function") {
          doc.autoTable({
            startY: yPos,
            head: [["Date", "User", "Comment"]],
            body: commentTableRows,
            theme: "grid",
            styles: {
              fontSize: 7,
              cellPadding: 2,
              lineColor: PRIMARY_BLUE_RGB,
              textColor: BODY_TEXT_RGB,
              font: "courier",
              valign: "top",
              overflow: "linebreak",
            },
            headStyles: {
              fillColor: PRIMARY_BLUE_RGB,
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 7,
              font: "courier",
            },
            columnStyles: {
              0: { cellWidth: 42 },
              1: { cellWidth: 40 },
              2: { cellWidth: 98 },
            },
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
          });
          yPos = doc.lastAutoTable.finalY + 10;
        }
      }

      // ===== PROFESSIONAL FOOTER WITH NCBA BRANDING =====
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} • NCBA Bank • Confidential`,
          PAGE_WIDTH / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" },
        );
      }

      // Save the PDF
      doc.save(
        `Deferral_${localDeferral.deferralNumber}_${dayjs().format("YYYYMMDD")}.pdf`,
      );
      message.success("Deferral downloaded as PDF successfully!");
    } catch (error) {
      console.error("Error downloading file:", error);
      message.error("Failed to download deferral. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Download as CSV
  const downloadDeferralAsCSV = async () => {
    if (!localDeferral) {
      message.error("No deferral selected");
      return;
    }

    try {
      const csvContent = [
        ["Deferral Details Report"],
        ["Generated on:", dayjs().format("DD MMM YYYY HH:mm")],
        [],
        ["Deferral Number:", localDeferral.deferralNumber],
        ["Customer Name:", localDeferral.customerName],
        ["Customer Number:", localDeferral.customerNumber],
        ["DCL No:", localDeferral.dclNo || localDeferral.dclNumber],
        ["Status:", localDeferral.status],
        [
          "Created At:",
          dayjs(localDeferral.createdAt).format("DD MMM YYYY HH:mm"),
        ],
        [],
        ["Approval Statistics:"],
        ["Total Approvers:", getApproverStats().total],
        ["Approved:", getApproverStats().approved],
        ["Pending:", getApproverStats().pending],
        ["Progress:", `${getApproverStats().percentage}%`],
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Deferral_${localDeferral.deferralNumber}_${dayjs().format("YYYYMMDD")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      message.success("Deferral downloaded as CSV successfully!");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      message.error("Failed to download CSV file");
    }
  };

  // Handle posting comments
  const handlePostComment = async () => {
    if (!newComment.trim()) {
      message.error("Please enter a comment before posting");
      return;
    }

    if (!localDeferral || !localDeferral._id) {
      message.error("No deferral selected");
      return;
    }

    setPostingComment(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      const token = stored?.token;

      const commentData = {
        text: newComment.trim(),
        author: {
          name: currentUser.name || currentUser.user?.name || "User",
          role: currentUser.role || currentUser.user?.role || "user",
        },
        createdAt: new Date().toISOString(),
      };

      await deferralApi.postComment(localDeferral._id, commentData, token);
      message.success("Comment posted successfully");
      setNewComment("");

      // Refresh deferral
      const refreshedDeferral = await deferralApi.getDeferralById(
        localDeferral._id,
        token,
      );
      setLocalDeferral(refreshedDeferral);
    } catch (error) {
      console.error("Failed to post comment:", error);
      message.error(error.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  // Handle Recall Deferral
  const handleRecallDeferral = async () => {
    Modal.confirm({
      title: "Recall Deferral",
      content:
        "Are you sure you want to recall this deferral request? This will notify all approvers via email and the deferral will remain in the Pending tab.",
      okText: "Yes, Recall",
      cancelText: "Cancel",
      okButtonProps: {
        style: {
          background: WARNING_ORANGE,
          borderColor: WARNING_ORANGE,
          color: "white",
        },
      },
      onOk: async () => {
        setLoadingRecall(true);
        try {
          const deferralId = localDeferral?._id || localDeferral?.id;
          if (!deferralId) {
            throw new Error("Unable to recall: deferral id is missing");
          }

          const recallResponse = await deferralApi.recallDeferral(deferralId, {
            reason: "recalled by rm",
          });

          const updatedDeferral = recallResponse?.deferral ||
            recallResponse?.data || {
              ...localDeferral,
              status: "pending_approval",
              currentApproverIndex: 0,
            };

          let emailNotificationFailed = false;
          try {
            await deferralApi.sendEmailNotification(deferralId, "recall", {
              deferralNumber: localDeferral.deferralNumber,
              message: "Your deferral request has been recalled.",
            });
          } catch (emailError) {
            emailNotificationFailed = true;
            console.warn(
              "Recall completed but notification failed:",
              emailError,
            );
          }

          if (emailNotificationFailed) {
            message.warning(
              "Deferral recalled successfully, but email notification failed.",
            );
          } else {
            message.success(
              "Deferral recalled successfully. All approvers have been notified.",
            );
          }

          window.dispatchEvent(
            new CustomEvent("deferral:updated", { detail: updatedDeferral }),
          );
          onAction && onAction({ status: "recalled", updatedDeferral });
          onClose();
        } catch (error) {
          message.error(`Failed to recall deferral: ${error.message}`);
        } finally {
          setLoadingRecall(false);
        }
      },
    });
  };

  // Handle Withdraw Request
  const handleWithdrawRequest = () => {
    setWithdrawConfirmVisible(true);
  };

  const handleConfirmWithdraw = async () => {
    setLoadingWithdraw(true);
    try {
      const deferralId = localDeferral?._id || localDeferral?.id;
      if (!deferralId) {
        throw new Error("Unable to withdraw: deferral id is missing");
      }

      // Call withdraw endpoint to terminate the deferral and mark RM as withdrawer
      const withdrawResponse = await deferralApi.withdrawDeferral(deferralId, {
        reason: "withdrawn by rm",
        comment: "Withdrawn by RM via UI",
      });
      const updatedDeferral = withdrawResponse?.deferral ||
        withdrawResponse || { ...localDeferral, status: "closed" };

      let emailNotificationFailed = false;
      try {
        await deferralApi.sendEmailNotification(deferralId, "withdrawal", {
          deferralNumber: localDeferral.deferralNumber,
          customerName: localDeferral.customerName,
          message:
            "The deferral request has been withdrawn by the Relationship Manager.",
        });
      } catch (emailError) {
        emailNotificationFailed = true;
        console.warn(
          "Withdrawal completed but notification failed:",
          emailError,
        );
      }

      if (emailNotificationFailed) {
        message.warning(
          "Deferral recalled (withdrawn) successfully, but email notification failed.",
        );
      } else {
        message.success(
          "Deferral recalled (withdrawn) successfully. All approvers have been notified.",
        );
      }
      window.dispatchEvent(
        new CustomEvent("deferral:updated", { detail: updatedDeferral }),
      );
      onAction && onAction({ status: "withdrawn", updatedDeferral });
      setWithdrawConfirmVisible(false);
      onClose();
    } catch (error) {
      console.error("Withdraw request error:", error);
      message.error(`Failed to withdraw deferral: ${error.message}`);
    } finally {
      setLoadingWithdraw(false);
    }
  };

  const handleOpenCloseRequest = () => {
    setCloseRequestComment("");
    setCloseRequestDocumentInputs({});
    setCloseRequestVisible(true);
  };

  const setCloseRequestDocumentFile = (documentName, fileList) => {
    setCloseRequestDocumentInputs((prev) => ({
      ...prev,
      [documentName]: {
        ...(prev[documentName] || {}),
        fileList,
      },
    }));
  };

  const handleSubmitCloseRequest = async () => {
    const deferralId = localDeferral?._id || localDeferral?.id;
    if (!deferralId) {
      message.error("Unable to submit close request: deferral id is missing");
      return;
    }

    setLoadingApproveClose(true);
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      const token = stored?.token;

      const documentComments = Object.entries(closeRequestDocumentInputs).map(
        ([documentName, value]) => ({
          documentName,
          fileList: Array.isArray(value?.fileList) ? value.fileList : [],
        }),
      );

      const uploads = documentComments.flatMap((entry) =>
        entry.fileList.map((f) => ({
          documentName: entry.documentName,
          file: f,
        })),
      );

      for (const item of uploads) {
        await deferralApi.uploadDocument(
          deferralId,
          item.file,
          { isAdditional: true, documentName: item.documentName },
          token,
        );
      }

      const response = await deferralApi.closeDeferral(
        deferralId,
        {
          reason: closeRequestComment || "Close request submitted by RM",
          comment: closeRequestComment || "Close request submitted by RM",
          documentComments: documentComments
            .filter((entry) => !!entry.comment)
            .map((entry) => ({
              documentName: entry.documentName,
              comment: entry.comment,
            })),
        },
        token,
      );

      const updatedDeferral = response?.deferral || response;
      if (!updatedDeferral?._id) {
        throw new Error("Invalid close request response");
      }

      setLocalDeferral(updatedDeferral);
      setCloseRequestVisible(false);
      setCloseRequestComment("");
      setCloseRequestDocumentInputs({});
      message.success("Close request submitted successfully");

      window.dispatchEvent(
        new CustomEvent("deferral:updated", { detail: updatedDeferral }),
      );
      onAction && onAction({ status: "close_requested", updatedDeferral });
      onClose();
    } catch (error) {
      console.error("Close request submission error:", error);
      message.error(error.message || "Failed to submit close request");
    } finally {
      setLoadingApproveClose(false);
    }
  };

  // Handle Return for Rework
  const handleReturnForRework = () => {
    setReturnForReworkVisible(true);
  };

  const handleReworkUpdate = (updatedDeferral) => {
    setLocalDeferral(updatedDeferral);
    message.success("Deferral resubmitted for review");
    window.dispatchEvent(
      new CustomEvent("deferral:updated", { detail: updatedDeferral }),
    );
    try {
      localStorage.setItem(
        "deferral:update",
        JSON.stringify({ id: updatedDeferral?._id, ts: Date.now() }),
      );
    } catch (e) {
      /* ignore */
    }

    // Ask parent to close any open modals and reset selection
    try {
      if (typeof onAction === "function") {
        onAction({ action: "close_deferral_modal" });
      } else {
        // fallback: attempt to dispatch an event
        window.dispatchEvent(
          new CustomEvent("deferral:close_modals", { detail: updatedDeferral }),
        );
      }
    } catch (e) {
      /* ignore */
    }

    setActiveTab("pending");
    // Trigger a refresh for other listeners
    if (window.deferralRefresh) window.deferralRefresh();
  };

  // Handle Extension Application
  const handleApplyForExtension = (deferral) => {
    if (typeof onAction === "function") {
      onAction({ action: "apply_extension", deferral });
      return;
    }
    // fallback: try to use window event
    window.dispatchEvent(
      new CustomEvent("deferral:apply_extension", { detail: deferral }),
    );
  };

  if (!localDeferral) return null;

  const status = (localDeferral.status || "deferral_requested").toLowerCase();
  const isPendingApproval = status === "deferral_requested";
  const isReturnedForRework = status === "returned_for_rework";
  const isApprovedStatus =
    status === "approved" || status === "deferral_approved";
  const isCompleted = [
    "closed",
    "deferral_closed",
    "closed_by_co",
    "closed_by_creator",
    "withdrawn",
    "rejected",
    "deferral_rejected",
    "returned_for_rework",
    "returned_by_creator",
    "returned_by_checker",
  ].includes(status);

  // Calculate if deferral is fully approved (by all approvers, creator, and checker)
  const hasCreatorApproved = localDeferral.creatorApprovalStatus === "approved";
  const hasCheckerApproved = localDeferral.checkerApprovalStatus === "approved";
  const isFullyApproved =
    localDeferral.deferralApprovalStatus === "approved" ||
    (hasCreatorApproved && hasCheckerApproved);

  const stats = getApproverStats();
  const daysSoughtValue =
    typeof overrideDaysSought === "number"
      ? overrideDaysSought
      : localDeferral.daysSought || 0;
  const nextDueDateValue =
    overrideNextDueDate ||
    localDeferral.nextDueDate ||
    localDeferral.nextDocumentDueDate;

  const getDocumentSectionFromUrl = (url) => {
    const raw = String(url || "").trim();
    if (!raw) return null;

    const marker = "#docSection=";
    const markerIndex = raw.toLowerCase().lastIndexOf(marker.toLowerCase());
    if (markerIndex < 0) return null;

    const sectionPart = raw
      .substring(markerIndex + marker.length)
      .split("#")[0]
      .trim()
      .toLowerCase();
    if (sectionPart === "dcl" || sectionPart === "additional") {
      return sectionPart;
    }

    return null;
  };

  const stripDocumentSectionMarker = (url) => {
    const raw = String(url || "").trim();
    if (!raw) return url;

    const marker = "#docSection=";
    const markerIndex = raw.toLowerCase().lastIndexOf(marker.toLowerCase());
    if (markerIndex < 0) return url;

    return raw.substring(0, markerIndex);
  };

  const getDocumentTargetFromUrl = (url) => {
    const raw = String(url || "").trim();
    if (!raw) return "";

    const withoutFragment = raw.split("#")[0] || "";
    const queryIndex = withoutFragment.indexOf("?");
    if (queryIndex < 0) return "";

    const query = withoutFragment.substring(queryIndex + 1);
    const params = new URLSearchParams(query);
    return (params.get("docTarget") || "").trim();
  };

  const normalizeDocKey = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  // Helper to pull all documents into categories
  const getAllDocuments = () => {
    const all = [];
    // Track selected document names to avoid duplicates
    const selectedDocNames = new Set();

    (localDeferral.attachments || []).forEach((att, i) => {
      const sectionFromUrl = getDocumentSectionFromUrl(att.url);
      const normalizedAttachmentName = String(att.name || "").trim();
      const hasDclPrefix = /^\s*dcl(?:[\s_-]|$)/i.test(
        normalizedAttachmentName,
      );
      const includesDclNo =
        !!String(localDeferral.dclNo || localDeferral.dclNumber || "").trim() &&
        normalizedAttachmentName.toLowerCase().includes(
          String(localDeferral.dclNo || localDeferral.dclNumber || "")
            .trim()
            .toLowerCase(),
        );
      const isDCL =
        att.isDCL === true ||
        sectionFromUrl === "dcl" ||
        hasDclPrefix ||
        includesDclNo;
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
      const docName =
        typeof d === "string" ? d : d.name || d.label || "Document";
      selectedDocNames.add(normalizeDocKey(docName));
      all.push({
        id: `req_${i}`,
        name: docName,
        type: d.type || "",
        documentType:
          typeof d === "object"
            ? d.documentType || d.type || d.docType || ""
            : "",
        category:
          typeof d === "object"
            ? d.category || d.documentCategory || d.classification || ""
            : "",
        allowability:
          typeof d === "object" ? d.allowability || d.allowableType || "" : "",
        // Preserve per-document days and computed next due date when present
        // Use explicit undefined checks to preserve 0 values
        daysSought:
          typeof d === "object"
            ? typeof d.daysSought !== "undefined"
              ? d.daysSought
              : typeof d.requestedDaysSought !== "undefined"
                ? d.requestedDaysSought
                : undefined
            : undefined,
        nextDocumentDueDate:
          typeof d === "object"
            ? typeof d.nextDocumentDueDate !== "undefined"
              ? d.nextDocumentDueDate
              : typeof d.nextDueDate !== "undefined"
                ? d.nextDueDate
                : undefined
            : undefined,
        isRequested: true,
        isSelected: true,
        source: "selected",
      });
    });
    (localDeferral.documents || []).forEach((d, i) => {
      // Skip if this document was already added from selectedDocuments
      if (selectedDocNames.has(normalizeDocKey(d.name))) {
        return;
      }
      const name = (d.name || "").toString();
      const sectionFromUrl = getDocumentSectionFromUrl(d.url);
      const dclNameMatch =
        /^\s*dcl(?:[\s_-]|$)/i.test(name) ||
        (!!String(
          localDeferral.dclNo || localDeferral.dclNumber || "",
        ).trim() &&
          name.toLowerCase().includes(
            String(localDeferral.dclNo || localDeferral.dclNumber || "")
              .trim()
              .toLowerCase(),
          ));
      const isDCLFlag =
        (typeof d.isDCL !== "undefined" && d.isDCL) ||
        sectionFromUrl === "dcl" ||
        dclNameMatch;
      const isAdditionalFlag =
        typeof d.isAdditional !== "undefined"
          ? d.isAdditional
          : sectionFromUrl === "additional" || !isDCLFlag;
      const cleanUrl = stripDocumentSectionMarker(d.url);
      const hasUrl = !!String(cleanUrl || "").trim();
      const isUploadedFlag = hasUrl;
      const isRequestedFromPersistedSelection = !hasUrl && !isDCLFlag;
      // Try to read per-document days and next due date from multiple possible property names
      const docDays =
        typeof d.daysSought !== "undefined"
          ? d.daysSought
          : typeof d.requestedDaysSought !== "undefined"
            ? d.requestedDaysSought
            : typeof d.DaysSought !== "undefined"
              ? d.DaysSought
              : undefined;

      const docNextDate =
        typeof d.nextDocumentDueDate !== "undefined"
          ? d.nextDocumentDueDate
          : typeof d.nextDueDate !== "undefined"
            ? d.nextDueDate
            : typeof d.NextDocumentDueDate !== "undefined"
              ? d.NextDocumentDueDate
              : undefined;

      all.push({
        id: d._id || d.id || `doc_${i}`,
        name: d.name,
        type: d.type || getFileExtension(d.name || ""),
        documentType: d.documentType || d.type || "",
        category: d.category || d.documentCategory || d.classification || "",
        allowability: d.allowability || d.allowableType || "",
        url: cleanUrl,
        documentTarget: getDocumentTargetFromUrl(cleanUrl),
        isDocument: true,
        isUploaded: isUploadedFlag,
        isRequested: isRequestedFromPersistedSelection,
        isSelected: isRequestedFromPersistedSelection,
        // preserve per-document metadata from persisted documents when available
        daysSought: typeof docDays !== "undefined" ? docDays : undefined,
        nextDocumentDueDate:
          typeof docNextDate !== "undefined" ? docNextDate : undefined,
        source: "documents",
        isDCL: !!isDCLFlag,
        isAdditional: !!isAdditionalFlag,
        uploadDate: d.uploadDate || d.uploadedAt || null,
        size: d.size || null,
      });
    });
    return all;
  };

  const allDocs = getAllDocuments();
  const uploadedDocuments = allDocs.filter((d) => d.isUploaded);
  const dclCandidates = uploadedDocuments.filter((d) => d.isDCL);
  const pickPrimaryDcl = () => {
    if (dclCandidates.length === 0) return null;
    const dclNo = String(localDeferral.dclNo || localDeferral.dclNumber || "")
      .trim()
      .toLowerCase();
    const score = (doc) => {
      const docName = String(doc?.name || "")
        .trim()
        .toLowerCase();
      const exactDclNo = dclNo && docName.includes(dclNo) ? 2 : 0;
      const dclPrefix = /^\s*dcl(?:[\s_-]|$)/i.test(
        String(doc?.name || "").trim(),
      )
        ? 1
        : 0;
      const dateScore = new Date(doc?.uploadDate || 0).getTime() || 0;
      return { exactDclNo, dclPrefix, dateScore };
    };

    return [...dclCandidates].sort((a, b) => {
      const as = score(a);
      const bs = score(b);
      if (as.exactDclNo !== bs.exactDclNo) return bs.exactDclNo - as.exactDclNo;
      if (as.dclPrefix !== bs.dclPrefix) return bs.dclPrefix - as.dclPrefix;
      return bs.dateScore - as.dateScore;
    })[0];
  };

  const primaryDcl = pickPrimaryDcl();
  const dclDocs = primaryDcl ? [primaryDcl] : [];
  const uploadedDocs = uploadedDocuments
    .filter((d) => !primaryDcl || d.id !== primaryDcl.id)
    .map((d) => (d.isDCL ? { ...d, isDCL: false, isAdditional: true } : d));
  const explicitlyRequestedDocs = allDocs.filter(
    (d) => d.isRequested || d.isSelected,
  );
  const requestedDocs = explicitlyRequestedDocs;

  // Helper to resolve days and next due date from a document object
  const resolveDocDaysAndDate = (doc) => {
    if (!doc) return { days: undefined, nextDate: undefined };

    const tryValues = (obj, keys) => {
      for (const k of keys) {
        if (typeof obj[k] !== "undefined" && obj[k] !== null) return obj[k];
      }
      return undefined;
    };

    // Candidate keys to try for days and next date
    const dayKeys = [
      "daysSought",
      "requestedDaysSought",
      "requestedDays",
      "days",
      "requested_days",
      "requested_days_sought",
    ];
    const dateKeys = [
      "nextDocumentDueDate",
      "nextDueDate",
      "next_document_due_date",
      "next_due_date",
      "nextDocumentDue",
      "next_due",
    ];

    let days = tryValues(doc, dayKeys);
    let nextDate = tryValues(doc, dateKeys);

    // If still missing, try to match against localDeferral.selectedDocuments for persisted metadata
    if (
      (typeof days === "undefined" || typeof nextDate === "undefined") &&
      Array.isArray(localDeferral?.selectedDocuments)
    ) {
      const docName = (doc && (doc.name || doc.label)) || String(doc || "");
      const match = localDeferral.selectedDocuments.find((sd) => {
        const sdName = (sd && (sd.name || sd.label)) || String(sd || "");
        return (
          sdName &&
          sdName.toLowerCase().trim() === String(docName).toLowerCase().trim()
        );
      });
      if (match) {
        if (typeof days === "undefined") days = tryValues(match, dayKeys);
        if (typeof nextDate === "undefined")
          nextDate = tryValues(match, dateKeys);
      }
    }

    return { days, nextDate };
  };

  const facilityColumns = getFacilityColumns();

  return (
    <>
      <style>{customStyles}</style>

      {/* Return for Rework Modal */}
      <ReturnForReworkModal
        open={returnForReworkVisible}
        onClose={() => setReturnForReworkVisible(false)}
        deferral={localDeferral}
        onUpdate={handleReworkUpdate}
      />

      {/* Withdraw Confirmation Modal */}
      <Modal
        title="Withdraw Deferral Request"
        open={withdrawConfirmVisible}
        onCancel={() => setWithdrawConfirmVisible(false)}
        onOk={handleConfirmWithdraw}
        okText="Yes, Withdraw"
        cancelText="Cancel"
        okButtonProps={{
          loading: loadingWithdraw,
          style: {
            background: ERROR_RED,
            borderColor: ERROR_RED,
            color: "white",
          },
        }}
        cancelButtonProps={{
          style: {
            borderColor: "#d9d9d9",
          },
        }}
        centered={true}
        maskClosable={false}
      >
        <p>Are you sure you want to withdraw this deferral request?</p>
        <p>
          <strong>This action will:</strong>
        </p>
        <ul>
          <li>Notify all approvers via email</li>
          <li>Move the deferral to the Completed tab</li>
        </ul>
        <p>This action cannot be undone.</p>
      </Modal>

      <Modal
        title="Submit Close Request"
        open={closeRequestVisible}
        onCancel={() => setCloseRequestVisible(false)}
        onOk={handleSubmitCloseRequest}
        okText="Submit Close Request"
        cancelText="Cancel"
        confirmLoading={loadingApproveClose}
        width={820}
      >
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ color: PRIMARY_BLUE }}>
            Overall Close Request Comment
          </Text>
          <TextArea
            rows={3}
            value={closeRequestComment}
            onChange={(e) => setCloseRequestComment(e.target.value)}
            placeholder="Provide overall close request comments"
            style={{ marginTop: 8 }}
          />
        </div>

        <Divider orientation="left">Per-document Uploads & Comments</Divider>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          {requestedDocs.length === 0 ? (
            <Text type="secondary">
              No selected documents found for this deferral.
            </Text>
          ) : (
            requestedDocs.map((doc, index) => {
              const documentName = doc.name || `Document ${index + 1}`;
              const currentValue =
                closeRequestDocumentInputs[documentName] || {};
              return (
                <Card
                  key={`${documentName}_${index}`}
                  size="small"
                  title={documentName}
                >
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size={8}
                  >
                    <Upload
                      fileList={currentValue.fileList || []}
                      beforeUpload={() => false}
                      onChange={({ fileList }) =>
                        setCloseRequestDocumentFile(
                          documentName,
                          fileList.slice(-1),
                        )
                      }
                      maxCount={1}
                    >
                      <Button icon={<UploadOutlined />}>
                        Upload Close Evidence
                      </Button>
                    </Upload>

                    {/* per-document comment removed - overall comment retained above */}
                  </Space>
                </Card>
              );
            })
          )}
        </Space>
      </Modal>

      <>
        <style>{customStyles}</style>
        <div
          className="deferral-modal-overlay"
          style={{
            display: open ? "flex" : "none",
          }}
          onClick={onClose}
        >
          {open && (
            <div
              className="deferral-modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="deferral-modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <BankOutlined />
                  <span>Deferral Request: {localDeferral.deferralNumber}</span>
                  {headerTag && (
                    <Tag
                      color="geekblue"
                      style={{ marginLeft: 6, fontWeight: 700 }}
                    >
                      {headerTag}
                    </Tag>
                  )}
                </div>
                <Button
                  icon={<CloseOutlined />}
                  onClick={onClose}
                  size="small"
                  type="default"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255, 255, 255, 0.2)",
                    borderColor: "rgba(255, 255, 255, 0.4)",
                    color: "#fff",
                    width: "32px",
                    height: "32px",
                    padding: 0,
                  }}
                />
              </div>

              {/* Body */}
              <div
                className="deferral-modal-body"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Real-time Status Alert */}
                <DeferralStatusAlert
                  deferral={localDeferral}
                  hideApprovedStatus={!!overrideApprovals}
                />

                <Card
                  className="deferral-info-card"
                  size="small"
                  title={
                    <span style={{ color: PRIMARY_BLUE }}>
                      Customer Information
                    </span>
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
                  </Descriptions>
                </Card>

                <Card
                  className="deferral-info-card"
                  size="small"
                  title={
                    <span style={{ color: PRIMARY_BLUE }}>
                      Deferral Details
                    </span>
                  }
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
                    {/* Extension Status placed next to DCL No for visibility */}
                    {localDeferral.extensionStatus && (
                      <Descriptions.Item label="Extension Status">
                        <Text strong style={{ color: PRIMARY_BLUE }}>
                          {localDeferral.extensionStatus}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {/* Show overall deferral status (hide for extension-application modal views) */}
                    {!overrideApprovals &&
                      headerTag !== "EXTENSION APPLICATION" && (
                        <Descriptions.Item label="Status">
                          {(() => {
                            // If the deferral was closed/withdrawn by the RM, show Withdrawn explicitly
                            const isWithdrawnLocal = Boolean(
                              localDeferral?.closedByName ||
                              localDeferral?.ClosedByName ||
                              localDeferral?.closedAt ||
                              localDeferral?.ClosedAt,
                            );

                            if (isWithdrawnLocal) {
                              return (
                                <Text strong style={{ color: ERROR_RED }}>
                                  Withdrawn
                                </Text>
                              );
                            }

                            const raw = (
                              localDeferral.status ||
                              localDeferral.deferralApprovalStatus ||
                              "pending"
                            ).toString();
                            const key = raw.toLowerCase();
                            const display = key
                              .replace(/_/g, " ")
                              .split(" ")
                              .map(
                                (w) => w.charAt(0).toUpperCase() + w.slice(1),
                              )
                              .join(" ");
                            let color = PRIMARY_BLUE;
                            if (key.includes("approved")) color = SUCCESS_GREEN;
                            else if (key.includes("rejected"))
                              color = ERROR_RED;
                            else if (
                              key.includes("returned") ||
                              key.includes("rework")
                            )
                              color = WARNING_ORANGE;
                            return (
                              <Text strong style={{ color }}>
                                {display}
                              </Text>
                            );
                          })()}
                        </Descriptions.Item>
                      )}

                    {/* Creator Status */}
                    <Descriptions.Item label="Creator Status">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {(() => {
                          const creatorStatusRaw = overrideApprovals
                            ? overrideApprovals.creatorApprovalStatus
                            : localDeferral.creatorApprovalStatus;
                          const creatorStatus = (creatorStatusRaw || "")
                            .toString()
                            .toLowerCase();

                          const creatorHasDate = Boolean(
                            localDeferral.creatorApprovalDate ||
                            localDeferral.creatorApprovedAt ||
                            localDeferral.creatorApprovedDate ||
                            overrideApprovals?.creatorApprovalDate,
                          );
                          const creatorApprovedFlag =
                            creatorHasDate ||
                            creatorStatus === "approved" ||
                            creatorStatus === "true" ||
                            creatorStatus === true;

                          if (creatorApprovedFlag) {
                            return (
                              <Text strong style={{ color: SUCCESS_GREEN }}>
                                Approved
                              </Text>
                            );
                          }

                          const creatorRejected =
                            creatorStatus === "rejected" ||
                            creatorStatus === "false" ||
                            creatorStatus === false;
                          if (creatorRejected)
                            return (
                              <Text strong style={{ color: ERROR_RED }}>
                                Rejected
                              </Text>
                            );

                          return (
                            <Text strong style={{ color: PRIMARY_BLUE }}>
                              Pending
                            </Text>
                          );
                        })()}
                      </div>
                    </Descriptions.Item>

                    {/* Checker Status */}
                    <Descriptions.Item label="Checker Status">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {(() => {
                          const checkerStatusRaw = overrideApprovals
                            ? overrideApprovals.checkerApprovalStatus
                            : localDeferral.checkerApprovalStatus;
                          const checkerStatus = (checkerStatusRaw || "")
                            .toString()
                            .toLowerCase();

                          const checkerHasDate = Boolean(
                            localDeferral.checkerApprovalDate ||
                            localDeferral.checkerApprovedAt ||
                            localDeferral.checkerApprovedDate ||
                            overrideApprovals?.checkerApprovalDate,
                          );
                          const checkerApprovedFlag =
                            checkerHasDate ||
                            checkerStatus === "approved" ||
                            checkerStatus === "true" ||
                            checkerStatus === true;

                          if (checkerApprovedFlag) {
                            return (
                              <Text strong style={{ color: SUCCESS_GREEN }}>
                                Approved
                              </Text>
                            );
                          }

                          const checkerRejected =
                            checkerStatus === "rejected" ||
                            checkerStatus === "false" ||
                            checkerStatus === false;
                          if (checkerRejected)
                            return (
                              <Text strong style={{ color: ERROR_RED }}>
                                Rejected
                              </Text>
                            );

                          return (
                            <Text strong style={{ color: PRIMARY_BLUE }}>
                              Pending
                            </Text>
                          );
                        })()}
                      </div>
                    </Descriptions.Item>

                    {/* Enhanced Approvers Status with Counts */}
                    <Descriptions.Item label="Approvers Status">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div>
                          {(() => {
                            let total = 0;
                            let approved = 0;
                            if (
                              overrideApprovals &&
                              overrideApprovals.approvers
                            ) {
                              total = overrideApprovals.approvers.length;
                              approved = overrideApprovals.approvers.filter(
                                (a) =>
                                  a.approvalStatus === "Approved" ||
                                  a.approved === true,
                              ).length;
                            } else {
                              total = stats.total;
                              approved = stats.approved;
                            }

                            if (total === 0) {
                              return (
                                <Text strong style={{ color: PRIMARY_BLUE }}>
                                  No approvers
                                </Text>
                              );
                            }
                            if (approved === total) {
                              return (
                                <Text strong style={{ color: SUCCESS_GREEN }}>
                                  All Approved
                                </Text>
                              );
                            }
                            return (
                              <Text
                                strong
                                style={{ color: PRIMARY_BLUE }}
                              >{`${approved} of ${total} Approved`}</Text>
                            );
                          })()}
                        </div>
                      </div>
                    </Descriptions.Item>

                    {/* Loan Amount with threshold indicator */}
                    <Descriptions.Item label="Loan Amount">
                      <div
                        style={{
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        {(function () {
                          // Primary extraction
                          let {
                            amountNumber,
                            formattedAmount,
                            classification,
                          } = getLoanDisplay(localDeferral || {});

                          // Fallback: check common nested places where loan amount may be stored
                          if (!amountNumber) {
                            const maybe =
                              localDeferral?.requested?.loanAmount ||
                              localDeferral?.request?.loanAmount ||
                              localDeferral?.extension?.loanAmount ||
                              (Array.isArray(localDeferral?.extensions) &&
                                localDeferral.extensions[0]?.loanAmount) ||
                              localDeferral?.requestedLoanAmount ||
                              localDeferral?.loan_amount ||
                              localDeferral?.requested_amount;
                            const parsed =
                              maybe != null
                                ? Number(
                                    String(maybe).replace(/[^0-9.-]+/g, ""),
                                  )
                                : 0;
                            if (Number.isFinite(parsed) && parsed > 0) {
                              amountNumber = parsed;
                              formattedAmount = `KSh ${parsed.toLocaleString()}`;
                              classification =
                                parsed < 75000000
                                  ? "below 75 million"
                                  : "above 75 million";
                            }
                          }

                          if (!amountNumber)
                            return (
                              <span style={{ color: PRIMARY_BLUE }}>
                                Not specified
                              </span>
                            );

                          // Only show the classification as plain text (remove boxed tags)
                          return (
                            <>
                              {classification === "above 75 million" ? (
                                <Text strong style={{ color: ERROR_RED }}>
                                  {"Above 75 million"}
                                </Text>
                              ) : (
                                <Text strong style={{ color: PRIMARY_BLUE }}>
                                  {"Below 75 million"}
                                </Text>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </Descriptions.Item>

                    {/* Days Sought and Deferral Due Date removed as requested */}

                    {/* Created At */}
                    <Descriptions.Item label="Created At">
                      <div>
                        <Text strong style={{ color: PRIMARY_BLUE }}>
                          {dayjs(
                            localDeferral.createdAt ||
                              localDeferral.requestedDate,
                          ).format("DD MMM YYYY")}
                        </Text>
                      </div>
                    </Descriptions.Item>

                    {/* Show who withdrew/closed the deferral (if applicable) */}
                    {localDeferral.closedByName && (
                      <Descriptions.Item label="Withdrawn By">
                        <div>
                          <Text strong style={{ color: ERROR_RED }}>
                            {localDeferral.closedByName}
                          </Text>
                          {localDeferral.closedAt && (
                            <div style={{ fontSize: 12, color: "#666" }}>
                              {dayjs(localDeferral.closedAt).format(
                                "DD MMM YYYY",
                              )}
                            </div>
                          )}
                        </div>
                      </Descriptions.Item>
                    )}

                    {/* Extension-specific fields (if present) */}
                    {localDeferral.requestedDaysSought && (
                      <Descriptions.Item label="Requested Extension Days">
                        <Text strong style={{ color: PRIMARY_BLUE }}>
                          {localDeferral.requestedDaysSought}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {localDeferral.extensionCreatedAt && (
                      <Descriptions.Item label="Extension Application Date">
                        <Text strong style={{ color: PRIMARY_BLUE }}>
                          {dayjs(localDeferral.extensionCreatedAt).format(
                            "DD MMM YYYY",
                          )}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {/* extensionStatus moved next to DCL No above */}
                  </Descriptions>

                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid #f0f0f0",
                    }}
                  >
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                      Document(s) to be deferred ({requestedDocs.length})
                    </Text>

                    {requestedDocs.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {requestedDocs.map((doc, idx) => {
                          const docKey = normalizeDocKey(doc.name);
                          const uploadedVersion = uploadedDocs.find((u) => {
                            const targetKey = normalizeDocKey(u.documentTarget);
                            if (targetKey) {
                              return targetKey === docKey;
                            }
                            return (u.name || "")
                              .toLowerCase()
                              .includes((doc.name || "").toLowerCase());
                          });
                          const isUploaded = !!uploadedVersion;
                          return (
                            <div
                              key={doc.id || idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "12px 16px",
                                backgroundColor: "#ffffff",
                                borderRadius: 6,
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <FileDoneOutlined
                                  style={{
                                    color: PRIMARY_BLUE,
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
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <div>{doc.name}</div>
                                      <UniformTag
                                        color="blue"
                                        text={
                                          isUploaded ? "Uploaded" : "Requested"
                                        }
                                      />
                                    </div>
                                    {/* Show requested days as a small tag when available (including 0) */}
                                    {(typeof doc.daysSought !== "undefined" ||
                                      typeof doc.requestedDaysSought !==
                                        "undefined") && (
                                      <div style={{ marginLeft: "auto" }}>
                                        <Tag
                                          style={{
                                            background: "#ffffff",
                                            border: "1px solid #d9d9d9",
                                            color: "#000000",
                                            fontWeight: 600,
                                          }}
                                        >
                                          {String(
                                            typeof doc.daysSought !==
                                              "undefined"
                                              ? doc.daysSought
                                              : doc.requestedDaysSought,
                                          )}{" "}
                                          days
                                        </Tag>
                                      </div>
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "#666",
                                      marginTop: 4,
                                    }}
                                  >
                                    <b>Type:</b>{" "}
                                    {formatDeferralDocumentType(doc)}
                                  </div>
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
                                  {/* Show per-document days and computed next due date (show '-' when not present) */}
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "#444",
                                      marginTop: 6,
                                    }}
                                  >
                                    {(() => {
                                      const { days, nextDate } =
                                        resolveDocDaysAndDate(doc);
                                      const daysDisplay =
                                        typeof days !== "undefined" &&
                                        days !== null &&
                                        String(days).trim() !== ""
                                          ? String(days)
                                          : "-";
                                      const dateDisplay = nextDate
                                        ? dayjs(nextDate).format("DD MMM YYYY")
                                        : "-";
                                      return (
                                        <>
                                          <strong>Requested days:</strong>{" "}
                                          {daysDisplay} &nbsp; • &nbsp;{" "}
                                          <strong>New due date:</strong>{" "}
                                          {dateDisplay}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                              <Space>
                                {isUploaded &&
                                  uploadedVersion &&
                                  uploadedVersion.url && (
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
                    ) : (
                      <Text type="secondary">Not specified</Text>
                    )}
                  </div>

                  {localDeferral.deferralDescription && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: "1px solid #f0f0f0",
                      }}
                    >
                      <Text
                        strong
                        style={{ display: "block", marginBottom: 8 }}
                      >
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

                {/* Existing sections for Facilities, Documents, etc. */}
                {localDeferral.facilities &&
                  localDeferral.facilities.length > 0 && (
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

                {/* DCL Upload Section */}
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
                    <>
                      <List
                        size="small"
                        dataSource={dclDocs}
                        renderItem={(doc) => (
                          <List.Item
                            actions={[
                              doc.url ? (
                                <Button
                                  key="view"
                                  type="link"
                                  onClick={() => openFileInNewTab(doc.url)}
                                  size="small"
                                >
                                  View
                                </Button>
                              ) : null,
                              doc.url ? (
                                <Button
                                  key="download"
                                  type="link"
                                  onClick={() => {
                                    downloadFile(doc.url, doc.name);
                                    message.success(
                                      `Downloading ${doc.name}...`,
                                    );
                                  }}
                                  size="small"
                                >
                                  Download
                                </Button>
                              ) : null,
                            ].filter(Boolean)}
                          >
                            <List.Item.Meta
                              avatar={getFileIcon(doc.type)}
                              title={
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <span style={{ fontWeight: 500 }}>
                                    {doc.name}
                                  </span>
                                  <Tag color="red" style={{ fontSize: 10 }}>
                                    DCL Document
                                  </Tag>
                                </div>
                              }
                              description={
                                <div style={{ fontSize: 12, color: "#666" }}>
                                  {doc.size && (
                                    <span>
                                      {doc.size > 1024
                                        ? `${(doc.size / 1024).toFixed(2)} MB`
                                        : `${doc.size} KB`}
                                    </span>
                                  )}{" "}
                                  {doc.uploadDate && (
                                    <span style={{ marginLeft: 8 }}>
                                      Uploaded:{" "}
                                      {dayjs(doc.uploadDate).format(
                                        "DD MMM YYYY HH:mm",
                                      )}
                                    </span>
                                  )}{" "}
                                  {!doc.url && (
                                    <div
                                      style={{
                                        marginTop: 6,
                                        color: "#8c8c8c",
                                        fontSize: 12,
                                      }}
                                    >
                                      Preview not available
                                    </div>
                                  )}
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 12,
                        color: WARNING_ORANGE,
                      }}
                    >
                      <UploadOutlined
                        style={{
                          fontSize: 18,
                          marginBottom: 6,
                          color: WARNING_ORANGE,
                        }}
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

                {/* Additional Documents Section */}
                <Card
                  size="small"
                  title={
                    <span style={{ color: PRIMARY_BLUE }}>
                      <PaperClipOutlined style={{ marginRight: 8 }} />{" "}
                      Additional Documents ({uploadedDocs.length})
                    </span>
                  }
                  style={{ marginBottom: 18 }}
                >
                  {uploadedDocs.length > 0 ? (
                    <>
                      <List
                        size="small"
                        dataSource={uploadedDocs}
                        renderItem={(doc) => (
                          <List.Item
                            actions={[
                              doc.url ? (
                                <Button
                                  key="view"
                                  type="link"
                                  onClick={() => openFileInNewTab(doc.url)}
                                  size="small"
                                >
                                  View
                                </Button>
                              ) : null,
                              doc.url ? (
                                <Button
                                  key="download"
                                  type="link"
                                  onClick={() => {
                                    downloadFile(doc.url, doc.name);
                                    message.success(
                                      `Downloading ${doc.name}...`,
                                    );
                                  }}
                                  size="small"
                                >
                                  Download
                                </Button>
                              ) : null,
                            ].filter(Boolean)}
                          >
                            <List.Item.Meta
                              avatar={getFileIcon(doc.type)}
                              title={
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <span style={{ fontWeight: 500 }}>
                                    {doc.name}
                                  </span>
                                  {doc.isAdditional && (
                                    <Tag color="cyan" style={{ fontSize: 10 }}>
                                      Additional
                                    </Tag>
                                  )}
                                </div>
                              }
                              description={
                                <div style={{ fontSize: 12, color: "#666" }}>
                                  {doc.size && (
                                    <span>
                                      {doc.size > 1024
                                        ? `${(doc.size / 1024).toFixed(2)} MB`
                                        : `${doc.size} KB`}
                                    </span>
                                  )}{" "}
                                  {doc.uploadDate && (
                                    <span style={{ marginLeft: 8 }}>
                                      Uploaded:{" "}
                                      {dayjs(doc.uploadDate).format(
                                        "DD MMM YYYY HH:mm",
                                      )}
                                    </span>
                                  )}{" "}
                                  {!doc.url && (
                                    <div
                                      style={{
                                        marginTop: 6,
                                        color: "#8c8c8c",
                                        fontSize: 12,
                                      }}
                                    >
                                      Preview not available
                                    </div>
                                  )}
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 12,
                        color: "#999",
                      }}
                    >
                      <PaperClipOutlined
                        style={{
                          fontSize: 18,
                          marginBottom: 6,
                          color: "#d9d9d9",
                        }}
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

                {/* Enhanced Approval Flow Section */}
                <Card
                  size="small"
                  title={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>
                        Approval Flow
                      </span>
                      {!readOnly &&
                        !isCompleted &&
                        !isApprovedStatus &&
                        !isFullyApproved &&
                        !allApproversApproved &&
                        !overrideApprovals && (
                          <Space>
                            {isEditingApprovers ? (
                              <>
                                <Popconfirm
                                  title="Confirm Approvers"
                                  description="Apply this approver flow change?"
                                  onConfirm={confirmApproverChanges}
                                  okText="Yes"
                                  cancelText="No"
                                  okButtonProps={{
                                    loading: savingApproverChanges,
                                    style: {
                                      background: PRIMARY_BLUE,
                                      borderColor: PRIMARY_BLUE,
                                    },
                                  }}
                                >
                                  <Button
                                    size="small"
                                    type="primary"
                                    loading={savingApproverChanges}
                                    icon={<CheckCircleOutlined />}
                                    style={{
                                      background: PRIMARY_BLUE,
                                      borderColor: PRIMARY_BLUE,
                                      color: "#FFFFFF !important",
                                    }}
                                  >
                                    Confirm Approvers
                                  </Button>
                                </Popconfirm>
                                <Button
                                  size="small"
                                  onClick={cancelEditingApprovers}
                                  disabled={savingApproverChanges}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={startEditingApprovers}
                              >
                                Edit Approvers
                              </Button>
                            )}
                          </Space>
                        )}
                    </div>
                  }
                  style={{
                    marginBottom: 18,
                    opacity: localDeferral.status === "rejected" ? 0.6 : 1,
                  }}
                >
                  {localDeferral.status === "rejected" && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: 12,
                        backgroundColor: "#fff1f0",
                        border: `1px solid ${ERROR_RED}40`,
                        borderRadius: 6,
                        textAlign: "center",
                      }}
                    >
                      <ExclamationCircleOutlined
                        style={{ color: ERROR_RED, marginRight: 8 }}
                      />
                      <Text strong style={{ color: ERROR_RED }}>
                        This deferral has been rejected and cannot be further
                        processed
                      </Text>
                    </div>
                  )}
                  {/* Approver List */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      pointerEvents:
                        localDeferral.status === "rejected" ? "none" : "auto",
                    }}
                  >
                    {isEditingApprovers ? (
                      <>
                        {loadingAvailableApprovers ? (
                          <div style={{ textAlign: "center", padding: 20 }}>
                            <Spin tip="Loading approvers..." />
                          </div>
                        ) : (
                          <>
                            {editableApproverSlots.map((slot, index) => {
                              const isBoundarySlot =
                                index === 0 ||
                                index === editableApproverSlots.length - 1;
                              const isLastSlot =
                                index === editableApproverSlots.length - 1;

                              return (
                                <React.Fragment key={`editable-${index}`}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: 10,
                                      padding: 12,
                                      border: slot.locked
                                        ? `1px solid ${SUCCESS_GREEN}`
                                        : "1px solid #e8e8e8",
                                      borderRadius: 8,
                                      background: slot.locked
                                        ? "#f6ffed"
                                        : "#fafafa",
                                    }}
                                  >
                                    <Badge
                                      count={index + 1}
                                      style={{ backgroundColor: PRIMARY_BLUE }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <Text
                                        strong
                                        style={{
                                          display: "block",
                                          marginBottom: 8,
                                        }}
                                      >
                                        {slot.role || "Approver"}
                                      </Text>
                                      <Select
                                        style={{ width: "100%" }}
                                        placeholder="Select approver"
                                        value={slot.userId || undefined}
                                        onChange={(value) =>
                                          updateEditableApprover(index, value)
                                        }
                                        disabled={
                                          slot.locked || savingApproverChanges
                                        }
                                        showSearch
                                        optionFilterProp="children"
                                      >
                                        {slot.userId &&
                                          slot.userName &&
                                          !availableApprovers.find(
                                            (a) => a._id === slot.userId,
                                          ) && (
                                            <Option value={slot.userId}>
                                              {slot.userName}
                                            </Option>
                                          )}
                                        {Array.isArray(availableApprovers) &&
                                        availableApprovers.length > 0 ? (
                                          availableApprovers.map((approver) => (
                                            <Option
                                              key={approver._id}
                                              value={approver._id}
                                            >
                                              {approver.name}
                                              {approver.position
                                                ? ` — ${approver.position}`
                                                : ""}
                                            </Option>
                                          ))
                                        ) : (
                                          <Option
                                            key="no-approvers"
                                            value="__no_approvers__"
                                            disabled
                                          >
                                            No approvers available
                                          </Option>
                                        )}
                                      </Select>
                                    </div>
                                    {slot.locked ? (
                                      <Tag
                                        color="success"
                                        icon={<CheckCircleOutlined />}
                                        style={{ marginTop: 2 }}
                                      >
                                        Approved (Locked)
                                      </Tag>
                                    ) : (
                                      <Button
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() =>
                                          removeEditableApprover(index)
                                        }
                                        disabled={
                                          savingApproverChanges ||
                                          editableApproverSlots.length <= 1 ||
                                          isBoundarySlot
                                        }
                                        title={
                                          isBoundarySlot
                                            ? "First and last approver roles are fixed"
                                            : ""
                                        }
                                        style={{ marginTop: 2 }}
                                      />
                                    )}
                                  </div>

                                  {!isLastSlot && (
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <Button
                                        type="dashed"
                                        size="small"
                                        icon={<PlusOutlined />}
                                        onClick={() =>
                                          addEditableApproverAt(index + 1)
                                        }
                                        disabled={savingApproverChanges}
                                      />
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}

                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Note: First and last approver roles are fixed. Use
                              + buttons between approvers to add new slots.
                              Approver names can still be changed for all slots.
                            </Text>
                          </>
                        )}
                      </>
                    ) : (
                      (function () {
                        const approvers = [];
                        let hasApprovers = false;

                        // Use override approvers if provided (for extensions)
                        const approvalsToUse = overrideApprovals
                          ? overrideApprovals.approvers
                          : null;

                        // Debug: log the deferral data
                        console.log("Deferral approval data:", {
                          approverFlow: localDeferral.approverFlow,
                          approvers: localDeferral.approvers,
                          overrideApprovers: approvalsToUse,
                          currentApproverIndex:
                            localDeferral.currentApproverIndex,
                        });

                        if (approvalsToUse && Array.isArray(approvalsToUse)) {
                          // Use extension approvers - all should be pending
                          hasApprovers = true;
                          approvalsToUse.forEach((approver, index) => {
                            const isApproved =
                              approver.approved === true ||
                              approver.approved === "true" ||
                              approver.approvalStatus === "approved";
                            const isRejected =
                              approver.rejected === true ||
                              approver.rejected === "true" ||
                              approver.approvalStatus === "rejected";
                            const isReturned =
                              approver.returned === true ||
                              approver.returned === "true" ||
                              approver.approvalStatus === "returned_for_rework";
                            const isCurrent = false; // will be computed after building the list

                            approvers.push({
                              ...approver,
                              index,
                              isApproved,
                              isRejected,
                              isReturned,
                              isCurrent,
                              approvalDate:
                                approver.approvedAt ||
                                approver.approvedDate ||
                                approver.date,
                              rejectionDate:
                                approver.rejectedAt ||
                                approver.rejectedDate ||
                                approver.date,
                              returnDate:
                                approver.returnedAt ||
                                approver.returnedDate ||
                                approver.date,
                              comment: approver.comment || "",
                            });
                          });
                        } else if (
                          localDeferral.approverFlow &&
                          Array.isArray(localDeferral.approverFlow)
                        ) {
                          hasApprovers = true;
                          localDeferral.approverFlow.forEach(
                            (approver, index) => {
                              const isApproved =
                                approver.approved === true ||
                                approver.approved === "true";
                              const isRejected =
                                approver.rejected === true ||
                                approver.rejected === "true";
                              const isReturned =
                                approver.returned === true ||
                                approver.returned === "true";
                              const isCurrent = false; // will be computed after building the list

                              approvers.push({
                                ...approver,
                                index,
                                isApproved,
                                isRejected,
                                isReturned,
                                isCurrent,
                                approvalDate:
                                  approver.approvedAt ||
                                  approver.approvedDate ||
                                  approver.date,
                                rejectionDate:
                                  approver.rejectedAt ||
                                  approver.rejectedDate ||
                                  approver.date,
                                returnDate:
                                  approver.returnedAt ||
                                  approver.returnedDate ||
                                  approver.date,
                                comment: approver.comment || "",
                              });
                            },
                          );
                        } else if (
                          localDeferral.approvers &&
                          Array.isArray(localDeferral.approvers)
                        ) {
                          hasApprovers = true;
                          localDeferral.approvers.forEach((approver, index) => {
                            const isApproved =
                              approver.approved === true ||
                              approver.approved === "true";
                            const isRejected =
                              approver.rejected === true ||
                              approver.rejected === "true";
                            const isReturned =
                              approver.returned === true ||
                              approver.returned === "true";
                            const isCurrent = false; // will be computed after building the list

                            approvers.push({
                              ...approver,
                              index,
                              isApproved,
                              isRejected,
                              isReturned,
                              isCurrent,
                              approvalDate:
                                approver.approvedAt ||
                                approver.approvedDate ||
                                approver.date,
                              rejectionDate:
                                approver.rejectedAt ||
                                approver.rejectedDate ||
                                approver.date,
                              returnDate:
                                approver.returnedAt ||
                                approver.returnedDate ||
                                approver.date,
                              comment: approver.comment || "",
                            });
                          });
                        }

                        // Ensure only the first unapproved approver (if any) is marked as current
                        const firstUnapprovedIndex = approvers.findIndex(
                          (a) =>
                            !a.isApproved && !a.isRejected && !a.isReturned,
                        );
                        if (firstUnapprovedIndex !== -1) {
                          approvers.forEach((a, i) => {
                            a.isCurrent =
                              !a.isApproved &&
                              !a.isRejected &&
                              !a.isReturned &&
                              i === firstUnapprovedIndex;
                          });
                        } else {
                          approvers.forEach((a) => {
                            a.isCurrent = false;
                          });
                        }

                        if (!hasApprovers) {
                          return (
                            <div
                              style={{
                                textAlign: "center",
                                padding: 24,
                                color: "#999",
                              }}
                            >
                              <UserOutlined
                                style={{
                                  fontSize: 32,
                                  marginBottom: 12,
                                  color: "#d9d9d9",
                                }}
                              />
                              <div>No approvers specified</div>
                            </div>
                          );
                        }

                        return approvers.map((approver, index) => {
                          const approverName =
                            typeof approver === "object"
                              ? approver.name ||
                                approver.user?.name ||
                                approver.userId?.name ||
                                approver.email ||
                                approver.role ||
                                String(approver)
                              : typeof approver === "string" &&
                                  approver.includes("@")
                                ? approver.split("@")[0]
                                : approver;

                          return (
                            <div
                              key={index}
                              style={{
                                padding: "14px 16px",
                                backgroundColor: approver.isApproved
                                  ? "#f6ffed"
                                  : approver.isRejected
                                    ? `${ERROR_RED}10`
                                    : approver.isReturned
                                      ? `${WARNING_ORANGE}10`
                                      : approver.isCurrent
                                        ? "#e6f7ff"
                                        : "#fafafa",
                                borderRadius: 8,
                                border: approver.isApproved
                                  ? `2px solid ${SUCCESS_GREEN}`
                                  : approver.isRejected
                                    ? `2px solid ${ERROR_RED}`
                                    : approver.isReturned
                                      ? `2px solid ${WARNING_ORANGE}`
                                      : approver.isCurrent
                                        ? `2px solid ${PRIMARY_BLUE}`
                                        : "1px solid #e8e8e8",
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                              }}
                            >
                              <Badge
                                count={index + 1}
                                style={{
                                  backgroundColor: approver.isApproved
                                    ? SUCCESS_GREEN
                                    : approver.isRejected
                                      ? ERROR_RED
                                      : approver.isReturned
                                        ? WARNING_ORANGE
                                        : approver.isCurrent
                                          ? PRIMARY_BLUE
                                          : "#bfbfbf",
                                  fontSize: 13,
                                  height: 30,
                                  minWidth: 30,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 600,
                                  borderRadius: "50%",
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 6,
                                  }}
                                >
                                  <Text
                                    strong
                                    style={{ fontSize: 14, color: "#262626" }}
                                  >
                                    {approver.role || "Approver"}
                                  </Text>
                                  {approver.isApproved && (
                                    <UniformTag
                                      icon={<CheckCircleOutlined />}
                                      color="success"
                                      text="Approved"
                                    />
                                  )}
                                  {approver.isRejected && (
                                    <UniformTag
                                      icon={<CloseCircleOutlined />}
                                      color="error"
                                      text="Rejected"
                                    />
                                  )}
                                  {approver.isReturned && (
                                    <UniformTag
                                      icon={<ExclamationCircleOutlined />}
                                      color="warning"
                                      text="Returned"
                                    />
                                  )}
                                  {approver.isCurrent &&
                                    !approver.isApproved &&
                                    !approver.isRejected &&
                                    !approver.isReturned && (
                                      <UniformTag
                                        color="processing"
                                        text="Current"
                                      />
                                    )}
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <Avatar
                                    size={24}
                                    icon={<UserOutlined />}
                                    style={{
                                      backgroundColor: approver.isApproved
                                        ? SUCCESS_GREEN
                                        : approver.isCurrent
                                          ? PRIMARY_BLUE
                                          : "#8c8c8c",
                                    }}
                                  />
                                  <Text
                                    style={{ fontSize: 14, color: "#595959" }}
                                  >
                                    {approverName}
                                  </Text>
                                </div>

                                {approver.isRejected &&
                                  approver.rejectionDate && (
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: ERROR_RED,
                                        marginTop: 2,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                    >
                                      <CloseCircleOutlined
                                        style={{ fontSize: 11 }}
                                      />
                                      Rejected:{" "}
                                      {dayjs(approver.rejectionDate).format(
                                        "DD MMM YYYY HH:mm",
                                      )}
                                    </div>
                                  )}

                                {approver.isReturned && approver.returnDate && (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: WARNING_ORANGE,
                                      marginTop: 2,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <ExclamationCircleOutlined
                                      style={{ fontSize: 11 }}
                                    />
                                    Returned:{" "}
                                    {dayjs(approver.returnDate).format(
                                      "DD MMM YYYY HH:mm",
                                    )}
                                  </div>
                                )}

                                {approver.isCurrent &&
                                  !approver.isApproved &&
                                  !approver.isRejected &&
                                  !approver.isReturned &&
                                  localDeferral.status !== "rejected" && (
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
                                      Pending Approval
                                    </div>
                                  )}

                                {approver.comment && (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "#666",
                                      marginTop: 4,
                                      fontStyle: "italic",
                                    }}
                                  >
                                    "{approver.comment}"
                                  </div>
                                )}
                              </div>

                              {approver.isCurrent &&
                                !approver.isApproved &&
                                !approver.isRejected &&
                                !approver.isReturned &&
                                localDeferral.status !== "rejected" &&
                                canSendReminder() && (
                                  <Popconfirm
                                    title="Send Reminder"
                                    description={`Send reminder email to ${approverName}?`}
                                    onConfirm={sendReminderToCurrentApprover}
                                    okText="Yes"
                                    cancelText="No"
                                    okButtonProps={{
                                      style: {
                                        background: PRIMARY_BLUE,
                                        borderColor: PRIMARY_BLUE,
                                      },
                                    }}
                                  >
                                    <Button
                                      type="link"
                                      size="small"
                                      icon={<MailOutlined />}
                                      loading={sendingReminder}
                                    >
                                      Remind
                                    </Button>
                                  </Popconfirm>
                                )}
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </Card>

                <div style={{ marginTop: 24 }}>
                  <h4 style={{ color: PRIMARY_BLUE, marginBottom: 16 }}>
                    Comment Trail & History
                  </h4>
                  {(function renderHistory() {
                    const events = [];
                    const normalizeText = (value) =>
                      String(value || "")
                        .trim()
                        .toLowerCase();
                    const requester =
                      localDeferral.requestor?.name ||
                      localDeferral.requestedBy?.name ||
                      localDeferral.requestedBy?.fullName ||
                      localDeferral.rmName ||
                      localDeferral.rmRequestedBy?.name ||
                      localDeferral.createdBy?.name ||
                      localDeferral.createdByName ||
                      "RM";
                    const requesterRole =
                      localDeferral.requestor?.role ||
                      localDeferral.requestedBy?.role ||
                      "RM";
                    const requestDate =
                      localDeferral.requestedDate ||
                      localDeferral.createdAt ||
                      localDeferral.requestedAt;
                    const requestComment =
                      localDeferral.rmReason || "Deferral request submitted";

                    const normalizedRequestComment =
                      normalizeText(requestComment);
                    const requestCommentExistsInComments =
                      Array.isArray(localDeferral.comments) &&
                      localDeferral.comments.some(
                        (c) =>
                          normalizeText(c?.text || c?.comment) ===
                          normalizedRequestComment,
                      );

                    const requestCommentExistsInHistory =
                      Array.isArray(localDeferral.history) &&
                      localDeferral.history.some(
                        (h) =>
                          normalizeText(
                            h?.comment || h?.notes || h?.message,
                          ) === normalizedRequestComment,
                      );

                    if (
                      !requestCommentExistsInComments &&
                      !requestCommentExistsInHistory
                    ) {
                      events.push({
                        user: requester,
                        userRole: requesterRole,
                        date: requestDate,
                        comment: requestComment,
                      });
                    }

                    // If an extension reason exists, treat it as an RM comment in the history
                    if (
                      localDeferral.extensionReason &&
                      String(localDeferral.extensionReason).trim()
                    ) {
                      const extNormalized = normalizeText(
                        localDeferral.extensionReason,
                      );
                      const extExistsInComments =
                        Array.isArray(localDeferral.comments) &&
                        localDeferral.comments.some(
                          (c) =>
                            normalizeText(c?.text || c?.comment) ===
                            extNormalized,
                        );
                      const extExistsInHistory =
                        Array.isArray(localDeferral.history) &&
                        localDeferral.history.some(
                          (h) =>
                            normalizeText(
                              h?.comment || h?.notes || h?.message,
                            ) === extNormalized,
                        );

                      if (!extExistsInComments && !extExistsInHistory) {
                        events.push({
                          user: requester,
                          userRole: requesterRole,
                          date:
                            localDeferral.extensionCreatedAt ||
                            localDeferral.extensionCreatedAt ||
                            requestDate,
                          comment: localDeferral.extensionReason,
                        });
                      }
                    }

                    if (
                      localDeferral.comments &&
                      Array.isArray(localDeferral.comments) &&
                      localDeferral.comments.length > 0
                    ) {
                      localDeferral.comments.forEach((c) => {
                        const inferredRoleFromReturn =
                          String(
                            localDeferral.lastReturnedByRole || "",
                          ).toLowerCase() === "creator"
                            ? "CoCreator"
                            : String(
                                  localDeferral.lastReturnedByRole || "",
                                ).toLowerCase() === "checker"
                              ? "CoChecker"
                              : "";

                        const commentAuthorRole =
                          c.author?.role ||
                          c.authorRole ||
                          c.role ||
                          inferredRoleFromReturn ||
                          requesterRole ||
                          "System";

                        const commentAuthorName =
                          c.author?.name ||
                          c.authorName ||
                          c.userName ||
                          c.author?.email ||
                          c.user?.name ||
                          (inferredRoleFromReturn
                            ? inferredRoleFromReturn
                            : requester) ||
                          "System";

                        events.push({
                          user: commentAuthorName,
                          userRole: commentAuthorRole,
                          date: c.createdAt,
                          comment: c.text || "",
                        });
                      });
                    }

                    if (
                      localDeferral.history &&
                      Array.isArray(localDeferral.history) &&
                      localDeferral.history.length > 0
                    ) {
                      localDeferral.history.forEach((h) => {
                        if (h.action === "moved") return;
                        const userName =
                          h.user?.name || h.userName || h.user || "System";
                        const userRole =
                          h.user?.role || h.userRole || h.role || "System";
                        events.push({
                          user: userName,
                          userRole: userRole,
                          date:
                            h.date || h.createdAt || h.timestamp || h.entryDate,
                          comment: h.comment || h.notes || h.message || "",
                        });
                      });
                    }

                    const sorted = events.sort(
                      (a, b) => new Date(a.date || 0) - new Date(b.date || 0),
                    );
                    const seenEventKeys = new Set();
                    const deduped = sorted.filter((entry) => {
                      const key = [
                        normalizeText(entry.user),
                        normalizeText(entry.userRole),
                        String(entry.date || ""),
                        normalizeText(entry.comment),
                      ].join("|");

                      if (seenEventKeys.has(key)) {
                        return false;
                      }

                      seenEventKeys.add(key);
                      return true;
                    });

                    const formatUsername = (username) => {
                      if (!username) return "System";
                      return username.replace(/\s*\([^)]*\)\s*$/, "").trim();
                    };

                    const getRoleTag = (role) => {
                      let color = "blue";
                      const roleLower = (role || "").toLowerCase();
                      switch (roleLower) {
                        case "rm":
                          color = "blue";
                          break;
                        case "deferral management":
                          color = "green";
                          break;
                        case "creator":
                        case "cocreator":
                        case "co creator":
                        case "co_creator":
                          color = "green";
                          break;
                        case "checker":
                        case "cochecker":
                        case "co checker":
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
                        <UniformTag
                          color={color}
                          text={roleLower.replace(/_/g, " ")}
                          uppercase
                          maxChars={14}
                          style={{ marginLeft: 8 }}
                        />
                      );
                    };

                    return (
                      <div className="max-h-52 overflow-y-auto">
                        <List
                          className="deferral-comments-list"
                          dataSource={deduped}
                          itemLayout="horizontal"
                          renderItem={(item, idx) => {
                            const normalizeRole = (value) =>
                              String(value || "")
                                .trim()
                                .toLowerCase();
                            const isPlaceholderApprover = (value) => {
                              const v = normalizeRole(value);
                              return v === "approver" || v === "approval";
                            };

                            const returnedByRole = String(
                              localDeferral.lastReturnedByRole || "",
                            )
                              .trim()
                              .toLowerCase();
                            const inferredRoleFromReturn =
                              returnedByRole === "creator"
                                ? "CoCreator"
                                : returnedByRole === "checker"
                                  ? "CoChecker"
                                  : "";

                            const matchedComment = Array.isArray(
                              localDeferral.comments,
                            )
                              ? localDeferral.comments.find(
                                  (c) =>
                                    normalizeText(c?.text || c?.comment) ===
                                      normalizeText(item.comment) &&
                                    String(
                                      c?.author?.name || c?.authorName || "",
                                    ).trim(),
                                )
                              : null;

                            const rawRole = item.userRole;
                            const rawName = item.user;

                            const normalizedRoleLabel =
                              isPlaceholderApprover(rawRole) &&
                              inferredRoleFromReturn
                                ? inferredRoleFromReturn
                                : rawRole;

                            const normalizedName =
                              String(rawName || "")
                                .trim()
                                .toLowerCase() === "approver" && matchedComment
                                ? matchedComment.author?.name ||
                                  matchedComment.authorName ||
                                  rawName
                                : String(rawName || "")
                                      .trim()
                                      .toLowerCase() === "approver" &&
                                    inferredRoleFromReturn
                                  ? inferredRoleFromReturn
                                  : rawName;

                            const roleLabel = normalizedRoleLabel || "System";
                            const name =
                              formatUsername(normalizedName) || "System";
                            const text = item.comment || "No comment provided";
                            const timestamp = item.date;
                            return (
                              <List.Item key={idx} style={{ paddingBottom: 8 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    width: "100%",
                                    gap: 8,
                                    flexWrap: "wrap",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  <Avatar
                                    icon={<UserOutlined />}
                                    style={{
                                      backgroundColor: PRIMARY_BLUE,
                                      flexShrink: 0,
                                      width: 28,
                                      height: 28,
                                      fontSize: 12,
                                    }}
                                  />
                                  <b
                                    className="comment-author"
                                    style={{
                                      fontSize: 12,
                                      color: PRIMARY_BLUE,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      maxWidth: 100,
                                    }}
                                  >
                                    {name}
                                  </b>
                                  {roleLabel && (
                                    <span style={{ flexShrink: 0 }}>
                                      {getRoleTag(roleLabel)}
                                    </span>
                                  )}
                                  <span
                                    className="comment-text"
                                    style={{
                                      color: "#4a4a4a",
                                      fontSize: 12,
                                      flex: 1,
                                      minWidth: 150,
                                    }}
                                  >
                                    {text}
                                  </span>
                                  <span
                                    className="comment-timestamp"
                                    style={{
                                      fontSize: 11,
                                      color: "#999",
                                      whiteSpace: "nowrap",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {timestamp
                                      ? dayjs(timestamp).format(
                                          "M/D/YY, h:mm A",
                                        )
                                      : ""}
                                  </span>
                                </div>
                              </List.Item>
                            );
                          }}
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="deferral-modal-footer">
                {readOnly ? (
                  <>
                    <Button
                      type="primary"
                      onClick={downloadDeferralAsPDF}
                      loading={actionLoading}
                      icon={<FilePdfOutlined />}
                      style={{
                        marginRight: "auto",
                        backgroundColor: "#164679 !important",
                        borderColor: "#164679 !important",
                        color: "#fff !important",
                      }}
                    >
                      Download as PDF
                    </Button>
                    <Button
                      onClick={onClose}
                      style={{ color: "#000 !important" }}
                    >
                      Close
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="primary"
                      onClick={downloadDeferralAsPDF}
                      loading={actionLoading}
                      icon={<FilePdfOutlined />}
                      style={{
                        marginRight: "auto",
                        backgroundColor: "#164679 !important",
                        borderColor: "#164679 !important",
                        color: "#fff !important",
                      }}
                    >
                      Download as PDF
                    </Button>

                    {isReturnedForRework && (
                      <Button
                        type="primary"
                        onClick={handleReturnForRework}
                        style={{
                          backgroundColor: `${WARNING_ORANGE} !important`,
                          borderColor: `${WARNING_ORANGE} !important`,
                          color: "#FFFFFF !important",
                        }}
                        icon={<ReloadOutlined />}
                      >
                        Resubmit for Review
                      </Button>
                    )}

                    {!isApprovedStatus && !isFullyApproved && !isCompleted && (
                      <Button
                        type="default"
                        onClick={handleWithdrawRequest}
                        loading={loadingWithdraw}
                        style={{
                          backgroundColor: `${ERROR_RED} !important`,
                          borderColor: `${ERROR_RED} !important`,
                          color: "white !important",
                        }}
                      >
                        Withdraw Request
                      </Button>
                    )}

                    {(status === "deferral_approved" ||
                      status === "approved") &&
                      !localDeferral?.extensionStatus && (
                        <Button
                          type="primary"
                          onClick={() => handleApplyForExtension(localDeferral)}
                          style={{
                            backgroundColor: `${PRIMARY_BLUE} !important`,
                            borderColor: `${PRIMARY_BLUE} !important`,
                            color: "white !important",
                          }}
                        >
                          Apply Extension
                        </Button>
                      )}

                    {(status === "deferral_approved" ||
                      status === "approved") && (
                      <Button
                        type="primary"
                        onClick={handleOpenCloseRequest}
                        style={{
                          backgroundColor: `${PRIMARY_BLUE} !important`,
                          borderColor: `${PRIMARY_BLUE} !important`,
                          color: "white !important",
                        }}
                      >
                        Close Deferral
                      </Button>
                    )}

                    <Button
                      onClick={onClose}
                      style={{ color: "#000 !important" }}
                    >
                      Close
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </>
    </>
  );
};

// Main DeferralPending Component for RM
const DeferralPending = ({ userId = "rm_current" }) => {
  const navigate = useNavigate();
  const [selectedDeferral, setSelectedDeferral] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deferrals, setDeferrals] = useState([]);
  const [detailOverrides, setDetailOverrides] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const a = q.get("active");
      if (
        a === "rejected" ||
        a === "approved" ||
        a === "pending" ||
        a === "closed" ||
        a === "closeRequests" ||
        a === "extensions"
      )
        return a;
    } catch (e) {}
    return "pending";
  });

  // Extension-related state removed — starting fresh later
  // Extension submit handler removed

  // Extension detail handlers removed

  // Extension modal state
  const [selectedDeferralForExtension, setSelectedDeferralForExtension] =
    useState(null);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [extensionDays, setExtensionDays] = useState("");
  const [extensionDaysByDoc, setExtensionDaysByDoc] = useState({});
  const [extensionComment, setExtensionComment] = useState("");
  const [extensionFiles, setExtensionFiles] = useState([]);
  const [extensionSubmitting, setExtensionSubmitting] = useState(false);
  const [extensionSubmissionSuccess, setExtensionSubmissionSuccess] =
    useState(false);

  const loadDeferrals = useCallback(async () => {
    setLoading(true);
    try {
      // Use the centralized API service for consistency
      const myData = await deferralApi.getMyDeferrals();

      let approvedAssigned = [];
      try {
        const approvedData = await deferralApi.getApprovedDeferrals();
        const stored = JSON.parse(localStorage.getItem("user") || "null");
        const rmId = stored?.user?._id || userId;

        if (Array.isArray(approvedData)) {
          approvedAssigned = approvedData.filter(
            (d) =>
              d.assignedRM &&
              (String(d.assignedRM._id) === String(rmId) ||
                String(d.assignedRM) === String(rmId)),
          );
        }
      } catch (e) {
        console.warn("Failed to load approved deferrals for RM", e);
      }

      const combined = Array.isArray(myData) ? [...myData] : [];
      const existingIds = new Set(combined.map((d) => d._id));
      for (const a of approvedAssigned) {
        if (!existingIds.has(a._id)) combined.push(a);
      }

      setDeferrals(combined);
    } catch (err) {
      console.error("Error loading deferrals:", err);
      setDeferrals([]);
      if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("401")
      ) {
        // Maybe token expired
        console.log("Session might have expired or token is invalid");
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleModalAction = useCallback(
    (payload) => {
      // Support custom actions (e.g. apply_extension) and legacy updatedDeferral shape
      if (!payload) {
        loadDeferrals();
        return;
      }

      if (payload.action === "apply_extension" && payload.deferral) {
        // Initialize extension modal using the selected deferral
        const def = payload.deferral;
        setSelectedDeferralForExtension(def);
        // initialize per-document extension days map from requestedDocs
        try {
          const { requestedDocs = [] } = getDeferralDocumentBuckets(def) || {};
          const init = {};
          requestedDocs.forEach((doc) => {
            const key = String((doc && (doc.name || doc.label)) || doc || "")
              .trim()
              .toLowerCase();
            const defaultDays =
              typeof doc?.daysSought !== "undefined"
                ? doc.daysSought
                : typeof doc?.requestedDaysSought !== "undefined"
                  ? doc.requestedDaysSought
                  : 0;
            init[key] = defaultDays || 0;
          });
          setExtensionDaysByDoc(init);
        } catch (e) {
          setExtensionDaysByDoc({});
        }
        setExtensionModalOpen(true);
        setExtensionSubmissionSuccess(false);
        return;
      }
      if (payload.action === "close_deferral_modal") {
        // Close the details modal and any extension UI
        try {
          setModalOpen(false);
        } catch (e) {}
        try {
          setSelectedDeferral(null);
        } catch (e) {}
        try {
          setDetailOverrides(null);
        } catch (e) {}
        try {
          setSelectedDeferralForExtension(null);
          setExtensionModalOpen(false);
          setExtensionDaysByDoc({});
        } catch (e) {}
        return;
      }

      const updatedDeferral = payload.updatedDeferral;
      if (!updatedDeferral) {
        loadDeferrals();
        return;
      }

      const updatedId = updatedDeferral._id || updatedDeferral.id;

      setDeferrals((prev) => {
        const index = prev.findIndex((d) => (d._id || d.id) === updatedId);
        if (index === -1) {
          return prev;
        }
        const next = [...prev];
        next[index] = { ...next[index], ...updatedDeferral };
        return next;
      });

      setSelectedDeferral((prev) => {
        if (!prev) return prev;
        const prevId = prev._id || prev.id;
        return prevId === updatedId ? { ...prev, ...updatedDeferral } : prev;
      });

      loadDeferrals();
    },
    [loadDeferrals],
  );

  // Load data
  useEffect(() => {
    loadDeferrals();
    window.deferralRefresh = loadDeferrals;
    return () => {
      if (window.deferralRefresh === loadDeferrals) {
        delete window.deferralRefresh;
      }
    };
  }, [loadDeferrals]);

  // Cross-tab refresh when deferrals update
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "deferral:update") {
        loadDeferrals();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadDeferrals]);

  // Listen for deferral updates
  useEffect(() => {
    const handleDeferralUpdate = (event) => {
      const updatedDeferral = event.detail;
      if (updatedDeferral) {
        setDeferrals((prev) => {
          const index = prev.findIndex((d) => d._id === updatedDeferral._id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = updatedDeferral;
            return updated;
          }
          return prev;
        });
      }
    };

    window.addEventListener("deferral:updated", handleDeferralUpdate);
    return () =>
      window.removeEventListener("deferral:updated", handleDeferralUpdate);
  }, []);

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = [...deferrals];
    if (searchText) {
      const q = searchText.toLowerCase();
      const toText = (value) => String(value || "").toLowerCase();
      const getDocumentSearchText = (deferral) => {
        const selected = Array.isArray(deferral.selectedDocuments)
          ? deferral.selectedDocuments
              .map((doc) =>
                typeof doc === "string"
                  ? doc
                  : doc?.name || doc?.label || doc?.documentName || "",
              )
              .filter(Boolean)
          : [];

        const uploaded = Array.isArray(deferral.documents)
          ? deferral.documents
              .map((doc) => doc?.name || doc?.documentName || "")
              .filter(Boolean)
          : [];

        const attachments = Array.isArray(deferral.attachments)
          ? deferral.attachments.map((file) => file?.name || "").filter(Boolean)
          : [];

        const additionalFiles = Array.isArray(deferral.additionalFiles)
          ? deferral.additionalFiles
              .map((file) => file?.name || "")
              .filter(Boolean)
          : [];

        return [...selected, ...uploaded, ...attachments, ...additionalFiles]
          .join(" ")
          .toLowerCase();
      };

      filtered = filtered.filter((d) => {
        const searchable = [
          d.deferralNumber,
          d.deferralNo,
          d.dclNumber,
          d.dclNo,
          d.customerNumber,
          d.customerNo,
          d.customerName,
          d.businessName,
          d.loanType,
          d.status,
          d.requestedByName,
          d.createdByName,
        ]
          .map(toText)
          .join(" ");

        return searchable.includes(q) || getDocumentSearchText(d).includes(q);
      });
    }
    return filtered;
  }, [deferrals, searchText]);

  // Tab data
  const pendingData = useMemo(
    () =>
      filteredData.filter((d) => {
        const s = (d.status || "").toLowerCase();
        // Exclude: rejected, returned_for_rework, withdrawn, closed, approved, and close-request workflow statuses
        if (
          s === "rejected" ||
          s === "deferral_rejected" ||
          s === "returned_for_rework" ||
          s === "returned_by_creator" ||
          s === "returned_by_checker" ||
          s === "withdrawn" ||
          s === "closed" ||
          s === "deferral_closed" ||
          s === "closed_by_co" ||
          s === "closed_by_creator" ||
          s === "deferral_approved" ||
          s === "approved" ||
          s === "close_requested" ||
          s === "closerequested" ||
          s === "close_requested_creator_approved" ||
          s === "closerequestedcreatorapproved"
        )
          return false;
        return true;
      }),
    [filteredData],
  );

  const approvedData = useMemo(
    () =>
      filteredData.filter((d) => {
        const s = (d.status || "").toLowerCase();
        return [
          "deferral_approved",
          "approved",
          "close_requested",
          "closerequested",
          "close_requested_creator_approved",
          "closerequestedcreatorapproved",
        ].includes(s);
      }),
    [filteredData],
  );

  const rejectedData = useMemo(
    () =>
      filteredData.filter((d) => {
        const s = (d.status || "").toLowerCase();
        return [
          "returned_for_rework",
          "returned_by_creator",
          "returned_by_checker",
        ].includes(s);
      }),
    [filteredData],
  );

  const closedData = useMemo(
    () =>
      filteredData.filter((d) => {
        const s = (d.status || "").toLowerCase();
        return [
          "closed",
          "deferral_closed",
          "closed_by_co",
          "closed_by_creator",
          "withdrawn",
          "rejected",
          "deferral_rejected",
        ].includes(s);
      }),
    [filteredData],
  );

  const closeRequestsData = useMemo(
    () =>
      filteredData.filter((d) => {
        const s = (d.status || "").toLowerCase();
        return [
          "close_requested",
          "closerequested",
          "close_requested_creator_approved",
          "closerequestedcreatorapproved",
        ].includes(s);
      }),
    [filteredData],
  );

  const extensionsData = useMemo(() => {
    return filteredData.filter((d) => {
      const hasStatus = Boolean(d.extensionStatus);
      const hasExtensionsArray =
        Array.isArray(d.extensions) && d.extensions.length > 0;
      const hasRequestedDays =
        typeof d.requestedDaysSought !== "undefined" ||
        typeof d.requestedDays !== "undefined";
      return hasStatus || hasExtensionsArray || hasRequestedDays;
    });
  }, [filteredData]);

  const currentData =
    activeTab === "pending"
      ? pendingData
      : activeTab === "approved"
        ? approvedData
        : activeTab === "rejected"
          ? rejectedData
          : activeTab === "closeRequests"
            ? closeRequestsData
            : activeTab === "extensions"
              ? extensionsData
              : closedData;

  // Columns
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
    },
    {
      title: "DCL No",
      dataIndex: "dclNo",
      key: "dclNo",
      width: 120,
      render: (text, record) => {
        const value = record.dclNo || record.dclNumber;
        return value ? (
          <div
            style={{ color: SECONDARY_PURPLE, fontWeight: 500, fontSize: 13 }}
          >
            {value}
          </div>
        ) : (
          <Tag color="warning" style={{ fontWeight: 700 }}>
            Missing DCL
          </Tag>
        );
      },
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      key: "customerName",
      width: 160,
      render: (text) => (
        <div style={{ fontWeight: 600, color: PRIMARY_BLUE }}>{text}</div>
      ),
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      key: "loanType",
      width: 140,
      render: (text) => (
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: PRIMARY_BLUE,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {text || "Not Specified"}
        </div>
      ),
      filters: [
        { text: "Buy & Build", value: "Buy & Build" },
        { text: "Mortgage DCL", value: "Mortgage DCL" },
        { text: "Construction Loan", value: "Construction Loan" },
        { text: "Secured Loan DCL", value: "Secured Loan DCL" },
        { text: "Stock Loan DCL", value: "Stock Loan DCL" },
        { text: "Equity Release Loan", value: "Equity Release Loan" },
        { text: "Shamba Loan", value: "Shamba Loan" },
      ],
      onFilter: (value, record) => record.loanType === value,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status, record) => {
        // If the deferral was explicitly closed/withdrawn by an RM, show Withdrawn
        const withdrawnBy =
          record?.closedByName ||
          record?.ClosedByName ||
          record?.closedBy ||
          record?.closedByUser ||
          null;
        if (withdrawnBy)
          return (
            <div style={{ fontSize: 11, fontWeight: "bold", color: ERROR_RED }}>
              Withdrawn
            </div>
          );

        const s = (status || "").toLowerCase();
        if (s === "deferral_requested" || s === "pending_approval")
          return (
            <div
              style={{
                fontSize: 11,
                fontWeight: "bold",
                color: WARNING_ORANGE,
              }}
            >
              Pending
            </div>
          );
        if (s === "partially_approved")
          return (
            <div
              style={{ fontSize: 11, fontWeight: "bold", color: PRIMARY_BLUE }}
            >
              Partially Approved
            </div>
          );
        if (s === "deferral_approved" || s === "approved")
          return (
            <div
              style={{ fontSize: 11, fontWeight: "bold", color: SUCCESS_GREEN }}
            >
              Approved
            </div>
          );
        if (s === "deferral_rejected" || s === "rejected")
          return (
            <div style={{ fontSize: 11, fontWeight: "bold", color: ERROR_RED }}>
              Rejected
            </div>
          );
        // Treat 'closed' as Withdrawn when closedBy metadata is present
        if (
          s === "closed" &&
          (record?.closedByName || record?.ClosedByName || record?.closedBy)
        )
          return (
            <div style={{ fontSize: 11, fontWeight: "bold", color: ERROR_RED }}>
              Withdrawn
            </div>
          );
        return (
          <div style={{ fontSize: 11, fontWeight: "bold", color: "#666" }}>
            {status}
          </div>
        );
      },
      filters: [
        { text: "Pending", value: "deferral_requested" },
        { text: "Approved", value: "deferral_approved" },
        { text: "Rejected", value: "deferral_rejected" },
      ],
      onFilter: (value, record) => record.status === value,
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

        let text = `${daysLeft}d`;

        if (daysLeft <= 0 && hoursLeft <= 0) {
          text = "Expired";
        } else if (daysLeft <= 0) {
          text = `${hoursLeft}h`;
        } else if (daysLeft <= 1) {
          text = `${daysLeft}d`;
        } else if (daysLeft <= 3) {
          text = `${daysLeft}d`;
        }

        return (
          <Tag
            color="#ffffff"
            style={{
              fontWeight: "bold",
              fontSize: 11,
              minWidth: 50,
              textAlign: "center",
              color: "#333",
              border: "1px solid #d9d9d9",
            }}
          >
            {text}
          </Tag>
        );
      },
    },
  ];

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
      font-size: 13px;
      padding: 14px 12px !important;
      border-bottom: 3px solid ${ACCENT_LIME} !important;
      border-right: none !important;
      cursor: default !important;
    }
    .deferral-pending-table .ant-table-thead > tr > th:hover {
      background-color: #f7f7f7 !important;
    }
    .deferral-pending-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid #f0f0f0 !important;
      border-right: none !important;
      padding: 12px 12px !important;
      font-size: 13px;
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
      borderColor: ${ACCENT_LIME} !important;
    }
    .deferral-pending-table .ant-pagination .ant-pagination-item-active a {
      color: ${PRIMARY_BLUE} !important;
      font-weight: 600;
    }
   
    /* Remove sorting icons completely */
    .deferral-pending-table .ant-table-column-sorter {
      display: none !important;
    }
    .deferral-pending-table .ant-table-column-sorters {
      cursor: default !important;
    }
    .deferral-pending-table .ant-table-column-sorters:hover {
      background: none !important;
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
              My Deferral Requests
              <Badge
                count={filteredData.length}
                style={{
                  backgroundColor: ACCENT_LIME,
                  fontSize: 12,
                }}
              />
            </h2>
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
              Track and manage your deferral requests
            </p>
          </Col>
          <Col>
            <Button
              type="primary"
              onClick={() => {
                navigate("/rm/deferrals/request");
              }}
              style={{
                backgroundColor: PRIMARY_BLUE,
                borderColor: PRIMARY_BLUE,
                color: "#fff !important",
              }}
            >
              + New Deferral Request
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
              placeholder="Search by Deferral No, DCL No, Customer, Loan Type, or Document"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="middle"
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Button
              onClick={() => setSearchText("")}
              style={{ width: "100%" }}
              size="middle"
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Tabs */}
      <div style={{ marginBottom: 12 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          type="card"
        >
          <Tabs.TabPane
            tab={`Pending Deferrals (${pendingData.length})`}
            key="pending"
          />
          <Tabs.TabPane
            tab={`Approved Deferrals (${approvedData.length})`}
            key="approved"
          />
          <Tabs.TabPane
            tab={`Extension Applications (${extensionsData.length})`}
            key="extensions"
          />
          <Tabs.TabPane
            tab={`Re-work Deferrals (${rejectedData.length})`}
            key="rejected"
          />
          <Tabs.TabPane
            tab={`Close Requests (${closeRequestsData.length})`}
            key="closeRequests"
          />
          <Tabs.TabPane
            tab={`Completed Deferrals (${closedData.length})`}
            key="closed"
          />
        </Tabs>
      </div>

      <Divider style={{ margin: "12px 0" }}>
        <span style={{ color: PRIMARY_BLUE, fontSize: 16, fontWeight: 600 }}>
          {activeTab === "pending"
            ? `Pending Deferrals`
            : activeTab === "approved"
              ? `Approved Deferrals`
              : activeTab === "extensions"
                ? `Extension Applications`
                : activeTab === "rejected"
                  ? `Re-work Deferrals`
                  : activeTab === "closeRequests"
                    ? `Close Requests`
                    : activeTab === "closed"
                      ? `Completed Deferrals`
                      : ``}{" "}
          ({currentData.length} items)
        </span>
      </Divider>

      {/* Extensions Tab Content */}
      {/* Extensions feature removed; will reintroduce a fresh implementation later */}

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
      ) : currentData.length === 0 ? (
        <Empty
          description={
            <div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>
                {activeTab === "pending"
                  ? "No pending deferrals found"
                  : activeTab === "approved"
                    ? "No approved deferrals found"
                    : activeTab === "rejected"
                      ? "No re-work deferrals found"
                      : "No completed deferrals found"}
              </p>
              <p style={{ color: "#999" }}>
                {searchText
                  ? "Try changing your search term"
                  : activeTab === "pending"
                    ? "No pending deferrals currently"
                    : activeTab === "approved"
                      ? "No deferrals have been approved yet"
                      : activeTab === "rejected"
                        ? "No deferrals have been rejected"
                        : activeTab === "closeRequests"
                          ? "No close requests currently"
                          : "No deferrals have been closed by CO"}
              </p>
              {activeTab === "pending" && (
                <Button
                  type="primary"
                  onClick={() =>
                    (window.location.href = "/rm/deferrals/request")
                  }
                  style={{
                    marginTop: 16,
                    backgroundColor: PRIMARY_BLUE,
                    borderColor: PRIMARY_BLUE,
                    color: "#FFFFFF !important",
                  }}
                >
                  Request New Deferral
                </Button>
              )}
            </div>
          }
          style={{ padding: 40 }}
        />
      ) : (
        <div className="deferral-pending-table">
          <Table
            columns={columns}
            dataSource={currentData}
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
            scroll={{ x: 1000 }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedDeferral(record);
                setDetailOverrides(null);
                setModalOpen(true);
              },
            })}
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

      {/* Enhanced Deferral Details Modal */}
      {selectedDeferral && (
        <DeferralDetailsModal
          deferral={selectedDeferral}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedDeferral(null);
            setDetailOverrides(null);
          }}
          onAction={handleModalAction}
          headerTag={detailOverrides?.headerTag}
          overrideDaysSought={detailOverrides?.overrideDaysSought}
          overrideNextDueDate={detailOverrides?.overrideNextDueDate}
          readOnly={detailOverrides?.readOnly}
          overrideApprovals={detailOverrides?.overrideApprovals}
        />
      )}

      {/* Extension Application Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarOutlined style={{ color: PRIMARY_BLUE }} />
            <span>Apply Extension</span>
          </div>
        }
        open={extensionModalOpen}
        zIndex={2000}
        onCancel={() => {
          setExtensionModalOpen(false);
          setSelectedDeferralForExtension(null);
          setExtensionDays("");
          setExtensionComment("");
          setExtensionFiles([]);
          setExtensionDaysByDoc({});
          setExtensionSubmissionSuccess(false);
        }}
        width={900}
        styles={{
          body: { maxHeight: "70vh", overflowY: "auto", paddingRight: 8 },
        }}
        footer={
          extensionSubmissionSuccess
            ? [
                <Button
                  key="view"
                  type="primary"
                  onClick={() => {
                    setExtensionModalOpen(false);
                    setSelectedDeferralForExtension(null);
                    setExtensionDays("");
                    setExtensionComment("");
                    setExtensionFiles([]);
                    setExtensionDaysByDoc({});
                    setExtensionSubmissionSuccess(false);
                    // Switch to extensions tab to show submitted extension
                    setActiveTab("extensions");
                  }}
                  style={{
                    backgroundColor: PRIMARY_BLUE,
                    borderColor: PRIMARY_BLUE,
                    color: "#FFFFFF !important",
                  }}
                >
                  View Extension Applications
                </Button>,
              ]
            : [
                <Button
                  key="cancel"
                  onClick={() => {
                    setExtensionModalOpen(false);
                    setSelectedDeferralForExtension(null);
                    setExtensionDays("");
                    setExtensionComment("");
                    setExtensionFiles([]);
                  }}
                  disabled={extensionSubmitting}
                >
                  Cancel
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  loading={extensionSubmitting}
                  onClick={async () => {
                    // Validate per-document days
                    if (
                      !extensionDaysByDoc ||
                      Object.keys(extensionDaysByDoc).length === 0
                    ) {
                      message.error(
                        "Please enter extension days for at least one document",
                      );
                      return;
                    }

                    const hasDays = Object.values(extensionDaysByDoc).some(
                      (days) => typeof days === "number" && days > 0,
                    );
                    if (!hasDays) {
                      message.error("Please enter valid extension days");
                      return;
                    }

                    setExtensionSubmitting(true);
                    try {
                      const stored = JSON.parse(
                        localStorage.getItem("user") || "null",
                      );
                      const token = stored?.token;

                      const extensionData = {
                        extensionDaysByDoc,
                        comment: extensionComment,
                        fileUrls: extensionFiles
                          .map((f) => f.url || f.response?.url || "")
                          .filter(
                            (url) =>
                              typeof url === "string" && url.trim() !== "",
                          ),
                      };

                      await deferralApi.submitExtension(
                        selectedDeferralForExtension._id,
                        extensionData,
                        token,
                      );

                      message.success(
                        "Extension application submitted successfully",
                      );

                      // Refresh deferral data
                      await loadDeferrals();

                      // Dispatch update event
                      if (selectedDeferralForExtension) {
                        window.dispatchEvent(
                          new CustomEvent("deferral:updated", {
                            detail: selectedDeferralForExtension,
                          }),
                        );
                      }

                      // Show success state - user can now click "View Extension Applications"
                      setExtensionSubmissionSuccess(true);
                    } catch (error) {
                      console.error("Error submitting extension:", error);
                      message.error(
                        error.message ||
                          "Failed to submit extension application",
                      );
                    } finally {
                      setExtensionSubmitting(false);
                    }
                  }}
                  style={{
                    backgroundColor: PRIMARY_BLUE,
                    borderColor: PRIMARY_BLUE,
                    color: "#FFFFFF !important",
                  }}
                >
                  {extensionSubmitting ? "Submitting..." : "Submit Extension"}
                </Button>,
              ]
        }
      >
        {extensionSubmissionSuccess ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div
              style={{ fontSize: 48, marginBottom: 16, color: PRIMARY_BLUE }}
            >
              ✓
            </div>
            <Text strong style={{ fontSize: 18 }}>
              Extension application submitted successfully!
            </Text>
            <div style={{ marginTop: 16, color: "#999" }}>
              Click "View Extension Applications" below to see your submission
              and track its approval status.
            </div>
          </div>
        ) : (
          selectedDeferralForExtension &&
          (() => {
            const { dclDocs, uploadedDocs, requestedDocs } =
              getDeferralDocumentBuckets(selectedDeferralForExtension);

            return (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {/* Customer Info */}
                <Card
                  size="small"
                  title={
                    <span style={{ color: PRIMARY_BLUE }}>
                      Customer Information
                    </span>
                  }
                >
                  <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 3 }}>
                    <Descriptions.Item label="Customer">
                      <Text strong>
                        {selectedDeferralForExtension.customerName}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Deferral #">
                      <Text strong>
                        {selectedDeferralForExtension.deferralNumber}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* Extension Days Input (default + per-document) */}
                <Card
                  size="small"
                  title={
                    <span style={{ color: PRIMARY_BLUE }}>
                      Extension Details
                    </span>
                  }
                >
                  <Form layout="vertical">
                    <Form.Item label="Default Extension Days (optional)">
                      <InputNumber
                        min={1}
                        max={365}
                        value={extensionDays || undefined}
                        onChange={(val) => {
                          setExtensionDays(val);
                          if (val && selectedDeferralForExtension) {
                            const { requestedDocs = [] } =
                              getDeferralDocumentBuckets(
                                selectedDeferralForExtension,
                              ) || {};
                            const nextMap = { ...(extensionDaysByDoc || {}) };
                            requestedDocs.forEach((doc) => {
                              const key = String(
                                (doc && (doc.name || doc.label)) || doc || "",
                              )
                                .trim()
                                .toLowerCase();
                              nextMap[key] = val || 0;
                            });
                            setExtensionDaysByDoc(nextMap);
                          }
                        }}
                        placeholder="Enter number of days and apply to all"
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                    <Form.Item label="Per-document Extension Days">
                      <Text type="secondary">
                        Adjust days per document if needed. New due dates will
                        update automatically.
                      </Text>
                    </Form.Item>
                  </Form>
                </Card>

                {/* Documents with Auto-calculated Due Dates */}
                <Card
                  size="small"
                  title={
                    <span style={{ color: PRIMARY_BLUE }}>
                      Documents to be Deferred ({requestedDocs.length})
                    </span>
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {requestedDocs.map((doc, idx) => {
                      const currentDueDate = doc.nextDocumentDueDate
                        ? dayjs(doc.nextDocumentDueDate)
                        : null;
                      const key = String(
                        (doc && (doc.name || doc.label)) || doc || "",
                      )
                        .trim()
                        .toLowerCase();
                      const perDocDays =
                        typeof extensionDaysByDoc[key] !== "undefined"
                          ? Number(extensionDaysByDoc[key])
                          : 0;
                      const newDueDate =
                        perDocDays && currentDueDate
                          ? currentDueDate.add(Number(perDocDays), "day")
                          : null;

                      return (
                        <div
                          key={idx}
                          style={{
                            padding: 12,
                            backgroundColor: "#f9f9f9",
                            borderRadius: 6,
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          <div
                            style={{
                              marginBottom: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            <Text strong style={{ color: PRIMARY_BLUE }}>
                              {doc.name}
                            </Text>
                            <div style={{ minWidth: 160 }}>
                              <InputNumber
                                min={0}
                                max={365}
                                value={perDocDays}
                                onChange={(val) =>
                                  setExtensionDaysByDoc((prev) => ({
                                    ...(prev || {}),
                                    [key]: typeof val === "number" ? val : 0,
                                  }))
                                }
                                style={{ width: 160 }}
                              />
                            </div>
                          </div>

                          <Row gutter={16}>
                            <Col xs={24} sm={12}>
                              <div style={{ fontSize: 12, color: "#666" }}>
                                <b>Current Due Date:</b>
                                <br />
                                {currentDueDate
                                  ? currentDueDate.format("DD MMM YYYY")
                                  : "-"}
                              </div>
                            </Col>
                            <Col xs={24} sm={12}>
                              <div style={{ fontSize: 12, color: "#666" }}>
                                <b>New Due Date:</b>
                                <br />
                                <Text strong style={{ color: SUCCESS_GREEN }}>
                                  {newDueDate
                                    ? newDueDate.format("DD MMM YYYY")
                                    : "-"}
                                </Text>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Comment Section */}
                <Card
                  size="small"
                  title={
                    <span style={{ color: PRIMARY_BLUE }}>
                      Extension Comment
                    </span>
                  }
                >
                  <TextArea
                    rows={4}
                    value={extensionComment}
                    onChange={(e) => setExtensionComment(e.target.value)}
                    placeholder="Provide reasons for the extension request..."
                  />
                </Card>

                {/* Additional Documents Upload */}
                <Card
                  size="small"
                  title={
                    <span style={{ color: PRIMARY_BLUE }}>
                      Upload Additional Documents
                    </span>
                  }
                >
                  <Upload
                    fileList={extensionFiles}
                    beforeUpload={() => false}
                    onChange={({ fileList }) => setExtensionFiles(fileList)}
                    multiple
                  >
                    <Button icon={<UploadOutlined />}>
                      Click to Upload Additional Documents
                    </Button>
                  </Upload>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
                    You can upload additional supporting documents for this
                    extension request
                  </div>
                </Card>
              </div>
            );
          })()
        )}
      </Modal>
    </div>
  );
};

export default DeferralPending;
