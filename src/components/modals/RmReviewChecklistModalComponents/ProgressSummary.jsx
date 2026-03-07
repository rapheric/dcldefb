import React from "react";
import { Progress, Tooltip, Card } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { ACCENT_LIME, PRIMARY_BLUE } from "../../../utils/colors";
// import { PRIMARY_BLUE, ACCENT_LIME } from "../constants/colors";

const ProgressSummary = ({ documentStats }) => {
  const {
    total,
    submitted,
    pendingFromRM,
    pendingFromCo,
    deferred,
    sighted,
    waived,
    tbo,
  } = documentStats;

  // Calculate completion ratio
  const completedDocs =
    (submitted || 0) +
    (sighted || 0) +
    (waived || 0) +
    (tbo || 0) +
    (deferred || 0);
  const completionRatio = total > 0 ? `${completedDocs}/${total}` : "0/0";

  // Calculate progress percent
  const progressPercent =
    total > 0 ? Math.round((completedDocs / total) * 100) : 0;

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
          Total: {total}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          Submitted: {submitted}
        </div>
        <div
          style={{
            fontWeight: "700",
            color: "#464e57",
            border: pendingFromCo > 0 ? "2px solid #464e57" : "none",
            padding: pendingFromCo > 0 ? "4px 10px" : "0",
            borderRadius: "4px",
            background: pendingFromCo > 0 ? "#FFEBE6" : "transparent",
            fontSize: "13px",
          }}
        >
          Pending RM: {pendingFromRM}
        </div>
        <div
          style={{
            fontWeight: "700",
            color: "#464e57",
            border: pendingFromCo > 0 ? "2px solid #464e57" : "none",
            padding: pendingFromCo > 0 ? "4px 10px" : "0",
            borderRadius: "4px",
            background: pendingFromCo > 0 ? "#FFEBE6" : "transparent",
            fontSize: "13px",
          }}
        >
          Pending CO: {pendingFromCo}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          Deferred: {deferred}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          Sighted: {sighted}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          Waived: {waived}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          TBO: {tbo}
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
              title={`${completedDocs} completed out of ${total} total documents. Pending documents reduce progress.`}
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
          status={progressPercent < 100 ? "active" : "success"}
        />

        {/* Success message if all completed */}
        {progressPercent === 100 && (
          <div
            style={{
              fontSize: "11px",
              color: "#047857",
              backgroundColor: "#d1fae5",
              padding: "8px 12px",
              borderRadius: "6px",
              marginTop: 10,
              border: "1px solid #10b981",
              fontWeight: "500",
            }}
          >
            ✅ All documents are completed!
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProgressSummary;
