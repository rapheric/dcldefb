import React from "react";
import { Tag, Tooltip } from "antd";

const truncateLabel = (value, maxChars) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length <= maxChars) return raw;
  return `${raw.slice(0, Math.max(maxChars - 2, 1))}..`;
};

const UniformTag = ({
  text,
  color = "default",
  icon,
  maxChars = 16,
  maxWidth = 116,
  style = {},
  uppercase = false,
}) => {
  const rawText = String(text || "").trim();
  const displayText = truncateLabel(rawText, maxChars);
  const isTruncated = displayText !== rawText;

  const tagNode = (
    <Tag
      color={color}
      icon={icon}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 24,
        minHeight: 24,
        lineHeight: "22px",
        padding: "0 8px",
        borderRadius: 6,
        fontSize: isTruncated ? 10 : 11,
        fontWeight: 600,
        maxWidth,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        textTransform: uppercase ? "uppercase" : "none",
        ...style,
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {displayText}
      </span>
    </Tag>
  );

  if (isTruncated) {
    return <Tooltip title={rawText}>{tagNode}</Tooltip>;
  }

  return tagNode;
};

export default UniformTag;