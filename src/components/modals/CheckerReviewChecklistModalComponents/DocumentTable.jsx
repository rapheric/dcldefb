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
        color = "gold";
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
      width: 150,
      render: (text) => (
        <span style={{ fontSize: "13px", color: "#333" }}>{text || "-"}</span>
      ),
    },
    {
      title: "Document Name",
      dataIndex: "name",
      width: 250,
      render: (text, record) => (
        <span style={{ fontSize: "13px", color: "#333" }}>
          {text || record.documentName || `Document ${record.docIdx + 1}`}
        </span>
      ),
    },

    {
      title: "Co status",
      dataIndex: "coStatus",
      width: 100,
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
            }}
          >
            {label}
          </Tag>
        );
      },
    },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 100,
      render: (deferralNo) => (
        <span style={{ fontSize: "13px", color: "#666" }}>
          {deferralNo || "-"}
        </span>
      ),
    },
    {
      title: "Checker Status",
      dataIndex: "checkerStatus",
      width: 120,
      render: (status) => {
        // For checker status, show Approved, Rejected, or Pending
        const lowerStatus = status?.toLowerCase() || "pending";
        let color = "gold"; // default to pending color
        let label = "Pending";

        if (lowerStatus === "approved") {
          color = "green";
          label = "Approved";
        } else if (lowerStatus === "rejected") {
          color = "red";
          label = "Rejected";
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
      },
    },
    {
      title: "RM Status",
      dataIndex: "rmStatus",
      width: 160,
      render: (status, record) => {
        if (!status) {
          return <Tag color="default">—</Tag>;
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
        const deferralNum = record.deferralNumber || record.deferralNo;

        return (
          <div className="flex items-center gap-2">
            <Tag
              className="status-tag"
              style={{
                backgroundColor: bgColor,
                color: textColor,
                borderColor: borderColor,
                fontWeight: "500",
              }}
            >
              {displayText}
            </Tag>

            {(normalizedStatus.includes("deferral_requested") || normalizedStatus.includes("deferralrequested") || normalizedStatus.includes("defferal_requested")) &&
              deferralNum && (
                <span className="text-xs text-gray-500">
                  #{deferralNum}
                </span>
              )}
          </div>
        );
      },
    },
    {
      title: "Co comment",
      dataIndex: "comment",
      width: 150,
      render: (text, record) => {
        const comment = text || record.coComment;
        const hasComment = comment && comment.trim() !== "";

        return (
          <Tooltip title={hasComment ? comment : "No comment"}>
            <span
              style={{
                display: "block",
                fontSize: "13px",
                color: hasComment ? "#333" : "#666",
                fontStyle: hasComment ? "normal" : "italic",
                maxWidth: 200,
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
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record, index) => {
        const isApproved = record.checkerStatus === "approved";
        const isRejected = record.checkerStatus === "rejected";

        if (effectiveReadOnly || isDisabled) {
          return (
            <span
              style={{
                fontSize: "12px",
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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button
              size="small"
              type={isApproved ? "primary" : "default"}
              icon={<CheckOutlined />}
              onClick={() => handleDocApprove(index)}
              style={{
                minWidth: 90,
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
                minWidth: 90,
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
                    padding: "4px 8px",
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
      width: 80,
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
          <Tag color="default">No File</Tag>
        ),
    },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h4
          style={{
            color: "#333",
            fontWeight: 600,
            margin: 0,
            fontSize: "16px",
          }}
        >
          Documents for Review
        </h4>
        <span
          style={{
            fontSize: "14px",
            color: "#666",
          }}
        >
          Total: {docs.length} documents
        </span>
      </div>

      <Table
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
