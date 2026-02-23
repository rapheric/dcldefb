// src/components/completedChecklistModal/components/DocumentsTable.jsx
import React from "react";
import { Table, Tag, Button, Tooltip } from "antd";
import { EyeOutlined } from "@ant-design/icons";
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
import { getStatusTagProps, getStatusColor, formatStatusText } from "../../../utils/statusColors.js";

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

        const colorConfig = getStatusColor(status);

        return (
          <Tooltip title={statusLabel}>
            <Tag
              className="status-tag"
              {...getStatusTagProps(status)}
              style={{
                backgroundColor: colorConfig.bgColor,
                color: colorConfig.textColor,
                borderColor: colorConfig.borderColor,
                fontWeight: "500",
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
              icon={<EyeOutlined />}
              onClick={() =>
                window.open(
                  getFullUrlUtil(record.fileUrl || record.uploadData?.fileUrl),
                  "_blank",
                )
              }
              style={{ borderRadius: 6 }}
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
