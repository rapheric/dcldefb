import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Table,
  Tabs,
  Button,
  Divider,
  Tag,
  Spin,
  Empty,
  Card,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  Badge,
  Tooltip,
  Space,
  Modal,
  message,
  List,
  Avatar,
  Descriptions,
  Typography,
  Input as AntInput,
  Collapse,
  Alert,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  SendOutlined,
  MailOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  CustomerServiceOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  EyeOutlined,
  PaperClipOutlined,
  FileDoneOutlined,
  UploadOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  RightOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { jsPDF } from "jspdf";
import deferralApi from "../../service/deferralApi.js";
import { openFileInNewTab, downloadFile } from "../../utils/fileUtils";
import getFacilityColumns from "../../utils/facilityColumns";
import { formatDeferralDocumentType } from "../../utils/deferralDocumentType";
import { getDeferralDocumentBuckets } from "../../utils/deferralDocuments";
import UniformTag from "../../components/common/UniformTag";

// Extend dayjs
dayjs.extend(relativeTime);

// Theme Colors
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";

// Custom CSS for deferral modal styling (matches CO design)
const customStyles = `
  .ant-modal-header { background-color: ${PRIMARY_BLUE} !important; padding: 18px 24px !important; }
  .ant-modal-title { color: white !important; font-size: 1.15rem !important; font-weight: 700 !important; letter-spacing: 0.5px; }
  .ant-modal-close-x { color: white !important; }

  .deferral-info-card .ant-card-head { border-bottom: 2px solid ${ACCENT_LIME} !important; }
  .deferral-info-card .ant-descriptions-item-label { font-weight: 600 !important; color: ${SECONDARY_PURPLE} !important; padding-bottom: 4px; }
  .deferral-info-card .ant-descriptions-item-content { color: ${PRIMARY_BLUE} !important; font-weight: 700 !important; font-size: 13px !important; }

  .ant-input, .ant-select-selector { border-radius: 6px !important; border-color: #e0e0e0 !important; }
  .ant-input:focus, .ant-select-focused .ant-select-selector { box-shadow: 0 0 0 2px rgba(22, 70, 121, 0.2) !important; border-color: ${PRIMARY_BLUE} !important; }

  .status-tag { font-weight: 700 !important; border-radius: 999px !important; padding: 3px 8px !important; text-transform: capitalize; min-width: 80px; text-align: center; display: inline-flex; align-items: center; gap: 4px; justify-content: center; }
 
  .approved-status {
    background-color: ${SUCCESS_GREEN}15 !important;
    border: 1px solid ${SUCCESS_GREEN}40 !important;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 16px;
  }
 
  .approved-badge {
    background-color: ${SUCCESS_GREEN} !important;
    border-color: ${SUCCESS_GREEN} !important;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
 
  .rejected-badge {
    background-color: ${ERROR_RED} !important;
    border-color: ${ERROR_RED} !important;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .ant-modal-footer .ant-btn { border-radius: 8px; font-weight: 600; height: 38px; padding: 0 16px; }
  .ant-modal-footer .ant-btn-primary { background-color: ${PRIMARY_BLUE} !important; border-color: ${PRIMARY_BLUE} !important; }
`;

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;
const { TextArea } = AntInput;
const { Panel } = Collapse;

// Helper function to get role tag with color
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
    case "cocreator":
      color = "green";
      break;
    case "co creator":
      color = "green";
      break;
    case "co-creator":
      color = "green";
      break;
    case "co_checker":
      color = "volcano";
      break;
    case "checker":
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
  return username.replace(/\s*\([^)]*\)\s*$/, '').trim();
};

