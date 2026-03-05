// src/components/completedChecklistModal/components/DocumentSidebarComponent.jsx
import React, { useMemo } from "react";
import { Drawer, Card, Tag, Button } from "antd";
import { DownloadOutlined, FileOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { API_BASE_URL, formatFileSize } from "../../../utils/checklistConstants";

const DocumentSidebarComponent = ({
  documents,
  open,
  onClose,
  supportingDocs = [],
}) => {
  const getFileIcon = (fileName) => {
    if (!fileName) return <FileOutlined style={{ fontSize: "11px" }} />;
    const ext = fileName.split(".").pop().toLowerCase();
    if (ext === "pdf") return <FileOutlined style={{ fontSize: "11px", color: "#FF4D4F" }} />;
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) return <FileOutlined style={{ fontSize: "11px", color: "#52C41A" }} />;
    if (["doc", "docx"].includes(ext)) return <FileOutlined style={{ fontSize: "11px", color: "#1890FF" }} />;
    if (["xls", "xlsx"].includes(ext)) return <FileOutlined style={{ fontSize: "11px", color: "#FAAD14" }} />;
    return <FileOutlined style={{ fontSize: "11px" }} />;
  };

  const allDocs = useMemo(() => {
    const uploadedDocs = documents.filter(
      (d) =>
        d.fileUrl ||
        d.uploadData?.fileUrl ||
        d.filePath ||
        d.url ||
        d.uploadData?.status === "active",
    );
    return [...uploadedDocs, ...supportingDocs];
  }, [documents, supportingDocs]);

  const groupedDocs = allDocs.reduce((acc, doc) => {
    const group = doc.category || "Supporting Documents";
    if (!acc[group]) acc[group] = [];
    acc[group].push(doc);
    return acc;
  }, {});

  const lastUpload =
    allDocs.length > 0
      ? allDocs
          .map((d) => new Date(d.uploadDate || d.updatedAt || d.createdAt || 0))
          .sort((a, b) => b - a)[0]
      : null;

  return (
    <Drawer
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: "12px", color: "#164679" }}>Documents</span>
          <Tag color="#164679" style={{ margin: 0, fontSize: "10px" }}>{allDocs.length}</Tag>
        </div>
      }
      placement="right"
      width={380}
      open={open}
      onClose={onClose}
      styles={{
        header: { borderBottom: "1px solid #E8E8E8", padding: "10px 14px" },
        body: { padding: "6px 10px", backgroundColor: "#FAFAFA" }
      }}
    >
      {allDocs.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "30px 12px",
          color: "#8C8C8C",
          fontSize: "11px"
        }}>
          <FileOutlined style={{ fontSize: "28px", marginBottom: 6, opacity: 0.5 }} />
          <div>No documents</div>
        </div>
      ) : (
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          {Object.entries(groupedDocs).map(([category, docs]) => (
            <div key={category} style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#595959",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                {category} ({docs.length})
              </div>

              {docs.map((doc, idx) => {
                const fileUrl = doc.fileUrl || doc.uploadData?.fileUrl || doc.filePath || doc.url;
                const fileName = doc.uploadData?.fileName || doc.name || doc.fileName || doc.documentName || "Unnamed Document";
                const uploadDate = doc.uploadDate || doc.uploadData?.createdAt || doc.updatedAt || doc.createdAt;
                const uploadedBy = doc.uploadedBy?.name || doc.uploadedBy || doc.uploadData?.uploadedBy?.name || doc.uploadData?.uploadedBy || doc.owner || "Unknown";
                const isSupporting = doc.category === "Supporting Documents";

                return (
                  <Card
                    key={idx}
                    size="small"
                    style={{
                      marginBottom: 4,
                      borderLeft: isSupporting ? "2px solid #b5d334" : "2px solid #164679",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      fontSize: "10px"
                    }}
                    bodyStyle={{ padding: "6px 8px" }}
                  >
                    {/* Document Name */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 4,
                      fontWeight: 500,
                      color: "#262626",
                      fontSize: "10px"
                    }}>
                      {getFileIcon(fileName)}
                      <span style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {fileName}
                      </span>
                      {doc.status === "deleted" && <Tag color="red" style={{ fontSize: "8px", margin: 0 }}>Deleted</Tag>}
                    </div>

                    {/* Upload Date & Time */}
                    <div style={{
                      fontSize: "9px",
                      color: "#8C8C8C",
                      marginBottom: 3
                    }}>
                      📅 {uploadDate ? dayjs(uploadDate).format("DD/MM/YYYY HH:mm") : "N/A"}
                    </div>

                    {/* Uploader */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4
                    }}>
                      <div style={{ fontSize: "9px", color: "#595959" }}>
                        👤 {uploadedBy}
                      </div>
                      <Tag
                        style={{
                          margin: 0,
                          fontSize: "8px",
                          padding: "0 5px",
                          height: "16px",
                          lineHeight: "16px",
                          backgroundColor: isSupporting ? "#E6FFFB" : "#F0F5FF",
                          color: isSupporting ? "#006D75" : "#164679",
                          border: "none"
                        }}
                      >
                        {isSupporting ? "Supporting" : "Main"}
                      </Tag>
                    </div>

                    {/* Action Button */}
                    {fileUrl && (
                      <div style={{
                        display: "flex",
                        gap: 4,
                        marginTop: 3
                      }}>
                        <Button
                          type="link"
                          size="small"
                          icon={<DownloadOutlined />}
                          style={{
                            padding: "0 6px",
                            fontSize: "9px",
                            height: "20px",
                            color: "#52C41A"
                          }}
                          onClick={() => {
                            const fullUrl = fileUrl.startsWith("http")
                              ? fileUrl
                              : `${API_BASE_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
                            window.open(fullUrl, "_blank");
                          }}
                        >
                          Download
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Footer Summary */}
      {allDocs.length > 0 && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "6px 10px",
          backgroundColor: "#F5F5F5",
          borderTop: "1px solid #E8E8E8",
          fontSize: "9px",
          color: "#595959"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Total: <strong>{allDocs.length}</strong></span>
            <span style={{ color: "#52C41A" }}>● Active</span>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default DocumentSidebarComponent;