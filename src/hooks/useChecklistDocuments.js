// src/components/completedChecklistModal/hooks/useChecklistDocuments.js
import { useState, useEffect } from "react";
import { getDocumentStatusCounts } from "../utils/checklistConstants";

export const useChecklistDocuments = (checklist) => {
  const [docs, setDocs] = useState([]);
  const [documentCounts, setDocumentCounts] = useState({
    submitted: 0,
    waived: 0,
    deferred: 0,
    sighted: 0,
    tbo: 0,
    pendingrm: 0,
    pendingco: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    total: 0,
  });

  useEffect(() => {
    if (!checklist || !checklist.documents) return;

    const flatDocs = checklist.documents.reduce((acc, item) => {
      if (item.docList && Array.isArray(item.docList) && item.docList.length) {
        const nestedDocs = item.docList.map((doc) => ({
          ...doc,
          category: item.category,
          status: doc.status || doc.action || "pending",
          coStatus: doc.coStatus || doc.status || doc.action || "pending",
          checkerStatus:
            doc.checkerStatus ||
            doc.coCheckerStatus ||
            doc.co_checker_status ||
            null,
        }));
        return acc.concat(nestedDocs);
      }
      if (item.category) {
        return acc.concat({
          ...item,
          status: item.status || item.action || "pending",
          coStatus: item.coStatus || item.status || item.action || "pending",
          checkerStatus:
            item.checkerStatus ||
            item.coCheckerStatus ||
            item.co_checker_status ||
            null,
        });
      }
      return acc;
    }, []);

    // Filter out documents that are still pending with RM or Co-Creator
    // These shouldn't appear in completed/approved checklists
    const filteredDocs = flatDocs.filter((doc) => {
      const coStatusLower = (doc.coStatus || "").toLowerCase();
      if (checklist.status === "approved" || checklist.status === "completed") {
        return coStatusLower !== "pendingrm" && coStatusLower !== "pendingco";
      }
      return true;
    });

    const preparedDocs = filteredDocs.map((doc, idx) => {
      let finalCheckerStatus = doc.checkerStatus || null;

      if (checklist.status === "approved" || checklist.status === "completed") {
        finalCheckerStatus = "approved";
      } else if (checklist.status === "rejected") {
        finalCheckerStatus = "rejected";
      } else {
        finalCheckerStatus = doc.checkerStatus || "pending";
      }

      return {
        ...doc,
        docIdx: idx,
        status: doc.status || doc.action || "pending",
        coStatus: doc.coStatus || doc.status || doc.action || "pending",
        action: doc.action || doc.status || "pending",
        comment: doc.comment || "",
        fileUrl: doc.fileUrl || null,
        expiryDate: doc.expiryDate || null,
        deferralNo: doc.deferralNo || doc.deferralNumber || null,
        checkerStatus: doc.checkerStatus || null,
        finalCheckerStatus: finalCheckerStatus,
        name: doc.name || doc.documentName || `Document ${idx + 1}`,
      };
    });

    setDocs(preparedDocs);
    const counts = getDocumentStatusCounts(preparedDocs);
    setDocumentCounts(counts);
  }, [checklist]);

  return { docs, documentCounts };
};
