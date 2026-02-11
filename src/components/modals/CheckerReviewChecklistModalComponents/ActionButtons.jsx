import React from "react";
import { Button, Space, Tooltip, message, Upload } from "antd";
import { CheckCircleOutlined, UploadOutlined } from "@ant-design/icons";
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
  canReturnToCreator, // NEW prop
  handlePdfDownload,
  handleSaveDraft,
  handleUploadSupportingDoc,
  setConfirmAction,
  onClose,
  documentStats,
  total,
  getApproveButtonTooltip,
  getReturnToCreatorTooltip, // NEW prop
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

  // NEW: Return to creator tooltip
  const returnToCreatorTooltipText = getReturnToCreatorTooltip
    ? getReturnToCreatorTooltip()
    : (() => {
        if (isDisabled) return "Checklist is not in review state";
        if (checkerRejected === 0) return "No rejected documents to return";
        return `Return checklist to creator with ${checkerRejected} rejected document(s)`;
      })();

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
            style={{
              borderColor: ACCENT_LIME,
              color: PRIMARY_BLUE,
              borderRadius: "6px",
              fontWeight: 600,
              opacity: effectiveReadOnly ? 0.5 : 1,
            }}
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
              style={{
                borderColor: PRIMARY_BLUE,
                color: PRIMARY_BLUE,
                borderRadius: "6px",
                opacity: effectiveReadOnly ? 0.5 : 1,
              }}
            >
              Upload Supporting Doc
            </Button>
          </Upload>
        </Space>

        <Space size="middle">
          <Button
            key="cancel"
            onClick={onClose}
            style={{ borderRadius: "6px" }}
          >
            Close
          </Button>

          {!effectiveReadOnly && (
            <>
              <Tooltip title={returnToCreatorTooltipText}>
                <Button
                  danger
                  onClick={() => setConfirmAction("co_creator_review")}
                  disabled={!canReturnToCreator() || effectiveReadOnly}
                  style={{
                    borderRadius: "6px",
                    opacity:
                      canReturnToCreator() && !effectiveReadOnly ? 1 : 0.6,
                  }}
                >
                  Return to Creator
                </Button>
              </Tooltip>

              <Tooltip title={approveTooltipText}>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  disabled={!canApproveChecklist() || effectiveReadOnly}
                  onClick={() => {
                    if (!canApproveChecklist()) {
                      message.error(approveTooltipText);
                      return;
                    }
                    setConfirmAction("approved");
                  }}
                  style={{
                    backgroundColor:
                      canApproveChecklist() && !effectiveReadOnly
                        ? PRIMARY_BLUE
                        : "#ccc",
                    borderColor:
                      canApproveChecklist() && !effectiveReadOnly
                        ? PRIMARY_BLUE
                        : "#ccc",
                    borderRadius: "6px",
                    fontWeight: 600,
                    opacity: effectiveReadOnly ? 0.5 : 1,
                  }}
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
