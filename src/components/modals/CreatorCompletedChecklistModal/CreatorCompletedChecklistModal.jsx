import React from "react";
import { Button, Spin, Tag } from "antd";
import {
  FilePdfOutlined,
  RedoOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useGetChecklistCommentsQuery } from "../../../api/checklistApi";
import { calculateDocumentStats } from "../../../utils/documentUtils";
import ReviveConfirmationModal from "./ReviveConfirmationModal";
import ChecklistInfoCard from "./ChecklistInfoCard";
import ProgressStatsSection from "./ProgressStatsSection";
import DocumentsTable from "./DocumentsTable";
import CommentHistorySection from "./CommentHistorySection";
import DocumentSidebarComponent from "../CompletedChecklistModalComponents/DocumentSidebarComponent";
import { buttonStyles } from "../../styles/componentStyle";
import { useChecklistDocuments } from "../../../hooks/useChecklistDocuments";
import { useReviveChecklist } from "./hooks/useReviveChecklist";
import { usePDFGeneration } from "./hooks/usePDFGeneration";

const CreatorCompletedChecklistModal = ({
  checklist,
  open,
  onClose,
  onRevive,
  onRefreshData,
  readOnly = false,
  getFullUrlUtil,
}) => {
  // Get documents using custom hook
  const { docs } = useChecklistDocuments(checklist);
  const [showDocumentSidebar, setShowDocumentSidebar] = React.useState(false);
  const [supportingDocs, setSupportingDocs] = React.useState([]);

  // Fetch supporting docs from backend when modal opens or checklist changes
  React.useEffect(() => {
    const checklistId = checklist?.id || checklist?._id;

    if (!checklistId || !open) return;

    const fetchSupportingDocs = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5000/api/uploads/checklist/${checklistId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const result = await response.json();
          console.log("📄 Supporting docs API response:", result);
          if (
            result.data &&
            Array.isArray(result.data) &&
            result.data.length > 0
          ) {
            // Add category and isSupporting flag for proper sidebar grouping
            const docsWithCategory = result.data.map((doc) => ({
              ...doc,
              category: "Supporting Documents",
              isSupporting: true,
            }));
            setSupportingDocs(docsWithCategory);
            console.log(
              "📄 Supporting docs fetched successfully (",
              docsWithCategory.length,
              " docs)",
            );
          } else {
            console.log(
              "✓ API returned ok but no supporting docs for checklist",
              checklistId,
            );
            setSupportingDocs([]);
          }
        } else {
          console.warn(
            `⚠️ API returned ${response.status} for checklist ${checklistId}:`,
            await response.text(),
          );
          // Don't clear existing docs on error - keep what we have
        }
      } catch (error) {
        console.error("❌ Error fetching supporting docs:", error.message);
        // Don't clear existing docs on error - supporting docs are optional
      }
    };

    // Always fetch from API
    fetchSupportingDocs();
  }, [checklist?.id, checklist?._id, open]);

  // Calculate document stats - calculateDocumentStats now handles non-array input
  const documentStats = calculateDocumentStats(docs);

  // Use custom hooks
  const {
    isReviving,
    showReviveConfirm,
    handleReviveChecklist,
    handleConfirmRevive,
    handleCancelRevive,
  } = useReviveChecklist(checklist, onRevive, onRefreshData, onClose);

  const { isGeneratingPDF, generatePDF } = usePDFGeneration();

  // Get comments
  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
      skip: !checklist?.id && !checklist?._id,
    });

  // DEBUG: Log comment fetching
  React.useEffect(() => {
    const checklistId = checklist?.id || checklist?._id;
    console.log(
      "👤 CreatorCompletedChecklistModal - Checklist ID for comments:",
      checklistId,
    );
    console.log("👤 Comments Loading:", commentsLoading);
    console.log("👤 Comments Data:", comments);
    if (comments && Array.isArray(comments)) {
      console.log(`👤 Total comments fetched: ${comments.length}`);
    }
  }, [checklist?.id, checklist?._id, comments, commentsLoading]);

  const handleDownloadPDF = async () => {
    // Ensure docs is an array before passing to generatePDF
    const safeDocs = Array.isArray(docs) ? docs : [];
    await generatePDF(checklist, safeDocs, documentStats, comments);
  };

  const handleReviveClick = () => {
    console.log("🚀 [CreatorCompletedChecklistModal] Revive button clicked!");
    console.log("📋 Checklist ID:", checklist?._id || checklist?.id);
    console.log("📋 readOnly:", readOnly);
    handleReviveChecklist();
  };

  const renderFooter = () => {
    // Always show revive button for completed/approved checklists, regardless of readOnly
    const checklistStatus = checklist?.status?.toLowerCase() || "";
    const isCompletedOrApproved =
      checklistStatus === "approved" ||
      checklistStatus === "completed" ||
      checklistStatus === "approvedandcompleted";

    return (
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <Button key="close" onClick={onClose}>
          Close
        </Button>
        {isCompletedOrApproved && (
          <Button
            key="revive"
            icon={<RedoOutlined />}
            loading={isReviving}
            disabled={isReviving}
            onClick={handleReviveClick}
            style={buttonStyles.revive}
          >
            Revive Checklist
          </Button>
        )}
        <Button
          key="download"
          icon={<FilePdfOutlined />}
          loading={isGeneratingPDF}
          onClick={handleDownloadPDF}
          type="primary"
          style={buttonStyles.download}
        >
          Download as PDF
        </Button>
      </div>
    );
  };

  return (
    <>
      <style>{`
        /* Creator Completed Modal Overlay */
        .creator-completed-modal-overlay {
          position: fixed;
          top: 65px;
          left: var(--sidebar-width, 120px);
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
        
        /* Creator Completed Modal Container - centered */
        .creator-completed-modal-container {
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
        .creator-completed-modal-header {
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
        .creator-completed-modal-body {
          padding: 24px;
          max-height: calc(100vh - 250px);
          overflow-y: auto;
        }

        /* Footer styling */
        .creator-completed-modal-footer {
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
          .creator-completed-modal-overlay {
            left: var(--sidebar-width, 40px);
            transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
          }
          .creator-completed-modal-container {
            width: calc(100vw - 120px) !important;
            max-width: calc(100vw - 120px) !important;
            margin: 0 16px 0 0 !important;
          }
        }
        
        @media (max-width: 767px) {
          .creator-completed-modal-overlay {
            left: 0;
            padding-left: 0;
            padding-right: 16px;
          }
          .creator-completed-modal-container {
            width: calc(100vw - 32px) !important;
            max-width: calc(100vw - 32px) !important;
            margin: 0 16px 0 0px !important;
          }
        }
      `}</style>

      <div
        className="creator-completed-modal-overlay"
        style={{
          display: open ? "flex" : "none",
        }}
        onClick={onClose}
      >
        {open && (
          <div
            className="creator-completed-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="creator-completed-modal-header">
              <span
                style={{ color: "#fff", fontSize: "15px", fontWeight: 600 }}
              >
                {`Completed Checklist  ${checklist?.title || ""}`}
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Button
                  icon={
                    showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />
                  }
                  onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
                  size="small"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "#164679",
                    borderColor: "#164679",
                    color: "#fff",
                    padding: "4px 12px",
                    height: "32px",
                  }}
                >
                  View Documents
                  {docs.filter(
                    (d) => d.fileUrl || d.category === "Supporting Documents",
                  ).length > 0 && (
                    <Tag
                      color="green"
                      style={{ marginLeft: 6, marginBottom: 0 }}
                    >
                      {
                        docs.filter(
                          (d) =>
                            d.fileUrl || d.category === "Supporting Documents",
                        ).length
                      }
                    </Tag>
                  )}
                  {supportingDocs.length > 0 && (
                    <Tag
                      color="blue"
                      style={{ marginLeft: 6, marginBottom: 0 }}
                    >
                      Supporting: {supportingDocs.length}
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
            <div className="creator-completed-modal-body">
              {checklist ? (
                <>
                  {/* Document Sidebar */}
                  <DocumentSidebarComponent
                    documents={Array.isArray(docs) ? docs : []}
                    supportingDocs={supportingDocs}
                    open={showDocumentSidebar}
                    onClose={() => setShowDocumentSidebar(false)}
                  />

                  <ChecklistInfoCard checklist={checklist} />
                  <ProgressStatsSection docs={docs} />
                  <DocumentsTable
                    docs={Array.isArray(docs) ? docs : []}
                    checklist={checklist}
                    getFullUrlUtil={getFullUrlUtil}
                  />
                  <CommentHistorySection
                    comments={comments}
                    isLoading={commentsLoading}
                  />
                </>
              ) : (
                <Spin tip="Loading checklist..." />
              )}
            </div>

            {/* Footer */}
            <div className="creator-completed-modal-footer">
              {renderFooter()}
            </div>
          </div>
        )}
      </div>

      <ReviveConfirmationModal
        open={showReviveConfirm}
        onCancel={handleCancelRevive}
        onConfirm={handleConfirmRevive}
        loading={isReviving}
      />
    </>
  );
};

export default CreatorCompletedChecklistModal;
