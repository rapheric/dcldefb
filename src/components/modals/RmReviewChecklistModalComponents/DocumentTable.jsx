
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
} from "antd";
import {
  UploadOutlined,
  EyeOutlined,
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
import { getStatusColor as getStatusColorStandard, formatStatusForSnakeCase } from "../../../utils/statusColors";

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
    const map = {
      sighted: { color: PRIMARY_BLUE, text: "Sighted", icon: <EyeOutlined /> },
      pending: {
        color: "#fadb14",
        text: "Pending",
        icon: <ClockCircleOutlined />,
      },
      submitted: {
        color: "#52c41a",
        text: "Submitted",
        icon: <CheckCircleOutlined />,
      },
      deferred: {
        color: "#ff4d4f",
        text: "Deferred",
        icon: <CloseCircleOutlined />,
      },
      waived: {
        color: "#ff4d4f",
        text: "Waived",
        icon: <CloseCircleOutlined />,
      },
    };

    const s = map[key?.toLowerCase()] || {
      color: "gray",
      text: key || "Unknown",
      icon: <SyncOutlined spin />,
    };

    return (
      <Tag
        className="status-tag"
        style={{
          color: s.color,
          backgroundColor: s.color + "22",
          borderColor: s.color + "55",
        }}
      >
        {s.icon} {s.text}
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
      width: 100,
      render: (text) => (
        <Input size="small" value={text} disabled style={{ opacity: 0.6 }} />
      ),
    },
    {
      title: "Document Name",
      dataIndex: "name",
      width: 150,
      render: (text) => (
        <Input size="small" value={text} disabled style={{ opacity: 0.6 }} />
      ),
    },
    {
      title: "Status from CO",
      width: 140,
      render: (_, record) => {
        const label =
          record.status === "deferred" && record.deferralNumber
            ? `Deferred (${record.deferralNumber})`
            : record.status;

        return <div style={{ opacity: 0.6 }}>{renderStatusTag(label)}</div>;
      },
    },
    {
      title: "Comment from CO",
      dataIndex: "comment",
      width: 150,
      render: (text) => (
        <Input.TextArea
          rows={1}
          size="small"
          value={text}
          disabled
          style={{ opacity: 0.6 }}
        />
      ),
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      width: 120,
      render: (text, record) =>
        record.expiryDate ? dayjs(record.expiryDate).format("YYYY-MM-DD") : "-",
    },
    {
      title: "Expiry Status",
      width: 120,
      render: (_, record) => {
        const status = getExpiryStatus(record.expiryDate);

        if (!status) return "-";

        return (
          <Tag
            color={status === "current" ? "green" : "red"}
            style={{ fontWeight: 600 }}
          >
            {status === "current" ? "Current" : "Expired"}
          </Tag>
        );
      },
    },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 120,
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
            <Tag color="orange" style={{ fontWeight: "bold" }}>
              {deferralNum}
            </Tag>
          );
        }
        return "-";
      },
    },
    {
      title: "Actions",
      width: 200,
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                <Option value="DeferralRequested">Deferral Requested</Option>
                <Option value="SubmittedForReview">Submitted for Review</Option>
                <Option value="PendingFromCustomer">
                  Pending from Customer
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
                    style={{ width: 100 }}
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
                    icon={<EyeOutlined />}
                    onClick={() =>
                      window.open(
                        getFullUrl(
                          record.fileUrl || record.uploadData?.fileUrl,
                        ),
                        "_blank",
                      )
                    }
                    style={{ borderRadius: 6 }}
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
      width: 120,
      render: (_, record) => {
        const rmStatus = record.rmStatus || "Unknown";
        const deferralNo = record.deferralNumber || record.deferralNo;

        let displayText = formatStatusForSnakeCase(rmStatus);
        if (
          rmStatus.toLowerCase().includes("deferral_requested") &&
          deferralNo
        ) {
          displayText = `deferral_requested (#${deferralNo})`;
        }

        // Get colors from global status color configuration
        const colorConfig = getStatusColorStandard(rmStatus);
        const bgColor = colorConfig?.bgColor || "#f5f5f5";
        const textColor = colorConfig?.textColor || "#000";
        const borderColor = colorConfig?.borderColor || "#d9d9d9";

        return (
          <Tag
            className="status-tag"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              borderColor: borderColor,
              fontWeight: 500,
            }}
          >
            {displayText}
          </Tag>
        );
      },
    },
  ];

  return (
    <>
      <Table
        className="doc-table"
        rowKey="docIdx"
        size="middle"
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
