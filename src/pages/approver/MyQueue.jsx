// Helper function to remove role from username in brackets
const formatUsername = (username) => {
  if (!username) return "System";
  return username.replace(/\s*\([^)]*\)\s*$/, '').trim();
};

const CommentTrail = ({ history, isLoading }) => {
  if (isLoading) return <Spin className="block m-5" />;
  if (!history || history.length === 0) return <i className="pl-4">No historical comments yet.</i>;

  // Helper to check if a message is system-generated
  const isSystemMessage = (text, name, role) => {
    const textLower = text.toLowerCase();
    const nameLower = name.toLowerCase();
    const roleLower = role?.toLowerCase() || '';
   
    return textLower.includes('submitted') ||
           textLower.includes('approved') ||
           textLower.includes('returned') ||
           textLower.includes('rejected') ||
           nameLower === 'system' ||
           roleLower === 'system' ||
           (textLower.includes('deferral') && textLower.includes('request'));
  };

  // Group comments by timestamp + user to merge them
  const groups = [];
  const groupMap = new Map(); // key: "timestamp|userName|role"

  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    const roleLabel = item.userRole || item.role;
    const name = item.user || 'System';
    const text = item.comment || item.notes || item.message || item.text || 'No comment provided.';
    const timestamp = item.date || item.createdAt || item.timestamp;
   
    // Round timestamp to nearest second to group very close events
    const timestampKey = timestamp ? new Date(timestamp).toISOString().split('.')[0] : 'no-time';
    const groupKey = `${timestampKey}|${name}|${roleLabel || 'unknown'}`;

    const isSystem = isSystemMessage(text, name, roleLabel);

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        name,
        roleLabel,
        systemMessages: [],
        userMessages: [],
        timestamp
      });
    }

    const group = groupMap.get(groupKey);
    if (isSystem) {
      group.systemMessages.push(text);
    } else {
      group.userMessages.push(text);
    }
  }

  // Convert groups to display format
  const processedComments = Array.from(groupMap.values()).map(group => ({
    name: formatUsername(group.name),
    roleLabel: group.roleLabel,
    systemText: group.systemMessages.join('; '),
    userText: group.userMessages.join('; '),
    timestamp: group.timestamp,
    merged: group.systemMessages.length > 0 && group.userMessages.length > 0
  }));

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
        dataSource={processedComments}
        itemLayout="horizontal"
        renderItem={(item, idx) => {
          return (
            <List.Item key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: PRIMARY_BLUE }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', minWidth: 0 }}>
                      <b style={{ fontSize: 14, color: PRIMARY_BLUE, display: 'inline-block', width: 120, minWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</b>
                      {item.roleLabel && getRoleTag(item.roleLabel)}
                    </div>
                    <span style={{ color: '#4a4a4a', display: 'block' }}>
                      {item.systemText}
                      {item.merged && (
                        <>
                          <span style={{ margin: '0 4px', color: '#999' }}>;</span>
                          <span>{item.userText}</span>
                        </>
                      )}
                      {!item.merged && item.userText && item.userText}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#777' }}>
                  {item.timestamp ? dayjs(item.timestamp).format('M/D/YY, h:mm A') : ''}
                </div>
              </div>
            </List.Item>
          );
        }}
      />
    </div>
  );
};


// export default MyQueue;

import { openFileInNewTab, downloadFile } from '../../utils/fileUtils';
import jsPDF from 'jspdf';

import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from 'react-redux';
import {
  Table,
  Tag,
  Card,
  Row,
  Col,
  Input,
  Button,
  Space,
  Select,
  DatePicker,
  Avatar,
  Spin,
  Empty,
  Typography,
  Modal,
  message,
  Badge,
  Divider,
  Descriptions,
  Upload,
  Form,
  Input as AntdInput,
  Progress,
  List,
  Popconfirm,
  Tabs
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
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  PaperClipOutlined,
  FileDoneOutlined,
  BankOutlined,
  MailOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import deferralApi from "../../service/deferralApi.js";
import getFacilityColumns from '../../utils/facilityColumns';
import { formatDeferralDocumentType } from "../../utils/deferralDocumentType";
import { getDeferralDocumentBuckets } from "../../utils/deferralDocuments";
import UniformTag from "../../components/common/UniformTag";
import ExtensionApplicationsTab from "../../components/ExtensionApplicationsTab";
import { useGetApproverExtensionsQuery } from "../../api/extensionApi";
import { useNavigate } from "react-router-dom";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text, Title } = Typography;
const { confirm } = Modal;
const { TextArea } = AntdInput;

// Theme colors
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";
const PROCESSING_BLUE = "#1890ff";

// Safe text rendering (coerce objects/arrays to readable strings)
const safeText = (v) => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map(i => (typeof i === 'string' ? i : (i?.name || i?.email || String(i)))).join(', ');
  if (typeof v === 'object') return v.name || v.email || v.role || String(v);
  return String(v);
};

