// export default DocumentTable;
import dayjs from "dayjs";
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
import { getExpiryStatus, getStatusColor } from "../../../utils/documentUtils";
import { PRIMARY_BLUE, SECONDARY_PURPLE } from "../../../utils/constants";
import { getFullUrl } from "../../../utils/checklistUtils";
import { formatStatusForSnakeCase } from "../../../utils/statusColors";

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
  checklistStatus, // ✅ Accept checklist status as prop
}) => {
  // CoCreator can act when:
  // 1. Checklist status is "pending" or "cocreatorreview" OR
  // 2. Document status is "pendingco"
  const canActOnDoc = (doc) => {
    if (isActionDisabled) return false;

    const docStatus = (doc.status || "").toLowerCase();
    const checklistStat = (checklistStatus || "").toLowerCase();

    // Allow actions when checklist is in pending/cocreatorreview OR document is pendingco
    return (
      ["pending", "cocreatorreview"].includes(checklistStat) ||
      docStatus === "pendingco"
    );
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
        // Show deferral number if it exists in either field
        const deferralNum = record.deferralNo || record.deferralNumber;
        if (deferralNum) {
          return (
            <Tag color="orange" style={{ fontWeight: "bold" }}>
              {deferralNum}
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
        // Define colors for each status with better visibility
        // approved: white background, green text
        // rejected: white background, red text
        // pending: light yellow background, orange text
        let bgColor = "#f5f5f5";
        let textColor = "#000";
        let borderColor = "#d9d9d9";
        let label = checkerStatus || "Pending";

        const normalizedStatus = String(checkerStatus || "").toLowerCase().replace(/\s+/g, "");

        if (normalizedStatus.includes("approved")) {
          bgColor = "#FFF";
          textColor = "#52C41A";  // Green
          borderColor = "#52C41A";
          label = "approved";
        } else if (normalizedStatus.includes("rejected")) {
          bgColor = "#FFF";
          textColor = "#FF4D4F";  // Red
          borderColor = "#FF4D4F";
          label = "rejected";
        } else {
          // Pending or unknown
          bgColor = "#FFF7E6";
          textColor = "#FA8C16";  // Orange
          borderColor = "#FA8C16";
          label = "pending";
        }

        const displayText = label;

        return (
          <Tag
            className="status-tag"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              borderColor: borderColor,
              fontWeight: "600",
              textTransform: "lowercase",
            }}
          >
            {displayText}
          </Tag>
        );
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
      render: (_, record) => (
        <Popconfirm
          title="Delete document?"
          description="This action cannot be undone."
          okText="Yes, Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}  
          onConfirm={() => onDelete(record.docIdx)}
          disabled={!canActOnDoc(record)}
        >
          <Button
            type="text"
            danger
            size="small"
            disabled={!canActOnDoc(record)}
          >
            <DeleteOutlined />
          </Button>
        </Popconfirm>
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
    />
  );
};

export default DocumentTable;
