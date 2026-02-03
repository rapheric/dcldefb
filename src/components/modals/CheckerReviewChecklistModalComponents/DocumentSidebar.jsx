import React from "react";
import { Drawer, Typography, Collapse, Button, Divider } from "antd";
import {
  PaperClipOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  UserAddOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { Panel } = Collapse;

const DocumentSidebar = ({ documents, open, onClose }) => {
  const getFileIcon = (fileName) => {
    if (!fileName) return <FileTextOutlined className="doc-icon" />;
    const ext = fileName.split(".").pop().toLowerCase();
    switch (ext) {
      case "pdf":
        return (
          <FilePdfOutlined className="doc-icon" style={{ color: "#FF6B6B" }} />
        );
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return (
          <FileImageOutlined
            className="doc-icon"
            style={{ color: "#4ECDC4" }}
          />
        );
      case "doc":
      case "docx":
        return (
          <FileWordOutlined className="doc-icon" style={{ color: "#2E86C1" }} />
        );
      case "xls":
      case "xlsx":
        return (
          <FileExcelOutlined
            className="doc-icon"
            style={{ color: "#27AE60" }}
          />
        );
      case "zip":
      case "rar":
        return (
          <FileZipOutlined className="doc-icon" style={{ color: "#ED8936" }} />
        );
      default:
        return <FileTextOutlined className="doc-icon" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/,/g, "");
  };

  const processedDocs =
    documents && documents.length > 0
      ? documents
        .filter((doc) => (doc.uploadData && doc.uploadData.status !== "deleted") || doc.fileUrl)
        .map((doc, idx) => ({
          id: idx,
          title: doc.name || `Document ${idx + 1}`,
          category: doc.category,
          fileName: doc.fileUrl
            ? doc.fileUrl.split("/").pop()
            : "document.pdf",
          version: "1.0",
          size: 102400,
          pages: "1",
          owner: "Current User",
          uploadedBy: "Current User",
          uploadDate: doc.uploadDate || new Date().toISOString(),
          modifiedDate: doc.modifiedDate || new Date().toISOString(),
          fileUrl: doc.fileUrl,
          uploadHistory: [
            {
              timestamp: new Date().toISOString(),
              user: "Current User",
              action: "Uploaded",
            },
          ],
        }))
      : [];

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PaperClipOutlined style={{ color: "#164679" }} />
          <span>Uploaded Documents</span>
          <span
            style={{
              fontSize: "12px",
              color: "#666",
              marginLeft: "auto",
              backgroundColor: "#f0f5ff",
              padding: "2px 8px",
              borderRadius: "12px",
            }}
          >
            {processedDocs.length} {processedDocs.length === 1 ? "doc" : "docs"}
          </span>
        </div>
      }
      placement="right"
      closable={true}
      onClose={onClose}
      open={open}
      width={380}
      className="document-sidebar"
      styles={{
        header: {
          borderBottom: `2px solid #b5d334`,
          background: "white",
        },
        body: { padding: "16px" }
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          <CalendarOutlined style={{ marginRight: 6, fontSize: "10px" }} />
          Documents uploaded to this checklist
        </Text>
      </div>

      <Collapse
        ghost
        defaultActiveKey={["1"]}
        expandIconPosition="end"
        style={{ background: "transparent" }}
      >
        <Panel
          header={
            <Text strong style={{ color: "#164679" }}>
              Main Documents ({processedDocs.length})
            </Text>
          }
          key="1"
        >
          <div style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
            {processedDocs.map((doc) => (
              <div key={doc.id} className="doc-item">
                <div className="doc-header">
                  {getFileIcon(doc.fileName || doc.title)}
                  <div className="doc-title">
                    {doc.fileName ? doc.title : doc.title}
                  </div>
                  <div className="version-badge">v{doc.version}</div>
                </div>

                {doc.fileName && doc.fileName !== doc.title && (
                  <div
                    style={{
                      marginLeft: "28px",
                      fontSize: "12px",
                      color: "#4a5568",
                      marginBottom: "6px",
                    }}
                  >
                    {doc.fileName}
                  </div>
                )}

                <div className="doc-meta">
                  <span>
                    <ClockCircleOutlined className="doc-meta-icon" />
                    {formatDateTime(doc.modifiedDate || doc.uploadDate)}
                  </span>
                  <span>•</span>
                  <span>{formatFileSize(doc.size)}</span>
                  {doc.pages && (
                    <>
                      <span>•</span>
                      <span>
                        {doc.pages} Page{doc.pages !== "1" ? "s" : ""}
                      </span>
                    </>
                  )}
                </div>

                {doc.category && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#7e6496",
                      fontWeight: "600",
                      marginTop: "4px",
                      backgroundColor: "#7e649610",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      display: "inline-block",
                    }}
                  >
                    {doc.category}
                  </div>
                )}

                <div style={{ marginTop: "10px" }}>
                  <div className="upload-timeline">
                    {doc.uploadHistory &&
                      doc.uploadHistory.map((history, idx) => (
                        <div
                          key={idx}
                          style={{ marginBottom: "8px", position: "relative" }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              left: "-22px",
                              top: "2px",
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#b5d334",
                              border: `2px solid white`,
                            }}
                          />
                          <div
                            style={{
                              fontSize: "10px",
                              fontWeight: "500",
                              color: "#4a5568",
                            }}
                          >
                            {history.action} by{" "}
                            <span style={{ color: "#164679" }}>
                              {history.user}
                            </span>
                          </div>
                          <div className="upload-timestamp">
                            {formatDateTime(history.timestamp)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <Divider className="doc-divider" />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "11px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <UserAddOutlined
                      style={{ fontSize: "10px", color: "#718096" }}
                    />
                    <span style={{ color: "#718096" }}>Owner:</span>
                    <span style={{ fontWeight: "500", color: "#164679" }}>
                      {doc.owner || doc.uploadedBy || "badmin"}
                    </span>
                  </div>
                  {doc.fileUrl && (
                    <Button
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const API_BASE =
                          import.meta.env?.VITE_APP_API_URL ||
                          "http://localhost:5000";
                        const url =
                          doc.fileUrl.startsWith("http") ||
                            doc.fileUrl.startsWith("blob:")
                            ? doc.fileUrl
                            : `${API_BASE}${doc.fileUrl}`;
                        window.open(url, "_blank");
                      }}
                      style={{ padding: "0", fontSize: "11px" }}
                    >
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </Collapse>

      <Divider style={{ margin: "16px 0" }} />

      <div
        style={{
          background: "#f8fafc",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            marginBottom: "6px",
          }}
        >
          <Text type="secondary">Total Documents:</Text>
          <Text strong>{processedDocs.length}</Text>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
          }}
        >
          <Text type="secondary">Last Upload:</Text>
          <Text>
            {processedDocs.length > 0
              ? formatDateTime(
                processedDocs[processedDocs.length - 1].uploadDate,
              )
              : "N/A"}
          </Text>
        </div>
      </div>
    </Drawer>
  );
};

export default DocumentSidebar;
