

// src/components/completedChecklistModal/CompletedChecklistModal.jsx
import React, { useState } from "react";
import { Button, Modal, message } from "antd";
import { Tag } from "antd";
import {
  FilePdfOutlined,
  RightOutlined,
  LeftOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useGetChecklistCommentsQuery } from "../../../api/checklistApi";
import { useChecklistDocuments } from "../../../hooks/useChecklistDocuments";
import { PRIMARY_BLUE } from "../../../utils/checklistConstants";
import usePDFGenerator from "../../../hooks/usePDFGenerator"; // Import the hook

// Import components
import ChecklistInfoCard from "./ChecklistInfoCard";
import DocumentSummary from "./DocumentSummary";
import DocumentsTable from "./DocumentsTable";
import CommentHistorySection from "./CommentHistorySection";
import DocumentSidebarComponent from "./DocumentSidebarComponent";

const CompletedChecklistModal = ({
  checklist,
  open,
  onClose,
  readOnly = false,
}) => {
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [supportingDocs, setSupportingDocs] = useState([]);

  // Get documents from the hook
  const { docs, documentCounts } = useChecklistDocuments(checklist);

  // Load supporting docs from checklist data
  React.useEffect(() => {
    if (checklist?.supportingDocs && Array.isArray(checklist.supportingDocs)) {
      setSupportingDocs(checklist.supportingDocs);
    } else {
      setSupportingDocs([]);
    }
  }, [checklist, checklist?.supportingDocs]);

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
      skip: !checklist?.id && !checklist?._id,
    });

  // Debug logging
  React.useEffect(() => {
    console.log("🔍 CompletedChecklistModal - Checklist data:", checklist);
    console.log("📋 Documents from hook:", docs);
    console.log("📊 Document counts:", documentCounts);
    
    // Also debug comments
    const checklistId = checklist?.id || checklist?._id;
    console.log("✅ CompletedChecklistModal - Checklist ID for comments:", checklistId);
    console.log("✅ Comments Loading:", commentsLoading);
    console.log("✅ Comments Data:", comments);
    if (comments && Array.isArray(comments)) {
      console.log(`✅ Total comments fetched: ${comments.length}`);
    }
  }, [checklist, docs, documentCounts, comments, commentsLoading]);

  // Use the PDF generator hook
  const { isGenerating, progress, generatePDF } = usePDFGenerator();

  const handleDownloadPDF = async () => {
    try {
      // Prepare documents for PDF generation
      const preparedDocs = docs.map((doc, index) => ({
        ...doc,
        name: doc.name || doc.documentName || `Document ${index + 1}`,
        category: doc.category || "Other",
        status: doc.status || doc.action || "pending",
        action: doc.action || doc.status || "pending",
        comment: doc.comment || "",
        expiryDate: doc.expiryDate || null,
        fileUrl: doc.fileUrl || null,
        checkerStatus:
          doc.checkerStatus || doc.finalCheckerStatus || "approved",
        finalCheckerStatus:
          doc.finalCheckerStatus || doc.checkerStatus || "approved",
        // Add other fields that your hook might expect
        rmStatus: doc.rmStatus || "completed",
        deferralNumber: doc.deferralNumber || doc.deferralNo || null,
      }));

      // Generate PDF using the hook
      await generatePDF({
        checklist: {
          ...checklist,
          // Ensure all required fields are present
          bankName: checklist?.bankName || "NCBA BANK KENYA PLC",
          bankInitials: checklist?.bankInitials || "NCBA",
          dclNo: checklist?.dclNo || "N/A",
          ibpsNo: checklist?.ibpsNo || "Not provided",
          loanType: checklist?.loanType || "N/A",
          customerNumber: checklist?.customerNumber || "N/A",
          customerName:
            checklist?.customerName || checklist?.customerNumber || "N/A",
          createdBy: checklist?.createdBy || { name: "N/A" },
          assignedToRM: checklist?.assignedToRM || { name: "N/A" },
          assignedToCoChecker: checklist?.assignedToCoChecker || {
            name: "Pending",
          },
          status: checklist?.status || "completed",
          createdAt: checklist?.createdAt || new Date().toISOString(),
          completedAt:
            checklist?.completedAt ||
            checklist?.updatedAt ||
            new Date().toISOString(),
          segment: checklist?.segment || "Corporate",
          branch: checklist?.branch || "Head Office",
        },
        documents: preparedDocs,
        supportingDocs: supportingDocs || [],
        creatorComment: checklist?.creatorComment || "",
        comments: comments || [],
        onProgress: (percent) => {
          console.log(`PDF Generation Progress: ${percent}%`);
        },
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to generate PDF. Please try again.");
    }
  };

  const docsCount = docs.filter(
    (d) => d.fileUrl || d.uploadData?.fileUrl,
  ).length;
  const supportingDocsCount = supportingDocs.filter(
    (d) => d.fileUrl || d.uploadData?.fileUrl || d.url,
  ).length;

  // Determine button text based on progress
  const getPDFButtonText = () => {
    if (isGenerating) {
      return progress > 0
        ? `Generating PDF (${progress}%)`
        : "Generating PDF...";
    }
    return "Download as PDF";
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ color: 'white', fontSize: '15px', fontWeight: 600 }}>
            Completed Checklist - {checklist?.title || checklist?.dclNo || ""}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
              onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
              size="small"
              type="primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                height: '32px',
              }}
            >
              View Documents
              {docsCount > 0 && (
                <Tag color="green" style={{ marginLeft: 6, marginBottom: 0 }}>
                  {docsCount}
                </Tag>
              )}
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={onClose}
              size="small"
              type="default"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.4)',
                color: '#fff',
                width: '32px',
                height: '32px',
                padding: 0,
              }}
            />
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1200}
      centered={false}
      wrapperClassName="modal-centered-in-content"
      closeIcon={null}
      styles={{
        header: {
          background: PRIMARY_BLUE,
          borderBottom: `1px solid ${PRIMARY_BLUE}`,
          padding: '12px 24px',
        },
        body: {
          padding: "24px",
        }
      }}
      footer={[
        <Button
          key="download"
          icon={<FilePdfOutlined />}
          loading={isGenerating}
          onClick={handleDownloadPDF}
          type="primary"
          style={{
            backgroundColor: PRIMARY_BLUE,
            borderColor: PRIMARY_BLUE,
            marginRight: "auto",
          }}
        >
          {getPDFButtonText()}
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {/* Document Sidebar */}
      <DocumentSidebarComponent
        documents={docs}
        supportingDocs={supportingDocs}
        open={showDocumentSidebar}
        onClose={() => setShowDocumentSidebar(false)}
      />

      {checklist && (
        <>
          <ChecklistInfoCard checklist={checklist} />
          <DocumentSummary documentCounts={documentCounts} />
          <DocumentsTable docs={docs} checklist={checklist} />
          <CommentHistorySection
            comments={comments}
            commentsLoading={commentsLoading}
          />
        </>
      )}
    </Modal>
  );
};

export default CompletedChecklistModal;
