// export default CommentHistory;
import React from "react";
import { Avatar, Tag, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";

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

  if (filteredComments.length === 0) {
    return (
      <div style={{ padding: 8, fontSize: 12, color: "#9ca3af" }}>
        No user comments yet.
      </div>
    );
  }

  return (
    <div
      style={{
        maxHeight: "220px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "6px 4px",
      }}
    >
      {filteredComments.map((item, index) => (
        <div
          key={item._id || index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "#374151",
            padding: "6px 8px",
            borderRadius: "6px",
            background: "#f9fafb",
          }}
        >
          {/* Avatar */}
          <Avatar
            size={18}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#164679", flexShrink: 0 }}
          />

          {/* Name */}
          <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
            {item.userId?.name || item.user}
          </span>

          {/* Role */}
          {getRoleTag(item.userId?.role || item.role)}

          {/* Comment */}
          <span
            style={{
              color: "#4b5563",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
            title={item.message || item.comment}
          >
            {item.message || item.comment}
          </span>

          {/* Time */}
          <span style={{ fontSize: "10px", color: "#9ca3af", flexShrink: 0 }}>
            {new Date(item.createdAt || item.timestamp).toLocaleString([], {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CommentHistory;
