// Theme Colors
export const PRIMARY_BLUE = "#164679";
export const ACCENT_LIME = "#b5d334";
export const SECONDARY_PURPLE = "#7e6496";
export const API_BASE_URL = import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

// Status Colors Mapping - Consistent across all modals
export const STATUS_COLORS = {
  // GREEN - Success/Approved/Submitted/Sighted
  submitted: { bg: "#f6ffed", color: "#52c41a", tag: "#52c41a" },
  approved: { bg: "#f6ffed", color: "#52c41a", tag: "#52c41a" },
  sighted: { bg: "#f6ffed", color: "#52c41a", tag: "#52c41a" },
  
  // RED - Pending statuses (need action)
  pendingrm: { bg: "#ffebe6", color: "#FF4D4F", tag: "#FF4D4F" },
  pendingco: { bg: "#ffebe6", color: "#FF4D4F", tag: "#FF4D4F" },
  
  // AMBER - Deferred/Waived/TBO (needs attention)
  deferred: { bg: "#fffbe6", color: "#FAAD14", tag: "#FAAD14" },
  deferral_requested: { bg: "#fffbe6", color: "#FAAD14", tag: "#FAAD14" },
  waived: { bg: "#fffbe6", color: "#FAAD14", tag: "#FAAD14" },
  tbo: { bg: "#fffbe6", color: "#FAAD14", tag: "#FAAD14" },
  
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