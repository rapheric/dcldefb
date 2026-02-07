// export default CheckerReviewChecklistModal;
import React, { useState, useEffect, useMemo } from "react";
import { message } from "antd";
import {
  useUpdateCheckerStatusMutation,
  useGetChecklistCommentsQuery,
  useSaveChecklistDraftMutation,
} from "../../../api/checklistApi";
import ConfirmationModal from "./ConfirmationModal";
import ActionButtons from "./ActionButtons";
import CommentSection from "./CommentSection";
import DocumentTable from "./DocumentTable";
import ProgressSection from "./ProgressSection";
import ChecklistDetails from "./ChecklistDetails";
import DocumentSidebar from "./DocumentSidebar";
import HeaderSection from "./HeaderSection";
import SupportingDocsSection from "./SupportingDocsSection";
import { calculateDocumentStats } from "../../../utils/checklistUtils";
import { downloadChecklistAsPDF } from "../../../utils/pdfExport";

const CheckerReviewChecklistModal = ({
  checklist,
  open,
  onClose,
  isReadOnly = false,
  readOnly = false,
}) => {
  const effectiveReadOnly = isReadOnly || readOnly;
  const [docs, setDocs] = useState([]);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [checkerComment, setCheckerComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [submitCheckerStatus] = useUpdateCheckerStatusMutation();
  const [saveDraft, { isLoading: isSavingDraft }] =
    useSaveChecklistDraftMutation();
  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
      skip: !checklist?.id && !checklist?._id,
    });

  const uploadedDocsCount = useMemo(() => {
    return docs.filter((doc) => doc.fileUrl).length;
  }, [docs]);

  const documentStats = useMemo(() => {
    return calculateDocumentStats(docs);
  }, [docs]);

  const { total, checkerApproved, checkerRejected, checkerReviewed } =
    documentStats;

  useEffect(() => {
    if (!checklist?.documents) return;
    const flatDocs = checklist.documents.reduce((acc, item) => {
      if (item.docList?.length) {
        const nested = item.docList.map((doc) => ({
          ...doc,
          category: item.category,
          coStatus: doc.status || doc.action || "pending",
        }));
        return acc.concat(nested);
      }
      if (item.category) return acc.concat(item);
      return acc;
    }, []);

    const shouldForceApproved =
      effectiveReadOnly || checklist?.status?.toLowerCase() === "approved";

    setDocs(
      flatDocs.map((doc, idx) => ({
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
      })),
    );

    // Update supporting docs
    if (checklist?.supportingDocs && Array.isArray(checklist.supportingDocs)) {
      setSupportingDocs(checklist.supportingDocs);
    }
  }, [checklist, effectiveReadOnly]);

  const handlePdfDownload = async () => {
    setIsGeneratingPDF(true);
    try {
      await downloadChecklistAsPDF({
        checklist,
        docs,
        documentStats,
        isCompletedChecklist: effectiveReadOnly,
      });
      message.success("Checklist PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Simple approve function
  const handleDocApprove = (index) => {
    setDocs((prev) => {
      const updated = [...prev];
      updated[index].approved = true;
      updated[index].checkerStatus = "approved";
      return updated;
    });
  };

  // Simple reject function
  const handleDocReject = (index) => {
    setDocs((prev) => {
      const updated = [...prev];
      updated[index].approved = false;
      updated[index].checkerStatus = "rejected";
      return updated;
    });
  };

  // Reset function
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
      // Direct check on docs array
      const hasRejectedDocuments = docs.some(
        (doc) => doc.checkerStatus === "rejected",
      );
      if (hasRejectedDocuments) {
        message.error("Cannot approve checklist: Some documents are rejected");
        setConfirmAction(null);
        return;
      }

      // Check if all documents have been reviewed (no pending or undefined)
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

      // Check if all reviewed documents are approved
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
        checkerDecisions: docs.map((doc) => ({
          documentId: doc.id || doc._id || doc.key,
          checkerStatus: doc.checkerStatus,
          checkerComment: doc.checkerComment || "",
        })),
        checkerComments: checkerComment,
        checkerComment: checkerComment, // Added this field to ensure compatibility
      };

      await submitCheckerStatus(payload).unwrap();
      setConfirmAction(null);
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
      message.loading({ content: "Saving draft...", key: "saveDraft" });
      const payload = {
        checklistId: checklist?.id || checklist?._id,
        draftData: {
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
        },
      };

      await saveDraft(payload).unwrap();
      message.success({
        content: "Draft saved successfully!",
        key: "saveDraft",
        duration: 3,
      });
    } catch (error) {
      console.error("Save draft error:", error);
      message.error({
        content: "Failed to save draft",
        key: "saveDraft",
      });
    }
  };

  const isDisabled =
    effectiveReadOnly ||
    !["check_review", "co_checker_review"].includes(checklist?.status);

  // Check if all documents are approved
  const canApproveChecklist = () => {
    if (isDisabled) return false;

    // Check if all documents are approved
    for (let doc of docs) {
      if (doc.checkerStatus !== "approved") {
        return false;
      }
    }

    return true;
  };

  // NEW: Check if can return to creator (only if there's at least one rejected document)
  const canReturnToCreator = () => {
    if (isDisabled) return false;

    // Check if there's at least one rejected document
    const hasRejectedDocuments = docs.some(
      (doc) => doc.checkerStatus === "rejected",
    );

    return hasRejectedDocuments;
  };

  // Tooltip function that checks docs directly
  const getApproveButtonTooltip = () => {
    if (isDisabled) return "Checklist is not in review state";

    // Check actual document statuses from docs array
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

  // NEW: Tooltip for Return to Creator button
  const getReturnToCreatorTooltip = () => {
    if (isDisabled) return "Checklist is not in review state";

    // Check if there are any rejected documents
    const rejectedCount = docs.filter(
      (doc) => doc.checkerStatus === "rejected",
    ).length;

    if (rejectedCount === 0) return "No rejected documents to return";
    return `Return checklist to creator with ${rejectedCount} rejected document(s)`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/40 flex justify-center items-start pt-10">
      <div className="review-checklist-modal w-[95%] max-w-7xl bg-white rounded-xl shadow-2xl overflow-hidden my-6">
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <HeaderSection
            checklist={checklist}
            onClose={onClose}
            showDocumentSidebar={showDocumentSidebar}
            setShowDocumentSidebar={setShowDocumentSidebar}
            uploadedDocsCount={uploadedDocsCount}
          />
        </div>

        {/* Document Sidebar */}
        <DocumentSidebar
          documents={docs}
          open={showDocumentSidebar}
          onClose={() => setShowDocumentSidebar(false)}
        />

        {/* Main Content Area */}
        <div className="p-6 space-y-6">
          {/* Checklist Details */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <ChecklistDetails
              checklist={checklist}
              setShowDocumentSidebar={setShowDocumentSidebar}
              uploadedDocsCount={uploadedDocsCount}
            />
          </div>

          {/* Progress Section */}
          <ProgressSection documentStats={documentStats} total={total} />

          {/* Document Table */}
          <DocumentTable
            docs={docs}
            isDisabled={isDisabled}
            effectiveReadOnly={effectiveReadOnly}
            handleDocApprove={handleDocApprove}
            handleDocReject={handleDocReject}
            handleDocReset={handleDocReset}
          />

          {/* Supporting Documents - Hidden as they now appear in View Documents sidebar */}
          {/* <SupportingDocsSection supportingDocs={supportingDocs} /> */}

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
            isDisabled={isDisabled}
            canApproveChecklist={canApproveChecklist}
            canReturnToCreator={canReturnToCreator} // NEW: Pass this prop
            handlePdfDownload={handlePdfDownload}
            handleSaveDraft={handleSaveDraft}
            setConfirmAction={setConfirmAction}
            onClose={onClose}
            documentStats={documentStats}
            total={total}
            // Pass the tooltip functions
            getApproveButtonTooltip={getApproveButtonTooltip}
            getReturnToCreatorTooltip={getReturnToCreatorTooltip} // NEW: Pass this prop
          />
        </div>

        {!effectiveReadOnly && confirmAction && (
          <ConfirmationModal
            confirmAction={confirmAction}
            setConfirmAction={setConfirmAction}
            loading={loading}
            submitCheckerAction={submitCheckerAction}
            canApproveChecklist={canApproveChecklist}
            canReturnToCreator={canReturnToCreator} // NEW: Pass this prop
            checkerRejected={checkerRejected}
            total={total}
            checkerReviewed={checkerReviewed}
            checkerApproved={checkerApproved}
          />
        )}
      </div>
    </div>
  );
};

export default CheckerReviewChecklistModal;
