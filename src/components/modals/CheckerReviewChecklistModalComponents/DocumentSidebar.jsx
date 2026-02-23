import React from "react";
import { Drawer, Card, Tag, Button } from "antd";
import { DownloadOutlined, EyeOutlined, FileOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const DocumentSidebar = ({ documents, supportingDocs = [], open, onClose }) => {
  const getFileIcon = (fileName) => {
    if (!fileName) return <FileOutlined style={{ fontSize: "11px" }} />;
    const ext = fileName.split(".").pop().toLowerCase();

    if (ext === "pdf") return <FileOutlined style={{ fontSize: "11px", color: "#FF4D4F" }} />;
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) return <FileOutlined style={{ fontSize: "11px", color: "#52C41A" }} />;
    if (["doc", "docx"].includes(ext)) return <FileOutlined style={{ fontSize: "11px", color: "#1890FF" }} />;
    if (["xls", "xlsx"].includes(ext)) return <FileOutlined style={{ fontSize: "11px", color: "#FAAD14" }} />;
    return <FileOutlined style={{ fontSize: "11px" }} />;
  };

  const getRoleColor = (role) => {
    if (!role) return "default";
    const roleLower = role.toLowerCase();
    if (roleLower === "rm" || roleLower === "admin") return { bg: "#FFF7E6", color: "#FA8C16", text: "RM" };
    if (roleLower === "cocreator" || roleLower === "co_creator") return { bg: "#E6F7FF", color: "#1890FF", text: "CO" };
    if (roleLower === "checker" || roleLower === "cochecker") return { bg: "#F9F0FF", color: "#722ED1", text: "Checker" };
    return { bg: "#F5F5F5", color: "#8C8C8C", text: role };
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return dayjs(dateString).format("DD/MM/YYYY HH:mm");
  };

  const processedDocs =
    documents && documents.length > 0
      ? documents
          .filter(
            (doc) =>
              (doc.uploadData && doc.uploadData.status !== "deleted") ||
              doc.fileUrl,
          )
          .map((doc, idx) => ({
            id: idx,
            title: doc.name || `Document ${idx + 1}`,
            category: doc.category,
            fileName: doc.fileUrl
              ? doc.fileUrl.split("/").pop()
              : "document.pdf",
            fileUrl: doc.fileUrl,
            uploadDate: doc.uploadDate || new Date().toISOString(),
            modifiedDate: doc.modifiedDate || new Date().toISOString(),
          }))
      : [];

  const processedSupportingDocs =
    supportingDocs && supportingDocs.length > 0
      ? supportingDocs.map((doc, idx) => ({
          id: `support-${idx}`,
          title: doc.fileName || doc.name || `Supporting Doc ${idx + 1}`,
          category: "Supporting Documents",
          fileName: doc.fileName || doc.name,
          fileUrl: doc.fileUrl,
          uploadedBy: doc.uploadedBy || "Current User",
          uploadedByRole: doc.uploadedByRole,
          uploadDate: doc.uploadedAt || new Date().toISOString(),
        }))
      : [];

  const allDocs = [...processedDocs, ...processedSupportingDocs];

  const groupedDocs = allDocs.reduce((acc, doc) => {
    const group = doc.category || "Main Documents";
    if (!acc[group]) acc[group] = [];
    acc[group].push(doc);
    return acc;
  }, {});

  return (
    <Drawer
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: "12px", color: "#164679" }}>Documents</span>
          <Tag color="#164679" style={{ margin: 0, fontSize: "10px" }}>{allDocs.length}</Tag>
        </div>
      }
      placement="right"
      width={280}
      open={open}
      onClose={onClose}
      styles={{
        header: { borderBottom: "1px solid #E8E8E8", padding: "10px 14px" },
        body: { padding: "6px 10px", backgroundColor: "#FAFAFA" }
      }}
    >
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

            {docs.map((doc) => {
              const isSupportingDoc = doc.category === "Supporting Documents";
              const roleStyle = getRoleColor(doc.uploadedByRole);

              return (
                <Card
                  key={doc.id}
                  size="small"
                  style={{
                    marginBottom: 4,
                    borderLeft: isSupportingDoc ? "2px solid #b5d334" : "2px solid #164679",
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
                    {getFileIcon(doc.fileName || doc.title)}
                    <span style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {doc.fileName || doc.title}
                    </span>
                  </div>

                  {/* Upload Date & Time */}
                  <div style={{
                    fontSize: "9px",
                    color: "#8C8C8C",
                    marginBottom: 3
                  }}>
                    📅 {formatDateTime(doc.uploadDate || doc.modifiedDate)}
                  </div>

                  {/* Uploader & Role */}
                  {doc.uploadedBy && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4
                    }}>
                      <div style={{ fontSize: "9px", color: "#595959" }}>
                        👤 {doc.uploadedBy}
                      </div>
                      {doc.uploadedByRole && (
                        <Tag
                          style={{
                            margin: 0,
                            fontSize: "8px",
                            padding: "0 5px",
                            height: "16px",
                            lineHeight: "16px",
                            backgroundColor: roleStyle.bg,
                            color: roleStyle.color,
                            border: "none"
                          }}
                        >
                          {roleStyle.text}
                        </Tag>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {doc.fileUrl && (
                    <div style={{
                      display: "flex",
                      gap: 4,
                      marginTop: 3
                    }}>
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        style={{
                          padding: "0 6px",
                          fontSize: "9px",
                          height: "20px",
                          color: "#164679"
                        }}
                        onClick={() => {
                          const API_BASE = import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";
                          const url = doc.fileUrl.startsWith("http") || doc.fileUrl.startsWith("blob:")
                            ? doc.fileUrl
                            : `${API_BASE}${doc.fileUrl}`;
                          window.open(url, "_blank");
                        }}
                      >
                        View
                      </Button>
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
                          const API_BASE = import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";
                          const url = doc.fileUrl.startsWith("http") || doc.fileUrl.startsWith("blob:")
                            ? doc.fileUrl
                            : `${API_BASE}${doc.fileUrl}`;
                          window.open(url, "_blank");
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

        {allDocs.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "30px 12px",
            color: "#8C8C8C",
            fontSize: "11px"
          }}>
            <FileOutlined style={{ fontSize: "28px", marginBottom: 6, opacity: 0.5 }} />
            <div>No documents</div>
          </div>
        )}
      </div>

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

export default DocumentSidebar;
