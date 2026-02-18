import React from "react";
import { Progress } from "antd";
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
    progressPercent,
  } = documentStats;

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
          gap: "8px",
        }}
      >
        <div style={{ fontWeight: "700", color: PRIMARY_BLUE }}>
          Total: {total}
        </div>
        <div style={{ fontWeight: "700", color: "#52C41A" }}>
          Submitted: {submitted}
        </div>
        <div style={{ fontWeight: "700", color: "#FF4D4F" }}>
          Pending RM: {pendingFromRM}
        </div>
        <div style={{ fontWeight: "700", color: "#FF4D4F" }}>
          Pending CO: {pendingFromCo}
        </div>
        <div style={{ fontWeight: "700", color: "#FAAD14" }}>
          Deferred: {deferred}
        </div>
        <div style={{ fontWeight: "700", color: "#52C41A" }}>
          Sighted: {sighted}
        </div>
        <div style={{ fontWeight: "700", color: "#FAAD14" }}>
          Waived: {waived}
        </div>
        <div style={{ fontWeight: "700", color: "#FAAD14" }}>
          TBO: {tbo}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: "12px", color: "#666" }}>
            Completion Progress
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: PRIMARY_BLUE,
            }}
          >
            {progressPercent}%
          </span>
        </div>
        <Progress
          percent={progressPercent}
          strokeColor={{
            "0%": PRIMARY_BLUE,
            "100%": ACCENT_LIME,
          }}
          strokeWidth={6}
        />
      </div>
    </div>
  );
};

export default ProgressSummary;