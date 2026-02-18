import React from "react";
import { Progress, Tooltip } from "antd";
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
    checkerReviewed,
    checkerApproved,
    checkerRejected,
    progressPercent: rawProgressPercent,
  } = documentStats;

  const totalDocuments = docTotal || total || 1;

  // Enhanced progress calculation
  const calculateEnhancedProgress = () => {
    if (rawProgressPercent !== undefined) {
      return rawProgressPercent;
    }

    const completedDocs =
      (submitted || 0) +
      (sighted || 0) +
      (waived || 0) +
      (tbo || 0) +
      (deferred || 0);
    const calculatedPercent = Math.round(
      (completedDocs / totalDocuments) * 100,
    );
    return Math.min(calculatedPercent, 100);
  };

  const enhancedProgressPercent = calculateEnhancedProgress();

  // Review progress (documents reviewed by checker)
  const reviewProgressPercent =
    checkerReviewed > 0
      ? Math.round((checkerReviewed / totalDocuments) * 100)
      : 0;

  // Approval progress (documents approved by checker)
  const approvalProgressPercent =
    checkerApproved > 0
      ? Math.round((checkerApproved / totalDocuments) * 100)
      : 0;

  // Calculate completion ratio
  const completedDocs =
    (submitted || 0) +
    (sighted || 0) +
    (waived || 0) +
    (tbo || 0) +
    (deferred || 0);
  const incompleteDocs = totalDocuments - completedDocs;
  const completionRatio =
    totalDocuments > 0 ? `${completedDocs}/${totalDocuments}` : "0/0";

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
      {/* Stats Row */}
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
          Total: {totalDocuments}
        </div>
        <div style={{ fontWeight: "700", color: "#52C41A" }}>
          Submitted: {submitted || 0}
        </div>
        <div style={{ fontWeight: "700", color: "#52C41A" }}>
          Sighted: {sighted || 0}
        </div>
        <div style={{ fontWeight: "700", color: "#FAAD14" }}>
          Waived: {waived || 0}
        </div>
        <div style={{ fontWeight: "700", color: "#FAAD14" }}>
          TBO: {tbo || 0}
        </div>
        <div style={{ fontWeight: "700", color: "#FAAD14" }}>
          Deferred: {deferred || 0}
        </div>
        {checkerReviewed > 0 && (
          <div style={{ fontWeight: "700", color: "#8b5cf6" }}>
            Reviewed: {checkerReviewed}
          </div>
        )}
        {checkerApproved > 0 && (
          <div style={{ fontWeight: "700", color: "#10b981" }}>
            Approved: {checkerApproved}
          </div>
        )}
        {checkerRejected > 0 && (
          <div style={{ fontWeight: "700", color: "#dc2626" }}>
            Rejected: {checkerRejected}
          </div>
        )}
      </div>

      {/* Completion Progress Bar */}
      <div style={{ marginBottom: checkerApproved > 0 ? 16 : 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "12px", color: "#666" }}>
              Document Completion
            </span>
            <Tooltip
              title={`${completedDocs} completed out of ${totalDocuments} total documents. Pending documents reduce progress.`}
            >
              <InfoCircleOutlined
                style={{ color: PRIMARY_BLUE, cursor: "help" }}
              />
            </Tooltip>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: PRIMARY_BLUE,
              }}
            >
              {enhancedProgressPercent}%
            </span>
            <span style={{ fontSize: "11px", color: "#666" }}>
              ({completionRatio})
            </span>
          </div>
        </div>

        <Progress
          percent={enhancedProgressPercent}
          strokeColor={{
            "0%": PRIMARY_BLUE,
            "100%": ACCENT_LIME,
          }}
          size={[undefined, 6]}
          status={enhancedProgressPercent < 100 ? "active" : "success"}
        />

        {/* Progress Details */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "#666",
            marginTop: 8,
          }}
        >
          <span>✅ Completed: {completedDocs}</span>
          <span>⏳ Incomplete: {incompleteDocs}</span>
          <span>📊 Progress: {enhancedProgressPercent}%</span>
        </div>

        {/* Review Progress Details (if applicable) */}
        {checkerReviewed > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "#666",
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px dashed #e0e0e0",
            }}
          >
            <span style={{ color: "#10b981" }}>
              ✓ Approved: {checkerApproved || 0}
            </span>
            <span style={{ color: "#dc2626" }}>
              ✗ Rejected: {checkerRejected || 0}
            </span>
            <span style={{ color: "#8b5cf6" }}>
              🔍 Reviewed: {checkerReviewed}/{totalDocuments}
            </span>
          </div>
        )}

        {/* Warning if incomplete documents exist */}
        {incompleteDocs > 0 && enhancedProgressPercent < 100 && (
          <div
            style={{
              fontSize: "10px",
              color: "#d97706",
              backgroundColor: "#fef3c7",
              padding: "6px 10px",
              borderRadius: "4px",
              marginTop: 8,
              border: "1px solid #f59e0b20",
            }}
          >
            ⚠️ {incompleteDocs} incomplete document(s) are reducing overall
            progress
          </div>
        )}

        {/* Success message if all completed */}
        {enhancedProgressPercent === 100 && (
          <div
            style={{
              fontSize: "10px",
              color: "#047857",
              backgroundColor: "#d1fae5",
              padding: "6px 10px",
              borderRadius: "4px",
              marginTop: 8,
              border: "1px solid #10b98120",
            }}
          >
            ✅ All documents are completed!
          </div>
        )}
      </div>

      {/* Approval Progress Bar (if applicable) */}
      {checkerApproved > 0 && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "12px", color: "#666" }}>
                Approval Progress
              </span>
              <Tooltip
                title={`${checkerApproved} documents approved out of ${totalDocuments} total documents.`}
              >
                <InfoCircleOutlined
                  style={{ color: "#10b981", cursor: "help" }}
                />
              </Tooltip>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#10b981",
                }}
              >
                {approvalProgressPercent}%
              </span>
              <span style={{ fontSize: "11px", color: "#666" }}>
                ({checkerApproved}/{totalDocuments})
              </span>
            </div>
          </div>

          <Progress
            percent={approvalProgressPercent}
            strokeColor={{
              "0%": "#10b981",
              "100%": "#34d399",
            }}
            size={[undefined, 6]}
            showInfo={false}
          />

          {/* Approval Details */}
          <div
            style={{
              fontSize: "11px",
              color: "#666",
              marginTop: 8,
            }}
          >
            {checkerApproved || 0} of {totalDocuments} documents approved
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressSection;
