// export function getFullUrl(url) {
//   if (!url) return null;
//   // If already absolute or data/blob, return as-is
//   if (/^(https?:)?\/\//i.test(url) || /^data:|^blob:/i.test(url)) return url;
//   // For root-relative URLs like /uploads/..., prefix API base
//   const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
//   if (url.startsWith("/")) return (base ? base : "") + url;
//   return url;
// }

// export function openFileInNewTab(url) {
//   const full = getFullUrl(url);
//   if (!full) return;
//   window.open(full, "_blank");
// }

// export function downloadFile(url, filename) {
//   const full = getFullUrl(url);
//   if (!full) return;
//   const link = document.createElement("a");
//   link.href = full;
//   if (filename) link.download = filename;
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// }
export function getFullUrl(url) {
  if (!url) return null;
  // If already absolute or data/blob, return as-is
  if (/^(https?:)?\/\//i.test(url) || /^data:|^blob:/i.test(url)) return url;
  // For root-relative URLs like /uploads/..., prefix API base
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  if (url.startsWith("/")) return (base ? base : "") + url;
  return url;
}

function dataUrlToBlobUrl(dataUrl) {
  if (!/^data:/i.test(String(dataUrl || ""))) return dataUrl;

  const match = String(dataUrl).match(/^data:([^;,]+)?((?:;[^,]+)*?),(.*)$/i);
  if (!match) return dataUrl;

  const mimeType = match[1] || "application/octet-stream";
  const meta = match[2] || "";
  const payload = match[3] || "";
  const isBase64 = /;base64/i.test(meta);

  let byteString;
  if (isBase64) {
    byteString = atob(payload);
  } else {
    byteString = decodeURIComponent(payload);
  }

  const length = byteString.length;
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = byteString.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

function safeOpenUrl(url) {
  if (!url) return;

  const resolvedUrl = /^data:/i.test(url) ? dataUrlToBlobUrl(url) : url;
  window.open(resolvedUrl, "_blank", "noopener,noreferrer");

  if (resolvedUrl && resolvedUrl !== url && /^blob:/i.test(resolvedUrl)) {
    setTimeout(() => {
      URL.revokeObjectURL(resolvedUrl);
    }, 60000);
  }
}

export function openFileInNewTab(url) {
  const full = getFullUrl(url);
  if (!full) return;
  safeOpenUrl(full);
}

export function downloadFile(url, filename) {
  const full = getFullUrl(url);
  if (!full) return;
  const link = document.createElement("a");
  const resolvedUrl = /^data:/i.test(full) ? dataUrlToBlobUrl(full) : full;
  link.href = resolvedUrl;
  if (filename) link.download = filename;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (resolvedUrl && resolvedUrl !== full && /^blob:/i.test(resolvedUrl)) {
    setTimeout(() => {
      URL.revokeObjectURL(resolvedUrl);
    }, 60000);
  }
}