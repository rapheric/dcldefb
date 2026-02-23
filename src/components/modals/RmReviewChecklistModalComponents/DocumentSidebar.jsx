import React from "react";
import { Drawer, Card, Tag, Collapse, Button, Upload } from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { formatFileSize } from "../../../utils/uploadUtils";
// import { formatFileSize } from "../utils/uploadUtils";

const DocumentSidebar = ({
  documents,
  supportingDocs,
  open,
  onClose,
  getFullUrl,
  onUploadSupportingDoc,
  readOnly = false,
}) => {
  // Include docs that are either:
  // 1. Locally uploaded (uploadData exists and not deleted)
  // 2. Persisted on backend (fileUrl exists)
  const uploadedDocs = documents.filter(
    (d) => (d.uploadData && d.uploadData.status !== "deleted") || !!d.fileUrl,
  );

  const allDocs = [...uploadedDocs, ...(supportingDocs || [])];

  const groupedDocs = allDocs.reduce((acc, doc) => {
    const group = doc.category || "Main Documents";
    if (!acc[group]) acc[group] = [];
    acc[group].push(doc);
    return acc;
  }, {});

  const lastUpload =
    allDocs.length > 0
      ? allDocs
          .map((d) => new Date(d.uploadData?.createdAt || d.updatedAt || 0))
          .sort((a, b) => b - a)[0]
      : null;

  return (
    <Drawer
      title={
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600 }}>Uploaded Documents</span>
          <Tag color="blue">{allDocs.length} doc</Tag>
        </div>
      }
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
    >
      {/* Upload Additional Documents Section */}
      {!readOnly && onUploadSupportingDoc && (
        <Card
          size="small"
          style={{
            marginBottom: 16,
            border: "1px dashed #b5d334",
            backgroundColor: "#f8fafc",
          }}
        >
          <div style={{ marginBottom: 8, fontWeight: 600, color: "#164679" }}>
            📎 Upload Additional Documents
          </div>
          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              onUploadSupportingDoc(file);
              return false;
            }}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          >
            <Button
              type="primary"
              icon={<UploadOutlined />}
              size="small"
              style={{
                backgroundColor: "#b5d334",
                borderColor: "#b5d334",
                color: "#164679",
                fontWeight: 600,
              }}
            >
              Upload Supporting Document
            </Button>
          </Upload>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
            PDF, Word, Excel, Images (Max 10MB)
          </div>
        </Card>
      )}

      <div style={{ marginBottom: 12, color: "#6b7280", fontSize: 13 }}>
        📄 Documents uploaded to this checklist
      </div>

      {Object.entries(groupedDocs).map(([category, docs]) => (
        <Collapse
          key={category}
          defaultActiveKey={[category]}
          expandIconPosition="end"
          style={{ marginBottom: 16 }}
          items={[
            {
              key: category,
              label: (
                <b style={{ color: "#164679" }}>
                  {category} ({docs.length})
                </b>
              ),
              children: docs.map((doc, idx) => {
                // Check if this is a supporting doc (has uploadedByRole) or regular doc (has uploadData or fileUrl)
                const isSupportingDoc = !!doc.uploadedByRole || !!doc.fileName;
                const hasBackendFile = !!doc.fileUrl && !doc.uploadData;

                return (
                  <Card
                    key={idx}
                    size="small"
                    style={{
                      borderRadius: 10,
                      marginBottom: 12,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <b>
                        {isSupportingDoc
                          ? doc.fileName
                          : doc.uploadData?.fileName || doc.name}
                      </b>
                      <Tag
                        color={
                          isSupportingDoc
                            ? "blue"
                            : hasBackendFile
                              ? "green"
                              : doc.uploadData?.status === "active"
                                ? "green"
                                : "red"
                        }
                      >
                        {isSupportingDoc
                          ? "Supporting"
                          : hasBackendFile
                            ? "Uploaded"
                            : doc.uploadData?.status === "active"
                              ? "Active"
                              : "Deleted"}
                      </Tag>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      ID: {doc._id || doc.uploadData?._id || "—"}
                    </div>

                    <div style={{ fontSize: 12, color: "#374151" }}>
                      🕒{" "}
                      {isSupportingDoc
                        ? doc.uploadedAt
                          ? dayjs(doc.uploadedAt).format("DD MMM YYYY HH:mm:ss")
                          : "N/A"
                        : doc.uploadData?.createdAt
                          ? dayjs(doc.uploadData.createdAt).format(
                              "DD MMM YYYY HH:mm:ss",
                            )
                          : "N/A"}
                      {"  •  "}
                      {isSupportingDoc
                        ? doc.fileSize
                          ? formatFileSize(doc.fileSize)
                          : "N/A"
                        : doc.uploadData?.fileSize
                          ? formatFileSize(doc.uploadData.fileSize)
                          : "N/A"}
                      {"  •  "}
                      {isSupportingDoc
                        ? doc.fileType || "Unknown"
                        : doc.uploadData?.fileType || "Unknown"}
                    </div>

                    <div style={{ marginTop: 6 }}>
                      {isSupportingDoc ? (
                        <Tag
                          color={
                            doc.uploadedByRole === "rm"
                              ? "orange"
                              : doc.uploadedByRole === "co_creator"
                                ? "blue"
                                : doc.uploadedByRole === "checker"
                                  ? "purple"
                                  : "default"
                          }
                        >
                          {doc.uploadedByRole === "rm"
                            ? "RM Upload"
                            : doc.uploadedByRole === "co_creator"
                              ? "CO Upload"
                              : doc.uploadedByRole === "checker"
                                ? "Checker Upload"
                                : "Supporting"}
                        </Tag>
                      ) : (
                        <Tag color="purple">{doc.category}</Tag>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        paddingLeft: 10,
                        borderLeft: "3px solid #84cc16",
                        fontSize: 12,
                      }}
                    >
                      <div>
                        Uploaded by{" "}
                        <b>
                          {isSupportingDoc
                            ? doc.uploadedBy?.name || "Current User"
                            : doc.uploadData?.uploadedBy || "Current User"}
                        </b>
                      </div>
                      <div style={{ color: "#6b7280" }}>
                        {isSupportingDoc
                          ? doc.uploadedAt
                            ? dayjs(doc.uploadedAt).format(
                                "DD MMM YYYY HH:mm:ss",
                              )
                            : ""
                          : doc.uploadData?.createdAt
                            ? dayjs(doc.uploadData.createdAt).format(
                                "DD MMM YYYY HH:mm:ss",
                              )
                            : ""}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 10,
                        fontSize: 12,
                      }}
                    >
                      <div>
                        👤 Document:{" "}
                        <b>
                          {isSupportingDoc
                            ? doc.fileName
                            : doc.uploadData?.documentName || doc.name}
                        </b>
                      </div>

                      {(isSupportingDoc ||
                        doc.uploadData?.status === "active" ||
                        !!doc.fileUrl) && (
                        <Button
                          type="link"
                          icon={<DownloadOutlined />}
                          onClick={() =>
                            window.open(
                              getFullUrl(
                                isSupportingDoc
                                  ? doc.fileUrl
                                  : doc.uploadData?.fileUrl || doc.fileUrl,
                              ),
                              "_blank",
                            )
                          }
                        >
                          Download
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              }),
            },
          ]}
        />
      ))}

      <Card size="small" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Total Documents:</span>
          <b>{allDocs.length}</b>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 6,
          }}
        >
          <span>Last Upload:</span>
          <b>
            {lastUpload
              ? dayjs(lastUpload).format("DD MMM YYYY HH:mm:ss")
              : "—"}
          </b>
        </div>
      </Card>
    </Drawer>
  );
};

export default DocumentSidebar;
