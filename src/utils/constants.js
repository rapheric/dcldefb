// Theme Colors
export const PRIMARY_BLUE = "#164679";
export const ACCENT_LIME = "#b5d334";
export const SECONDARY_PURPLE = "#7e6496";
export const API_BASE_URL = import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

// Status Colors Mapping - Consistent across all modals
export const STATUS_COLORS = {
  // Submitted = Green (same as Approved)
  submitted: { bg: "#f6ffed", color: "#52c41a", tag: "#52c41a" },
  
  // Pending statuses
  pendingrm: { bg: "#fff7e6", color: "#faad14", tag: "#faad14" },
  pendingco: { bg: "#fff7e6", color: "#faad14", tag: "#faad14" },
  
  // Deferral statuses = Volcano/Orange
  deferred: { bg: "#fff2e8", color: "#fa541c", tag: "#fa541c" },
  deferral_requested: { bg: "#fff2e8", color: "#fa541c", tag: "#fa541c" },
  
  // Document review statuses
  waived: { bg: "#f9f0ff", color: "#722ed1", tag: "#722ed1" },
  sighted: { bg: "#e6f7ff", color: "#1890ff", tag: "#1890ff" },
  tbo: { bg: "#fff7e6", color: "#faad14", tag: "#faad14" },
  
  // Default
  default: { bg: "#fafafa", color: "#d9d9d9", tag: "default" }
};

// Allowed Document Actions
export const ALLOWED_DOC_ACTIONS = [
  "submitted_for_review",
  "sighted",
  "waived",
  "deferred",
  "tbo",
  "approved",
  "submitted",
];

// API Endpoints
export const API_ENDPOINTS = {
  UPLOADS: "/api/uploads",
  CHECKLIST_COMMENTS: "/api/checklist/comments",
};