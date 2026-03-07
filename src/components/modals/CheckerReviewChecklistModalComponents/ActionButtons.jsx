import React from "react";
import { Button, Space, Tooltip, message, Upload } from "antd";
import {
  SaveOutlined,
  UploadOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import PDFGenerator from "./PDFGenerator";
import { PRIMARY_BLUE } from "../../../utils/constants";

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
        .checker-action-buttons button {
          background: linear-gradient(135deg, #164679 0%, #0f3a56 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        .checker-action-buttons button:hover,
        .checker-action-buttons button:focus,
        .checker-action-buttons button:active {
          background: linear-gradient(135deg, #164679 0%, #0f3a56 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        .checker-action-buttons button span {
          color: #FFFFFF !important;
        }
        .checker-action-buttons button:disabled,
        .checker-action-buttons button[disabled] {
          background: #CCCCCC !important;
          border-color: #CCCCCC !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        .checker-action-buttons .ant-btn {
          background: linear-gradient(135deg, #164679 0%, #0f3a56 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
        }
        .checker-action-buttons .ant-btn:hover,
        .checker-action-buttons .ant-btn:focus {
          background: linear-gradient(135deg, #164679 0%, #0f3a56 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
        }
        .checker-action-buttons .ant-btn-primary {
          background: linear-gradient(135deg, #164679 0%, #0f3a56 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
        }
        .checker-action-buttons .ant-btn-primary:hover,
        .checker-action-buttons .ant-btn-primary:focus {
          background: linear-gradient(135deg, #164679 0%, #0f3a56 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
        }
      `}</style>
      <div
        className="checker-action-buttons"
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
          {!effectiveReadOnly && (
            <Button
              key="save-draft"
              onClick={handleSaveDraft}
              loading={isSavingDraft}
              disabled={isDisabled}
              icon={<SaveOutlined />}
              style={isDisabled ? buttonDisabledStyle : buttonGradientStyle}
            >
              Save Draft
            </Button>
          )}

          {/* Upload Supporting Doc */}
          {!effectiveReadOnly && (
            <Upload
              key="upload-support"
              showUploadList={false}
              beforeUpload={(file) => {
                handleUploadSupportingDoc(file);
                return false;
              }}
              disabled={isDisabled || uploadingSupportingDoc}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            >
              <Button
                icon={<UploadOutlined />}
                disabled={isDisabled}
                loading={uploadingSupportingDoc}
                style={isDisabled ? buttonDisabledStyle : buttonGradientStyle}
              >
                Upload Supporting Doc
              </Button>
            </Upload>
          )}

          {/* PDF Generator */}
          <PDFGenerator
            checklist={{
              ...checklist,
              dclNo: checklist?.dclNo || checklist?._id,
            }}
            docs={docs}
            supportingDocs={[]}
            creatorComment=""
            comments={comments}
          />
        </Space>

        {/* Right Buttons - 2 buttons */}
        <Space wrap>
          {/* Return to Creator */}
          {!effectiveReadOnly && (
            <Tooltip title={returnToCreatorTooltipText}>
              <Button
                key="return"
                onClick={() => setConfirmAction("co_creator_review")}
                disabled={!canReturnToCreator() || effectiveReadOnly}
                icon={<SendOutlined />}
                style={
                  !canReturnToCreator() || effectiveReadOnly
                    ? buttonDisabledStyle
                    : buttonGradientStyle
                }
              >
                Return to Creator
              </Button>
            </Tooltip>
          )}

          {/* Approve Checklist */}
          {!effectiveReadOnly && (
            <Tooltip title={approveTooltipText}>
              <Button
                key="approve"
                type="primary"
                disabled={!canApproveChecklist() || effectiveReadOnly}
                onClick={() => {
                  if (!canApproveChecklist()) {
                    message.error(approveTooltipText);
                    return;
                  }
                  setConfirmAction("approved");
                }}
                icon={<CheckCircleOutlined />}
                style={
                  !canApproveChecklist() || effectiveReadOnly
                    ? buttonDisabledStyle
                    : buttonGradientStyle
                }
              >
                Approve Checklist
              </Button>
            </Tooltip>
          )}
        </Space>
      </div>
    </>
  );
};

export default ActionButtons;
