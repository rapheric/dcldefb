// src/components/completedChecklistModal/components/DocumentsTable.jsx
import React from "react";
import { Table, Tag, Button } from "antd";
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

const DocumentsTable = ({ docs, checklist }) => {
  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      width: 120,
      render: (text) => (
        <span
          style={{ fontSize: 12, color: SECONDARY_PURPLE, fontWeight: 500 }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Document Name",
      dataIndex: "name",
      width: 200,
    },
    {
      title: "Co Status",
      dataIndex: "status",
      width: 120,
      render: (status, record) => {
        let color = "#d9d9d9"; // default gray
        const statusLower = (status || "").toLowerCase();

        // Consistent color scheme for all statuses
        switch (statusLower) {
          case "submitted":
          case "approved":
            color = "#52c41a"; // GREEN - Approved/Submitted
            break;
          case "pendingrm":
            color = "#6E0C05"; // Keep existing dark red for pending RM
            break;
          case "pendingco":
            color = "#6E0549"; // Keep existing dark purple for pending CO
            break;
          case "waived":
            color = "#C4AA1D"; // Keep existing gold for waived
            break;
          case "sighted":
            color = "#1890ff"; // LIGHT BLUE - Sighted
            break;
          case "deferred":
          case "deferral_requested":
            color = "#fa541c"; // VOLCANO - Deferred/Deferral Requested
            break;
          case "tbo":
            color = "#faad14"; // AMBER/ORANGE - TBO
            break;
          default:
            color = "#d9d9d9";
        }

        const statusLabel =
          status === "deferred" && record.deferralNo
            ? `Deferred (${record.deferralNo})`
            : status;

        return (
          <Tag className="status-tag" color={color}>
            {statusLabel}
          </Tag>
        );
      },
    },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 100,
      render: (deferralNo) =>
        deferralNo ? <Tag color="cyan">{deferralNo}</Tag> : "-",
    },
    {
      title: "Checker Status",
      dataIndex: "finalCheckerStatus",
      width: 140,
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
    },
    {
      title: "Co Comment",
      dataIndex: "comment",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      width: 100,
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
      width: 120,
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
    },
    {
      title: "View",
      key: "view",
      width: 80,
      render: (_, record) =>
        record.fileUrl && (
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
        ),
    },
  ];

  return (
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
  );
};

export default DocumentsTable;
