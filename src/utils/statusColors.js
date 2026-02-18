/**
 * Status Colors Configuration
 * Standardized color scheme for all status indicators across the system
 */

/**
 * Format status text for display - converts snake_case to readable format
 * @param {string} status - Status string (can be snake_case or spaced)
 * @returns {string} - Formatted status text with proper capitalization
 */
export const formatStatusText = (status) => {
  if (!status) return "Unknown";
  
  // Replace underscores with spaces and capitalize each word
  return status
    .replace(/_/g, " ")                    // Replace _ with space
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const STATUS_COLORS = {
  // RED - Pending statuses (action required)
  pendingrm: {
    color: "#FF4D4F",      // Red
    textColor: "#FFF",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  pendingco: {
    color: "#FF4D4F",      // Red
    textColor: "#FFF",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  pending_rm: {
    color: "#FF4D4F",      // Red
    textColor: "#FFF",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  pending_co: {
    color: "#FF4D4F",      // Red
    textColor: "#FFF",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  "pending from rm": {
    color: "#FF4D4F",      // Red
    textColor: "#FFF",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  "pending from co": {
    color: "#FF4D4F",      // Red
    textColor: "#FFF",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },

  // AMBER - Deferred/Waived statuses (pending attention)
  deferred: {
    color: "#FAAD14",      // Amber
    textColor: "#FFF",
    bgColor: "#FFFBE6",
    borderColor: "#FAAD14",
  },
  tbo: {
    color: "#FAAD14",      // Amber (To Be Obtained)
    textColor: "#FFF",
    bgColor: "#FFFBE6",
    borderColor: "#FAAD14",
  },
  waived: {
    color: "#FAAD14",      // Amber
    textColor: "#FFF",
    bgColor: "#FFFBE6",
    borderColor: "#FAAD14",
  },

  // GREEN - Completed/Approved statuses (success)
  sighted: {
    color: "#52C41A",      // Green
    textColor: "#FFF",
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
  },
  submitted: {
    color: "#52C41A",      // Green
    textColor: "#FFF",
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
  },
  approved: {
    color: "#52C41A",      // Green
    textColor: "#FFF",
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
  },
  "submitted for review": {
    color: "#52C41A",      // Green
    textColor: "#FFF",
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
  },
  submitted_for_review: {
    color: "#52C41A",      // Green
    textColor: "#FFF",
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
  },
  "pending from customer": {
    color: "#FF4D4F",      // Red
    textColor: "#FFF",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  pending_from_customer: {
    color: "#FF4D4F",      // Red
    textColor: "#FFF",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  "deferral requested": {
    color: "#FAAD14",      // Amber
    textColor: "#FFF",
    bgColor: "#FFFBE6",
    borderColor: "#FAAD14",
  },
  deferral_requested: {
    color: "#FAAD14",      // Amber
    textColor: "#FFF",
    bgColor: "#FFFBE6",
    borderColor: "#FAAD14",
  },
  defferal_requested: {
    color: "#FAAD14",      // Amber (typo variant)
    textColor: "#FFF",
    bgColor: "#FFFBE6",
    borderColor: "#FAAD14",
  },
  completed: {
    color: "#52C41A",      // Green
    textColor: "#FFF",
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
  },
  sighted_and_approved: {
    color: "#52C41A",      // Green
    textColor: "#FFF",
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
  },

  // Default fallback
  default: {
    color: "#D9D9D9",      // Gray
    textColor: "#595959",
    bgColor: "#FAFAFA",
    borderColor: "#D9D9D9",
  },
};

/**
 * Get status color configuration
 * @param {string} status - The status value (case-insensitive)
 * @returns {object} Color configuration object
 */
export const getStatusColor = (status) => {
  if (!status) return STATUS_COLORS.default;
  
  const normalizedStatus = String(status).toLowerCase().trim();
  
  // Exact match first
  if (STATUS_COLORS[normalizedStatus]) {
    return STATUS_COLORS[normalizedStatus];
  }

  // Partial match for common variations
  if (normalizedStatus.includes("sighted")) return STATUS_COLORS.sighted;
  if (normalizedStatus.includes("tbo")) return STATUS_COLORS.tbo;
  if (normalizedStatus.includes("waived")) return STATUS_COLORS.waived;
  if (normalizedStatus.includes("pending") && normalizedStatus.includes("rm")) return STATUS_COLORS.pendingrm;
  if (normalizedStatus.includes("pending") && normalizedStatus.includes("co")) return STATUS_COLORS.pendingco;
  if (normalizedStatus.includes("deferred")) return STATUS_COLORS.deferred;
  if (normalizedStatus.includes("submitted")) return STATUS_COLORS.submitted;
  if (normalizedStatus.includes("approved")) return STATUS_COLORS.approved;
  if (normalizedStatus.includes("completed")) return STATUS_COLORS.completed;

  return STATUS_COLORS.default;
};

/**
 * Get HTML color code for a status (for PDF and display)
 * @param {string} status - The status value
 * @returns {Array} RGB array [r, g, b] for jsPDF
 */
export const getStatusColorRGB = (status) => {
  const colorHex = getStatusColor(status).color;
  return hexToRGB(colorHex);
};

/**
 * Convert hex color to RGB array
 * @param {string} hex - Hex color (e.g., "#FF6B6B")
 * @returns {Array} RGB array [r, g, b]
 */
export const hexToRGB = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [217, 217, 217]; // Default gray if parsing fails
};

/**
 * Get inline style object for a status
 * @param {string} status - The status value
 * @returns {object} React style object
 */
export const getStatusStyle = (status) => {
  const colorConfig = getStatusColor(status);
  return {
    color: colorConfig.textColor,
    backgroundColor: colorConfig.bgColor,
    borderColor: colorConfig.borderColor,
    border: `1px solid ${colorConfig.borderColor}`,
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-block",
    fontWeight: "500",
  };
};

/**
 * Get Ant Design Tag props for a status
 * @param {string} status - The status value
 * @returns {object} Tag component props
 */
export const getStatusTagProps = (status) => {
  const colorConfig = getStatusColor(status);
  return {
    color: colorConfig.color,
    style: {
      borderColor: colorConfig.borderColor,
    },
  };
};

export default STATUS_COLORS;
