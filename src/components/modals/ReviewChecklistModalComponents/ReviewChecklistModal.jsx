// export default ReviewChecklistModal;
import React, { useState, useEffect } from "react";
import { Modal, Button, Tag, Input } from "antd";
import { FilePdfOutlined, LeftOutlined } from "@ant-design/icons";
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
import ProgressStats from "./ProgressStats";
import DocumentTable from "./DocumentTable";
import { customStyles } from "../../styles/Theme";
import { useDocumentStats } from "../../../hooks/useDocumentStats";

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

  // Hooks
  const documentStats = useDocumentStats(docs);

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
      skip: !checklist?.id && !checklist?._id,
    });

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
  );

  // Wrapper for uploading supporting docs that updates local state
  const handleUploadSupportingDoc = async (file) => {
    try {
      const newDoc = await uploadSupportingDoc(file);
      if (newDoc) {
        setSupportingDocs((prev) => [...prev, newDoc]);
      }
    } catch (error) {
      console.error("Error uploading supporting doc:", error);
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
    if (!sourceChecklist || !sourceChecklist.documents) return;

    const flatDocs = sourceChecklist.documents.reduce((acc, item) => {
      if (item.docList && Array.isArray(item.docList) && item.docList.length) {
        const nestedDocs = item.docList.map((doc) => ({
          ...doc,
          category: item.category,
          checkerStatus: doc.checkerStatus || item.checkerStatus,
        }));
        return acc.concat(nestedDocs);
      }
      if (item.category) return acc.concat(item);
      return acc;
    }, []);

    const preparedDocs = flatDocs.map((doc, idx) => ({
      ...doc,
      docIdx: idx,
      status: doc.status, // PRESERVE original status from backend
      action: doc.action || doc.status, // Use action if it exists, otherwise use status
      comment: doc.comment || "",
      fileUrl: doc.fileUrl || null,
      expiryDate: doc.expiryDate || null,
      finalCheckerStatus: doc.checkerStatus || doc.finalCheckerStatus,
      deferralNumber: doc.deferralNumber || doc.deferralNo || "",
      deferralNo: doc.deferralNo || doc.deferralNumber || "",
      rmStatus: doc.rmStatus || "",
    }));

    setDocs(preparedDocs);
  }, [localChecklist, checklist]);

  // Update supporting docs whenever checklist changes
  useEffect(() => {
    const sourceChecklist = localChecklist || checklist;
    if (sourceChecklist?.supportingDocs) {
      setSupportingDocs(sourceChecklist.supportingDocs);
    }
  }, [localChecklist?.supportingDocs, checklist?.supportingDocs]);

  return (
    <>
      <style>{customStyles}</style>
      <Modal
        title={`Review Checklist  ${checklist?.title || ""}`}
        open={open}
        onCancel={onClose}
        width={1150}
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
        {/* Document Sidebar Toggle */}
        <div className="doc-sidebar-toggle">
          <Button
            icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
            onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
          >
            View Documents
            {docs.filter((d) => d.fileUrl).length + supportingDocs.length >
              0 && (
              <Tag color="green" style={{ marginLeft: 6 }}>
                {docs.filter((d) => d.fileUrl).length + supportingDocs.length}
              </Tag>
            )}
          </Button>
        </div>

        {/* Document Sidebar */}
        <DocumentSidebar
          documents={docs}
          supportingDocs={supportingDocs}
          open={showDocumentSidebar}
          onClose={() => setShowDocumentSidebar(false)}
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

            {/* Creator Comment */}
            <div style={{ marginTop: 24 }}>
              <h4
                style={{
                  color: PRIMARY_BLUE,
                  fontWeight: 700,
                  marginBottom: 8,
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
                style={{ borderRadius: 8 }}
              />
            </div>

            {/* Comment History */}
            <div style={{ marginTop: 24 }}>
              <h4
                style={{
                  color: PRIMARY_BLUE,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Comment Trail & History
              </h4>
              <CommentHistory comments={comments} isLoading={commentsLoading} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ReviewChecklistModal;
