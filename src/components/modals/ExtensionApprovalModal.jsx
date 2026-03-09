import React, { useState } from "react";
import {
  Modal,
  Button,
  Input,
  Form,
  Descriptions,
  Tag,
  Divider,
  Space,
  message,
  Spin,
  Table,
  Empty,
} from "antd";
import {
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const ExtensionApprovalModal = ({
  extension,
  open,
  onClose,
  onApprove,
  onReject,
  approverRole = "approver", // 'approver', 'creator', 'checker'
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [action, setAction] = useState(null); // 'approve', 'reject'

  if (!extension) return null;

  const handleApprove = async () => {
    try {
      const comment = form.getFieldValue("comment") || "";
      setApproving(true);
      await onApprove(extension.id, comment);
      form.resetFields();
      setAction(null);
      onClose();
    } catch (error) {
      message.error(error.message || "Failed to approve extension");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      const reason = form.getFieldValue("reason") || "";
      if (!reason.trim()) {
        message.error("Please provide a rejection reason");
        return;
      }
      setRejecting(true);
      await onReject(extension.id, reason);
      form.resetFields();
      setAction(null);
      onClose();
    } catch (error) {
      message.error(error.message || "Failed to reject extension");
    } finally {
      setRejecting(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      pending_approval: "orange",
      in_review: "blue",
      approved: "green",
      rejected: "red",
    };
    return statusMap[status?.toLowerCase()] || "default";
  };

  const getApproverStatusColor = (status) => {
    const statusMap = {
      pending: "orange",
      approved: "green",
      rejected: "red",
    };
    return statusMap[status?.toLowerCase()] || "default";
  };

  const approverColumns = [
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => <Tag>{role}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "approvalStatus",
      key: "approvalStatus",
      render: (status) => (
        <Tag color={getApproverStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Current",
      dataIndex: "isCurrent",
      key: "isCurrent",
      render: (isCurrent) =>
        isCurrent ? <CheckCircleOutlined style={{ color: "#52c41a" }} /> : "-",
    },
  ];

  const PRIMARY_BLUE = "#164679";
  const SUCCESS_GREEN = "#52c41a";
  const ERROR_RED = "#ff4d4f";

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarOutlined style={{ color: PRIMARY_BLUE }} />
          <span>Extension Approval</span>
        </div>
      }
      open={open}
      onCancel={() => {
        onClose();
        form.resetFields();
        setAction(null);
      }}
      width={900}
      footer={null}
      styles={{
        body: { maxHeight: "70vh", overflowY: "auto", paddingRight: 8 },
      }}
    >
      <Spin spinning={loading}>
        {/* Extension Details */}
        <Descriptions
          bordered
          size="small"
          column={2}
          style={{ marginBottom: 16 }}
        >
          <Descriptions.Item label="Deferral Number">
            <strong>{extension.deferralNumber}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Customer Name">
            {extension.customerName}
          </Descriptions.Item>
          <Descriptions.Item label="Customer Number">
            {extension.customerNumber}
          </Descriptions.Item>
          <Descriptions.Item label="DCL Number">
            {extension.dclNumber}
          </Descriptions.Item>
          <Descriptions.Item label="Current Days Sought">
            <strong>{extension.currentDaysSought} days</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Requested Days Sought">
            <strong style={{ color: "#faad14" }}>
              {extension.requestedDaysSought} days
            </strong>
          </Descriptions.Item>
          <Descriptions.Item label="Extension Status">
            <Tag color={getStatusColor(extension.status)}>
              {extension.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Requested By">
            {extension.requestedByName}
          </Descriptions.Item>
          <Descriptions.Item label="Reason" span={2}>
            {extension.extensionReason}
          </Descriptions.Item>
        </Descriptions>

        <Divider>Approvers</Divider>

        {/* Approvers Table */}
        {extension.approvers && extension.approvers.length > 0 ? (
          <Table
            dataSource={extension.approvers}
            columns={approverColumns}
            size="small"
            pagination={false}
            rowKey={(record) => record.id}
            style={{ marginBottom: 16 }}
          />
        ) : (
          <Empty
            description="No approvers found"
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Additional Files */}
        {extension.additionalFiles && extension.additionalFiles.length > 0 && (
          <>
            <Divider>Additional Files</Divider>
            <div style={{ marginBottom: 16 }}>
              {extension.additionalFiles.map((file) => (
                <div key={file.id} style={{ marginBottom: 8 }}>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.name}
                  </a>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Action Form */}
        {!action ? (
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Space>
              <Button
                type="primary"
                size="large"
                style={{
                  backgroundColor: SUCCESS_GREEN,
                  borderColor: SUCCESS_GREEN,
                }}
                onClick={() => setAction("approve")}
                icon={<CheckCircleOutlined />}
              >
                Approve Extension
              </Button>
              <Button
                danger
                size="large"
                onClick={() => setAction("reject")}
                icon={<CloseCircleOutlined />}
              >
                Reject Extension
              </Button>
            </Space>
          </div>
        ) : (
          <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
            {action === "approve" ? (
              <Form.Item label="Approval Comment (Optional)" name="comment">
                <Input.TextArea
                  placeholder="Add any approval comments here..."
                  rows={4}
                />
              </Form.Item>
            ) : (
              <Form.Item
                label="Rejection Reason"
                name="reason"
                rules={[
                  {
                    required: true,
                    message: "Please provide a rejection reason",
                  },
                ]}
              >
                <Input.TextArea
                  placeholder="Please explain why you're rejecting this extension..."
                  rows={4}
                />
              </Form.Item>
            )}

            <div style={{ textAlign: "right", marginTop: 16 }}>
              <Space>
                <Button onClick={() => setAction(null)}>Back</Button>
                <Button
                  type="primary"
                  danger={action === "reject"}
                  loading={approving || rejecting}
                  onClick={action === "approve" ? handleApprove : handleReject}
                >
                  {action === "approve"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
                </Button>
              </Space>
            </div>
          </Form>
        )}
      </Spin>
    </Modal>
  );
};

export default ExtensionApprovalModal;
