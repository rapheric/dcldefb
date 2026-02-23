import React from "react";
import { Button, Space, Upload, message } from "antd";
import {
  SaveOutlined,
  UploadOutlined,
  CloseOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import PDFGenerator from "./PDFGenerator";
import { ACCENT_LIME, PRIMARY_BLUE } from "../../../utils/constants";
import { getExpiryStatus } from "../../../utils/documentStats";
import dayjs from "dayjs";

const ActionButtons = ({
  readOnly,
  isActionDisabled,
  shouldGrayOut = false,
  isSubmittingToRM,
  isCheckerSubmitting,
  isSavingDraft,
  checklist,
  docs,
  supportingDocs,
  creatorComment,
  onSaveDraft,
  onSubmitToRM,
  onSubmitToCheckers,
  onUploadSupportingDoc,
  onClose,
  comments,
}) => {
  // Check if any compliance document has expired
  const hasExpiredDocuments = React.useMemo(() => {
    return docs.some((doc) => {
      if (!doc.expiryDate) return false;
      return dayjs(doc.expiryDate).isBefore(dayjs());
    });
  }, [docs]);

  // Submit to CoChecker: All documents must have final status (tbo, sighted, deferred, submitted, etc.)
  const canSubmitToCoChecker =
    checklist?.status?.toLowerCase() === "cocreatorreview" &&
    docs.length > 0 &&
    !hasExpiredDocuments && // Block submission if any document is expired
    docs.every((doc) => {
      const docStatus = (doc.action || doc.status || "").toLowerCase();
      return [
        "submitted_for_review",
        "sighted",
        "waived",
        "deferred",
        "tbo",
        "approved",
        "submitted",
      ].includes(docStatus);
    });

  const allDocsApproved =
    docs.length > 0 && docs.every((doc) => doc.action === "submitted");

  // Submit to RM: Checklist must be in Pending or CoCreatorReview AND have documents pending RM review
  const canSubmitToRM =
    ["pending", "cocreatorreview", "co_creator_review"].includes(
      checklist?.status?.toLowerCase(),
    ) &&
    docs.length > 0 &&
    docs.some((doc) => (doc.status || "").toLowerCase() === "pendingrm");

  // Fixed: Wrapper functions that handle close after submission
  const handleSubmitToRM = async () => {
    if (onSubmitToRM) {
      const result = await onSubmitToRM();
      // If submission was successful, close the modal
      if (result !== false) {
        // Assuming the function returns false on error
        onClose();
      }
    }
  };

  // Fixed: Wrapper functions that handle close after submission
  const handleSubmitToCheckers = async () => {
    // Check for expired documents before submission
    if (hasExpiredDocuments) {
      const expiredDocs = docs.filter((doc) =>
        doc.expiryDate && dayjs(doc.expiryDate).isBefore(dayjs())
      );
      message.error(
        `Cannot submit to checker: ${expiredDocs.length} expired document(s) found. Please update expired documents before submission.`
      );
      return false;
    }

    if (onSubmitToCheckers) {
      const result = await onSubmitToCheckers();
      // If submission was successful, close the modal
      if (result !== false) {
        // Assuming the function returns false on error
        onClose();
      }
    }
  };

  return (
    <Space wrap>
      {/* PDF Generator */}
      <PDFGenerator
        checklist={checklist}
        docs={docs}
        supportingDocs={supportingDocs}
        creatorComment={creatorComment}
        comments={comments}
      />

      {/* Save Draft */}
      {!readOnly && (
        <Button
          key="save-draft"
          onClick={onSaveDraft}
          loading={isSavingDraft}
          disabled={shouldGrayOut}
          icon={<SaveOutlined />}
          style={{
            borderColor: ACCENT_LIME,
            color: PRIMARY_BLUE,
            borderRadius: "6px",
            fontWeight: 600,
            opacity: shouldGrayOut ? 0.5 : 1,
          }}
        >
          Save Draft
        </Button>
      )}

      {/* Upload Supporting Doc */}
      {!readOnly && (
        <Upload
          key="upload-support"
          showUploadList={false}
          beforeUpload={(file) => {
            onUploadSupportingDoc(file);
            return false;
          }}
          disabled={isActionDisabled || shouldGrayOut}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
        >
          <Button
            icon={<UploadOutlined />}
            disabled={shouldGrayOut}
            style={{
              borderRadius: "6px",
              opacity: shouldGrayOut ? 0.5 : 1,
            }}
          >
            Upload Supporting Doc
          </Button>
        </Upload>
      )}

      {/* Close Button */}
      <Button
        key="cancel"
        onClick={onClose}
        icon={<CloseOutlined />}
        style={{ borderRadius: "6px" }}
      >
        Close
      </Button>

      {/* Submit to RM */}
      {!readOnly && (
        <Button
          key="submit"
          type="primary"
          disabled={isActionDisabled || !canSubmitToRM || shouldGrayOut}
          loading={isSubmittingToRM}
          onClick={handleSubmitToRM} // Use the wrapper function
          icon={<SendOutlined />}
          style={{
            borderRadius: "6px",
            fontWeight: 600,
            opacity: shouldGrayOut ? 0.5 : 1,
          }}
        >
          Submit to RM
        </Button>
      )}

      {/* Submit to Co-Checker */}
      {!readOnly && (
        <Button
          key="submit-checker"
          type="primary"
          loading={isCheckerSubmitting}
          onClick={handleSubmitToCheckers} // Use the wrapper function
          disabled={!canSubmitToCoChecker || shouldGrayOut}
          icon={<CheckCircleOutlined />}
          style={{
            backgroundColor: PRIMARY_BLUE,
            borderRadius: "6px",
            fontWeight: 600,
            opacity: shouldGrayOut ? 0.5 : 1,
          }}
        >
          Submit to Co-Checker
        </Button>
      )}
    </Space>
  );
};

export default ActionButtons;
