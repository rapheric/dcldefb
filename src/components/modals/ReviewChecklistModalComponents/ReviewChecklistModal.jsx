// export default ReviewChecklistModal;
import React, { useState, useEffect } from "react";
import { Modal, Button, Tag, Input } from "antd";
import { FilePdfOutlined, LeftOutlined, CloseOutlined, PlusOutlined } from "@ant-design/icons";
import ActionButtons from "./ActionButtons";
import DocumentSidebar from "./DocumentSidebar";
import ChecklistHeader from "./ChecklistHeader";
import SupportingDocsSection from "./SupportingDocsSection";
import { useDocumentHandlers } from "../../../hooks/useDocumentHandlers";
// import { useDocumentStats } from "../../../hooks/useDocumentStats";
import { useChecklistOperations } from "../../../hooks/useChecklistOperations";
import { PRIMARY_BLUE } from "../../../utils/constants";
import CommentHistory from "../../common/CommentHistory";
import { useGetChecklistCommentsQuery } from "../../../api/checklistApi";
// import { API_BASE_URL } from "../../../utils/checklistUtils";
// import { customStyles } from "../../../styles/theme";
import { RightOutlined } from "@ant-design/icons";
// import { LeftOutlined } from "@ant-design/icons";
import DocumentTable from "./DocumentTable";
import { customStyles } from "../../styles/Theme";
import { useDocumentStats } from "../../../hooks/useDocumentStats";
import ProgressStats from "./ProgressStats";
import AddDocumentModal from "../../common/AddDocumentModal";
import { getUniqueCategories } from "../../../utils/checklistUtils";
import { loanTypeDocuments } from "../../../pages/docTypes";
import { useAddDocumentMutation } from "../../../api/checklistApi";
import { message } from "antd";

