import React from "react";
import { Button, Typography, Tag } from "antd";
import { CloseOutlined, FileTextOutlined, RightOutlined, LeftOutlined } from "@ant-design/icons";

const { Title } = Typography;

const HeaderSection = ({
  checklist,
  onClose,
  showDocumentSidebar,
  setShowDocumentSidebar,
  uploadedDocsCount,
}) => {
  return (
    <div
      className="modal-header"
      style={{
        background: "#164679",
        color: "white",
        padding: "16px 20px",
        borderBottom: "2px solid #b5d334",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FileTextOutlined style={{ fontSize: "20px", color: "white" }} />
          <Title
            level={4}
            style={{ color: "white", margin: 0, fontWeight: 600 }}
          >
            Review Checklist
          </Title>
          <div
            style={{
              fontSize: "12px",
              backgroundColor: "rgba(255,255,255,0.2)",
              padding: "2px 8px",
              borderRadius: "12px",
              fontWeight: 500,
            }}
          >
            DCL: {checklist?.dclNo || "N/A"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
            onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
            style={{
              color: "white",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              fontSize: "12px",
              height: "32px",
              display: "flex",
              alignItems: "center",
            }}
          >
            View Documents
            {uploadedDocsCount > 0 && (
              <Tag color="green" style={{ marginLeft: 6, fontSize: "10px" }}>
                {uploadedDocsCount}
              </Tag>
            )}
          </Button>
          <Button
            className="close-button"
            icon={<CloseOutlined />}
            onClick={onClose}
            style={{
              color: "white !important",
              background: "transparent !important",
              border: "none !important",
              fontSize: "20px !important",
              padding: "0 !important",
              width: "32px !important",
              height: "32px !important",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default HeaderSection;
