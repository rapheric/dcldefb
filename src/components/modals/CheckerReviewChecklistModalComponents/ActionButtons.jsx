import React from "react";
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
              color: "white !important",
              backgroundColor:
                isDisabled || effectiveReadOnly
                  ? "#CCCCCC !important"
                  : "#164679 !important",
              borderColor:
                isDisabled || effectiveReadOnly
                  ? "#CCCCCC !important"
                  : "#164679 !important",
              borderRadius: "6px",
              fontWeight: 600,
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
                color: "white !important",
                backgroundColor:
                  isDisabled || effectiveReadOnly
                    ? "#CCCCCC !important"
                    : "#164679 !important",
                borderColor:
                  isDisabled || effectiveReadOnly
                    ? "#CCCCCC !important"
                    : "#164679 !important",
                borderRadius: "6px",
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
            style={{
              color: "white !important",
              backgroundColor: "#164679 !important",
              borderColor: "#164679 !important",
              borderRadius: "6px",
            }}
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
                    backgroundColor:
                      !canReturnToCreator() || effectiveReadOnly
                        ? "#CCCCCC !important"
                        : "#ff4d4f !important",
                    borderColor:
                      !canReturnToCreator() || effectiveReadOnly
                        ? "#CCCCCC !important"
                        : "#ff4d4f !important",
                    color: "white !important",
                  }}
                >
                  Return to Creator
                </Button>
              </Tooltip>

              <Tooltip title={approveTooltipText}>
                <Button
                  type="primary"
                  disabled={!canApproveChecklist() || effectiveReadOnly}
                  onClick={() => {
                    if (!canApproveChecklist()) {
                      message.error(approveTooltipText);
                      return;
                    }
                    setConfirmAction("approved");
                  }}
                  style={{
                    color: "white !important",
                    backgroundColor:
                      !canApproveChecklist() || effectiveReadOnly
                        ? "#CCCCCC !important"
                        : "#164679 !important",
                    borderColor:
                      !canApproveChecklist() || effectiveReadOnly
                        ? "#CCCCCC !important"
                        : "#164679 !important",
                    borderRadius: "6px",
                    fontWeight: 600,
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
