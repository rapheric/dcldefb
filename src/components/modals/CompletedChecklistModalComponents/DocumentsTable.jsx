// src/components/completedChecklistModal/components/DocumentsTable.jsx
import React from "react";
import { Table, Tag, Button, Tooltip } from "antd";
import dayjs from "dayjs";
// import {
//   getCheckerStatusDisplay,
//   getExpiryStatus,
//   SECONDARY_PURPLE,
// } from "../utils/checklistConstants";
import { getFullUrl as getFullUrlUtil } from "../../../utils/checklistUtils.js";
import {
  getCheckerStatusDisplay,
  getExpiryStatus,
  SECONDARY_PURPLE,
} from "../../../utils/checklistConstants.js";
import { formatStatusText } from "../../../utils/statusColors.js";

const DocumentsTable = ({ docs, checklist }) => {
  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      width: 100,
      render: (text) => (
        <Tooltip title={text || "N/A"}>
          <span
            style={{ fontSize: 11, color: SECONDARY_PURPLE, fontWeight: 500 }}
          >
            {text || "N/A"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Document Name",
      dataIndex: "name",
      width: 180,
      render: (text, record) => {
        const docName = text || record.documentName || `Document ${record.docIdx + 1}`;
        return (
          <Tooltip title={docName}>
            <span style={{ fontSize: 11, color: "#333" }}>
              {docName}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Co Status",
      dataIndex: "status",
      width: 100,
      render: (status, record) => {
        const statusLabel =
          status === "deferred" && record.deferralNo
            ? `Deferred (${record.deferralNo})`
            : formatStatusText(status);

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
    },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 90,
      render: (deferralNo) => (
        <Tooltip title={deferralNo || "No deferral number"}>
          {deferralNo ? <Tag color="cyan">{deferralNo}</Tag> : "-"}
        </Tooltip>
      ),
    },
    {
      title: "Checker Status",
      dataIndex: "finalCheckerStatus",
      width: 120,
      render: (finalCheckerStatus, record) => {
        const checklistStatus = checklist?.status;
        let displayStatus = finalCheckerStatus;

        if (checklistStatus === "approved" || checklistStatus === "completed") {
          displayStatus = "approved";
        } else if (checklistStatus === "rejected") {
          displayStatus = "rejected";
        }

        const statusDisplay = getCheckerStatusDisplay(
          displayStatus,
          checklistStatus,
        );

        // Enhanced color mapping for checker status
        const lowerStatus = (displayStatus || "").toLowerCase();
        let bgColor = "#fafafa";
        let textColor = "#000";
        let borderColor = "#d9d9d9";

        switch (lowerStatus) {
          case "approved":
          case "completed":
            bgColor = "#f6ffed";
            textColor = "#52c41a";
            borderColor = "#52c41a";
            break;
          case "rejected":
            bgColor = "#ffebe6";
            textColor = "#FF4D4F";
            borderColor = "#FF4D4F";
            break;
          case "pending":
            bgColor = "#fffbe6";
            textColor = "#FAAD14";
            borderColor = "#FAAD14";
            break;
          default:
            bgColor = "#fafafa";
            textColor = "#8c8c8c";
            borderColor = "#d9d9d9";
        }

        return (
          <Tooltip title={statusDisplay.text}>
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
              {statusDisplay.text}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Co Comment",
      dataIndex: "comment",
      width: 130,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text || "No comment"}>
          <span>{text || "-"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      width: 90,
      render: (_, record) => {
        const category = (record.category || "").toLowerCase().trim();
        if (category !== "compliance documents") return "-";
        return record.expiryDate
          ? dayjs(record.expiryDate).format("DD/MM/YYYY")
          : "-";
      },
    },
    {
      title: "Expiry Status",
      dataIndex: "expiryStatus",
      width: 100,
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
    },
    {
      title: "View",
      key: "view",
      width: 70,
      render: (_, record) =>
        record.fileUrl && (
          <Tooltip title="View document">
            <Button
              size="small"
              onClick={() =>
                window.open(
                  getFullUrlUtil(record.fileUrl || record.uploadData?.fileUrl),
                  "_blank",
                )
              }
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
        ),
    },
  ];

  return (
    <>
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
        className="doc-table"
        columns={columns}
        dataSource={docs}
        pagination={false}
        rowKey="docIdx"
        size="small"
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "No documents" }}
      />
    </>
  );
};

export default DocumentsTable;