// Comment Trail Component
const CommentTrail = ({ history, isLoading }) => {
  if (isLoading) return <Spin className="block m-5" />;
  if (!history || history.length === 0) return <i className="pl-4">No historical comments yet.</i>;

  return (
    <div className="max-h-52 overflow-y-auto">
      <List
        dataSource={history}
        itemLayout="horizontal"
        renderItem={(item, idx) => {
          const roleLabel = item.userRole || item.role;
          const name = formatUsername(item.user) || item.userName || 'System';
          const text = item.comment || item.notes || item.message || item.text || 'No comment provided.';
          const timestamp = item.date || item.createdAt || item.timestamp;
          return (
            <List.Item key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#164679' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', minWidth: 0 }}>
                      <b style={{ fontSize: 14, color: '#164679', display: 'inline-block', width: 120, minWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</b>
                      {roleLabel && getRoleTag(roleLabel)}
                    </div>
                    <span style={{ color: '#4a4a4a', display: 'block' }}>{text}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#777' }}>
                  {timestamp ? dayjs(timestamp).format('M/D/YY, h:mm A') : ''}
                </div>
              </div>
            </List.Item>
          );
        }}
      />
    </div>
  );
};

// Status Display Component - Shows real-time deferral status
const DeferralStatusAlert = ({ deferral }) => {
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

  // Check for approvers approval
  let allApproversApprovedLocal = false;
  if (deferral.approvals && deferral.approvals.length > 0) {
    allApproversApprovedLocal = deferral.approvals.every(
      (app) => app.status === "approved",
    );
  }

  // Also check allApproversApproved field directly
  if (typeof deferral.allApproversApproved !== 'undefined') {
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

  // Fully Approved Status
  if (isFullyApproved) {
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
              All approvers, Creator, and Checker have approved this deferral request. You can now submit the deferred document before or during the next due date.
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
              {deferral.returnReason && `Reason: ${deferral.returnReason}`}
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
            Approvers:{" "}
            {allApproversApprovedLocal ? "All Approved" : "Pending"}
          </div>
          <div>
            CO Creator: {hasCreatorApproved ? "Approved" : "Pending"}
          </div>
          <div>
            CO Checker: {hasCheckerApproved ? "Approved" : "Pending"}
          </div>
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
              This deferral request is currently awaiting approval from the approval chain
            </p>
          </div>
        </div>
        {deferral.slaExpiry && (
          <div style={{ marginTop: 12, padding: 12, backgroundColor: '#fff', borderRadius: 4, fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: SECONDARY_PURPLE }}>SLA Expiry: </span>
            <span style={{ color: dayjs(deferral.slaExpiry).isBefore(dayjs()) ? ERROR_RED : PRIMARY_BLUE }}>
              {dayjs(deferral.slaExpiry).format('DD MMM YYYY HH:mm')}
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
              The deferred document has been submitted and is awaiting final approval from the Checker.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const Deferrals = ({ userId }) => {
  // Get token from Redux
  const token = useSelector((state) => state.auth.token);

  // State Management
  const [selectedDeferral, setSelectedDeferral] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    priority: "all",
    search: "",
    dateRange: null,
  });

  // Local copy so we can update UI and persist history without relying on parent props
  const [localDeferral, setLocalDeferral] = useState(null);
  useEffect(() => {
    setLocalDeferral(selectedDeferral);
  }, [selectedDeferral]);
  const [loading, setLoading] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [creatorComment, setCreatorComment] = useState("");
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [approvalConfirmModalVisible, setApprovalConfirmModalVisible] =
    useState(false);
  const [disabledDeferralIds, setDisabledDeferralIds] = useState(new Set());
 
  // Reject/Rework confirmation modal states
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showReworkConfirm, setShowReworkConfirm] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [reworkComment, setReworkComment] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [returnReworkLoading, setReturnReworkLoading] = useState(false);

  // Fetch deferrals from API
  const fetchDeferrals = async () => {
    setLoading(true);
    try {
      // Use getPendingDeferrals to get ALL pending deferrals for all CO creators,
      // then combine with other statuses from getMyDeferrals for a complete view
      const pending = await deferralApi.getPendingDeferrals(token);
      const all = Array.isArray(pending) ? pending : [];

      // For approved/rejected/closed, get the current user's deferrals
      const my = await deferralApi.getMyDeferrals(token);
      const myDeferrals = Array.isArray(my) ? my : [];

      // Also get approved deferrals to ensure we see deferrals we approved as CO Creator
      const approvedDeferrals = await deferralApi.getApprovedDeferrals(token);
      const allApproved = Array.isArray(approvedDeferrals) ? approvedDeferrals : [];
      const closeWorkflowDeferrals = await deferralApi
        .getCloseWorkflowDeferrals(token)
        .catch(() => []);
      const closeWorkflow = Array.isArray(closeWorkflowDeferrals)
        ? closeWorkflowDeferrals
        : [];

      console.log('DEBUG fetchDeferrals:', {
        pendingCount: all.length,
        myDeferralsCount: myDeferrals.length,
        approvedDeferralsCount: allApproved.length,
        closeWorkflowCount: closeWorkflow.length,
        sampleApproved: allApproved[0],
      });

      // Combine: all pending deferrals + this creator's approved/rejected/closed + all approved deferrals
      const approved = myDeferrals.filter((d) =>
        ["approved", "deferral_approved"].includes(
          (d.status || "").toLowerCase(),
        ),
      );
      const rejected = myDeferrals.filter((d) =>
        ["rejected", "deferral_rejected"].includes(
          (d.status || "").toLowerCase(),
        ),
      );
      const closed = myDeferrals.filter((d) =>
        [
          "closed",
          "deferral_closed",
          "closed_by_co",
          "closed_by_creator",
        ].includes((d.status || "").toLowerCase()),
      );

      // Merge approved deferrals from both sources and deduplicate by _id
      const allApprovedMerged = [...approved, ...allApproved];
      const uniqueApproved = Array.from(
        new Map(allApprovedMerged.map(d => [d._id || d.id || d.deferralNumber, d])).values()
      );

      const combined = [
        ...all,
        ...uniqueApproved,
        ...rejected,
        ...closed,
        ...closeWorkflow,
      ];

      // Deduplicate the final combined array by _id
      const uniqueCombined = Array.from(
        new Map(combined.map(d => [d._id || d.id || d.deferralNumber, d])).values()
      );

      if (!Array.isArray(uniqueCombined)) return [];
      console.debug("loadDeferrals (creator)", {
        pending: pending.length,
        approved: uniqueApproved.length,
        rejected: rejected.length,
        closed: closed.length,
        total: uniqueCombined.length,
      });
      return uniqueCombined;
    } catch (error) {
      console.error("Error fetching deferrals:", error);
      message.error("Failed to load deferrals");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // State for deferrals
  const [deferrals, setDeferrals] = useState([]);
  const [filteredDeferrals, setFilteredDeferrals] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const a = q.get("active");
      if (
        a === "rejected" ||
        a === "approved" ||
        a === "pending" ||
        a === "closed" ||
        a === "closeRequests"
      )
        return a;
    } catch (e) { }
    return "pending";
  });

  // Initialize
  useEffect(() => {
    loadDeferrals();

    const handler = (e) => {
      try {
        const updated = e && e.detail ? e.detail : null;
        if (!updated || !updated._id) return;

        setDeferrals((prev) => {
          const exists = prev.some(
            (d) => String(d._id) === String(updated._id),
          );
          if (exists) {
            return prev.map((d) =>
              d._id === updated._id ? { ...d, ...updated } : d,
            );
          }
          const stored = JSON.parse(localStorage.getItem("user") || "null");
          const myId = stored?.user?._id || userId;
          const isMine =
            updated.requestor &&
            ((updated.requestor._id &&
              String(updated.requestor._id) === String(myId)) ||
              String(updated.requestor) === String(myId));
          if (isMine) return [updated, ...prev];
          return prev;
        });

        // Also update selectedDeferral if this is the deferral being viewed in the modal
        if (
          selectedDeferral &&
          String(selectedDeferral._id) === String(updated._id)
        ) {
          setSelectedDeferral((prev) => ({ ...prev, ...updated }));
        }

        const myUserId = localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user")).user._id
          : null;
        const isMine =
          updated.requestor &&
          ((updated.requestor._id &&
            String(updated.requestor._id) === String(myUserId)) ||
            String(updated.requestor) === String(myUserId));
        const s = (updated.status || "").toLowerCase();
        if (
          (s === "rejected" ||
            s === "deferral_rejected" ||
            s === "returned_for_rework") &&
          isMine
        ) {
          setActiveTab("rejected");
        }
        if (
          [
            "closed",
            "deferral_closed",
            "closed_by_co",
            "closed_by_creator",
          ].includes(s) &&
          isMine
        ) {
          setActiveTab("closed");
        }
        if (s === "close_requested") {
          setActiveTab("closeRequests");
        }
        if ((s === "approved" || s === "deferral_approved") && isMine) {
          setActiveTab("approved");
        }
        if (
          [
            "returned_for_rework",
            "returned_by_creator",
            "returned_by_checker",
          ].includes(s) &&
          isMine
        ) {
          setActiveTab("closed");
        }
      } catch (err) {
        console.warn("deferral:updated handler error", err);
      }
    };

    window.addEventListener("deferral:updated", handler);
    return () => {
      window.removeEventListener("deferral:updated", handler);
    };
  }, [userId]);

  useEffect(() => {
    if (!selectedDeferral || !modalVisible) return;
    let cancelled = false;
    const fetchLatest = async () => {
      try {
        const fresh = await deferralApi.getDeferralById(
          selectedDeferral._id,
          token,
        );
        if (!cancelled && fresh) setSelectedDeferral(fresh);
      } catch (err) {
        console.debug("deferral refresh failed", err?.message || err);
      }
    };
    fetchLatest();
    const t = setInterval(fetchLatest, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [selectedDeferral?._id, modalVisible]);

  const loadDeferrals = async () => {
    console.log("Loading deferrals for CO dashboard...");
    const data = await fetchDeferrals();
    setDeferrals(data);
    const pending = data.filter((d) =>
      ["pending_approval", "in_review", "partially_approved"].includes(d.status),
    );
    setFilteredDeferrals(pending);
  };

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [deferrals, filters, activeTab]);

  const applyFilters = () => {
    const pendingStatuses = [
      "pending_approval",
      "in_review",
      "deferral_requested",
      "partially_approved",
    ];
    const returnedStatuses = [
      "returned_for_rework",
      "returned_by_creator",
      "returned_by_checker",
    ];
    const approvedStatuses = ["approved", "deferral_approved"];
    const rejectedStatuses = ["rejected", "deferral_rejected"];
    const closeRequestStatuses = ["close_requested"];
    const closeWorkflowStatuses = [
      "close_requested",
      "close_requested_creator_approved",
    ];
    const closedStatuses = [
      "closed",
      "deferral_closed",
      "closed_by_co",
      "closed_by_creator",
    ];

    let base = deferrals.filter((d) => {
      const s = (d.status || "").toString().toLowerCase();
      if (activeTab === "pending") {
        // PENDING tab: all non-terminal items except final approved
        const hasCreatorApproved = d.creatorApprovalStatus === "approved";
        const hasCheckerApproved = d.checkerApprovalStatus === "approved";
        const lastReturnedByRole = (d.lastReturnedByRole || "")
          .toString()
          .toLowerCase();

        if (
          approvedStatuses.includes(s) ||
          rejectedStatuses.includes(s) ||
          closedStatuses.includes(s) ||
          closeWorkflowStatuses.includes(s) ||
          returnedStatuses.includes(s)
        ) {
          return false;
        }

        if (lastReturnedByRole === "checker") return false;
        if (lastReturnedByRole === "creator") return true;

        // Keep deferral in pending if:
        // 1. Neither creator nor checker has approved (truly pending)
        // 2. Creator approved but checker hasn't (partially approved, awaiting checker)
        return !hasCheckerApproved;
      }
      if (activeTab === "approved") {
        // APPROVED tab: final checker-approved deferrals
        return approvedStatuses.includes(s);
      }
      if (activeTab === "closed") {
        // COMPLETED tab: Show completed + rejected + returned
        return closedStatuses.includes(s) || rejectedStatuses.includes(s) || returnedStatuses.includes(s);
      }
      if (activeTab === "closeRequests") {
        // CLOSE REQUESTS tab (creator): show RM close requests awaiting creator approval
        return closeRequestStatuses.includes(s);
      }
      return true;
    });

    if (filters.priority !== "all") {
      base = base.filter((d) => d.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      base = base.filter(
        (d) =>
          (d.customerNumber || "").toLowerCase().includes(searchLower) ||
          (d.dclNo || d.dclNumber || "").toLowerCase().includes(searchLower) ||
          (d.customerName || "").toLowerCase().includes(searchLower) ||
          (d.deferralNumber || "").toLowerCase().includes(searchLower),
      );
    }

    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      base = base.filter((d) => {
        const createdDate = dayjs(d.createdAt);
        return (
          createdDate.isAfter(filters.dateRange[0]) &&
          createdDate.isBefore(filters.dateRange[1])
        );
      });
    }

    setFilteredDeferrals(base);
  };

  // Check if deferral can be approved (all approvers must have approved)
  const canApproveDeferral = (deferral) => {
    if (!deferral) return false;

    // Check if all approvers have approved
    const allApproversApproved = deferral.allApproversApproved === true;

    // Check creator and checker status
    const hasCreatorApproved = deferral.creatorApprovalStatus === "approved";
    const hasCheckerApproved = deferral.checkerApprovalStatus === "approved";

    // Determine who can approve based on current user role
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = currentUser._id || currentUser.user?._id;
    const userRole = currentUser.role || currentUser.user?.role;

    // For CO Dashboard, check if current user is creator or checker
    let isCreator =
      deferral.creator &&
      (deferral.creator._id === userId || deferral.creator === userId);
    let isChecker =
      deferral.checker &&
      (deferral.checker._id === userId || deferral.checker === userId);

    // If creator/checker aren't explicitly set, allow approval based on role
    // This is important for the creator/checker page where users may not be explicitly assigned
    if (!isCreator && !isChecker) {
      // Allow creator role to approve if all approvers approved and creator hasn't approved yet
      if (
        userRole === "creator" &&
        allApproversApproved &&
        !hasCreatorApproved
      ) {
        return true;
      }
      // Allow checker role to approve if all approvers approved, creator has approved, and checker hasn't approved yet
      if (
        userRole === "checker" &&
        allApproversApproved &&
        hasCreatorApproved &&
        !hasCheckerApproved
      ) {
        return true;
      }
      return false;
    }

    // If all approvers have approved, creator and checker can approve
    if (allApproversApproved) {
      if (isCreator && !hasCreatorApproved) {
        return true; // Creator can approve if all approvers have approved
      }
      if (isChecker && !hasCheckerApproved && hasCreatorApproved) {
        return true; // Checker can approve if creator has approved and all approvers have approved
      }
    }

    return false;
  };

  // Handle deferral actions
  const handleApproveDeferral = async () => {
    if (!selectedDeferral) {
      message.error("No deferral selected");
      return;
    }

    // Show confirmation modal
    setApprovalConfirmModalVisible(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedDeferral) {
      message.error("No deferral selected");
      return;
    }

    setActionLoading(true);
    try {
      console.log("=== Starting handleConfirmApproval ===");
      console.log("Token:", token);
      console.log("Selected Deferral:", selectedDeferral);

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = currentUser._id || currentUser.user?._id;
      const userRole = currentUser.role || currentUser.user?.role;

      console.log("Current User:", currentUser);
      console.log("User ID:", userId);
      console.log("User Role:", userRole);

      const hasCreatorApproved =
        selectedDeferral.creatorApprovalStatus === "approved";
      const hasCheckerApproved =
        selectedDeferral.checkerApprovalStatus === "approved";

      console.log("Has Creator Approved:", hasCreatorApproved);
      console.log("Has Checker Approved:", hasCheckerApproved);

      // Check if this is creator or checker based on explicit fields, or fallback to page context
      const isCreator =
        selectedDeferral.creator &&
        (selectedDeferral.creator._id === userId ||
          selectedDeferral.creator === userId);
      const isChecker =
        selectedDeferral.checker &&
        (selectedDeferral.checker._id === userId ||
          selectedDeferral.checker === userId);

      // Since we're on the creator page, assume user is a creator if role matches or if no creator is assigned
      const effectiveIsCreator =
        isCreator || userRole === "creator" || !selectedDeferral.creator;
      const effectiveIsChecker = isChecker || userRole === "checker";

      console.log("Is Creator:", isCreator);
      console.log("Is Checker:", isChecker);
      console.log("Effective Is Creator:", effectiveIsCreator);
      console.log("Effective Is Checker:", effectiveIsChecker);

      let response;

      // Try to approve as creator first (since this is the creator page)
      if (effectiveIsCreator) {
        console.log("Calling approveByCreator...");
        response = await deferralApi.approveByCreator(
          selectedDeferral._id,
          {
            comment: creatorComment,
            creatorId: userId, // Send current user as creator
          },
          token,
        );
        console.log("Creator approval response:", response);
      } else if (effectiveIsChecker) {
        console.log("Calling approveByChecker...");
        // Then try as checker
        response = await deferralApi.approveByChecker(
          selectedDeferral._id,
          {
            comment: creatorComment,
            checkerId: userId, // Send current user as checker
          },
          token,
        );
        console.log("Checker approval response:", response);
      } else {
        console.error("Unable to determine user role");
        throw new Error(
          "Unable to determine user role. Please contact support.",
        );
      }

      if (response) {
        console.log("=== Approval Response Received ===");
        // Response received - could be successful
        const updatedDeferral = response.deferral || response;

        console.log("Updated Deferral:", updatedDeferral);

        message.success(response.message || "Deferral approved successfully!");

        // Send email notification to RM after approval
        try {
          const userName =
            currentUser.name || currentUser.user?.name || currentUser.email;
          const approvalType = effectiveIsChecker ? "checker" : "creator";
         
          await deferralApi.sendEmailNotification(
            selectedDeferral._id,
            `approved_by_${approvalType}`,
            {
              comment: creatorComment,
              userName: userName,
              approvedBy: effectiveIsChecker ? "Checker" : "Creator",
            },
          );
          console.log("Email notification sent to RM");
        } catch (emailErr) {
          console.warn("Failed to send email notification:", emailErr);
        }

        // Keep the deferral in the list but add to disabled set so buttons are greyed out
        setDisabledDeferralIds((prev) =>
          new Set(prev).add(selectedDeferral._id),
        );

        // Update the deferral in the list with the response
        const updatedDeferrals = deferrals.map((d) =>
          d._id === updatedDeferral._id ? updatedDeferral : d,
        );
        setDeferrals(updatedDeferrals);

        setCreatorComment("");

        // Close the confirmation modal
        console.log("Closing confirmation modal...");
        setApprovalConfirmModalVisible(false);

        // Close the main modal after a short delay
        setTimeout(() => {
          console.log("Closing main modal...");
          setModalVisible(false);
          setSelectedDeferral(null);
        }, 800);

        // Dispatch event for real-time updates to notify checker's page
        try {
          console.log("Dispatching deferral:updated event...");
          window.dispatchEvent(
            new CustomEvent("deferral:updated", {
              detail: updatedDeferral,
            }),
          );
          window.dispatchEvent(
            new CustomEvent("deferral:moved-to-checker", {
              detail: updatedDeferral,
            }),
          );
        } catch (e) {
          console.error("Error dispatching events:", e);
        }
      } else {
        console.error("No response from server");
        throw new Error("No response from server");
      }
    } catch (error) {
      console.error("=== Error in handleConfirmApproval ===", error);
      message.error(error.message || "Failed to approve deferral");
    } finally {
      console.log("=== handleConfirmApproval finished ===");
      setActionLoading(false);
    }
  };

  const handleReject = () => {
    setRejectComment('');
    setShowRejectConfirm(true);
  };

  const doReject = async () => {
    if (!rejectComment.trim()) {
      message.error("Please provide a reason for rejection");
      return;
    }

    setRejecting(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = currentUser._id || currentUser.user?._id;
      const userName =
        currentUser.name || currentUser.user?.name || currentUser.email;

      // Determine which rejection action to take
      const isCreator =
        selectedDeferral.creator &&
        (selectedDeferral.creator._id === userId ||
          selectedDeferral.creator === userId);
      const isChecker =
        selectedDeferral.checker &&
        (selectedDeferral.checker._id === userId ||
          selectedDeferral.checker === userId);

      let response;

      if (isCreator) {
        response = await deferralApi.rejectByCreator(
          selectedDeferral._id,
          {
            comment: rejectComment,
            rejectedBy: userId,
            rejectedByName: userName,
            status: "rejected",
          },
          token,
        );
      } else if (isChecker) {
        response = await deferralApi.rejectByChecker(
          selectedDeferral._id,
          {
            comment: rejectComment,
            rejectedBy: userId,
            rejectedByName: userName,
            status: "rejected",
          },
          token,
        );
      } else {
        response = await deferralApi.rejectDeferral(
          selectedDeferral._id,
          {
            comment: rejectComment,
            rejectedBy: userId,
            rejectedByName: userName,
            status: "rejected",
          },
          token,
        );
      }

      if (response && response.success) {
        message.success("Deferral rejected successfully!");

        // Email notification to RM
        try {
          await deferralApi.sendEmailNotification(
            selectedDeferral._id,
            "rejected_to_rm",
            {
              comment: rejectComment,
              userName: userName,
              rejectedBy: isCreator
                ? "Creator"
                : isChecker
                  ? "Checker"
                  : "Approver",
            },
          );
        } catch (emailErr) {
          console.warn("Failed to send email notification:", emailErr);
        }

        // Update local state - move to rejected list
        const updatedDeferrals = deferrals.map((d) =>
          d._id === selectedDeferral._id ? { ...d, ...response.deferral } : d,
        );
        setDeferrals(updatedDeferrals);

        setModalVisible(false);
        setSelectedDeferral(null);

        // Set active tab to rejected
        setActiveTab("rejected");

        // Load deferrals to refresh lists
        loadDeferrals();

        // Dispatch event for other components
        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", {
              detail: response.deferral,
            }),
          );
          try {
            localStorage.setItem(
              "deferral:update",
              JSON.stringify({ id: response.deferral?._id, ts: Date.now() }),
            );
          } catch (e) {
            /* ignore */
          }
        } catch (e) {
          /* ignore */
        }
      } else {
        throw new Error(response?.message || "Failed to reject deferral");
      }
    } catch (error) {
      console.error("Error rejecting deferral:", error);
      message.error(error.message || "Failed to reject deferral");
    } finally {
      setRejecting(false);
      setShowRejectConfirm(false);
    }
  };

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

  const handleReturnForRework = () => {
    setReworkComment('');
    setShowReworkConfirm(true);
  };

  const doReturnForRework = async () => {
    if (!reworkComment.trim()) {
      message.error("Please provide rework instructions");
      return;
    }

    setReturnReworkLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = currentUser._id || currentUser.user?._id;
      const userName =
        currentUser.name || currentUser.user?.name || currentUser.email;
      const userRole = (currentUser.role || currentUser.user?.role || "").toLowerCase();

      console.log("DEBUG Return for Rework:", { userId, userName, userRole, currentUser });

      // Since this is the Creator/Checker page (Deferrals.jsx), default to Creator endpoint
      // Only use Checker endpoint if explicitly a checker role
      const isChecker = userRole === "checker" || userRole === "co_checker";

      let response;

      if (isChecker) {
        console.log("Using returnForReworkByChecker");
        response = await deferralApi.returnForReworkByChecker(
          selectedDeferral._id,
          {
            comment: reworkComment,
            returnedBy: userId,
            returnedByName: userName,
            returnedByRole: "Checker",
          },
          token,
        );
      } else {
        // Default to Creator endpoint for this page
        console.log("Using returnForReworkByCreator");
        response = await deferralApi.returnForReworkByCreator(
          selectedDeferral._id,
          {
            comment: reworkComment,
            returnedBy: userId,
            returnedByName: userName,
            returnedByRole: "Creator",
          },
          token,
        );
      }

      const reworkSucceeded =
        !!response &&
        (response.success === true ||
          /returned\s+for\s+rework/i.test(String(response.message || "")));

      if (reworkSucceeded) {
        message.success("Deferral returned for rework successfully!");

        const returnedDeferral =
          response?.deferral || {
            ...selectedDeferral,
            status: isChecker ? "returned_by_checker" : "returned_by_creator",
            lastReturnedByRole: isChecker ? "checker" : "creator",
          };

        // Update local state
        const updatedDeferrals = deferrals.map((d) =>
          d._id === selectedDeferral._id ? { ...d, ...returnedDeferral } : d,
        );
        setDeferrals(updatedDeferrals);

        setModalVisible(false);
        setSelectedDeferral(null);

        // Set active tab to returned
        setActiveTab("closed");

        // Load deferrals to refresh lists
        loadDeferrals();

        // Dispatch event for other components
        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", {
              detail: returnedDeferral,
            }),
          );
        } catch (e) {
          /* ignore */
        }
      } else {
        throw new Error(
          response?.message || "Failed to return deferral for rework",
        );
      }
    } catch (error) {
      console.error("Error returning deferral for rework:", error);
      message.error(error.message || "Failed to return deferral for rework");
    } finally {
      setReturnReworkLoading(false);
      setShowReworkConfirm(false);
    }
  };

  const handleCloseDeferral = async () => {
    if (!selectedDeferral || !selectedDeferral._id) {
      message.error("No deferral selected");
      return;
    }

    setActionLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = currentUser._id || currentUser.user?._id;
      const userName =
        currentUser.name || currentUser.user?.name || currentUser.email;

      const response = await deferralApi.closeDeferral(
        selectedDeferral._id,
        {
          closedBy: userId,
          closedByName: userName,
          comment: creatorComment || "Deferral closed by CO",
        },
        token,
      );

      if (response && response.success) {
        // Email notification to all parties
        try {
          await deferralApi.sendEmailNotification(
            selectedDeferral._id,
            "closed_to_all_parties",
            {
              comment: creatorComment || "Deferral closed by CO",
              userName: userName,
            },
          );
        } catch (emailErr) {
          console.warn("Failed to send email notification:", emailErr);
        }

        const updatedDeferrals = deferrals.map((d) =>
          d._id === selectedDeferral._id ? { ...d, ...response.deferral } : d,
        );
        setDeferrals(updatedDeferrals);
        message.success("Deferral closed successfully!");

        setModalVisible(false);
        setSelectedDeferral(null);
        setCreatorComment("");

        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", {
              detail: response.deferral,
            }),
          );
        } catch (e) {
          /* ignore */
        }
      } else {
        throw new Error(response?.message || "Failed to close deferral");
      }
    } catch (error) {
      console.error("Error closing deferral:", error);
      message.error("Failed to close deferral");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCloseRequestByCreator = async () => {
    if (!selectedDeferral || !selectedDeferral._id) {
      message.error("No deferral selected");
      return;
    }

    setActionLoading(true);
    try {
      const response = await deferralApi.approveCloseRequestByCreator(
        selectedDeferral._id,
        { comment: creatorComment || "Close request approved by creator" },
        token,
      );

      const updatedDeferral = response?.deferral || response;
      if (!updatedDeferral?._id) {
        throw new Error("Invalid response while approving close request");
      }

      setDeferrals((prev) =>
        prev.map((d) => (d._id === updatedDeferral._id ? updatedDeferral : d)),
      );
      setSelectedDeferral(updatedDeferral);
      setCreatorComment("");
      message.success("Close request approved and sent to checker");

      window.dispatchEvent(
        new CustomEvent("deferral:updated", {
          detail: updatedDeferral,
        }),
      );

      setModalVisible(false);
      setSelectedDeferral(null);
      loadDeferrals();
    } catch (error) {
      console.error("Error approving close request by creator:", error);
      message.error(error.message || "Failed to approve close request");
    } finally {
      setActionLoading(false);
    }
  };

  // Download deferral as PDF - Fixed version
  const downloadDeferralAsPDF = async () => {
    if (!selectedDeferral || !selectedDeferral._id) {
      message.error("No deferral selected");
      return;
    }

    setActionLoading(true);
    try {
      // Create PDF document
      const doc = new jsPDF();

      // Set colors
      const primaryBlue = [22, 70, 121]; // RGB for PRIMARY_BLUE
      const darkGray = [51, 51, 51];
      const lightGray = [102, 102, 102];

      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      const successGreen = [82, 196, 26];

      // Professional Header with background
      doc.setFillColor(22, 70, 121);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text(`Deferral Request: ${selectedDeferral.deferralNumber || 'N/A'}`, margin, 15);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${dayjs().format('DD MMM YYYY HH:mm')}`, margin, 25);
      yPosition = 45;

      // Customer Information Section with styled background
      doc.setFillColor(255, 250, 205);
      doc.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, 'F');
      doc.setDrawColor(200, 180, 100);
      doc.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, 'S');

      doc.setFontSize(12);
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setFont(undefined, 'bold');
      doc.text('Customer Information', margin + 5, yPosition + 8);

      doc.setFontSize(10);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont(undefined, 'bold');
      doc.text('Customer Name:', margin + 5, yPosition + 16);
      doc.setFont(undefined, 'normal');
      doc.text(selectedDeferral.customerName || 'N/A', margin + 50, yPosition + 16);

      doc.setFont(undefined, 'bold');
      doc.text('Customer Number:', margin + 5, yPosition + 24);
      doc.setFont(undefined, 'normal');
      doc.text(selectedDeferral.customerNumber || 'N/A', margin + 50, yPosition + 24);

      doc.setFont(undefined, 'bold');
      doc.text('Loan Type:', margin + 110, yPosition + 16);
      doc.setFont(undefined, 'normal');
      doc.text(selectedDeferral.loanType || 'N/A', margin + 135, yPosition + 16);

      yPosition += 45;

      const hasCreatorApproved =
        selectedDeferral.creatorApprovalStatus === "approved";
      const hasCheckerApproved =
        selectedDeferral.checkerApprovalStatus === "approved";
      const allApproversApproved =
        selectedDeferral.allApproversApproved === true;
      const isFullyApproved =
        hasCreatorApproved && hasCheckerApproved && allApproversApproved;

      // Deferral Details Section
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(margin, yPosition, contentWidth, 70, 3, 3, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(margin, yPosition, contentWidth, 70, 3, 3, 'S');

      doc.setFontSize(12);
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setFont(undefined, 'bold');
      doc.text('Deferral Details', margin + 5, yPosition + 8);

      doc.setFontSize(9);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      let detailY = yPosition + 16;

      doc.setFont(undefined, 'bold');
      doc.text('Deferral Number:', margin + 5, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(selectedDeferral.deferralNumber || 'N/A', margin + 45, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('DCL No:', margin + 5, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(selectedDeferral.dclNo || selectedDeferral.dclNumber || 'N/A', margin + 45, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Status:', margin + 5, detailY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(isFullyApproved ? 82 : 250, isFullyApproved ? 196 : 173, isFullyApproved ? 26 : 20);
      doc.text(isFullyApproved ? 'Fully Approved' : selectedDeferral.status || 'Pending', margin + 45, detailY);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

      detailY = yPosition + 16;
      doc.setFont(undefined, 'bold');
      doc.text('Creator Status:', margin + 105, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(selectedDeferral.creatorApprovalStatus || 'pending', margin + 145, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Creator Date:', margin + 105, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(selectedDeferral.creatorApprovalDate ? dayjs(selectedDeferral.creatorApprovalDate).format('DD MMM YYYY HH:mm') : 'N/A', margin + 145, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Checker Status:', margin + 105, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(selectedDeferral.checkerApprovalStatus || 'pending', margin + 145, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Checker Date:', margin + 105, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(selectedDeferral.checkerApprovalDate ? dayjs(selectedDeferral.checkerApprovalDate).format('DD MMM YYYY HH:mm') : 'N/A', margin + 145, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Created At:', margin + 105, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(dayjs(selectedDeferral.createdAt).format('DD MMM YYYY HH:mm'), margin + 145, detailY);

      detailY = yPosition + 37;
      doc.setFont(undefined, 'bold');
      doc.text('Approvers Status:', margin + 5, detailY);
      doc.setFont(undefined, 'normal');
      const approvers = selectedDeferral.approverFlow || selectedDeferral.approversFlow || [];
      const approvedCount = approvers.filter((a) => a.approved || a.status === 'approved').length;
      doc.text(approvers.length ? `${approvedCount} of ${approvers.length} Approved` : 'N/A', margin + 45, detailY);

      yPosition += 75;

      // Loan Information with styled background
      const loanAmount = Number(selectedDeferral.loanAmount || 0);
      const formattedLoanAmount = loanAmount ? `KSh ${loanAmount.toLocaleString()}` : 'Not specified';
      const isUnder75M = loanAmount > 0 && loanAmount < 75000000;

      doc.setFillColor(240, 248, 255);
      doc.roundedRect(margin, yPosition, contentWidth, 42, 3, 3, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(margin, yPosition, contentWidth, 42, 3, 3, 'S');

      doc.setFontSize(11);
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setFont(undefined, 'bold');
      doc.text('Loan Information', margin + 5, yPosition + 8);

      doc.setFontSize(9);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      let loanY = yPosition + 16;

      doc.setFont(undefined, 'bold');
      doc.text('Loan Amount:', margin + 5, loanY);
      doc.setFont(undefined, 'normal');
      doc.text(formattedLoanAmount, margin + 40, loanY);
      doc.setFont(undefined, 'italic');
      doc.setFontSize(8);
      doc.text(isUnder75M ? '(Under 75M)' : '(Above 75M)', margin + 90, loanY);

      loanY += 7;
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Days Sought:', margin + 5, loanY);
      doc.setFont(undefined, 'normal');
      const daysColor = selectedDeferral.daysSought > 45 ? [255, 77, 79] : selectedDeferral.daysSought > 30 ? [250, 173, 20] : darkGray;
      doc.setTextColor(daysColor[0], daysColor[1], daysColor[2]);
      doc.text(`${selectedDeferral.daysSought || 0} days`, margin + 40, loanY);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

      loanY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Next Due Date:', margin + 5, loanY);
      doc.setFont(undefined, 'normal');
      const nextDue = selectedDeferral.nextDueDate || selectedDeferral.nextDocumentDueDate || selectedDeferral.requestedExpiry;
      doc.text(nextDue ? dayjs(nextDue).format('DD MMM YYYY') : 'Not calculated', margin + 40, loanY);

      loanY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('SLA Expiry:', margin + 5, loanY);
      doc.setFont(undefined, 'normal');
      doc.text(selectedDeferral.slaExpiry ? dayjs(selectedDeferral.slaExpiry).format('DD MMM YYYY') : 'Not set', margin + 40, loanY);

      yPosition += 47;

      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }

      // Facilities Section with Table
      if (selectedDeferral.facilities && selectedDeferral.facilities.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFont(undefined, 'bold');
        doc.text('Facility Details', margin, yPosition);
        yPosition += 8;

        doc.setFillColor(22, 70, 121);
        doc.rect(margin, yPosition, contentWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('Type', margin + 2, yPosition + 5);
        doc.text('Sanctioned', margin + 50, yPosition + 5);
        doc.text('Balance', margin + 95, yPosition + 5);
        doc.text('Headroom', margin + 135, yPosition + 5);
        yPosition += 8;

        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFont(undefined, 'normal');
        selectedDeferral.facilities.forEach((facility, index) => {
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPosition - 4, contentWidth, 8, 'F');
          }
          const facilityType = facility.type || facility.facilityType || 'N/A';
          doc.text(facilityType, margin + 2, yPosition + 2);
          doc.text(String(facility.sanctionedAmount || '0'), margin + 50, yPosition + 2);
          doc.text(String(facility.outstandingAmount || '0'), margin + 95, yPosition + 2);
          doc.text(String(facility.headroom || '0'), margin + 135, yPosition + 2);
          yPosition += 8;

          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
        });

        yPosition += 5;
      }

      // Deferral Description Section with styled background
      if (selectedDeferral.deferralDescription) {
        doc.setFillColor(255, 250, 205);
        const descLines = doc.splitTextToSize(selectedDeferral.deferralDescription, contentWidth - 20);
        const boxHeight = Math.max(25, descLines.length * 6 + 15);
        doc.roundedRect(margin, yPosition, contentWidth, boxHeight, 3, 3, 'F');
        doc.setDrawColor(200, 180, 100);
        doc.roundedRect(margin, yPosition, contentWidth, boxHeight, 3, 3, 'S');

        doc.setFontSize(10);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFont(undefined, 'bold');
        doc.text('Deferral Description', margin + 5, yPosition + 8);

        doc.setFontSize(9);
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFont(undefined, 'normal');
        let descY = yPosition + 16;
        descLines.forEach((line) => {
          doc.text(line, margin + 5, descY);
          descY += 6;
        });

        yPosition += boxHeight + 5;

        if (yPosition > 230) {
          doc.addPage();
          yPosition = 20;
        }
      }

      // Approval Flow Section with styled badges
      if (selectedDeferral.approverFlow && selectedDeferral.approverFlow.length > 0) {
        if (yPosition > 230) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFillColor(240, 248, 255);
        doc.roundedRect(margin, yPosition, contentWidth, 12, 3, 3, 'F');
        doc.setFontSize(11);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFont(undefined, 'bold');
        doc.text('Approval Flow', margin + 5, yPosition + 8);
        yPosition += 15;

        doc.setFontSize(9);
        selectedDeferral.approverFlow.forEach((approver, index) => {
          const approverName = approver.name || approver.user?.name || approver.email || `Approver ${index + 1}`;
          const status = approver.approved ? 'Approved' : approver.rejected ? 'Rejected' : approver.returned ? 'Returned' : 'Pending';
          const date = approver.approvedDate || approver.rejectedDate || approver.returnedDate || '';
          const statusColor = status === 'Approved' ? successGreen : status === 'Rejected' ? [255, 77, 79] : [250, 173, 20];

          doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
          doc.circle(margin + 5, yPosition + 3, 3, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.setFont(undefined, 'bold');
          doc.text(String(index + 1), margin + 3.5, yPosition + 4.2);

          doc.setFontSize(9);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.setFont(undefined, 'bold');
          doc.text(approverName, margin + 12, yPosition + 4);

          doc.setFont(undefined, 'normal');
          doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
          doc.text(status, margin + 95, yPosition + 4);

          if (date) {
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
            doc.setFontSize(8);
            doc.text(dayjs(date).format('DD MMM YYYY HH:mm'), margin + 130, yPosition + 4);
          }

          yPosition += 10;

          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
        });

        yPosition += 5;
      }

      // Documents Section with styled file type indicators
      if (selectedDeferral.documents && selectedDeferral.documents.length > 0) {
        if (yPosition > 230) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFont(undefined, 'bold');
        doc.text('Attached Documents', margin, yPosition);
        yPosition += 8;

        doc.setFontSize(9);
        selectedDeferral.documents.forEach((doc_item, index) => {
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPosition - 3, contentWidth, 10, 'F');
          }

          const docName = doc_item.name || `Document ${index + 1}`;
          const fileExt = docName.split('.').pop().toLowerCase();
          const fileColor = fileExt === 'pdf' ? [255, 77, 79] : fileExt === 'xlsx' || fileExt === 'xls' ? [82, 196, 26] : primaryBlue;

          doc.setFillColor(fileColor[0], fileColor[1], fileColor[2]);
          doc.circle(margin + 3, yPosition + 2, 2, 'F');

          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.setFont(undefined, 'normal');
          const nameLines = doc.splitTextToSize(docName, contentWidth - 15);
          doc.text(nameLines[0], margin + 8, yPosition + 3);

          if (doc_item.fileSize) {
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`(${(doc_item.fileSize / 1024).toFixed(2)} KB)`, margin + 120, yPosition + 3);
          }

          yPosition += 10;
          doc.setFontSize(9);

          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
        });

        yPosition += 5;
      }

      // Comments/History Section with professional trail
      if (selectedDeferral.comments && selectedDeferral.comments.length > 0) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFont(undefined, 'bold');
        doc.text('Comment Trail', margin, yPosition);
        yPosition += 10;

        selectedDeferral.comments.forEach((comment, index) => {
          const authorName = comment.author?.name || comment.authorName || 'User';
          const authorRole = comment.author?.role || 'N/A';
          const commentText = comment.text || comment.comment || '';
          const commentDate = comment.createdAt ? dayjs(comment.createdAt).format('DD MMM YYYY HH:mm') : '';

          if (index % 2 === 0) {
            doc.setFillColor(250, 252, 255);
            const commentLines = doc.splitTextToSize(commentText, contentWidth - 20);
            doc.rect(margin, yPosition - 3, contentWidth, commentLines.length * 6 + 18, 'F');
          }

          doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
          doc.circle(margin + 5, yPosition + 3, 3, 'F');
          const initials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(6);
          doc.setFont(undefined, 'bold');
          doc.text(initials, margin + 3.5, yPosition + 4);

          doc.setFontSize(9);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.setFont(undefined, 'bold');
          doc.text(authorName, margin + 12, yPosition + 3);

          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(`(${authorRole})`, margin + 50, yPosition + 3);

          doc.text(commentDate, margin + 130, yPosition + 3);

          yPosition += 10;

          doc.setFontSize(9);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          const commentLines = doc.splitTextToSize(commentText, contentWidth - 20);
          commentLines.forEach((line) => {
            doc.text(line, margin + 12, yPosition);
            yPosition += 6;
          });

          yPosition += 8;

          if (yPosition > 240) {
            doc.addPage();
            yPosition = 20;
          }
        });

        yPosition += 2;
      }

      yPosition += 10;

      // Footer
      doc.setFont(undefined, "italic");
      doc.setFontSize(9);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(
        `Generated on: ${dayjs().format("DD MMM YYYY HH:mm")}`,
        margin,
        yPosition,
      );
      doc.text("This is a system-generated report.", margin, yPosition + 6);

      // Save the PDF
      doc.save(
        `Deferral_${selectedDeferral.deferralNumber}_${dayjs().format("YYYYMMDD")}.pdf`,
      );
      message.success("Deferral downloaded as PDF successfully!");
    } catch (error) {
      console.error("Error downloading file:", error);
      message.error("Failed to download deferral. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Export functionality
  const exportDeferrals = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Deferral No,Customer No,Customer Name,DCL No,Document,Loan Type,Expiry Date,RM,Priority,Days Remaining\n" +
      filteredDeferrals
        .map(
          (d) =>
            `${d.deferralNumber},${d.customerNumber},"${d.customerName}",${d.dclNo},"${d.documentName}",${d.loanType},${dayjs(d.expiryDate).format("DD/MM/YYYY")},${d.assignedRM?.name || "N/A"},${d.priority},${d.daysRemaining}`,
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `pending_deferrals_${dayjs().format("YYYYMMDD_HHmmss")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("Deferrals exported successfully!");
  };

  // Custom table styles
  const customTableStyles = `
    .deferrals-table .ant-table-wrapper {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
      border: 1px solid #e0e0e0;
    }
    .deferrals-table .ant-table-thead > tr > th {
      background-color: #f7f7f7 !important;
      color: ${PRIMARY_BLUE} !important;
      font-weight: 700;
      fontSize: 15px;
      padding: 16px 16px !important;
      border-bottom: 3px solid ${ACCENT_LIME} !important;
      border-right: none !important;
    }
    .deferrals-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid #f0f0f0 !important;
      border-right: none !important;
      padding: 14px 16px !important;
      fontSize: 14px;
      color: #333;
    }
    .deferrals-table .ant-table-tbody > tr.ant-table-row:hover > td {
      background-color: rgba(181, 211, 52, 0.1) !important;
      cursor: pointer;
    }
    .deferrals-table .ant-table-bordered .ant-table-container,
    .deferrals-table .ant-table-bordered .ant-table-tbody > tr > td,
    .deferrals-table .ant-table-bordered .ant-table-thead > tr > th {
      border: none !important;
    }
    .deferrals-table .ant-pagination .ant-pagination-item-active {
      background-color: ${ACCENT_LIME} !important;
      border-color: ${ACCENT_LIME} !important;
    }
    .deferrals-table .ant-pagination .ant-pagination-item-active a {
      color: ${PRIMARY_BLUE} !important;
      font-weight: 600;
    }
    .deferrals-table .ant-pagination .ant-pagination-item:hover {
      border-color: ${ACCENT_LIME} !important;
    }
    .deferrals-table .ant-pagination .ant-pagination-prev:hover .ant-pagination-item-link,
    .deferrals-table .ant-pagination .ant-pagination-next:hover .ant-pagination-item-link {
      color: ${ACCENT_LIME} !important;
    }
    .deferrals-table .ant-pagination .ant-pagination-options .ant-select-selector {
      border-radius: 8px !important;
    }
  `;

  // Columns arranged to match RM's layout
  const columns = [
    {
      title: "Deferral No",
      dataIndex: "deferralNumber",
      width: 150,
      render: (text) => (
        <div style={{ fontWeight: 700, color: PRIMARY_BLUE }}>{text}</div>
      ),
    },
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 140,
      render: (text, record) => {
        const value = record.dclNo || record.dclNumber;
        return value ? (
          <div style={{ fontWeight: 600, color: SECONDARY_PURPLE }}>
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
      width: 220,
      render: (text) => (
        <div style={{ fontWeight: 600, color: PRIMARY_BLUE }}>{text}</div>
      ),
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      width: 120,
      render: (t) => <div style={{ color: "#666" }}>{t || "—"}</div>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (status, record) => {
        const hasCreatorApproved = record.creatorApprovalStatus === "approved";
        const hasCheckerApproved = record.checkerApprovalStatus === "approved";
        const allApproversApproved = record.allApproversApproved === true;

        const isFullyApproved =
          hasCreatorApproved && hasCheckerApproved && allApproversApproved;
        const isPartiallyApproved =
          (hasCreatorApproved || hasCheckerApproved || allApproversApproved) &&
          !isFullyApproved;

        const isRejected =
          status === "rejected" || status === "deferral_rejected";
        const isReturned = [
          "returned_for_rework",
          "returned_by_creator",
          "returned_by_checker",
        ].includes(status);

        if (isFullyApproved) {
          return (
            <Tag
              icon={<CheckCircleOutlined />}
              color="success"
              style={{
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: `${SUCCESS_GREEN}15`,
                borderColor: SUCCESS_GREEN,
                color: SUCCESS_GREEN,
              }}
            >
              Approved
            </Tag>
          );
        }

        if (isPartiallyApproved) {
          return (
            <Tag
              color="processing"
              style={{
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Pending
            </Tag>
          );
        }

        if (isRejected) {
          return (
            <Tag
              icon={<CloseCircleOutlined />}
              color="error"
              style={{
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: `${ERROR_RED}15`,
                borderColor: ERROR_RED,
                color: ERROR_RED,
              }}
            >
              Rejected
            </Tag>
          );
        }

        if (isReturned) {
          return (
            <Tag
              icon={<ReloadOutlined />}
              color="warning"
              style={{
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: `${WARNING_ORANGE}15`,
                borderColor: WARNING_ORANGE,
                color: WARNING_ORANGE,
              }}
            >
              Returned
            </Tag>
          );
        }

        let tagColor = "processing";
        let tagText = "Pending";
        if (status === "in_review") {
          tagColor = "processing";
          tagText = "In Review";
        }
        return (
          <Tag color={tagColor} style={{ fontWeight: 700 }}>
            {tagText}
          </Tag>
        );
      },
    },
    {
      title: "Days Sought",
      dataIndex: "daysSought",
      width: 110,
      render: (d) => <div style={{ fontWeight: 700 }}>{d || 0} days</div>,
    },
    {
      title: "SLA",
      dataIndex: "slaExpiry",
      width: 160,
      render: (s) =>
        s ? (
          <div
            style={{
              color: dayjs(s).isBefore(dayjs()) ? ERROR_RED : PRIMARY_BLUE,
            }}
          >
            {dayjs(s).format("DD MMM YYYY HH:mm")}
          </div>
        ) : (
          <div style={{ color: "#999" }}>Not set</div>
        ),
    },
  ];

  // Filter component
  const renderFilters = () => (
    <Card
      style={{
        marginBottom: 16,
        background: "#fafafa",
        border: `1px solid ${PRIMARY_BLUE}20`,
      }}
      size="small"
    >
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Search by DCL No, Deferral No, Customer Name or Number..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={8}>
          <RangePicker
            style={{ width: "100%" }}
            placeholder={["Start Date", "End Date"]}
            value={filters.dateRange}
            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            format="DD/MM/YYYY"
          />
        </Col>

        <Col xs={24} sm={12} md={2}>
          <Button
            onClick={() =>
              setFilters({
                priority: "all",
                search: "",
                dateRange: null,
              })
            }
            style={{ width: "100%" }}
          >
            Clear
          </Button>
        </Col>
      </Row>
    </Card>
  );

  // Handle row click to open modal
  const handleRowClick = (record) => {
    setSelectedDeferral(record);
    setModalVisible(true);
  };

  // Determine modal footer buttons based on deferral status
  const getModalFooter = () => {
    if (!selectedDeferral) return null;

    const normalizedSelectedStatus = (selectedDeferral.status || "").toLowerCase();
    const isApprovedTabModal = activeTab === "approved" || ["approved", "deferral_approved"].includes(normalizedSelectedStatus);

    // Check if this deferral has been approved and is waiting for checker
    const isApprovedAndWaiting = disabledDeferralIds.has(selectedDeferral._id);

    const hasCreatorApproved =
      selectedDeferral.creatorApprovalStatus === "approved";
    const hasCheckerApproved =
      selectedDeferral.checkerApprovalStatus === "approved";
    // Check if all approvers have approved
    let allApproversApproved = false;
    if (selectedDeferral.approvals && selectedDeferral.approvals.length > 0) {
      allApproversApproved = selectedDeferral.approvals.every(
        (app) => String(app.status || '').toLowerCase() === "approved",
      );
    } else {
      const approverList = Array.isArray(selectedDeferral.approverFlow) && selectedDeferral.approverFlow.length > 0
        ? selectedDeferral.approverFlow
        : Array.isArray(selectedDeferral.approvers)
          ? selectedDeferral.approvers
          : [];

      if (approverList.length > 0) {
        allApproversApproved = approverList.every((approver) => {
          const approvalStatus = String(approver?.approvalStatus || approver?.status || '').toLowerCase();
          return approver?.approved === true || approvalStatus === 'approved';
        });
      } else if (selectedDeferral.allApproversApproved === true) {
        allApproversApproved = true;
      }
    }
    const isFullyApproved =
      hasCreatorApproved && hasCheckerApproved && allApproversApproved;
    const isRejected =
      selectedDeferral.status === "rejected" ||
      selectedDeferral.status === "deferral_rejected";
    const isReturned = [
      "returned_for_rework",
      "returned_by_creator",
      "returned_by_checker",
    ].includes((selectedDeferral.status || "").toLowerCase());
    const isCloseRequested =
      (selectedDeferral.status || "").toLowerCase() === "close_requested";
    const isClosed = [
      "closed",
      "deferral_closed",
      "closed_by_co",
      "closed_by_creator",
    ].includes((selectedDeferral.status || "").toLowerCase());

    // Get current user info
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = currentUser._id || currentUser.user?._id;
    const userRole = currentUser.role || currentUser.user?.role;

    const isCreator =
      selectedDeferral.creator &&
      (selectedDeferral.creator._id === userId ||
        selectedDeferral.creator === userId);
    const isChecker =
      selectedDeferral.checker &&
      (selectedDeferral.checker._id === userId ||
        selectedDeferral.checker === userId);

    // On Creator page, assume user is creator if creator field not set (old deferrals)
    // Or if user has creator role and creator field is set, they're the creator
    const effectiveIsCreator =
      isCreator || (!selectedDeferral.creator && userRole === "creator");
    const effectiveIsChecker = isChecker;

    // Common close button
    const closeButton = (
      <Button
        key="close"
        onClick={() => {
          setModalVisible(false);
          setSelectedDeferral(null);
          setCreatorComment("");
        }}
      >
        Close
      </Button>
    );

    if (isApprovedTabModal) {
      return [
        closeButton,
        <Button
          key="download"
          type="primary"
          onClick={downloadDeferralAsPDF}
          loading={actionLoading}
          icon={<FilePdfOutlined />}
          style={{ marginLeft: "auto", backgroundColor: "#164679", borderColor: "#164679" }}
        >
          Download as PDF
        </Button>,
      ];
    }

    if (activeTab === "closeRequests" && isCloseRequested) {
      return [
        closeButton,
        <Button
          key="download"
          type="primary"
          onClick={downloadDeferralAsPDF}
          loading={actionLoading}
          icon={<FilePdfOutlined />}
          style={{ marginLeft: "auto", backgroundColor: "#164679", borderColor: "#164679" }}
        >
          Download as PDF
        </Button>,
        <Button
          key="approve_close_request"
          type="primary"
          onClick={handleApproveCloseRequestByCreator}
          style={{ backgroundColor: ACCENT_LIME, borderColor: ACCENT_LIME, color: "#ffffff" }}
        >
          Approve Close Request
        </Button>,
      ];
    }

    // If deferral is approved and waiting for checker, grey out all buttons except download
    if (isApprovedAndWaiting) {
      return [
        closeButton,
        <Button
          key="download"
          type="primary"
          onClick={downloadDeferralAsPDF}
          icon={<FilePdfOutlined />}
          style={{ marginRight: "auto", backgroundColor: "#164679", borderColor: "#164679" }}
        >
          Download as PDF
        </Button>,

        <Button
          key="return_for_rework"
          icon={<ReloadOutlined />}
          disabled
          style={{ backgroundColor: "#164679", borderColor: "#164679", color: "#ffffff" }}
        >
          Return for Re-work
        </Button>,

       

        <Button
          key="approve"
          type="primary"
          disabled
          style={{ backgroundColor: "#164679", borderColor: "#164679", color: "#ffffff" }}
        >
          Awaiting Checker Approval
        </Button>,
      ];
    }

    // Fully Approved deferrals (Approved tab)
    if (isFullyApproved) {
      return [
        closeButton,
        <Button
          key="download"
          type="primary"
          onClick={downloadDeferralAsPDF}
          loading={actionLoading}
          icon={<FilePdfOutlined />}
          style={{ marginLeft: "auto", backgroundColor: "#164679", borderColor: "#164679" }}
        >
          Download as PDF
        </Button>,
      ];
    }

    // Rejected deferrals
    if (isRejected) {
      return [closeButton];
    }

    // Returned or Closed deferrals
    if (isReturned || isClosed) {
      return [
        closeButton,
        <Button
          key="download"
          type="primary"
          onClick={downloadDeferralAsPDF}
          loading={actionLoading}
          icon={<FilePdfOutlined />}
          style={{ backgroundColor: "#164679", borderColor: "#164679" }}
        >
          Download as PDF
        </Button>,
      ];
    }

    // DEFAULT: Pending deferrals (In Review) - All buttons active
    return [
      // DOWNLOAD
      <Button
        key="download"
        type="primary"
        onClick={downloadDeferralAsPDF}
        icon={<FilePdfOutlined />}
        style={{ marginRight: "auto", backgroundColor: "#164679", borderColor: "#164679" }}
      >
        Download as PDF
      </Button>,

      // RETURN FOR REWORK
      <Button
        key="return_for_rework"
        onClick={handleReturnForRework}
        icon={<ReloadOutlined />}
        disabled={!allApproversApproved}
        style={{ backgroundColor: "#164679", borderColor: "#164679", color: "#ffffff" }}
      >
        Return for Re-work
      </Button>,

     

      // APPROVE
      <Button
        key="approve"
        type="primary"
        onClick={handleApproveDeferral}
        disabled={!allApproversApproved || hasCreatorApproved}
        style={{
          backgroundColor: hasCreatorApproved ? "#d9d9d9" : "#164679",
          borderColor: hasCreatorApproved ? "#d9d9d9" : "#164679",
          color: "#ffffff"
        }}
      >
        {!allApproversApproved
          ? "Awaiting Approver Approval"
          : hasCreatorApproved
            ? "Awaiting Checker Approval"
            : "Approve Deferral"}
      </Button>,
    ];
  };

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
        styles={{ body: { padding: 16 } }}
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
              Deferral Management Dashboard
              <Badge
                count={deferrals.length}
                style={{
                  backgroundColor: ACCENT_LIME,
                  fontSize: 12,
                }}
              />
            </h2>
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
              {activeTab === "pending"
                ? "Review and manage pending deferral requests from Relationship Managers"
                : activeTab === "approved"
                    ? "View fully approved deferral requests"
                    : activeTab === "closeRequests"
                      ? "Approve RM close requests before checker review"
                      : "View completed deferrals"}
            </p>
          </Col>

          <Col>
            <Space>
              <Tooltip title="Refresh">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadDeferrals}
                  loading={loading}
                />
              </Tooltip>

              <Tooltip title="Export Deferrals">
                <Button
                  icon={<DownloadOutlined />}
                  onClick={exportDeferrals}
                  disabled={filteredDeferrals.length === 0}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      {renderFilters()}

      {/* Table Title + Tabs */}
      <Divider style={{ margin: "12px 0" }}>
        <span style={{ color: PRIMARY_BLUE, fontSize: 16, fontWeight: 600 }}>
          Deferrals
        </span>
      </Divider>

      <div style={{ marginBottom: 12 }}>
        <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k)}>
          <Tabs.TabPane
            tab={`Pending Deferrals (${deferrals.filter((d) => {
              const s = (d.status || "").toString().toLowerCase();
              const hasCheckerApproved = d.checkerApprovalStatus === "approved";
              return (
                [
                  "pending_approval",
                  "in_review",
                  "deferral_requested",
                  "partially_approved",
                ].includes(s) && !hasCheckerApproved
              );
            }).length
              })`}
            key="pending"
          />
          <Tabs.TabPane
            tab={`Approved Deferrals (${deferrals.filter((d) => {
              const s = (d.status || "").toString().toLowerCase();
              return ["approved", "deferral_approved"].includes(s);
            }).length
              })`}
            key="approved"
          />
          <Tabs.TabPane
            tab={`Close Requests (${deferrals.filter((d) => ["close_requested"].includes((d.status || "").toString().toLowerCase())).length})`}
            key="closeRequests"
          />
          <Tabs.TabPane
            tab={`Completed Deferrals (${deferrals.filter((d) => ["closed", "deferral_closed", "closed_by_co", "closed_by_creator", "returned_for_rework", "returned_by_creator", "returned_by_checker", "rejected", "deferral_rejected"].includes((d.status || "").toString().toLowerCase())).length})`}
            key="closed"
          />
        </Tabs>
        <div style={{ marginTop: 8, fontWeight: 700, color: PRIMARY_BLUE }}>
          {activeTab === "pending"
            ? `Pending Deferrals (${filteredDeferrals.length} items)`
            : activeTab === "approved"
                ? `Fully Approved Deferrals (${filteredDeferrals.length} items)`
                : activeTab === "closeRequests"
                  ? `Close Requests (${filteredDeferrals.length} items)`
                  : `Completed Deferrals (${filteredDeferrals.length} items)`}
        </div>
      </div>

      {/* Deferrals Table */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
          }}
        >
          <Spin tip={`Loading ${activeTab} deferrals...`} />
        </div>
      ) : filteredDeferrals.length === 0 ? (
        <Empty
          description={
            <div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>
                {activeTab === "pending"
                  ? "No pending deferrals found"
                  : activeTab === "approved"
                      ? "No fully approved deferrals found"
                      : activeTab === "closeRequests"
                        ? "No close requests found"
                      : "No completed deferrals found"}
              </p>
              <p style={{ color: "#999" }}>
                {filters.search || filters.priority !== "all"
                  ? "Try changing your filters"
                  : activeTab === "pending"
                    ? "All deferral requests have been processed"
                    : activeTab === "approved"
                        ? "No deferrals have been fully approved yet"
                        : activeTab === "closeRequests"
                          ? "No RM close requests awaiting creator approval"
                          : "No deferrals have been completed yet"}
              </p>
            </div>
          }
          style={{ padding: 40 }}
        />
      ) : (
        <div className="deferrals-table">
          <Table
            columns={columns}
            dataSource={filteredDeferrals}
            rowKey={(record) => record._id || record.id}
            size="large"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              position: ["bottomCenter"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} ${activeTab} deferrals`,
            }}
            rowClassName={(record, index) =>
              index % 2 === 0 ? "bg-white" : "bg-gray-50"
            }
            scroll={{ x: 1300 }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: "pointer" },
            })}
          />
        </div>
      )}

      {/* Deferral Review Modal */}
      <style>{customStyles}</style>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BankOutlined style={{ color: "white", fontSize: 22 }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>
                Deferral Request: {selectedDeferral?.deferralNumber}
              </div>
            </div>
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedDeferral(null);
          setCreatorComment("");
        }}
        width={1050}
        styles={{ body: { padding: "0 24px 24px" } }}
        footer={getModalFooter()}
      >
        {selectedDeferral &&
          (() => {
            const hasCreatorApproved =
              selectedDeferral.creatorApprovalStatus === "approved";
            const hasCheckerApproved =
              selectedDeferral.checkerApprovalStatus === "approved";
            const allApproversApproved =
              selectedDeferral.allApproversApproved === true;

            const isFullyApproved =
              hasCreatorApproved && hasCheckerApproved && allApproversApproved;
            const isPartiallyApproved =
              (hasCreatorApproved ||
                hasCheckerApproved ||
                allApproversApproved) &&
              !isFullyApproved;

            const isRejected =
              selectedDeferral.status === "rejected" ||
              selectedDeferral.status === "deferral_rejected";
            const isReturned = [
              "returned_for_rework",
              "returned_by_creator",
              "returned_by_checker",
            ].includes(selectedDeferral.status);

            const getFileIcon = (type) => {
              switch ((type || "").toString().toLowerCase()) {
                case "pdf":
                  return <FilePdfOutlined style={{ color: ERROR_RED }} />;
                case "doc":
                case "docx":
                  return <FileWordOutlined style={{ color: PRIMARY_BLUE }} />;
                case "xls":
                case "xlsx":
                case "csv":
                  return <FileExcelOutlined style={{ color: SUCCESS_GREEN }} />;
                case "jpg":
                case "jpeg":
                case "png":
                  return <FileImageOutlined style={{ color: "#7e6496" }} />;
                default:
                  return <FileTextOutlined />;
              }
            };

            const { dclDocs, uploadedDocs, requestedDocs } =
              getDeferralDocumentBuckets(selectedDeferral);

            // Process history to show ONLY user-entered comments (no system-generated text)
            const history = [];

            // Add ONLY user-posted comments from the comments array
            if (
              selectedDeferral.comments &&
              Array.isArray(selectedDeferral.comments) &&
              selectedDeferral.comments.length > 0
            ) {
              selectedDeferral.comments.forEach((c) => {
                const commentAuthorName = c.author?.name || "User";
                const commentAuthorRole = c.author?.role || "User";
                history.push({
                  user: commentAuthorName,
                  userRole: commentAuthorRole,
                  date: c.createdAt,
                  comment: c.text || "",
                  type: "comment",
                });
              });
            }

            // Process approvers to show approved status with green tick
            const approvers = [];
            let allApproversApprovedLocal = true;
            let hasApprovers = false;

            if (
              selectedDeferral.approverFlow &&
              Array.isArray(selectedDeferral.approverFlow)
            ) {
              hasApprovers = true;
              selectedDeferral.approverFlow.forEach((approver, index) => {
                const isApproved =
                  approver.approved || approver.approved === true;
                const isRejected =
                  approver.rejected || approver.rejected === true;
                const isReturned =
                  approver.returned || approver.returned === true;
                const isCurrent =
                  !isApproved &&
                  !isRejected &&
                  !isReturned &&
                  (index === selectedDeferral.currentApproverIndex ||
                    selectedDeferral.currentApprover === approver ||
                    selectedDeferral.currentApprover?._id === approver?._id);

                // Check if all approvers have approved
                if (!isApproved && !isRejected && !isReturned) {
                  allApproversApprovedLocal = false;
                }

                approvers.push({
                  ...approver,
                  index,
                  isApproved,
                  isRejected,
                  isReturned,
                  isCurrent,
                  approvalDate: approver.approvedDate || approver.date,
                  rejectionDate: approver.rejectedDate || approver.date,
                  returnDate: approver.returnedDate || approver.date,
                  comment: approver.comment || "",
                });
              });
            } else if (
              selectedDeferral.approvers &&
              Array.isArray(selectedDeferral.approvers)
            ) {
              hasApprovers = true;
              selectedDeferral.approvers.forEach((approver, index) => {
                const isApproved =
                  approver.approved || approver.approved === true;
                const isRejected =
                  approver.rejected || approver.rejected === true;
                const isReturned =
                  approver.returned || approver.returned === true;
                const isCurrent =
                  !isApproved &&
                  !isRejected &&
                  !isReturned &&
                  (index === selectedDeferral.currentApproverIndex ||
                    selectedDeferral.currentApprover === approver ||
                    selectedDeferral.currentApprover?._id === approver?._id);

                // Check if all approvers have approved
                if (!isApproved && !isRejected && !isReturned) {
                  allApproversApprovedLocal = false;
                }

                approvers.push({
                  ...approver,
                  index,
                  isApproved,
                  isRejected,
                  isReturned,
                  isCurrent,
                  approvalDate: approver.approvedDate || approver.date,
                  rejectionDate: approver.rejectedDate || approver.date,
                  returnDate: approver.returnedDate || approver.date,
                  comment: approver.comment || "",
                });
              });
            }

            // If there are no approvers defined, allow approval
            if (!hasApprovers) {
              allApproversApprovedLocal = true;
            }

            history.sort(
              (a, b) => new Date(a.date || 0) - new Date(b.date || 0),
            );

            return (
              <div style={{ padding: "16px 0" }}>
                {/* Show Rejected/Returned Banner */}
                {(isRejected || isReturned) && (
                  <div
                    className="approved-status"
                    style={{
                      backgroundColor: isRejected
                        ? `${ERROR_RED}15`
                        : `${WARNING_ORANGE}15`,
                      borderColor: isRejected
                        ? `${ERROR_RED}40`
                        : `${WARNING_ORANGE}40`,
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
                      {isRejected ? (
                        <CloseCircleOutlined
                          style={{ color: ERROR_RED, fontSize: 24 }}
                        />
                      ) : (
                        <ReloadOutlined
                          style={{ color: WARNING_ORANGE, fontSize: 24 }}
                        />
                      )}
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            color: isRejected ? ERROR_RED : WARNING_ORANGE,
                            fontWeight: 700,
                          }}
                        >
                          {isRejected
                            ? "Deferral Rejected ✗"
                            : "Deferral Returned for Re-work ↻"}
                        </h3>
                        <p style={{ margin: 4, color: "#666", fontSize: 14 }}>
                          {isRejected
                            ? "This deferral has been rejected"
                            : "This deferral has been returned for re-work to the RM"}
                        </p>
                      </div>
                    </div>
                    {selectedDeferral.rejectedBy &&
                      selectedDeferral.rejectedDate &&
                      isRejected && (
                        <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
                          <div>
                            <span
                              style={{
                                fontWeight: 600,
                                color: SECONDARY_PURPLE,
                              }}
                            >
                              Rejected By:{" "}
                            </span>
                            <span
                              style={{ color: PRIMARY_BLUE, fontWeight: 500 }}
                            >
                              {selectedDeferral.rejectedBy}
                            </span>
                          </div>
                          <div>
                            <span
                              style={{
                                fontWeight: 600,
                                color: SECONDARY_PURPLE,
                              }}
                            >
                              Rejected Date:{" "}
                            </span>
                            <span
                              style={{ color: PRIMARY_BLUE, fontWeight: 500 }}
                            >
                              {dayjs(selectedDeferral.rejectedDate).format(
                                "DD MMM YYYY HH:mm",
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    {selectedDeferral.returnedBy &&
                      selectedDeferral.returnedDate &&
                      isReturned && (
                        <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
                          <div>
                            <span
                              style={{
                                fontWeight: 600,
                                color: SECONDARY_PURPLE,
                              }}
                            >
                              Returned By:{" "}
                            </span>
                            <span
                              style={{ color: PRIMARY_BLUE, fontWeight: 500 }}
                            >
                              {selectedDeferral.returnedBy}
                            </span>
                          </div>
                          <div>
                            <span
                              style={{
                                fontWeight: 600,
                                color: SECONDARY_PURPLE,
                              }}
                            >
                              Returned Date:{" "}
                            </span>
                            <span
                              style={{ color: PRIMARY_BLUE, fontWeight: 500 }}
                            >
                              {dayjs(selectedDeferral.returnedDate).format(
                                "DD MMM YYYY HH:mm",
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Real-time Status Alert */}
                <DeferralStatusAlert deferral={selectedDeferral} />

                {/* Customer Information Card */}
                <Card
                  className="deferral-info-card"
                  size="small"
                  title={
                    <span style={{ color: PRIMARY_BLUE }}>
                      Customer Information
                    </span>
                  }
                  style={{ marginBottom: 18 }}
                >
                  <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
                    <Descriptions.Item label="Customer Name">
                      <Text strong style={{ color: PRIMARY_BLUE }}>
                        {selectedDeferral.customerName}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer Number">
                      <Text strong style={{ color: PRIMARY_BLUE }}>
                        {selectedDeferral.customerNumber}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Loan Type">
                      <Text strong style={{ color: PRIMARY_BLUE }}>
                        {selectedDeferral.loanType}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* Deferral Details Card */}
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
                        {selectedDeferral.deferralNumber}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="DCL No">
                      <Text strong style={{ color: PRIMARY_BLUE }}>
                        {selectedDeferral.dclNo || selectedDeferral.dclNumber}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {isFullyApproved ? (
                        <Tag
                          className="approved-badge"
                          icon={<CheckCircleOutlined />}
                        >
                          Fully Approved
                        </Tag>
                      ) : isPartiallyApproved ? (
                        <Tag
                          color="processing"
                          style={{ fontWeight: 700 }}
                        >
                          Partially Approved
                        </Tag>
                      ) : isRejected ? (
                        <Tag
                          className="rejected-badge"
                          icon={<CloseCircleOutlined />}
                        >
                          Rejected
                        </Tag>
                      ) : isReturned ? (
                        <Tag
                          className="returned-badge"
                          icon={<ReloadOutlined />}
                          style={{
                            backgroundColor: `${WARNING_ORANGE}15`,
                            borderColor: WARNING_ORANGE,
                            color: WARNING_ORANGE,
                          }}
                        >
                          Returned
                        </Tag>
                      ) : (
                        <div style={{ fontWeight: 500 }}>
                          {(selectedDeferral.status || "").toLowerCase() ===
                            "deferral_requested"
                            ? "Pending"
                            : selectedDeferral.status || ""}
                        </div>
                      )}
                    </Descriptions.Item>

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
                          const creatorStatus =
                            selectedDeferral.creatorApprovalStatus || "pending";
                          if (creatorStatus === "approved") {
                            return (
                              <UniformTag color="success" icon={<CheckCircleOutlined />} text="Approved" />
                            );
                          } else if (creatorStatus === "rejected") {
                            return (
                              <UniformTag color="error" icon={<CloseCircleOutlined />} text="Rejected" />
                            );
                          } else if (creatorStatus === "returned_for_rework") {
                            return (
                              <UniformTag color="warning" icon={<ReloadOutlined />} text="Returned" />
                            );
                          }
                          return (
                            <UniformTag color="processing" text="Pending" />
                          );
                        })()}

                        {selectedDeferral.creatorApprovalDate && (
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            {dayjs(selectedDeferral.creatorApprovalDate).format(
                              "DD/MM/YY HH:mm",
                            )}
                          </span>
                        )}
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
                          const checkerStatus =
                            selectedDeferral.checkerApprovalStatus || "pending";
                          if (checkerStatus === "approved") {
                            return (
                              <UniformTag color="success" icon={<CheckCircleOutlined />} text="Approved" />
                            );
                          } else if (checkerStatus === "rejected") {
                            return (
                              <UniformTag color="error" icon={<CloseCircleOutlined />} text="Rejected" />
                            );
                          } else if (checkerStatus === "returned_for_rework") {
                            return (
                              <UniformTag color="warning" icon={<ReloadOutlined />} text="Returned" />
                            );
                          }
                          return (
                            <UniformTag color="processing" text="Pending" />
                          );
                        })()}

                        {selectedDeferral.checkerApprovalDate && (
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            {dayjs(selectedDeferral.checkerApprovalDate).format(
                              "DD/MM/YY HH:mm",
                            )}
                          </span>
                        )}
                      </div>
                    </Descriptions.Item>

                    {/* Approvers Status */}
                    <Descriptions.Item label="Approvers Status">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {allApproversApprovedLocal ? (
                          <UniformTag color="success" icon={<CheckCircleOutlined />} text="All Approved" maxChars={12} />
                        ) : (
                          <UniformTag color="processing" text={`${approvers.filter((a) => a.isApproved).length} of ${approvers.length} Approved`} maxChars={14} />
                        )}
                      </div>
                    </Descriptions.Item>

                    {/* Loan Amount */}
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
                          const amt = Number(selectedDeferral.loanAmount || 0);
                          if (!amt) return "Not specified";
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
                            <span
                              style={{ color: PRIMARY_BLUE, fontWeight: 600 }}
                            >
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
                            selectedDeferral.daysSought > 45
                              ? ERROR_RED
                              : selectedDeferral.daysSought > 30
                                ? WARNING_ORANGE
                                : PRIMARY_BLUE,
                        }}
                      >
                        {selectedDeferral.daysSought || 0} days
                      </div>
                    </Descriptions.Item>

                    {/* Deferred due date */}
                    <Descriptions.Item label="Deferred due date">
                      <div style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>
                        {selectedDeferral.nextDueDate ||
                        selectedDeferral.nextDocumentDueDate
                          ? `${dayjs(
                              selectedDeferral.nextDueDate ||
                                selectedDeferral.nextDocumentDueDate,
                            ).format("DD MMM YYYY")}`
                          : "Not calculated"}
                      </div>
                    </Descriptions.Item>

                    {/* Created At */}
                    <Descriptions.Item label="Created At">
                      <div>
                        <Text strong style={{ color: PRIMARY_BLUE }}>
                          {dayjs(
                            selectedDeferral.createdAt ||
                            selectedDeferral.requestedDate,
                          ).format("DD MMM YYYY")}
                        </Text>
                        <Text
                          type="secondary"
                          style={{ fontSize: 11, marginLeft: 4 }}
                        >
                          {dayjs(
                            selectedDeferral.createdAt ||
                            selectedDeferral.requestedDate,
                          ).format("HH:mm")}
                        </Text>
                      </div>
                    </Descriptions.Item>
                  </Descriptions>

                 

                  {selectedDeferral.deferralDescription && (
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
                        <Text>{selectedDeferral.deferralDescription}</Text>
                      </div>
                    </div>
                  )}
                </Card>

                {requestedDocs.length > 0 && (
                  <Card
                    size="small"
                    title={
                      <span style={{ color: PRIMARY_BLUE }}>
                        Document(s) to be deferred ({requestedDocs.length})
                      </span>
                    }
                    style={{ marginBottom: 18 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
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
                              border: isUploaded ? "1px solid #b7eb8f" : "1px solid #ffd591",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <FileDoneOutlined style={{ color: isUploaded ? SUCCESS_GREEN : WARNING_ORANGE, fontSize: 16 }} />
                              <div>
                                <div style={{ fontWeight: 500, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                                  {doc.name}
                                  <UniformTag color={isUploaded ? "green" : "orange"} text={isUploaded ? "Uploaded" : "Requested"} />
                                </div>
                                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                  <b>Type:</b> {formatDeferralDocumentType(doc)}
                                </div>
                                {doc.subItems && doc.subItems.length > 0 && (
                                  <div style={{ fontSize: 12, color: "#333", marginTop: 4 }}>
                                    <b>Selected:</b> {doc.subItems.join(", ")}
                                  </div>
                                )}
                                {uploadedVersion && (
                                  <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                    Uploaded as: {uploadedVersion.name}{" "}
                                    {uploadedVersion.uploadDate ? `• ${dayjs(uploadedVersion.uploadDate).format("DD MMM YYYY HH:mm")}` : ""}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Space>
                              {isUploaded && uploadedVersion && uploadedVersion.url && (
                                <>
                                  <Button type="text" icon={<EyeOutlined />} onClick={() => openFileInNewTab(uploadedVersion.url)} size="small">View</Button>
                                  <Button type="text" icon={<DownloadOutlined />} onClick={() => { downloadFile(uploadedVersion.url, uploadedVersion.name); message.success(`Downloading ${uploadedVersion.name}...`); }} size="small">Download</Button>
                                </>
                              )}
                            </Space>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {selectedDeferral.facilities &&
                  selectedDeferral.facilities.length > 0 && (
                    <Card
                      size="small"
                      title={
                        <span style={{ color: PRIMARY_BLUE }}>
                          Facility Details ({selectedDeferral.facilities.length}
                          )
                        </span>
                      }
                      style={{ marginBottom: 18 }}
                    >
                      <Table
                        dataSource={selectedDeferral.facilities}
                        columns={getFacilityColumns()}
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
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
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
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
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
                                    {dayjs(doc.uploadDate).format(
                                      "DD MMM YYYY HH:mm",
                                    )}
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
                        style={{
                          fontSize: 24,
                          marginBottom: 8,
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

                <Card
                  size="small"
                  title={
                    <span style={{ color: PRIMARY_BLUE }}>
                      <PaperClipOutlined style={{ marginRight: 8 }} />{" "}
                      Additional Uploaded Documents ({uploadedDocs.length})
                    </span>
                  }
                  style={{ marginBottom: 18 }}
                >
                  {uploadedDocs.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
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
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
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
                                    {dayjs(doc.uploadDate).format(
                                      "DD MMM YYYY HH:mm",
                                    )}
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
                     
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 16,
                        color: "#999",
                      }}
                    >
                      <PaperClipOutlined
                        style={{
                          fontSize: 24,
                          marginBottom: 8,
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

                {/* Approval Flow with Green Ticks for Approved Approvers */}
                <Card
                  size="small"
                  title={
                    <span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>
                      Approval Flow
                    </span>
                  }
                  style={{ marginBottom: 18 }}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {approvers.length > 0 ? (
                      approvers.map((approver, index) => {
                        // Determine current approver robustly
                        const isCurrentApprover =
                          approver.isCurrent ||
                          (() => {
                            if (
                              typeof selectedDeferral?.currentApproverIndex ===
                              "number"
                            )
                              return (
                                index === selectedDeferral.currentApproverIndex
                              );
                            const ca = selectedDeferral?.currentApprover;
                            if (!ca) return index === 0; // fallback behavior
                            const getKey = (item) => {
                              if (!item) return "";
                              if (typeof item === "string")
                                return item.toLowerCase();
                              return (
                                String(item._id) ||
                                item.email ||
                                item.name ||
                                (item.user &&
                                  (item.user.email || item.user.name)) ||
                                ""
                              ).toLowerCase();
                            };
                            return getKey(approver) === getKey(ca);
                          })();

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
                              padding: "12px 16px",
                              backgroundColor: approver.isApproved
                                ? `${SUCCESS_GREEN}10`
                                : approver.isRejected
                                  ? `${ERROR_RED}10`
                                  : approver.isReturned
                                    ? `${WARNING_ORANGE}10`
                                    : isCurrentApprover
                                      ? "#e6f7ff"
                                      : "#fafafa",
                              borderRadius: 6,
                              border: approver.isApproved
                                ? `2px solid ${SUCCESS_GREEN}`
                                : approver.isRejected
                                  ? `2px solid ${ERROR_RED}`
                                  : approver.isReturned
                                    ? `2px solid ${WARNING_ORANGE}`
                                    : isCurrentApprover
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
                                backgroundColor: approver.isApproved
                                  ? SUCCESS_GREEN
                                  : approver.isRejected
                                    ? ERROR_RED
                                    : approver.isReturned
                                      ? WARNING_ORANGE
                                      : isCurrentApprover
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
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  marginBottom: 6,
                                }}
                              >
                                <Text strong style={{ fontSize: 14, color: "#262626" }}>
                                  {((approver && typeof approver === "object") && (approver.role || approver.title || approver.designation)) || approverName}
                                </Text>
                                {approver.isApproved && (
                                  <Tag
                                    icon={<CheckCircleOutlined />}
                                    color="success"
                                    style={{ fontSize: 10, padding: "2px 6px" }}
                                  >
                                    Approved
                                  </Tag>
                                )}
                                {approver.isRejected && (
                                  <Tag
                                    icon={<CloseCircleOutlined />}
                                    color="error"
                                    style={{ fontSize: 10, padding: "2px 6px" }}
                                  >
                                    Rejected
                                  </Tag>
                                )}
                                {approver.isReturned && (
                                  <Tag
                                    icon={<ReloadOutlined />}
                                    color="warning"
                                    style={{ fontSize: 10, padding: "2px 6px" }}
                                  >
                                    Returned
                                  </Tag>
                                )}
                                {isCurrentApprover &&
                                  !approver.isApproved &&
                                  !approver.isRejected &&
                                  !approver.isReturned && (
                                    <Tag
                                      color="processing"
                                      style={{
                                        fontSize: 10,
                                        padding: "2px 6px",
                                      }}
                                    >
                                      Current
                                    </Tag>
                                  )}
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Avatar
                                  size={24}
                                  icon={<UserOutlined />}
                                  style={{
                                    backgroundColor: approver.isApproved ? SUCCESS_GREEN : isCurrentApprover ? PRIMARY_BLUE : "#8c8c8c",
                                  }}
                                />
                                <Text style={{ fontSize: 14, color: "#595959" }}>
                                  {approverName}
                                </Text>
                              </div>

                              {approver.isApproved && approver.approvalDate && (
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: SUCCESS_GREEN,
                                    marginTop: 2,
                                  }}
                                >
                                  <CheckCircleOutlined
                                    style={{ marginRight: 4 }}
                                  />
                                  Approved on:{" "}
                                  {dayjs(approver.approvalDate).format(
                                    "DD MMM YYYY HH:mm",
                                  )}
                                </div>
                              )}

                              {approver.isRejected &&
                                approver.rejectionDate && (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: ERROR_RED,
                                      marginTop: 2,
                                    }}
                                  >
                                    <CloseCircleOutlined
                                      style={{ marginRight: 4 }}
                                    />
                                    Rejected on:{" "}
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
                                  }}
                                >
                                  <ReloadOutlined style={{ marginRight: 4 }} />
                                  Returned on:{" "}
                                  {dayjs(approver.returnDate).format(
                                    "DD MMM YYYY HH:mm",
                                  )}
                                </div>
                              )}

                              {approver.comment && (
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#666",
                                    marginTop: 2,
                                    fontStyle: "italic",
                                  }}
                                >
                                  "{approver.comment}"
                                </div>
                              )}

                              {isCurrentApprover &&
                                !approver.isApproved &&
                                !approver.isRejected &&
                                !approver.isReturned && (
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
                                    <ClockCircleOutlined
                                      style={{ fontSize: 11 }}
                                    />
                                    Current Approver • Pending Approval
                                    {selectedDeferral.slaExpiry && (
                                      <span
                                        style={{
                                          marginLeft: 8,
                                          color: WARNING_ORANGE,
                                        }}
                                      >
                                        SLA:{" "}
                                        {dayjs(
                                          selectedDeferral.slaExpiry,
                                        ).format("DD MMM HH:mm")}
                                      </span>
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                        );
                      })
                    ) : selectedDeferral.approvers &&
                      selectedDeferral.approvers.length > 0 ? (
                      selectedDeferral.approvers
                        .filter((a) => a && a !== "")
                        .map((approver, index) => {
                          const isCurrentApprover = (() => {
                            if (
                              typeof selectedDeferral?.currentApproverIndex ===
                              "number"
                            )
                              return (
                                index === selectedDeferral.currentApproverIndex
                              );
                            const ca = selectedDeferral?.currentApprover;
                            if (!ca) return index === 0;
                            const getKey = (item) => {
                              if (!item) return "";
                              if (typeof item === "string")
                                return item.toLowerCase();
                              return (
                                String(item._id) ||
                                item.email ||
                                item.name ||
                                (item.user &&
                                  (item.user.email || item.user.name)) ||
                                ""
                              ).toLowerCase();
                            };
                            return getKey(approver) === getKey(ca);
                          })();
                          const isEmail =
                            typeof approver === "string" &&
                            approver.includes("@");
                          const currentCandidate =
                            selectedDeferral.currentApprover || approver;
                          const emailAddr =
                            (currentCandidate &&
                              typeof currentCandidate === "object" &&
                              currentCandidate.email) ||
                            (typeof approver === "string" &&
                              approver.includes("@")
                              ? approver
                              : typeof currentCandidate === "string" &&
                                currentCandidate.includes("@")
                                ? currentCandidate
                                : null);
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
                                <Text strong style={{ fontSize: 14, color: "#262626" }}>
                                  {typeof approver === "object" ? (approver.role || 'Approver') : (isEmail ? approver.split("@")[0] : approver)}
                                </Text>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                                  <Avatar
                                    size={24}
                                    icon={<UserOutlined />}
                                    style={{
                                      backgroundColor: isCurrentApprover ? PRIMARY_BLUE : "#8c8c8c",
                                    }}
                                  />
                                  <Text style={{ fontSize: 14, color: "#595959" }}>
                                    {typeof approver === "object"
                                      ? approver.name || approver.user?.name || approver.userId?.name || approver.email || String(approver)
                                      : isEmail
                                        ? approver.split("@")[0]
                                        : approver}
                                  </Text>
                                </div>
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
                                    <ClockCircleOutlined
                                      style={{ fontSize: 11 }}
                                    />
                                    Current Approver • Pending Approval
                                    {selectedDeferral.slaExpiry && (
                                      <span
                                        style={{
                                          marginLeft: 8,
                                          color: WARNING_ORANGE,
                                        }}
                                      >
                                        SLA:{" "}
                                        {dayjs(
                                          selectedDeferral.slaExpiry,
                                        ).format("DD MMM HH:mm")}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: 16,
                          color: "#999",
                        }}
                      >
                        <UserOutlined
                          style={{
                            fontSize: 24,
                            marginBottom: 8,
                            color: "#d9d9d9",
                          }}
                        />
                        <div>No approvers specified</div>
                      </div>
                    )}
                  </div>

                  {/* Approval pending guidance removed per request */}
                </Card>

                <div style={{ marginTop: 24 }}>
                  <h4 style={{ color: PRIMARY_BLUE, marginBottom: 16, fontWeight: 700, fontSize: 18 }}>
                    Comment Trail & History
                  </h4>
                  {(function renderHistory() {
                    const events = [];
                    const requester = selectedDeferral.requestor?.name || selectedDeferral.requestedBy?.name || selectedDeferral.requestedBy?.fullName || selectedDeferral.rmName || selectedDeferral.rmRequestedBy?.name || selectedDeferral.createdBy?.name || selectedDeferral.createdByName || 'RM';
                    const requesterRole = selectedDeferral.requestor?.role || selectedDeferral.requestedBy?.role || 'RM';
                    const requestDate = selectedDeferral.requestedDate || selectedDeferral.createdAt || selectedDeferral.requestedAt;
                    const requestComment = selectedDeferral.rmReason || 'Deferral request submitted';
                    events.push({ user: requester, userRole: requesterRole, date: requestDate, comment: requestComment });

                    if (selectedDeferral.comments && Array.isArray(selectedDeferral.comments) && selectedDeferral.comments.length > 0) {
                      selectedDeferral.comments.forEach(c => {
                        const commentAuthorName = c.author?.name || c.authorName || c.userName || c.author?.email || 'RM';
                        const commentAuthorRole = c.author?.role || c.authorRole || c.role || 'RM';
                        events.push({
                          user: commentAuthorName,
                          userRole: commentAuthorRole,
                          date: c.createdAt,
                          comment: c.text || ''
                        });
                      });
                    }

                    if (selectedDeferral.history && Array.isArray(selectedDeferral.history) && selectedDeferral.history.length > 0) {
                      selectedDeferral.history.forEach((h) => {
                        if (h.action === 'moved') return;
                        const userName = h.user?.name || h.userName || h.user || 'System';
                        const userRole = h.user?.role || h.userRole || h.role || 'System';
                        events.push({
                          user: userName,
                          userRole: userRole,
                          date: h.date || h.createdAt || h.timestamp || h.entryDate,
                          comment: h.comment || h.notes || h.message || ''
                        });
                      });
                    }

                    const sorted = events.sort((a, b) => (new Date(a.date || 0)) - (new Date(b.date || 0)));
                    return <CommentTrail history={sorted} isLoading={false} />;
                  })()}
                </div>
              </div>
            );
          })()}
      </Modal>

      {/* Approval Confirmation Modal */}
      <Modal
        title="Confirm Deferral Approval"
        open={approvalConfirmModalVisible}
        onCancel={() => setApprovalConfirmModalVisible(false)}
        okText="Confirm Approval"
        cancelText="Cancel"
        okButtonProps={{
          loading: actionLoading,
          style: {
            background: ACCENT_LIME,
            borderColor: ACCENT_LIME,
            color: "#ffffff",
          },
        }}
        onOk={handleConfirmApproval}
      >
        <div style={{ padding: "12px 0" }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 16, color: PRIMARY_BLUE }}>
              Are you sure you want to approve this deferral?
            </Text>
          </div>
          <div
            style={{
              padding: 12,
              backgroundColor: "#f0f5ff",
              borderLeft: `4px solid ${PRIMARY_BLUE}`,
              borderRadius: 4,
              marginBottom: 16,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: SECONDARY_PURPLE }}>
                Deferral Number:
              </span>
              <span
                style={{ marginLeft: 8, color: PRIMARY_BLUE, fontWeight: 500 }}
              >
                {selectedDeferral?.deferralNumber}
              </span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: SECONDARY_PURPLE }}>
                Customer:
              </span>
              <span
                style={{ marginLeft: 8, color: PRIMARY_BLUE, fontWeight: 500 }}
              >
                {selectedDeferral?.customerName}
              </span>
            </div>
            <div>
              <span style={{ fontWeight: 600, color: SECONDARY_PURPLE }}>
                DCL Number:
              </span>
              <span
                style={{ marginLeft: 8, color: PRIMARY_BLUE, fontWeight: 500 }}
              >
                {selectedDeferral?.dclNo || selectedDeferral?.dclNumber}
              </span>
            </div>
          </div>
          <Alert
            message="Once you approve, this deferral will be sent to the Checker for review. You will not be able to make changes until the Checker acts on it."
            type="warning"
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 12 }}
          />
          <div
            style={{
              padding: 12,
              backgroundColor: ACCENT_LIME + "15",
              border: `1px solid ${ACCENT_LIME}40`,
              borderRadius: 4,
            }}
          >
            <Text
              strong
              style={{ color: PRIMARY_BLUE, display: "block", marginBottom: 8 }}
            >
              Your Comment:
            </Text>
            <TextArea
              rows={3}
              placeholder="Enter your approval comment here..."
              value={creatorComment}
              onChange={(e) => setCreatorComment(e.target.value)}
              maxLength={500}
              showCount
            />
          </div>
        </div>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        title={`Reject Deferral Request: ${selectedDeferral?.deferralNumber}`}
        open={showRejectConfirm}
        onCancel={() => setShowRejectConfirm(false)}
        okText={'Yes, Reject'}
        okType={'danger'}
        okButtonProps={{ style: { background: ERROR_RED, borderColor: ERROR_RED, color: 'white' } }}
        cancelText={'Cancel'}
        confirmLoading={rejecting}
        onOk={doReject}
      >
        <div>
          <p>Are you sure you want to reject this deferral request?</p>
          <p><strong>{selectedDeferral?.deferralNumber}</strong> - {selectedDeferral?.customerName}</p>
          <p>Days Sought: <strong>{selectedDeferral?.daysSought}</strong> days</p>
          <p style={{ marginBottom: 6 }}>Please provide a reason for rejection (required):</p>
          <TextArea
            rows={4}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="Enter rejection reason..."
            required
          />
          {!rejectComment || rejectComment.trim() === '' ? (
            <p style={{ color: ERROR_RED, fontSize: 12, marginTop: 4 }}>
              Rejection reason is required
            </p>
          ) : null}
        </div>
      </Modal>

      {/* Return for Rework Confirmation Modal */}
      <Modal
        title={`Return for Rework: ${selectedDeferral?.deferralNumber}`}
        open={showReworkConfirm}
        onCancel={() => setShowReworkConfirm(false)}
        okText={'Yes, Return for Rework'}
        okType={'warning'}
        okButtonProps={{ style: { background: WARNING_ORANGE, borderColor: WARNING_ORANGE } }}
        cancelText={'Cancel'}
        confirmLoading={returnReworkLoading}
        onOk={doReturnForRework}
      >
        <div>
          <p>Are you sure you want to return this deferral for rework?</p>
          <p><strong>{selectedDeferral?.deferralNumber}</strong> - {selectedDeferral?.customerName}</p>
          <p>This will return the deferral back to the Relationship Manager for corrections.</p>
          <p style={{ marginBottom: 6 }}>Please provide rework instructions for the Relationship Manager (required):</p>
          <TextArea
            rows={4}
            value={reworkComment}
            onChange={(e) => setReworkComment(e.target.value)}
            placeholder="Enter rework instructions..."
            required
          />
          {!reworkComment || reworkComment.trim() === '' ? (
            <p style={{ color: WARNING_ORANGE, fontSize: 12, marginTop: 4 }}>
              Rework instructions are required
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default Deferrals;