// export default CommentHistory;
import React from "react";
import { Avatar, Tag, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { formatDateTime } from "../../utils/checklistUtils";

/* ---------------------------
   Role badge helper
---------------------------- */
const getRoleTag = (role) => {
  switch ((role || "").toLowerCase()) {
    case "rm":
      return <Tag color="blue">RM</Tag>;
    case "cochecker":
      return <Tag color="green">CO</Tag>;
    case "cocreator":
      return <Tag color="purple">CREATOR</Tag>;
    default:
      return <Tag>{role || "UNKNOWN"}</Tag>;
  }
};

/* ---------------------------
   System message detector
   (status & workflow text)
---------------------------- */
const isSystemGeneratedMessage = (text = "") => {
  const message = text.toLowerCase();

  const systemPatterns = [
    // workflow / status transitions
    "checklist submitted",
    "submitted back",
    "submitted to",
    "returned to",
    "approved",
    "rejected",
    "completed",
    "initiated",
    "status updated",

    // auto activity
    "document uploaded",
    "checklist created",
    "draft saved",
  ];

  return systemPatterns.some((pattern) => message.includes(pattern));
};

/* ---------------------------
   Component
---------------------------- */
const CommentHistory = ({ comments = [], isLoading }) => {
  if (isLoading) {
    return (
      <div style={{ padding: 12, display: "flex", justifyContent: "center" }}>
        <Spin size="small" />
      </div>
    );
  }

  /* ---------------------------
     FINAL FILTER LOGIC
     Only REAL human comments survive
  ---------------------------- */
  const filteredComments = comments.filter((item) => {
    const role = (item.userId?.role || item.role || "").toLowerCase();
    const message = item.message || item.comment || "";

    // 1. Remove system role completely
    if (role === "system") return false;

    // 2. Remove auto-generated workflow/status messages
    if (isSystemGeneratedMessage(message)) return false;

    // 3. Remove empty / whitespace-only comments
    if (!message.trim()) return false;

    return true;
  });

  /* ---------------------------
     SORT COMMENTS BY TIMESTAMP
     Newest first (descending order)
  ---------------------------- */
  const sortedComments = [...filteredComments].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
    const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
    return timeB - timeA; // Newest first
  });

  if (sortedComments.length === 0) {
    return (
      <div style={{ padding: 8, fontSize: 12, color: "#9ca3af" }}>
        No user comments yet.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: 4,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#1f2937",
          padding: 4,
        }}
      >
        Comment Trail ({sortedComments.length})
      </div>

      {/* Comments */}
      {sortedComments.map((item, index) => (
        <div
          key={item._id || index}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            fontSize: "12px",
            color: "#374151",
            padding: 6,
            borderRadius: "4px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Avatar */}
          <Avatar
            size={20}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#164679", flexShrink: 0 }}
          />

          {/* Name */}
          <span style={{ fontWeight: 600, flexShrink: 0 }}>
            {item.userId?.name ||
              (typeof item.user === "object" ? item.user?.name : item.user) ||
              "Unknown"}
          </span>

          {/* Role */}
          <div style={{ flexShrink: 0 }}>
            {getRoleTag(item.userId?.role || item.role)}
          </div>

          {/* Comment Text */}
          <div
            style={{
              color: "#4b5563",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 100,
              maxWidth: 300,
            }}
            title={item.message || item.comment}
          >
            {item.message || item.comment}
          </div>

          {/* Time */}
          <span
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              flexShrink: 0,
              marginLeft: "auto",
            }}
          >
            {formatDateTime(item.createdAt || item.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CommentHistory;
