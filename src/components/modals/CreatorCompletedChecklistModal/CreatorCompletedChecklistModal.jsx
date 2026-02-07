import React from "react";
import { Modal, Button, Spin } from "antd";
import { FilePdfOutlined, RedoOutlined } from "@ant-design/icons";
import { useGetChecklistCommentsQuery } from "../../../api/checklistApi";
import { calculateDocumentStats } from "../../../utils/documentUtils";
import ReviveConfirmationModal from "./ReviveConfirmationModal";
import ChecklistInfoCard from "./ChecklistInfoCard";
import ProgressStatsSection from "./ProgressStatsSection";
import DocumentsTable from "./DocumentsTable";
import CommentHistorySection from "./CommentHistorySection";
import { buttonStyles } from "../../styles/componentStyle";
import { modalStyles } from "../../styles/modalStyle";
import { useChecklistDocuments } from "../../../hooks/useChecklistDocuments";
import { useReviveChecklist } from "./hooks/useReviveChecklist";
import { usePDFGeneration } from "./hooks/usePDFGeneration";
// import usePDFGenerator from "../../../hooks/usePDFGenerator"; // Import the hook

const CreatorCompletedChecklistModal = ({
  checklist,
  open,
  onClose,
  onRevive,
  onRefreshData,
  readOnly = false,
  getFullUrlUtil,
}) => {
  // Get documents using custom hook
  const { docs, documentCounts } = useChecklistDocuments(checklist);

  // Calculate document stats - calculateDocumentStats now handles non-array input
  const documentStats = calculateDocumentStats(docs);

  // Use custom hooks
  const {
    isReviving,
    showReviveConfirm,
    handleReviveChecklist,
    handleConfirmRevive,
    handleCancelRevive,
  } = useReviveChecklist(checklist, onRevive, onRefreshData, onClose);

  const { isGeneratingPDF, generatePDF } = usePDFGeneration();

  // Get comments
  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
      skip: !checklist?.id && !checklist?._id,
    });

  const handleDownloadPDF = async () => {
    // Ensure docs is an array before passing to generatePDF
    const safeDocs = Array.isArray(docs) ? docs : [];
    await generatePDF(checklist, safeDocs, documentStats, comments);
  };

  return (
    <>
      <Modal
        title={
          <span
            style={{
              color: "white",
              fontSize: "1.15rem",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            Completed Checklist - {checklist?.title || ""}
          </span>
        }
        open={open}
        onCancel={onClose}
        width={1100}
        footer={[
          <Button
            key="download"
            icon={<FilePdfOutlined />}
            loading={isGeneratingPDF}
            onClick={handleDownloadPDF}
            type="primary"
            style={buttonStyles.download}
          >
            Download as PDF
          </Button>,
          !readOnly && (
            <Button
              key="revive"
              icon={<RedoOutlined />}
              loading={isReviving}
              disabled={isReviving}
              onClick={handleReviveChecklist}
              style={buttonStyles.revive}
            >
              Revive Checklist
            </Button>
          ),
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
        ]}
        styles={modalStyles}
      >
        {checklist ? (
          <>
            <ChecklistInfoCard checklist={checklist} />
            <ProgressStatsSection docs={docs} />
            <DocumentsTable
              docs={Array.isArray(docs) ? docs : []}
              checklist={checklist}
              getFullUrlUtil={getFullUrlUtil}
            />
            <CommentHistorySection
              comments={comments}
              isLoading={commentsLoading}
            />
          </>
        ) : (
          <Spin tip="Loading checklist..." />
        )}
      </Modal>

      <ReviveConfirmationModal
        open={showReviveConfirm}
        onCancel={handleCancelRevive}
        onConfirm={handleConfirmRevive}
        loading={isReviving}
      />
    </>
  );
};

export default CreatorCompletedChecklistModal;
