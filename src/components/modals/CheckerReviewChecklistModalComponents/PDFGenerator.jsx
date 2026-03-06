import React, { useState } from "react";
import { Button, message, Progress, Tooltip } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import usePDFGenerator from "../../../hooks/usePDFGenerator";
import { PRIMARY_BLUE } from "../../../utils/constants";

const PDFGenerator = ({
  checklist,
  docs,
  supportingDocs = [],
  creatorComment = "",
  comments = [],
  style = {},
  buttonText = "Download PDF",
  showProgress = false,
  size = "default",
  variant = "primary", // 'primary', 'secondary', 'text'
}) => {
  const { generatePDF, isGenerating, progress } = usePDFGenerator();
  const [error, setError] = useState(null);

  const handleGeneratePDF = async () => {
    setError(null);

    try {
      if (!checklist) {
        throw new Error("No checklist data available");
      }

      const result = await generatePDF({
        checklist,
        documents: docs || [],
        supportingDocs: supportingDocs || [],
        creatorComment: creatorComment || "",
        comments: comments || [],
        onProgress: (percent) => {
          console.log(`PDF Generation Progress: ${percent}%`);
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to generate PDF");
      }

      message.success({
        content: `PDF downloaded: ${result.fileName}`,
        duration: 3,
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      setError(error.message);
      message.error({
        content: `PDF Generation Failed: ${error.message}`,
        duration: 4,
      });
    }
  };

  // Different button styles based on variant
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: "6px",
      fontWeight: 600,
      ...style,
    };

    switch (variant) {
      case "secondary":
        return {
          ...baseStyle,
          backgroundColor: "white",
          borderColor: PRIMARY_BLUE,
          color: PRIMARY_BLUE,
        };
      case "text":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          borderColor: "transparent",
          color: PRIMARY_BLUE,
          boxShadow: "none",
        };
      case "primary":
      default:
        return {
          ...baseStyle,
          backgroundColor: PRIMARY_BLUE,
          borderColor: PRIMARY_BLUE,
          color: "#FFFFFF",
        };
    }
  };

  const getIcon = () => {
    return isGenerating ? null : <FilePdfOutlined />;
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <Tooltip
        title={
          error ||
          (isGenerating
            ? `Generating PDF... ${progress}%`
            : "Generate PDF report")
        }
        color={error ? "#ff4d4f" : undefined}
      >
        <Button
          icon={getIcon()}
          loading={isGenerating}
          onClick={handleGeneratePDF}
          style={
            variant === "primary"
              ? { borderRadius: "6px", fontWeight: 600, ...style }
              : getButtonStyle()
          }
          size={size}
          disabled={!checklist || isGenerating}
          type={variant === "primary" ? "primary" : "default"}
          className={variant === "primary" ? "checker-modal-action" : ""}
        >
          {buttonText}
        </Button>
      </Tooltip>

      {showProgress && isGenerating && progress > 0 && (
        <div style={{ width: "120px" }}>
          <Progress
            percent={progress}
            size="small"
            status={error ? "exception" : "active"}
            showInfo={false}
          />
          <div
            style={{
              fontSize: "10px",
              color: "#666",
              textAlign: "center",
              marginTop: "2px",
            }}
          >
            {progress}%
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFGenerator;
