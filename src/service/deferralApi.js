const rawApiUrl = String(import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/^['"]|['"]$/g, "");

const normalizedApiUrl = (() => {
  if (!rawApiUrl) return "http://localhost:5000";
  if (/^https?:\/\//i.test(rawApiUrl)) return rawApiUrl;
  if (rawApiUrl.startsWith(":")) return `http://localhost${rawApiUrl}`;
  return `http://${rawApiUrl}`;
})();

const API_BASE = `${normalizedApiUrl.replace(/\/+$/, "")}/api/deferrals`;

function normalizeStatus(status) {
  const raw = String(status || "").trim();
  if (!raw) return raw;
  const key = raw.replace(/[\s_-]/g, "").toLowerCase();
  const map = {
    pending: "pending_approval",
    inreview: "in_review",
    approved: "approved",
    partiallyapproved: "partially_approved",
    rejected: "rejected",
    returnedforrework: "returned_for_rework",
    closerequested: "close_requested",
    closerequestedcreatorapproved: "close_requested_creator_approved",
    closed: "closed",
  };
  return map[key] || raw.toLowerCase();
}

function isApproverMarkedApproved(approver) {
  if (!approver || typeof approver !== "object") return false;
  if (approver.approved === true) return true;

  const status = String(
    approver.status || approver.approvalStatus || approver.state || "",
  )
    .trim()
    .toLowerCase();

  return status === "approved";
}

function computeAllApproversApproved(deferral, normalizedApproverFlow, normalizedApprovers) {
  if (typeof deferral?.allApproversApproved === "boolean") {
    return deferral.allApproversApproved;
  }

  const approvalEntries = Array.isArray(normalizedApproverFlow) && normalizedApproverFlow.length > 0
    ? normalizedApproverFlow
    : Array.isArray(normalizedApprovers) && normalizedApprovers.length > 0
      ? normalizedApprovers
      : Array.isArray(deferral?.approvals)
        ? deferral.approvals
        : [];

  if (!approvalEntries.length) return false;
  return approvalEntries.every(isApproverMarkedApproved);
}

function deriveWorkflowStatus(deferral, normalizedStatus, allApproversApproved) {
  const creatorStatus = String(deferral?.creatorApprovalStatus || "").toLowerCase();
  const checkerStatus = String(deferral?.checkerApprovalStatus || "").toLowerCase();
  const deferralApprovalStatus = String(deferral?.deferralApprovalStatus || "").toLowerCase();

  const hasCreatorApproved = creatorStatus === "approved";
  const hasCheckerApproved = checkerStatus === "approved";
  const isFullyApproved = deferralApprovalStatus === "approved" || (hasCreatorApproved && hasCheckerApproved);

  if (isFullyApproved) {
    return normalizedStatus;
  }

  const terminalStatuses = new Set([
    "approved",
    "deferral_approved",
    "rejected",
    "deferral_rejected",
    "returned_for_rework",
    "returned_by_creator",
    "returned_by_checker",
    "closed",
    "deferral_closed",
    "closed_by_co",
    "closed_by_creator",
    "close_requested",
    "close_requested_creator_approved",
  ]);

  if (allApproversApproved && !terminalStatuses.has(normalizedStatus)) {
    return "partially_approved";
  }

  return normalizedStatus;
}

function getApproverIdentityKey(approver) {
  if (!approver) return "";
  if (typeof approver === "string") return approver.toLowerCase();
  const raw =
    approver?.userId?._id ||
    approver?.userId?.id ||
    approver?.userId ||
    approver?.user?._id ||
    approver?.user?.id ||
    approver?._id ||
    approver?.id ||
    approver?.email ||
    approver?.user?.email ||
    approver?.name ||
    approver?.user?.name ||
    "";
  return String(raw).toLowerCase();
}

function orderApprovers(approvers) {
  if (!Array.isArray(approvers)) return approvers;

  const guidRegex = /^([0-9a-fA-F]{8})-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  const getOrderValue = (approver, fallbackIndex) => {
    const explicitOrder =
      approver?.approvalOrder ??
      approver?.order ??
      approver?.orderIndex ??
      approver?.sequence ??
      approver?.flowIndex;

    const explicitNumber = Number(explicitOrder);
    if (Number.isFinite(explicitNumber)) {
      return explicitNumber;
    }

    const rawId = approver?._id || approver?.id || "";
    const match = String(rawId).match(guidRegex);
    if (match) {
      return parseInt(match[1], 16);
    }

    return fallbackIndex;
  };

  return approvers
    .map((approver, originalIndex) => ({ approver, originalIndex }))
    .sort((a, b) => {
      const orderA = getOrderValue(a.approver, a.originalIndex);
      const orderB = getOrderValue(b.approver, b.originalIndex);
      if (orderA !== orderB) return orderA - orderB;
      return a.originalIndex - b.originalIndex;
    })
    .map(({ approver }) => approver);
}

function normalizeApproverEntry(approver) {
  const userObj = approver?.user && typeof approver.user === "object"
    ? { ...approver.user, _id: approver.user._id || approver.user.id, id: approver.user.id || approver.user._id }
    : approver?.user;
  return {
    ...approver,
    _id: approver?._id || approver?.id,
    id: approver?.id || approver?._id,
    userId:
      approver?.userId?._id ||
      approver?.userId?.id ||
      approver?.userId ||
      approver?.user?._id ||
      approver?.user?.id ||
      approver?.user ||
      null,
    user: userObj,
    approved: isApproverMarkedApproved(approver) === true,
  };
}

function normalizeDeferralRecord(deferral) {
  if (!deferral || typeof deferral !== "object") return deferral;

  const normalizedId = deferral._id || deferral.id || null;
  const normalizedApprovers = Array.isArray(deferral.approvers)
    ? orderApprovers(
        deferral.approvers.map((approver) => normalizeApproverEntry(approver)),
      )
    : deferral.approvers;

  const normalizedApproverFlow = Array.isArray(deferral.approverFlow)
    ? orderApprovers(
        deferral.approverFlow.map((approver) => normalizeApproverEntry(approver)),
      )
    : normalizedApprovers;

  const normalizedStatus = normalizeStatus(deferral.status);
  const allApproversApproved = computeAllApproversApproved(
    deferral,
    normalizedApproverFlow,
    normalizedApprovers,
  );
  const derivedStatus = deriveWorkflowStatus(deferral, normalizedStatus, allApproversApproved);

  return {
    ...deferral,
    _id: normalizedId,
    id: normalizedId,
    status: derivedStatus,
    allApproversApproved,
    approvers: normalizedApprovers,
    approverFlow: normalizedApproverFlow,
  };
}

function normalizeDeferralList(payload) {
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeDeferralRecord);
}

const EMAIL_SERVER_BASE =
  (import.meta.env.VITE_EMAIL_SERVER_URL || "http://localhost:4001").replace(/\/$/, "");

async function sendViaLocalEmailServer(payload) {
  const res = await fetch(`${EMAIL_SERVER_BASE}/api/send-deferral`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Email server request failed (${res.status})`);
  }
  return json;
}

function pickFirstCurrentApprover(deferral) {
  const approvers = orderApprovers(
    Array.isArray(deferral?.approvers) ? deferral.approvers : [],
  );
  if (!approvers.length) return null;

  const index = Number.isInteger(deferral?.currentApproverIndex)
    ? deferral.currentApproverIndex
    : 0;
  const current = approvers[index] || approvers[0] || null;
  if (!current) return null;

  const email =
    current?.user?.email ||
    current?.email ||
    current?.userEmail ||
    null;
  return {
    name: current?.user?.name || current?.name || "Approver",
    email,
    position: current?.role || current?.position || current?.user?.position || "Approver",
  };
}

function collectRecipientsByType(deferral, notificationType, data = {}) {
  const type = String(notificationType || "").toLowerCase();
  const recipients = [];

  const rmRecipient = {
    name: deferral?.createdBy?.name || data?.userName || "RM",
    email: deferral?.createdBy?.email || data?.rmEmail || null,
    position: "Relationship Manager",
  };

  const approverRecipients = (Array.isArray(deferral?.approvers) ? deferral.approvers : [])
    .map((a) => ({
      name: a?.user?.name || a?.name || "Approver",
      email: a?.user?.email || a?.email || null,
      position: a?.role || a?.position || a?.user?.position || "Approver",
    }))
    .filter((r) => !!r.email);

  const currentApprover = pickFirstCurrentApprover(deferral);

  if (type.includes("to_rm") || type.includes("approved_by") || type.includes("rejected") || type.includes("returned")) {
    if (rmRecipient.email) recipients.push(rmRecipient);
  } else if (type === "recall" || type === "withdrawal" || type.includes("all_parties")) {
    if (rmRecipient.email) recipients.push(rmRecipient);
    recipients.push(...approverRecipients);
  } else {
    if (currentApprover?.email) recipients.push(currentApprover);
    else recipients.push(...approverRecipients.slice(0, 1));
  }

  const seen = new Set();
  return recipients.filter((r) => {
    const key = String(r.email || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getAuthHeaders(token) {
  // Prefer explicit token argument (from Redux) to avoid direct localStorage reads.
  const stored = JSON.parse(localStorage.getItem("user") || "null");
  const fallbackToken = stored?.token;
  const t = token || fallbackToken;
  return {
    "content-type": "application/json",
    ...(t ? { authorization: `Bearer ${t}` } : {}),
  };
}

const deferralApi = {
  getMyDeferrals: async (token) => {
    const res = await fetch(`${API_BASE}/my`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to fetch deferrals");
    const data = await res.json();
    return normalizeDeferralList(data);
  },

  getDeferralById: async (id, token) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to fetch deferral");
    const data = await res.json();
    return normalizeDeferralRecord(data);
  },

  createDeferral: async (payload, token) => {
    const res = await fetch(`${API_BASE}`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const validationError =
        err?.error ||
        err?.message ||
        (err?.errors ? Object.values(err.errors).flat().join("; ") : "") ||
        `Failed to create deferral (${res.status})`;
      throw new Error(validationError);
    }
    const data = await res.json();
    if (data?.deferral && typeof data.deferral === "object") {
      return {
        ...data.deferral,
        selectedDocuments: data.selectedDocuments || data.deferral.selectedDocuments || [],
        emailNotification: data.emailNotification || null,
      };
    }
    return data;
  },

  getNextDeferralNumber: async (token) => {
    let res = await fetch(`${API_BASE}/next-number`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      // Backward compatibility with older API route
      res = await fetch(`${API_BASE}/preview-number`, {
        headers: getAuthHeaders(token),
      });
    }
    if (!res.ok) throw new Error("Failed to get preview deferral number");
    return res.json();
  },

  updateDeferral: async (id, patch, token) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const validationError =
        err?.error ||
        err?.message ||
        err?.title ||
        (err?.errors ? Object.values(err.errors).flat().join("; ") : "") ||
        `Failed to update deferral (${res.status})`;
      throw new Error(validationError);
    }
    return res.json();
  },

  addHistory: async (id, entry, token) => {
    const res = await fetch(`${API_BASE}/${id}/history`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error("Failed to add history");
    return res.json();
  },

  addDocument: async (id, doc, token) => {
    const res = await fetch(`${API_BASE}/${id}/documents`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(doc),
    });
    if (!res.ok) throw new Error("Failed to add document");
    return res.json();
  },

  uploadDocument: async (id, file, opts = {}, token) => {
    const fd = new FormData();
    // If file is AntD Upload file, it might be an object with originFileObj
    const f = file.originFileObj || file;
    fd.append("file", f);
    if (opts.isDCL) fd.append("isDCL", "true");
    if (opts.isAdditional) fd.append("isAdditional", "true");
    if (opts.documentName) fd.append("documentName", String(opts.documentName));

    const stored = JSON.parse(localStorage.getItem("user") || "null");
    const t = token || stored?.token;

    const res = await fetch(`${API_BASE}/${id}/documents/upload`, {
      method: "POST",
      headers: {
        ...(t ? { authorization: `Bearer ${t}` } : {}),
        // IMPORTANT: do not set Content-Type; browser will set multipart with boundary
      },
      body: fd,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to upload document");
    }

    return res.json();
  },

  getApproverQueue: async (token) => {
    let res = await fetch(`${API_BASE}/approver-queue`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      // Backward compatibility with older route shape
      res = await fetch(`${API_BASE}/approver/queue`, {
        headers: getAuthHeaders(token),
      });
    }
    if (!res.ok) throw new Error("Failed to fetch approver queue");
    const data = await res.json();
    return normalizeDeferralList(data);
  },

  getActionedDeferrals: async (token) => {
    let res = await fetch(`${API_BASE}/actioned`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      // Backward compatibility with older route shape
      res = await fetch(`${API_BASE}/approver/actioned`, {
        headers: getAuthHeaders(token),
      });
    }
    if (!res.ok) throw new Error("Failed to fetch actioned deferrals");
    const data = await res.json();
    return normalizeDeferralList(data);
  },

  getPendingDeferrals: async (token) => {
    const res = await fetch(`${API_BASE}/pending`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to fetch pending deferrals");
    const data = await res.json();
    return normalizeDeferralList(data);
  },

  getApprovedDeferrals: async (token) => {
    // Try authenticated endpoint first
    const res = await fetch(`${API_BASE}/approved`, {
      headers: getAuthHeaders(token),
    });
    if (res.ok) {
      const data = await res.json();
      return normalizeDeferralList(data);
    }

    // If unauthorized, fall back to public debug endpoint (development only)
    if (res.status === 401 || res.status === 403) {
      console.debug(
        "getApprovedDeferrals: authenticated request unauthorized, falling back to public debug endpoint",
      );
      const pub = await fetch(`${API_BASE}/debug/public/approved`);
      if (!pub.ok)
        throw new Error(
          "Failed to fetch approved deferrals (public fallback failed)",
        );
      const data = await pub.json();
      return normalizeDeferralList(data);
    }

    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to fetch approved deferrals");
  },

  getCloseWorkflowDeferrals: async (token) => {
    const res = await fetch(`${API_BASE}/close-workflow`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch close workflow deferrals");
    }
    const data = await res.json();
    return normalizeDeferralList(data);
  },

  addComment: async (id, text, token) => {
    const res = await fetch(`${API_BASE}/${id}/comments`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("Failed to add comment");
    return res.json();
  },

  sendReminder: async (id, token, payload = {}) => {
    const res = await fetch(`${API_BASE}/${id}/reminder`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to send reminder");
    }
    return res.json();
  },

  approveDeferral: async (id, data, token) => {
    // Handle both string and object inputs
    let body = {};
    if (typeof data === "string") {
      body = { comment: data };
    } else if (data && typeof data === "object") {
      body = data;
    } else {
      body = { comment: "" };
    }

    const requestApprove = (method) =>
      fetch(`${API_BASE}/${id}/approve`, {
        method,
        headers: getAuthHeaders(token),
        body: JSON.stringify(body),
      });

    let res = await requestApprove("POST");
    if (res.status === 404 || res.status === 405) {
      res = await requestApprove("PUT");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to approve deferral");
    }
    return res.json();
  },

  rejectDeferral: async (id, data, token) => {
    // Handle both string and object inputs
    let body = {};
    if (typeof data === "string") {
      body = { reason: data };
    } else if (data && typeof data === "object") {
      // Map 'comment' to 'reason' if needed
      body = {
        reason: data.reason || data.comment || "",
        ...data,
      };
    } else {
      body = { reason: "" };
    }

    const requestReject = (method) =>
      fetch(`${API_BASE}/${id}/reject`, {
        method,
        headers: getAuthHeaders(token),
        body: JSON.stringify(body),
      });

    let res = await requestReject("POST");
    if (res.status === 404 || res.status === 405) {
      res = await requestReject("PUT");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to reject deferral");
    }
    return res.json();
  },

  // Send a reminder email to the current approver for the given deferral
  sendReminder: async (id, token) => {
    try {
      const res = await fetch(`${API_BASE}/${id}/reminder`, {
        method: "POST",
        headers: getAuthHeaders(token),
      });
      if (res.ok) return res.json();
    } catch (_) {
      // fallback handled below
    }

    return await deferralApi.sendEmailNotification(id, "reminder", {}, token);
  },

  // Delete/withdraw deferral
  deleteDeferral: async (id, token) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to withdraw deferral");
    }
    return res.json();
  },

  // Return deferral for re-work to RM - FIXED: Now properly handles the data parameter
  returnForRework: async (id, data, token) => {
    const reworkComment =
      data?.ReworkComment || data?.reworkComment || data?.comment || data?.reason || data?.reworkInstructions || "";

    const payload = {
      ReworkComment: String(reworkComment || "").trim(),
    };

    const requestReturnForRework = (method) =>
      fetch(`${API_BASE}/${id}/return-for-rework`, {
        method,
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
      });

    let res = await requestReturnForRework("POST");
    if (res.status === 404 || res.status === 405) {
      res = await requestReturnForRework("PUT");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to return deferral for rework");
    }
    return res.json();
  },

  // Get returned deferrals
  getReturnedDeferrals: async (token) => {
    const res = await fetch(`${API_BASE}/returned`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to fetch returned deferrals");
    return res.json();
  },

  // ===========================
  // NEW METHODS FOR APPROVAL FLOW
  // ===========================

  // Creator approval
  approveByCreator: async (deferralId, data, token) => {
    const requestApproveByCreator = (url, method) =>
      fetch(url, {
        method,
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });

    // Current backend endpoint
    let res = await requestApproveByCreator(
      `${API_BASE}/${deferralId}/approve-creator`,
      "POST",
    );

    // Backward-compat route/method fallback
    if (res.status === 404 || res.status === 405) {
      res = await requestApproveByCreator(
        `${API_BASE}/${deferralId}/approve-by-creator`,
        "PUT",
      );
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to approve by creator");
    }
    const payload = await res.json();
    if (payload && typeof payload === "object" && payload.deferral) {
      return {
        ...payload,
        deferral: normalizeDeferralRecord(payload.deferral),
      };
    }
    return normalizeDeferralRecord(payload);
  },

  // Checker approval
  approveByChecker: async (deferralId, data, token) => {
    const requestApproveByChecker = (url, method) =>
      fetch(url, {
        method,
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });

    let res = await requestApproveByChecker(
      `${API_BASE}/${deferralId}/approve-checker`,
      "POST",
    );

    if (res.status === 404 || res.status === 405) {
      res = await requestApproveByChecker(
        `${API_BASE}/${deferralId}/approve-by-checker`,
        "PUT",
      );
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to approve by checker");
    }
    const payload = await res.json();
    if (payload && typeof payload === "object" && payload.deferral) {
      return {
        ...payload,
        deferral: normalizeDeferralRecord(payload.deferral),
      };
    }
    return normalizeDeferralRecord(payload);
  },

  // Creator rejection
  rejectByCreator: async (deferralId, data, token) => {
    const res = await fetch(`${API_BASE}/${deferralId}/reject-by-creator`, {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to reject by creator");
    }
    return res.json();
  },

  // Checker rejection
  rejectByChecker: async (deferralId, data, token) => {
    const res = await fetch(`${API_BASE}/${deferralId}/reject-by-checker`, {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to reject by checker");
    }
    return res.json();
  },

  // Return for rework by creator
  returnForReworkByCreator: async (deferralId, data, token) => {
    const reworkComment =
      data?.reworkComment || data?.comment || data?.reason || "";

    const dotnetPayload = {
      ReworkComment: String(reworkComment || "").trim(),
    };

    let res = await fetch(`${API_BASE}/${deferralId}/return-for-rework`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(dotnetPayload),
    });

    if (res.status === 404 || res.status === 405) {
      res = await fetch(`${API_BASE}/${deferralId}/return-by-creator`, {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to return by creator");
    }
    return res.json();
  },

  // Return for rework by checker
  returnForReworkByChecker: async (deferralId, data, token) => {
    const reworkComment =
      data?.reworkComment || data?.comment || data?.reason || "";

    const dotnetPayload = {
      ReworkComment: String(reworkComment || "").trim(),
    };

    let res = await fetch(`${API_BASE}/${deferralId}/return-for-rework`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(dotnetPayload),
    });

    if (res.status === 404 || res.status === 405) {
      res = await fetch(`${API_BASE}/${deferralId}/return-by-checker`, {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to return by checker");
    }
    return res.json();
  },

  // Close deferral
  closeDeferral: async (deferralId, data, token) => {
    const requestClose = (method) =>
      fetch(`${API_BASE}/${deferralId}/close`, {
        method,
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });

    let res = await requestClose("POST");
    if (res.status === 404 || res.status === 405) {
      res = await requestClose("PUT");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to close deferral");
    }
    const payload = await res.json();
    if (payload && typeof payload === "object" && payload.deferral) {
      return {
        ...payload,
        deferral: normalizeDeferralRecord(payload.deferral),
      };
    }
    return normalizeDeferralRecord(payload);
  },

  approveCloseRequestByCreator: async (deferralId, data, token) => {
    const res = await fetch(`${API_BASE}/${deferralId}/close-request/approve-creator`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to approve close request by creator");
    }
    const payload = await res.json();
    if (payload && typeof payload === "object" && payload.deferral) {
      return {
        ...payload,
        deferral: normalizeDeferralRecord(payload.deferral),
      };
    }
    return normalizeDeferralRecord(payload);
  },

  approveCloseRequestByChecker: async (deferralId, data, token) => {
    const res = await fetch(`${API_BASE}/${deferralId}/close-request/approve-checker`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to approve close request by checker");
    }
    const payload = await res.json();
    if (payload && typeof payload === "object" && payload.deferral) {
      return {
        ...payload,
        deferral: normalizeDeferralRecord(payload.deferral),
      };
    }
    return normalizeDeferralRecord(payload);
  },

  // Recall deferral (reset approval flow and keep in pending)
  recallDeferral: async (deferralId, data = {}, token) => {
    const requestRecall = (method) =>
      fetch(`${API_BASE}/${deferralId}/recall`, {
        method,
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });

    let res = await requestRecall("POST");
    if (res.status === 404 || res.status === 405) {
      res = await requestRecall("PUT");
    }

    if (res.status === 404 || res.status === 405) {
      // Backward compatibility: older backend has no /recall route,
      // but PUT /{id} with Pending status resets approval flow.
      res = await fetch(`${API_BASE}/${deferralId}`, {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ status: "Pending" }),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to recall deferral");
    }
    return res.json();
  },

  // Send reminder (already exists, keeping for consistency)
  sendReminderToApprover: async (deferralId) => {
    return await deferralApi.sendReminder(deferralId);
  },

  // Send email notification
  sendEmailNotification: async (deferralId, notificationType, data = {}, token) => {
    // Try API endpoint first (if available in some deployments)
    try {
      const res = await fetch(`${API_BASE}/${deferralId}/send-notification`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          notificationType,
          ...data,
        }),
      });
      if (res.ok) return res.json();
    } catch (_) {
      // fallback to local email server below
    }

    const deferral = await deferralApi.getDeferralById(deferralId, token).catch(() => null);
    if (!deferral) {
      throw new Error("Failed to send email notification: unable to load deferral details");
    }

    const recipients = collectRecipientsByType(deferral, notificationType, data);
    if (!recipients.length) {
      throw new Error("Failed to send email notification: no recipient email found");
    }

    const documents = Array.isArray(deferral?.selectedDocuments)
      ? deferral.selectedDocuments
      : Array.isArray(deferral?.documents)
      ? deferral.documents
      : [];

    const results = [];
    for (const recipient of recipients) {
      const payload = {
        deferralNumber: deferral?.deferralNumber,
        customerName: deferral?.customerName,
        documentName: documents?.[0]?.name || data?.documentName,
        documents,
        currentApprover: {
          name: recipient.name,
          email: recipient.email,
        },
        targetApproverPosition: recipient.position,
        notificationType,
        ...data,
      };
      const result = await sendViaLocalEmailServer(payload);
      results.push({ recipient: recipient.email, result });
    }

    return { success: true, sent: results.length, results };
  },

  // Additional utility method to get partially approved deferrals
  getPartiallyApprovedDeferrals: async () => {
    const res = await fetch(`${API_BASE}/partially-approved`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      // If endpoint doesn't exist, we'll filter from all deferrals on the client side
      const all = await fetch(`${API_BASE}/my`, { headers: getAuthHeaders() });
      if (!all.ok) throw new Error("Failed to fetch deferrals");
      const deferrals = await all.json();
      // Filter for partially approved deferrals
      return deferrals.filter((d) => {
        const hasCreatorApproved = d.creatorApprovalStatus === "approved";
        const hasCheckerApproved = d.checkerApprovalStatus === "approved";
        const allApproversApproved = d.allApproversApproved === true;
        const isFullyApproved =
          hasCreatorApproved && hasCheckerApproved && allApproversApproved;
        const isPartiallyApproved =
          (hasCreatorApproved || hasCheckerApproved || allApproversApproved) &&
          !isFullyApproved;
        return isPartiallyApproved;
      });
    }
    return res.json();
  },

  // Get deferrals requiring creator approval
  getDeferralsRequiringCreatorApproval: async () => {
    const res = await fetch(`${API_BASE}/requiring-creator-approval`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      // If endpoint doesn't exist, we'll filter from all deferrals on the client side
      const all = await fetch(`${API_BASE}/my`, { headers: getAuthHeaders() });
      if (!all.ok) throw new Error("Failed to fetch deferrals");
      const deferrals = await all.json();
      return deferrals.filter((d) => {
        const allApproversApproved = d.allApproversApproved === true;
        const creatorNotApproved = d.creatorApprovalStatus !== "approved";
        const checkerNotApproved = d.checkerApprovalStatus !== "approved";
        return allApproversApproved && creatorNotApproved && checkerNotApproved;
      });
    }
    return res.json();
  },

  // Get deferrals requiring checker approval
  getDeferralsRequiringCheckerApproval: async () => {
    const res = await fetch(`${API_BASE}/requiring-checker-approval`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      // If endpoint doesn't exist, we'll filter from all deferrals on the client side
      const all = await fetch(`${API_BASE}/my`, { headers: getAuthHeaders() });
      if (!all.ok) throw new Error("Failed to fetch deferrals");
      const deferrals = await all.json();
      return deferrals.filter((d) => {
        const allApproversApproved = d.allApproversApproved === true;
        const creatorApproved = d.creatorApprovalStatus === "approved";
        const checkerNotApproved = d.checkerApprovalStatus !== "approved";
        return allApproversApproved && creatorApproved && checkerNotApproved;
      });
    }
    return res.json();
  },

  postComment: async (id, commentData, token) => {
    const res = await fetch(`${API_BASE}/${id}/comments`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(commentData),
    });
    if (!res.ok) throw new Error("Failed to post comment");
    return res.json();
  },
};

export default deferralApi;