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
import dayjs from "dayjs";

const ActionButtons = ({
  readOnly,
  isActionDisabled,
  shouldGrayOut = false,
  isSubmittingToRM,
  isCheckerSubmitting,
  isSavingDraft,
  uploadingSupportingDoc = false,
  checklist,
  docs,
  supportingDocs,
  creatorComment,
  auth,
  onSaveDraft,
  onSubmitToRM,
  onSubmitToCheckers,
  onUploadSupportingDoc,
  onClose,
  comments,
  isLockedBySomeoneElse = false,
  lockedByUserName = "",
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

  // const allDocsApproved = docs.length > 0 && docs.every((doc) => doc.action === "submitted"); // Unused

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
      const expiredDocs = docs.filter(
        (doc) => doc.expiryDate && dayjs(doc.expiryDate).isBefore(dayjs()),
      );
      message.error(
        `Cannot submit to checker: ${expiredDocs.length} expired document(s) found. Please update expired documents before submission.`,
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

  const buttonGradientStyle = {
    background: "linear-gradient(135deg, #164679 0%, #0f3a56 100%) !important",
    borderColor: "transparent !important",
    color: "#FFFFFF !important",
    borderRadius: "6px",
    fontWeight: 600,
    border: "none !important",
  };

  const buttonDisabledStyle = {
    background: "#CCCCCC !important",
    borderColor: "#CCCCCC !important",
    color: "#FFFFFF !important",
    borderRadius: "6px",
    fontWeight: 600,
    border: "none !important",
  };

  return (
    <>
      <style>{`
        .review-action-buttons button {
          background: linear-gradient(135deg, #164679 0%, #0f3a56 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        .review-action-buttons button:hover,
        .review-action-buttons button:focus,
        .review-action-buttons button:active {
          background: linear-gradient(135deg, #164679 0%, #0f3a56 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        .review-action-buttons button span {
          color: #FFFFFF !important;
        }
        .review-action-buttons button:disabled,
        .review-action-buttons button[disabled] {
          background: #CCCCCC !important;
          border-color: #CCCCCC !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        .review-action-buttons .ant-btn {
          background: linear-gradient(135deg, #164679 0%, #0f3a56 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
        }
        .review-action-buttons .ant-btn:hover,
        .review-action-buttons .ant-btn:focus {
          background: linear-gradient(135deg, #164679 0%, #0f3a56 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
        }
        .review-action-buttons .ant-btn-primary {
          background: linear-gradient(135deg, #164679 0%, #0f3a56 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
        }
        .review-action-buttons .ant-btn-primary:hover,
        .review-action-buttons .ant-btn-primary:focus {
          background: linear-gradient(135deg, #164679 0%, #0f3a56 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
        }
      `}</style>
      <div
        className="review-action-buttons"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px",
          gap: "16px",
        }}
      >
        {/* Left Buttons - 3 buttons */}
        <Space wrap>
          {/* Save Draft */}
          {!readOnly && (
            <Button
              key="save-draft"
              onClick={onSaveDraft}
              loading={isSavingDraft}
              disabled={shouldGrayOut}
              icon={<SaveOutlined />}
              style={shouldGrayOut ? buttonDisabledStyle : buttonGradientStyle}
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
              disabled={
                isActionDisabled || shouldGrayOut || uploadingSupportingDoc
              }
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            >
              <Button
                icon={<UploadOutlined />}
                disabled={shouldGrayOut}
                loading={uploadingSupportingDoc}
                style={
                  shouldGrayOut ? buttonDisabledStyle : buttonGradientStyle
                }
              >
                Upload Supporting Doc
              </Button>
            </Upload>
          )}

          {/* PDF Generator */}
          <PDFGenerator
            checklist={{
              ...checklist,
              rmName:
                checklist?.rmName ||
                auth?.user?.name ||
                auth?.user?.username ||
                "Relationship Manager",
            }}
            docs={docs}
            supportingDocs={supportingDocs}
            creatorComment={creatorComment}
            comments={comments}
          />
        </Space>

        {/* Right Buttons - 2 buttons */}
        <Space wrap>
          {/* Submit to RM */}
          {!readOnly && (
            <Button
              key="submit"
              type="primary"
              disabled={
                isActionDisabled ||
                !canSubmitToRM ||
                shouldGrayOut ||
                isLockedBySomeoneElse
              }
              loading={isSubmittingToRM}
              onClick={handleSubmitToRM}
              icon={<SendOutlined />}
              title={
                isLockedBySomeoneElse
                  ? `Locked by ${lockedByUserName}`
                  : undefined
              }
              style={
                isActionDisabled ||
                !canSubmitToRM ||
                shouldGrayOut ||
                isLockedBySomeoneElse
                  ? buttonDisabledStyle
                  : buttonGradientStyle
              }
            >
              Submit to RM{" "}
              {isLockedBySomeoneElse && `(Locked by ${lockedByUserName})`}
            </Button>
          )}

          {/* Submit to Co-Checker */}
          {!readOnly && (
            <Button
              key="submit-checker"
              type="primary"
              loading={isCheckerSubmitting}
              onClick={handleSubmitToCheckers}
              disabled={
                !canSubmitToCoChecker || shouldGrayOut || isLockedBySomeoneElse
              }
              icon={<CheckCircleOutlined />}
              title={
                isLockedBySomeoneElse
                  ? `Locked by ${lockedByUserName}`
                  : undefined
              }
              style={
                !canSubmitToCoChecker || shouldGrayOut || isLockedBySomeoneElse
                  ? buttonDisabledStyle
                  : buttonGradientStyle
              }
            >
              Submit to Co-Checker{" "}
              {isLockedBySomeoneElse && `(Locked by ${lockedByUserName})`}
            </Button>
          )}
        </Space>
      </div>
    </>
  );
};

export default ActionButtons;
