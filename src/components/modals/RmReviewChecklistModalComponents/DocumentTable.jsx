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
      title: "Actions",
      width: 250,
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
                    opacity: !isActionAllowed || isRestrictedCOStatus ? 0.5 : 1,
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
                      getFullUrl(record.fileUrl || record.uploadData?.fileUrl),
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

            <Select
              size="small"
              value={record.rmStatus}
              style={{ width: 180 }}
              onChange={(value) =>
                setDocs((prev) =>
                  prev.map((d, idx) =>
                    idx === record.docIdx ? { ...d, rmStatus: value } : d,
                  ),
                )
              }
              options={[
                {
                  label: "Pending from Customer",
                  value: "pending_from_customer",
                },
                {
                  label: "Submitted for Review",
                  value: "submitted_for_review",
                },
                { label: "Deferral Requested", value: "defferal_requested" },
              ]}
              disabled={!canActOnDoc(record)}
            />

            {/* {record.rmStatus === "defferal_requested" && (
              <Input
                size="small"
                placeholder="Deferral number"
                value={record.deferralNumber}
                style={{ width: "100%", marginTop: 6 }}
                onChange={(e) =>
                  setDocs((prev) =>
                    prev.map((d, idx) =>
                      idx === record.docIdx
                        ? { ...d, deferralNumber: e.target.value }
                        : d,
                    ),
                  )
                }
                disabled={!canActOnDoc(record)}
              />
            )} */}

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
            {record.rmStatus === "defferal_requested" && (
              <Input
                size="small"
                placeholder="Def-XXXX"
                value={record.deferralNumber}
                style={{ width: "100%", marginTop: 6 }}
                onChange={(e) =>
                  setDocs((prev) =>
                    prev.map((d, idx) =>
                      idx === record.docIdx
                        ? { ...d, deferralNumber: e.target.value }
                        : d,
                    ),
                  )
                }
                disabled={!canActOnDoc(record)}
              />
            )}
          </Space>
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
        const rmStatus = (record.rmStatus || "").toLowerCase();
        const deferralNo = record.deferralNumber || record.deferralNo;

        let displayText = record.rmStatus || "Unknown";
        let color = "#1890ff"; // Default to blue

        if (rmStatus.includes("defferal_requested") && deferralNo) {
          displayText = `Deferral Requested (${deferralNo})`;
        }

        // Apply colors based on status
        if (rmStatus === "pending_from_customer") {
          color = "#faad14"; // Yellow/Orange for pending
        } else if (rmStatus === "submitted_for_review") {
          color = "#52c41a"; // Green for submitted
        } else if (
          rmStatus.includes("defferal_requested") ||
          rmStatus === "deferred"
        ) {
          color = "#ff4d4f"; // Red for deferred
        }

        return (
          <Tag
            className="status-tag"
            style={{
              color: color,
              backgroundColor: color + "22",
              borderColor: color + "55",
              fontWeight: 600,
              fontSize: "11px",
              padding: "2px 8px",
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
