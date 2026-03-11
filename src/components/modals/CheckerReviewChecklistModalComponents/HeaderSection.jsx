import React from "react";
import { Button, Typography, Tag } from "antd";
import {
  CloseOutlined,
  FileTextOutlined,
  RightOutlined,
  LeftOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const HeaderSection = ({
  checklist,
  onClose,
  showDocumentSidebar,
  setShowDocumentSidebar,
  uploadedDocsCount,
}) => {
  return (
    <>
      <style>{`
        .checker-close-button {
          background-color: #164679 !important;
          color: white !important;
          border: none !important;
          padding: 0 !important;
          width: 32px !important;
          height: 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .checker-close-button:hover {
          background-color: #0f2a47 !important;
          color: white !important;
        }
        .checker-close-button:active {
          background-color: #164679 !important;
          color: white !important;
        }
        .checker-close-button .anticon {
          color: white !important;
          font-size: 20px !important;
        }
      `}</style>
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
            <Title
              level={4}
              style={{ color: "white", margin: 0, fontWeight: 600 }}
            >
              Review Checklist
            </Title>
            <div
              style={{
                fontSize: "18px",
                backgroundColor: "#164679 !important",
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
              onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
              style={{
                color: "white",
                background: "#164679",
                border: "1px solid #164679",
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
              className="checker-close-button"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default HeaderSection;
