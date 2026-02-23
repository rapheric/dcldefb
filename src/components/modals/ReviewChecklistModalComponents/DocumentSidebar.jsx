import React, { useMemo } from 'react';
import { 
  Drawer, 
  Collapse, 
  Card, 
  Tag, 
  Button, 
  Typography, 
  Avatar,
  Space,
  Divider,
  message,
  Popconfirm
} from 'antd';
import { 
  DownloadOutlined, 
  DeleteOutlined,
  FilePdfOutlined, 
  FileWordOutlined, 
  FileExcelOutlined,
  FileImageOutlined,
  FileZipOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  EyeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { formatFileSize, getFullUrl } from '../../../utils/checklistUtils';
import { ACCENT_LIME, PRIMARY_BLUE } from '../../../utils/constants';
// import { getFullUrl, formatFileSize } from '../../utils/documentUtils';
// import { PRIMARY_BLUE, ACCENT_LIME } from '../../utils/constants';

const { Text } = Typography;

const DocumentSidebar = ({ 
  documents = [], 
  supportingDocs = [], 
  open, 
  onClose,
  onDeleteSupportingDoc = null
}) => {
  // Combine regular and supporting documents
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
        uploadedBy: 'Current User',
        status: 'supporting'
      }
    }));

    return [...mainDocs, ...supporting];
  }, [documents, supportingDocs]);

  // Group documents by category
  const groupedDocs = useMemo(() => {
    return allDocs.reduce((acc, doc) => {
      const group = doc.category || (doc.isSupporting ? 'Supporting Documents' : 'Main Documents');
      if (!acc[group]) acc[group] = [];
      acc[group].push(doc);
      return acc;
    }, {});
  }, [allDocs]);

  // Get last upload time
  const lastUpload = useMemo(() => {
    if (allDocs.length === 0) return null;
    
    return allDocs
      .map(d => new Date(
        d.uploadData?.createdAt ||
        d.uploadedAt ||
        d.updatedAt ||
        d.createdAt ||
        0
      ))
      .sort((a, b) => b - a)[0];
  }, [allDocs]);

  // Get file icon based on file type
  const getFileIcon = (fileType = '', fileName = '') => {
    const lowerType = fileType.toLowerCase();
    const lowerName = fileName.toLowerCase();

    if (lowerType.includes('pdf') || lowerName.endsWith('.pdf')) {
      return <FilePdfOutlined style={{ color: '#FF6B6B' }} />;
    }
    if (lowerType.includes('word') || lowerType.includes('document') || 
        lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
      return <FileWordOutlined style={{ color: '#2B579A' }} />;
    }
    if (lowerType.includes('excel') || lowerType.includes('sheet') || 
        lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) {
      return <FileExcelOutlined style={{ color: '#217346' }} />;
    }
    if (lowerType.includes('image') || 
        /\.(jpg|jpeg|png|gif|bmp)$/i.test(fileName)) {
      return <FileImageOutlined style={{ color: '#4CAF50' }} />;
    }
    if (lowerType.includes('zip') || lowerType.includes('rar') || 
        lowerType.includes('compress') || 
        /\.(zip|rar|7z|tar|gz)$/i.test(fileName)) {
      return <FileZipOutlined style={{ color: '#FF9800' }} />;
    }
    return <FileTextOutlined style={{ color: '#607D8B' }} />;
  };

  // Get document type badge
  const getDocumentTypeBadge = (doc) => {
    if (doc.isSupporting) {
      return <Tag color="blue">Supporting</Tag>;
    }
    if (doc.uploadData?.status === 'active') {
      return <Tag color="green">Active</Tag>;
    }
    return <Tag color="orange">Regular</Tag>;
  };

  // Handle download
  const handleDownload = (doc) => {
    const fileUrl = doc.fileUrl || doc.uploadData?.fileUrl;
    if (!fileUrl) return;

    const fullUrl = getFullUrl(fileUrl);
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle view
  const handleView = (doc) => {
    const fileUrl = doc.fileUrl || doc.uploadData?.fileUrl;
    if (!fileUrl) return;

    const fullUrl = getFullUrl(fileUrl);
    const newWindow = window.open(fullUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      console.error('Popup blocked! Please allow popups.');
    }
  };

  // Handle delete supporting doc
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

  // Get file extension
  const getFileExtension = (fileName = '') => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
  };

  // Header content
  const drawerHeader = (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      width: '100%'
    }}>
      <Space align="center">
        <PaperClipOutlined style={{ color: PRIMARY_BLUE }} />
        <span style={{ fontWeight: 600 }}>Uploaded Documents</span>
      </Space>
      <Tag color="blue" style={{ fontWeight: 600 }}>
        {allDocs.length} {allDocs.length === 1 ? 'doc' : 'docs'}
      </Tag>
    </div>
  );

  // No documents state
  if (allDocs.length === 0) {
    return (
      <Drawer
        title={drawerHeader}
        placement="right"
        width={420}
        open={open}
        onClose={onClose}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '60%',
          textAlign: 'center',
          padding: '20px'
        }}>
          <Avatar
            size={80}
            icon={<PaperClipOutlined />}
            style={{ 
              backgroundColor: '#f0f2f5',
              color: '#bfbfbf',
              marginBottom: 16
            }}
          />
          <Text type="secondary" style={{ fontSize: 14 }}>
            No documents uploaded yet
          </Text>
          <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
            Upload documents to see them listed here
          </Text>
        </div>
      </Drawer>
    );
  }

  return (
    <Drawer
      title={drawerHeader}
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
      styles={{
        body: {
          padding: '16px',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 80px)'
        }
      }}
    >
      {/* Scrollable content wrapper */}
      <div style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
      {/* Summary Info */}
      <div style={{ 
        marginBottom: 20, 
        color: '#6b7280', 
        fontSize: 13,
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ClockCircleOutlined />
          <span>📄 Documents uploaded to this checklist</span>
        </div>
        <div style={{ fontSize: 12, color: '#374151', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>📦 Total: <strong>{allDocs.length}</strong></span>
          <span>📁 Groups: <strong>{Object.keys(groupedDocs).length}</strong></span>
          <span>⏰ Last upload: {lastUpload ? dayjs(lastUpload).format('DD MMM YYYY') : '—'}</span>
        </div>
      </div>

      {/* Grouped Documents */}
      {Object.entries(groupedDocs).map(([category, docsInCategory], index) => (
        <Collapse
          key={category}
          defaultActiveKey={Object.keys(groupedDocs)}
          expandIconPosition="end"
          style={{
            marginBottom: 16,
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            overflow: 'hidden'
          }}
          items={[
            {
              key: category,
              label: (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingRight: 8
                }}>
                  <Space align="center">
                    <div style={{ 
                      width: 4, 
                      height: 16, 
                      backgroundColor: index % 2 === 0 ? PRIMARY_BLUE : ACCENT_LIME,
                      borderRadius: 2,
                      marginRight: 8
                    }} />
                    <b style={{ color: PRIMARY_BLUE, fontSize: 13 }}>
                      {category}
                    </b>
                  </Space>
                  <Tag size="small" color="default">
                    {docsInCategory.length}
                  </Tag>
                </div>
              ),
              children: docsInCategory.map((doc, idx) => (
                <Card
                  key={`${doc.uploadData?._id || doc.id || idx}`}
                  size="small"
                  style={{
                    borderRadius: 8,
                    marginBottom: 12,
                    border: '1px solid #e5e7eb',
                    backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white'
                  }}
                  bodyStyle={{ padding: '12px' }}
                >
                  {/* Header with name and type badge */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 8
                  }}>
                    <Space direction="vertical" size={2} style={{ width: '70%' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        width: '100%'
                      }}>
                        {getFileIcon(doc.uploadData?.fileType, doc.uploadData?.fileName)}
                        <Text 
                          strong 
                          style={{ 
                            fontSize: 13,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={doc.uploadData?.fileName || doc.name}
                        >
                          {doc.uploadData?.fileName || doc.name}
                        </Text>
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        ID: {doc.uploadData?._id || doc.id || doc._id || '—'}
                      </div>
                    </Space>
                    {getDocumentTypeBadge(doc)}
                  </div>

                  {/* File info row */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    fontSize: 11
                  }}>
                    <Space size={12}>
                      <Tag 
                        size="small" 
                        color="default" 
                        style={{ 
                          fontWeight: 600,
                          fontSize: '10px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {getFileExtension(doc.uploadData?.fileName || doc.name)}
                      </Tag>
                      <span style={{ color: '#374151' }}>
                        {doc.uploadData?.fileSize 
                          ? formatFileSize(doc.uploadData.fileSize)
                          : 'N/A'
                        }
                      </span>
                    </Space>
                    <Space>
                      <span style={{ color: '#6b7280' }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {doc.uploadData?.createdAt
                          ? dayjs(doc.uploadData.createdAt).format('DD MMM YYYY')
                          : 'N/A'
                        }
                      </span>
                    </Space>
                  </div>

                  {/* Upload info */}
                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: 4,
                      fontSize: 11,
                      borderLeft: `3px solid ${doc.isSupporting ? '#3b82f6' : '#84cc16'}`,
                      marginBottom: 8
                    }}
                  >
                    <div style={{ color: '#374151' }}>
                      <strong>Uploaded by: </strong>
                      {doc.uploadData?.uploadedBy || 'Current User'}
                    </div>
                    <div style={{ color: '#6b7280', marginTop: 2 }}>
                      {doc.uploadData?.createdAt
                        ? dayjs(doc.uploadData.createdAt).format('DD MMM YYYY HH:mm:ss')
                        : doc.uploadedAt
                          ? dayjs(doc.uploadedAt).format('DD MMM YYYY HH:mm:ss')
                          : ''
                      }
                    </div>
                  </div>

                  {/* Document details and actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar 
                        size={20} 
                        style={{ 
                          backgroundColor: '#e0f2fe',
                          color: PRIMARY_BLUE,
                          fontSize: '10px'
                        }}
                      >
                        D
                      </Avatar>
                      <span style={{ color: '#4b5563' }}>
                        Document: <strong>{doc.uploadData?.documentName || doc.name}</strong>
                      </span>
                    </div>

                    <Space size={4}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined style={{ fontSize: 12 }} />}
                        onClick={() => handleView(doc)}
                        style={{ padding: '2px 6px' }}
                      >
                        View
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        icon={<DownloadOutlined style={{ fontSize: 12 }} />}
                        onClick={() => handleDownload(doc)}
                        style={{ padding: '2px 6px' }}
                      >
                        Download
                      </Button>
                      {doc.isSupporting && onDeleteSupportingDoc && (
                        <Popconfirm
                          title="Delete Supporting Document"
                          description={`Are you sure you want to delete "${doc.uploadData?.fileName || doc.fileName}"?`}
                          onConfirm={() => handleDelete(doc)}
                          okText="Delete"
                          okType="danger"
                          cancelText="Cancel"
                        >
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                            style={{ padding: '2px 6px' }}
                          >
                            Delete
                          </Button>
                        </Popconfirm>
                      )}
                    </Space>
                  </div>
                </Card>
              )),
            },
          ]}
        />
      ))}

      <Divider style={{ margin: '16px 0' }} />

      {/* Footer Summary */}
      <Card 
        size="small" 
        style={{ 
          border: `1px solid ${PRIMARY_BLUE}20`,
          backgroundColor: '#f8fafc'
        }}
        bodyStyle={{ padding: '12px' }}
      >
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 12,
          fontSize: 12
        }}>
          <div>
            <div style={{ color: '#6b7280', fontSize: 11 }}>Total Documents</div>
            <div style={{ 
              color: PRIMARY_BLUE, 
              fontWeight: 700, 
              fontSize: 16,
              marginTop: 2
            }}>
              {allDocs.length}
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: 11 }}>Categories</div>
            <div style={{ 
              color: PRIMARY_BLUE, 
              fontWeight: 700, 
              fontSize: 16,
              marginTop: 2
            }}>
              {Object.keys(groupedDocs).length}
            </div>
          </div>
        </div>
        
        {lastUpload && (
          <div style={{ 
            marginTop: 12, 
            paddingTop: 12,
            borderTop: '1px dashed #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 11
            }}>
              <span style={{ color: '#6b7280' }}>Last Upload:</span>
              <strong style={{ color: '#374151' }}>
                {dayjs(lastUpload).format("DD MMM YYYY HH:mm:ss")}
              </strong>
            </div>
            <div style={{ 
              fontSize: 10, 
              color: '#9ca3af',
              marginTop: 4
            }}>
              {dayjs(lastUpload).fromNow()}
            </div>
          </div>
        )}
      </Card>
      </div>
    </Drawer>
  );
};

export default DocumentSidebar;