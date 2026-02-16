import React, { useEffect, useState } from "react";
import { Table, Card, Empty, message, Modal, Typography, Spin, Tag, Descriptions, Space, Badge, Row, Col, Input, Button, Divider, Tabs, List, Avatar } from "antd";
import dayjs from "dayjs";
import jsPDF from 'jspdf';
import { FileTextOutlined, MailOutlined, PhoneOutlined, ClockCircleOutlined, SearchOutlined, CustomerServiceOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined, BankOutlined, PaperClipOutlined, UserOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import deferralApi from "../../service/deferralApi";
import getFacilityColumns from '../../utils/facilityColumns';
import ApproverExtensionTab from "../../components/ApproverExtensionTab";
import { useGetApproverActionedExtensionsQuery } from "../../api/extensionApi";

const { Text } = Typography;

const Actioned = () => {

  const PRIMARY_BLUE = "#164679";
  const ACCENT_LIME = "#b5d334";
  const SUCCESS_GREEN = "#52c41a";
  const ERROR_RED = "#ff4d4f";
  const WARNING_ORANGE = "#faad14";

  // File icon helper (simple mapping used in document lists)
  const getFileIcon = (type = "") => {
    const ext = (type || "").toString().toLowerCase();
    if (ext.includes("pdf")) return <FilePdfOutlined style={{ color: ERROR_RED }} />;
    if (ext.includes("word") || ext.includes("doc")) return <FileWordOutlined style={{ color: PRIMARY_BLUE }} />;
    if (ext.includes("xls") || ext.includes("excel")) return <FileExcelOutlined style={{ color: SUCCESS_GREEN }} />;
    if (ext.includes("png") || ext.includes("jpg") || ext.includes("jpeg") || ext.includes("img") || ext.includes("image")) return <FileImageOutlined style={{ color: "#7e6496" }} />;
    return <FileTextOutlined />;
  };

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

  const modalCustomStyles = `
    .ant-modal-header { background-color: ${PRIMARY_BLUE} !important; padding: 18px 24px !important; }
    .ant-modal-title { color: white !important; font-size: 1.15rem !important; font-weight: 700 !important; letter-spacing: 0.5px; }
    .ant-modal-close-x { color: white !important; }
    .deferral-info-card .ant-card-head { border-bottom: 2px solid ${ACCENT_LIME} !important; }
    .deferral-info-card .ant-descriptions-item-label { font-weight: 600 !important; color: #7e6496 !important; padding-bottom: 4px; }
    .deferral-info-card .ant-descriptions-item-content { color: ${PRIMARY_BLUE} !important; font-weight: 700 !important; font-size: 13px !important; }
  `;

  const token = useSelector((s) => s.auth.token);
  const [deferrals, setDeferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [activeTab, setActiveTab] = useState("deferrals");

  // Extension hooks
  const { data: actionedExtensions = [], isLoading: extensionsLoading } = useGetApproverActionedExtensionsQuery();

  const dclDocs = (selected && (selected.documents || []).filter(d => (d.isDCL) || (d.name && /dcl/i.test(d.name)) || (selected.dclNo && d.name && d.name.toLowerCase().includes((selected.dclNo || '').toLowerCase())))) || [];

  // Helper: View document
  const handleViewDocument = (file) => {
    if (file && file.url) {
      window.open(file.url, '_blank');
      message.info(`Opening ${file.name || 'document'}`);
    } else {
      message.info('No preview available');
    }
  };

  // Helper: Download document
  const handleDownloadDocument = (file) => {
    if (!file || !file.url) {
      message.info('No file available for download');
      return;
    }
    try {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Failed to download file:', err);
      message.error('Failed to download file');
    }
  };

  const renderDclUpload = () => {
    return (
      <Card size="small" title={`Mandatory: DCL Upload ${dclDocs.length > 0 ? '✓' : ''}`} style={{ marginTop: 12 }}>
        {dclDocs.length === 0 ? (
          <div style={{ textAlign: 'center', color: WARNING_ORANGE }}>No DCL document uploaded</div>
        ) : (
          <div>
            <div style={{ marginBottom: 10 }}>
              {dclDocs.map((doc, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{doc.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{doc.size ? `${(doc.size / 1024).toFixed(2)} MB` : ''} {doc.uploadDate ? `• Uploaded: ${dayjs(doc.uploadDate).format('DD MMM YYYY HH:mm')}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDocument(doc)}>View</Button>
                    <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownloadDocument(doc)}>Download</Button>
                    <Tag color="red">DCL Document</Tag>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: 8, marginTop: 8, backgroundColor: '#f6ffed', borderRadius: 4 }}>
              <div style={{ fontWeight: 700, color: SUCCESS_GREEN }}>✓ DCL document ready: {dclDocs[0].name}</div>
            </div>
          </div>
        )}
      </Card>
    );
  };

  const safe = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return (v.name || v.userName || v._id || JSON.stringify(v));
    return v;
  };

  const nameOf = (x) => {
    if (!x) return 'Approver';
    if (typeof x === 'string') return x;
    if (typeof x === 'object') {
      if (x.name) return x.name;
      if (x.userName) return x.userName;
      if (x.user) return (typeof x.user === 'string') ? x.user : (x.user.name || JSON.stringify(x.user));
      if (x._id) return x._id;
      return JSON.stringify(x);
    }
    return String(x);
  };

  // Simple comment trail renderer (shared style with deferral view)
  const formatUsername = (username) => {
    if (!username) return "System";
    return username.replace(/\s*\([^)]*\)\s*$/, '').trim();
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
    const groupMap = new Map(); // key: "timestamp|userName|role"

    for (let i = 0; i < history.length; i++) {
      const item = history[i];
      const roleLabel = item.userRole || item.role;
      const name = formatUsername(item.user) || item.userName || 'System';
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

  // Handle posting comments
  const handlePostComment = async () => {
    if (!newComment.trim()) {
      message.error('Please enter a comment before posting');
      return;
    }

    if (!selected || !selected._id) {
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
      await deferralApi.postComment(selected._id, commentData, token);

      message.success('Comment posted successfully');

      // Clear the input
      setNewComment('');

      // Refresh the deferral to show the new comment
      const refreshedDeferral = await deferralApi.getDeferralById(selected._id, token);
      setSelected(refreshedDeferral);

      // Update in the list
      const updatedDeferrals = deferrals.map(d =>
        d._id === refreshedDeferral._id ? refreshedDeferral : d
      );
      setDeferrals(updatedDeferrals);
    } catch (error) {
      console.error('Failed to post comment:', error);
      message.error(error.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  // Download deferral as PDF
  const [downloadLoading, setDownloadLoading] = useState(false);
  const downloadDeferralAsPDF = async () => {
    if (!selected || !selected._id) {
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

      const loanAmountValue = Number(selected.loanAmount || selected.amount || 0);
      const formattedLoanAmount = loanAmountValue ? `KSh ${loanAmountValue.toLocaleString()}` : 'Not specified';

      // Header
      doc.setFillColor(22, 70, 121);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text(`Deferral Request: ${selected.deferralNumber || 'N/A'}`, margin, 15);
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
      doc.text(selected.customerName || 'N/A', margin + 50, yPosition + 16);

      doc.setFont(undefined, 'bold');
      doc.text('Customer Number:', margin + 5, yPosition + 24);
      doc.setFont(undefined, 'normal');
      doc.text(selected.customerNumber || 'N/A', margin + 50, yPosition + 24);

      doc.setFont(undefined, 'bold');
      doc.text('Loan Type:', margin + 110, yPosition + 16);
      doc.setFont(undefined, 'normal');
      doc.text(selected.loanType || 'N/A', margin + 135, yPosition + 16);

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
      doc.text(selected.deferralNumber || 'N/A', margin + 45, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('DCL No:', margin + 5, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(selected.dclNo || selected.dclNumber || 'N/A', margin + 45, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Status:', margin + 5, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(selected.status || 'N/A', margin + 45, detailY);

      detailY = yPosition + 16;
      doc.setFont(undefined, 'bold');
      doc.text('Creator Status:', margin + 105, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(selected.creatorApprovalStatus || 'pending', margin + 145, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Creator Date:', margin + 105, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(selected.creatorApprovalDate ? dayjs(selected.creatorApprovalDate).format('DD MMM YYYY HH:mm') : 'N/A', margin + 145, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Checker Status:', margin + 105, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(selected.checkerApprovalStatus || 'pending', margin + 145, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Checker Date:', margin + 105, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(selected.checkerApprovalDate ? dayjs(selected.checkerApprovalDate).format('DD MMM YYYY HH:mm') : 'N/A', margin + 145, detailY);

      detailY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Created At:', margin + 105, detailY);
      doc.setFont(undefined, 'normal');
      doc.text(dayjs(selected.createdAt || selected.requestedDate).format('DD MMM YYYY HH:mm'), margin + 145, detailY);

      detailY = yPosition + 37;
      doc.setFont(undefined, 'bold');
      doc.text('Approvers Status:', margin + 5, detailY);
      doc.setFont(undefined, 'normal');
      const approvers = selected.approverFlow || selected.approversFlow || [];
      const approvedCount = approvers.filter((a) => a.approved || a.status === 'approved').length;
      doc.text(approvers.length ? `${approvedCount} of ${approvers.length} Approved` : 'N/A', margin + 45, detailY);

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
      const daysColor = selected.daysSought > 45 ? [255, 77, 79] : selected.daysSought > 30 ? [250, 173, 20] : darkGray;
      doc.setTextColor(daysColor[0], daysColor[1], daysColor[2]);
      doc.text(`${selected.daysSought || 0} days`, margin + 40, loanY);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

      loanY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('Next Due Date:', margin + 5, loanY);
      doc.setFont(undefined, 'normal');
      const nextDue = selected.nextDueDate || selected.nextDocumentDueDate || selected.requestedExpiry;
      doc.text(nextDue ? dayjs(nextDue).format('DD MMM YYYY') : 'Not calculated', margin + 40, loanY);

      loanY += 7;
      doc.setFont(undefined, 'bold');
      doc.text('SLA Expiry:', margin + 5, loanY);
      doc.setFont(undefined, 'normal');
      doc.text(selected.slaExpiry ? dayjs(selected.slaExpiry).format('DD MMM YYYY') : 'Not set', margin + 40, loanY);

      yPosition += 47;

      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }

      // Facilities
      if (selected.facilities && selected.facilities.length > 0) {
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
        selected.facilities.forEach((facility, index) => {
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
      if (selected.deferralDescription) {
        doc.setFillColor(255, 250, 205);
        const descLines = doc.splitTextToSize(selected.deferralDescription, contentWidth - 20);
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
      if (selected.approverFlow && selected.approverFlow.length > 0) {
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
        selected.approverFlow.forEach((approver, index) => {
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
      if (selected.documents && selected.documents.length > 0) {
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
        selected.documents.forEach((doc_item, index) => {
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
      if (selected.comments && selected.comments.length > 0) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFont(undefined, 'bold');
        doc.text('Comment Trail', margin, yPosition);
        yPosition += 10;

        selected.comments.forEach((comment, index) => {
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
      doc.save(`deferral_${selected.deferralNumber || "report"}.pdf`);
      message.success("Deferral downloaded as PDF successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      message.error("Failed to generate PDF");
    } finally {
      setDownloadLoading(false);
    }
  };

  useEffect(() => {
    fetchActioned();

    // Listen for rejected/approved deferrals dispatched from other pages (e.g., approver MyQueue)
    const handler = (e) => {
      try {
        const updated = e && e.detail ? e.detail : null;
        if (!updated || !updated._id) return;

        const s = (updated.status || '').toLowerCase();
        // If the deferral was just rejected or approved, add it to the actioned list
        if (s === 'rejected' || s === 'deferral_rejected' || s === 'approved' || s === 'deferral_approved') {
          setDeferrals(prev => {
            const exists = prev.some(d => String(d._id) === String(updated._id));
            if (exists) {
              return prev.map(d => d._id === updated._id ? updated : d);
            }
            // Add to the top if it's a newly rejected/approved item
            return [updated, ...prev];
          });
        }
      } catch (err) {
        console.warn('deferral:updated handler error in Actioned', err);
      }
    };

    window.addEventListener('deferral:updated', handler);
    return () => window.removeEventListener('deferral:updated', handler);
  }, []);

  // Poll the deferral while the modal is open so the approval flow stays live
  useEffect(() => {
    if (!selected || !modalOpen) return;
    let cancelled = false;
    const fetchLatest = async () => {
      try {
        const fresh = await deferralApi.getDeferralById(selected._id);
        if (!cancelled && fresh) setSelected(fresh);
      } catch (err) {
        console.debug('Actioned modal: failed to refresh deferral', err?.message || err);
      }
    };
    fetchLatest();
    const t = setInterval(fetchLatest, 5000);
    return () => { cancelled = true; clearInterval(t); };
  }, [selected?._id, modalOpen]);

  const fetchActioned = async () => {
    setLoading(true);
    try {
      const data = await deferralApi.getActionedDeferrals(token);
      setDeferrals(data || []);
    } catch (err) {
      message.error('Failed to load actioned items');
    } finally {
      setLoading(false);
    }
  };

  const PROCESSING_BLUE = "#1890ff";

  const columns = [
    {
      title: "Deferral No",
      dataIndex: "deferralNumber",
      key: "deferralNumber",
      width: 120,
      fixed: "left",
      render: (text) => (
        <div style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
          <FileTextOutlined style={{ marginRight: 6 }} />
          {text}
        </div>
      )
    },
    {
      title: "DCL No",
      dataIndex: "dclNumber",
      key: "dclNumber",
      width: 100,
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      key: "customerName",
      width: 180,
      render: (name) => (
        <Text strong style={{ color: PRIMARY_BLUE, fontSize: 13 }}>
          {name}
        </Text>
      )
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      key: "loanType",
      width: 120,
      render: (loanType) => (
        <div style={{ fontSize: 12, fontWeight: 500 }}>
          {loanType}
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
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
      }
    },
    {
      title: "Days Sought",
      dataIndex: "daysSought",
      key: "daysSought",
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
      )
    },
    {
      title: "SLA",
      dataIndex: "slaExpiry",
      key: "slaExpiry",
      width: 100,
      render: (date, record) => {
        if (!date) return <div style={{ fontSize: 11, color: "#999" }}>N/A</div>;

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
          text = `${Math.ceil(hoursLeft / 24)}d`;
        }

        return (
          <div style={{
            fontWeight: "bold",
            fontSize: 11,
            color: "#fff",
            backgroundColor: color,
            padding: "4px 8px",
            borderRadius: 4,
            display: "inline-block",
            minWidth: 60,
            textAlign: "center"
          }}>
            {text}
          </div>
        );
      }
    },
    {
      title: 'Actioned At',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (d, r) => <Text>{dayjs(r.updatedAt || r.approvedAt || r.updatedAt).format('DD MMM YYYY HH:mm')}</Text>
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <style>{customTableStyles}</style>
      <style>{modalCustomStyles}</style>

      <Card
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: `4px solid ${ACCENT_LIME || '#b5d334'}`
        }}
        styles={{ body: { padding: 16 } }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <h2 style={{ margin: 0, color: PRIMARY_BLUE, display: "flex", alignItems: "center", gap: 12 }}>
              Completed
              <Badge
                count={deferrals.length}
                style={{
                  backgroundColor: ACCENT_LIME || '#b5d334',
                  fontSize: 12
                }}
              />
            </h2>
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
              Items you have approved or rejected
            </p>
          </Col>
        </Row>
      </Card>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)} type="card" style={{ marginBottom: 16 }}>
        <Tabs.TabPane tab={`Deferrals (${deferrals.length})`} key="deferrals" />
        <Tabs.TabPane tab={`Extension Applications (${actionedExtensions.length})`} key="extensions" />
      </Tabs>

      {activeTab === "deferrals" && (
        <>
          {/* Filters */}
          <Card
            style={{
              marginBottom: 16,
              background: "#fafafa",
              border: `1px solid ${PRIMARY_BLUE}20`,
              borderRadius: 8
            }}
            size="small"
          >
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder="Search by Customer, DCL, or ID"
                  prefix={<SearchOutlined />}
                  onChange={(e) => { /* Implement search filter if desired */ }}
                  allowClear
                  size="middle"
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Button onClick={() => { /* clear filters */ }} style={{ width: '100%' }} size="middle">Clear Filters</Button>
              </Col>
            </Row>
          </Card>

          <Card>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40 }}>
                <Spin />
              </div>
            ) : deferrals.length === 0 ? (
              <Empty
                description={
                  <div>
                    <p style={{ fontSize: 16, marginBottom: 8 }}>No completed deferrals</p>
                    <p style={{ color: "#999" }}>All actioned items are shown here</p>
                  </div>
                }
                style={{ padding: 40 }}
              />
            ) : (
              <div className="deferral-pending-table" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <Table
                  columns={columns}
                  dataSource={deferrals}
                  rowKey={(r) => r._id || r.id}
                  size="middle"
                  pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"], position: ["bottomCenter"] }}
                  scroll={{ x: 1200 }}
                  onRow={(record) => ({
                    onClick: () => { setSelected(record); setModalOpen(true); }
                  })}
                  style={{ flex: 1 }}
                />
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === "extensions" && (
        <ApproverExtensionTab
          extensions={actionedExtensions}
          loading={extensionsLoading}
          onApprove={() => { }}
          onReject={() => { }}
          tabType="actioned"
        />
      )}

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BankOutlined />
            <span>Deferral Request: {selected?.deferralNumber}</span>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={1000}
        styles={{ body: { padding: '0 24px 24px' } }}
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
          <Button key="close" onClick={() => setModalOpen(false)}>
            Close
          </Button>
        ]}
      >
        {selected && (
          <>
            <Card className="deferral-info-card" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Customer Information</span>} style={{ marginBottom: 18, marginTop: 24 }}>
              <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="Customer Name"><Text strong style={{ color: PRIMARY_BLUE }}>{selected.customerName}</Text></Descriptions.Item>
                <Descriptions.Item label="Customer Number"><Text strong style={{ color: PRIMARY_BLUE }}>{selected.customerNumber}</Text></Descriptions.Item>
                <Descriptions.Item label="Loan Type"><Text strong style={{ color: PRIMARY_BLUE }}>{selected.loanType}</Text></Descriptions.Item>
                <Descriptions.Item label="Created At">
                  <div>
                    <Text strong style={{ color: PRIMARY_BLUE }}>{dayjs(selected.createdAt || selected.requestedDate).format('DD MMM YYYY')}</Text>
                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>{dayjs(selected.createdAt || selected.requestedDate).format('HH:mm')}</Text>
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="deferral-info-card" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Deferral Details</span>} style={{ marginBottom: 18 }}>
              <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="Deferral Number"><Text strong style={{ color: PRIMARY_BLUE }}>{selected.deferralNumber}</Text></Descriptions.Item>
                <Descriptions.Item label="DCL No"><Text strong style={{ color: PRIMARY_BLUE }}>{selected.dclNo || selected.dclNumber}</Text></Descriptions.Item>
                <Descriptions.Item label="Status">
                  {selected.status === 'deferral_requested' || selected.status === 'pending_approval' ? (
                    <Tag color="processing" style={{ fontWeight: 700, color: WARNING_ORANGE }}>
                      Pending
                    </Tag>
                  ) : selected.status === 'deferral_approved' || selected.status === 'approved' ? (
                    <Tag color="success" style={{ fontWeight: 700, color: SUCCESS_GREEN }}>
                      Approved
                    </Tag>
                  ) : selected.status === 'deferral_rejected' || selected.status === 'rejected' ? (
                    <Tag color="error" style={{ fontWeight: 700, color: ERROR_RED }}>
                      Rejected
                    </Tag>
                  ) : (
                    <div style={{ fontWeight: 500 }}>{selected.status}</div>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Loan Amount">
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12 }}>
                    {(function () {
                      const amt = Number(selected.loanAmount || 0);
                      if (!amt) return 'Not specified';
                      const isAbove75 = amt > 75 && amt <= 1000 ? true : (amt > 75000000 ? true : false);
                      return isAbove75 ? <Tag color={'red'} style={{ fontSize: 12 }}>Above 75 million</Tag> : <span style={{ color: SUCCESS_GREEN, fontWeight: 600 }}>Under 75 million</span>;
                    })()}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Days Sought"><div style={{ fontWeight: "bold", color: selected.daysSought > 45 ? ERROR_RED : selected.daysSought > 30 ? WARNING_ORANGE : PRIMARY_BLUE, fontSize: 14 }}>{selected.daysSought || 0} days</div></Descriptions.Item>
                <Descriptions.Item label="Next Due Date"><div style={{ color: (selected.nextDueDate || selected.nextDocumentDueDate || selected.requestedExpiry) ? (dayjs(selected.nextDueDate || selected.nextDocumentDueDate || selected.requestedExpiry).isBefore(dayjs()) ? ERROR_RED : SUCCESS_GREEN) : PRIMARY_BLUE }}>{(selected.nextDueDate || selected.nextDocumentDueDate || selected.requestedExpiry) ? dayjs(selected.nextDueDate || selected.nextDocumentDueDate || selected.requestedExpiry).format('DD MMM YYYY') : 'Not calculated'}</div></Descriptions.Item>
                <Descriptions.Item label="SLA Expiry"><div style={{ color: selected.slaExpiry && dayjs(selected.slaExpiry).isBefore(dayjs()) ? ERROR_RED : PRIMARY_BLUE }}>{selected.slaExpiry ? dayjs(selected.slaExpiry).format('DD MMM YYYY HH:mm') : 'Not set'}</div></Descriptions.Item>
              </Descriptions>
            </Card>

            {selected.deferralDescription && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0', marginBottom: 18 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Deferral Description</Text>
                <div style={{ padding: 12, backgroundColor: '#f8f9fa', borderRadius: 6, border: '1px solid #e8e8e8' }}>
                  <Text>{selected.deferralDescription}</Text>
                </div>
              </div>
            )}

            {/* Documents Requested for Deferrals */}
            {selected.selectedDocuments && selected.selectedDocuments.length > 0 && (
              <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}>Documents Requested for Deferrals ({selected.selectedDocuments.length})</span>} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selected.selectedDocuments.map((doc, index) => {
                    const docName = typeof doc === 'string' ? doc : doc.name || doc.label;
                    const docType = typeof doc === 'object' ? doc.type || 'Secondary' : 'Secondary';

                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: 12,
                          backgroundColor: '#fffbf0',
                          border: '1px solid #ffe58f',
                          borderRadius: 6
                        }}
                      >
                        <FileTextOutlined style={{ fontSize: 20, color: PRIMARY_BLUE, marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Text strong>{docName}</Text>
                            <Badge status="processing" text="Requested" />
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Type: {docType}
                          </Text>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {selected.facilities && selected.facilities.length > 0 && (
              <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}>Facility Details ({selected.facilities.length})</span>} style={{ marginBottom: 18, marginTop: 12 }}>
                <Table dataSource={selected.facilities} columns={getFacilityColumns()} pagination={false} size="small" rowKey={(r) => r.facilityNumber || r._id || `facility-${Math.random().toString(36).slice(2)}`} scroll={{ x: 600 }} />
              </Card>
            )}

            {/* DCL Upload */}
            {renderDclUpload()}

            {/* Additional Documents */}
            <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}><PaperClipOutlined style={{ marginRight: 8 }} /> Additional Uploaded Documents</span>} style={{ marginBottom: 18 }}>
              {(() => {
                const additionalDocs = (selected.documents || []).filter(d => {
                  const name = (d.name || '').toString().toLowerCase();
                  const isDCLName = name.includes('dcl');
                  const matchesDclNo = selected.dclNo && name.includes((selected.dclNo || '').toString().toLowerCase());
                  return !(d.isDCL || isDCLName || matchesDclNo);
                });
                return additionalDocs.length > 0 ? (
                  <>
                    <List
                      size="small"
                      dataSource={additionalDocs}
                      renderItem={(doc, i) => (
                        <List.Item key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <List.Item.Meta
                            avatar={getFileIcon(doc.type)}
                            title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 500 }}>{doc.name}</span><Tag color="cyan" style={{ fontSize: 10 }}>Additional</Tag></div>}
                            description={<div style={{ fontSize: 12, color: '#666' }}>{doc.size && (<span>{doc.size > 1024 ? `${(doc.size / 1024).toFixed(2)} MB` : `${doc.size} KB`}</span>)} {doc.uploadDate && (<span style={{ marginLeft: 8 }}>Uploaded: {dayjs(doc.uploadDate).format('DD MMM YYYY HH:mm')}</span>)}</div>}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDocument(doc)}>View</Button>
                            <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownloadDocument(doc)}>Download</Button>
                          </div>
                        </List.Item>
                      )}
                    />
                    <div style={{ padding: 8, backgroundColor: '#f6ffed', borderRadius: 4, marginTop: 8 }}>
                      <Text type="success" style={{ fontSize: 12 }}>✓ {additionalDocs.length} document{additionalDocs.length !== 1 ? 's' : ''} uploaded</Text>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: 12, color: '#999' }}><PaperClipOutlined style={{ fontSize: 18, marginBottom: 6, color: '#d9d9d9' }} /><div>No additional documents uploaded</div><Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>Additional supporting documents can be uploaded if needed</Text></div>
                );
              })()}
            </Card>

            {/* Approval Flow */}
            <Card size="small" title={<span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>Approval Flow</span>} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(selected.approverFlow || selected.approvers || []).map((approver, index) => {
                  const isApproved = approver.approved || approver.approved === true;
                  const isRejected = approver.rejected || approver.rejected === true;
                  const isReturned = approver.returned || approver.returned === true;
                  const isCurrent = !isApproved && !isRejected && !isReturned && (
                    index === selected.currentApproverIndex ||
                    selected.currentApprover === approver ||
                    selected.currentApprover?._id === approver?._id
                  );
                  const approverName = typeof approver === 'string'
                    ? approver
                    : (approver.name || approver.user?.name || approver.email || 'Approver');

                  const approverRole = (() => {
                    if (typeof approver !== 'object') return 'Approver';
                    const roleVal = approver.role || approver.user?.role;
                    if (!roleVal) return 'Approver';
                    if (typeof roleVal === 'string') return roleVal;
                    if (typeof roleVal === 'object') return roleVal.name || roleVal.title || 'Approver';
                    return String(roleVal);
                  })();

                  return (
                    <div key={index} style={{
                      padding: '14px 16px',
                      backgroundColor: isApproved ? '#f6ffed' : isCurrent ? '#e6f7ff' : '#fafafa',
                      borderRadius: 6,
                      border: isApproved ? `2px solid ${SUCCESS_GREEN}` : isCurrent ? `2px solid ${PRIMARY_BLUE}` : '1px solid #e8e8e8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <Badge
                        count={index + 1}
                        style={{
                          backgroundColor: isApproved ? SUCCESS_GREEN : isCurrent ? PRIMARY_BLUE : '#bfbfbf',
                          fontSize: 12,
                          height: 28,
                          minWidth: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong style={{ fontSize: 14 }}>{approverName}</Text>
                          <Tag color="default" style={{ fontSize: 11 }}>{approverRole}</Tag>
                        </div>
                        {isApproved && approver.approvalDate && (
                          <div style={{ fontSize: 12, color: SUCCESS_GREEN, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircleOutlined style={{ fontSize: 11 }} />
                            Approved: {dayjs(approver.approvalDate).format('DD MMM YYYY HH:mm')}
                          </div>
                        )}
                        {isCurrent && (
                          <div style={{ fontSize: 12, color: PRIMARY_BLUE, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ClockCircleOutlined style={{ fontSize: 11 }} />
                            Pending Approval
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Comment Trail & History */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ color: PRIMARY_BLUE, marginBottom: 16 }}>Comment Trail & History</h4>
              {(function renderHistory() {
                const events = [];

                if (selected.comments && Array.isArray(selected.comments) && selected.comments.length > 0) {
                  selected.comments.forEach(c => {
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

                if (selected.history && Array.isArray(selected.history) && selected.history.length > 0) {
                  selected.history.forEach((h) => {
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
                return <CommentTrail history={sorted} isLoading={false} />;
              })()}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Actioned;