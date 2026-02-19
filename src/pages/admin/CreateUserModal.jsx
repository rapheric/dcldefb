import React, { useMemo } from "react";
import { Modal, Input, Select, Form, Button } from "antd";
import { UserOutlined } from "@ant-design/icons";

const roleOptions = [
  { value: "rm", label: "Relationship Manager" },
  { value: "approver", label: "Approver" },
  { value: "cocreator", label: "CO Creator" },
  { value: "customer", label: "Customer" },
  { value: "cochecker", label: "CO Checker" },
  { value: "admin", label: "Admin" },
];

const CreateUserModal = ({
  visible,
  loading,
  formData,
  setFormData,
  onCreate,
  onClose,
}) => {
  const roles = useMemo(() => roleOptions, []);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose={false}
      width={550}
      className="dark:bg-gray-900"
      styles={{
        body: { padding: "0", background: "#f5f7fa" },
        content: { padding: 0 },
      }}
      title={null}
    >
      {/* GRADIENT HEADER */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
          padding: "24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.25)",
            padding: "10px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UserOutlined style={{ color: "white", fontSize: 24 }} />
        </div>
        <h2
          style={{
            color: "white",
            margin: 0,
            fontSize: "18px",
            fontWeight: "600",
            letterSpacing: "0.3px",
          }}
        >
          Create New User
        </h2>
      </div>

      {/* FORM CONTENT */}
      <div style={{ padding: "24px", background: "#f5f7fa" }}>
        <Form
          layout="vertical"
          onFinish={onCreate}
          className="space-y-3"
        >
          {/* NAME */}
          <Form.Item
            label={
              <span style={{ fontWeight: "600", color: "#1f2937", fontSize: "14px" }}>
                👤 Name
              </span>
            }
            name="name"
            rules={[{ required: true, message: 'Please enter name' }]}
            className="mb-4"
          >
            <Input
              size="large"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter full name"
              style={{
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
              }}
            />
          </Form.Item>

          {/* EMAIL */}
          <Form.Item
            label={
              <span style={{ fontWeight: "600", color: "#1f2937", fontSize: "14px" }}>
                ✉️ Email
              </span>
            }
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
            className="mb-4"
          >
            <Input
              type="email"
              size="large"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="user@example.com"
              style={{
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
              }}
            />
          </Form.Item>

          {/* CUSTOMER NUMBER (for customer role) */}
          {formData.role === "customer" && (
            <Form.Item
              label={
                <span style={{ fontWeight: "600", color: "#1f2937", fontSize: "14px" }}>
                  🆔 Customer Number
                </span>
              }
              className="mb-4"
            >
              <Input
                size="large"
                value={formData.customerNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, customerNumber: e.target.value })
                }
                placeholder="e.g. CUST-123456"
                style={{
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                }}
              />
            </Form.Item>
          )}

          {/* PASSWORD */}
          <Form.Item
            label={
              <span style={{ fontWeight: "600", color: "#1f2937", fontSize: "14px" }}>
                🔒 Password
              </span>
            }
            name="password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 8, message: 'Password must be at least 8 characters' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message: 'Password must include uppercase, lowercase, number & special character (@$!%*?&)'
              }
            ]}
            className="mb-4"
            extra={
              <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special (@$!%*?&)
              </span>
            }
          >
            <Input.Password
              size="large"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="e.g. MyPass123!"
              style={{
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
              }}
            />
          </Form.Item>

          {/* ROLE */}
          <Form.Item
            label={
              <span style={{ fontWeight: "600", color: "#1f2937", fontSize: "14px" }}>
                👨‍💼 Role
              </span>
            }
            className="mb-4"
          >
            <Select
              size="large"
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value })}
              options={roles}
              placeholder="Select a role"
              popupMatchSelectWidth={280}
              style={{ borderRadius: "8px" }}
            />
          </Form.Item>

          {/* POSITION (only for approvers) */}
          {formData.role === "approver" && (
            <Form.Item
              label={
                <span style={{ fontWeight: "600", color: "#1f2937", fontSize: "14px" }}>
                  🏢 Position / Title
                </span>
              }
              className="mb-4"
            >
              <Input
                size="large"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                placeholder="e.g. Head of Business Segment"
                style={{
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                }}
              />
            </Form.Item>
          )}

          {/* BUTTON */}
          <Button
            htmlType="submit"
            type="primary"
            block
            loading={loading}
            style={{
              height: "42px",
              fontSize: "15px",
              fontWeight: "600",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
              marginTop: "8px",
            }}
          >
            Create User
          </Button>
        </Form>
      </div>
    </Modal>
  );
};

export default CreateUserModal;