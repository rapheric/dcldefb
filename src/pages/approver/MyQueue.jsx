// import { openFileInNewTab, downloadFile } from '../../utils/fileUtils';
// import jsPDF from 'jspdf';

// import React, { useState, useMemo, useEffect } from "react";
// import { useSelector } from 'react-redux';
// import {
//   Table,
//   Tag,
//   Card,
//   Row,
//   Col,
//   Input,
//   Button,
//   Space,
//   Select,
//   DatePicker,
//   Avatar,
//   Spin,
//   Empty,
//   Typography,
//   Modal,
//   message,
//   Badge,
//   Divider,
//   Descriptions,
//   Upload,
//   Form,
//   Input as AntdInput,
//   Progress,
//   List,
//   Popconfirm,
//   Tabs
// } from "antd";
// import {
//   SearchOutlined,
//   FileTextOutlined,
//   UserOutlined,
//   ClockCircleOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   UploadOutlined,
//   DownloadOutlined,
//   InfoCircleOutlined,
//   CalendarOutlined,
//   FilePdfOutlined,
//   FileWordOutlined,
//   FileExcelOutlined,
//   FileImageOutlined,
//   EyeOutlined,
//   CheckOutlined,
//   CloseOutlined,
//   MoreOutlined,
//   ExclamationCircleOutlined,
//   FilterOutlined,
//   PaperClipOutlined,
//   FileDoneOutlined,
//   BankOutlined,
//   MailOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";
// import deferralApi from "../../service/deferralApi.js";
// import getFacilityColumns from '../../utils/facilityColumns';
// import ApproverExtensionTab from "../../components/ApproverExtensionTab";
// import { useGetApproverExtensionsQuery, useApproveExtensionMutation, useRejectExtensionMutation } from "../../api/extensionApi";
// import { useNavigate } from "react-router-dom";

// const { RangePicker } = DatePicker;
// const { Option } = Select;
// const { Text, Title } = Typography;
// const { confirm } = Modal;
// const { TextArea } = AntdInput;

// // Theme colors
// const PRIMARY_BLUE = "#164679";
// const ACCENT_LIME = "#b5d334";
// const SUCCESS_GREEN = "#52c41a";
// const ERROR_RED = "#ff4d4f";
// const WARNING_ORANGE = "#faad14";
// const PROCESSING_BLUE = "#1890ff";

// // Safe text rendering (coerce objects/arrays to readable strings)
// const safeText = (v) => {
//   if (v == null) return "";
//   if (typeof v === "string") return v;
//   if (typeof v === "number") return String(v);
//   if (Array.isArray(v)) return v.map(i => (typeof i === 'string' ? i : (i?.name || i?.email || String(i)))).join(', ');
//   if (typeof v === 'object') return v.name || v.email || v.role || String(v);
//   return String(v);
// };

// const getFileIcon = (type) => {
//   switch (type) {
//     case 'pdf': return <FilePdfOutlined style={{ color: ERROR_RED }} />;
//     case 'word': return <FileWordOutlined style={{ color: PRIMARY_BLUE }} />;
//     case 'excel': return <FileExcelOutlined style={{ color: SUCCESS_GREEN }} />;
//     case 'image': return <FileImageOutlined style={{ color: "#7e6496" }} />;
//     default: return <FileTextOutlined />;
//   }
// };

