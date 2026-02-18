import React from "react";
import { Progress } from "antd";
import { COLORS } from "./constants";
// import { progressSectionStyles } from "../styles";
// import { calculateDocumentStats } from "../utils";
import { progressSectionStyles } from "../../styles/componentStyle";
import { calculateDocumentStats } from "../../../utils/documentUtils";

const ProgressStatsSection = ({ docs }) => {
  const documentStats = calculateDocumentStats(docs);
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

  const stats = [
    { label: "Total", value: total, color: COLORS.PRIMARY_BLUE },
    { label: "Submitted", value: submitted, color: "#52C41A" },
    {
      label: "Pending RM",
      value: pendingFromRM,
      color: pendingFromRM > 0 ? "#FF4D4F" : "#8b5cf6",
      highlight: pendingFromRM > 0,
    },
    {
      label: "Pending Co",
      value: pendingFromCo,
      color: "#FF4D4F",
      highlight: pendingFromCo > 0,
    },
    { label: "Deferred", value: deferred, color: "#FAAD14" },
    { label: "Sighted", value: sighted, color: "#52C41A" },
    { label: "Waived", value: waived, color: "#FAAD14" },
    { label: "TBO", value: tbo, color: "#FAAD14" },
  ];

  return (
    <div style={progressSectionStyles.container}>
      <div style={progressSectionStyles.statsRow}>
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              ...progressSectionStyles.statItem,
              color: stat.color,
              ...(stat.highlight && {
                border: `2px solid ${stat.color}`,
                padding: "2px 6px",
                borderRadius: "4px",
                background: "#f3f4f6",
              }),
            }}
          >
            {stat.label}: {stat.value}
          </div>
        ))}
      </div>

      <div style={progressSectionStyles.progressContainer}>
        <div style={progressSectionStyles.progressText}>
          <span style={progressSectionStyles.progressLabel}>
            Completion Progress
          </span>
          <span style={progressSectionStyles.progressPercent}>
            {progressPercent}%
          </span>
        </div>
        <Progress
          percent={progressPercent}
          strokeColor={{
            "0%": COLORS.PRIMARY_BLUE,
            "100%": COLORS.ACCENT_LIME,
          }}
          strokeWidth={6}
        />
      </div>
    </div>
  );
};

export default ProgressStatsSection;
