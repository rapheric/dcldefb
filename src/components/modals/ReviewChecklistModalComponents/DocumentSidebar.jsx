import React, { useMemo } from 'react';
import { Drawer, Card, Tag, Button, message, Popconfirm } from 'antd';
import { DownloadOutlined, DeleteOutlined, EyeOutlined, FileOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getFullUrl } from '../../../utils/checklistUtils';
import { PRIMARY_BLUE } from '../../../utils/constants';

const DocumentSidebar = ({
  documents = [],
  supportingDocs = [],
  open,
  onClose,
  onDeleteSupportingDoc = null
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

  const getRoleColor = (role) => {
    if (!role) return "default";
    const roleLower = role.toLowerCase();
    if (roleLower === "rm" || roleLower === "admin") return { bg: "#FFF7E6", color: "#FA8C16", text: "RM" };
    if (roleLower === "cocreator" || roleLower === "co_creator") return { bg: "#E6F7FF", color: "#1890FF", text: "CO" };
    if (roleLower === "checker" || roleLower === "cochecker") return { bg: "#F9F0FF", color: "#722ED1", text: "Checker" };
    return { bg: "#F5F5F5", color: "#8C8C8C", text: role };
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    return dayjs(dateStr).format("DD/MM/YYYY HH:mm");
  };

  const allDocs = useMemo(() => {
    const mainDocs = documents.filter(d => d.fileUrl || d.uploadData?.fileUrl).map(doc => ({
      ...doc,
      isSupporting: false,
      uploadData: doc.uploadData || {
        fileName: doc.name,
        fileUrl: doc.fileUrl,
        createdAt: doc.uploadedAt || doc.updatedAt || doc.createdAt,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        uploadedBy: doc.uploadedBy || 'Current User',
        status: 'active'
      }
    }));

    const supporting = supportingDocs.map(doc => ({
      ...doc,
      isSupporting: true,
      uploadData: doc.uploadData || {
        fileName: doc.name,
        fileUrl: doc.fileUrl,
        createdAt: doc.uploadedAt,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        uploadedBy: doc.uploadedBy || 'Current User',
        status: 'supporting'
      }
    }));

    return [...mainDocs, ...supporting];
  }, [documents, supportingDocs]);

  const groupedDocs = useMemo(() => {
    return allDocs.reduce((acc, doc) => {
      const group = doc.category || (doc.isSupporting ? 'Supporting Documents' : 'Main Documents');
      if (!acc[group]) acc[group] = [];
      acc[group].push(doc);
      return acc;
    }, {});
  }, [allDocs]);

  const handleDownload = (doc) => {
    const fileUrl = doc.fileUrl || doc.uploadData?.fileUrl;
    if (!fileUrl) return;
    const fullUrl = getFullUrl(fileUrl);
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const handleView = (doc) => {
    const fileUrl = doc.fileUrl || doc.uploadData?.fileUrl;
    if (!fileUrl) return;
    const fullUrl = getFullUrl(fileUrl);
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async (doc) => {
    if (!onDeleteSupportingDoc) {
      message.error('Delete function not available');
      return;
    }
    try {
      await onDeleteSupportingDoc(doc.id || doc._id, doc.uploadData?.fileName || doc.fileName);
      message.success(`"${doc.uploadData?.fileName || doc.fileName}" deleted successfully!`);
    } catch (error) {
      message.error(error.message || 'Failed to delete document');
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: "12px", color: PRIMARY_BLUE }}>Documents</span>
          <Tag color={PRIMARY_BLUE} style={{ margin: 0, fontSize: "10px" }}>{allDocs.length}</Tag>
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
                const fileName = doc.uploadData?.fileName || doc.name;
                const uploadDate = doc.uploadData?.createdAt || doc.uploadedAt;
                const uploadedBy = doc.uploadData?.uploadedBy || doc.uploadedBy || "Unknown";
                const role = doc.uploadedByRole;
                const fileUrl = doc.fileUrl || doc.uploadData?.fileUrl;
                const roleStyle = getRoleColor(role);

                return (
                  <Card
                    key={`${doc.uploadData?._id || doc.id || idx}`}
                    size="small"
                    style={{
                      marginBottom: 4,
                      borderLeft: doc.isSupporting ? "2px solid #b5d334" : "2px solid #164679",
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
                    </div>

                    {/* Upload Date & Time */}
                    <div style={{
                      fontSize: "9px",
                      color: "#8C8C8C",
                      marginBottom: 3
                    }}>
                      📅 {formatDateTime(uploadDate)}
                    </div>

                    {/* Uploader & Role */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4
                    }}>
                      <div style={{ fontSize: "9px", color: "#595959" }}>
                        👤 {uploadedBy}
                      </div>
                      {role && (
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

                    {/* Action Buttons */}
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
                        onClick={() => handleView(doc)}
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
                        onClick={() => handleDownload(doc)}
                      >
                        Download
                      </Button>
                      {doc.isSupporting && onDeleteSupportingDoc && (
                        <Popconfirm
                          title="Delete Document"
                          description={`Delete "${fileName}"?`}
                          onConfirm={() => handleDelete(doc)}
                          okText="Delete"
                          cancelText="Cancel"
                          okType="danger"
                        >
                          <Button
                            type="link"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            style={{
                              padding: "0 6px",
                              fontSize: "9px",
                              height: "20px"
                            }}
                          >
                            Delete
                          </Button>
                        </Popconfirm>
                      )}
                    </div>
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

export default DocumentSidebar;