// const getRoleTag = (role) => {
//   let color = "blue";
//   const roleLower = (role || "").toLowerCase();
//   switch (roleLower) {
//     case "rm":
//       color = "purple";
//       break;
//     case "deferral management":
//       color = "green";
//       break;
//     case "creator":
//       color = "green";
//       break;
//     case "co_checker":
//       color = "volcano";
//       break;
//     case "system":
//       color = "default";
//       break;
//     default:
//       color = "blue";
//   }
//   return (
//     <Tag color={color} style={{ marginLeft: 8, textTransform: "uppercase" }}>
//       {roleLower.replace(/_/g, " ")}
//     </Tag>
//   );
// };

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

  return (
    <div className="max-h-52 overflow-y-auto">
      <List
        dataSource={processedComments}
        itemLayout="horizontal"
        renderItem={(item, idx) => {
          return (
            <List.Item key={idx} style={{ padding: '8px 0', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: PRIMARY_BLUE, flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap', paddingRight: 12 }}>
                  <b style={{ fontSize: 13, color: PRIMARY_BLUE, whiteSpace: 'nowrap' }}>{item.name}</b>
                  {item.roleLabel && getRoleTag(item.roleLabel)}
                  <span style={{ color: '#4a4a4a' }}>
                    {item.systemText}
                    {item.merged && (
                      <>
                        <span style={{ margin: '0 4px', color: '#999' }}>;</span>
                        <span>{item.userText}</span>
                      </>
                    )}
                    {!item.merged && item.userText && item.userText}
                  </span>
                  <span style={{ fontSize: 12, color: '#999', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                    {item.timestamp ? dayjs(item.timestamp).format('M/D/YY, h:mm A') : ''}
                  </span>
                </div>
              </div>
            </List.Item>
          );
        }}
      />
    </div>
  );
};

// Add comment modal removed from approver queue (comments should be added from RM/other workflows)


// // Custom CSS for modal styling
// const customStyles = `
//   .ant-modal-header { background-color: ${PRIMARY_BLUE} !important; padding: 18px 24px !important; }
//   .ant-modal-title { color: white !important; font-size: 1.15rem !important; font-weight: 700 !important; letter-spacing: 0.5px; }
//   .ant-modal-close-x { color: white !important; }

//   .deferral-info-card .ant-card-head { border-bottom: 2px solid ${ACCENT_LIME} !important; }
//   .deferral-info-card .ant-descriptions-item-label { font-weight: 600 !important; color: #7e6496 !important; padding-bottom: 4px; }
//   .deferral-info-card .ant-descriptions-item-content { color: ${PRIMARY_BLUE} !important; font-weight: 700 !important; font-size: 13px !important; }

//   .ant-input, .ant-select-selector { border-radius: 6px !important; border-color: #e0e0e0 !important; }
//   .ant-input:focus, .ant-select-focused .ant-select-selector { box-shadow: 0 0 0 2px rgba(22, 70, 121, 0.2) !important; border-color: ${PRIMARY_BLUE} !important; }

//   .status-tag { font-weight: 700 !important; border-radius: 999px !important; padding: 3px 8px !important; text-transform: capitalize; min-width: 80px; text-align: center; display: inline-flex; align-items: center; gap: 4px; justify-content: center; }

//   .ant-modal-footer .ant-btn { border-radius: 8px; font-weight: 600; height: 38px; padding: 0 16px; }
//   .ant-modal-footer .ant-btn-primary { background-color: ${PRIMARY_BLUE} !important; border-color: ${PRIMARY_BLUE} !important; }
// `;

// // Deferral Details Modal for MyQueue - Shows status as pending
// const DeferralDetailsModal = ({ deferral, open, onClose, onAction, token }) => {
//   const [loadingComments, setLoadingComments] = useState(false);
//   const [newComment, setNewComment] = useState('');
//   const [postingComment, setPostingComment] = useState(false);

//   // Controlled approve confirmation modal state
//   const [showApproveConfirm, setShowApproveConfirm] = useState(false);
//   const [approvalComment, setApprovalComment] = useState("");
//   const [approveLoading, setApproveLoading] = useState(false);
//   const [rejecting, setRejecting] = useState(false);
//   const [returnReworkLoading, setReturnReworkLoading] = useState(false);
//   const [rejectComment, setRejectComment] = useState("");
//   const [showRejectConfirm, setShowRejectConfirm] = useState(false);
//   const [reworkComment, setReworkComment] = useState("");
//   const [showReworkConfirm, setShowReworkConfirm] = useState(false);

//   const approverEmail = (
//     deferral?.currentApprover?.email ||
//     (deferral?.approverFlow && (deferral.approverFlow[0]?.email || deferral.approverFlow[0]?.user?.email)) ||
//     (deferral?.approvers && (deferral.approvers[0]?.email || (typeof deferral.approvers[0] === 'string' && deferral.approvers[0].includes('@')))) ||
//     null
//   );

//   // Send reminder logic moved to the centralized pending modal (`DeferralPending.jsx`) to avoid duplicate buttons across modals.

//   const getStatusConfig = (status) => {
//     switch (status) {
//       case 'pending_approval':
//       case 'deferral_requested':
//         return {
//           color: 'orange',
//           icon: <ClockCircleOutlined />,
//           label: 'Pending Review',
//           description: 'Awaiting your approval',
//           badgeColor: WARNING_ORANGE
//         };
//       case 'in_review':
//         return {
//           color: 'blue',
//           icon: <ClockCircleOutlined />,
//           label: 'In Review',
//           description: 'Currently being reviewed',
//           badgeColor: PROCESSING_BLUE
//         };
//       case 'approved':
//       case 'deferral_approved':
//         return {
//           color: 'green',
//           icon: <CheckCircleOutlined />,
//           label: 'Approved',
//           description: 'Deferral approved',
//           badgeColor: SUCCESS_GREEN
//         };
//       case 'rejected':
//       case 'deferral_rejected':
//         return {
//           color: 'red',
//           icon: <CloseCircleOutlined />,
//           label: 'Rejected',
//           description: 'Deferral request was rejected',
//           badgeColor: ERROR_RED
//         };
//       default:
//         return {
//           color: 'default',
//           label: status,
//           description: '',
//           badgeColor: '#d9d9d9'
//         };
//     }
//   };

//   const statusConfig = getStatusConfig(deferral?.status);

//   const handleAddComment = (deferralId, comment) => {
//     const newComment = {
//       action: 'Comment Added',
//       user: 'You (Approver)',
//       date: new Date().toISOString(),
//       notes: 'Comment added by approver',
//       comment: comment,
//       userRole: 'Approver'
//     };

//     // Add to history
//     if (onAction) {
//       onAction('addComment', deferralId, newComment);
//     }
//   };

//   // Handle posting comments
//   const handlePostComment = async () => {
//     if (!newComment.trim()) {
//       message.error('Please enter a comment before posting');
//       return;
//     }

//     if (!deferral || !deferral._id) {
//       message.error('No deferral selected');
//       return;
//     }

//     setPostingComment(true);
//     try {
//       const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

//       const commentData = {
//         text: newComment.trim(),
//         author: {
//           name: currentUser.name || currentUser.user?.name || 'User',
//           role: currentUser.role || currentUser.user?.role || 'user'
//         },
//         createdAt: new Date().toISOString()
//       };

//       // Post comment to the backend
//       await deferralApi.postComment(deferral._id, commentData, token);

//       message.success('Comment posted successfully');

//       // Clear the input
//       setNewComment('');

//       // Refresh the deferral to show the new comment
//       const refreshedDeferral = await deferralApi.getDeferralById(deferral._id, token);

//       // Notify parent to refresh queue
//       if (onAction) onAction('refreshQueue');
//     } catch (error) {
//       console.error('Failed to post comment:', error);
//       message.error(error.message || 'Failed to post comment');
//     } finally {
//       setPostingComment(false);
//     }
//   };

//   const handleApprove = () => {
//     // Show controlled approval modal
//     setApprovalComment('');
//     setShowApproveConfirm(true);
//   };

//   const doApprove = async () => {
//     setApproveLoading(true);
//     try {
//       const updated = await deferralApi.approveDeferral(deferral._id || deferral.id, approvalComment, token);
//       message.success('Deferral approved successfully');
//       if (onAction) onAction('refreshQueue');
//       if (onAction) onAction('gotoActioned');
//       try { window.dispatchEvent(new CustomEvent('deferral:updated', { detail: updated })); } catch (e) { console.debug('Failed to dispatch deferral:updated', e); }
//       setShowApproveConfirm(false);
//       onClose();
//     } catch (err) {
//       message.error(err.message || 'Failed to approve');
//     } finally {
//       setApproveLoading(false);
//     }
//   };

//   const handleReject = () => {
//     setRejectComment('');
//     setShowRejectConfirm(true);
//   };

//   const doReject = async () => {
//     if (!rejectComment || rejectComment.trim() === '') {
//       message.error('Please provide a rejection reason');
//       return;
//     }

//     setRejecting(true);
//     try {
//       const updated = await deferralApi.rejectDeferral(deferral._id || deferral.id, rejectComment);
//       message.success('Deferral rejected');
//       if (onAction) onAction('refreshQueue');
//       // Navigate approver to their Actioned tab so this terminated item is visible in their action history
//       if (onAction) onAction('gotoActioned');
//       setShowRejectConfirm(false);
//       onClose();
//       try { window.dispatchEvent(new CustomEvent('deferral:updated', { detail: updated })); } catch (e) { console.debug('Failed to dispatch deferral:updated', e); }
//     } catch (err) {
//       message.error(err.message || 'Failed to reject');
//     } finally {
//       setRejecting(false);
//     }
//   };

//   const handleReturnForRework = () => {
//     setReworkComment('');
//     setShowReworkConfirm(true);
//   };

//   const doReturnForRework = async () => {
//     if (!reworkComment || reworkComment.trim() === '') {
//       message.error('Please provide rework instructions');
//       return;
//     }

//     setReturnReworkLoading(true);
//     try {
//       // Get current user info for permission check
//       const storedUser = JSON.parse(localStorage.getItem("user") || "null");
//       const currentUser = storedUser?.user || storedUser;

//       // Log for debugging
//       console.log('Current user:', currentUser);
//       console.log('Deferral current approver:', deferral.currentApprover);

//       // Get current user email from Redux token info or localStorage
//       const currentUserEmail = currentUser?.email || currentUser?.userEmail || '';

//       // Get current approver email from deferral
//       const currentApproverEmail = deferral.currentApprover?.email ||
//         (deferral.approvers?.find(a => a.isCurrent)?.email) ||
//         (deferral.approverFlow && deferral.approverFlow.length > 0 ?
//           (typeof deferral.approverFlow[0] === 'string' ? deferral.approverFlow[0] :
//             deferral.approverFlow[0]?.email || deferral.approverFlow[0]?.user?.email) : '');

//       // Check if user is the current approver
//       if (currentApproverEmail && currentUserEmail) {
//         const isCurrentApprover = currentApproverEmail.toLowerCase() === currentUserEmail.toLowerCase();
//         if (!isCurrentApprover) {
//           message.error(`You are not the current approver. Current approver is: ${currentApproverEmail}`);
//           setReturnReworkLoading(false);
//           return;
//         }
//       }

//       // Call API with correct parameters
//       const updatedDeferral = await deferralApi.returnForRework(
//         deferral._id || deferral.id,
//         {
//           comment: reworkComment,
//           reworkInstructions: reworkComment
//         }
//       );

//       message.success('Deferral returned for rework. Relationship Manager has been notified.');

//       // Notify parent component to refresh queue and update state
//       if (onAction) onAction('returnForRework', deferral._id || deferral.id, updatedDeferral);

//       // Dispatch custom event for queue update
//       try {
//         window.dispatchEvent(new CustomEvent('deferral:updated', { detail: updatedDeferral }));
//       } catch (e) {
//         console.debug('Failed to dispatch deferral:updated', e);
//       }

//       setShowReworkConfirm(false);
//       onClose();
//     } catch (err) {
//       console.error('Return for rework error:', err);

//       // Provide more specific error messages
//       if (err.message.includes('current approver')) {
//         message.error('You are not the current approver for this deferral. Please refresh the page to see the latest status.');
//       } else if (err.message.includes('403')) {
//         message.error('Permission denied. You may not have the required permissions to perform this action.');
//       } else {
//         message.error(err.message || 'Failed to return for rework');
//       }
//     } finally {
//       setReturnReworkLoading(false);
//     }
//   };

//   // Download deferral as PDF
//   const [downloadLoading, setDownloadLoading] = useState(false);
//   const downloadDeferralAsPDF = async () => {
//     if (!deferral || !deferral._id) {
//       message.error("No deferral selected");
//       return;
//     }

//     setDownloadLoading(true);
//     try {
//       const doc = new jsPDF();
//       const primaryBlue = [22, 70, 121];
//       const darkGray = [51, 51, 51];
//       const successGreen = [82, 196, 26];
//       let yPosition = 20;
//       const pageWidth = doc.internal.pageSize.getWidth();
//       const margin = 15;
//       const contentWidth = pageWidth - 2 * margin;

//       const loanAmountValue = Number(deferral.loanAmount || deferral.amount || deferral.loan_amount || 0);
//       const formattedLoanAmount = loanAmountValue ? `KSh ${loanAmountValue.toLocaleString()}` : 'Not specified';

//       // Header
//       doc.setFillColor(22, 70, 121);
//       doc.rect(0, 0, pageWidth, 35, 'F');
//       doc.setFontSize(16);
//       doc.setTextColor(255, 255, 255);
//       doc.setFont(undefined, 'bold');
//       doc.text(`Deferral Request: ${deferral.deferralNumber || 'N/A'}`, margin, 15);
//       doc.setFontSize(10);
//       doc.setFont(undefined, 'normal');
//       doc.text(`Generated: ${dayjs().format('DD MMM YYYY HH:mm')}`, margin, 25);
//       yPosition = 45;

//       // Customer Information
//       doc.setFillColor(255, 250, 205);
//       doc.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, 'F');
//       doc.setDrawColor(200, 180, 100);
//       doc.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, 'S');

//       doc.setFontSize(12);
//       doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
//       doc.setFont(undefined, 'bold');
//       doc.text('Customer Information', margin + 5, yPosition + 8);

//       doc.setFontSize(10);
//       doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
//       doc.setFont(undefined, 'bold');
//       doc.text('Customer Name:', margin + 5, yPosition + 16);
//       doc.setFont(undefined, 'normal');
//       doc.text(deferral.customerName || 'N/A', margin + 50, yPosition + 16);

//       doc.setFont(undefined, 'bold');
//       doc.text('Customer Number:', margin + 5, yPosition + 24);
//       doc.setFont(undefined, 'normal');
//       doc.text(deferral.customerNumber || 'N/A', margin + 50, yPosition + 24);

//       doc.setFont(undefined, 'bold');
//       doc.text('Loan Type:', margin + 110, yPosition + 16);
//       doc.setFont(undefined, 'normal');
//       doc.text(deferral.loanType || 'N/A', margin + 135, yPosition + 16);

//       yPosition += 45;

//       // Deferral Details
//       doc.setFillColor(245, 247, 250);
//       doc.roundedRect(margin, yPosition, contentWidth, 70, 3, 3, 'F');
//       doc.setDrawColor(200, 200, 200);
//       doc.roundedRect(margin, yPosition, contentWidth, 70, 3, 3, 'S');

//       doc.setFontSize(12);
//       doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
//       doc.setFont(undefined, 'bold');
//       doc.text('Deferral Details', margin + 5, yPosition + 8);

//       doc.setFontSize(9);
//       doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
//       let detailY = yPosition + 16;

//       doc.setFont(undefined, 'bold');
//       doc.text('Deferral Number:', margin + 5, detailY);
//       doc.setFont(undefined, 'normal');
//       doc.text(deferral.deferralNumber || 'N/A', margin + 45, detailY);

//       detailY += 7;
//       doc.setFont(undefined, 'bold');
//       doc.text('DCL No:', margin + 5, detailY);
//       doc.setFont(undefined, 'normal');
//       doc.text(deferral.dclNo || deferral.dclNumber || 'N/A', margin + 45, detailY);

//       detailY += 7;
//       doc.setFont(undefined, 'bold');
//       doc.text('Status:', margin + 5, detailY);
//       doc.setFont(undefined, 'normal');
//       doc.text(deferral.status || 'Pending', margin + 45, detailY);

//       detailY = yPosition + 16;
//       doc.setFont(undefined, 'bold');
//       doc.text('Current Approver:', margin + 105, detailY);
//       doc.setFont(undefined, 'normal');
//       doc.text(deferral.currentApprover?.name || deferral.currentApprover || 'N/A', margin + 145, detailY);

//       detailY += 7;
//       doc.setFont(undefined, 'bold');
//       doc.text('SLA Expiry:', margin + 105, detailY);
//       doc.setFont(undefined, 'normal');
//       doc.text(deferral.slaExpiry ? dayjs(deferral.slaExpiry).format('DD MMM YYYY HH:mm') : 'Not set', margin + 145, detailY);

//       detailY += 7;
//       doc.setFont(undefined, 'bold');
//       doc.text('Created At:', margin + 105, detailY);
//       doc.setFont(undefined, 'normal');
//       doc.text(dayjs(deferral.createdAt || deferral.requestedDate).format('DD MMM YYYY HH:mm'), margin + 145, detailY);

//       yPosition += 75;

//       // Loan Information
//       const isUnder75M = loanAmountValue > 0 && loanAmountValue < 75000000;
//       doc.setFillColor(240, 248, 255);
//       doc.roundedRect(margin, yPosition, contentWidth, 42, 3, 3, 'F');
//       doc.setDrawColor(200, 200, 200);
//       doc.roundedRect(margin, yPosition, contentWidth, 42, 3, 3, 'S');

//       doc.setFontSize(11);
//       doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
//       doc.setFont(undefined, 'bold');
//       doc.text('Loan Information', margin + 5, yPosition + 8);

//       doc.setFontSize(9);
//       doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
//       let loanY = yPosition + 16;

//       doc.setFont(undefined, 'bold');
//       doc.text('Loan Amount:', margin + 5, loanY);
//       doc.setFont(undefined, 'normal');
//       doc.text(formattedLoanAmount, margin + 40, loanY);
//       doc.setFont(undefined, 'italic');
//       doc.setFontSize(8);
//       doc.text(isUnder75M ? '(Under 75M)' : '(Above 75M)', margin + 90, loanY);

//       loanY += 7;
//       doc.setFontSize(9);
//       doc.setFont(undefined, 'bold');
//       doc.text('Days Sought:', margin + 5, loanY);
//       doc.setFont(undefined, 'normal');
//       const daysColor = deferral.daysSought > 45 ? [255, 77, 79] : deferral.daysSought > 30 ? [250, 173, 20] : darkGray;
//       doc.setTextColor(daysColor[0], daysColor[1], daysColor[2]);
//       doc.text(`${deferral.daysSought || 0} days`, margin + 40, loanY);
//       doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

//       loanY += 7;
//       doc.setFont(undefined, 'bold');
//       doc.text('Next Due Date:', margin + 5, loanY);
//       doc.setFont(undefined, 'normal');
//       const nextDue = deferral.nextDueDate || deferral.nextDocumentDueDate || deferral.requestedExpiry;
//       doc.text(nextDue ? dayjs(nextDue).format('DD MMM YYYY') : 'Not calculated', margin + 40, loanY);

//       loanY += 7;
//       doc.setFont(undefined, 'bold');
//       doc.text('SLA Expiry:', margin + 5, loanY);
//       doc.setFont(undefined, 'normal');
//       doc.text(deferral.slaExpiry ? dayjs(deferral.slaExpiry).format('DD MMM YYYY') : 'Not set', margin + 40, loanY);

//       yPosition += 47;

//       if (yPosition > 230) {
//         doc.addPage();
//         yPosition = 20;
//       }

//       // Facilities
//       if (deferral.facilities && deferral.facilities.length > 0) {
//         doc.setFontSize(11);
//         doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
//         doc.setFont(undefined, 'bold');
//         doc.text('Facility Details', margin, yPosition);
//         yPosition += 8;

//         doc.setFillColor(22, 70, 121);
//         doc.rect(margin, yPosition, contentWidth, 8, 'F');
//         doc.setTextColor(255, 255, 255);
//         doc.setFontSize(9);
//         doc.text('Type', margin + 2, yPosition + 5);
//         doc.text('Sanctioned', margin + 50, yPosition + 5);
//         doc.text('Balance', margin + 95, yPosition + 5);
//         doc.text('Headroom', margin + 135, yPosition + 5);
//         yPosition += 8;

//         doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
//         doc.setFont(undefined, 'normal');
//         deferral.facilities.forEach((facility, index) => {
//           if (index % 2 === 0) {
//             doc.setFillColor(250, 250, 250);
//             doc.rect(margin, yPosition - 4, contentWidth, 8, 'F');
//           }
//           const facilityType = facility.type || facility.facilityType || 'N/A';
//           doc.text(facilityType, margin + 2, yPosition + 2);
//           doc.text(String(facility.sanctionedAmount || '0'), margin + 50, yPosition + 2);
//           doc.text(String(facility.outstandingAmount || '0'), margin + 95, yPosition + 2);
//           doc.text(String(facility.headroom || '0'), margin + 135, yPosition + 2);
//           yPosition += 8;

//           if (yPosition > 250) {
//             doc.addPage();
//             yPosition = 20;
//           }
//         });

//         yPosition += 5;
//       }

//       // Description
//       if (deferral.deferralDescription) {
//         doc.setFillColor(255, 250, 205);
//         const descLines = doc.splitTextToSize(deferral.deferralDescription, contentWidth - 20);
//         const boxHeight = Math.max(25, descLines.length * 6 + 15);
//         doc.roundedRect(margin, yPosition, contentWidth, boxHeight, 3, 3, 'F');
//         doc.setDrawColor(200, 180, 100);
//         doc.roundedRect(margin, yPosition, contentWidth, boxHeight, 3, 3, 'S');

//         doc.setFontSize(10);
//         doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
//         doc.setFont(undefined, 'bold');
//         doc.text('Deferral Description', margin + 5, yPosition + 8);

//         doc.setFontSize(9);
//         doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
//         doc.setFont(undefined, 'normal');
//         let descY = yPosition + 16;
//         descLines.forEach((line) => {
//           doc.text(line, margin + 5, descY);
//           descY += 6;
//         });

//         yPosition += boxHeight + 5;

//         if (yPosition > 230) {
//           doc.addPage();
//           yPosition = 20;
//         }
//       }

//       // Approval Flow with badges
//       if (deferral.approverFlow && deferral.approverFlow.length > 0) {
//         if (yPosition > 230) {
//           doc.addPage();
//           yPosition = 20;
//         }

//         doc.setFillColor(240, 248, 255);
//         doc.roundedRect(margin, yPosition, contentWidth, 12, 3, 3, 'F');
//         doc.setFontSize(11);
//         doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
//         doc.setFont(undefined, 'bold');
//         doc.text('Approval Flow', margin + 5, yPosition + 8);
//         yPosition += 15;

//         doc.setFontSize(9);
//         deferral.approverFlow.forEach((approver, index) => {
//           const approverName = approver.name || approver.user?.name || approver.email || `Approver ${index + 1}`;
//           const status = approver.approved ? 'Approved' : approver.rejected ? 'Rejected' : approver.returned ? 'Returned' : 'Pending';
//           const date = approver.approvedDate || approver.rejectedDate || approver.returnedDate || '';
//           const statusColor = status === 'Approved' ? successGreen : status === 'Rejected' ? [255, 77, 79] : [250, 173, 20];

//           doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
//           doc.circle(margin + 5, yPosition + 3, 3, 'F');
//           doc.setTextColor(255, 255, 255);
//           doc.setFontSize(7);
//           doc.setFont(undefined, 'bold');
//           doc.text(String(index + 1), margin + 3.5, yPosition + 4.2);

//           doc.setFontSize(9);
//           doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
//           doc.setFont(undefined, 'bold');
//           doc.text(approverName, margin + 12, yPosition + 4);

//           doc.setFont(undefined, 'normal');
//           doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
//           doc.text(status, margin + 95, yPosition + 4);

//           if (date) {
//             doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
//             doc.setFontSize(8);
//             doc.text(dayjs(date).format('DD MMM YYYY HH:mm'), margin + 130, yPosition + 4);
//           }

//           yPosition += 10;

//           if (yPosition > 250) {
//             doc.addPage();
//             yPosition = 20;
//           }
//         });

//         yPosition += 5;
//       }

//       // Documents Section with styled file type indicators
//       if (deferral.documents && deferral.documents.length > 0) {
//         if (yPosition > 230) {
//           doc.addPage();
//           yPosition = 20;
//         }

//         doc.setFontSize(11);
//         doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
//         doc.setFont(undefined, 'bold');
//         doc.text('Attached Documents', margin, yPosition);
//         yPosition += 8;

//         doc.setFontSize(9);
//         deferral.documents.forEach((doc_item, index) => {
//           if (index % 2 === 0) {
//             doc.setFillColor(250, 250, 250);
//             doc.rect(margin, yPosition - 3, contentWidth, 10, 'F');
//           }

//           const docName = doc_item.name || `Document ${index + 1}`;
//           const fileExt = docName.split('.').pop().toLowerCase();
//           const fileColor = fileExt === 'pdf' ? [255, 77, 79] : fileExt === 'xlsx' || fileExt === 'xls' ? [82, 196, 26] : primaryBlue;

//           doc.setFillColor(fileColor[0], fileColor[1], fileColor[2]);
//           doc.circle(margin + 3, yPosition + 2, 2, 'F');

//           doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
//           doc.setFont(undefined, 'normal');
//           const nameLines = doc.splitTextToSize(docName, contentWidth - 15);
//           doc.text(nameLines[0], margin + 8, yPosition + 3);

//           if (doc_item.fileSize) {
//             doc.setFontSize(8);
//             doc.setTextColor(100, 100, 100);
//             doc.text(`(${(doc_item.fileSize / 1024).toFixed(2)} KB)`, margin + 120, yPosition + 3);
//           }

//           yPosition += 10;
//           doc.setFontSize(9);

//           if (yPosition > 250) {
//             doc.addPage();
//             yPosition = 20;
//           }
//         });

//         yPosition += 5;
//       }

//       // Comments/History Section with professional trail
//       if (deferral.comments && deferral.comments.length > 0) {
//         if (yPosition > 220) {
//           doc.addPage();
//           yPosition = 20;
//         }

//         doc.setFontSize(11);
//         doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
//         doc.setFont(undefined, 'bold');
//         doc.text('Comment Trail', margin, yPosition);
//         yPosition += 10;

//         deferral.comments.forEach((comment, index) => {
//           const authorName = comment.author?.name || comment.authorName || 'User';
//           const authorRole = comment.author?.role || 'N/A';
//           const commentText = comment.text || comment.comment || '';
//           const commentDate = comment.createdAt ? dayjs(comment.createdAt).format('DD MMM YYYY HH:mm') : '';

//           if (index % 2 === 0) {
//             doc.setFillColor(250, 252, 255);
//             const commentLines = doc.splitTextToSize(commentText, contentWidth - 20);
//             doc.rect(margin, yPosition - 3, contentWidth, commentLines.length * 6 + 18, 'F');
//           }

//           doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
//           doc.circle(margin + 5, yPosition + 3, 3, 'F');
//           const initials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
//           doc.setTextColor(255, 255, 255);
//           doc.setFontSize(6);
//           doc.setFont(undefined, 'bold');
//           doc.text(initials, margin + 3.5, yPosition + 4);

//           doc.setFontSize(9);
//           doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
//           doc.setFont(undefined, 'bold');
//           doc.text(authorName, margin + 12, yPosition + 3);

//           doc.setFontSize(8);
//           doc.setFont(undefined, 'normal');
//           doc.setTextColor(100, 100, 100);
//           doc.text(`(${authorRole})`, margin + 50, yPosition + 3);

//           doc.text(commentDate, margin + 130, yPosition + 3);

//           yPosition += 10;

//           doc.setFontSize(9);
//           doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
//           const commentLines = doc.splitTextToSize(commentText, contentWidth - 20);
//           commentLines.forEach((line) => {
//             doc.text(line, margin + 12, yPosition);
//             yPosition += 6;
//           });

//           yPosition += 8;

//           if (yPosition > 240) {
//             doc.addPage();
//             yPosition = 20;
//           }
//         });

//         yPosition += 2;
//       }

//       yPosition += 10;

//       // Save PDF
//       doc.save(`deferral_${deferral.deferralNumber || "report"}.pdf`);
//       message.success("Deferral downloaded as PDF successfully!");
//     } catch (error) {
//       console.error("PDF generation error:", error);
//       message.error("Failed to generate PDF");
//     } finally {
//       setDownloadLoading(false);
//     }
//   };

//   if (!deferral) return null;

//   const status = deferral.status || 'deferral_requested';
//   const loanAmountValue = Number(deferral.loanAmount || deferral.amount || deferral.loan_amount || 0);
//   const formattedLoanAmount = loanAmountValue ? `${(loanAmountValue / 1000000).toFixed(0)} M` : 'Not specified';
//   const isUnder75 = loanAmountValue > 0 && loanAmountValue < 75000000;

//   // Build a consolidated history: initial request, stored history entries, and approval events
//   const history = (function buildHistory() {
//     const events = [];

//     // Initial request - show requestor's real name and role
//     const requesterName =
//       deferral.requestor?.name ||
//       deferral.requestedBy?.name ||
//       deferral.requestedBy ||
//       deferral.rmRequestedBy?.name ||
//       deferral.rmName ||
//       deferral.createdBy?.name ||
//       deferral.createdBy?.fullName ||
//       deferral.createdByName ||
//       deferral.createdByUser?.name ||
//       'Requestor';

//     const requesterRole =
//       deferral.requestor?.role ||
//       deferral.requestedBy?.role ||
//       deferral.rmRequestedBy?.role ||
//       deferral.createdBy?.role ||
//       deferral.requestedByRole ||
//       'RM';
//     events.push({
//       user: requesterName,
//       userRole: requesterRole,
//       date: deferral.requestedDate || deferral.createdAt,
//       comment: deferral.rmReason || 'Deferral request submitted'
//     });

//     // Add RM's posted comments (if any)
//     if (deferral.comments && Array.isArray(deferral.comments) && deferral.comments.length > 0) {
//       deferral.comments.forEach(c => {
//         const commentAuthorName = c.author?.name || c.authorName || c.userName || c.author?.email || 'RM';
//         const commentAuthorRole = c.author?.role || c.authorRole || c.role || 'RM';
//         events.push({
//           user: commentAuthorName,
//           userRole: commentAuthorRole,
//           date: c.createdAt,
//           comment: c.text || ''
//         });
//       });
//     }

//     // Stored history entries - filter out redundant 'moved' entries
//     if (deferral.history && Array.isArray(deferral.history) && deferral.history.length > 0) {
//       deferral.history.forEach(h => {
//         // Skip redundant 'moved' action entries - they're implicit when the next approver approves
//         if (h.action === 'moved') {
//           return;
//         }

//         const userName = h.user?.name || h.userName || h.authorName || h.user || 'System';
//         const userRole = h.user?.role || h.userRole || h.authorRole || h.role || undefined;
//         events.push({ user: userName, userRole: userRole, date: h.date || h.createdAt || h.timestamp || h.entryDate, comment: h.comment || h.notes || h.message || '' });
//       });
//     }

//     // Sort events by date ascending
//     return events.sort((a, b) => (new Date(a.date || 0)) - (new Date(b.date || 0)));
//   })();

//   // Create attachments array from your data structure
//   const attachments = deferral.attachments || [
//     {
//       id: "att1",
//       name: `${deferral.document}.pdf`,
//       size: "1.5 MB",
//       type: "pdf",
//       uploadDate: deferral.requestedDate
//     }
//   ];

//   // Documents categorization (requested, DCL, additional)
//   const requestedDocs = (deferral.selectedDocuments || []).map((d, i) => {
//     const name = typeof d === 'string' ? d : d.name || d.label || 'Document';
//     const subItems = [];
//     if (d && typeof d === 'object') {
//       if (Array.isArray(d.items) && d.items.length) subItems.push(...d.items);
//       else if (Array.isArray(d.selected) && d.selected.length) subItems.push(...d.selected);
//       else if (Array.isArray(d.subItems) && d.subItems.length) subItems.push(...d.subItems);
//       else if (d.item) subItems.push(d.item);
//       else if (d.selected) subItems.push(d.selected);
//     }
//     return { id: `req_${i}`, name, type: d.type || '', subItems, source: 'selected' };
//   });

//   const storedDocs = (deferral.documents || []).map((d, i) => {
//     const name = (d.name || '').toString();
//     const isDCL = (typeof d.isDCL !== 'undefined' && d.isDCL) || /dcl/i.test(name) || (deferral.dclNumber && name.toLowerCase().includes((deferral.dclNumber || '').toLowerCase()));
//     const isAdditional = (typeof d.isAdditional !== 'undefined') ? d.isAdditional : !isDCL;
//     return {
//       id: d._id || `doc_${i}`,
//       name: d.name,
//       type: d.type || (d.name ? d.name.split('.').pop().toLowerCase() : ''),
//       url: d.url,
//       size: d.size || null,
//       uploadDate: d.uploadDate || d.uploadedAt || null,
//       isDCL,
//       isAdditional
//     };
//   });

//   const dclDocs = storedDocs.filter(s => s.isDCL);
//   const additionalDocs = storedDocs.filter(s => s.isAdditional);

//   // Find uploaded versions for requested docs
//   const requestedWithUploads = requestedDocs.map(r => {
//     const match = storedDocs.find(s => s.name && r.name && s.name.toLowerCase().includes(r.name.toLowerCase()));
//     return { ...r, uploaded: !!match, uploadedMeta: match || null };
//   });

//   return (
//     <>
//       <style>{customStyles}</style>
//       <Modal
//         title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BankOutlined /> <span>Deferral Request: {deferral.deferralNumber}</span></div>}
//         open={open}
//         onCancel={onClose}
//         width={950}
//         styles={{ body: { padding: "0 24px 24px" } }}
//         footer={[
//           <Button
//             key="download"
//             type="primary"
//             icon={<FilePdfOutlined />}
//             onClick={downloadDeferralAsPDF}
//             loading={downloadLoading}
//             style={{ marginRight: 'auto', backgroundColor: '#164679', borderColor: '#164679' }}
//           >
//             Download as PDF
//           </Button>,
//           <Button key="close" onClick={onClose}>
//             Close
//           </Button>,
//           <Button
//             key="rework"
//             onClick={handleReturnForRework}
//             loading={returnReworkLoading}
//             disabled={returnReworkLoading}
//             style={{
//               borderColor: WARNING_ORANGE,
//               color: WARNING_ORANGE,
//               fontWeight: 600
//             }}
//           >
//             Return for Rework
//           </Button>,
//           (deferral.status === "pending_approval" || deferral.status === "in_review" || deferral.status === "deferral_requested") ? (
//             <Button
//               key="reject"
//               danger
//               icon={<CloseOutlined />}
//               onClick={handleReject}
//               loading={rejecting}
//               disabled={rejecting}
//             >
//               Reject
//             </Button>
//           ) : null,
//           (deferral.status === "pending_approval" || deferral.status === "in_review" || deferral.status === "deferral_requested") ? (
//             <Button
//               key="approve"
//               type="primary"
//               style={{ backgroundColor: SUCCESS_GREEN, borderColor: SUCCESS_GREEN }}
//               icon={<CheckOutlined />}
//               onClick={handleApprove}
//               loading={approveLoading}
//               disabled={approveLoading}
//             >
//               Approve
//             </Button>
//           ) : null
//         ].filter(Boolean)}
//       >
//         {deferral && (
//           <>
//             <Card className="deferral-info-card" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Customer Information</span>} style={{ marginBottom: 18, marginTop: 24 }}>
//               <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
//                 <Descriptions.Item label="Customer Name"><Text strong style={{ color: PRIMARY_BLUE }}>{deferral.customerName}</Text></Descriptions.Item>
//                 <Descriptions.Item label="Customer Number"><Text strong style={{ color: PRIMARY_BLUE }}>{deferral.customerNumber}</Text></Descriptions.Item>
//                 <Descriptions.Item label="Loan Type"><Text strong style={{ color: PRIMARY_BLUE }}>{deferral.loanType}</Text></Descriptions.Item>
//                 <Descriptions.Item label="Created At"><div><Text strong style={{ color: PRIMARY_BLUE }}>{dayjs(deferral.createdAt || deferral.requestedDate).format('DD MMM YYYY')}</Text><Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>{dayjs(deferral.createdAt || deferral.requestedDate).format('HH:mm')}</Text></div></Descriptions.Item>
//               </Descriptions>
//             </Card>

//             {/* Deferral Details Card */}
//             <Card
//               className="deferral-info-card"
//               size="small"
//               title={
//                 <span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>
//                   Deferral Details
//                 </span>
//               }
//               style={{
//                 marginBottom: 18,
//                 marginTop: 0,
//                 borderRadius: 10,
//                 border: `1px solid #e0e0e0`,
//               }}
//             >
//               <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
//                 <Descriptions.Item label="Deferral Number">
//                   <Text strong style={{ color: PRIMARY_BLUE }}>
//                     {deferral.deferralNumber}
//                   </Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="DCL No">
//                   {deferral.dclNumber}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Status"><div style={{ fontWeight: 500 }}>{status === 'deferral_requested' ? 'Pending' : status}</div></Descriptions.Item>

//                 <Descriptions.Item label="Loan Amount">
//                   <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12 }}>
//                     {(function () {
//                       const amt = Number(deferral.loanAmount || 0);
//                       if (!amt) return 'Not specified';
//                       const isAbove75 = amt > 75 && amt <= 1000 ? true : (amt > 75000000 ? true : false);
//                       return isAbove75 ? <Tag color={'red'} style={{ fontSize: 12 }}>Above 75 million</Tag> : <span style={{ color: SUCCESS_GREEN, fontWeight: 600 }}>Under 75 million</span>;
//                     })()}
//                   </div>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Days Sought"><div style={{ fontWeight: "bold", color: deferral.daysSought > 45 ? ERROR_RED : deferral.daysSought > 30 ? WARNING_ORANGE : PRIMARY_BLUE, fontSize: 14 }}>{deferral.daysSought || 0} days</div></Descriptions.Item>
//                 <Descriptions.Item label="Next Due Date"><div style={{ color: (deferral.nextDueDate || deferral.nextDocumentDueDate || deferral.requestedExpiry) ? (dayjs(deferral.nextDueDate || deferral.nextDocumentDueDate || deferral.requestedExpiry).isBefore(dayjs()) ? ERROR_RED : SUCCESS_GREEN) : PRIMARY_BLUE }}>{(deferral.nextDueDate || deferral.nextDocumentDueDate || deferral.requestedExpiry) ? dayjs(deferral.nextDueDate || deferral.nextDocumentDueDate || deferral.requestedExpiry).format('DD MMM YYYY') : 'Not calculated'}</div></Descriptions.Item>

//                 <Descriptions.Item label="Current Approver">{deferral.approvers?.find(a => a.isCurrent)?.name || "You"}</Descriptions.Item>
//                 <Descriptions.Item label="SLA Expiry"><div style={{ color: deferral.slaExpiry && dayjs(deferral.slaExpiry).isBefore(dayjs()) ? ERROR_RED : PRIMARY_BLUE }}>{deferral.slaExpiry ? dayjs(deferral.slaExpiry).format('DD MMM YYYY HH:mm') : 'Not set'}</div></Descriptions.Item>
//               </Descriptions>
//             </Card>

//             {deferral.deferralDescription && (
//               <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0', marginBottom: 18 }}>
//                 <Text strong style={{ display: 'block', marginBottom: 8 }}>Deferral Description</Text>
//                 <div style={{ padding: 12, backgroundColor: '#f8f9fa', borderRadius: 6, border: '1px solid #e8e8e8' }}>
//                   <Text>{deferral.deferralDescription}</Text>
//                 </div>
//               </div>
//             )}

//             {requestedWithUploads && requestedWithUploads.length > 0 ? (
//               <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}>Documents Requested for Deferrals ({requestedWithUploads.length})</span>} style={{ marginBottom: 18 }}>
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
//                   {requestedWithUploads.map((doc, idx) => (
//                     <div key={doc.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: doc.uploadedMeta ? '#f6ffed' : '#fff7e6', borderRadius: 6, border: doc.uploadedMeta ? '1px solid #b7eb8f' : '1px solid #ffd591' }}>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                         <FileDoneOutlined style={{ color: doc.uploadedMeta ? SUCCESS_GREEN : WARNING_ORANGE, fontSize: 16 }} />
//                         <div>
//                           <div style={{ fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
//                             {doc.name}
//                             <Tag color={doc.uploadedMeta ? 'green' : 'orange'} style={{ fontSize: 10 }}>{doc.uploadedMeta ? 'Uploaded' : 'Requested'}</Tag>
//                           </div>
//                           {doc.subItems && doc.subItems.length > 0 && (<div style={{ fontSize: 12, color: '#333', marginTop: 4 }}><b>Selected:</b> {doc.subItems.join(', ')}</div>)}
//                           {doc.uploadedMeta && (<div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Uploaded as: {doc.uploadedMeta.name} {doc.uploadedMeta.uploadDate ? `• ${dayjs(doc.uploadedMeta.uploadDate).format('DD MMM YYYY HH:mm')}` : ''}</div>)}
//                         </div>
//                       </div>
//                       <Space>
//                         {doc.uploadedMeta && doc.uploadedMeta.url && (<><Button type="text" icon={<EyeOutlined />} onClick={() => openFileInNewTab(doc.uploadedMeta.url)} size="small">View</Button><Button type="text" icon={<DownloadOutlined />} onClick={() => { downloadFile(doc.uploadedMeta.url, doc.uploadedMeta.name); message.success(`Downloading ${doc.uploadedMeta.name}...`); }} size="small">Download</Button></>)}
//                       </Space>
//                     </div>
//                   ))}
//                 </div>
//               </Card>
//             ) : (deferral.selectedDocuments && deferral.selectedDocuments.length > 0 ? (
//               <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}>Documents Requested for Deferrals</span>} style={{ marginBottom: 18 }}>
//                 <div style={{ color: '#999' }}>{deferral.selectedDocuments.join(', ')}</div>
//               </Card>
//             ) : null)}

//             {deferral.facilities && deferral.facilities.length > 0 && (
//               <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}>Facility Details ({deferral.facilities.length})</span>} style={{ marginBottom: 18, marginTop: 12 }}>
//                 <Table dataSource={deferral.facilities} columns={getFacilityColumns()} pagination={false} size="small" rowKey={(r) => r.facilityNumber || r._id || `facility-${Math.random().toString(36).slice(2)}`} scroll={{ x: 600 }} />
//               </Card>
//             )}

//             <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}>Mandatory: DCL Upload {dclDocs.length > 0 ? '✓' : ''}</span>} style={{ marginBottom: 18 }}>
//               {dclDocs.length > 0 ? (
//                 <>
//                   <List
//                     size="small"
//                     dataSource={dclDocs}
//                     renderItem={(doc) => (
//                       <List.Item
//                         actions={[
//                           doc.url ? <Button key="view" type="link" onClick={() => openFileInNewTab(doc.url)} size="small">View</Button> : null,
//                           doc.url ? <Button key="download" type="link" onClick={() => { downloadFile(doc.url, doc.name); message.success(`Downloading ${doc.name}...`); }} size="small">Download</Button> : null,
//                         ].filter(Boolean)}
//                       >
//                         <List.Item.Meta
//                           avatar={getFileIcon(doc.type)}
//                           title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 500 }}>{doc.name}</span><Tag color="red" style={{ fontSize: 10, padding: '0 6px' }}>DCL Document</Tag></div>}
//                           description={<div style={{ fontSize: 12, color: '#666' }}>{doc.size && (<span>{doc.size > 1024 ? `${(doc.size / 1024).toFixed(2)} MB` : `${doc.size} KB`}</span>)} {doc.uploadDate && (<span style={{ marginLeft: 8 }}>Uploaded: {dayjs(doc.uploadDate).format('DD MMM YYYY HH:mm')}</span>)} {!doc.url && <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 12 }}>Preview not available</div>}</div>}
//                         />
//                       </List.Item>
//                     )}
//                   />

//                   <div style={{ padding: 8, backgroundColor: '#f6ffed', borderRadius: 4, marginTop: 8 }}>
//                     <Text type="success" style={{ fontSize: 12 }}>✓ DCL document ready: <b>{dclDocs[0].name}</b>{dclDocs.length > 1 ? ` (+${dclDocs.length - 1} more)` : ''}</Text>
//                   </div>
//                 </>
//               ) : (
//                 <div style={{ textAlign: 'center', padding: 12, color: WARNING_ORANGE }}><UploadOutlined style={{ fontSize: 18, marginBottom: 6, color: WARNING_ORANGE }} /><div>No DCL document uploaded</div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>DCL document is required for submission</Text></div>
//               )}
//             </Card>

//             <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}><PaperClipOutlined style={{ marginRight: 8 }} /> Additional Uploaded Documents ({additionalDocs.length})</span>} style={{ marginBottom: 18 }}>
//               {additionalDocs.length > 0 ? (
//                 <>
//                   <List
//                     size="small"
//                     dataSource={additionalDocs}
//                     renderItem={(doc) => (
//                       <List.Item
//                         actions={[
//                           doc.url ? <Button key="view" type="link" onClick={() => openFileInNewTab(doc.url)} size="small">View</Button> : null,
//                           doc.url ? <Button key="download" type="link" onClick={() => { downloadFile(doc.url, doc.name); message.success(`Downloading ${doc.name}...`); }} size="small">Download</Button> : null,
//                         ].filter(Boolean)}
//                       >
//                         <List.Item.Meta
//                           avatar={getFileIcon(doc.type)}
//                           title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 500 }}>{doc.name}</span>{doc.isAdditional && <Tag color="cyan" style={{ fontSize: 10 }}>Additional</Tag>}</div>}
//                           description={<div style={{ fontSize: 12, color: '#666' }}>{doc.size && (<span>{doc.size > 1024 ? `${(doc.size / 1024).toFixed(2)} MB` : `${doc.size} KB`}</span>)} {doc.uploadDate && (<span style={{ marginLeft: 8 }}>Uploaded: {dayjs(doc.uploadDate).format('DD MMM YYYY HH:mm')}</span>)} {!doc.url && <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 12 }}>Preview not available</div>}</div>}
//                         />
//                       </List.Item>
//                     )}
//                   />

//                   <div style={{ padding: 8, backgroundColor: '#f6ffed', borderRadius: 4, marginTop: 8 }}>
//                     <Text type="success" style={{ fontSize: 12 }}>✓ {additionalDocs.length} document{additionalDocs.length !== 1 ? 's' : ''} uploaded</Text>
//                   </div>
//                 </>
//               ) : (
//                 <div style={{ textAlign: 'center', padding: 12, color: '#999' }}><PaperClipOutlined style={{ fontSize: 18, marginBottom: 6, color: '#d9d9d9' }} /><div>No additional documents uploaded</div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>You can upload additional supporting documents if needed</Text></div>
//               )}
//             </Card>

//             {/* Approval Flow */}
//             <Card size="small" title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//               <div><span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>Approval Flow {(deferral.status === 'deferral_requested' || deferral.status === 'pending_approval') && (<Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Pending Approval</Tag>)}</span></div>
//               {null}
//             </div>} style={{ marginBottom: 18 }}>
//               <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
//                 {(deferral.approverFlow && deferral.approverFlow.length > 0) ? (
//                   deferral.approverFlow.map((approver, index) => {
//                     const isCurrentApprover = index === (deferral.currentApproverIndex || 0);
//                     const hasEmail = isCurrentApprover && (deferral.currentApprover?.email || approver.email || (typeof approver === 'string' && approver.includes('@')));
//                     return (
//                       <div key={index} style={{ padding: '12px 16px', backgroundColor: isCurrentApprover ? '#e6f7ff' : '#fafafa', borderRadius: 6, border: isCurrentApprover ? `2px solid ${PRIMARY_BLUE}` : '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 12 }}>
//                         <Badge count={index + 1} style={{ backgroundColor: isCurrentApprover ? PRIMARY_BLUE : '#bfbfbf', fontSize: 12, height: 24, minWidth: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
//                         <div style={{ flex: 1 }}>
//                           <Text strong style={{ fontSize: 14 }}>{typeof approver === 'object' ? (approver.name || approver.user?.name || approver.email || approver.role || String(approver)) : approver}</Text>
//                           {isCurrentApprover && (
//                             <div style={{ fontSize: 12, color: PRIMARY_BLUE, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
//                               <ClockCircleOutlined style={{ fontSize: 11 }} />
//                               Current Approver • Pending Approval
//                               {deferral.slaExpiry && (
//                                 <span style={{ marginLeft: 8, color: WARNING_ORANGE }}>SLA: {dayjs(deferral.slaExpiry).format('DD MMM HH:mm')}</span>
//                               )}
//                             </div>
//                           )}
//                         </div>

//                         {isCurrentApprover && hasEmail && (
//                           <div style={{ fontSize: 12, color: '#666', marginLeft: 'auto' }}>
//                             <MailOutlined style={{ marginRight: 4 }} />{deferral.currentApprover?.email || approver.email || (typeof approver === 'string' ? approver : '')}
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })
//                 ) : (deferral.approvers && deferral.approvers.length > 0) ? (
//                   deferral.approvers.filter(a => a && a !== "").map((approver, index) => {
//                     const isCurrentApprover = index === (deferral.currentApproverIndex || 0);
//                     const hasEmail = isCurrentApprover && (deferral.currentApprover?.email || approver.email || (typeof approver === 'string' && approver.includes('@')));
//                     const isEmail = typeof approver === 'string' && approver.includes('@');
//                     return (
//                       <div key={index} style={{ padding: '12px 16px', backgroundColor: isCurrentApprover ? '#e6f7ff' : '#fafafa', borderRadius: 6, border: isCurrentApprover ? `2px solid ${PRIMARY_BLUE}` : '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 12 }}>
//                         <Badge count={index + 1} style={{ backgroundColor: isCurrentApprover ? PRIMARY_BLUE : '#bfbfbf', fontSize: 12, height: 24, minWidth: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
//                         <div style={{ flex: 1 }}>
//                           <Text strong style={{ fontSize: 14 }}>{typeof approver === 'string' ? (isEmail ? approver.split('@')[0] : approver) : (approver.name || approver.user?.name || approver.email || approver.role || String(approver))}</Text>
//                           {isCurrentApprover && (
//                             <div style={{ fontSize: 12, color: PRIMARY_BLUE, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
//                               <ClockCircleOutlined style={{ fontSize: 11 }} />
//                               Current Approver • Pending Approval
//                               {deferral.slaExpiry && (
//                                 <span style={{ marginLeft: 8, color: WARNING_ORANGE }}>SLA: {dayjs(deferral.slaExpiry).format('DD MMM HH:mm')}</span>
//                               )}
//                             </div>
//                           )}
//                         </div>

//                         {isCurrentApprover && hasEmail && (
//                           <div style={{ fontSize: 12, color: '#666', marginLeft: 'auto' }}>
//                             <MailOutlined style={{ marginRight: 4 }} />{(typeof approver === 'string' ? (isEmail ? approver : '') : (approver.email || deferral.currentApprover?.email || ''))}
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })
//                 ) : (
//                   <div style={{ textAlign: 'center', padding: 16, color: '#999' }}>
//                     <UserOutlined style={{ fontSize: 24, marginBottom: 8, color: '#d9d9d9' }} />
//                     <div>No approvers specified</div>
//                   </div>
//                 )}


