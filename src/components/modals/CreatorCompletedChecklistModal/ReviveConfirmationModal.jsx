import React from "react";
import { Modal, Button, Typography } from "antd";
import { RedoOutlined } from "@ant-design/icons";
// import { REVIVE_MODAL_CONTENT } from "../CreatorCompletedChecklistModalComponent/constants";
import { buttonStyles } from "../../styles/componentStyle";
import { REVIVE_MODAL_CONTENT } from "./constants";

const { Text } = Typography;

// Define reviveModalStyles locally if not imported
const reviveModalStyles = {
  container: {
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    padding: "16px",
    marginTop: "16px",
  },
  title: {
    fontSize: "15px",
    color: "#1890ff",
    marginBottom: "8px",
    display: "block",
  },
  list: {
    margin: "0 0 12px 16px",
    padding: 0,
    fontSize: "13px",
    lineHeight: "1.6",
    color: "#333",
  },
  tip: {
    fontSize: "12px",
    fontStyle: "italic",
    color: "#666",
    padding: "8px",
    backgroundColor: "#fff9e6",
    borderRadius: "4px",
    borderLeft: "3px solid #faad14",
  },
};

const ReviveConfirmationModal = ({ open, onCancel, onConfirm, loading }) => {
  React.useEffect(() => {
    console.log("🎯 [ReviveConfirmationModal] Modal state changed");
    console.log("   open:", open);
    console.log("   loading:", loading);
    console.log("   onConfirm exists:", !!onConfirm);
    console.log("   onCancel exists:", !!onCancel);
  }, [open, loading, onConfirm, onCancel]);

  const handleConfirmClick = () => {
    console.log("✅ [ReviveConfirmationModal] Confirm button clicked!");
    console.log("   Calling onConfirm...");
    onConfirm?.();
  };

  const handleCancelClick = () => {
    console.log("🚫 [ReviveConfirmationModal] Cancel button clicked");
    onCancel?.();
  };

  return (
    <Modal
      title={REVIVE_MODAL_CONTENT.TITLE}
      open={open}
      onCancel={handleCancelClick}
      centered
      footer={[
        <Button key="cancel" onClick={handleCancelClick}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={loading}
          onClick={handleConfirmClick}
          icon={<RedoOutlined />}
          style={buttonStyles.confirmRevive}
        >
          Revive Checklist
        </Button>,
      ]}
    >
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
          {REVIVE_MODAL_CONTENT.DESCRIPTION}
        </p>
        <div style={reviveModalStyles.container}>
          <Text strong style={reviveModalStyles.title}>
            ✨ This action will:
          </Text>
          <ul style={reviveModalStyles.list}>
            {REVIVE_MODAL_CONTENT.BENEFITS.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
          <Text type="secondary" style={reviveModalStyles.tip}>
            {REVIVE_MODAL_CONTENT.TIP}
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default ReviveConfirmationModal;
