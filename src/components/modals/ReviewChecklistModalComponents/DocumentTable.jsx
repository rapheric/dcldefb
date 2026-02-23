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
  Tooltip,
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
      width: 85,
      render: (text) => (
        <Tooltip title={text || "N/A"}>
          <span
            style={{
              fontSize: 11,
              color: SECONDARY_PURPLE,
              fontWeight: 500,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {text || "N/A"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Document Name",
      dataIndex: "name",
      width: 120,
      render: (text, record) => (
        <Tooltip title={record.name || "N/A"}>
          <Input
            size="small"
            value={record.name || ""}
            onChange={(e) => {
              const updated = [...docs];
              updated[record.docIdx].name = e.target.value;
              setDocs(updated);
            }}
            disabled={isActionDisabled}
            style={{ fontSize: 11 }}
          />
        </Tooltip>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      width: 160,
      render: (text, record) => (
        <div style={{ display: "flex", gap: 4 }}>
          <Select
            size="small"
            value={record.action}
            style={{ width: record.action === "deferred" ? 85 : "100%", fontSize: 11 }}
            onChange={(val) => onActionChange(record.docIdx, val)}
            disabled={!canActOnDoc(record)}
          >
            <Option value="submitted">Submitted</Option>
            <Option value="pendingrm">Pending RM</Option>
            <Option value="pendingco">Pending Co</Option>
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
              style={{ width: 75, fontSize: 11 }}
              disabled={!canActOnDoc(record)}
            />
          )}
        </div>
      ),
    },
    {
      title: "CO Status",
      dataIndex: "status",
      width: 100,
      render: (status, record) => {
        const statusColor = getStatusColor(status);
        const statusLabel =
          status === "deferred" && record.deferralNo ? "Deferred" : status;

        return (
          <Tooltip title={statusLabel}>
            <Tag className="status-tag" color={statusColor.tag} style={{ fontSize: 10 }}>
              {statusLabel}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 85,
      render: (deferralNo, record) => {
        // Show deferral number if it exists in either field
        const deferralNum = record.deferralNo || record.deferralNumber;
        if (deferralNum) {
          return (
            <Tooltip title={deferralNum}>
              <Tag color="orange" style={{ fontWeight: "bold", fontSize: 10 }}>
                {deferralNum}
              </Tag>
            </Tooltip>
          );
        }
        return "-";
      },
    },
    {
      title: "Checker Status",
      dataIndex: "finalCheckerStatus",
      width: 100,
      render: (checkerStatus) => {
        // Define colors for each status with better visibility
        // approved: white background, green text
        // rejected: white background, red text
        // pending: red background, red text (consistent with other pending statuses)
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
          // Pending or unknown - RED color (consistent with other pending statuses)
          bgColor = "#FFEBE6";  // Light red background
          textColor = "#FF4D4F";  // Red text
          borderColor = "#FF4D4F";
          label = "pending";
        }

        const displayText = label;

        return (
          <Tooltip title={displayText}>
            <Tag
              className="status-tag"
              style={{
                backgroundColor: bgColor,
                color: textColor,
                borderColor: borderColor,
                fontWeight: "600",
                textTransform: "lowercase",
                fontSize: 10,
              }}
            >
              {displayText}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "CO Comment",
      dataIndex: "comment",
      width: 110,
      render: (text, record) => (
        <Tooltip title={text || "No comment"}>
          <Input.TextArea
            rows={1}
            size="small"
            value={text}
            onChange={(e) => onCommentChange(record.docIdx, e.target.value)}
            disabled={!canActOnDoc(record)}
            style={{ fontSize: 11 }}
          />
        </Tooltip>
      ),
    },
    {
      title: "Expiry",
      dataIndex: "expiryDate",
      width: 120,
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
            style={{ width: 110, fontSize: 11 }}
            placeholder="Select expiry"
            size="small"
          />
        );
      },
    },
    {
      title: "Expiry Status",
      dataIndex: "expiryStatus",
      width: 80,
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
              fontSize: 10,
              height: 22,
              padding: "0 8px",
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
    // DocumentTable.jsx - In the "View" column render function
    {
      title: "View",
      key: "view",
      width: 65,
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
              fontSize: 10,
              height: 22,
              padding: "0 8px",
            }}
          >
            View
          </Button>
        ) : (
          <Tag color="default" style={{ fontSize: 10 }}>No File</Tag>
        ),
    },
    {
      title: "Delete",
      key: "delete",
      width: 45,
      render: (_, record) => (
        <Popconfirm
          title="Delete document?"
          description="This action cannot be undone."
          okText="Yes"
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
            style={{ fontSize: 14, padding: 0, width: 24, height: 24 }}
          >
            <DeleteOutlined />
          </Button>
        </Popconfirm>
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
        .doc-table .ant-input,
        .doc-table .ant-input-textarea {
          font-size: 11px !important;
          padding: 2px 6px !important;
        }
        .doc-table .ant-select .ant-select-selector {
          font-size: 11px !important;
          padding: 0 6px !important;
          height: 22px !important;
        }
        .doc-table .ant-btn-sm {
          font-size: 10px !important;
          padding: 0 6px !important;
          height: 22px !important;
        }
        .doc-table .ant-btn-sm .anticon {
          font-size: 12px !important;
        }
        .doc-table .ant-btn-dangerous .anticon {
          font-size: 14px !important;
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
      />
    </>
  );
};

export default DocumentTable;