//               </div>
//             </Card>

//             {/* Comment Trail & History */}            <div style={{ marginTop: 24 }}>
//               <h4>Comment Trail & History</h4>
//               <CommentTrail
//                 history={history}
//                 isLoading={loadingComments}
//               />
//             </div>

//             {/* Approve Confirmation Modal */}
//             <Modal
//               title={`Approve Deferral Request: ${deferral.deferralNumber}`}
//               open={showApproveConfirm}
//               onCancel={() => setShowApproveConfirm(false)}
//               okText={'Yes, Approve'}
//               okType={'primary'}
//               okButtonProps={{ style: { background: SUCCESS_GREEN, borderColor: SUCCESS_GREEN } }}
//               cancelText={'Cancel'}
//               confirmLoading={approveLoading}
//               onOk={doApprove}
//             >
//               <div>
//                 <p>Are you sure you want to approve this deferral request?</p>
//                 <p><strong>{deferral?.deferralNumber}</strong> - {deferral?.customerName}</p>
//                 <p>Days Sought: <strong>{deferral?.daysSought}</strong> days</p>
//                 {deferral?.category === "Non-Allowable" && (
//                   <p style={{ color: ERROR_RED, fontWeight: 'bold' }}>
//                     ⚠️ This is a Non-Allowable document
//                   </p>
//                 )}
//                 <p style={{ marginBottom: 6 }}>Add approval comment (optional):</p>
//                 <Input.TextArea
//                   rows={4}
//                   value={approvalComment}
//                   onChange={(e) => setApprovalComment(e.target.value)}
//                   placeholder="Enter approval comment..."
//                 />
//               </div>
//             </Modal>

