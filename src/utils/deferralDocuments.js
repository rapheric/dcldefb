const getFileExtension = (name) => {
  const fileName = String(name || "").trim();
  if (!fileName || !fileName.includes(".")) return "";
  return fileName.split(".").pop().toLowerCase();
};

const getDocumentSectionFromUrl = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return null;

  const marker = "#docSection=";
  const markerIndex = raw.toLowerCase().lastIndexOf(marker.toLowerCase());
  if (markerIndex < 0) return null;

  const sectionPart = raw
    .substring(markerIndex + marker.length)
    .split("#")[0]
    .trim()
    .toLowerCase();

  if (sectionPart === "dcl" || sectionPart === "additional") {
    return sectionPart;
  }

  return null;
};

const stripDocumentSectionMarker = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return url;

  const marker = "#docSection=";
  const markerIndex = raw.toLowerCase().lastIndexOf(marker.toLowerCase());
  if (markerIndex < 0) return url;

  return raw.substring(0, markerIndex);
};

const hasDclPrefix = (name) => /^\s*dcl(?:[\s_-]|$)/i.test(String(name || "").trim());

const includesDclNumber = (name, dclNo) => {
  const normalizedName = String(name || "").trim().toLowerCase();
  const normalizedDclNo = String(dclNo || "").trim().toLowerCase();
  if (!normalizedName || !normalizedDclNo) return false;
  return normalizedName.includes(normalizedDclNo);
};

const toEpoch = (value) => {
  const epoch = new Date(value || 0).getTime();
  return Number.isFinite(epoch) ? epoch : 0;
};

const pickPrimaryDclDocument = (documents, dclNo) => {
  if (!Array.isArray(documents) || documents.length === 0) return null;

  const ranked = [...documents].sort((left, right) => {
    const leftName = String(left?.name || "");
    const rightName = String(right?.name || "");

    const leftDclMatch = includesDclNumber(leftName, dclNo) ? 1 : 0;
    const rightDclMatch = includesDclNumber(rightName, dclNo) ? 1 : 0;
    if (leftDclMatch !== rightDclMatch) return rightDclMatch - leftDclMatch;

    const leftPrefixMatch = hasDclPrefix(leftName) ? 1 : 0;
    const rightPrefixMatch = hasDclPrefix(rightName) ? 1 : 0;
    if (leftPrefixMatch !== rightPrefixMatch) return rightPrefixMatch - leftPrefixMatch;

    return toEpoch(right?.uploadDate) - toEpoch(left?.uploadDate);
  });

  return ranked[0] || null;
};

export const getDeferralDocumentBuckets = (deferral) => {
  if (!deferral) {
    return { allDocs: [], dclDocs: [], uploadedDocs: [], requestedDocs: [] };
  }

  const allDocs = [];

  (deferral.attachments || []).forEach((attachment, index) => {
    const sectionFromUrl = getDocumentSectionFromUrl(attachment.url);
    const isDCL =
      attachment.isDCL === true ||
      sectionFromUrl === "dcl" ||
      hasDclPrefix(attachment.name) ||
      includesDclNumber(attachment.name, deferral.dclNo || deferral.dclNumber);

    allDocs.push({
      id: attachment.id || `att_${index}`,
      name: attachment.name,
      type: getFileExtension(attachment.name || ""),
      url: attachment.url,
      isDCL,
      isAdditional: attachment.isAdditional === true || sectionFromUrl === "additional" || !isDCL,
      isUploaded: true,
      source: "attachments",
      uploadDate: attachment.uploadDate,
    });
  });

  const additionalFileSources = [
    ...(deferral.additionalFiles || []),
    ...(deferral.additionalDocuments || []),
  ];

  additionalFileSources.forEach((file, index) => {
    allDocs.push({
      id: `add_${index}`,
      name: file.name,
      type: getFileExtension(file.name || ""),
      url: file.url,
      isAdditional: true,
      isUploaded: true,
      source: "additionalFiles",
    });
  });

  (deferral.selectedDocuments || []).forEach((document, index) => {
    allDocs.push({
      id: `req_${index}`,
      name:
        typeof document === "string"
          ? document
          : document.name || document.label || "Document",
      type: document.type || "",
      documentType:
        typeof document === "object"
          ? document.documentType || document.type || document.docType || ""
          : "",
      category:
        typeof document === "object"
          ? document.category || document.documentCategory || document.classification || ""
          : "",
      allowability:
        typeof document === "object"
          ? document.allowability || document.allowableType || ""
          : "",
      isRequested: true,
      isSelected: true,
      source: "selected",
    });
  });

  (deferral.documents || []).forEach((document, index) => {
    const name = (document.name || "").toString();
    const sectionFromUrl = getDocumentSectionFromUrl(document.url);
    const dclNameMatch =
      hasDclPrefix(name) ||
      includesDclNumber(name, deferral.dclNo || deferral.dclNumber);

    const isDCLFlag =
      (typeof document.isDCL !== "undefined" && document.isDCL) ||
      sectionFromUrl === "dcl" ||
      dclNameMatch;

    const isAdditionalFlag =
      typeof document.isAdditional !== "undefined"
        ? document.isAdditional
        : sectionFromUrl === "additional" || !isDCLFlag;

    const cleanUrl = stripDocumentSectionMarker(document.url);
    const hasUrl = !!String(cleanUrl || "").trim();
    const isUploadedFlag = hasUrl;
    const isRequestedFromPersistedSelection = !hasUrl && !isDCLFlag;

    allDocs.push({
      id: document._id || document.id || `doc_${index}`,
      name: document.name,
      type: document.type || getFileExtension(document.name || ""),
      documentType: document.documentType || document.type || "",
      category: document.category || document.documentCategory || document.classification || "",
      allowability: document.allowability || document.allowableType || "",
      url: cleanUrl,
      isDocument: true,
      isUploaded: isUploadedFlag,
      isRequested: isRequestedFromPersistedSelection,
      isSelected: isRequestedFromPersistedSelection,
      source: "documents",
      isDCL: !!isDCLFlag,
      isAdditional: !!isAdditionalFlag,
      uploadDate: document.uploadDate || document.uploadedAt || null,
      size: document.size || null,
    });
  });

  const uploadedDocuments = allDocs.filter((document) => document.isUploaded);
  const dclCandidates = uploadedDocuments.filter((document) => document.isDCL);
  const primaryDcl = pickPrimaryDclDocument(dclCandidates, deferral.dclNo || deferral.dclNumber);

  const dclDocs = primaryDcl ? [primaryDcl] : [];
  const uploadedDocs = uploadedDocuments
    .filter((document) => !primaryDcl || document.id !== primaryDcl.id)
    .map((document) => (document.isDCL ? { ...document, isDCL: false, isAdditional: true } : document));

  const requestedDocs = allDocs.filter((document) => document.isRequested || document.isSelected);

  return { allDocs, dclDocs, uploadedDocs, requestedDocs };
};