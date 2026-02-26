
import React, { useState } from "react";
import {
  Table,
  Space,
  Button,
  Upload,
  Select,
  Input,
  Tag,
  message,
  Tooltip,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
// import { getExpiryStatus } from "../utils/documentStats";
// import { handleDeleteFile } from "../utils/uploadUtils";
// import { PRIMARY_BLUE } from "../constants/colors";
import { getExpiryStatus } from "../../../utils/documentStats";
import { PRIMARY_BLUE } from "../../../utils/colors";
import { formatStatusForSnakeCase } from "../../../utils/statusColors";

const DocumentTable = ({
  docs,
  setDocs,
  checklist,
  isActionAllowed,
  handleFileUpload,
  uploadingDocs,
  getFullUrl,
  readOnly,
}) => {
  const [showDeferralModal, setShowDeferralModal] = useState(false);
  const [deferralNumber, setDeferralNumber] = useState("");
  const [deferralDocIdx, setDeferralDocIdx] = useState(null);

  const canActOnDoc = (doc) => {
    // RM can only act on documents with pendingrm status
    const docStatus = (doc.status || "").toLowerCase();
    const isPendingRM = docStatus === "pendingrm";

    return isActionAllowed && isPendingRM;
  };

  const handleRmStatusChange = (docIdx, newRmStatus) => {
    setDocs((prev) =>
      prev.map((doc, idx) =>
        idx === docIdx
          ? { ...doc, rmStatus: newRmStatus, rmTouched: true }
          : doc,
      ),
    );
  };

  const handleDeferralNumberChange = (docIdx, value) => {
    setDocs((prev) =>
      prev.map((doc, idx) =>
        idx === docIdx
          ? { ...doc, deferralNumber: value, deferralNo: value }
          : doc,
      ),
    );
  };

  const renderStatusTag = (key) => {
    // Use consistent colors matching other modals
    // GREEN: submitted, approved, sighted
    // RED: pendingrm, pendingco, pending
    // AMBER: deferred, waived, tbo
    const lowerKey = key?.toLowerCase();

    let bgColor = "#fafafa";
    let textColor = "#000";
    let borderColor = "#d9d9d9";
    let text = key || "Unknown";
    let icon = <SyncOutlined spin />;

    if (lowerKey === "submitted" || lowerKey === "approved" || lowerKey === "sighted") {
      bgColor = "#f6ffed";
      textColor = "#52c41a";
      borderColor = "#52c41a";
      text = lowerKey;
      icon = <CheckCircleOutlined />;
    } else if (lowerKey === "pending" || lowerKey === "pendingrm" || lowerKey === "pendingco") {
      bgColor = "#ffebe6";
      textColor = "#FF4D4F";
      borderColor = "#FF4D4F";
      text = "pending";
      icon = <ClockCircleOutlined />;
    } else if (lowerKey === "deferred" || lowerKey === "waived" || lowerKey === "tbo") {
      bgColor = "#fffbe6";
      textColor = "#FAAD14";
      borderColor = "#FAAD14";
      text = lowerKey;
      icon = <CloseCircleOutlined />;
    }

    return (
      <Tag
        icon={icon}
        className="status-tag"
        style={{
          backgroundColor: bgColor,
          color: textColor,
          borderColor: borderColor,
          fontWeight: 500,
          textTransform: "lowercase",
          padding: "0 8px",
        }}
      >
        {text}
      </Tag>
    );
  };

  const renderRmStatusTag = (record) => {
    const key = (record?.rmStatus || "").toString();
    const normalized = key.toLowerCase().split(" ")[0];
    let color = "default";
    let text = key || "Unknown";

    if (
      (key === "Deferred" || key === "defferal_requested") &&
      record?.deferralNumber
    ) {
      text += ` (${record.deferralNumber})`;
    }

    switch (normalized) {
      case "pending_from_customer":
        color = "#fadb14";
        break;
      case "submitted_for_review":
        color = "#52c41a";
        break;
      case "deferred":
      case "deferral_requested":
        color = "#ff4d4f";
        break;
      default:
        color = "gray";
    }

    return (
      <Tag
        className="status-tag"
        style={{
          color: color,
          backgroundColor: color + "22",
          borderColor: color + "55",
        }}
      >
        {text}
      </Tag>
    );
  };

  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      width: 80,
      render: (text) => (
        <Tooltip title={text || "N/A"}>
          <span
            style={{
              fontSize: 11,
              color: "#7e6496",
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
    },
    {
      title: "Document Name",
      dataIndex: "name",
      width: 120,
      render: (text) => (
        <Tooltip title={text || "N/A"}>
          <Input
            size="small"
            value={text || "N/A"}
            disabled
            style={{ opacity: 0.6 }}
          />
        </Tooltip>
      ),
    },
    {
      title: "CO Status",
      width: 100,
      render: (_, record) => {
        const label =
          record.status === "deferred" && record.deferralNumber
            ? `Deferred (${record.deferralNumber})`
            : record.status;

        return (
          <Tooltip title={label}>
            <div style={{ opacity: 0.6 }}>{renderStatusTag(label)}</div>
          </Tooltip>
        );
      },
    },
    {
      title: "CO Comment",
      dataIndex: "comment",
      width: 110,
      render: (text) => (
        <Tooltip title={text || "No comment"}>
          <Input.TextArea
            rows={1}
            size="small"
            value={text}
            disabled
            style={{ opacity: 0.6 }}
          />
        </Tooltip>
      ),
    },
    {
      title: "Expiry",
      dataIndex: "expiryDate",
      width: 90,
      render: (text, record) =>
        record.expiryDate ? dayjs(record.expiryDate).format("YYYY-MM-DD") : "-",
    },
    {
      title: "Expiry Status",
      width: 80,
      render: (_, record) => {
        const status = getExpiryStatus(record.expiryDate);

        if (!status) return "-";

        return (
          <Tooltip title={status === "current" ? "Current" : "Expired"}>
            <Tag
              color={status === "current" ? "green" : "red"}
              style={{ fontWeight: 600 }}
            >
              {status === "current" ? "Current" : "Expired"}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 90,
      render: (deferralNo, record) => {
        const rmStatus = (record.rmStatus || "").toLowerCase();
        const status = (record.status || "").toLowerCase();

        // Get deferral number from either field
        const deferralNum = record.deferralNo || record.deferralNumber;

        // Show deferral number if RM requested deferral OR document is deferred
        if (
          deferralNum &&
          (rmStatus.includes("deferral") || status === "deferred")
        ) {
          return (
            <Tooltip title={`Deferral No: ${deferralNum}`}>
              <Tag color="orange" style={{ fontWeight: "bold" }}>
                {deferralNum}
              </Tag>
            </Tooltip>
          );
        }
        return "-";
      },
    },
    {
      title: "Actions",
      width: 170,
      render: (_, record) => {
        const isRestrictedCOStatus = [
          "submitted",
          "tbo",
          "waived",
          "sighted",
          "deferred",
          "pendingco",
        ].includes((record.status || "").toLowerCase());

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* RM Status Selection */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Select
                size="small"
                placeholder="RM Status"
                value={record.rmStatus || undefined}
                onChange={(val) => handleRmStatusChange(record.docIdx, val)}
                disabled={!canActOnDoc(record)}
                style={{ flex: 1 }}
              >
                <Option value="DeferralRequested">deferral_requested</Option>
                <Option value="SubmittedForReview">submitted_for_review</Option>
                <Option value="PendingFromCustomer">
                  pending_from_customer
                </Option>
              </Select>

              {/* Deferral Number Input - Show when DeferralRequested is selected */}
              {record.rmStatus &&
                (record.rmStatus === "DeferralRequested" ||
                  record.rmStatus.toLowerCase().includes("deferral")) && (
                  <Input
                    size="small"
                    placeholder="Deferral No"
                    value={record.deferralNumber || ""}
                    onChange={(e) =>
                      handleDeferralNumberChange(record.docIdx, e.target.value)
                    }
                    disabled={!canActOnDoc(record)}
                    style={{ width: 90 }}
                  />
                )}
            </div>

            {/* File Operations */}
            <Space size={4}>
              {!readOnly && (
                <Upload
                  showUploadList={false}
                  beforeUpload={(f) => handleFileUpload(record.docIdx, f)}
                  disabled={!isActionAllowed || isRestrictedCOStatus}
                >
                  <Button
                    size="small"
                    icon={<UploadOutlined />}
                    style={{
                      borderRadius: 6,
                      opacity:
                        !isActionAllowed || isRestrictedCOStatus ? 0.5 : 1,
                    }}
                    disabled={!isActionAllowed || isRestrictedCOStatus}
                  >
                    Upload
                  </Button>
                </Upload>
              )}

              {record.fileUrl && (
                <>
                  <Button
                    size="small"
                    onClick={() =>
                      window.open(
                        getFullUrl(
                          record.fileUrl || record.uploadData?.fileUrl,
                        ),
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
                  {!readOnly && (
                    <Button
                      size="small"
                      danger
                      onClick={() =>
                        setDocs((p) =>
                          p.map((d, i) =>
                            i === record.docIdx ? { ...d, fileUrl: null } : d,
                          ),
                        )
                      }
                      disabled={!canActOnDoc(record)}
                    >
                      Delete
                    </Button>
                  )}
                </>
              )}
            </Space>
          </div>
        );
      },
    },
    // {
    //   title: "RM Status",
    //   width: 120,
    //   render: (_, record) => (
    //     <div style={{ opacity: 0.6 }}>{renderRmStatusTag(record)}</div>
    //   ),
    // },

    {
      title: "RM Status",
      width: 185,
      render: (_, record) => {
        const rmStatus = record.rmStatus || "Unknown";

        let displayText = formatStatusForSnakeCase(rmStatus);
        // Remove the deferral number from display - just show the status
        // The deferral number is already shown in the Deferral No column

        // Define colors for each status
        // submitted_for_review: white background, green text
        // deferral_requested: white background, amber text
        // pending_from_customer: red theme
        let bgColor = "#f5f5f5";
        let textColor = "#000";
        let borderColor = "#d9d9d9";

        const normalizedStatus = String(rmStatus).toLowerCase().replace(/\s+/g, "");

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
          font-size: 12px !important;
        }
      `}</style>
      <Table
        className="doc-table"
        rowKey="docIdx"
        size="small"
        pagination={false}
        dataSource={docs}
        columns={columns}
        scroll={{ x: "max-content" }}
      />

      {showDeferralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-[360px] p-5">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Deferral Number
            </h3>

            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter deferral number"
              value={deferralNumber}
              onChange={(e) => setDeferralNumber(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                  setShowDeferralModal(false);
                  setDeferralDocIdx(null);
                }}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  if (!deferralNumber.trim()) {
                    message.error("Deferral number is required");
                    return;
                  }

                  const updated = [...docs];
                  updated[deferralDocIdx].action = "deferred";
                  updated[deferralDocIdx].status = "deferred";
                  updated[deferralDocIdx].deferralReason = deferralNumber;

                  setDocs(updated);
                  setShowDeferralModal(false);
                  setDeferralDocIdx(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentTable;