//             {/* Reject Confirmation Modal */}
//             <Modal
//               title={`Reject Deferral Request: ${deferral.deferralNumber}`}
//               open={showRejectConfirm}
//               onCancel={() => setShowRejectConfirm(false)}
//               okText={'Yes, Reject'}
//               okType={'danger'}
//               okButtonProps={{ style: { background: ERROR_RED, borderColor: ERROR_RED, color: 'white' } }}
//               cancelText={'Cancel'}
//               confirmLoading={rejecting}
//               onOk={doReject}
//             >
//               <div>
//                 <p>Are you sure you want to reject this deferral request?</p>
//                 <p><strong>{deferral?.deferralNumber}</strong> - {deferral?.customerName}</p>
//                 <p>Days Sought: <strong>{deferral?.daysSought}</strong> days</p>
//                 <p style={{ marginBottom: 6 }}>Please provide a reason for rejection (required):</p>
//                 <Input.TextArea
//                   rows={4}
//                   value={rejectComment}
//                   onChange={(e) => setRejectComment(e.target.value)}
//                   placeholder="Enter rejection reason..."
//                   required
//                 />
//                 {!rejectComment || rejectComment.trim() === '' ? (
//                   <p style={{ color: ERROR_RED, fontSize: 12, marginTop: 4 }}>
//                     Rejection reason is required
//                   </p>
//                 ) : null}
//               </div>
//             </Modal>

