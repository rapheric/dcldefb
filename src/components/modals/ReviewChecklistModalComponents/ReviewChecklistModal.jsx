// export default ReviewChecklistModal;
import React, { useState, useEffect } from "react";
import { Modal, Button, Tag, Input } from "antd";
import {
  FilePdfOutlined,
  LeftOutlined,
  CloseOutlined,
  PlusOutlined,
  LockOutlined,
} from "@ant-design/icons";
import ActionButtons from "./ActionButtons";
import DocumentSidebar from "../CheckerReviewChecklistModalComponents/DocumentSidebar";
import ChecklistHeader from "./ChecklistHeader";
import { useDocumentHandlers } from "../../../hooks/useDocumentHandlers";
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
import { useSelector } from "react-redux";
import ProgressStats from "./ProgressStats";
import AddDocumentModal from "../../common/AddDocumentModal";
import { getUniqueCategories } from "../../../utils/checklistUtils";
import { loanTypeDocuments } from "../../../pages/docTypes";
import {
  useAddDocumentMutation,
  useUnlockDclMutation,
} from "../../../api/checklistApi";
import { message } from "antd";
import { Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const ReviewChecklistModal = ({
  checklist,
  open,
  onClose,
  readOnly = false,
  onChecklistUpdate = null, // Callback to update parent with fresh checklist data
}) => {
  const auth = useSelector((state) => state.auth);
  const token = auth?.token || localStorage.getItem("token");

  // Check if DCL is locked by someone else (early, before used in JSX)
  const currentUserId = auth?.user?.id || auth?.user?._id;
  const lockedByUserId = checklist?.lockedByUserId || checklist?.lockedBy?.id;
  const lockedByUserName =
    checklist?.lockedBy?.name || checklist?.lockedByUserName;
  const isLockedBySomeoneElse =
    lockedByUserId && lockedByUserId !== currentUserId;
  const isLockedByMe = lockedByUserId === currentUserId;

  // State
  const [docs, setDocs] = useState([]);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [creatorComment, setCreatorComment] = useState("");
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [localChecklist, setLocalChecklist] = useState(checklist);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isUploadingSupportingDoc, setIsUploadingSupportingDoc] =
    useState(false);

  // Hooks
  // const documentStats = useDocumentStats(docs);
  const [addDocumentMutation] = useAddDocumentMutation();
  const [unlockDcl] = useUnlockDclMutation();

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
      skip: !checklist?.id && !checklist?._id,
    });

  // DEBUG: Log comment fetching
  React.useEffect(() => {
    const checklistId = checklist?.id || checklist?._id;
    console.log(
      "📋 ReviewChecklistModal - Checklist ID for comments:",
      checklistId,
    );
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
  // Disable actions if locked by someone else
  const shouldGrayOut =
    isActionDisabled || !isCreatorReviewAllowed || isLockedBySomeoneElse;

  const {
    handleActionChange,
    handleCommentChange,
    handleDeferralNoChange,
    handleDelete,
    handleExpiryDateChange,
  } = useDocumentHandlers(docs, setDocs, isActionDisabled);

  const handleChecklistUpdate = (updatedChecklist) => {
    // Merge the updated checklist with existing localChecklist to preserve fields not returned by submission
    const mergedChecklist = {
      ...localChecklist,
      ...checklist,
      ...updatedChecklist,
      // Ensure supportingDocs from backend response is preserved
      supportingDocs:
        updatedChecklist?.supportingDocs ||
        checklist?.supportingDocs ||
        localChecklist?.supportingDocs ||
        [],
    };

    console.log("🔄 handleChecklistUpdate called:");
    console.log(
      "   Updated checklist supportingDocs:",
      updatedChecklist?.supportingDocs?.length || 0,
    );
    console.log(
      "   Merged checklist supportingDocs:",
      mergedChecklist.supportingDocs?.length || 0,
    );

    // Update local state with merged checklist
    setLocalChecklist(mergedChecklist);

    // Call parent callback if provided
    if (onChecklistUpdate) {
      onChecklistUpdate(mergedChecklist);
    }
  };

  const {
    isSubmittingToRM,
    isCheckerSubmitting,
    isSavingDraft,
    submitToRM,
    submitToCheckers,
    saveDraft,
  } = useChecklistOperations(
    checklist,
    docs,
    supportingDocs, // Pass supportingDocs state
    creatorComment,
    null,
    handleChecklistUpdate,
    // ✅ NEW: Pass refetch callback to ensure parent refetches after submission
    () => {
      console.log("📡 useChecklistOperations requesting parent refetch");
      if (onChecklistUpdate) {
        onChecklistUpdate(checklist);
      }
    },
  );

  // Wrapper functions that unlock DCL after submission
  const submitToRMWithUnlock = async () => {
    const result = await submitToRM();
    // Unlock after successful submission
    const checklistId = checklist?.id || checklist?._id;
    if (checklistId) {
      try {
        await unlockDcl(checklistId).unwrap();
        console.log("🔓 DCL unlocked after RM submission");
      } catch (error) {
        console.warn("Failed to unlock DCL after RM submission:", error);
      }
    }
    return result;
  };

  const submitToCheckersWithUnlock = async () => {
    const result = await submitToCheckers();
    // Unlock after successful submission
    const checklistId = checklist?.id || checklist?._id;
    if (checklistId) {
      try {
        await unlockDcl(checklistId).unwrap();
        console.log("🔓 DCL unlocked after Checker submission");
      } catch (error) {
        console.warn("Failed to unlock DCL after Checker submission:", error);
      }
    }
    return result;
  };

  // Handle closing modal - do NOT unlock (only unlocks on submit)
  const handleClose = () => {
    onClose();
  };

  // Get available categories based on loan type or existing documents
  const getAvailableCategories = () => {
    const loanType = checklist?.loanType || localChecklist?.loanType;
    if (loanType && loanTypeDocuments[loanType]) {
      // Get categories from the predefined loan type documents
      return loanTypeDocuments[loanType].map((cat) => cat.title);
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
        _id:
          result?.document?._id ||
          result?.document?.id ||
          result?._id ||
          result?.id,
        id:
          result?.document?.id ||
          result?.document?._id ||
          result?.id ||
          result?._id,
        status: result?.document?.status || newDoc.status || "pending",
      };

      setDocs((prevDocs) => [...prevDocs, savedDoc]);

      message.success("Document added successfully!");

      // Trigger checklist update to refresh data from server
      if (onChecklistUpdate && result?.checklist) {
        handleChecklistUpdate(result.checklist);
      }
    } catch (error) {
      console.error("❌ Error adding document:", error);
      message.error(
        error?.data?.message || error?.data?.error || "Failed to add document",
      );

      // Even if API call fails, add to local state so user can still submit with it
      // This allows the document to be included when submitting to RM
      const fallbackDoc = {
        ...newDoc,
        docIdx: docs.length,
        isNew: true, // Mark as new so backend knows to create it
      };
      setDocs((prevDocs) => [...prevDocs, fallbackDoc]);
    }
  };

  // Wrapper for uploading supporting docs - uploads to backend and adds to main docs array
  const handleUploadSupportingDoc = async (file) => {
    try {
      setIsUploadingSupportingDoc(true);
      console.log(
        "📤 Co-Creator Modal - Uploading supporting document:",
        file.name,
      );

      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      const API_BASE_URL =
        import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

      // Upload to backend using the document upload endpoint
      const formData = new FormData();
      formData.append("file", file);
      formData.append("checklistId", checklistId);
      formData.append("documentName", file.name);
      formData.append("category", "Supporting Documents");

      const response = await fetch(`${API_BASE_URL}/api/uploads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Co-Creator Modal - Upload response:", result);

      if (!result.success || !result.data) {
        throw new Error("Invalid upload response");
      }

      const uploadedDoc = result.data;

      // Create document object for the uploaded supporting doc
      const newSupportingDoc = {
        id: uploadedDoc.id || uploadedDoc._id,
        _id: uploadedDoc._id || uploadedDoc.id,
        name: uploadedDoc.name || uploadedDoc.fileName || file.name,
        fileName: uploadedDoc.fileName || file.name,
        category: "Supporting Documents",
        status: "submitted",
        action: "submitted",
        creatorStatus: "submitted",
        checkerStatus: null,
        comment: "",
        fileUrl: uploadedDoc.fileUrl,
        fileSize: uploadedDoc.fileSize,
        fileType: uploadedDoc.fileType,
        uploadedBy: uploadedDoc.uploadedBy,
        uploadedByRole:
          uploadedDoc.uploadedByRole || auth?.user?.role || "cocreator",
        uploadedAt: uploadedDoc.createdAt || new Date().toISOString(),
        isSupporting: true,
        uploadData: {
          fileName: uploadedDoc.fileName || file.name,
          fileUrl: uploadedDoc.fileUrl,
          createdAt: uploadedDoc.createdAt || new Date().toISOString(),
          fileSize: uploadedDoc.fileSize,
          fileType: uploadedDoc.fileType,
          uploadedBy:
            uploadedDoc.uploadedBy || auth?.user?.name || "Co-Creator",
        },
      };

      console.log(
        "✅ Co-Creator Modal - Adding supporting doc to supportingDocs state (NOT to docs array):",
        newSupportingDoc,
      );

      // Add to supportingDocs state (separate from main docs - won't appear in DocumentTable)
      setSupportingDocs((prevDocs) => [...prevDocs, newSupportingDoc]);

      message.success(`"${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error(
        "❌ Co-Creator Modal - Error uploading supporting doc:",
        error,
      );
      message.error(error.message || "Failed to upload supporting document");
      throw error;
    } finally {
      setIsUploadingSupportingDoc(false);
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
    const documentArray =
      sourceChecklist.documents ||
      sourceChecklist.docList ||
      sourceChecklist.items ||
      [];

    if (!Array.isArray(documentArray)) {
      console.warn("⚠️ Document array is not an array:", documentArray);
      setDocs([]);
      return;
    }

    console.log("📋 Raw document array from sourceChecklist:", {
      documentsCount: documentArray.length,
      firstDoc: documentArray[0],
    });

    const flatDocs = documentArray.reduce((acc, item) => {
      // Handle nested structure with docList
      if (
        item.docList &&
        Array.isArray(item.docList) &&
        item.docList.length > 0
      ) {
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
      firstDoc: flatDocs[0],
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
      firstDoc: preparedDocs[0],
    });

    // Set main docs WITHOUT supporting docs
    setDocs(preparedDocs);
    console.log("📋 Main docs (excluding supporting):", preparedDocs.length);

    // Set supporting docs separately from checklist
    const supportingDocsData = sourceChecklist.supportingDocs || [];
    setSupportingDocs(supportingDocsData);
    console.log("📎 Supporting docs loaded:", supportingDocsData.length);
  }, [localChecklist, checklist]);

  return (
    <>
      <style>{customStyles}</style>
      <style>{`
        /* Overlay styling - full screen with proper z-index */
        .review-modal-overlay {
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
        
        /* Modal container - centered */
        .review-modal-container {
          background: white;
          border-radius: 12px;
          overflow: visible;
          width: 1200px;
          max-width: calc(100vw - 310px);
          box-shadow: none;
          border: 1px solid #e5e7eb;
          margin: 0 auto;
          position: relative;
          z-index: 1001;
        }
        
        /* Responsive adjustments */
        @media (min-width: 768px) and (max-width: 1099px) {
          .review-modal-overlay {
            left: var(--sidebar-width, 40px);
            transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
          }
        }
        
        @media (max-width: 767px) {
          .review-modal-overlay {
            left: 0;
            padding-left: 0;
            padding-right: 16px;
          }
          .review-modal-container {
            width: calc(100vw - 32px) !important;
            max-width: calc(100vw - 32px) !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <div
        className="review-modal-overlay"
        style={{
          display: open ? "flex" : "none",
        }}
        onClick={handleClose}
      >
        {open && (
          <div
            className="review-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Document Sidebar - Rendered inside modal */}
            <DocumentSidebar
              documents={docs}
              supportingDocs={supportingDocs}
              open={showDocumentSidebar}
              onClose={() => setShowDocumentSidebar(false)}
            />

            {/* Header */}
            <div
              className="bg-linear-to-r from-blue-600 to-blue-800 text-white"
              style={{
                background: PRIMARY_BLUE,
                borderRadius: "12px 12px 0 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "18px 24px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    style={{ color: "#fff", fontSize: "15px", fontWeight: 600 }}
                  >
                    {`Review Checklist  ${checklist?.title || ""}`}
                  </span>
                  {isLockedByMe && (
                    <Tag
                      icon={<LockOutlined />}
                      color="green"
                      style={{ marginBottom: 0, fontWeight: 600 }}
                    >
                      Locked by you
                    </Tag>
                  )}
                  {isLockedBySomeoneElse && (
                    <Tag
                      icon={<LockOutlined />}
                      color="orange"
                      style={{ marginBottom: 0, fontWeight: 600 }}
                    >
                      Locked by {lockedByUserName}
                    </Tag>
                  )}
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Button
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
                              d.fileUrl ||
                              d.category === "Supporting Documents",
                          ).length
                        }
                      </Tag>
                    )}
                  </Button>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={handleClose}
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
            </div>

            {/* Body */}
            <div
              className="p-6 space-y-6"
              style={{ padding: "24px" }}
              onClick={(e) => e.stopPropagation()}
            >
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

                  {/* Locked by someone else warning */}
                  {isLockedBySomeoneElse && (
                    <div
                      style={{
                        background: "#fff1f0",
                        border: "1px solid #ffccc7",
                        borderRadius: 8,
                        padding: "12px 16px",
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <LockOutlined
                        style={{ fontSize: 20, color: "#ff4d4f" }}
                      />
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#cf1322",
                            fontSize: 14,
                            marginBottom: 4,
                          }}
                        >
                          This DCL is currently being edited by{" "}
                          {lockedByUserName}
                        </div>
                        <div style={{ color: "#8c8c8c", fontSize: 12 }}>
                          You cannot make changes while someone else is working
                          on this checklist. Please try again later or contact
                          them if you need access.
                        </div>
                      </div>
                    </div>
                  )}

                  {shouldGrayOut &&
                    !isActionDisabled &&
                    !isLockedBySomeoneElse && (
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
                        This checklist status doesn't allow Creator actions —
                        all fields are read-only.
                      </div>
                    )}

                  {/* Document Table */}
                  <div>
                    <h3
                      style={{
                        color: PRIMARY_BLUE,
                        fontWeight: 700,
                        marginBottom: 12,
                        fontSize: 14,
                      }}
                    >
                      Required Documents
                    </h3>
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
                  </div>

                  {/* Add Document Button - Only show when actions are allowed */}
                  {!shouldGrayOut && (
                    <div style={{ marginTop: 16, marginBottom: 16 }}>
                      <Button
                        icon={<PlusOutlined />}
                        onClick={() => setIsAddDocModalOpen(true)}
                        style={{
                          width: "100%",
                          color: PRIMARY_BLUE,
                          height: 40,
                          fontWeight: 600,
                          fontSize: 13,
                          border: `1px solid ${PRIMARY_BLUE}`,
                          background: "transparent",
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
                    <CommentHistory
                      comments={comments}
                      isLoading={commentsLoading}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ borderTop: "1px solid #e5e7eb" }}>
              <ActionButtons
                readOnly={readOnly}
                isActionDisabled={isActionDisabled || shouldGrayOut}
                shouldGrayOut={shouldGrayOut}
                isSubmittingToRM={isSubmittingToRM}
                isCheckerSubmitting={isCheckerSubmitting}
                isSavingDraft={isSavingDraft}
                checklist={checklist}
                docs={docs}
                supportingDocs={[]}
                creatorComment={creatorComment}
                auth={auth}
                onSaveDraft={saveDraft}
                onSubmitToRM={submitToRMWithUnlock}
                onSubmitToCheckers={submitToCheckersWithUnlock}
                onUploadSupportingDoc={handleUploadSupportingDoc}
                uploadingSupportingDoc={isUploadingSupportingDoc}
                onClose={handleClose}
                comments={comments}
                isLockedBySomeoneElse={isLockedBySomeoneElse}
                lockedByUserName={lockedByUserName}
              />
            </div>
          </div>
        )}
      </div>

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
