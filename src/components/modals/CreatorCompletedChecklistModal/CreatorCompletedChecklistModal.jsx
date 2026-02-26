import React from "react";
import { Modal, Button, Spin, Tag } from "antd";
import { FilePdfOutlined, RedoOutlined, LeftOutlined, RightOutlined, CloseOutlined } from "@ant-design/icons";
import { useGetChecklistCommentsQuery } from "../../../api/checklistApi";
import { calculateDocumentStats } from "../../../utils/documentUtils";
import ReviveConfirmationModal from "./ReviveConfirmationModal";
import ChecklistInfoCard from "./ChecklistInfoCard";
import ProgressStatsSection from "./ProgressStatsSection";
import DocumentsTable from "./DocumentsTable";
import CommentHistorySection from "./CommentHistorySection";
import DocumentSidebarComponent from "../CompletedChecklistModalComponents/DocumentSidebarComponent";
import { buttonStyles } from "../../styles/componentStyle";
import { modalStyles } from "../../styles/modalStyle";
import { useChecklistDocuments } from "../../../hooks/useChecklistDocuments";
import { useReviveChecklist } from "./hooks/useReviveChecklist";
import { usePDFGeneration } from "./hooks/usePDFGeneration";
// import usePDFGenerator from "../../../hooks/usePDFGenerator"; // Import the hook

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
  const { docs, documentCounts } = useChecklistDocuments(checklist);
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
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log("📄 Supporting docs API response:", result);
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            // Add category and isSupporting flag for proper sidebar grouping
            const docsWithCategory = result.data.map(doc => ({
              ...doc,
              category: 'Supporting Documents',
              isSupporting: true
            }));
            setSupportingDocs(docsWithCategory);
            console.log("📄 Supporting docs fetched successfully (", docsWithCategory.length, " docs)");
          } else {
            console.log("✓ API returned ok but no supporting docs for checklist", checklistId);
            setSupportingDocs([]);
          }
        } else {
          console.warn(`⚠️ API returned ${response.status} for checklist ${checklistId}:`, await response.text());
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
    console.log("👤 CreatorCompletedChecklistModal - Checklist ID for comments:", checklistId);
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
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
              {`Completed Checklist  ${checklist?.title || ""}`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
                onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
                size="small"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#164679',
                  borderColor: '#164679',
                  color: '#fff',
                  padding: '4px 12px',
                  height: '32px',
                }}
              >
                View Documents
                {docs.filter((d) => d.fileUrl || d.category === "Supporting Documents").length >
                  0 && (
                  <Tag color="green" style={{ marginLeft: 6, marginBottom: 0 }}>
                    {docs.filter((d) => d.fileUrl || d.category === "Supporting Documents").length}
                  </Tag>
                )}
                {supportingDocs.length > 0 && (
                  <Tag color="blue" style={{ marginLeft: 6, marginBottom: 0 }}>
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
        width="calc(100vw - 360px)"
        centered={true}
        style={{ marginLeft: '320px' }}
        closeIcon={null}
        footer={renderFooter()}
        styles={modalStyles}
      >
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
      </Modal>

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
