import { Table, Tag, Button, Tooltip } from "antd";
import { COLORS, TABLE_CONFIG } from "./constants";
import {
  getCheckerStatusDisplay,
  getExpiryStatus,
} from "../../../utils/checklistConstants";
import { formatDate } from "../../../utils/checklistUtils";
import { formatStatusText } from "../../../utils/statusColors";
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

  // FIX: Use TABLE_CONFIG.COLUMNS instead of TABLE_COLUMNS
  const columns = TABLE_CONFIG.COLUMNS.map((col) => {
    if (col.key === "category") {
      return {
        ...col,
        render: (text) => (
          <Tooltip title={text || "N/A"}>
            <span
              style={{
                fontSize: 11,
                color: COLORS.SECONDARY_PURPLE,
                fontWeight: 500,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {text || "N/A"}
            </span>
          </Tooltip>
        ),
      };
    }

    if (col.key === "status") {
      return {
        ...col,
        render: (status, record) => {
          const statusLabel =
            status === "deferred" && record.deferralNo
              ? `Deferred (${record.deferralNo})`
              : formatStatusText(status || "Pending");

          const lowerStatus = (status || "").toLowerCase();

          // Enhanced color mapping for better visibility
          let bgColor = "#fafafa";
          let textColor = "#000";
          let borderColor = "#d9d9d9";

          switch (lowerStatus) {
            case "submitted":
            case "approved":
              bgColor = "#f6ffed";
              textColor = "#52c41a";
              borderColor = "#52c41a";
              break;
            case "sighted":
              bgColor = "#f6ffed";
              textColor = "#52c41a";
              borderColor = "#52c41a";
              break;
            case "pending":
            case "pendingrm":
            case "pendingco":
              bgColor = "#ffebe6";
              textColor = "#FF4D4F";
              borderColor = "#FF4D4F";
              break;
            case "deferred":
              bgColor = "#fffbe6";
              textColor = "#FAAD14";
              borderColor = "#FAAD14";
              break;
            case "waived":
              bgColor = "#fffbe6";
              textColor = "#FAAD14";
              borderColor = "#FAAD14";
              break;
            case "tbo":
              bgColor = "#fffbe6";
              textColor = "#FAAD14";
              borderColor = "#FAAD14";
              break;
            case "rejected":
              bgColor = "#FFF";
              textColor = "#FF4D4F";
              borderColor = "#FF4D4F";
              break;
            default:
              bgColor = "#fafafa";
              textColor = "#8c8c8c";
              borderColor = "#d9d9d9";
          }

          return (
            <Tooltip title={statusLabel}>
              <Tag
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  borderColor: borderColor,
                  fontWeight: 600,
                  fontSize: "11px",
                  padding: "0 6px",
                  lineHeight: "20px",
                  borderRadius: "4px",
                }}
              >
                {statusLabel}
              </Tag>
            </Tooltip>
          );
        },
      };
    }

    if (col.key === "deferralNo") {
      return {
        ...col,
        render: (text) => (
          <Tooltip title={text || "No deferral number"}>
            <span style={{ fontSize: 11, color: "#666" }}>{text || "-"}</span>
          </Tooltip>
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
            <Tooltip title={statusDisplay.text}>
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
            </Tooltip>
          );
        },
      };
    }

    if (col.key === "comment") {
      return {
        ...col,
        ellipsis: true,
        render: (text) => (
          <Tooltip title={text || "No comment"}>
            <span>{text || "-"}</span>
          </Tooltip>
        ),
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
            <Tooltip title={status === "current" ? "Current" : "Expired"}>
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
            </Tooltip>
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
            <Tooltip title="View document">
              <Button
                size="small"
                onClick={() => window.open(getFullUrlUtil(url), "_blank")}
                style={{
                  backgroundColor: '#164679',
                  borderColor: '#164679',
                  color: '#fff',
                  borderRadius: 6,
                }}
              >
                View
              </Button>
            </Tooltip>
          );
        },
      };
    }

    return col;
  });

  console.log("📋 Rendering table with", safeDocs.length, "documents");

  return (
    <div style={tableStyles.container}>
      <style>{`
        .doc-table.ant-table .ant-table-thead > tr > th {
          padding: 6px 8px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
        }
        .doc-table.ant-table .ant-table-tbody > tr > td {
          padding: 6px 8px !important;
          font-size: 11px !important;
        }
        .doc-table .ant-tag {
          font-size: 10px !important;
          padding: 0 4px !important;
          height: 20px !important;
          line-height: 18px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 100px !important;
        }
        .doc-table .ant-btn-sm {
          font-size: 10px !important;
          padding: 0 6px !important;
          height: 22px !important;
        }
        .doc-table .ant-btn-sm .anticon {
          font-size: 12px !important;
        }
      `}</style>
      <Table
        {...tableStyles.table}
        className="doc-table"
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