const getFileIcon = (type) => {
  switch (type) {
    case 'pdf': return <FilePdfOutlined style={{ color: ERROR_RED }} />;
    case 'word': return <FileWordOutlined style={{ color: PRIMARY_BLUE }} />;
    case 'excel': return <FileExcelOutlined style={{ color: SUCCESS_GREEN }} />;
    case 'image': return <FileImageOutlined style={{ color: "#7e6496" }} />;
    default: return <FileTextOutlined />;
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

// Add comment modal removed from approver queue (comments should be added from RM/other workflows)


// Custom CSS for modal styling
const customStyles = `
  .ant-modal-header { background-color: ${PRIMARY_BLUE} !important; padding: 18px 24px !important; }
  .ant-modal-title { color: white !important; font-size: 1.15rem !important; font-weight: 700 !important; letter-spacing: 0.5px; }
  .ant-modal-close-x { color: white !important; }

  .deferral-info-card .ant-card-head { border-bottom: 2px solid ${ACCENT_LIME} !important; }
  .deferral-info-card .ant-descriptions-item-label { font-weight: 600 !important; color: #7e6496 !important; padding-bottom: 4px; }
  .deferral-info-card .ant-descriptions-item-content { color: ${PRIMARY_BLUE} !important; font-weight: 700 !important; font-size: 13px !important; }

  .ant-input, .ant-select-selector { border-radius: 6px !important; border-color: #e0e0e0 !important; }
  .ant-input:focus, .ant-select-focused .ant-select-selector { box-shadow: 0 0 0 2px rgba(22, 70, 121, 0.2) !important; border-color: ${PRIMARY_BLUE} !important; }

  .status-tag { font-weight: 700 !important; border-radius: 999px !important; padding: 3px 8px !important; text-transform: capitalize; min-width: 80px; text-align: center; display: inline-flex; align-items: center; gap: 4px; justify-content: center; }

  .ant-modal-footer .ant-btn { border-radius: 8px; font-weight: 600; height: 38px; padding: 0 16px; }
  .ant-modal-footer .ant-btn-primary { background-color: ${PRIMARY_BLUE} !important; border-color: ${PRIMARY_BLUE} !important; }
`;

// Deferral Details Modal for MyQueue - Shows status as pending
const DeferralDetailsModal = ({
  deferral,
  open,
  onClose,
  onAction,
  token,
  overrideApprovals = null,
  headerTag = null,
  overrideDaysSought = null,
  overrideNextDueDate = null,
  readOnly = false
}) => {
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Controlled approve confirmation modal state
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [returnReworkLoading, setReturnReworkLoading] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [reworkComment, setReworkComment] = useState("");
  const [showReworkConfirm, setShowReworkConfirm] = useState(false);

  const approverEmail = (
    deferral?.currentApprover?.email ||
    (deferral?.approverFlow && (deferral.approverFlow[0]?.email || deferral.approverFlow[0]?.user?.email)) ||
    (deferral?.approvers && (deferral.approvers[0]?.email || (typeof deferral.approvers[0] === 'string' && deferral.approvers[0].includes('@')))) ||
    null
  );

  // Send reminder logic moved to the centralized pending modal (`DeferralPending.jsx`) to avoid duplicate buttons across modals.

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending_approval':
      case 'deferral_requested':
        return {
          color: 'orange',
          icon: <ClockCircleOutlined />,
          label: 'Pending Review',
          description: 'Awaiting your approval',
          badgeColor: WARNING_ORANGE
        };
      case 'in_review':
        return {
          color: 'blue',
          icon: <ClockCircleOutlined />,
          label: 'In Review',
          description: 'Currently being reviewed',
          badgeColor: PROCESSING_BLUE
        };
      case 'approved':
      case 'deferral_approved':
        return {
          color: 'green',
          icon: <CheckCircleOutlined />,
          label: 'Approved',
          description: 'Deferral approved',
          badgeColor: SUCCESS_GREEN
        };
      case 'rejected':
      case 'deferral_rejected':
        return {
          color: 'red',
          icon: <CloseCircleOutlined />,
          label: 'Rejected',
          description: 'Deferral request was rejected',
          badgeColor: ERROR_RED
        };
      default:
        return {
          color: 'default',
          label: status,
          description: '',
          badgeColor: '#d9d9d9'
        };
    }
  };

  const statusConfig = getStatusConfig(deferral?.status);

  const handleAddComment = (deferralId, comment) => {
    const newComment = {
      action: 'Comment Added',
      user: 'You (Approver)',
      date: new Date().toISOString(),
      notes: 'Comment added by approver',
      comment: comment,
      userRole: 'Approver'
    };

    // Add to history
    if (onAction) {
      onAction('addComment', deferralId, newComment);
    }
  };

  // Handle posting comments
  const handlePostComment = async () => {
    if (!newComment.trim()) {
      message.error('Please enter a comment before posting');
      return;
    }

    if (!deferral || !deferral._id) {
      message.error('No deferral selected');
      return;
    }

    setPostingComment(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      const commentData = {
        text: newComment.trim(),
        author: {
          name: currentUser.name || currentUser.user?.name || 'User',
          role: currentUser.role || currentUser.user?.role || 'user'
        },
        createdAt: new Date().toISOString()
      };

      // Post comment to the backend
      await deferralApi.postComment(deferral._id, commentData, token);

      message.success('Comment posted successfully');

      // Clear the input
      setNewComment('');

      // Refresh the deferral to show the new comment
      const refreshedDeferral = await deferralApi.getDeferralById(deferral._id, token);

      // Notify parent to refresh queue
      if (onAction) onAction('refreshQueue');
    } catch (error) {
      console.error('Failed to post comment:', error);
      message.error(error.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const handleApprove = () => {
    // Show controlled approval modal
    setApprovalComment('');
    setShowApproveConfirm(true);
  };

  const doApprove = async () => {
    setApproveLoading(true);
    try {
      const updated = await deferralApi.approveDeferral(deferral._id || deferral.id, approvalComment, token);
      message.success('Deferral approved successfully');
      if (onAction) onAction('refreshQueue');
      if (onAction) onAction('gotoActioned');
      try { window.dispatchEvent(new CustomEvent('deferral:updated', { detail: updated })); } catch (e) { console.debug('Failed to dispatch deferral:updated', e); }
      setShowApproveConfirm(false);
      onClose();
    } catch (err) {
      message.error(err.message || 'Failed to approve');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = () => {
    setRejectComment('');
    setShowRejectConfirm(true);
  };

  const doReject = async () => {
    if (!rejectComment || rejectComment.trim() === '') {
      message.error('Please provide a rejection reason');
      return;
    }

    setRejecting(true);
    try {
      const updated = await deferralApi.rejectDeferral(
        deferral._id || deferral.id,
        { reason: rejectComment.trim() },
        token,
      );
      message.success('Deferral rejected');
      if (onAction) onAction('refreshQueue');
      // Navigate approver to their Actioned tab so this terminated item is visible in their action history
      if (onAction) onAction('gotoActioned');
      setShowRejectConfirm(false);
      onClose();
      try { window.dispatchEvent(new CustomEvent('deferral:updated', { detail: updated })); } catch (e) { console.debug('Failed to dispatch deferral:updated', e); }
    } catch (err) {
      message.error(err.message || 'Failed to reject');
    } finally {
      setRejecting(false);
    }
  };

  const handleReturnForRework = () => {
    setReworkComment('');
    setShowReworkConfirm(true);
  };

  const doReturnForRework = async () => {
    if (!reworkComment || reworkComment.trim() === '') {
      message.error('Please provide rework instructions');
      return;
    }

    setReturnReworkLoading(true);
    try {
      // Get current user info for permission check
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const currentUser = storedUser?.user || storedUser;

      // Log for debugging
      console.log('Current user:', currentUser);
      console.log('Deferral current approver:', deferral.currentApprover);

      // Get current user email from Redux token info or localStorage
      const currentUserEmail = currentUser?.email || currentUser?.userEmail || '';

      // Get current approver email from deferral
      const currentApproverEmail = deferral.currentApprover?.email ||
        (deferral.approvers?.find(a => a.isCurrent)?.email) ||
        (deferral.approverFlow && deferral.approverFlow.length > 0 ?
          (typeof deferral.approverFlow[0] === 'string' ? deferral.approverFlow[0] :
            deferral.approverFlow[0]?.email || deferral.approverFlow[0]?.user?.email) : '');

      // Check if user is the current approver
      if (currentApproverEmail && currentUserEmail) {
        const isCurrentApprover = currentApproverEmail.toLowerCase() === currentUserEmail.toLowerCase();
        if (!isCurrentApprover) {
          message.error(`You are not the current approver. Current approver is: ${currentApproverEmail}`);
          setReturnReworkLoading(false);
          return;
        }
      }

      // Call API with correct parameters
      const updatedDeferral = await deferralApi.returnForRework(
        deferral._id || deferral.id,
        {
          comment: reworkComment,
          reworkInstructions: reworkComment
        }
      );

      message.success('Deferral returned for rework. Relationship Manager has been notified.');

      // Notify parent component to refresh queue and update state
      if (onAction) onAction('returnForRework', deferral._id || deferral.id, updatedDeferral);

      // Dispatch custom event for queue update
      try {
        window.dispatchEvent(new CustomEvent('deferral:updated', { detail: updatedDeferral }));
      } catch (e) {
        console.debug('Failed to dispatch deferral:updated', e);
      }

      setShowReworkConfirm(false);
      onClose();
    } catch (err) {
      console.error('Return for rework error:', err);

      // Provide more specific error messages
      if (err.message.includes('current approver')) {
        message.error('You are not the current approver for this deferral. Please refresh the page to see the latest status.');
      } else if (err.message.includes('403')) {
        message.error('Permission denied. You may not have the required permissions to perform this action.');
      } else {
        message.error(err.message || 'Failed to return for rework');
      }
    } finally {
      setReturnReworkLoading(false);
    }
  };

  // Download deferral as PDF
  const [downloadLoading, setDownloadLoading] = useState(false);
  const downloadDeferralAsPDF = async () => {
    if (!deferral || !deferral._id) {
      message.error("No deferral selected");
      return;
    }

    setDownloadLoading(true);
    try {
      const doc = new jsPDF();

      const PRIMARY_BLUE_RGB = [22, 70, 121];
      const SECONDARY_PURPLE_RGB = [126, 100, 150];
      const SUCCESS_GREEN_RGB = [82, 196, 26];
      const WARNING_ORANGE_RGB = [250, 173, 20];
      const ERROR_RED_RGB = [255, 77, 79];
      const DARK_GRAY = [51, 51, 51];
      const LIGHT_GRAY = [102, 102, 102];

      let yPosition = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);

      const addCardSection = (title, items) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFillColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
        doc.rect(margin, yPosition, contentWidth, 10, 'F');

        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text(title, margin + 5, yPosition + 7);
        yPosition += 12;

        const itemHeight = 7;
        items.forEach((item, index) => {
          if (yPosition > 260) {
            doc.addPage();
            yPosition = 15;
          }

          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPosition - 2, contentWidth, itemHeight, 'F');
          }

          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(SECONDARY_PURPLE_RGB[0], SECONDARY_PURPLE_RGB[1], SECONDARY_PURPLE_RGB[2]);
          doc.text(item.label + ':', margin + 5, yPosition + 3);

          doc.setFont(undefined, 'bold');
          doc.setTextColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
          doc.text(String(item.value ?? 'N/A'), margin + 50, yPosition + 3, { maxWidth: contentWidth - 55 });

          yPosition += itemHeight;
        });

        yPosition += 4;
        return yPosition;
      };

      doc.setFillColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
      doc.rect(0, 0, pageWidth, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text(`Deferral Request: ${deferral.deferralNumber || 'N/A'}`, margin, 10);
      yPosition = 25;

      const customerItems = [
        { label: 'Customer Name', value: deferral.customerName || 'N/A' },
        { label: 'Customer Number', value: deferral.customerNumber || 'N/A' },
        { label: 'Loan Type', value: deferral.loanType || 'N/A' }
      ];
      yPosition = addCardSection('Customer Information', customerItems);

      const stats = getApproverStats();
      const deferralDetailsItems = [
        { label: 'Deferral Number', value: deferral.deferralNumber || 'N/A' },
        { label: 'DCL No', value: deferral.dclNo || deferral.dclNumber || 'N/A' },
        { label: 'Status', value: deferral.status || 'Pending' },
        { label: 'Creator Status', value: deferral.creatorApprovalStatus || 'Pending' },
        { label: 'Creator Date', value: deferral.creatorApprovalDate ? dayjs(deferral.creatorApprovalDate).format('DD/MM/YY') : 'N/A' },
        { label: 'Checker Status', value: deferral.checkerApprovalStatus || 'Pending' },
        { label: 'Checker Date', value: deferral.checkerApprovalDate ? dayjs(deferral.checkerApprovalDate).format('DD/MM/YY') : 'N/A' },
        { label: 'Approvers Status', value: `${stats.approved} of ${stats.total} Approved` },
        { label: 'Created At', value: dayjs(deferral.createdAt).format('DD MMM YYYY HH:mm') }
      ];
      yPosition = addCardSection('Deferral Details', deferralDetailsItems);

      const loanAmount = Number(deferral.loanAmount || 0);
      const formattedLoanAmount = loanAmount ? `KSh ${loanAmount.toLocaleString()}` : 'Not specified';
      const isUnder75M = loanAmount > 0 && loanAmount < 75000000;
      const loanItems = [
        { label: 'Loan Amount', value: formattedLoanAmount + (isUnder75M ? ' (Under 75M)' : ' (Above 75M)') },
        { label: 'Days Sought', value: `${deferral.daysSought || 0} days` },
        { label: 'Deferral Due Date', value: deferral.nextDueDate || deferral.nextDocumentDueDate ? dayjs(deferral.nextDueDate || deferral.nextDocumentDueDate).format('DD MMM YYYY') : 'Not calculated' },
        { label: 'SLA Expiry', value: deferral.slaExpiry ? dayjs(deferral.slaExpiry).format('DD MMM YYYY') : 'Not set' }
      ];
      yPosition = addCardSection('Loan Information', loanItems);

      if (deferral.facilities && deferral.facilities.length > 0) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFillColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
        doc.rect(margin, yPosition, contentWidth, 10, 'F');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text('Facilities', margin + 5, yPosition + 7);
        yPosition += 12;

        doc.setFillColor(240, 248, 255);
        doc.rect(margin, yPosition, contentWidth, 8, 'F');
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
        doc.text('Type', margin + 5, yPosition + 5);
        doc.text('Sanctioned', margin + 70, yPosition + 5);
        doc.text('Outstanding', margin + 115, yPosition + 5);
        doc.text('Headroom', margin + 160, yPosition + 5);
        yPosition += 10;

        deferral.facilities.forEach((facility, index) => {
          if (yPosition > 260) {
            doc.addPage();
            yPosition = 15;
          }

          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPosition - 2, contentWidth, 8, 'F');
          }

          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
          const facilityType = facility.type || facility.facilityType || 'N/A';
          doc.text(facilityType, margin + 5, yPosition + 3);
          doc.text(String(facility.sanctionedAmount || '0'), margin + 70, yPosition + 3);
          doc.text(String(facility.outstandingAmount || '0'), margin + 115, yPosition + 3);
          doc.text(String(facility.headroom || '0'), margin + 160, yPosition + 3);
          yPosition += 8;
        });

        yPosition += 4;
      }

      if (deferral.dferralDescription || deferral.deferralDescription || deferral.description) {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 15;
        }

        const descText = deferral.dferralDescription || deferral.deferralDescription || deferral.description || '';
        const descriptionItems = [{ label: 'Description', value: descText }];
        yPosition = addCardSection('Deferral Description', descriptionItems);
      }

      if (deferral.approverFlow && deferral.approverFlow.length > 0) {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFillColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
        doc.rect(margin, yPosition, contentWidth, 10, 'F');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text('Approval Flow', margin + 5, yPosition + 7);
        yPosition += 12;

        deferral.approverFlow.forEach((approver, index) => {
          if (yPosition > 260) {
            doc.addPage();
            yPosition = 15;
          }

          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPosition - 2, contentWidth, 12, 'F');
          }

          const approverName = approver.name || approver.user?.name || approver.email || `Approver ${index + 1}`;
          const status = approver.approved ? 'Approved' : approver.rejected ? 'Rejected' : approver.returned ? 'Returned' : 'Pending';
          const date = approver.approvedDate || approver.rejectedDate || approver.returnedDate || '';
          const statusColor = status === 'Approved' ? SUCCESS_GREEN_RGB : status === 'Rejected' ? ERROR_RED_RGB : WARNING_ORANGE_RGB;

          doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
          doc.circle(margin + 5, yPosition + 3, 3.5, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont(undefined, 'bold');
          doc.text(String(index + 1), margin + 2.5, yPosition + 4);

          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
          doc.text(approverName, margin + 15, yPosition + 3);

          doc.setFont(undefined, 'normal');
          doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
          doc.text(status, margin + 100, yPosition + 3);

          if (date) {
            doc.setTextColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
            doc.setFontSize(8);
            doc.text(dayjs(date).format('DD MMM YYYY HH:mm'), margin + 135, yPosition + 3);
          }

          yPosition += 12;
        });

        yPosition += 4;
      }

      if (deferral.documents && deferral.documents.length > 0) {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFillColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
        doc.rect(margin, yPosition, contentWidth, 10, 'F');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text('Attached Documents', margin + 5, yPosition + 7);
        yPosition += 12;

        deferral.documents.forEach((doc_item, index) => {
          if (yPosition > 260) {
            doc.addPage();
            yPosition = 15;
          }

          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPosition - 2, contentWidth, 10, 'F');
          }

          const docName = doc_item.name || `Document ${index + 1}`;
          const fileExt = docName.split('.').pop().toLowerCase();
          const fileColor = fileExt === 'pdf' ? ERROR_RED_RGB : fileExt === 'xlsx' || fileExt === 'xls' ? SUCCESS_GREEN_RGB : PRIMARY_BLUE_RGB;

          doc.setFillColor(fileColor[0], fileColor[1], fileColor[2]);
          doc.circle(margin + 5, yPosition + 3, 2.5, 'F');

          doc.setFontSize(9);
          doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
          doc.setFont(undefined, 'normal');
          doc.text(docName, margin + 12, yPosition + 3, { maxWidth: contentWidth - 50 });

          if (doc_item.fileSize) {
            doc.setFontSize(8);
            doc.setTextColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
            doc.text(`(${(doc_item.fileSize / 1024).toFixed(2)} KB)`, margin + 155, yPosition + 3);
          }

          yPosition += 10;
        });

        yPosition += 4;
      }

      if (deferral.comments && deferral.comments.length > 0) {
        if (yPosition > 230) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFillColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
        doc.rect(margin, yPosition, contentWidth, 10, 'F');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text('Comment Trail', margin + 5, yPosition + 7);
        yPosition += 12;

        deferral.comments.forEach((comment, index) => {
          const authorName = comment.author?.name || comment.authorName || 'User';
          const authorRole = comment.author?.role || comment.role || 'N/A';
          const commentText = comment.text || comment.comment || '';
          const commentDate = comment.createdAt ? dayjs(comment.createdAt).format('DD MMM YYYY HH:mm') : '';

          const commentLines = doc.splitTextToSize(commentText, contentWidth - 25);
          const commentBoxHeight = commentLines.length * 6 + 18;

          if (yPosition + commentBoxHeight > 270) {
            doc.addPage();
            yPosition = 15;
          }

          if (index % 2 === 0) {
            doc.setFillColor(250, 252, 255);
            doc.rect(margin, yPosition - 2, contentWidth, commentBoxHeight, 'F');
          }

          doc.setFillColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
          doc.circle(margin + 5, yPosition + 3, 3, 'F');

          const initials = authorName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(6);
          doc.setFont(undefined, 'bold');
          doc.text(initials, margin + 3.5, yPosition + 4);

          doc.setFontSize(9);
          doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
          doc.setFont(undefined, 'bold');
          doc.text(authorName, margin + 12, yPosition + 3);

          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.setFont(undefined, 'normal');
          doc.text(`(${authorRole})`, margin + 50, yPosition + 3);
          doc.text(commentDate, margin + 130, yPosition + 3);

          yPosition += 8;
          doc.setFontSize(9);
          doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
          doc.setFont(undefined, 'normal');
          commentLines.forEach((line) => {
            doc.text(line, margin + 12, yPosition + 4);
            yPosition += 6;
          });

          yPosition += 4;
        });
      }

      doc.save(`deferral_${deferral.deferralNumber || "report"}.pdf`);
      message.success("Deferral downloaded as PDF successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      message.error("Failed to generate PDF");
    } finally {
      setDownloadLoading(false);
    }
  };

  if (!deferral) return null;

  const status = deferral.status || 'deferral_requested';
  const normalizedStatus = String(status || '').toLowerCase();
  const isReturnedForRework = ['returned_for_rework', 'returned_by_creator', 'returned_by_checker'].includes(normalizedStatus);
  const loanAmountValue = Number(deferral.loanAmount || deferral.amount || deferral.loan_amount || 0);
  const formattedLoanAmount = loanAmountValue ? `${(loanAmountValue / 1000000).toFixed(0)} M` : 'Not specified';
  const isUnder75 = loanAmountValue > 0 && loanAmountValue < 75000000;
  const getApproverStats = () => {
    const approvers = Array.isArray(deferral.approverFlow) && deferral.approverFlow.length > 0
      ? deferral.approverFlow
      : (Array.isArray(deferral.approvers) ? deferral.approvers : []);

    const total = approvers.length;
    const approved = approvers.filter((a, index) => {
      const currentIndex = deferral.currentApproverIndex || 0;
      return a?.approved === true || !!a?.approvedAt || !!a?.approvalDate || index < currentIndex;
    }).length;

    return {
      total,
      approved,
      pending: Math.max(total - approved, 0),
    };
  };

  // Build a consolidated history: initial request, stored history entries, and approval events
  const history = (function renderHistory() {
    const events = [];
    // Extract requester name with multiple fallbacks, including from comments array
    const requester = deferral.requestor?.name ||
                      deferral.requestedBy?.name ||
                      deferral.requestedBy?.fullName ||
                      deferral.requestedBy ||
                      deferral.rmName ||
                      deferral.rmRequestedBy?.name ||
                      deferral.createdBy?.name ||
                      deferral.createdByName ||
                      deferral.createdByUser?.name ||
                      deferral.submittedBy?.name ||
                      deferral.submittedByName ||
                      deferral.user?.name ||
                      deferral.userName ||
                      deferral.name ||
                      (deferral.comments?.[0]?.author?.name) ||
                      (deferral.comments?.[0]?.authorName) ||
                      'RM';
    const requesterRole = deferral.requestor?.role || deferral.requestedBy?.role || 'RM';
    const requestDate = deferral.requestedDate || deferral.createdAt || deferral.requestedAt;

    if (deferral.comments && Array.isArray(deferral.comments) && deferral.comments.length > 0) {
      deferral.comments.forEach(c => {
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

    if (deferral.history && Array.isArray(deferral.history) && deferral.history.length > 0) {
      deferral.history.forEach((h) => {
        if (h.action === 'moved') return;
       
        // Extract user name - prioritize userName field which comes from backend req.user.name
        let userName = h.userName || h.user?.name || h.user || 'System';
       
        const userRole = h.userRole || h.user?.role || h.role || 'System';
        events.push({
          user: userName,
          userRole: userRole,
          date: h.date || h.createdAt || h.timestamp || h.entryDate,
          comment: h.comment || h.notes || h.message || ''
        });
      });
    }

    const sorted = events.sort((a, b) => (new Date(a.date || 0)) - (new Date(b.date || 0)));
    return sorted;
  })();

  const getReturnedForReworkReason = () => {
    const directReason =
      deferral.returnReason ||
      deferral.reworkReason ||
      deferral.reworkComment;

    if (typeof directReason === 'string' && directReason.trim()) {
      return directReason.trim();
    }

    const rawReworkComments = deferral.reworkComments;
    if (typeof rawReworkComments === 'string' && rawReworkComments.trim()) {
      try {
        const parsed = JSON.parse(rawReworkComments);
        if (parsed && typeof parsed.reworkComment === 'string' && parsed.reworkComment.trim()) {
          return parsed.reworkComment.trim();
        }
      } catch {
        return rawReworkComments.trim();
      }
    }

    if (rawReworkComments && typeof rawReworkComments === 'object') {
      const objectReason = rawReworkComments.reworkComment;
      if (typeof objectReason === 'string' && objectReason.trim()) {
        return objectReason.trim();
      }
    }

    if (Array.isArray(deferral.comments) && deferral.comments.length > 0) {
      const rolePriority = ['creator', 'cocreator', 'co_creator', 'checker', 'cochecker', 'co_checker'];
      const normalizedRole = (value) => String(value || '').trim().toLowerCase();
      const hasPreferredRole = (role) => rolePriority.includes(normalizedRole(role));

      const preferredComment = [...deferral.comments]
        .reverse()
        .find((comment) => {
          const role = comment?.author?.role || comment?.authorRole || comment?.role;
          const text = comment?.text || comment?.comment;
          return hasPreferredRole(role) && typeof text === 'string' && text.trim();
        });

      if (preferredComment) {
        return (preferredComment.text || preferredComment.comment || '').trim();
      }

      const latestComment = [...deferral.comments]
        .reverse()
        .find((comment) => {
          const text = comment?.text || comment?.comment;
          return typeof text === 'string' && text.trim();
        });

      if (latestComment) {
        return (latestComment.text || latestComment.comment || '').trim();
      }
    }

    return '';
  };

  const returnedForReworkReason = getReturnedForReworkReason();

  // Create attachments array from your data structure
  const attachments = deferral.attachments || [
    {
      id: "att1",
      name: `${deferral.document}.pdf`,
      size: "1.5 MB",
      type: "pdf",
      uploadDate: deferral.requestedDate
    }
  ];

  const { dclDocs, uploadedDocs, requestedDocs } = getDeferralDocumentBuckets(deferral);

  const stats = getApproverStats();
  const daysSoughtValue = typeof overrideDaysSought === 'number'
    ? overrideDaysSought
    : (deferral.daysSought || 0);
  const nextDueDateValue = overrideNextDueDate || deferral.nextDueDate;

  return (
    <>
      <style>{customStyles}</style>
      <Modal
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BankOutlined /> <span>{headerTag ? `${headerTag}: ${deferral.deferralNumber}` : `Deferral Request: ${deferral.deferralNumber}`}</span></div>}
        open={open}
        onCancel={onClose}
        width={950}
        styles={{ body: { padding: "0 24px 24px" } }}
        footer={[
          <Button
            key="download"
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={downloadDeferralAsPDF}
            loading={downloadLoading}
            style={{ marginRight: 'auto', backgroundColor: '#164679', borderColor: '#164679' }}
          >
            Download as PDF
          </Button>,
          !readOnly && (
            <Button
              key="rework"
              type="primary"
              onClick={handleReturnForRework}
              loading={returnReworkLoading}
              disabled={returnReworkLoading}
              style={{
                backgroundColor: '#164679',
                borderColor: '#164679',
                fontWeight: 600
              }}
            >
              Return for Rework
            </Button>
          ),
          !readOnly && (deferral.status === "pending_approval" || deferral.status === "in_review" || deferral.status === "deferral_requested") ? (
            <Button
              key="reject"
              type="primary"
              icon={<CloseOutlined />}
              onClick={handleReject}
              loading={rejecting}
              disabled={rejecting}
              style={{ backgroundColor: '#164679', borderColor: '#164679' }}
            >
              Reject
            </Button>
          ) : null,
          !readOnly && (deferral.status === "pending_approval" || deferral.status === "in_review" || deferral.status === "deferral_requested") ? (
            <Button
              key="approve"
              type="primary"
              style={{ backgroundColor: '#164679', borderColor: '#164679' }}
              icon={<CheckOutlined />}
              onClick={handleApprove}
              loading={approveLoading}
              disabled={approveLoading}
            >
              Approve
            </Button>
          ) : null
        ].filter(Boolean)}
      >
        {deferral && (
          <>
            {isReturnedForRework && returnedForReworkReason && (
              <div
                style={{
                  backgroundColor: `${WARNING_ORANGE}15`,
                  borderColor: `${WARNING_ORANGE}40`,
                  border: '1px solid',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 18,
                  marginTop: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <WarningOutlined style={{ color: WARNING_ORANGE, fontSize: 22 }} />
                  <div>
                    <div style={{ margin: 0, color: WARNING_ORANGE, fontWeight: 700 }}>Returned for Rework</div>
                    <div style={{ marginTop: 2, color: '#666', fontSize: 13 }}>
                      Reason shared with RM: {returnedForReworkReason}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Card className="deferral-info-card" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Customer Information</span>} style={{ marginBottom: 18, marginTop: 24 }}>
              <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="Customer Name"><Text strong style={{ color: PRIMARY_BLUE }}>{deferral.customerName}</Text></Descriptions.Item>
                <Descriptions.Item label="Customer Number"><Text strong style={{ color: PRIMARY_BLUE }}>{deferral.customerNumber}</Text></Descriptions.Item>
                <Descriptions.Item label="Loan Type"><Text strong style={{ color: PRIMARY_BLUE }}>{deferral.loanType}</Text></Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="deferral-info-card" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Deferral Details</span>} style={{ marginBottom: 18 }}>
              <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="Deferral Number">
                  <Text strong style={{ color: PRIMARY_BLUE }}>
                    {deferral.deferralNumber}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="DCL No"><Text strong style={{ color: PRIMARY_BLUE }}>{deferral.dclNo || deferral.dclNumber}</Text></Descriptions.Item>
                <Descriptions.Item label="Status">
                  {status === 'deferral_requested' || status === 'pending_approval' ? (
                    <UniformTag color="processing" text="Pending" />
                  ) : status === 'deferral_approved' || status === 'approved' ? (
                    <UniformTag color="success" text="Approved" />
                  ) : status === 'deferral_rejected' || status === 'rejected' ? (
                    <UniformTag color="error" text="Rejected" />
                  ) : (
                    <div style={{ fontWeight: 500 }}>{status}</div>
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="Creator Status">
                  <UniformTag
                    color={deferral.creatorApprovalStatus === 'approved' ? 'success' : deferral.creatorApprovalStatus === 'rejected' ? 'error' : 'processing'}
                    text={deferral.creatorApprovalStatus === 'approved' ? 'Approved' : deferral.creatorApprovalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                  />
                </Descriptions.Item>

                <Descriptions.Item label="Checker Status">
                  <UniformTag
                    color={deferral.checkerApprovalStatus === 'approved' ? 'success' : deferral.checkerApprovalStatus === 'rejected' ? 'error' : 'processing'}
                    text={deferral.checkerApprovalStatus === 'approved' ? 'Approved' : deferral.checkerApprovalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                  />
                </Descriptions.Item>

                <Descriptions.Item label="Approvers Status">
                  {stats.total === 0 ? (
                    <UniformTag color="processing" text="No approvers" maxChars={12} />
                  ) : stats.approved === stats.total ? (
                    <UniformTag color="success" icon={<CheckCircleOutlined />} text="All Approved" maxChars={12} />
                  ) : (
                    <UniformTag color="processing" text={`${stats.approved} of ${stats.total} Approved`} maxChars={14} />
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="Loan Amount">
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12 }}>
                    {(function () {
                      const loanAmountCandidates = [deferral.loanAmount, deferral.requestedAmount, deferral.amount];
                      const facilitiesTotal = (Array.isArray(deferral.facilities) ? deferral.facilities : []).reduce((sum, facility) => {
                        const value = Number(facility?.sanctioned ?? facility?.amount ?? 0);
                        return sum + (Number.isFinite(value) ? value : 0);
                      }, 0);
                      const amt = Number(loanAmountCandidates.find((candidate) => Number(candidate || 0) > 0) || facilitiesTotal || 0);
                      if (!amt) return 'Not specified';
                      const isAbove75 = amt > 75 && amt <= 1000 ? true : (amt > 75000000 ? true : false);
                      return <span style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>{isAbove75 ? 'Above 75 million' : 'Under 75 million'}</span>;
                    })()}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Days Sought">
                  <div style={{ fontWeight: "bold", color: daysSoughtValue > 45 ? ERROR_RED : daysSoughtValue > 30 ? WARNING_ORANGE : PRIMARY_BLUE, fontSize: 14 }}>
                    {daysSoughtValue} days
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Deferral Due Date">
                  {(() => {
                    const fallbackDueDate =
                      deferral.createdAt && Number(deferral.daysSought || 0) > 0
                        ? dayjs(deferral.createdAt).add(Number(deferral.daysSought || 0), 'day').toISOString()
                        : null;
                    const finalDueDate = nextDueDateValue || fallbackDueDate;
                    return (
                      <div style={{ color: PRIMARY_BLUE }}>
                        {finalDueDate ? `${dayjs(finalDueDate).format('DD MMM YYYY')}` : 'Not calculated'}
                      </div>
                    );
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="Created At"><div><Text strong style={{ color: PRIMARY_BLUE }}>{dayjs(deferral.createdAt || deferral.requestedDate).format('DD MMM YYYY')}</Text><Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>{dayjs(deferral.createdAt || deferral.requestedDate).format('HH:mm')}</Text></div></Descriptions.Item>
              </Descriptions>
            </Card>

            {requestedDocs.length > 0 ? (
              <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}>Document(s) to be deferred ({requestedDocs.length})</span>} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {requestedDocs.map((doc, idx) => {
                    const isUploaded = uploadedDocs.some(u => (u.name || '').toLowerCase().includes((doc.name || '').toLowerCase()));
                    const uploadedVersion = uploadedDocs.find(u => (u.name || '').toLowerCase().includes((doc.name || '').toLowerCase()));
                    return (
                    <div key={doc.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: isUploaded ? '#f6ffed' : '#fff7e6', borderRadius: 6, border: isUploaded ? '1px solid #b7eb8f' : '1px solid #ffd591' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FileDoneOutlined style={{ color: isUploaded ? SUCCESS_GREEN : WARNING_ORANGE, fontSize: 16 }} />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {doc.name}
                            <UniformTag color={isUploaded ? 'green' : 'orange'} text={isUploaded ? 'Uploaded' : 'Requested'} />
                          </div>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}><b>Type:</b> {formatDeferralDocumentType(doc)}</div>
                          {uploadedVersion && (<div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Uploaded as: {uploadedVersion.name} {uploadedVersion.uploadDate ? `• ${dayjs(uploadedVersion.uploadDate).format('DD MMM YYYY HH:mm')}` : ''}</div>)}
                        </div>
                      </div>
                      <Space>
                        {isUploaded && uploadedVersion && uploadedVersion.url && (<><Button type="text" icon={<EyeOutlined />} onClick={() => openFileInNewTab(uploadedVersion.url)} size="small">View</Button><Button type="text" icon={<DownloadOutlined />} onClick={() => { downloadFile(uploadedVersion.url, uploadedVersion.name); message.success(`Downloading ${uploadedVersion.name}...`); }} size="small">Download</Button></>)}
                      </Space>
                    </div>
                  )})}
                </div>
              </Card>
            ) : null}

            {deferral.deferralDescription && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0', marginBottom: 18 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Deferral Description</Text>
                <div style={{ padding: 12, backgroundColor: '#f8f9fa', borderRadius: 6, border: '1px solid #e8e8e8' }}>
                  <Text>{deferral.deferralDescription}</Text>
                </div>
              </div>
            )}

            {deferral.facilities && deferral.facilities.length > 0 && (
              <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}>Facility Details ({deferral.facilities.length})</span>} style={{ marginBottom: 18, marginTop: 12 }}>
                <Table dataSource={deferral.facilities} columns={getFacilityColumns()} pagination={false} size="small" rowKey={(r) => r.facilityNumber || r._id || `facility-${Math.random().toString(36).slice(2)}`} scroll={{ x: 600 }} />
              </Card>
            )}

            <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}>Mandatory: DCL Upload {dclDocs.length > 0 ? '✓' : ''}</span>} style={{ marginBottom: 18 }}>
              {dclDocs.length > 0 ? (
                <>
                  <List
                    size="small"
                    dataSource={dclDocs}
                    renderItem={(doc) => (
                      <List.Item
                        actions={[
                          doc.url ? <Button key="view" type="link" onClick={() => openFileInNewTab(doc.url)} size="small">View</Button> : null,
                          doc.url ? <Button key="download" type="link" onClick={() => { downloadFile(doc.url, doc.name); message.success(`Downloading ${doc.name}...`); }} size="small">Download</Button> : null,
                        ].filter(Boolean)}
                      >
                        <List.Item.Meta
                          avatar={getFileIcon(doc.type)}
                          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 500 }}>{doc.name}</span><Tag color="blue" style={{ fontSize: 10, padding: '0 6px' }}>DCL Document</Tag></div>}
                          description={<div style={{ fontSize: 12, color: '#666' }}>{doc.size && (<span>{doc.size > 1024 ? `${(doc.size / 1024).toFixed(2)} MB` : `${doc.size} KB`}</span>)} {doc.uploadDate && (<span style={{ marginLeft: 8 }}>Uploaded: {dayjs(doc.uploadDate).format('DD MMM YYYY HH:mm')}</span>)} {!doc.url && <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 12 }}>Preview not available</div>}</div>}
                        />
                      </List.Item>
                    )}
                  />

                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 12, color: WARNING_ORANGE }}><UploadOutlined style={{ fontSize: 18, marginBottom: 6, color: WARNING_ORANGE }} /><div>No DCL document uploaded</div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>DCL document is required for submission</Text></div>
              )}
            </Card>

            <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}><PaperClipOutlined style={{ marginRight: 8 }} /> Additional Documents ({uploadedDocs.length})</span>} style={{ marginBottom: 18 }}>
              {uploadedDocs.length > 0 ? (
                <>
                  <List
                    size="small"
                    dataSource={uploadedDocs}
                    renderItem={(doc) => (
                      <List.Item
                        actions={[
                          doc.url ? <Button key="view" type="link" onClick={() => openFileInNewTab(doc.url)} size="small">View</Button> : null,
                          doc.url ? <Button key="download" type="link" onClick={() => { downloadFile(doc.url, doc.name); message.success(`Downloading ${doc.name}...`); }} size="small">Download</Button> : null,
                        ].filter(Boolean)}
                      >
                        <List.Item.Meta
                          avatar={getFileIcon(doc.type)}
                          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 500 }}>{doc.name}</span>{doc.isAdditional && <Tag color="blue" style={{ fontSize: 10 }}>Additional</Tag>}</div>}
                          description={<div style={{ fontSize: 12, color: '#666' }}>{doc.size && (<span>{doc.size > 1024 ? `${(doc.size / 1024).toFixed(2)} MB` : `${doc.size} KB`}</span>)} {doc.uploadDate && (<span style={{ marginLeft: 8 }}>Uploaded: {dayjs(doc.uploadDate).format('DD MMM YYYY HH:mm')}</span>)} {!doc.url && <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 12 }}>Preview not available</div>}</div>}
                        />
                      </List.Item>
                    )}
                  />
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 12, color: '#999' }}><PaperClipOutlined style={{ fontSize: 18, marginBottom: 6, color: '#d9d9d9' }} /><div>No additional documents uploaded</div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>You can upload additional supporting documents if needed</Text></div>
              )}
            </Card>

            <Card
              size="small"
              title={<span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>Approval Flow</span>}
              style={{ marginBottom: 18, opacity: deferral.status === 'rejected' ? 0.6 : 1 }}
            >
              {deferral.status === 'rejected' && (
                <div style={{
                  marginBottom: 16,
                  padding: 12,
                  backgroundColor: '#fff1f0',
                  border: `1px solid ${ERROR_RED}40`,
                  borderRadius: 6,
                  textAlign: 'center'
                }}>
                  <ExclamationCircleOutlined style={{ color: ERROR_RED, marginRight: 8 }} />
                  <Text strong style={{ color: ERROR_RED }}>
                    This deferral has been rejected and cannot be further processed
                  </Text>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: deferral.status === 'rejected' ? 'none' : 'auto' }}>
                {(function () {
                  const approvers = [];
                  let hasApprovers = false;

                  const approvalsToUse = overrideApprovals ? overrideApprovals.approvers : null;

                  if (approvalsToUse && Array.isArray(approvalsToUse)) {
                    hasApprovers = true;
                    approvalsToUse.forEach((approver, index) => {
                      const isApproved = approver.approved === true || approver.approved === 'true' || approver.approvalStatus === 'approved';
                      const isRejected = approver.rejected === true || approver.rejected === 'true' || approver.approvalStatus === 'rejected';
                      const isReturned = approver.returned === true || approver.returned === 'true' || approver.approvalStatus === 'returned_for_rework';
                      const isCurrent = !isApproved && !isRejected && !isReturned && (index === 0 || deferral.currentApprover === approver || deferral.currentApprover?._id === approver?._id);

                      approvers.push({
                        ...approver,
                        index,
                        isApproved,
                        isRejected,
                        isReturned,
                        isCurrent,
                        approvalDate: approver.approvedAt || approver.approvedDate || approver.date,
                        rejectionDate: approver.rejectedAt || approver.rejectedDate || approver.date,
                        returnDate: approver.returnedAt || approver.returnedDate || approver.date,
                        comment: approver.comment || ''
                      });
                    });
                  } else if (deferral.approverFlow && Array.isArray(deferral.approverFlow)) {
                    hasApprovers = true;
                    deferral.approverFlow.forEach((approver, index) => {
                      const isApproved = approver.approved === true || approver.approved === 'true';
                      const isRejected = approver.rejected === true || approver.rejected === 'true';
                      const isReturned = approver.returned === true || approver.returned === 'true';
                      const isCurrent = !isApproved && !isRejected && !isReturned && (index === deferral.currentApproverIndex || deferral.currentApprover === approver || deferral.currentApprover?._id === approver?._id);

                      approvers.push({
                        ...approver,
                        index,
                        isApproved,
                        isRejected,
                        isReturned,
                        isCurrent,
                        approvalDate: approver.approvedAt || approver.approvedDate || approver.date,
                        rejectionDate: approver.rejectedAt || approver.rejectedDate || approver.date,
                        returnDate: approver.returnedAt || approver.returnedDate || approver.date,
                        comment: approver.comment || ''
                      });
                    });
                  } else if (deferral.approvers && Array.isArray(deferral.approvers)) {
                    hasApprovers = true;
                    deferral.approvers.forEach((approver, index) => {
                      const isApproved = approver.approved === true || approver.approved === 'true';
                      const isRejected = approver.rejected === true || approver.rejected === 'true';
                      const isReturned = approver.returned === true || approver.returned === 'true';
                      const isCurrent = !isApproved && !isRejected && !isReturned && (index === deferral.currentApproverIndex || deferral.currentApprover === approver || deferral.currentApprover?._id === approver?._id);

                      approvers.push({
                        ...approver,
                        index,
                        isApproved,
                        isRejected,
                        isReturned,
                        isCurrent,
                        approvalDate: approver.approvedAt || approver.approvedDate || approver.date,
                        rejectionDate: approver.rejectedAt || approver.rejectedDate || approver.date,
                        returnDate: approver.returnedAt || approver.returnedDate || approver.date,
                        comment: approver.comment || ''
                      });
                    });
                  }

                  if (!hasApprovers) {
                    return (
                      <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                        <UserOutlined style={{ fontSize: 32, marginBottom: 12, color: '#d9d9d9' }} />
                        <div>No approvers specified</div>
                      </div>
                    );
                  }

                  return approvers.map((approver, index) => {
                    const approverName = typeof approver === 'object'
                      ? (approver.name || approver.user?.name || approver.userId?.name || approver.email || approver.role || String(approver))
                      : (typeof approver === 'string' && approver.includes('@') ? approver.split('@')[0] : approver);

                    return (
                      <div key={index} style={{
                        padding: '14px 16px',
                        backgroundColor: approver.isApproved ? '#f6ffed' : approver.isRejected ? `${ERROR_RED}10` : approver.isReturned ? `${WARNING_ORANGE}10` : approver.isCurrent ? '#e6f7ff' : '#fafafa',
                        borderRadius: 8,
                        border: approver.isApproved ? `2px solid ${SUCCESS_GREEN}` : approver.isRejected ? `2px solid ${ERROR_RED}` : approver.isReturned ? `2px solid ${WARNING_ORANGE}` : approver.isCurrent ? `2px solid ${PRIMARY_BLUE}` : '1px solid #e8e8e8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14
                      }}>
                        <Badge count={index + 1} style={{
                          backgroundColor: approver.isApproved ? SUCCESS_GREEN : approver.isRejected ? ERROR_RED : approver.isReturned ? WARNING_ORANGE : approver.isCurrent ? PRIMARY_BLUE : '#bfbfbf',
                          fontSize: 13,
                          height: 30,
                          minWidth: 30,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          borderRadius: '50%'
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Text strong style={{ fontSize: 14, color: '#262626' }}>
                              {approver.role || 'Approver'}
                            </Text>
                            {approver.isApproved && (
                              <UniformTag icon={<CheckCircleOutlined />} color="success" text="Approved" />
                            )}
                            {approver.isRejected && (
                              <UniformTag icon={<CloseCircleOutlined />} color="error" text="Rejected" />
                            )}
                            {approver.isReturned && (
                              <UniformTag icon={<ExclamationCircleOutlined />} color="warning" text="Returned" />
                            )}
                            {approver.isCurrent && !approver.isApproved && !approver.isRejected && !approver.isReturned && (
                              <UniformTag color="processing" text="Current" />
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar
                              size={24}
                              icon={<UserOutlined />}
                              style={{
                                backgroundColor: approver.isApproved ? SUCCESS_GREEN : approver.isCurrent ? PRIMARY_BLUE : '#8c8c8c'
                              }}
                            />
                            <Text style={{ fontSize: 14, color: '#595959' }}>
                              {approverName}
                            </Text>
                          </div>

                          {approver.isRejected && approver.rejectionDate && (
                            <div style={{ fontSize: 12, color: ERROR_RED, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CloseCircleOutlined style={{ fontSize: 11 }} />
                              Rejected: {dayjs(approver.rejectionDate).format('DD MMM YYYY HH:mm')}
                            </div>
                          )}

                          {approver.isReturned && approver.returnDate && (
                            <div style={{ fontSize: 12, color: WARNING_ORANGE, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ExclamationCircleOutlined style={{ fontSize: 11 }} />
                              Returned: {dayjs(approver.returnDate).format('DD MMM YYYY HH:mm')}
                            </div>
                          )}

                          {approver.isCurrent && !approver.isApproved && !approver.isRejected && !approver.isReturned && deferral.status !== 'rejected' && (
                            <div style={{ fontSize: 12, color: PRIMARY_BLUE, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              Pending Approval
                            </div>
                          )}

                          {approver.comment && (
                            <div style={{ fontSize: 12, color: '#666', marginTop: 4, fontStyle: 'italic' }}>
                              "{approver.comment}"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>

            {/* Comment Trail & History */}            <div style={{ marginTop: 24 }}>
              <h4 style={{ color: PRIMARY_BLUE, marginBottom: 16 }}>Comment Trail & History</h4>
              <CommentTrail
                history={history}
                isLoading={loadingComments}
              />
            </div>

            {/* Approve Confirmation Modal */}
            <Modal
              title={`Approve Deferral Request: ${deferral.deferralNumber}`}
              open={showApproveConfirm}
              onCancel={() => setShowApproveConfirm(false)}
              okText={'Yes, Approve'}
              okType={'primary'}
              okButtonProps={{ style: { background: SUCCESS_GREEN, borderColor: SUCCESS_GREEN } }}
              cancelText={'Cancel'}
              confirmLoading={approveLoading}
              onOk={doApprove}
            >
              <div>
                <p>Are you sure you want to approve this deferral request?</p>
                <p><strong>{deferral?.deferralNumber}</strong> - {deferral?.customerName}</p>
                <p>Days Sought: <strong>{deferral?.daysSought}</strong> days</p>
                {deferral?.category === "Non-Allowable" && (
                  <p style={{ color: ERROR_RED, fontWeight: 'bold' }}>
                    ⚠️ This is a Non-Allowable document
                  </p>
                )}
                <p style={{ marginBottom: 6 }}>Add approval comment (optional):</p>
                <Input.TextArea
                  rows={4}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Enter approval comment..."
                />
              </div>
            </Modal>

            {/* Reject Confirmation Modal */}
            <Modal
              title={`Reject Deferral Request: ${deferral.deferralNumber}`}
              open={showRejectConfirm}
              onCancel={() => setShowRejectConfirm(false)}
              maskClosable={false}
              footer={[
                <Button key="cancel" onClick={() => setShowRejectConfirm(false)} disabled={rejecting}>
                  Cancel
                </Button>,
                <Button
                  key="confirm-reject"
                  style={{ background: PRIMARY_BLUE, borderColor: PRIMARY_BLUE, color: 'white' }}
                  loading={rejecting}
                  onClick={doReject}
                >
                  Yes, Reject
                </Button>,
              ]}
            >
              <div>
                <p>Are you sure you want to reject this deferral request?</p>
                <p><strong>{deferral?.deferralNumber}</strong> - {deferral?.customerName}</p>
                <p>Days Sought: <strong>{deferral?.daysSought}</strong> days</p>
                <p style={{ marginBottom: 6 }}>Please provide a reason for rejection (required):</p>
                <Input.TextArea
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
              title={`Return for Rework: ${deferral.deferralNumber}`}
              open={showReworkConfirm}
              onCancel={() => setShowReworkConfirm(false)}
              okText={'Yes, Return for Rework'}
              okType={'warning'}
              okButtonProps={{ style: { background: PRIMARY_BLUE, borderColor: PRIMARY_BLUE, color: 'white' } }}
              cancelText={'Cancel'}
              confirmLoading={returnReworkLoading}
              onOk={doReturnForRework}
            >
              <div>
                <p>Are you sure you want to return this deferral for rework?</p>
                <p><strong>{deferral?.deferralNumber}</strong> - {deferral?.customerName}</p>
                <p>This will return the deferral back to the Relationship Manager for corrections.</p>
                <p style={{ marginBottom: 6 }}>Please provide rework instructions for the Relationship Manager (required):</p>
                <Input.TextArea
                  rows={4}
                  value={reworkComment}
                  onChange={(e) => setReworkComment(e.target.value)}
                  placeholder="Enter rework instructions for the Relationship Manager..."
                  required
                />
                {!reworkComment || reworkComment.trim() === '' ? (
                  <p style={{ color: ERROR_RED, fontSize: 12, marginTop: 4 }}>
                    Rework instructions are required
                  </p>
                ) : null}
                <p style={{ marginTop: 12, fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                  Note: The Relationship Manager will receive these instructions and need to resubmit the deferral request.
                </p>
              </div>
            </Modal>


          </>
        )}
      </Modal>
    </>
  );
};

const MyQueue = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateRange, setDateRange] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("deferrals");
  const token = useSelector(state => state.auth.token);

  // Fetch pending extension applications
  const { data: queueExtensions = [], isLoading: extensionsLoading } = useGetApproverExtensionsQuery();

  // State for modal
  const [selectedDeferral, setSelectedDeferral] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // State for extension modal
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [detailOverrides, setDetailOverrides] = useState(null);

  // Live data - load pending deferrals from API
  const [deferrals, setDeferrals] = useState([]);

  // Handle opening extension details modal
  const handleOpenExtensionDetails = (extension) => {
    if (!extension) return;

    // Use the populated deferral data directly
    const approvedDeferral = extension.deferral || {};
   
    if (!approvedDeferral._id) {
      message.error('Unable to load deferral details for this extension');
      return;
    }

    // Open the approved deferral but override approval workflow with extension's approval workflow
    setSelectedDeferral(approvedDeferral);
    setDetailOverrides({
      headerTag: 'EXTENSION APPLICATION',
      overrideDaysSought: extension.requestedDaysSought,
      overrideNextDueDate: extension.requestedDaysSought
        ? dayjs(approvedDeferral.nextDueDate || approvedDeferral.nextDocumentDueDate)
            .add(extension.requestedDaysSought, 'day')
            .toISOString()
        : null,
      readOnly: false, // Enable action buttons for approvers
      // Override approval status with extension's approval workflow
      overrideApprovals: {
        approvers: extension.approvers || [],
        allApproversApproved: extension.allApproversApproved || false,
        creatorApprovalStatus: extension.creatorApprovalStatus || 'pending',
        checkerApprovalStatus: extension.checkerApprovalStatus || 'pending',
        creatorApprovedBy: extension.creatorApprovedBy,
        checkerApprovedBy: extension.checkerApprovedBy,
        creatorApprovalDate: extension.creatorApprovalDate,
        checkerApprovalDate: extension.checkerApprovalDate,
        status: extension.status
      }
    });
    setSelectedExtension(extension);
    setExtensionModalOpen(true);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDeferrals();
  }, []);

  const fetchDeferrals = async () => {
    setIsLoading(true);
    try {
      const data = await deferralApi.getApproverQueue(token);
      setDeferrals(data);
    } catch (error) {
      message.error('Failed to load deferral requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered deferrals - All in one table
  const filteredDeferrals = useMemo(() => {
    let filtered = [...deferrals];

    const pendingApproverStatuses = new Set(['pending_approval', 'in_review', 'deferral_requested']);
    filtered = filtered.filter((d) => pendingApproverStatuses.has(String(d?.status || '').toLowerCase()));

    // Get current user ID from localStorage
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    const currentUserId = stored?.user?._id || stored?.user?.id;

    // Filter out deferrals where current user is NOT the current approver OR has already approved
    if (currentUserId) {
      filtered = filtered.filter(d => {
        // Get the approvers array
        const approvers = d.approvers || [];
        const currentApproverIndex = d.currentApproverIndex ?? 0;

        // Check if this user has already approved
        const userApproval = approvers.find(a => {
          const approverId = a.user?._id || a.user?.id || a.user || a.userId?._id || a.userId?.id || a.userId;
          return String(approverId) === String(currentUserId);
        });

        // If user has approved=true, exclude from queue
        if (userApproval && userApproval.approved === true) {
          return false;
        }

        // Also check if user is the current approver (double-check)
        const currentApprover = approvers[currentApproverIndex];
        if (!currentApprover) return true;

        const currentApproverId = currentApprover.user?._id || currentApprover.user?.id || currentApprover.user || currentApprover.userId?._id || currentApprover.userId?.id || currentApprover.userId;

        // Only show if user is the current approver AND hasn't approved yet
        return String(currentApproverId) === String(currentUserId);
      });
    }

    // Search filtering
    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(d =>
        String(d.customerName || "").toLowerCase().includes(q) ||
        String(d.dclNumber || d.dclNo || "").toLowerCase().includes(q) ||
        String(d.deferralNumber || "").toLowerCase().includes(q) ||
        String(d.requestedBy || d.createdBy?.name || "").toLowerCase().includes(q) ||
        String(d.customerNumber || "").toLowerCase().includes(q) ||
        String(d.document || "").toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(d => d.priority === priorityFilter);
    }

    // Date range filtering
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      filtered = filtered.filter(d => {
        const requestDate = dayjs(d.requestedDate);
        return requestDate.isAfter(start) && requestDate.isBefore(end);
      });
    }

    return filtered;
  }, [deferrals, searchText, statusFilter, priorityFilter, dateRange]);

  // Handle actions from modal
  const handleModalAction = (action, deferralId, data) => {
    switch (action) {
      case 'addComment':
        // Optimistically add comment to history locally but avoid adding duplicates
        setDeferrals(prev => prev.map(d => {
          if (d._id !== deferralId && d.id !== deferralId) return d;
          const existing = d.history || [];
          const last = existing.length ? existing[existing.length - 1] : null;
          const isDup = last && last.comment === data.comment && last.user === data.user && last.date === data.date;
          if (isDup) return d;
          return { ...d, history: [...existing, data] };
        }));

        // If the modal is currently open for the same deferral, update it too so UI reflects change immediately
        setSelectedDeferral(prev => {
          if (!prev || (prev._id !== deferralId && prev.id !== deferralId)) return prev;
          const existing = prev.history || [];
          const last = existing.length ? existing[existing.length - 1] : null;
          const isDup = last && last.comment === data.comment && last.user === data.user && last.date === data.date;
          if (isDup) return prev;
          return { ...prev, history: [...existing, data] };
        });

        break;
      case 'approve':
      case 'reject':
      case 'returnForRework':
        // Remove the deferral from the queue immediately after it's returned for rework, rejected, or approved
        setDeferrals(prev => prev.filter(d => (d._id || d.id) !== deferralId));
        setSelectedDeferral(null);
        setModalOpen(false);
        break;
      case 'refreshQueue':
        // Refresh approver queue from the server to reflect state changes
        fetchDeferrals();
        break;
      case 'gotoActioned':
        // Navigate user to the Actioned tab so they can see items they've actioned
        navigate('/approver/actioned');
        break;
      default:
        break;
    }
  };



  // Standardized Columns for the table - REMOVED TAGS FROM STATUS AND DAYS SOUGHT, REMOVED ACTIONS COLUMN
  const columns = [
    {
      title: "Deferral No",
      dataIndex: "deferralNumber",
      width: 120,
      fixed: "left",
      render: (deferralNumber) => (
        <div style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
          <FileTextOutlined style={{ marginRight: 6 }} />
          {deferralNumber}
        </div>
      ),
    },
    {
      title: "DCL No",
      dataIndex: "dclNumber",
      width: 100,
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 180,
      render: (name) => (
        <Text strong style={{ color: PRIMARY_BLUE, fontSize: 13 }}>
          {name}
        </Text>
      ),
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      width: 120,
      render: (loanType) => (
        <div style={{ fontSize: 12, fontWeight: 500 }}>
          {loanType}
        </div>
      ),
    },

    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (status) => {
        const statusConfig = {
          pending_approval: { color: WARNING_ORANGE, text: "Pending", icon: <ClockCircleOutlined /> },
          in_review: { color: PROCESSING_BLUE, text: "In Review", icon: <ClockCircleOutlined /> },
          approved: { color: SUCCESS_GREEN, text: "Approved", icon: <CheckCircleOutlined /> },
          rejected: { color: ERROR_RED, text: "Rejected", icon: <CloseCircleOutlined /> },
        };
        const config = statusConfig[status] || { color: "default", text: status };
        return (
          <div style={{
            fontSize: 12,
            fontWeight: "bold",
            color: config.color === "orange" ? WARNING_ORANGE :
              config.color === "blue" ? PROCESSING_BLUE :
                config.color === "green" ? SUCCESS_GREEN :
                  config.color === "red" ? ERROR_RED : "#666",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            {config.icon}
            {config.text}
          </div>
        );
      },
    },
    {
      title: "Days Sought",
      dataIndex: "daysSought",
      width: 100,
      align: "center",
      render: (daysSought) => (
        <div style={{
          fontWeight: "bold",
          color: daysSought > 45 ? ERROR_RED :
            daysSought > 30 ? WARNING_ORANGE :
              daysSought > 15 ? PROCESSING_BLUE :
                SUCCESS_GREEN,
          fontSize: 13,
          padding: "2px 8px",
          borderRadius: 4,
          display: "inline-block"
        }}>
          {daysSought} days
        </div>
      ),
    },
    {
      title: "SLA",
      dataIndex: "slaExpiry",
      width: 100,
      render: (date, record) => {
        if (record.status !== "pending_approval" && record.status !== "in_review") {
          return <div style={{ fontSize: 11, color: "#999" }}>N/A</div>;
        }

        const hoursLeft = dayjs(date).diff(dayjs(), 'hours');
        let color = SUCCESS_GREEN;
        let text = `${Math.ceil(hoursLeft / 24)}d`;

        if (hoursLeft <= 0) {
          color = ERROR_RED;
          text = 'Expired';
        } else if (hoursLeft <= 24) {
          color = ERROR_RED;
          text = `${hoursLeft}h`;
        } else if (hoursLeft <= 72) {
          color = WARNING_ORANGE;
        }

        return (
          <div style={{
            color: color,
            fontWeight: "bold",
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 4,
            backgroundColor: `${color}10`,
            display: "inline-block"
          }}>
            {text}
          </div>
        );
      },
    },
  ];



  // Custom table styles
  const tableStyles = `
    .myqueue-table .ant-table-wrapper {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
      border: 1px solid #e0e0e0;
    }
    .myqueue-table .ant-table-thead > tr > th {
      background-color: #f7f7f7 !important;
      color: ${PRIMARY_BLUE} !important;
      font-weight: 700;
      border-bottom: 3px solid ${ACCENT_LIME} !important;
    }
    .myqueue-table .ant-table-tbody > tr:hover > td {
      background-color: rgba(181, 211, 52, 0.1) !important;
      cursor: pointer;
    }

    /* Match DeferralPending extension tab styling */
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
      <style>{tableStyles}</style>

      {/* Header */}
      <Card
        style={{
          marginBottom: 24,
          borderLeft: `4px solid ${ACCENT_LIME}`,
        }}
      >
        <h2 style={{ margin: 0, color: PRIMARY_BLUE }}>My Queue</h2>
        <p style={{ marginTop: 4, color: "#666" }}>
          All pending deferrals and extension applications
        </p>
      </Card>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        type="card"
        style={{ marginBottom: 16 }}
      >
        <Tabs.TabPane
          tab={`Deferrals (${filteredDeferrals.length})`}
          key="deferrals"
        >
          {/* Search Filter Only */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col md={12}>
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Search by Customer, DCL, or ID"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="large"
                />
              </Col>
            </Row>
          </Card>

          {/* Main Table */}
          <Card>
            <div className="myqueue-table">
              <Table
                columns={columns}
                dataSource={filteredDeferrals}
                rowKey={(record) => record._id || record.id || `row-${Math.random()}`}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                }}
                loading={isLoading}
                scroll={{ x: 1200 }}
                size="middle"
                locale={{
                  emptyText: (
                    <Empty
                      description={
                        filteredDeferrals.length === 0 && deferrals.length > 0
                          ? "No deferrals match your filters"
                          : "No deferral requests in your queue"
                      }
                    />
                  ),
                }}
                onRow={(record) => ({
                  onClick: () => {
                    setSelectedDeferral(record);
                    setModalOpen(true);
                  },
                })}
              />
            </div>
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={`Extension Applications (${queueExtensions.length})`}
          key="extensions"
        >
          <ExtensionApplicationsTab
            extensions={queueExtensions}
            loading={extensionsLoading}
            tableClassName="myqueue-table"
            useSearchRow
            useTableCard
            inputSize="large"
            useMyQueuePagination
            scrollX={1200}
            onOpenExtensionDetails={handleOpenExtensionDetails}
          />
        </Tabs.TabPane>
      </Tabs>

      {/* Deferral Details Modal */}
      {selectedDeferral && !extensionModalOpen && (
        <DeferralDetailsModal
          deferral={selectedDeferral}
          open={modalOpen}
          token={token}
          onClose={() => {
            setModalOpen(false);
            setSelectedDeferral(null);
          }}
          onAction={handleModalAction}
        />
      )}

      {/* Extension Details Modal */}
      {selectedDeferral && extensionModalOpen && selectedExtension && (
        <DeferralDetailsModal
          deferral={selectedDeferral}
          open={extensionModalOpen}
          token={token}
          onClose={() => {
            setExtensionModalOpen(false);
            setSelectedDeferral(null);
            setSelectedExtension(null);
            setDetailOverrides(null);
          }}
          onAction={handleModalAction}
          overrideApprovals={detailOverrides?.overrideApprovals}
          headerTag={detailOverrides?.headerTag}
          overrideDaysSought={detailOverrides?.overrideDaysSought}
          overrideNextDueDate={detailOverrides?.overrideNextDueDate}
          readOnly={detailOverrides?.readOnly}
        />
      )}
    </div>
  );
};

export default MyQueue;