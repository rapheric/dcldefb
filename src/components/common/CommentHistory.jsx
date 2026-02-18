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
      return <Tag color="green">CO CHECKER</Tag>;
    case "cocreator":
      return <Tag color="purple">CO CREATOR</Tag>;
    default:
      return <Tag>{role || "UNKNOWN"}</Tag>;
  }
};

/* ---------------------------
   System message detector
   (COMPREHENSIVE - removes ALL auto-generated messages)
---------------------------- */
const isSystemGeneratedMessage = (text = "") => {
  if (!text) return true;
  
  const message = text.toLowerCase().trim();

  // EXTENSIVE list of system-generated message patterns
  const systemPatterns = [
    // Status transitions & workflow
    "submitted to",
    "returned to",
    "approved by",
    "rejected by",
    "completed",
    "status updated",
    "initiated",
    "submitted for",
    "sent to",
    "assigned to",
    
    // Auto-activity logs
    "document uploaded",
    "checklist created",
    "draft saved",
    "revived from",
    
    // Co-Creator workflow messages
    "submitted to co-checker",
    "submitted to co",
    "submitted to rm",
    "checklist updated",
    "documents updated",
    
    // RM workflow messages
    "submitted back to co-creator",
    "returned to co-creator",
    
    // Checker workflow messages
    "sent for approval",
    "approved checklist",
    "rejected checklist",
    
    // Supporting docs
    "supporting document",
    "document reference",
    "file uploaded",
    
    // Status change patterns
    "status changed",
    "status: ",
    "checklist status",
    "has been",
    "document",
  ];

  // If message matches any system pattern, it's auto-generated
  return systemPatterns.some((pattern) => message.includes(pattern));
};

/* ---------------------------
   Component
---------------------------- */
const CommentHistory = ({ comments = [], isLoading }) => {
  // Debug logging
  React.useEffect(() => {
    console.log("📝 CommentHistory - Raw comments received:", comments);
    console.log("📝 CommentHistory - Is Loading:", isLoading);
    if (comments && comments.length > 0) {
      comments.forEach((c, idx) => {
        console.log(`   [${idx}] Message: "${c.message || c.comment}" | Role: ${c.userId?.role || c.role} | ID: ${c._id || c.id}`);
      });
    }
  }, [comments, isLoading]);

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
    const isSystem = isSystemGeneratedMessage(message);
    const isEmpty = !message.trim();

    // Debug each comment
    if (!isSystem && !isEmpty && role !== "system") {
      console.log(`   ✅ KEEPING: "${message.substring(0, 50)}..." (${role})`);
    } else if (isSystem) {
      console.log(`   ❌ FILTERING (SYSTEM): "${message.substring(0, 50)}..."`);
    } else if (isEmpty) {
      console.log(`   ❌ FILTERING (EMPTY)`);
    } else if (role === "system") {
      console.log(`   ❌ FILTERING (SYSTEM ROLE)`);
    }

    // 1. Remove system role completely
    if (role === "system") return false;

    // 2. Remove auto-generated workflow/status messages
    if (isSystem) return false;

    // 3. Remove empty / whitespace-only comments
    if (isEmpty) return false;

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