//             {/* Return for Rework Confirmation Modal */}
//             <Modal
//               title={`Return for Rework: ${deferral.deferralNumber}`}
//               open={showReworkConfirm}
//               onCancel={() => setShowReworkConfirm(false)}
//               okText={'Yes, Return for Rework'}
//               okType={'warning'}
//               okButtonProps={{ style: { background: WARNING_ORANGE, borderColor: WARNING_ORANGE } }}
//               cancelText={'Cancel'}
//               confirmLoading={returnReworkLoading}
//               onOk={doReturnForRework}
//             >
//               <div>
//                 <p>Are you sure you want to return this deferral for rework?</p>
//                 <p><strong>{deferral?.deferralNumber}</strong> - {deferral?.customerName}</p>
//                 <p>This will return the deferral back to the Relationship Manager for corrections.</p>
//                 <p style={{ marginBottom: 6 }}>Please provide rework instructions for the Relationship Manager (required):</p>
//                 <Input.TextArea
//                   rows={4}
//                   value={reworkComment}
//                   onChange={(e) => setReworkComment(e.target.value)}
//                   placeholder="Enter rework instructions for the Relationship Manager..."
//                   required
//                 />
//                 {!reworkComment || reworkComment.trim() === '' ? (
//                   <p style={{ color: ERROR_RED, fontSize: 12, marginTop: 4 }}>
//                     Rework instructions are required
//                   </p>
//                 ) : null}
//                 <p style={{ marginTop: 12, fontSize: 12, color: '#666', fontStyle: 'italic' }}>
//                   Note: The Relationship Manager will receive these instructions and need to resubmit the deferral request.
//                 </p>
//               </div>
//             </Modal>


//           </>
//         )}
//       </Modal>
//     </>
//   );
// };

// const MyQueue = () => {
//   const navigate = useNavigate();
//   const [searchText, setSearchText] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [priorityFilter, setPriorityFilter] = useState("all");
//   const [dateRange, setDateRange] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("deferrals");
//   const token = useSelector(state => state.auth.token);

//   // Fetch pending extension applications
//   const { data: queueExtensions = [], isLoading: extensionsLoading } = useGetApproverExtensionsQuery();

//   // Extension approval/rejection mutations
//   const [approveExtension, { isLoading: approvingExtension }] = useApproveExtensionMutation();
//   const [rejectExtension, { isLoading: rejectingExtension }] = useRejectExtensionMutation();

//   // State for modal
//   const [selectedDeferral, setSelectedDeferral] = useState(null);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [newComment, setNewComment] = useState("");
//   const [postingComment, setPostingComment] = useState(false);

//   // Extension approval handlers
//   const handleApproveExtension = async (extensionId, comment) => {
//     try {
//       await approveExtension({ id: extensionId, comment }).unwrap();
//       message.success('Extension approved successfully');
//     } catch (error) {
//       message.error('Failed to approve extension');
//       throw error;
//     }
//   };

//   const handleRejectExtension = async (extensionId, reason) => {
//     try {
//       await rejectExtension({ id: extensionId, reason }).unwrap();
//       message.success('Extension rejected successfully');
//     } catch (error) {
//       message.error('Failed to reject extension');
//       throw error;
//     }
//   };

//   // Live data - load pending deferrals from API
//   const [deferrals, setDeferrals] = useState([]);

//   // Fetch data on component mount
//   useEffect(() => {
//     fetchDeferrals();
//   }, []);

//   const fetchDeferrals = async () => {
//     setIsLoading(true);
//     try {
//       const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deferrals/approver/queue`, {
//         headers: token ? { authorization: `Bearer ${token}` } : {},
//       });
//       if (!res.ok) throw new Error('Failed to fetch');
//       const data = await res.json();
//       setDeferrals(data);
//     } catch (error) {
//       message.error('Failed to load deferral requests');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Filtered deferrals - All in one table
//   const filteredDeferrals = useMemo(() => {
//     let filtered = [...deferrals];

