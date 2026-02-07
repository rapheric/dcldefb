import React from "react";
import {
  Table,
  Tag,
  Input,
  Select,
  Button,
  Popconfirm,
  DatePicker,
} from "antd";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
// import { getFullUrl, getStatusColor, getExpiryStatus } from '../../utils/documentUtils';
// import { PRIMARY_BLUE, SECONDARY_PURPLE } from '../../utils/constants';
import dayjs from "dayjs";
import { getExpiryStatus, getStatusColor } from "../../../utils/documentUtils";
import { PRIMARY_BLUE, SECONDARY_PURPLE } from "../../../utils/constants";
import { getFullUrl } from "../../../utils/checklistUtils";

const { Option } = Select;

const DocumentTable = ({
  docs,
  onActionChange,
  onCommentChange,
  onDeferralNoChange,
  onDelete,
  onExpiryDateChange,
  onViewFile, // ✅ Make sure this is passed
  isActionDisabled,
}) => {
  // CoCreator can only act on documents with pendingco status
  const canActOnDoc = (doc) => {
    const docStatus = (doc.status || "").toLowerCase();
    const isPendingCo = docStatus === "pendingco";
    return !isActionDisabled && isPendingCo;
  };
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
      width: 250,
      render: (text, record) => (
        <Input
          size="small"
          value={record.name}
          onChange={(e) => {
            const updated = [...docs];
            updated[record.docIdx].name = e.target.value;
            setDocs(updated);
          }}
          disabled={isActionDisabled}
        />
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      width: 220,
      render: (text, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Select
            size="small"
            value={record.action}
            style={{ width: record.action === "deferred" ? 110 : "100%" }}
            onChange={(val) => onActionChange(record.docIdx, val)}
            disabled={!canActOnDoc(record)}
          >
            <Option value="submitted">Submitted</Option>
            <Option value="pendingrm">Pending from RM</Option>
            <Option value="pendingco">Pending from Co</Option>
            <Option value="tbo">TBO</Option>
            <Option value="sighted">Sighted</Option>
            <Option value="waived">Waived</Option>
            <Option value="deferred">Deferred</Option>
          </Select>

          {record.action === "deferred" && (
            <Input
              size="small"
              placeholder="Deferral No"
              value={record.deferralNo || ""}
              onChange={(e) =>
                onDeferralNoChange(record.docIdx, e.target.value)
              }
              style={{ width: 100 }}
              disabled={!canActOnDoc(record)}
            />
          )}
        </div>
      ),
    },
    {
      title: "Co status",
      dataIndex: "status",
      width: 150,
      render: (status, record) => {
        const statusColor = getStatusColor(status);
        const statusLabel =
          status === "deferred" && record.deferralNo ? "Deferred" : status;

        return (
          <Tag className="status-tag" color={statusColor.tag}>
            {statusLabel}
          </Tag>
        );
      },
    },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 120,
      render: (deferralNo, record) => {
        if (record.status === "deferred" && deferralNo) {
          return (
            <Tag color="orange" style={{ fontWeight: "bold" }}>
              {deferralNo}
            </Tag>
          );
        }
        return "-";
      },
    },
    {
      title: "Checker Status",
      dataIndex: "finalCheckerStatus",
      render: (checkerStatus) => {
        let color = "default";
        let label = checkerStatus || "Pending";

        switch ((checkerStatus || "").toLowerCase()) {
          case "approved":
            color = "green";
            label = "Approved";
            break;
          case "rejected":
            color = "red";
            label = "Rejected";
            break;
          case "pending":
            color = "gold";
            label = "Pending";
            break;
          default:
            color = "default";
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Co comment",
      dataIndex: "comment",
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          rows={1}
          size="small"
          value={text}
          onChange={(e) => onCommentChange(record.docIdx, e.target.value)}
          disabled={!canActOnDoc(record)}
        />
      ),
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      render: (_, record) => {
        const category = (record.category || "").toLowerCase().trim();

        if (category !== "compliance documents") {
          return "-";
        }

        const dateValue = record.expiryDate ? dayjs(record.expiryDate) : null;

        return (
          <DatePicker
            value={dateValue}
            onChange={(date) => onExpiryDateChange(record.docIdx, date)}
            allowClear
            disabled={!canActOnDoc(record)}
            style={{ width: 160 }}
            placeholder="Select expiry date"
          />
        );
      },
    },
    {
      title: "Expiry Status",
      dataIndex: "expiryStatus",
      render: (_, record) => {
        const category = (record.category || "").toLowerCase().trim();

        if (category !== "compliance documents") {
          return "-";
        }

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
            }}
          >
            {status === "current" ? "Current" : "Expired"}
          </Button>
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

        let color = "blue";

        switch ((status || "").toLowerCase()) {
          case "submitted_for_review":
            color = "success";
            break;
          case "approved":
            color = "green";
            break;
          case "defferal_requested":
            color = "purple";
            break;
          case "pending_from_customer":
            color = "orange";
            break;
          default:
            color = "default";
        }

        return (
          <div className="flex items-center gap-2">
            <Tag className="status-tag" color={color}>
              {status.replace(/_/g, " ")}
            </Tag>

            {status.toLowerCase() === "defferal_requested" &&
              record?.deferralNumber && (
                <span className="text-xs text-gray-500">
                  #{record.deferralNumber}
                </span>
              )}
          </div>
        );
      },
    },
    // DocumentTable.jsx - In the "View" column render function
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
    {
      title: "Delete",
      key: "delete",
      width: 80,
      render: (_, record) =>
        canActOnDoc(record) ? (
          <Popconfirm
            title="Delete document?"
            description="This action cannot be undone."
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(record.docIdx)}
          >
            <Button type="text" danger size="small">
              <DeleteOutlined />
            </Button>
          </Popconfirm>
        ) : null,
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
    />
  );
};

export default DocumentTable;
