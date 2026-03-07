import React from "react";
import { Progress, Tooltip, Card } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { ACCENT_LIME, PRIMARY_BLUE } from "../../../utils/constants";

const ProgressSection = ({ documentStats, total }) => {
  const {
    total: docTotal,
    submitted,
    deferred,
    sighted,
    waived,
    tbo,
  } = documentStats;

  const totalDocuments = docTotal || total || 1;

  // Calculate completion ratio
  const completedDocs =
    (submitted || 0) +
    (sighted || 0) +
    (waived || 0) +
    (tbo || 0) +
    (deferred || 0);
  const completionRatio =
    totalDocuments > 0 ? `${completedDocs}/${totalDocuments}` : "0/0";

  // Calculate progress percent
  const progressPercent =
    totalDocuments > 0 ? Math.round((completedDocs / totalDocuments) * 100) : 0;

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
          Total: {totalDocuments}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          Submitted: {submitted || 0}
        </div>
        <div
          style={{
            fontWeight: "700",
            color: "#464e57",
            fontSize: "13px",
          }}
        >
          Sighted: {sighted || 0}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          Waived: {waived || 0}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          TBO: {tbo || 0}
        </div>
        <div style={{ fontWeight: "700", color: "#464e57", fontSize: "13px" }}>
          Deferred: {deferred || 0}
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
              title={`${completedDocs} completed out of ${totalDocuments} total documents. Pending documents reduce progress.`}
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
      </div>
    </Card>
  );
};

export default ProgressSection;
