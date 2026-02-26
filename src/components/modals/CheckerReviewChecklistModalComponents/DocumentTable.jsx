import React from "react";
import { Table, Tag, Button, Tooltip } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { PRIMARY_BLUE } from "../../../utils/constants";
import { getFullUrl } from "../../../utils/checklistUtils";
import { formatStatusForSnakeCase } from "../../../utils/statusColors";

const DocumentTable = ({
  docs,
  isDisabled,
  onViewFile,
  effectiveReadOnly,
  handleDocApprove,
  handleDocReject,
  handleDocReset,
}) => {
  const getStatusTag = (status, type = "action") => {
    const lowerStatus = status?.toLowerCase() || "pending";
    let color = "default";
    let label = status || "Pending";

    switch (lowerStatus) {
      case "approved":
      case "checker_approved":
      case "co_approved":
        color = "green";
        label = "Approved";
        break;
      case "rejected":
      case "checker_rejected":
      case "co_rejected":
        color = "red";
        label = "Rejected";
        break;
      case "submitted":
        color = "blue";
        label = "Submitted";
        break;
      case "pending":
      case "pendingrm":
      case "pendingco":
        color = "red";  // Changed from gold to red for consistency
        label = "Pending";
        break;
      case "waived":
        color = "orange";
        label = "Waived";
        break;
      case "tbo":
        color = "cyan";
        label = "TBO";
        break;
      case "sighted":
        color = "purple";
        label = "Sighted";
        break;
      case "deferred":
        color = "volcano";
        label = "Deferred";
        break;
      default:
        color = "default";
    }

    return (
      <Tag
        color={color}
        style={{
          fontWeight: 500,
          margin: 0,
          minWidth: 60,
          textAlign: "center",
        }}
      >
        {label}
      </Tag>
    );
  };

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return "-";
    }
  };

  const handleDownload = (fileUrl, docName) => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      width: 90,
      render: (text) => (
        <Tooltip title={text || "N/A"}>
          <span style={{ fontSize: "11px", color: "#333" }}>
            {text || "N/A"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Document Name",
      dataIndex: "name",
      width: 130,
      render: (text, record) => {
        const docName = text || record.documentName || `Document ${record.docIdx + 1}`;
        return (
          <Tooltip title={docName}>
            <span style={{ fontSize: "11px", color: "#333" }}>
              {docName}
            </span>
          </Tooltip>
        );
      },
    },

    {
      title: "CO Status",
      dataIndex: "coStatus",
      width: 80,
      render: (status, record) => {
        // Get the actual status - use coStatus first, then status
        const actualStatus = status || record.status || "pending";
        const lowerStatus = actualStatus.toLowerCase();

        // Use consistent colors matching other modals
        // GREEN: submitted, approved, sighted
        // RED: pendingrm, pendingco
        // AMBER: deferred, waived, tbo
        let bgColor = "#fafafa";
        let textColor = "#000";
        let borderColor = "#d9d9d9";
        let label = actualStatus;

        switch (lowerStatus) {
          case "submitted":
            bgColor = "#f6ffed";
            textColor = "#52c41a";
            borderColor = "#52c41a";
            label = "submitted";
            break;
          case "approved":
            bgColor = "#f6ffed";
            textColor = "#52c41a";
            borderColor = "#52c41a";
            label = "approved";
            break;
          case "sighted":
            bgColor = "#f6ffed";
            textColor = "#52c41a";
            borderColor = "#52c41a";
            label = "sighted";
            break;
          case "pendingrm":
          case "pendingco":
          case "pending":
            bgColor = "#ffebe6";
            textColor = "#FF4D4F";
            borderColor = "#FF4D4F";
            label = "pending";
            break;
          case "deferred":
          case "deferral_requested":
            bgColor = "#fffbe6";
            textColor = "#FAAD14";
            borderColor = "#FAAD14";
            label = "deferred";
            break;
          case "waived":
            bgColor = "#fffbe6";
            textColor = "#FAAD14";
            borderColor = "#FAAD14";
            label = "waived";
            break;
          case "tbo":
            bgColor = "#fffbe6";
            textColor = "#FAAD14";
            borderColor = "#FAAD14";
            label = "tbo";
            break;
          case "rejected":
            bgColor = "#FFF";
            textColor = "#FF4D4F";
            borderColor = "#FF4D4F";
            label = "rejected";
            break;
          default:
            bgColor = "#fafafa";
            textColor = "#8c8c8c";
            borderColor = "#d9d9d9";
        }

        return (
          <Tooltip title={label}>
            <Tag
              style={{
                backgroundColor: bgColor,
                color: textColor,
                borderColor: borderColor,
                fontWeight: 500,
                margin: 0,
                minWidth: 60,
                textAlign: "center",
                textTransform: "lowercase",
                padding: "0 4px",
              }}
            >
              {label}
            </Tag>
          </Tooltip>
        );
      },
    },
      {
      title: "CO Comment",
      dataIndex: "comment",
      width: 110,
      render: (text, record) => {
        const comment = text || record.coComment;
        const hasComment = comment && comment.trim() !== "";

        return (
          <Tooltip title={hasComment ? comment : "No comment"}>
            <span
              style={{
                display: "block",
                fontSize: "11px",
                color: hasComment ? "#333" : "#666",
                fontStyle: hasComment ? "normal" : "italic",
                maxWidth: 150,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {hasComment ? comment : "-"}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 80,
      render: (deferralNo) => (
        <Tooltip title={deferralNo || "No deferral number"}>
          <span style={{ fontSize: "11px", color: "#666" }}>
            {deferralNo || "-"}
          </span>
        </Tooltip>
      ),
    },
   
    {
      title: "RM Status",
      dataIndex: "rmStatus",
      width: 185,
      render: (status) => {
        if (!status) {
          return <Tag color="default" style={{ minWidth: 60 }}>—</Tag>;
        }

        // Define colors for each status
        // submitted_for_review: white background, green text
        // deferral_requested: white background, amber text
        // pending_from_customer: red theme
        let bgColor = "#f5f5f5";
        let textColor = "#000";
        let borderColor = "#d9d9d9";

        const normalizedStatus = String(status).toLowerCase().replace(/\s+/g, "");

        if (normalizedStatus.includes("submittedforreview") || normalizedStatus.includes("submitted_for_review")) {
          bgColor = "#FFF";
          textColor = "#52C41A";  // Green
          borderColor = "#52C41A";
        } else if (normalizedStatus.includes("deferralrequested") || normalizedStatus.includes("deferral_requested") || normalizedStatus.includes("defferal_requested")) {
          bgColor = "#FFF";
          textColor = "#FAAD14";  // Amber
          borderColor = "#FAAD14";
        } else if (normalizedStatus.includes("pendingfromcustomer") || normalizedStatus.includes("pending_from_customer")) {
          bgColor = "#FFEBE6";
          textColor = "#FF4D4F";  // Red
          borderColor = "#FF4D4F";
        }

        const displayText = formatStatusForSnakeCase(status);
        // Remove deferral number from display - shown in Deferral No column

        return (
          <Tooltip title={displayText}>
            <Tag
              className="status-tag"
              style={{
                backgroundColor: bgColor,
                color: textColor,
                borderColor: borderColor,
                fontWeight: 500,
                padding: "5px 12px",
                fontSize: 11,
                whiteSpace: "nowrap",
                minWidth: 140,
                display: "inline-block",
                textAlign: "center",
                lineHeight: "20px",
              }}
            >
              {displayText}
            </Tag>
          </Tooltip>
        );
      },
    },
   {
      title: "Checker Status",
      dataIndex: "checkerStatus",
      width: 100,
      render: (status) => {
        // For checker status, show Approved, Rejected, or Pending
        const lowerStatus = status?.toLowerCase() || "pending";
        let color = "red"; // default to pending color - RED for consistency
        let label = "Pending";

        if (lowerStatus === "approved") {
          color = "green";
          label = "Approved";
        } else if (lowerStatus === "rejected") {
          color = "red";
          label = "Rejected";
        }

        return (
          <Tooltip title={label}>
            <Tag
              color={color}
              style={{
                fontWeight: 500,
                margin: 0,
                minWidth: 60,
                textAlign: "center",
                padding: "0 4px",
              }}
            >
              {label}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record, index) => {
        const isApproved = record.checkerStatus === "approved";
        const isRejected = record.checkerStatus === "rejected";

        if (effectiveReadOnly || isDisabled) {
          return (
            <span
              style={{
                fontSize: "11px",
                color: "#666",
                fontStyle: "italic",
              }}
            >
              {isApproved
                ? "Approved"
                : isRejected
                  ? "Rejected"
                  : "Pending review"}
            </span>
          );
        }

        return (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Button
              size="small"
              type={isApproved ? "primary" : "default"}
              icon={<CheckOutlined />}
              onClick={() => handleDocApprove(index)}
              style={{
                minWidth: 80,
                backgroundColor: isApproved ? "#52c41a" : "#f5f5f5",
                borderColor: isApproved ? "#52c41a" : "#d9d9d9",
                color: isApproved ? "#fff" : "#333",
              }}
            >
              {isApproved ? "Approved" : "Approve"}
            </Button>
            <Button
              size="small"
              type={isRejected ? "primary" : "default"}
              danger={isRejected}
              icon={<CloseOutlined />}
              onClick={() => handleDocReject(index)}
              style={{
                minWidth: 80,
                backgroundColor: isRejected ? "#ff4d4f" : "#f5f5f5",
                borderColor: isRejected ? "#ff4d4f" : "#d9d9d9",
                color: isRejected ? "#fff" : "#333",
              }}
            >
              {isRejected ? "Rejected" : "Reject"}
            </Button>
            {(isApproved || isRejected) && (
              <Tooltip title="Reset to pending">
                <Button
                  size="small"
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    handleDocReset(index);
                  }}
                  style={{
                    border: "1px solid #d9d9d9",
                    padding: "0 6px",
                    minWidth: "auto",
                  }}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "View",
      key: "view",
      width: 60,
      render: (_, record) =>
        record.fileUrl || record.uploadData?.fileUrl ? (
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => {
              // ✅ Add null check
              if (typeof onViewFile === "function") {
                onViewFile(record);
              } else {
                console.error("onViewFile is not a function");
                // Fallback: open URL directly
                const fileUrl = record.fileUrl || record.uploadData?.fileUrl;
                if (fileUrl) {
                  const fullUrl = getFullUrl(fileUrl);
                  window.open(fullUrl, "_blank", "noopener,noreferrer");
                }
              }
            }}
            size="small"
            style={{
              backgroundColor: PRIMARY_BLUE,
              borderColor: PRIMARY_BLUE,
              borderRadius: 6,
            }}
          >
            View
          </Button>
        ) : (
          <Tooltip title="No file uploaded">
            <Tag color="default">No File</Tag>
          </Tooltip>
        ),
    },
  ];

  return (
    <div style={{ marginBottom: 16 }}>
      <style>{`
        .checker-doc-table.ant-table .ant-table-thead > tr > th {
          padding: 6px 8px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
        }
        .checker-doc-table.ant-table .ant-table-tbody > tr > td {
          padding: 6px 8px !important;
          font-size: 11px !important;
        }
        .checker-doc-table .ant-tag {
          font-size: 10px !important;
          padding: 0 4px !important;
          height: 20px !important;
          line-height: 18px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 100px !important;
        }
        .checker-doc-table .ant-btn-sm {
          font-size: 10px !important;
          padding: 0 6px !important;
          height: 22px !important;
        }
        .checker-doc-table .ant-btn-sm .anticon {
          font-size: 12px !important;
        }
        .checker-doc-table .ant-btn-dangerous .anticon {
          font-size: 12px !important;
        }
      `}</style>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <h4
          style={{
            color: "#333",
            fontWeight: 600,
            margin: 0,
            fontSize: "13px",
          }}
        >
          Documents for Review
        </h4>
        <span
          style={{
            fontSize: "11px",
            color: "#666",
          }}
        >
          Total: {docs.length}
        </span>
      </div>

      <Table
        className="checker-doc-table"
        columns={columns}
        dataSource={docs.map((doc, idx) => ({
          ...doc,
          key: doc.key || doc.id || doc._id || idx,
        }))}
        pagination={false}
        size="small"
        scroll={{ x: "max-content" }}
        style={{
          backgroundColor: "white",
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid #e8e8e8",
        }}
        locale={{
          emptyText: (
            <div
              style={{ padding: "40px 0", textAlign: "center", color: "#666" }}
            >
              No documents found in this checklist
            </div>
          ),
        }}
      />

      {/* Clean, minimal CSS */}
      <style>{`
        .ant-table-thead > tr > th {
          background-color: #fafafa !important;
          font-weight: 600 !important;
          color: #333 !important;
          padding: 12px 16px !important;
          border-bottom: 2px solid #e8e8e8 !important;
          font-size: 13px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          vertical-align: middle !important;
          border-bottom: 1px solid #f0f0f0 !important;
          font-size: 13px !important;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #fafafa !important;
        }
        .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .ant-tag {
          border-radius: 2px !important;
          padding: 1px 6px !important;
          font-size: 12px !important;
        }
      `}</style>
    </div>
  );
};

export default DocumentTable;
