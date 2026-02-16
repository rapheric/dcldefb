import React from "react";
import { Table, Tag, Button } from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { COLORS, STATUS_DISPLAY, TABLE_CONFIG } from "./constants";
import {
  getCheckerStatusDisplay,
  getExpiryStatus,
} from "../../../utils/checklistConstants";
import { formatDate } from "../../../utils/checklistUtils";
import { tableStyles } from "../../styles/componentStyle";

const DocumentsTable = ({ docs, checklist, getFullUrlUtil }) => {
  console.log("📋 DocumentsTable received:", {
    docs,
    isArray: Array.isArray(docs),
    length: docs?.length || 0,
    checklistId: checklist?._id,
    checklistStatus: checklist?.status,
  });

  // FIX: Ensure docs is always an array
  const safeDocs = Array.isArray(docs) ? docs : [];

  console.log("📋 safeDocs:", safeDocs);

  // Show debug info if no documents
  if (safeDocs.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          background: "#f5f5f5",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <p style={{ fontSize: "16px", color: "#999", marginBottom: "8px" }}>
          No documents found
        </p>
        <p style={{ fontSize: "12px", color: "#666" }}>
          Documents array: {docs ? "Exists" : "Null/Undefined"} | Length:{" "}
          {docs?.length || 0} | Type: {typeof docs}
        </p>
        {checklist && (
          <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
            Checklist: {checklist.title} | Status: {checklist.status}
          </p>
        )}
      </div>
    );
  }

  const STATUS_CONFIG = {
    CO_STATUS_COLORS: {
      submitted: "#52c41a",      // GREEN - Submitted (changed from "green" ant color)
      approved: "#52c41a",       // GREEN - Approved
      pendingrm: "#6E0C05",      // Dark red - Pending RM
      pendingco: "#6E0549",      // Dark purple - Pending CO
      deferred: "#fa541c",       // VOLCANO - Deferred (changed to match standard)
      deferral_requested: "#fa541c", // VOLCANO - Deferral Requested
      sighted: "#1890ff",        // LIGHT BLUE - Sighted (changed from cyan)
      waived: "#C4AA1D",         // Gold - Waived
      tbo: "#faad14",            // AMBER/ORANGE - TBO (changed from blue)
    },
  };

  const getStatusIcon = (iconName) => {
    switch (iconName) {
      case "CheckCircleOutlined":
        return <CheckCircleOutlined />;
      case "CloseCircleOutlined":
        return <CloseCircleOutlined />;
      case "ClockCircleOutlined":
        return <ClockCircleOutlined />;
      case "EyeOutlined":
        return <EyeOutlined />;
      default:
        return null;
    }
  };

  // FIX: Use TABLE_CONFIG.COLUMNS instead of TABLE_COLUMNS
  const columns = TABLE_CONFIG.COLUMNS.map((col) => {
    if (col.key === "category") {
      return {
        ...col,
        render: (text) => (
          <span
            style={{
              fontSize: 12,
              color: COLORS.SECONDARY_PURPLE,
              fontWeight: 500,
            }}
          >
            {text || "N/A"}
          </span>
        ),
      };
    }

    if (col.key === "status") {
      return {
        ...col,
        render: (status, record) => {
          const statusLower = (status || "").toLowerCase();
          const color =
            STATUS_CONFIG.CO_STATUS_COLORS[statusLower] || "default";

          const statusLabel =
            status === "deferred" && record.deferralNo
              ? `Deferred (${record.deferralNo})`
              : status || "Pending";

          return (
            <Tag className="status-tag" color={color}>
              {statusLabel}
            </Tag>
          );
        },
      };
    }

    if (col.key === "deferralNo") {
      return {
        ...col,
        render: (text) => (
          <span style={{ fontSize: 13, color: "#666" }}>{text || "-"}</span>
        ),
      };
    }

    if (col.key === "checkerStatus") {
      return {
        ...col,
        render: (finalCheckerStatus, record) => {
          console.log("🔍 checkerStatus render:", {
            finalCheckerStatus,
            record,
          });

          const checklistStatus = checklist?.status;
          let displayStatus = finalCheckerStatus;

          // Always prioritize checklist status
          if (
            checklistStatus === "approved" ||
            checklistStatus === "completed"
          ) {
            displayStatus = "approved";
          } else if (checklistStatus === "rejected") {
            displayStatus = "rejected";
          }

          const statusDisplay = getCheckerStatusDisplay(
            displayStatus,
            checklistStatus,
          );

          return (
            <Tag
              color={statusDisplay.color}
              style={{
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: statusDisplay.color === "green" ? "#52c41a" : statusDisplay.color === "red" ? "#f5222d" : "inherit",
              }}
            >
              {statusDisplay.text}
            </Tag>
          );
        },
      };
    }

    if (col.key === "comment") {
      return {
        ...col,
        ellipsis: true,
        render: (text) => text || "-",
      };
    }

    if (col.key === "expiryDate") {
      return {
        ...col,
        render: (_, record) => {
          const category = (record.category || "").toLowerCase().trim();
          if (category !== "compliance documents") return "-";
          return formatDate(record.expiryDate, "DD/MM/YYYY");
        },
      };
    }

    if (col.key === "expiryStatus") {
      return {
        ...col,
        render: (_, record) => {
          const category = (record.category || "").toLowerCase().trim();
          if (category !== "compliance documents") return "-";

          const status = getExpiryStatus(record.expiryDate);
          if (!status) return "-";

          return (
            <Button
              size="small"
              type="primary"
              danger={status === "expired"}
              style={{
                backgroundColor: status === "current" ? "#52c41a" : undefined,
                borderColor: status === "current" ? "#52c41a" : undefined,
                cursor: "default",
                fontWeight: "bold",
              }}
            >
              {status === "current" ? "Current" : "Expired"}
            </Button>
          );
        },
      };
    }

    if (col.key === "view") {
      return {
        ...col,
        render: (_, record) => {
          const url = record.fileUrl || record.uploadData?.fileUrl;
          if (!url) return null;

          return (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => window.open(getFullUrlUtil(url), "_blank")}
              style={{ borderRadius: 6 }}
            >
              View
            </Button>
          );
        },
      };
    }

    return col;
  });

  console.log("📋 Rendering table with", safeDocs.length, "documents");

  return (
    <div style={tableStyles.container}>
      <Table
        {...tableStyles.table}
        columns={columns}
        dataSource={safeDocs}
        rowKey="docIdx"
        locale={{
          emptyText: "No documents available",
        }}
      />
    </div>
  );
};

export default DocumentsTable;