//     // Get current user ID from localStorage
//     const stored = JSON.parse(localStorage.getItem('user') || 'null');
//     const currentUserId = stored?.user?._id;

//     // Filter out deferrals where current user is NOT the current approver OR has already approved
//     if (currentUserId) {
//       filtered = filtered.filter(d => {
//         // Get the approvers array
//         const approvers = d.approvers || [];
//         const currentApproverIndex = d.currentApproverIndex ?? 0;

//         // Check if this user has already approved
//         const userApproval = approvers.find(a => {
//           const approverId = a.user?._id || a.user || a.userId?._id || a.userId;
//           return approverId === currentUserId;
//         });

//         // If user has approved=true, exclude from queue
//         if (userApproval && userApproval.approved === true) {
//           return false;
//         }

//         // Also check if user is the current approver (double-check)
//         const currentApprover = approvers[currentApproverIndex];
//         if (!currentApprover) return true;

//         const currentApproverId = currentApprover.user?._id || currentApprover.user || currentApprover.userId?._id || currentApprover.userId;

//         // Only show if user is the current approver AND hasn't approved yet
//         return currentApproverId === currentUserId;
//       });
//     }

//     // Search filtering
//     if (searchText) {
//       const q = searchText.toLowerCase();
//       filtered = filtered.filter(d =>
//         d.customerName.toLowerCase().includes(q) ||
//         d.dclNumber.toLowerCase().includes(q) ||
//         d.deferralNumber.toLowerCase().includes(q) ||
//         d.requestedBy.toLowerCase().includes(q) ||
//         d.customerNumber.toLowerCase().includes(q) ||
//         d.document.toLowerCase().includes(q)
//       );
//     }

//     // Status filter
//     if (statusFilter !== "all") {
//       filtered = filtered.filter(d => d.status === statusFilter);
//     }

//     // Priority filter
//     if (priorityFilter !== "all") {
//       filtered = filtered.filter(d => d.priority === priorityFilter);
//     }

//     // Date range filtering
//     if (dateRange && dateRange.length === 2) {
//       const [start, end] = dateRange;
//       filtered = filtered.filter(d => {
//         const requestDate = dayjs(d.requestedDate);
//         return requestDate.isAfter(start) && requestDate.isBefore(end);
//       });
//     }

//     return filtered;
//   }, [deferrals, searchText, statusFilter, priorityFilter, dateRange]);

//   // Handle actions from modal
//   const handleModalAction = (action, deferralId, data) => {
//     switch (action) {
//       case 'addComment':
//         // Optimistically add comment to history locally but avoid adding duplicates
//         setDeferrals(prev => prev.map(d => {
//           if (d._id !== deferralId && d.id !== deferralId) return d;
//           const existing = d.history || [];
//           const last = existing.length ? existing[existing.length - 1] : null;
//           const isDup = last && last.comment === data.comment && last.user === data.user && last.date === data.date;
//           if (isDup) return d;
//           return { ...d, history: [...existing, data] };
//         }));

//         // If the modal is currently open for the same deferral, update it too so UI reflects change immediately
//         setSelectedDeferral(prev => {
//           if (!prev || (prev._id !== deferralId && prev.id !== deferralId)) return prev;
//           const existing = prev.history || [];
//           const last = existing.length ? existing[existing.length - 1] : null;
//           const isDup = last && last.comment === data.comment && last.user === data.user && last.date === data.date;
//           if (isDup) return prev;
//           return { ...prev, history: [...existing, data] };
//         });

//         break;
//       case 'approve':
//       case 'reject':
//       case 'returnForRework':
//         // Remove the deferral from the queue immediately after it's returned for rework, rejected, or approved
//         setDeferrals(prev => prev.filter(d => (d._id || d.id) !== deferralId));
//         setSelectedDeferral(null);
//         setModalOpen(false);
//         break;
//       case 'refreshQueue':
//         // Refresh approver queue from the server to reflect state changes
//         fetchDeferrals();
//         break;
//       case 'gotoActioned':
//         // Navigate user to the Actioned tab so they can see items they've actioned
//         navigate('/approver/actioned');
//         break;
//       default:
//         break;
//     }
//   };



//   // Standardized Columns for the table - REMOVED TAGS FROM STATUS AND DAYS SOUGHT, REMOVED ACTIONS COLUMN
//   const columns = [
//     {
//       title: "Deferral No",
//       dataIndex: "deferralNumber",
//       width: 120,
//       fixed: "left",
//       render: (deferralNumber) => (
//         <div style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
//           <FileTextOutlined style={{ marginRight: 6 }} />
//           {deferralNumber}
//         </div>
//       ),
//     },
//     {
//       title: "DCL No",
//       dataIndex: "dclNumber",
//       width: 100,
//     },
//     {
//       title: "Customer Name",
//       dataIndex: "customerName",
//       width: 180,
//       render: (name) => (
//         <Text strong style={{ color: PRIMARY_BLUE, fontSize: 13 }}>
//           {name}
//         </Text>
//       ),
//     },
//     {
//       title: "Loan Type",
//       dataIndex: "loanType",
//       width: 120,
//       render: (loanType) => (
//         <div style={{ fontSize: 12, fontWeight: 500 }}>
//           {loanType}
//         </div>
//       ),
//     },

//     {
//       title: "Status",
//       dataIndex: "status",
//       width: 120,
//       render: (status) => {
//         const statusConfig = {
//           pending_approval: { color: WARNING_ORANGE, text: "Pending", icon: <ClockCircleOutlined /> },
//           in_review: { color: PROCESSING_BLUE, text: "In Review", icon: <ClockCircleOutlined /> },
//           approved: { color: SUCCESS_GREEN, text: "Approved", icon: <CheckCircleOutlined /> },
//           rejected: { color: ERROR_RED, text: "Rejected", icon: <CloseCircleOutlined /> },
//         };
//         const config = statusConfig[status] || { color: "default", text: status };
//         return (
//           <div style={{
//             fontSize: 12,
//             fontWeight: "bold",
//             color: config.color === "orange" ? WARNING_ORANGE :
//               config.color === "blue" ? PROCESSING_BLUE :
//                 config.color === "green" ? SUCCESS_GREEN :
//                   config.color === "red" ? ERROR_RED : "#666",
//             display: "flex",
//             alignItems: "center",
//             gap: 4
//           }}>
//             {config.icon}
//             {config.text}
//           </div>
//         );
//       },
//     },
//     {
//       title: "Days Sought",
//       dataIndex: "daysSought",
//       width: 100,
//       align: "center",
//       render: (daysSought) => (
//         <div style={{
//           fontWeight: "bold",
//           color: daysSought > 45 ? ERROR_RED :
//             daysSought > 30 ? WARNING_ORANGE :
//               daysSought > 15 ? PROCESSING_BLUE :
//                 SUCCESS_GREEN,
//           fontSize: 13,
//           padding: "2px 8px",
//           borderRadius: 4,
//           display: "inline-block"
//         }}>
//           {daysSought} days
//         </div>
//       ),
//     },
//     {
//       title: "SLA",
//       dataIndex: "slaExpiry",
//       width: 100,
//       render: (date, record) => {
//         if (record.status !== "pending_approval" && record.status !== "in_review") {
//           return <div style={{ fontSize: 11, color: "#999" }}>N/A</div>;
//         }

//         const hoursLeft = dayjs(date).diff(dayjs(), 'hours');
//         let color = SUCCESS_GREEN;
//         let text = `${Math.ceil(hoursLeft / 24)}d`;

//         if (hoursLeft <= 0) {
//           color = ERROR_RED;
//           text = 'Expired';
//         } else if (hoursLeft <= 24) {
//           color = ERROR_RED;
//           text = `${hoursLeft}h`;
//         } else if (hoursLeft <= 72) {
//           color = WARNING_ORANGE;
//         }

//         return (
//           <div style={{
//             color: color,
//             fontWeight: "bold",
//             fontSize: 11,
//             padding: "2px 8px",
//             borderRadius: 4,
//             backgroundColor: `${color}10`,
//             display: "inline-block"
//           }}>
//             {text}
//           </div>
//         );
//       },
//     },
//   ];



//   // Custom table styles
//   const tableStyles = `
//     .myqueue-table .ant-table-wrapper {
//       border-radius: 12px;
//       overflow: hidden;
//       box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
//       border: 1px solid #e0e0e0;
//     }
//     .myqueue-table .ant-table-thead > tr > th {
//       background-color: #f7f7f7 !important;
//       color: ${PRIMARY_BLUE} !important;
//       font-weight: 700;
//       border-bottom: 3px solid ${ACCENT_LIME} !important;
//     }
//     .myqueue-table .ant-table-tbody > tr:hover > td {
//       background-color: rgba(181, 211, 52, 0.1) !important;
//       cursor: pointer;
//     }
//   `;

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{tableStyles}</style>

//       {/* Header */}
//       <Card
//         style={{
//           marginBottom: 24,
//           borderLeft: `4px solid ${ACCENT_LIME}`,
//         }}
//       >
//         <h2 style={{ margin: 0, color: PRIMARY_BLUE }}>My Queue</h2>
//         <p style={{ marginTop: 4, color: "#666" }}>
//           All pending deferrals and extension applications
//         </p>
//       </Card>

//       {/* Tabs */}
//       <Tabs
//         activeKey={activeTab}
//         onChange={(key) => setActiveTab(key)}
//         type="card"
//         style={{ marginBottom: 16 }}
//       >
//         <Tabs.TabPane
//           tab={`Deferrals (${filteredDeferrals.length})`}
//           key="deferrals"
//         >
//           {/* Search Filter Only */}
//           <Card size="small" style={{ marginBottom: 16 }}>
//             <Row gutter={16}>
//               <Col md={12}>
//                 <Input
//                   prefix={<SearchOutlined />}
//                   placeholder="Search by Customer, DCL, or ID"
//                   value={searchText}
//                   onChange={(e) => setSearchText(e.target.value)}
//                   allowClear
//                   size="large"
//                 />
//               </Col>
//             </Row>
//           </Card>

//           {/* Main Table */}
//           <Card>
//             <div className="myqueue-table">
//               <Table
//                 columns={columns}
//                 dataSource={filteredDeferrals}
//                 rowKey={(record) => record._id || record.id || `row-${Math.random()}`}
//                 pagination={{
//                   pageSize: 10,
//                   showSizeChanger: true,
//                   showQuickJumper: true,
//                   showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
//                 }}
//                 loading={isLoading}
//                 scroll={{ x: 1200 }}
//                 size="middle"
//                 locale={{
//                   emptyText: (
//                     <Empty
//                       description={
//                         filteredDeferrals.length === 0 && deferrals.length > 0
//                           ? "No deferrals match your filters"
//                           : "No deferral requests in your queue"
//                       }
//                     />
//                   ),
//                 }}
//                 onRow={(record) => ({
//                   onClick: () => {
//                     setSelectedDeferral(record);
//                     setModalOpen(true);
//                   },
//                 })}
//               />
//             </div>
//           </Card>
//         </Tabs.TabPane>

//         <Tabs.TabPane
//           tab={`Extension Applications (${queueExtensions.length})`}
//           key="extensions"
//         >
//           <ApproverExtensionTab
//             extensions={queueExtensions}
//             loading={extensionsLoading}
//             onApprove={handleApproveExtension}
//             onReject={handleRejectExtension}
//             approvingId={undefined}
//             rejectingId={undefined}
//             tabType="queue"
//           />
//         </Tabs.TabPane>
//       </Tabs>

