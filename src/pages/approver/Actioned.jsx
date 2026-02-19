import React, { useEffect, useState } from "react";
import { Table, Card, Empty, message, Modal, Typography, Spin, Tag, Descriptions, Space, Badge, Row, Col, Input, Button, Divider, Tabs, List, Avatar } from "antd";
import dayjs from "dayjs";
import jsPDF from 'jspdf';
import { FileTextOutlined, MailOutlined, PhoneOutlined, ClockCircleOutlined, SearchOutlined, CustomerServiceOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined, BankOutlined, PaperClipOutlined, UserOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined, FileDoneOutlined, UploadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import deferralApi from "../../service/deferralApi";
import getFacilityColumns from '../../utils/facilityColumns';
import { formatDeferralDocumentType } from "../../utils/deferralDocumentType";
import { getDeferralDocumentBuckets } from "../../utils/deferralDocuments";
import UniformTag from "../../components/common/UniformTag";
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

  const { dclDocs, uploadedDocs, requestedDocs } = getDeferralDocumentBuckets(selected);

  const getApproverStats = (deferral) => {
    if (!deferral) return { total: 0, approved: 0, pending: 0 };
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

  const selectedStatus = selected?.status || 'deferral_requested';
  const selectedStats = getApproverStats(selected);
  const selectedDaysSoughtValue = selected?.daysSought || 0;
  const selectedNextDueDateValue = selected?.nextDueDate || selected?.nextDocumentDueDate;
  const selectedHistory = (function renderHistory() {
    const events = [];

    if (selected?.comments && Array.isArray(selected.comments) && selected.comments.length > 0) {
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

    if (selected?.history && Array.isArray(selected.history) && selected.history.length > 0) {
      selected.history.forEach((h) => {
        if (h.action === 'moved') return;

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

  const formatUsername = (username) => {
    if (!username) return "System";
    return username.replace(/\s*\([^)]*\)\s*$/, '').trim();
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
      default: color = "blue";
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
            const name = formatUsername(item.user || 'System');
            const text = item.comment || item.notes || item.message || item.text || 'No comment provided.';
            const timestamp = item.date || item.createdAt || item.timestamp;

            return (
              <List.Item key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: PRIMARY_BLUE }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', minWidth: 0 }}>
                        <b style={{ fontSize: 14, color: PRIMARY_BLUE, display: 'inline-block', width: 120, minWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</b>
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

      await deferralApi.postComment(selected._id, commentData, token);

      message.success('Comment posted successfully');
      setNewComment('');

      const refreshedDeferral = await deferralApi.getDeferralById(selected._id, token);
      setSelected(refreshedDeferral);

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

  const [downloadLoading, setDownloadLoading] = useState(false);
  const downloadDeferralAsPDF = async () => {
    if (!selected || !selected._id) {
      message.error('No deferral selected');
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

          doc.setTextColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
          doc.text(item.value, margin + 50, yPosition + 3, { maxWidth: contentWidth - 55 });

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
      doc.text(`Deferral Request: ${selected.deferralNumber || 'N/A'}`, margin, 10);
      yPosition = 25;

      const customerItems = [
        { label: 'Customer Name', value: selected.customerName || 'N/A' },
        { label: 'Customer Number', value: selected.customerNumber || 'N/A' },
        { label: 'Loan Type', value: selected.loanType || 'N/A' }
      ];
      yPosition = addCardSection('Customer Information', customerItems);

      const stats = getApproverStats(selected);
      const deferralDetailsItems = [
        { label: 'Deferral Number', value: selected.deferralNumber || 'N/A' },
        { label: 'DCL No', value: selected.dclNo || selected.dclNumber || 'N/A' },
        { label: 'Status', value: selected.status || 'Pending' },
        { label: 'Creator Status', value: selected.creatorApprovalStatus || 'Pending' },
        { label: 'Creator Date', value: selected.creatorApprovalDate ? dayjs(selected.creatorApprovalDate).format('DD/MM/YY') : 'N/A' },
        { label: 'Checker Status', value: selected.checkerApprovalStatus || 'Pending' },
        { label: 'Checker Date', value: selected.checkerApprovalDate ? dayjs(selected.checkerApprovalDate).format('DD/MM/YY') : 'N/A' },
        { label: 'Approvers Status', value: `${stats.approved} of ${stats.total} Approved` },
        { label: 'Created At', value: dayjs(selected.createdAt).format('DD MMM YYYY HH:mm') }
      ];
      yPosition = addCardSection('Deferral Details', deferralDetailsItems);

      const loanAmount = Number(selected.loanAmount || 0);
      const formattedLoanAmount = loanAmount ? `KSh ${loanAmount.toLocaleString()}` : 'Not specified';
      const isUnder75M = loanAmount > 0 && loanAmount < 75000000;
      const loanItems = [
        { label: 'Loan Amount', value: formattedLoanAmount + (isUnder75M ? ' (Under 75M)' : ' (Above 75M)') },
        { label: 'Days Sought', value: `${selected.daysSought || 0} days` },
        { label: 'Deferral Due Date', value: selected.nextDueDate || selected.nextDocumentDueDate ? dayjs(selected.nextDueDate || selected.nextDocumentDueDate).format('DD MMM YYYY') : 'Not calculated' },
        { label: 'SLA Expiry', value: selected.slaExpiry ? dayjs(selected.slaExpiry).format('DD MMM YYYY') : 'Not set' }
      ];
      yPosition = addCardSection('Loan Information', loanItems);

      if (selected.facilities && selected.facilities.length > 0) {
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

        selected.facilities.forEach((facility, index) => {
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
          doc.text(facility.type || facility.facilityType || 'N/A', margin + 5, yPosition + 3);
          doc.text(String(facility.sanctionedAmount || '0'), margin + 70, yPosition + 3);
          doc.text(String(facility.outstandingAmount || '0'), margin + 115, yPosition + 3);
          doc.text(String(facility.headroom || '0'), margin + 160, yPosition + 3);
          yPosition += 8;
        });

        yPosition += 4;
      }

      if (selected.deferralDescription || selected.description) {
        const descText = selected.deferralDescription || selected.description || '';
        yPosition = addCardSection('Deferral Description', [{ label: 'Description', value: descText }]);
      }

      const approvalFlow = Array.isArray(selected.approverFlow) && selected.approverFlow.length > 0
        ? selected.approverFlow
        : (Array.isArray(selected.approvers) ? selected.approvers : []);

      if (approvalFlow.length > 0) {
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

        approvalFlow.forEach((approver, index) => {
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
          const date = approver.approvedDate || approver.rejectedDate || approver.returnedDate || approver.approvedAt || '';
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

      if (selected.documents && selected.documents.length > 0) {
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

        selected.documents.forEach((docItem, index) => {
          if (yPosition > 260) {
            doc.addPage();
            yPosition = 15;
          }

          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPosition - 2, contentWidth, 10, 'F');
          }

          const docName = docItem.name || `Document ${index + 1}`;
          const fileExt = docName.split('.').pop().toLowerCase();
          const fileColor = fileExt === 'pdf' ? ERROR_RED_RGB : fileExt === 'xlsx' || fileExt === 'xls' ? SUCCESS_GREEN_RGB : PRIMARY_BLUE_RGB;

          doc.setFillColor(fileColor[0], fileColor[1], fileColor[2]);
          doc.circle(margin + 5, yPosition + 3, 2.5, 'F');

          doc.setFontSize(9);
          doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
          doc.setFont(undefined, 'normal');
          doc.text(docName, margin + 12, yPosition + 3, { maxWidth: contentWidth - 50 });

          if (docItem.fileSize) {
            doc.setFontSize(8);
            doc.setTextColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
            doc.text(`(${(docItem.fileSize / 1024).toFixed(2)} KB)`, margin + 155, yPosition + 3);
          }

          yPosition += 10;
        });

        yPosition += 4;
      }

      if (selected.comments && selected.comments.length > 0) {
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

        selected.comments.forEach((comment, index) => {
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
          const initials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.setFont(undefined, 'bold');
          doc.text(initials, margin + 2.3, yPosition + 4);

          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
          doc.text(authorName, margin + 13, yPosition + 3);

          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
          doc.text(`(${authorRole})`, margin + 60, yPosition + 3);
          doc.text(commentDate, margin + 115, yPosition + 3);

          yPosition += 10;
          doc.setFontSize(9);
          doc.setTextColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
          commentLines.forEach((line) => {
            doc.text(line, margin + 13, yPosition);
            yPosition += 6;
          });

          yPosition += 4;
        });
      }

      yPosition += 8;
      doc.setFont(undefined, 'italic');
      doc.setFontSize(9);
      doc.setTextColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
      doc.text(`Generated on: ${dayjs().format('DD MMM YYYY HH:mm')}`, margin, yPosition);
      doc.text('This is a system-generated report.', margin, yPosition + 6);

      doc.save(`Deferral_${selected.deferralNumber}_${dayjs().format('YYYYMMDD')}.pdf`);
      message.success('Deferral downloaded as PDF successfully!');
    } catch (error) {
      console.error('Error downloading file:', error);
      message.error('Failed to download deferral. Please try again.');
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
        width={950}
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
              </Descriptions>
            </Card>

            <Card className="deferral-info-card" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Deferral Details</span>} style={{ marginBottom: 18 }}>
              <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="Deferral Number"><Text strong style={{ color: PRIMARY_BLUE }}>{selected.deferralNumber}</Text></Descriptions.Item>
                <Descriptions.Item label="DCL No"><Text strong style={{ color: PRIMARY_BLUE }}>{selected.dclNo || selected.dclNumber}</Text></Descriptions.Item>
                <Descriptions.Item label="Status">
                  {selectedStatus === 'deferral_requested' || selectedStatus === 'pending_approval' ? (
                    <UniformTag color="processing" text="Pending" />
                  ) : selectedStatus === 'deferral_approved' || selectedStatus === 'approved' ? (
                    <UniformTag color="success" text="Approved" />
                  ) : selectedStatus === 'deferral_rejected' || selectedStatus === 'rejected' ? (
                    <UniformTag color="error" text="Rejected" />
                  ) : (
                    <div style={{ fontWeight: 500 }}>{selectedStatus}</div>
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="Creator Status">
                  <UniformTag
                    color={selected.creatorApprovalStatus === 'approved' ? 'success' : selected.creatorApprovalStatus === 'rejected' ? 'error' : 'processing'}
                    text={selected.creatorApprovalStatus === 'approved' ? 'Approved' : selected.creatorApprovalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                  />
                </Descriptions.Item>

                <Descriptions.Item label="Checker Status">
                  <UniformTag
                    color={selected.checkerApprovalStatus === 'approved' ? 'success' : selected.checkerApprovalStatus === 'rejected' ? 'error' : 'processing'}
                    text={selected.checkerApprovalStatus === 'approved' ? 'Approved' : selected.checkerApprovalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                  />
                </Descriptions.Item>

                <Descriptions.Item label="Approvers Status">
                  {(() => {
                    if (selectedStats.total === 0) {
                      return <UniformTag color="processing" text="No approvers" maxChars={12} />;
                    }

                    if (selectedStats.approved === selectedStats.total) {
                      return <UniformTag color="success" icon={<CheckCircleOutlined />} text="All Approved" maxChars={12} />;
                    }

                    return <UniformTag color="processing" text={`${selectedStats.approved} of ${selectedStats.total} Approved`} maxChars={14} />;
                  })()}
                </Descriptions.Item>

                <Descriptions.Item label="Loan Amount">
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12 }}>
                    {(function () {
                      const loanAmountCandidates = [selected.loanAmount, selected.requestedAmount, selected.amount];
                      const facilitiesTotal = (Array.isArray(selected.facilities) ? selected.facilities : []).reduce((sum, facility) => {
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
                  {(() => {
                    return (
                      <div style={{ fontWeight: "bold", color: selectedDaysSoughtValue > 45 ? ERROR_RED : selectedDaysSoughtValue > 30 ? WARNING_ORANGE : PRIMARY_BLUE, fontSize: 14 }}>
                        {selectedDaysSoughtValue} days
                      </div>
                    );
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="Deferral Due Date">
                  {(() => {
                    const fallbackDueDate =
                      selected.createdAt && Number(selected.daysSought || 0) > 0
                        ? dayjs(selected.createdAt).add(Number(selected.daysSought || 0), 'day').toISOString()
                        : null;
                    const finalDueDate = selectedNextDueDateValue || fallbackDueDate;

                    return (
                      <div style={{ color: PRIMARY_BLUE }}>
                        {finalDueDate ? `${dayjs(finalDueDate).format('DD MMM YYYY')}` : 'Not calculated'}
                      </div>
                    );
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  <div>
                    <Text strong style={{ color: PRIMARY_BLUE }}>{dayjs(selected.createdAt || selected.requestedDate).format('DD MMM YYYY')}</Text>
                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>{dayjs(selected.createdAt || selected.requestedDate).format('HH:mm')}</Text>
                  </div>
                </Descriptions.Item>
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
                          {isUploaded && uploadedVersion && uploadedVersion.url && (
                            <>
                              <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDocument(uploadedVersion)} size="small">View</Button>
                              <Button type="text" icon={<DownloadOutlined />} onClick={() => handleDownloadDocument(uploadedVersion)} size="small">Download</Button>
                            </>
                          )}
                        </Space>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : null}

            {selected.deferralDescription && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0', marginBottom: 18 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Deferral Description</Text>
                <div style={{ padding: 12, backgroundColor: '#f8f9fa', borderRadius: 6, border: '1px solid #e8e8e8' }}>
                  <Text>{selected.deferralDescription}</Text>
                </div>
              </div>
            )}

            {selected.facilities && selected.facilities.length > 0 && (
              <Card size="small" title={<span style={{ color: PRIMARY_BLUE }}>Facility Details ({selected.facilities.length})</span>} style={{ marginBottom: 18, marginTop: 12 }}>
                <Table dataSource={selected.facilities} columns={getFacilityColumns()} pagination={false} size="small" rowKey={(r) => r.facilityNumber || r._id || `facility-${Math.random().toString(36).slice(2)}`} scroll={{ x: 600 }} />
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
                          doc.url ? <Button key="view" type="link" onClick={() => handleViewDocument(doc)} size="small">View</Button> : null,
                          doc.url ? <Button key="download" type="link" onClick={() => handleDownloadDocument(doc)} size="small">Download</Button> : null,
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
                          doc.url ? <Button key="view" type="link" onClick={() => handleViewDocument(doc)} size="small">View</Button> : null,
                          doc.url ? <Button key="download" type="link" onClick={() => handleDownloadDocument(doc)} size="small">Download</Button> : null,
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
              style={{ marginBottom: 18, opacity: selected?.status === 'rejected' ? 0.6 : 1 }}
            >
              {selected?.status === 'rejected' && (
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: selected?.status === 'rejected' ? 'none' : 'auto' }}>
                {(function () {
                  const approvers = [];
                  let hasApprovers = false;

                  if (selected?.approverFlow && Array.isArray(selected.approverFlow)) {
                    hasApprovers = true;
                    selected.approverFlow.forEach((approver, index) => {
                      const isApproved = approver.approved === true || approver.approved === 'true';
                      const isRejected = approver.rejected === true || approver.rejected === 'true';
                      const isReturned = approver.returned === true || approver.returned === 'true';
                      const isCurrent = !isApproved && !isRejected && !isReturned && (index === selected.currentApproverIndex || selected.currentApprover === approver || selected.currentApprover?._id === approver?._id);

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
                  } else if (selected?.approvers && Array.isArray(selected.approvers)) {
                    hasApprovers = true;
                    selected.approvers.forEach((approver, index) => {
                      const isApproved = approver.approved === true || approver.approved === 'true';
                      const isRejected = approver.rejected === true || approver.rejected === 'true';
                      const isReturned = approver.returned === true || approver.returned === 'true';
                      const isCurrent = !isApproved && !isRejected && !isReturned && (index === selected.currentApproverIndex || selected.currentApprover === approver || selected.currentApprover?._id === approver?._id);

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

                          {approver.isCurrent && !approver.isApproved && !approver.isRejected && !approver.isReturned && selected?.status !== 'rejected' && (
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

            {/* Comment Trail & History */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ color: PRIMARY_BLUE, marginBottom: 16 }}>Comment Trail & History</h4>
              <CommentTrail
                history={selectedHistory}
                isLoading={false}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Actioned;