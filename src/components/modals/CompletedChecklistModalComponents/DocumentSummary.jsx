// src/components/completedChecklistModal/components/DocumentSummary.jsx
import React from "react";
import { Progress } from "antd";
import { PRIMARY_BLUE } from "../../../utils/checklistConstants";
// import { PRIMARY_BLUE } from "../utils/checklistConstants";

const DocumentSummary = ({ documentCounts }) => {
  const progressPercent = 100; // Always 100% for completed checklists

  return (
    <div
      style={{
        padding: "16px",
        background: "#f7f9fc",
        borderRadius: 8,
        border: "1px solid #e0e0e0",
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ fontWeight: "700", color: PRIMARY_BLUE }}>
          Total: {documentCounts.total}
        </div>
        <div style={{ fontWeight: "700", color: "green" }}>
          Submitted: {documentCounts.submitted}
        </div>
        <div style={{ fontWeight: "700", color: "#faad14" }}>
          Waived: {documentCounts.waived}
        </div>
        <div style={{ fontWeight: "700", color: "#fa541c" }}>
          Deferred: {documentCounts.deferred}
        </div>
        <div style={{ fontWeight: "700", color: "#1890ff" }}>
          Sighted: {documentCounts.sighted}
        </div>
        <div style={{ fontWeight: "700", color: "#722ed1" }}>
          TBO: {documentCounts.tbo}
        </div>
      </div>
      <Progress
        percent={progressPercent}
        strokeColor="#52c41a"
        showInfo={false}
      />
      <div
        style={{
          textAlign: "center",
          marginTop: "8px",
          fontWeight: "600",
          color: PRIMARY_BLUE,
        }}
      >
        Checklist Complete - All documents processed
      </div>
    </div>
  );
};

export default DocumentSummary;