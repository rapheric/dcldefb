// src/components/completedChecklistModal/CompletedChecklistModal.jsx
import React, { useState } from "react";
import { Button, message } from "antd";
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
    console.log(
      "✅ CompletedChecklistModal - Checklist ID for comments:",
      checklistId,
    );
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
    <>
      <style>{`
        /* Completed Modal Overlay */
        .completed-modal-overlay {
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
        
        /* Completed Modal Container - centered */
        .completed-modal-container {
          background: white;
          border-radius: 12px;
          overflow: visible;
          width: 1200px;
          max-width: calc(100vw - 310px);
          box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.15), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          margin: 0 16px 0 46px;
          position: relative;
          z-index: 1001;
        }

        /* Header styling */
        .completed-modal-header {
          background: #164679;
          padding: 18px 24px;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        /* Body styling */
        .completed-modal-body {
          padding: 24px;
          max-height: calc(100vh - 250px);
          overflow-y: auto;
        }

        /* Footer styling */
        .completed-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          background: #f7f9fc;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }
        
        /* Responsive adjustments */
        @media (min-width: 768px) and (max-width: 1099px) {
          .completed-modal-overlay {
            left: var(--sidebar-width, 40px);
            transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
          }
          .completed-modal-container {
            width: calc(100vw - 120px) !important;
            max-width: calc(100vw - 120px) !important;
            margin: 0 16px 0 16px !important;
          }
        }
        
        @media (max-width: 767px) {
          .completed-modal-overlay {
            left: 0;
            padding-left: 0;
            padding-right: 16px;
          }
          .completed-modal-container {
            width: calc(100vw - 32px) !important;
            max-width: calc(100vw - 32px) !important;
            margin: 0 16px 0 0px !important;
          }
        }
      `}</style>

      <div
        className="completed-modal-overlay"
        style={{
          display: open ? "flex" : "none",
        }}
        onClick={onClose}
      >
        {open && (
          <div
            className="completed-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="completed-modal-header">
              <div
                style={{ color: "white", fontSize: "15px", fontWeight: 600 }}
              >
                Completed Checklist -{" "}
                {checklist?.title || checklist?.dclNo || ""}
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Button
                  icon={
                    showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />
                  }
                  onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
                  size="small"
                  type="primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    height: "32px",
                    backgroundColor: PRIMARY_BLUE,
                    borderColor: PRIMARY_BLUE,
                  }}
                >
                  View Documents
                  {docsCount > 0 && (
                    <Tag
                      color="green"
                      style={{ marginLeft: 6, marginBottom: 0 }}
                    >
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
            </div>

            {/* Body */}
            <div className="completed-modal-body">
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
            </div>

            {/* Footer */}
            <div className="completed-modal-footer">
              <Button
                key="download"
                icon={<FilePdfOutlined />}
                loading={isGenerating}
                onClick={handleDownloadPDF}
                type="primary"
                style={{
                  backgroundColor: PRIMARY_BLUE,
                  borderColor: PRIMARY_BLUE,
                }}
              >
                {getPDFButtonText()}
              </Button>
              <Button key="close" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CompletedChecklistModal;
