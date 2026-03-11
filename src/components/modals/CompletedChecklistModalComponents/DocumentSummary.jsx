// src/components/completedChecklistModal/components/DocumentSummary.jsx
import React from "react";
import { Progress, Card, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { PRIMARY_BLUE, ACCENT_LIME } from "../../../utils/constants";
// import { PRIMARY_BLUE } from "../utils/checklistConstants";

const DocumentSummary = ({ documentCounts }) => {
  const progressPercent = 100; // Always 100% for completed checklists
  const completionRatio =
    documentCounts.total > 0
      ? `${documentCounts.total}/${documentCounts.total}`
      : "0/0";

  return (
    <Card
      size="small"
      style={{
        marginBottom: 18,
        borderRadius: 10,
        border: `1px solid #e0e0e0`,
      }}
      styles={{
        body: {
          padding: "16px 24px",
          background: "#f7f9fc",
        },
      }}
    >
      {/* Stats Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: "12px 16px",
        }}
      >
        <div
          style={{ fontWeight: "700", color: PRIMARY_BLUE, fontSize: "13px" }}
        >
          Total: {documentCounts.total}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          Submitted: {documentCounts.submitted}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          Waived: {documentCounts.waived}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          Deferred: {documentCounts.deferred}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          Sighted: {documentCounts.sighted}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          TBO: {documentCounts.tbo}
        </div>
      </div>

      {/* Progress Bar with Info */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{ fontSize: "13px", color: "#666", fontWeight: "500" }}
            >
              Completion Progress
            </span>
            <Tooltip
              title={`${documentCounts.total} completed out of ${documentCounts.total} total documents.`}
            >
              <InfoCircleOutlined
                style={{
                  color: PRIMARY_BLUE,
                  cursor: "help",
                  fontSize: "14px",
                }}
              />
            </Tooltip>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: PRIMARY_BLUE,
              }}
            >
              {progressPercent}%
            </span>
            <span
              style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}
            >
              ({completionRatio})
            </span>
          </div>
        </div>

        <Progress
          percent={progressPercent}
          strokeColor={{
            "0%": PRIMARY_BLUE,
            "100%": ACCENT_LIME,
          }}
          strokeWidth={8}
          status="success"
        />
      </div>
    </Card>
  );
};

export default DocumentSummary;
