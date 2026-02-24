import React, { useState, useEffect } from "react";
import { Card, List, Typography, Button, Tag, Empty, Popconfirm, message, Tooltip } from "antd";
import { DeleteOutlined, UndoOutlined, FileTextOutlined, HistoryOutlined } from "@ant-design/icons";
import { getDrafts, deleteDraft, getDraftTypeLabel, formatDraftDate } from "../../utils/draftsUtils";
import "./DraftsPage.css";

const { Title, Text, Paragraph } = Typography;

const DraftsPage = ({ type = null, onSelectDraft = null }) => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDrafts = () => {
    const allDrafts = getDrafts(type);
    setDrafts(allDrafts);
    setLoading(false);
  };

  useEffect(() => {
    loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleDeleteDraft = (id) => {
    const success = deleteDraft(id);
    if (success) {
      message.success("Draft deleted successfully");
      loadDrafts();
    } else {
      message.error("Failed to delete draft");
    }
  };

  const handleSelectDraft = (draft) => {
    if (onSelectDraft) {
      onSelectDraft(draft);
    }
  };

  const getTypeColor = (draftType) => {
    const colors = {
      'cocreator': 'blue',
      'rm': 'green',
      'checker': 'orange',
      'admin': 'purple',
      'approver': 'cyan',
      'deferral': 'red',
    };
    return colors[draftType] || 'default';
  };

  return (
    <div className="drafts-page">
      <div className="drafts-header">
        <Title level={2}>
          <FileTextOutlined /> My Drafts
        </Title>
        <Paragraph type="secondary">
          Resume your work from where you left off
        </Paragraph>
      </div>

      <Card className="drafts-card" loading={loading}>
        {drafts.length === 0 ? (
          <Empty
            description="No drafts found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )
        : (
          <List
            className="drafts-list"
            itemLayout="horizontal"
            dataSource={drafts}
            renderItem={(draft) => (
              <List.Item
                className="draft-item"
                actions={[
                  <Tooltip title="Restore this draft">
                    <Button
                      type="primary"
                      size="small"
                      icon={<UndoOutlined />}
                      onClick={() => handleSelectDraft(draft)}
                    >
                      Restore
                    </Button>
                  </Tooltip>,
                  <Popconfirm
                    title="Delete this draft?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDeleteDraft(draft.id)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                    >
                      Delete
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div className="draft-avatar">
                      <FileTextOutlined />
                    </div>
                  }
                  title={
                    <div className="draft-title">
                      <Text strong>{draft.data?.title || draft.data?.customerName || draft.data?.checklistTitle || 'Untitled Draft'}</Text>
                      <Tag color={getTypeColor(draft.type)} className="draft-type-tag">
                        {getDraftTypeLabel(draft.type)}
                      </Tag>
                    </div>
                  }
                  description={
                    <div className="draft-description">
                      {draft.data?.dclNo && <Tag>{draft.data.dclNo}</Tag>}
                      {draft.data?.loanType && <Tag>{draft.data.loanType}</Tag>}
                      {draft.data?.customerNumber && <Text type="secondary">Customer: {draft.data.customerNumber}</Text>}
                    </div>
                  }
                />
                <div className="draft-meta">
                  <Text type="secondary" className="draft-time">
                    <HistoryOutlined /> {formatDraftDate(draft.updatedAt)}
                  </Text>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default DraftsPage;
