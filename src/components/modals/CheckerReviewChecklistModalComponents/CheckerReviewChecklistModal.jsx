// export default CheckerReviewChecklistModal;
import React, { useState, useEffect, useMemo } from "react";
import { message } from "antd";
import { useSelector } from "react-redux";
import {
  useUpdateCheckerStatusMutation,
  useGetChecklistCommentsQuery,
} from "../../../api/checklistApi";
import ConfirmationModal from "./ConfirmationModal";
import ActionButtons from "./ActionButtons";
import CommentSection from "./CommentSection";
import DocumentTable from "./DocumentTable";
import ProgressSection from "./ProgressSection";
import ChecklistDetails from "./ChecklistDetails";
import DocumentSidebar from "./DocumentSidebar";
import HeaderSection from "./HeaderSection";
import { calculateDocumentStats } from "../../../utils/checklistUtils";
import { generateChecklistPDF } from "../../../utils/reportGenerator";
import { saveDraft as saveDraftToStorage } from "../../../utils/draftsUtils";

const CheckerReviewChecklistModal = ({
  checklist,
  open,
  onClose,
  isReadOnly = false,
  readOnly = false,
  onChecklistUpdate = null,
}) => {
  const effectiveReadOnly = isReadOnly || readOnly;
  const auth = useSelector((state) => state.auth);
  const token = auth?.token || localStorage.getItem("token");
  const API_BASE_URL =
    import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

  const [docs, setDocs] = useState([]);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [checkerComment, setCheckerComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [uploadingSupportingDoc, setUploadingSupportingDoc] = useState(false);
  const [localChecklist, setLocalChecklist] = useState(checklist);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [submitCheckerStatus] = useUpdateCheckerStatusMutation();
  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
      skip: !checklist?.id && !checklist?._id,
    });

  // DEBUG: Log comment fetching
  React.useEffect(() => {
    const checklistId = checklist?.id || checklist?._id;
    console.log(
      "🛡️ CheckerReviewChecklistModal - Checklist ID for comments:",
      checklistId,
    );
    console.log("🛡️ Comments Loading:", commentsLoading);
    console.log("🛡️ Comments Data:", comments);
    if (comments && Array.isArray(comments)) {
      console.log(`🛡️ Total comments fetched: ${comments.length}`);
    }
  }, [checklist?.id, checklist?._id, comments, commentsLoading]);

  const uploadedDocsCount = useMemo(() => {
    return docs.filter((doc) => doc.fileUrl).length;
  }, [docs]);

  const documentStats = useMemo(() => {
    return calculateDocumentStats(docs);
  }, [docs]);

  const { total, checkerApproved, checkerRejected, checkerReviewed } =
    documentStats;

  const handleChecklistUpdate = (updatedChecklist) => {
    const mergedChecklist = {
      ...localChecklist,
      ...checklist,
      ...updatedChecklist,
      supportingDocs:
        updatedChecklist?.supportingDocs ||
        checklist?.supportingDocs ||
        localChecklist?.supportingDocs ||
        [],
    };

    console.log("🔄 Checker handleChecklistUpdate called:");
    console.log(
      "   Updated checklist supportingDocs:",
      updatedChecklist?.supportingDocs?.length || 0,
    );
    console.log(
      "   Merged checklist supportingDocs:",
      mergedChecklist.supportingDocs?.length || 0,
    );

    setLocalChecklist(mergedChecklist);
    if (onChecklistUpdate) {
      onChecklistUpdate(mergedChecklist);
    }
  };

  useEffect(() => {
    if (!checklist) {
      console.warn("⚠️ No checklist available for document loading");
      setDocs([]);
      return;
    }

    const documentArray =
      checklist.documents || checklist.docList || checklist.items || [];

    if (!Array.isArray(documentArray) || documentArray.length === 0) {
      console.warn("⚠️ No documents found in checklist", {
        hasDocuments: !!checklist.documents,
        hasDocList: !!checklist.docList,
        hasItems: !!checklist.items,
      });
      setDocs([]);
      return;
    }

    const flatDocs = documentArray.reduce((acc, item) => {
      if (
        item.docList &&
        Array.isArray(item.docList) &&
        item.docList.length > 0
      ) {
        const nested = item.docList.map((doc) => ({
          ...doc,
          category: item.category || doc.category,
          coStatus: doc.status || doc.action || "pending",
        }));
        return acc.concat(nested);
      }
      if (item.title || item.fileName || item.status) {
        return acc.concat(item);
      }
      return acc;
    }, []);

    const shouldForceApproved =
      effectiveReadOnly || checklist?.status?.toLowerCase() === "approved";

    console.log("📋 Processing documents for CheckerReviewChecklistModal:", {
      totalDocs: flatDocs.length,
      shouldForceApproved,
    });

    const processedDocs = flatDocs.map((doc, idx) => ({
      ...doc,
      key: doc.id || doc._id || `doc-${idx}`,
      status: doc.status || doc.action || "pending",
      approved: shouldForceApproved ? true : doc.approved || false,
      checkerStatus: shouldForceApproved
        ? "approved"
        : doc.checkerStatus || (doc.approved ? "approved" : "pending"),
      comment: doc.comment || "",
      fileUrl: doc.fileUrl || null,
      expiryDate: doc.expiryDate || null,
      deferralNo: doc.deferralNo || null,
    }));

    const supportingDocsData = checklist.supportingDocs || [];
    console.log(
      "📎 Checker Modal - Supporting docs from backend:",
      supportingDocsData.length,
    );

    setSupportingDocs(supportingDocsData);
    setDocs(processedDocs);
    console.log(
      "📋 Checker Modal - Main docs (excluding supporting):",
      processedDocs.length,
    );
  }, [checklist, effectiveReadOnly]);

  const handlePdfDownload = async () => {
    setIsGeneratingPDF(true);
    try {
      generateChecklistPDF(
        checklist,
        docs,
        documentStats,
        comments?.data || comments || [],
      );
      message.success("Checklist PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleUploadSupportingDoc = async (file) => {
    try {
      setUploadingSupportingDoc(true);

      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

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
      console.log("✅ Checker Modal - Upload response:", result);

      if (!result.success || !result.data) {
        throw new Error("Invalid upload response");
      }

      const uploadedDoc = result.data;

      const newSupportingDoc = {
        id: uploadedDoc.id || uploadedDoc._id,
        _id: uploadedDoc._id || uploadedDoc.id,
        name: uploadedDoc.name || uploadedDoc.fileName || file.name,
        fileName: uploadedDoc.fileName || file.name,
        category: "Supporting Documents",
        status: "submitted",
        action: "submitted",
        comment: "",
        fileUrl: uploadedDoc.fileUrl,
        fileSize: uploadedDoc.fileSize,
        fileType: uploadedDoc.fileType,
        uploadedBy: uploadedDoc.uploadedBy,
        uploadedByRole: uploadedDoc.uploadedByRole || "checker",
        uploadedAt: uploadedDoc.createdAt || new Date().toISOString(),
        isSupporting: true,
        uploadData: {
          fileName: uploadedDoc.fileName || file.name,
          fileUrl: uploadedDoc.fileUrl,
          createdAt: uploadedDoc.createdAt || new Date().toISOString(),
          fileSize: uploadedDoc.fileSize,
          fileType: uploadedDoc.fileType,
          uploadedBy: uploadedDoc.uploadedBy || "Checker",
        },
      };

      console.log(
        "✅ Checker Modal - Adding supporting doc to main docs array:",
        newSupportingDoc,
      );

      setDocs((prevDocs) => [...prevDocs, newSupportingDoc]);

      message.success(`"${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error(
        "❌ Checker Modal - Error uploading supporting doc:",
        error,
      );
      message.error(error.message || "Failed to upload supporting document");
    } finally {
      setUploadingSupportingDoc(false);
    }
  };

  const handleDocApprove = (index) => {
    setDocs((prev) => {
      const updated = [...prev];
      updated[index].approved = true;
      updated[index].checkerStatus = "approved";
      return updated;
    });
  };

  const handleDocReject = (index) => {
    setDocs((prev) => {
      const updated = [...prev];
      updated[index].approved = false;
      updated[index].checkerStatus = "rejected";
      return updated;
    });
  };

  const handleDocReset = (index) => {
    setDocs((prev) => {
      const updated = [...prev];
      updated[index].approved = false;
      updated[index].checkerStatus = "pending";
      return updated;
    });
  };

  const submitCheckerAction = async (action) => {
    const checklistId = checklist?.id || checklist?._id;
    if (!checklistId) return alert("Checklist ID missing");

    if (action === "approved") {
      const hasRejectedDocuments = docs.some(
        (doc) => doc.checkerStatus === "rejected",
      );
      if (hasRejectedDocuments) {
        message.error("Cannot approve checklist: Some documents are rejected");
        setConfirmAction(null);
        return;
      }

      const hasUnreviewedDocuments = docs.some((doc) => {
        const status = doc.checkerStatus;
        return !status || status === "" || status === "pending";
      });

      if (hasUnreviewedDocuments) {
        message.error(
          "Cannot approve checklist: Not all documents have been reviewed",
        );
        setConfirmAction(null);
        return;
      }

      const hasNonApprovedDocuments = docs.some(
        (doc) => doc.checkerStatus !== "approved",
      );

      if (hasNonApprovedDocuments) {
        message.error(
          "Cannot approve checklist: All documents must be approved",
        );
        setConfirmAction(null);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        id: checklistId,
        action: action,
        checkerDecisions: docs
          .filter(
            (doc) => !doc.isNew && doc.category !== "Supporting Documents",
          )
          .map((doc) => ({
            documentId: doc.id || doc._id || doc.key,
            checkerStatus: doc.checkerStatus,
            checkerComment: doc.checkerComment || "",
          })),
        checkerComments: checkerComment,
        checkerComment: checkerComment,
      };

      console.log("📤 CHECKER SUBMISSION:");
      console.log("   Total docs in state:", docs.length);
      console.log(
        "   Supporting docs:",
        docs.filter((d) => d.category === "Supporting Documents").length,
      );
      console.log("   Checker decisions:", payload.checkerDecisions.length);

      await submitCheckerStatus(payload).unwrap();
      setConfirmAction(null);
      handleChecklistUpdate({ ...localChecklist, status: action });
      onClose();
    } catch (err) {
      console.error(err);
      alert(err?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      message.loading({ content: "Saving draft...", key: "saveDraft" });

      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      const draftData = {
        checklistId: checklistId,
        dclNo: checklist?.dclNo,
        title: checklist?.title,
        customerName: checklist?.customerName,
        customerNumber: checklist?.customerNumber,
        loanType: checklist?.loanType,
        status: checklist?.status,
        documents: docs.map((doc) => ({
          _id: doc.id || doc._id,
          name: doc.name,
          category: doc.category,
          status: doc.status,
          action: doc.action,
          checkerStatus: doc.checkerStatus,
          checkerComment: doc.checkerComment || "",
          comment: doc.comment,
          fileUrl: doc.fileUrl,
          expiryDate: doc.expiryDate,
          deferralNo: doc.deferralNo,
        })),
        creatorComment: checkerComment,
        supportingDocs: docs.filter(
          (d) => d.category === "Supporting Documents",
        ),
      };

      saveDraftToStorage("checker", draftData, checklistId);

      message.success({
        content: "Draft saved successfully!",
        key: "saveDraft",
        duration: 3,
      });
    } catch (error) {
      console.error("Save draft error:", error);
      message.error({
        content: error?.message || "Failed to save draft",
        key: "saveDraft",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const isDisabled =
    effectiveReadOnly ||
    !["CoCheckerReview", "co_checker_review", "check_review"].some(
      (status) =>
        (checklist?.status || "").toLowerCase() === status.toLowerCase(),
    );

  const canApproveChecklist = () => {
    if (isDisabled) return false;
    for (let doc of docs) {
      if (doc.checkerStatus !== "approved") {
        return false;
      }
    }
    return true;
  };

  const canReturnToCreator = () => {
    if (isDisabled) return false;
    const hasRejectedDocuments = docs.some(
      (doc) => doc.checkerStatus === "rejected",
    );
    return hasRejectedDocuments;
  };

  const getApproveButtonTooltip = () => {
    if (isDisabled) return "Checklist is not in review state";
    const rejectedCount = docs.filter(
      (doc) => doc.checkerStatus === "rejected",
    ).length;
    const pendingCount = docs.filter(
      (doc) =>
        !doc.checkerStatus ||
        doc.checkerStatus === "pending" ||
        doc.checkerStatus === "",
    ).length;
    const notApprovedCount = docs.filter(
      (doc) => doc.checkerStatus !== "approved",
    ).length;

    if (rejectedCount > 0) return `${rejectedCount} document(s) are rejected`;
    if (pendingCount > 0) return `${pendingCount} document(s) are not reviewed`;
    if (notApprovedCount > 0)
      return `${notApprovedCount} document(s) are not approved`;

    return "Approve this checklist";
  };

  const getReturnToCreatorTooltip = () => {
    if (isDisabled) return "Checklist is not in review state";
    const rejectedCount = docs.filter(
      (doc) => doc.checkerStatus === "rejected",
    ).length;
    if (rejectedCount === 0) return "No rejected documents to return";
    return `Return checklist to creator with ${rejectedCount} rejected document(s)`;
  };

  if (!open) return null;

  return (
    <>
      <DocumentSidebar
        documents={docs}
        supportingDocs={checklist?.supportingDocs || []}
        open={showDocumentSidebar}
        onClose={() => setShowDocumentSidebar(false)}
      />

      {/* Global styles for responsive modal with dynamic sidebar positioning using CSS variables */}
      <style>{`
        /* Desktop: >= 1100px - Use CSS variable for sidebar width */
        @media (min-width: 1100px) {
          .checker-modal-overlay {
            left: var(--sidebar-width, 80px) !important;
            transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
          }
        }
        
        /* Tablet: 768px - 1099px */
        @media (min-width: 768px) and (max-width: 1099px) {
          .checker-modal-overlay {
            left: var(--sidebar-width, 40px) !important;
            padding-left: 0 !important;
            transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
          }
        }
        
        /* Mobile: < 768px */
        @media (max-width: 767px) {
          .checker-modal-overlay {
            left: 0 !important;
            padding-left: 0 !important;
            padding-right: 16px !important;
          }
          .checker-modal-container {
            width: calc(100vw - 32px) !important;
            max-width: calc(100vw - 32px) !important;
          }
        }
        
        .checker-modal-overlay {
          max-height: 100vh;
          transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
        }
        
        .checker-modal-container {
          max-height: calc(100vh - 130px);
          overflow-y: auto;
        }
      `}</style>

      <div
        className="checker-modal-overlay fixed overflow-auto bg-black/50 flex items-start justify-center"
        style={{
          top: "65px",
          left: "var(--sidebar-width, 80px)",
          right: 0,
          bottom: 0,
          zIndex: 1100,
          paddingTop: "20px",
          paddingBottom: "20px",
        }}
      >
        <div
          className="checker-modal-container review-checklist-modal bg-white rounded-xl overflow-hidden relative"
          style={{
            width: "1200px",
            maxWidth: "calc(100vw - 310px)",
            boxShadow: "none",
            border: "1px solid #e5e7eb",
            margin: "0 16px",
          }}
        >
          <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white">
            <HeaderSection
              checklist={checklist}
              onClose={onClose}
              showDocumentSidebar={showDocumentSidebar}
              setShowDocumentSidebar={setShowDocumentSidebar}
              uploadedDocsCount={uploadedDocsCount}
            />
          </div>

          <div
            className="p-6 space-y-6"
            style={{
              opacity: effectiveReadOnly ? 0.5 : 1,
              pointerEvents: effectiveReadOnly ? "none" : "auto",
              transition: "opacity 0.3s ease",
            }}
          >
            {effectiveReadOnly && (
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
                This checklist status doesn't allow Checker actions — all fields
                are read-only.
              </div>
            )}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <ChecklistDetails checklist={checklist} />
            </div>

            <ProgressSection documentStats={documentStats} total={total} />

            <DocumentTable
              docs={docs}
              isDisabled={isDisabled}
              effectiveReadOnly={effectiveReadOnly}
              handleDocApprove={handleDocApprove}
              handleDocReject={handleDocReject}
              handleDocReset={handleDocReset}
            />

            <CommentSection
              comments={comments}
              commentsLoading={commentsLoading}
              checkerComment={checkerComment}
              setCheckerComment={setCheckerComment}
              isDisabled={isDisabled}
            />

            <ActionButtons
              effectiveReadOnly={effectiveReadOnly}
              isGeneratingPDF={isGeneratingPDF}
              isSavingDraft={isSavingDraft}
              uploadingSupportingDoc={uploadingSupportingDoc}
              isDisabled={isDisabled}
              canApproveChecklist={canApproveChecklist}
              canReturnToCreator={canReturnToCreator}
              handlePdfDownload={handlePdfDownload}
              handleSaveDraft={handleSaveDraft}
              handleUploadSupportingDoc={handleUploadSupportingDoc}
              setConfirmAction={setConfirmAction}
              onClose={onClose}
              documentStats={documentStats}
              total={total}
              getApproveButtonTooltip={getApproveButtonTooltip}
              getReturnToCreatorTooltip={getReturnToCreatorTooltip}
            />
          </div>

          {!effectiveReadOnly && confirmAction && (
            <ConfirmationModal
              confirmAction={confirmAction}
              setConfirmAction={setConfirmAction}
              loading={loading}
              submitCheckerAction={submitCheckerAction}
              canApproveChecklist={canApproveChecklist}
              canReturnToCreator={canReturnToCreator}
              checkerRejected={checkerRejected}
              total={total}
              checkerReviewed={checkerReviewed}
              checkerApproved={checkerApproved}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default CheckerReviewChecklistModal;