const ReviewChecklistModal = ({
  checklist,
  open,
  onClose,
  readOnly = false,
  onChecklistUpdate = null, // Callback to update parent with fresh checklist data
}) => {
  // State
  const [docs, setDocs] = useState([]);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [creatorComment, setCreatorComment] = useState("");
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [localChecklist, setLocalChecklist] = useState(checklist);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);

  // Hooks
  const documentStats = useDocumentStats(docs);
  const [addDocumentMutation, { isLoading: isAddingDocument }] = useAddDocumentMutation();

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
      skip: !checklist?.id && !checklist?._id,
    });

  // DEBUG: Log comment fetching
  React.useEffect(() => {
    const checklistId = checklist?.id || checklist?._id;
    console.log("📋 ReviewChecklistModal - Checklist ID for comments:", checklistId);
    console.log("📋 Comments Loading:", commentsLoading);
    console.log("📋 Comments Data:", comments);
    if (comments && Array.isArray(comments)) {
      console.log(`📋 Total comments fetched: ${comments.length}`);
    }
  }, [checklist?.id, checklist?._id, comments, commentsLoading]);

  const isActionDisabled = readOnly;
  // Check if checklist status allows actions (Creator can act on pending or cocreatorreview)
  const checklistStatus = (
    localChecklist?.status ||
    checklist?.status ||
    ""
  ).toLowerCase();
  const isCreatorReviewAllowed = [
    "pending",
    "cocreatorreview",
    "co_creator_review",
  ].includes(checklistStatus);
  const shouldGrayOut = isActionDisabled || !isCreatorReviewAllowed;

  const {
    handleActionChange,
    handleCommentChange,
    handleDeferralNoChange,
    handleDelete,
    handleExpiryDateChange,
    handleDeleteSupportingDoc,
  } = useDocumentHandlers(docs, setDocs, isActionDisabled);

  const handleChecklistUpdate = (updatedChecklist) => {
    // Update local state
    setLocalChecklist(updatedChecklist);
    // Call parent callback if provided
    if (onChecklistUpdate) {
      onChecklistUpdate(updatedChecklist);
    }
  };

  const {
    isSubmittingToRM,
    isCheckerSubmitting,
    isSavingDraft,
    uploadSupportingDoc,
    submitToRM,
    submitToCheckers,
    saveDraft,
  } = useChecklistOperations(
    checklist,
    docs,
    supportingDocs,
    creatorComment,
    null,
    handleChecklistUpdate,
    // ✅ NEW: Pass refetch callback to ensure parent refetches after submission
    () => {
      console.log("📡 useChecklistOperations requesting parent refetch");
      if (onChecklistUpdate) {
        onChecklistUpdate(checklist);
      }
    }
  );

  // State to trigger refetch of supporting docs
  const [supportingDocsRefreshKey, setSupportingDocsRefreshKey] = useState(0);

  // Get available categories based on loan type or existing documents
  const getAvailableCategories = () => {
    const loanType = checklist?.loanType || localChecklist?.loanType;
    if (loanType && loanTypeDocuments[loanType]) {
      // Get categories from the predefined loan type documents
      return loanTypeDocuments[loanType].map(cat => cat.title);
    }
    // Fallback to existing document categories
    return getUniqueCategories(docs);
  };

  // Handle adding a new document - saves to database immediately
  const handleAddDocument = async (newDoc) => {
    console.log("Adding new document:", newDoc);
    const checklistId = checklist?.id || checklist?._id;

    if (!checklistId) {
      message.error("Checklist ID missing - cannot add document");
      return;
    }

    try {
      // Prepare document data for API
      const documentData = {
        name: newDoc.name,
        category: newDoc.category,
        status: newDoc.status || "pending",
        comment: newDoc.comment || "",
      };

      console.log("📤 Saving new document to database:", documentData);

      // Call API to add document to database
      const result = await addDocumentMutation({
        id: checklistId,
        data: documentData,
      }).unwrap();

      console.log("✅ Document saved to database:", result);

      // Add the new document to local state with the returned ID
      const savedDoc = {
        ...newDoc,
        docIdx: docs.length,
        _id: result?.document?._id || result?.document?.id || result?._id || result?.id,
        id: result?.document?.id || result?.document?._id || result?.id || result?._id,
        status: result?.document?.status || newDoc.status || "pending",
      };

      setDocs(prevDocs => [...prevDocs, savedDoc]);

      message.success("Document added successfully!");

      // Trigger checklist update to refresh data from server
      if (onChecklistUpdate && result?.checklist) {
        handleChecklistUpdate(result.checklist);
      }
    } catch (error) {
      console.error("❌ Error adding document:", error);
      message.error(
        error?.data?.message || error?.data?.error || "Failed to add document"
      );

      // Even if API call fails, add to local state so user can still submit with it
      // This allows the document to be included when submitting to RM
      const fallbackDoc = {
        ...newDoc,
        docIdx: docs.length,
        isNew: true, // Mark as new so backend knows to create it
      };
      setDocs(prevDocs => [...prevDocs, fallbackDoc]);
    }
  };

  // Wrapper for uploading supporting docs that updates local state and triggers refetch
  const handleUploadSupportingDoc = async (file) => {
    try {
      const newDoc = await uploadSupportingDoc(file);
      if (newDoc) {
        console.log("✅ Adding new supporting doc to state:", newDoc);
        setSupportingDocs((prev) => [...prev, newDoc]);
        // Trigger refetch to ensure all modals get updated data
        setSupportingDocsRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error("❌ Error uploading supporting doc:", error);
      throw error; // Re-throw to allow error handling in UI
    }
  };

  //   const isActionDisabled = readOnly || !["pending", "co_creator_review"].includes(
  //   const isActionDisabled = readOnly || !["pending", "co_creator_review"].includes(
  //     checklist?.status?.toLowerCase(),
  //   );

  // Sync localChecklist with prop when modal opens or checklist changes
  useEffect(() => {
    setLocalChecklist(checklist);
  }, [checklist, open]);

  useEffect(() => {
    const sourceChecklist = localChecklist || checklist;
    if (!sourceChecklist) {
      console.warn("⚠️ No checklist available for document loading");
      setDocs([]);
      return;
    }

    // Try multiple document sources: documents, docList, items
    const documentArray = sourceChecklist.documents || sourceChecklist.docList || sourceChecklist.items || [];
    
    if (!Array.isArray(documentArray)) {
      console.warn("⚠️ Document array is not an array:", documentArray);
      setDocs([]);
      return;
    }

    console.log("📋 Raw document array from sourceChecklist:", {
      documentsCount: documentArray.length,
      firstDoc: documentArray[0]
    });

    const flatDocs = documentArray.reduce((acc, item) => {
      // Handle nested structure with docList
      if (item.docList && Array.isArray(item.docList) && item.docList.length > 0) {
        const nestedDocs = item.docList.map((doc) => ({
          ...doc,
          category: item.category || doc.category,
          checkerStatus: doc.checkerStatus || item.checkerStatus,
        }));
        return acc.concat(nestedDocs);
      }
      // Handle flat structure (direct documents)
      if (item.title || item.fileName || item.status) {
        return acc.concat(item);
      }
      return acc;
    }, []);

    console.log("📋 Flattened documents:", {
      count: flatDocs.length,
      firstDoc: flatDocs[0]
    });

    const preparedDocs = flatDocs.map((doc, idx) => ({
      ...doc,
      docIdx: idx,
      status: doc.status || doc.action || "pending", // PRESERVE original status from backend
      creatorStatus: doc.creatorStatus, // PRESERVE creator status from backend
      checkerStatus: doc.checkerStatus, // PRESERVE checker status from backend
      checkerComment: doc.checkerComment || "", // ✅ Include checker comment from backend
      action: doc.action || doc.status || "pending", // Use action if it exists, otherwise use status
      comment: doc.comment || "",
      fileUrl: doc.fileUrl || null,
      expiryDate: doc.expiryDate || null,
      finalCheckerStatus: doc.checkerStatus || doc.finalCheckerStatus,
      deferralNumber: doc.deferralNumber || doc.deferralNo || "",
      deferralNo: doc.deferralNo || doc.deferralNumber || "",
      rmStatus: doc.rmStatus || "",
    }));

    console.log("📋 Documents prepared in ReviewChecklistModal:", {
      count: preparedDocs.length,
      firstDoc: preparedDocs[0]
    });
    
    setDocs(preparedDocs);
  }, [localChecklist, checklist]);

  // Fetch supporting docs from backend when modal opens or checklist changes
  useEffect(() => {
    const checklistId = localChecklist?.id || checklist?.id || localChecklist?._id || checklist?._id;

    if (!checklistId || !open) return;

    const fetchSupportingDocs = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("📄 Fetching supporting docs for checklist:", checklistId);

        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/uploads/checklist/${checklistId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log("📄 Supporting docs API response:", result);

          // Handle different response structures
          const docsData = result.data || result.supportingDocs || result.documents || [];

          if (Array.isArray(docsData) && docsData.length > 0) {
            // Normalize and transform each document
            const docsWithCategory = docsData.map(doc => ({
              id: doc.id || doc._id,
              _id: doc._id || doc.id,
              name: doc.name || doc.fileName || 'Unknown',
              fileName: doc.fileName || doc.name || 'Unknown',
              fileUrl: doc.fileUrl,
              fileSize: doc.fileSize,
              fileType: doc.fileType,
              category: 'Supporting Documents',
              isSupporting: true,
              uploadedBy: doc.uploadedBy || doc.uploadedByName || 'Unknown',
              uploadedById: doc.uploadedById,
              uploadedByRole: doc.uploadedByRole,
              uploadedAt: doc.uploadedAt || doc.createdAt,
              uploadData: {
                fileName: doc.fileName || doc.name || 'Unknown',
                fileUrl: doc.fileUrl,
                createdAt: doc.uploadedAt || doc.createdAt,
                fileSize: doc.fileSize,
                fileType: doc.fileType,
                uploadedBy: doc.uploadedBy || doc.uploadedByName || 'Unknown',
              }
            }));
            setSupportingDocs(docsWithCategory);
            console.log("✅ Supporting docs fetched successfully (", docsWithCategory.length, " docs)");
          } else {
            console.log("ℹ️ No supporting docs for checklist", checklistId);
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

    fetchSupportingDocs();
  }, [checklist?.id, checklist?._id, localChecklist?.id, localChecklist?._id, open, supportingDocsRefreshKey]);

  return (
    <>
      <style>{customStyles}</style>
      <style>{`
        .review-checklist-modal .ant-modal-header {
          background: ${PRIMARY_BLUE} !important;
          border-bottom: none !important;
        }
        .review-checklist-modal .ant-modal-title {
          color: #fff !important;
        }
      `}</style>
      <Modal
        className="review-checklist-modal"
        closeIcon={null}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
              {`Review Checklist  ${checklist?.title || ""}`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
                onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
                size="small"
                type="default"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  color: '#fff',
                }}
              >
                View Documents
                {docs.filter((d) => d.fileUrl).length + supportingDocs.length >
                  0 && (
                  <Tag color="green" style={{ marginLeft: 6, marginBottom: 0 }}>
                    {docs.filter((d) => d.fileUrl).length + supportingDocs.length}
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
        width={1150}
        centered={true}
        style={{ marginLeft: '160px' }}
        styles={{ body: { padding: "0 24px 24px" } }}
        footer={
          <ActionButtons
            readOnly={readOnly}
            isActionDisabled={isActionDisabled || shouldGrayOut}
            shouldGrayOut={shouldGrayOut}
            isSubmittingToRM={isSubmittingToRM}
            isCheckerSubmitting={isCheckerSubmitting}
            isSavingDraft={isSavingDraft}
            checklist={checklist}
            docs={docs}
            supportingDocs={supportingDocs}
            creatorComment={creatorComment}
            onSaveDraft={saveDraft}
            onSubmitToRM={submitToRM}
            onSubmitToCheckers={submitToCheckers}
            onUploadSupportingDoc={handleUploadSupportingDoc}
            onClose={onClose}
            comments={comments}
          />
        }
      >
        {/* Document Sidebar */}
        <DocumentSidebar
          documents={docs}
          supportingDocs={supportingDocs}
          open={showDocumentSidebar}
          onClose={() => setShowDocumentSidebar(false)}
          onDeleteSupportingDoc={handleDeleteSupportingDoc}
        />

        {checklist && (
          <div
            style={{
              opacity: shouldGrayOut ? 0.5 : 1,
              pointerEvents: shouldGrayOut ? "none" : "auto",
              transition: "opacity 0.3s ease",
            }}
          >
            {/* Checklist Header */}
            <ChecklistHeader checklist={checklist} />

            {/* Progress Stats */}
            <ProgressStats docs={docs} />

            {shouldGrayOut && !isActionDisabled && (
              <div
                style={{
                  background: "#fff7e6",
                  border: "1px solid #ffd591",
                  borderRadius: 8,
                  padding: "8px 16px",
                  marginBottom: 16,
                  color: "#d46b08",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                This checklist status doesn't allow Creator actions — all fields
                are read-only.
              </div>
            )}

            {/* Document Table */}
            <DocumentTable
              docs={docs}
              onActionChange={handleActionChange}
              onCommentChange={handleCommentChange}
              onDeferralNoChange={handleDeferralNoChange}
              onDelete={handleDelete}
              onExpiryDateChange={handleExpiryDateChange}
              isActionDisabled={isActionDisabled || shouldGrayOut}
              checklistStatus={checklist?.status}
            />

            {/* Add Document Button - Only show when actions are allowed */}
            {!shouldGrayOut && (
              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => setIsAddDocModalOpen(true)}
                  style={{
                    width: "100%",
                    borderColor: PRIMARY_BLUE,
                    color: PRIMARY_BLUE,
                    height: 40,
                    fontWeight: 600,
                  }}
                >
                  Add New Document
                </Button>
              </div>
            )}

            {/* Creator Comment */}
            <div style={{ marginTop: 16 }}>
              <h4
                style={{
                  color: PRIMARY_BLUE,
                  fontWeight: 700,
                  marginBottom: 4,
                  fontSize: 13,
                }}
              >
                Creator Comment
              </h4>
              <Input.TextArea
                rows={2}
                value={creatorComment}
                onChange={(e) => setCreatorComment(e.target.value)}
                disabled={isActionDisabled || shouldGrayOut}
                placeholder="Add a comment for RM / Co-Checker"
                style={{ borderRadius: 6 }}
              />
            </div>

            {/* Comment History */}
            <div style={{ marginTop: 16 }}>
              <h4
                style={{
                  color: PRIMARY_BLUE,
                  fontWeight: 700,
                  marginBottom: 4,
                  fontSize: 13,
                }}
              >
                Comment Trail & History
              </h4>
              <CommentHistory comments={comments} isLoading={commentsLoading} />
            </div>
          </div>
        )}
      </Modal>

      {/* Add Document Modal */}
      <AddDocumentModal
        open={isAddDocModalOpen}
        onClose={() => setIsAddDocModalOpen(false)}
        onAdd={handleAddDocument}
        categories={getAvailableCategories()}
        title="Add New Document to Checklist"
        showFileUpload={false}
      />
    </>
  );
};

export default ReviewChecklistModal;
