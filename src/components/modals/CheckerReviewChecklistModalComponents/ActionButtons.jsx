import React from "react";
// Inject global style override for Ant Design buttons in this modal
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    .ant-btn.checker-modal-action {
      background: #164679 !important;
      color: #ffffff !important;
      border: none !important;
      font-weight: 600 !important;
    }
    .ant-btn.checker-modal-action[disabled],
    .ant-btn.checker-modal-action.ant-btn-disabled {
      background: #d9d9d9 !important;
      color: #a1a1a1 !important;
      border: none !important;
    }
  `;
  document.head.appendChild(style);
}
import { Button, Space, Tooltip, message, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import PDFGenerator from "./PDFGenerator";
import { ACCENT_LIME, PRIMARY_BLUE } from "../../../utils/constants";

const ActionButtons = ({
  checklist,
  docs,
  comments,
  effectiveReadOnly,
  isGeneratingPDF,
  isSavingDraft,
  uploadingSupportingDoc,
  isDisabled,
  canApproveChecklist,
  canReturnToCreator,
  handlePdfDownload,
  handleSaveDraft,
  handleUploadSupportingDoc,
  setConfirmAction,
  onClose,
  documentStats,
  total,
  getApproveButtonTooltip,
  getReturnToCreatorTooltip,
}) => {
  const { checkerReviewed, checkerRejected, checkerApproved } = documentStats;

  // Use the passed tooltip function or create a default one
  const approveTooltipText = getApproveButtonTooltip
    ? getApproveButtonTooltip()
    : (() => {
        if (isDisabled) return "Checklist is not in review state";
        if (checkerReviewed !== total)
          return `${total - checkerReviewed} document(s) not reviewed yet`;
        if (checkerRejected > 0)
          return `${checkerRejected} document(s) rejected`;
        if (checkerApproved !== total)
          return `${total - checkerApproved} document(s) not approved`;
        return "Approve this checklist";
      })();

  // Return to creator tooltip
  const returnToCreatorTooltipText = getReturnToCreatorTooltip
    ? getReturnToCreatorTooltip()
    : (() => {
        if (isDisabled) return "Checklist is not in review state";
        if (checkerRejected === 0) return "No rejected documents to return";
        return `Return checklist to creator with ${checkerRejected} rejected document(s)`;
      })();

  // Base button styles
  const getButtonStyles = (isButtonDisabled, bgColor = "#164679") => ({
    backgroundColor: isButtonDisabled ? "#f5f5f5" : bgColor,
    borderColor: isButtonDisabled ? "#d9d9d9" : bgColor,
    color: isButtonDisabled ? "#rgba(0, 0, 0, 0.25)" : "#FFFFFF",
    fontWeight: 600,
    borderRadius: "6px",
    height: "32px",
    padding: "4px 15px",
    fontSize: "14px",
    boxShadow: isButtonDisabled ? "none" : "0 2px 0 rgba(0, 0, 0, 0.045)",
  });

  return (
    <div
      className="action-buttons"
      style={{
        marginTop: "24px",
        padding: "16px 20px",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Space size="middle">
          <PDFGenerator
            checklist={{
              ...checklist,
              dclNo: checklist?.dclNo || checklist?._id,
            }}
            docs={docs}
            supportingDocs={[]}
            creatorComment=""
            comments={comments}
            buttonText="Download PDF"
            variant="primary"
          />

          <Button
            onClick={handleSaveDraft}
            loading={isSavingDraft}
            disabled={isDisabled || effectiveReadOnly}
            className="checker-modal-action"
          >
            Save Draft
          </Button>

          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              if (handleUploadSupportingDoc) {
                handleUploadSupportingDoc(file);
              }
              return false;
            }}
            disabled={isDisabled || effectiveReadOnly}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          >
            <Button
              icon={<UploadOutlined />}
              loading={uploadingSupportingDoc}
              disabled={isDisabled || effectiveReadOnly}
              className="checker-modal-action"
            >
              Upload Supporting Doc
            </Button>
          </Upload>
        </Space>

        <Space size="middle">
          <Button
            key="cancel"
            onClick={onClose}
            className="checker-modal-action"
          >
            Close
          </Button>

          {!effectiveReadOnly && (
            <>
              <Tooltip title={returnToCreatorTooltipText}>
                <Button
                  onClick={() => setConfirmAction("co_creator_review")}
                  disabled={!canReturnToCreator() || effectiveReadOnly}
                  className="checker-modal-action"
                >
                  Return to Creator
                </Button>
              </Tooltip>

              <Tooltip title={approveTooltipText}>
                <Button
                  disabled={!canApproveChecklist() || effectiveReadOnly}
                  onClick={() => {
                    if (!canApproveChecklist()) {
                      message.error(approveTooltipText);
                      return;
                    }
                    setConfirmAction("approved");
                  }}
                  className="checker-modal-action"
                >
                  Approve Checklist
                </Button>
              </Tooltip>
            </>
          )}
        </Space>
      </div>
    </div>
  );
};

export default ActionButtons;