//       {/* Deferral Details Modal */}
//       {selectedDeferral && (
//         <DeferralDetailsModal
//           deferral={selectedDeferral}
//           open={modalOpen}
//           token={token}
//           onClose={() => {
//             setModalOpen(false);
//             setSelectedDeferral(null);
//           }}
//           onAction={handleModalAction}
//         />
//       )}
//     </div>
//   );
// };

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
} from "@ant-design/icons";
import dayjs from "dayjs";
import deferralApi from "../../service/deferralApi.js";
import getFacilityColumns from '../../utils/facilityColumns';
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
      const updated = await deferralApi.rejectDeferral(deferral._id || deferral.id, rejectComment);
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
      const primaryBlue = [22, 70, 121];
      const darkGray = [51, 51, 51];
      const successGreen = [82, 196, 26];
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      const loanAmountValue = Number(deferral.loanAmount || deferral.amount || deferral.loan_amount || 0);
      const formattedLoanAmount = loanAmountValue ? `KSh ${loanAmountValue.toLocaleString()}` : 'Not specified';

      // Header
      doc.setFillColor(22, 70, 121);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text(`Deferral Request: ${deferral.deferralNumber || 'N/A'}`, margin, 15);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${dayjs().format('DD MMM YYYY HH:mm')}`, margin, 25);
      yPosition = 45;

      // Customer Information
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
      doc.text(deferral.customerName || 'N/A', margin + 50, yPosition + 16);

      doc.setFont(undefined, 'bold');
      doc.text('Customer Number:', margin + 5, yPosition + 24);
      doc.setFont(undefined, 'normal');
      doc.text(deferral.customerNumber || 'N/A', margin + 50, yPosition + 24);

      doc.setFont(undefined, 'bold');
      doc.text('Loan Type:', margin + 110, yPosition + 16);
      doc.setFont(undefined, 'normal');
      doc.text(deferral.loanType || 'N/A', margin + 135, yPosition + 16);

      yPosition += 45;

      // Deferral Details
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
      doc.text(deferral.deferralNumber || 'N/A', margin + 45, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('DCL No:', margin + 5, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(deferral.dclNo || deferral.dclNumber || 'N/A', margin + 45, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Status:', margin + 5, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(deferral.status || 'Pending', margin + 45, detailY);

      detailY = yPosition + 16;
      doc.setFont(undefined, 'bold');
      doc.text('Current Approver:', margin + 105, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(deferral.currentApprover?.name || deferral.currentApprover || 'N/A', margin + 145, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('SLA Expiry:', margin + 105, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(deferral.slaExpiry ? dayjs(deferral.slaExpiry).format('DD MMM YYYY HH:mm') : 'Not set', margin + 145, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Created At:', margin + 105, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(dayjs(deferral.createdAt || deferral.requestedDate).format('DD MMM YYYY HH:mm'), margin + 145, detailY);

      yPosition += 75;

      // Loan Information
      const isUnder75M = loanAmountValue > 0 && loanAmountValue < 75000000;
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
      const daysColor = deferral.daysSought > 45 ? [255, 77, 79] : deferral.daysSought > 30 ? [250, 173, 20] : darkGray;
      doc.setTextColor(daysColor[0], daysColor[1], daysColor[2]);
      doc.text(`${deferral.daysSought || 0} days`, margin + 40, loanY);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

      loanY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Next Due Date:', margin + 5, loanY);
      doc.setFont(undefined, 'normal');
      const nextDue = deferral.nextDueDate || deferral.nextDocumentDueDate || deferral.requestedExpiry;
      doc.text(nextDue ? dayjs(nextDue).format('DD MMM YYYY') : 'Not calculated', margin + 40, loanY);

      loanY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('SLA Expiry:', margin + 5, loanY);
      doc.setFont(undefined, 'normal');
      doc.text(deferral.slaExpiry ? dayjs(deferral.slaExpiry).format('DD MMM YYYY') : 'Not set', margin + 40, loanY);

      yPosition += 47;

      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }

      // Facilities
      if (deferral.facilities && deferral.facilities.length > 0) {
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
        deferral.facilities.forEach((facility, index) => {
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

      // Description
      if (deferral.deferralDescription) {
        doc.setFillColor(255, 250, 205);
        const descLines = doc.splitTextToSize(deferral.deferralDescription, contentWidth - 20);
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

      // Approval Flow with badges
      if (deferral.approverFlow && deferral.approverFlow.length > 0) {
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
        deferral.approverFlow.forEach((approver, index) => {
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
      if (deferral.documents && deferral.documents.length > 0) {
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
        deferral.documents.forEach((doc_item, index) => {
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
      if (deferral.comments && deferral.comments.length > 0) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFont(undefined, 'bold');
        doc.text('Comment Trail', margin, yPosition);
        yPosition += 10;

        deferral.comments.forEach((comment, index) => {
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

      // Save PDF
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
  const loanAmountValue = Number(deferral.loanAmount || deferral.amount || deferral.loan_amount || 0);
  const formattedLoanAmount = loanAmountValue ? `${(loanAmountValue / 1000000).toFixed(0)} M` : 'Not specified';
  const isUnder75 = loanAmountValue > 0 && loanAmountValue < 75000000;

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

  // Documents categorization (requested, DCL, additional)
  const requestedDocs = (deferral.selectedDocuments || []).map((d, i) => {
    const name = typeof d === 'string' ? d : d.name || d.label || 'Document';
    const subItems = [];
    if (d && typeof d === 'object') {
      if (Array.isArray(d.items) && d.items.length) subItems.push(...d.items);
      else if (Array.isArray(d.selected) && d.selected.length) subItems.push(...d.selected);
      else if (Array.isArray(d.subItems) && d.subItems.length) subItems.push(...d.subItems);
      else if (d.item) subItems.push(d.item);
      else if (d.selected) subItems.push(d.selected);
    }
    return { id: `req_${i}`, name, type: d.type || '', subItems, source: 'selected' };
  });

  const storedDocs = (deferral.documents || []).map((d, i) => {
    const name = (d.name || '').toString();
    const isDCL = (typeof d.isDCL !== 'undefined' && d.isDCL) || /dcl/i.test(name) || (deferral.dclNumber && name.toLowerCase().includes((deferral.dclNumber || '').toLowerCase()));
    const isAdditional = (typeof d.isAdditional !== 'undefined') ? d.isAdditional : !isDCL;
    return {
      id: d._id || `doc_${i}`,
      name: d.name,
      type: d.type || (d.name ? d.name.split('.').pop().toLowerCase() : ''),
      url: d.url,
      size: d.size || null,
      uploadDate: d.uploadDate || d.uploadedAt || null,
      isDCL,
      isAdditional
    };
  });

  const dclDocs = storedDocs.filter(s => s.isDCL);
  const additionalDocs = storedDocs.filter(s => s.isAdditional);

  // Find uploaded versions for requested docs
  const requestedWithUploads = requestedDocs.map(r => {
    const match = storedDocs.find(s => s.name && r.name && s.name.toLowerCase().includes(r.name.toLowerCase()));
    return { ...r, uploaded: !!match, uploadedMeta: match || null };
  });

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
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
          !readOnly && (
            <Button
              key="rework"
              onClick={handleReturnForRework}
              loading={returnReworkLoading}
              disabled={returnReworkLoading}
              style={{
                borderColor: WARNING_ORANGE,
                color: WARNING_ORANGE,
                fontWeight: 600
              }}
            >
              Return for Rework
            </Button>
          ),
          !readOnly && (deferral.status === "pending_approval" || deferral.status === "in_review" || deferral.status === "deferral_requested") ? (
            <Button
              key="reject"
              danger
              icon={<CloseOutlined />}
              onClick={handleReject}
              loading={rejecting}
              disabled={rejecting}
            >
              Reject
            </Button>
          ) : null,
          !readOnly && (deferral.status === "pending_approval" || deferral.status === "in_review" || deferral.status === "deferral_requested") ? (
            <Button
              key="approve"
              type="primary"
              style={{ backgroundColor: SUCCESS_GREEN, borderColor: SUCCESS_GREEN }}
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
            <Card className="deferral-info-card" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Customer Information</span>} style={{ marginBottom: 18, marginTop: 24 }}>
              <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="Customer Name"><Text strong style={{ color: PRIMARY_BLUE }}>{deferral.customerName}</Text></Descriptions.Item>
                <Descriptions.Item label="Customer Number"><Text strong style={{ color: PRIMARY_BLUE }}>{deferral.customerNumber}</Text></Descriptions.Item>
                <Descriptions.Item label="Loan Type"><Text strong style={{ color: PRIMARY_BLUE }}>{deferral.loanType}</Text></Descriptions.Item>
                <Descriptions.Item label="Created At"><div><Text strong style={{ color: PRIMARY_BLUE }}>{dayjs(deferral.createdAt || deferral.requestedDate).format('DD MMM YYYY')}</Text><Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>{dayjs(deferral.createdAt || deferral.requestedDate).format('HH:mm')}</Text></div></Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Deferral Details Card */}
            <Card
              className="deferral-info-card"
              size="small"
              title={
                <span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>
                  Deferral Details
                </span>
              }
              style={{
                marginBottom: 18,
                marginTop: 0,
                borderRadius: 10,
                border: `1px solid #e0e0e0`,
              }}
            >
              <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="Deferral Number">
                  <Text strong style={{ color: PRIMARY_BLUE }}>
                    {deferral.deferralNumber}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="DCL No">
                  {deferral.dclNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Status"><div style={{ fontWeight: 500 }}>{status === 'deferral_requested' ? 'Pending' : status}</div></Descriptions.Item>

                <Descriptions.Item label="Loan Amount">
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12 }}>
                    {(function () {
                      const amt = Number(deferral.loanAmount || 0);
                      if (!amt) return 'Not specified';
                      const isAbove75 = amt > 75 && amt <= 1000 ? true : (amt > 75000000 ? true : false);
                      return isAbove75 ? <Tag color={'red'} style={{ fontSize: 12 }}>Above 75 million</Tag> : <span style={{ color: SUCCESS_GREEN, fontWeight: 600 }}>Under 75 million</span>;
                    })()}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Days Sought">
                  <div style={{ fontWeight: "bold", color: (overrideDaysSought || deferral.daysSought) > 45 ? ERROR_RED : (overrideDaysSought || deferral.daysSought) > 30 ? WARNING_ORANGE : PRIMARY_BLUE, fontSize: 14 }}>
                    {overrideDaysSought !== null ? overrideDaysSought : (deferral.daysSought || 0)} days
                    {overrideDaysSought !== null && <span style={{ marginLeft: 8, fontSize: 12, color: WARNING_ORANGE }}>(Extension)</span>}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Next Due Date">
                  <div style={{ color: (overrideNextDueDate || deferral.nextDueDate || deferral.nextDocumentDueDate || deferral.requestedExpiry) ? (dayjs(overrideNextDueDate || deferral.nextDueDate || deferral.nextDocumentDueDate || deferral.requestedExpiry).isBefore(dayjs()) ? ERROR_RED : SUCCESS_GREEN) : PRIMARY_BLUE }}>
                    {(overrideNextDueDate || deferral.nextDueDate || deferral.nextDocumentDueDate || deferral.requestedExpiry) ? dayjs(overrideNextDueDate || deferral.nextDueDate || deferral.nextDocumentDueDate || deferral.requestedExpiry).format('DD MMM YYYY') : 'Not calculated'}
                  </div>
                </Descriptions.Item>

                <Descriptions.Item label="Current Approver">{deferral.approvers?.find(a => a.isCurrent)?.name || "You"}</Descriptions.Item>
                <Descriptions.Item label="SLA Expiry"><div style={{ color: deferral.slaExpiry && dayjs(deferral.slaExpiry).isBefore(dayjs()) ? ERROR_RED : PRIMARY_BLUE }}>{deferral.slaExpiry ? dayjs(deferral.slaExpiry).format('DD MMM YYYY HH:mm') : 'Not set'}</div></Descriptions.Item>
              </Descriptions>
            </Card>

            {deferral.deferralDescription && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0', marginBottom: 18 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Deferral Description</Text>
                <div style={{ padding: 12, backgroundColor: '#f8f9fa', borderRadius: 6, border: '1px solid #e8e8e8' }}>
                  <Text>{deferral.deferralDescription}</Text>
                </div>
              </div>
            )}

            {requestedWithUploads && requestedWithUploads.length > 0 ? (
              <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}>Documents Requested for Deferrals ({requestedWithUploads.length})</span>} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {requestedWithUploads.map((doc, idx) => (
                    <div key={doc.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: doc.uploadedMeta ? '#f6ffed' : '#fff7e6', borderRadius: 6, border: doc.uploadedMeta ? '1px solid #b7eb8f' : '1px solid #ffd591' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FileDoneOutlined style={{ color: doc.uploadedMeta ? SUCCESS_GREEN : WARNING_ORANGE, fontSize: 16 }} />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {doc.name}
                            <Tag color={doc.uploadedMeta ? 'green' : 'orange'} style={{ fontSize: 10 }}>{doc.uploadedMeta ? 'Uploaded' : 'Requested'}</Tag>
                          </div>
                          {doc.subItems && doc.subItems.length > 0 && (<div style={{ fontSize: 12, color: '#333', marginTop: 4 }}><b>Selected:</b> {doc.subItems.join(', ')}</div>)}
                          {doc.uploadedMeta && (<div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Uploaded as: {doc.uploadedMeta.name} {doc.uploadedMeta.uploadDate ? `• ${dayjs(doc.uploadedMeta.uploadDate).format('DD MMM YYYY HH:mm')}` : ''}</div>)}
                        </div>
                      </div>
                      <Space>
                        {doc.uploadedMeta && doc.uploadedMeta.url && (<><Button type="text" icon={<EyeOutlined />} onClick={() => openFileInNewTab(doc.uploadedMeta.url)} size="small">View</Button><Button type="text" icon={<DownloadOutlined />} onClick={() => { downloadFile(doc.uploadedMeta.url, doc.uploadedMeta.name); message.success(`Downloading ${doc.uploadedMeta.name}...`); }} size="small">Download</Button></>)}
                      </Space>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (deferral.selectedDocuments && deferral.selectedDocuments.length > 0 ? (
              <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}>Documents Requested for Deferrals</span>} style={{ marginBottom: 18 }}>
                <div style={{ color: '#999' }}>{deferral.selectedDocuments.join(', ')}</div>
              </Card>
            ) : null)}

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
                          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 500 }}>{doc.name}</span><Tag color="red" style={{ fontSize: 10, padding: '0 6px' }}>DCL Document</Tag></div>}
                          description={<div style={{ fontSize: 12, color: '#666' }}>{doc.size && (<span>{doc.size > 1024 ? `${(doc.size / 1024).toFixed(2)} MB` : `${doc.size} KB`}</span>)} {doc.uploadDate && (<span style={{ marginLeft: 8 }}>Uploaded: {dayjs(doc.uploadDate).format('DD MMM YYYY HH:mm')}</span>)} {!doc.url && <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 12 }}>Preview not available</div>}</div>}
                        />
                      </List.Item>
                    )}
                  />

                  <div style={{ padding: 8, backgroundColor: '#f6ffed', borderRadius: 4, marginTop: 8 }}>
                    <Text type="success" style={{ fontSize: 12 }}>✓ DCL document ready: <b>{dclDocs[0].name}</b>{dclDocs.length > 1 ? ` (+${dclDocs.length - 1} more)` : ''}</Text>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 12, color: WARNING_ORANGE }}><UploadOutlined style={{ fontSize: 18, marginBottom: 6, color: WARNING_ORANGE }} /><div>No DCL document uploaded</div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>DCL document is required for submission</Text></div>
              )}
            </Card>

            <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}><PaperClipOutlined style={{ marginRight: 8 }} /> Additional Uploaded Documents ({additionalDocs.length})</span>} style={{ marginBottom: 18 }}>
              {additionalDocs.length > 0 ? (
                <>
                  <List
                    size="small"
                    dataSource={additionalDocs}
                    renderItem={(doc) => (
                      <List.Item
                        actions={[
                          doc.url ? <Button key="view" type="link" onClick={() => openFileInNewTab(doc.url)} size="small">View</Button> : null,
                          doc.url ? <Button key="download" type="link" onClick={() => { downloadFile(doc.url, doc.name); message.success(`Downloading ${doc.name}...`); }} size="small">Download</Button> : null,
                        ].filter(Boolean)}
                      >
                        <List.Item.Meta
                          avatar={getFileIcon(doc.type)}
                          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 500 }}>{doc.name}</span>{doc.isAdditional && <Tag color="cyan" style={{ fontSize: 10 }}>Additional</Tag>}</div>}
                          description={<div style={{ fontSize: 12, color: '#666' }}>{doc.size && (<span>{doc.size > 1024 ? `${(doc.size / 1024).toFixed(2)} MB` : `${doc.size} KB`}</span>)} {doc.uploadDate && (<span style={{ marginLeft: 8 }}>Uploaded: {dayjs(doc.uploadDate).format('DD MMM YYYY HH:mm')}</span>)} {!doc.url && <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 12 }}>Preview not available</div>}</div>}
                        />
                      </List.Item>
                    )}
                  />

                  <div style={{ padding: 8, backgroundColor: '#f6ffed', borderRadius: 4, marginTop: 8 }}>
                    <Text type="success" style={{ fontSize: 12 }}>✓ {additionalDocs.length} document{additionalDocs.length !== 1 ? 's' : ''} uploaded</Text>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 12, color: '#999' }}><PaperClipOutlined style={{ fontSize: 18, marginBottom: 6, color: '#d9d9d9' }} /><div>No additional documents uploaded</div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>You can upload additional supporting documents if needed</Text></div>
              )}
            </Card>

            {/* Approval Flow */}
            <Card size="small" title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>Approval Flow {(overrideApprovals || deferral.status === 'deferral_requested' || deferral.status === 'pending_approval') && (<Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Pending Approval</Tag>)}</span></div>
              {null}
            </div>} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(overrideApprovals && overrideApprovals.approvers && overrideApprovals.approvers.length > 0) ? (
                  // Use extension approvers from overrideApprovals
                  overrideApprovals.approvers.map((approver, index) => {
                    const isApproved = approver?.approved === true;
                    const isRejected = approver?.rejected === true;
                    const isReturned = approver?.returned === true;
                    const isPending = !isApproved && !isRejected && !isReturned;
                    const hasEmail = approver?.email || (typeof approver === 'string' && approver.includes('@'));
                    return (
                      <div key={index} style={{ padding: '12px 16px', backgroundColor: isApproved ? '#f6ffed' : isPending ? '#fff7e6' : '#fafafa', borderRadius: 6, border: isApproved ? `2px solid ${SUCCESS_GREEN}` : isPending ? `2px solid ${WARNING_ORANGE}` : '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Badge count={index + 1} style={{ backgroundColor: isApproved ? SUCCESS_GREEN : isPending ? WARNING_ORANGE : '#bfbfbf', fontSize: 12, height: 24, minWidth: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ fontSize: 14 }}>{typeof approver === 'object' ? (approver.name || approver.user?.name || approver.email || approver.role || String(approver)) : approver}</Text>
                          <div style={{ fontSize: 12, color: isApproved ? SUCCESS_GREEN : WARNING_ORANGE, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isApproved ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                            {isApproved ? 'Approved' : 'Pending Approval'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (deferral.approverFlow && deferral.approverFlow.length > 0) ? (
                  deferral.approverFlow.map((approver, index) => {
                    const currentIndex = deferral.currentApproverIndex || 0;
                    const isCurrentApprover = index === currentIndex;
                    const isApproved = approver?.approved === true || approver?.approvedAt || approver?.approvalDate;
                    const isPastApprover = index < currentIndex;
                    const shouldHighlightGreen = isApproved || isPastApprover;
                    const hasEmail = isCurrentApprover && (deferral.currentApprover?.email || approver.email || (typeof approver === 'string' && approver.includes('@')));
                    return (
                      <div key={index} style={{ padding: '12px 16px', backgroundColor: shouldHighlightGreen ? '#f6ffed' : isCurrentApprover ? '#e6f7ff' : '#fafafa', borderRadius: 6, border: shouldHighlightGreen ? `2px solid ${SUCCESS_GREEN}` : isCurrentApprover ? `2px solid ${PRIMARY_BLUE}` : '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Badge count={index + 1} style={{ backgroundColor: shouldHighlightGreen ? SUCCESS_GREEN : isCurrentApprover ? PRIMARY_BLUE : '#bfbfbf', fontSize: 12, height: 24, minWidth: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ fontSize: 14 }}>{typeof approver === 'object' ? (approver.name || approver.user?.name || approver.email || approver.role || String(approver)) : approver}</Text>
                          {isCurrentApprover && (
                            <div style={{ fontSize: 12, color: PRIMARY_BLUE, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ClockCircleOutlined style={{ fontSize: 11 }} />
                              Current Approver • Pending Approval
                              {deferral.slaExpiry && (
                                <span style={{ marginLeft: 8, color: WARNING_ORANGE }}>SLA: {dayjs(deferral.slaExpiry).format('DD MMM HH:mm')}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {isCurrentApprover && hasEmail && (
                          <div style={{ fontSize: 12, color: '#666', marginLeft: 'auto' }}>
                            <MailOutlined style={{ marginRight: 4 }} />{deferral.currentApprover?.email || approver.email || (typeof approver === 'string' ? approver : '')}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (deferral.approvers && deferral.approvers.length > 0) ? (
                  deferral.approvers.filter(a => a && a !== "").map((approver, index) => {
                    const currentIndex = deferral.currentApproverIndex || 0;
                    const isCurrentApprover = index === currentIndex;
                    const isApproved = approver?.approved === true || approver?.approvedAt || approver?.approvalDate;
                    const isPastApprover = index < currentIndex;
                    const shouldHighlightGreen = isApproved || isPastApprover;
                    const hasEmail = isCurrentApprover && (deferral.currentApprover?.email || approver.email || (typeof approver === 'string' && approver.includes('@')));
                    const isEmail = typeof approver === 'string' && approver.includes('@');
                    return (
                      <div key={index} style={{ padding: '12px 16px', backgroundColor: shouldHighlightGreen ? '#f6ffed' : isCurrentApprover ? '#e6f7ff' : '#fafafa', borderRadius: 6, border: shouldHighlightGreen ? `2px solid ${SUCCESS_GREEN}` : isCurrentApprover ? `2px solid ${PRIMARY_BLUE}` : '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Badge count={index + 1} style={{ backgroundColor: shouldHighlightGreen ? SUCCESS_GREEN : isCurrentApprover ? PRIMARY_BLUE : '#bfbfbf', fontSize: 12, height: 24, minWidth: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ fontSize: 14 }}>{typeof approver === 'string' ? (isEmail ? approver.split('@')[0] : approver) : (approver.name || approver.user?.name || approver.email || approver.role || String(approver))}</Text>
                          {isCurrentApprover && (
                            <div style={{ fontSize: 12, color: PRIMARY_BLUE, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ClockCircleOutlined style={{ fontSize: 11 }} />
                              Current Approver • Pending Approval
                              {deferral.slaExpiry && (
                                <span style={{ marginLeft: 8, color: WARNING_ORANGE }}>SLA: {dayjs(deferral.slaExpiry).format('DD MMM HH:mm')}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {isCurrentApprover && hasEmail && (
                          <div style={{ fontSize: 12, color: '#666', marginLeft: 'auto' }}>
                            <MailOutlined style={{ marginRight: 4 }} />{(typeof approver === 'string' ? (isEmail ? approver : '') : (approver.email || deferral.currentApprover?.email || ''))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: 16, color: '#999' }}>
                    <UserOutlined style={{ fontSize: 24, marginBottom: 8, color: '#d9d9d9' }} />
                    <div>No approvers specified</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Comment Trail & History */}            <div style={{ marginTop: 24 }}>
              <h4>Comment Trail & History</h4>
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
              okText={'Yes, Reject'}
              okType={'danger'}
              okButtonProps={{ style: { background: ERROR_RED, borderColor: ERROR_RED, color: 'white' } }}
              cancelText={'Cancel'}
              confirmLoading={rejecting}
              onOk={doReject}
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
              okButtonProps={{ style: { background: WARNING_ORANGE, borderColor: WARNING_ORANGE } }}
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deferrals/approver/queue`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
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

    // Get current user ID from localStorage
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    const currentUserId = stored?.user?._id;

    // Filter out deferrals where current user is NOT the current approver OR has already approved
    if (currentUserId) {
      filtered = filtered.filter(d => {
        // Get the approvers array
        const approvers = d.approvers || [];
        const currentApproverIndex = d.currentApproverIndex ?? 0;

        // Check if this user has already approved
        const userApproval = approvers.find(a => {
          const approverId = a.user?._id || a.user || a.userId?._id || a.userId;
          return approverId === currentUserId;
        });

        // If user has approved=true, exclude from queue
        if (userApproval && userApproval.approved === true) {
          return false;
        }

        // Also check if user is the current approver (double-check)
        const currentApprover = approvers[currentApproverIndex];
        if (!currentApprover) return true;

        const currentApproverId = currentApprover.user?._id || currentApprover.user || currentApprover.userId?._id || currentApprover.userId;

        // Only show if user is the current approver AND hasn't approved yet
        return currentApproverId === currentUserId;
      });
    }

    // Search filtering
    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(d =>
        d.customerName.toLowerCase().includes(q) ||
        d.dclNumber.toLowerCase().includes(q) ||
        d.deferralNumber.toLowerCase().includes(q) ||
        d.requestedBy.toLowerCase().includes(q) ||
        d.customerNumber.toLowerCase().includes(q) ||
        d.document.toLowerCase().includes(q)
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