// import React from "react";
// import { Button, Select, Typography, Divider, Avatar } from "antd";
// import { PlusOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";

// const { Title, Text } = Typography;
// const { Option } = Select;

// export default function ApproverSelector({
//   slots = [],
//   availableApprovers = [],
//   updateApprover,
//   addApprover,
//   removeApprover,
//   onSubmitDeferral,
//   isSubmitting,
//   onCancel,
//   currentUser = { name: "Requestor", role: "rm" },
// }) {
//   const selectedCount = slots.filter((s) => s.userId).length;

//   const handleAdd = (afterIndex = null) => {
//     // default role when adding a custom approver
//     addApprover("Approver");
//   };

//   return (
//     <>
//       <Title level={4} style={{ color: "#2B1C67", marginBottom: 8 }}>
//         Approver Selection
//       </Title>

//       <Divider style={{ margin: "16px 0" }} />

//       {/* Sequential list: Requestor + slots */}
//       <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//         {/* Requestor (top) */}
//         <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
//           <div style={{ width: 48, display: "flex", justifyContent: "center" }}>
//             <Avatar
//               size={40}
//               icon={<UserOutlined />}
//               style={{
//                 background: "#fff",
//                 color: "#2B1C67",
//                 border: "2px solid #f0f0f0",
//               }}
//             />
//             <div
//               style={{
//                 width: 2,
//                 height: 24,
//                 background: "#eaeaea",
//                 margin: "4px auto 0",
//               }}
//             />
//           </div>
//           <div style={{ flex: 1 }}>
//             <Text strong>{currentUser.name || "Requestor"}</Text>
//             <div style={{ fontSize: 12, color: "#888" }}>Requestor</div>
//           </div>
//         </div>

//         {/* Approval slots */}
//         {slots.map((slot, idx) => (
//           <div
//             key={idx}
//             style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
//           >
//             <div
//               style={{ width: 48, display: "flex", justifyContent: "center" }}
//             >
//               <Avatar
//                 size={40}
//                 style={{
//                   background: "#fff",
//                   color: "#2B1C67",
//                   border: "2px solid #f0f0f0",
//                 }}
//                 icon={<UserOutlined />}
//               />
//               {idx < slots.length - 1 && (
//                 <div
//                   style={{
//                     width: 2,
//                     height: 24,
//                     background: "#eaeaea",
//                     margin: "4px auto 0",
//                   }}
//                 />
//               )}
//             </div>

//             <div style={{ flex: 1 }}>
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                 }}
//               >
//                 <Text strong style={{ fontSize: 13 }}>
//                   {slot.role}
//                 </Text>
//                 <div>
//                   {slots.length > 1 && (
//                     <Button
//                       type="text"
//                       danger
//                       size="small"
//                       icon={<DeleteOutlined />}
//                       onClick={() => removeApprover(idx)}
//                       style={{ padding: 0, fontSize: 11, color: "#ff4d4f" }}
//                     />
//                   )}
//                 </div>
//               </div>

//               <div style={{ marginTop: 8 }}>
//                 <Select
//                   value={slot.userId}
//                   onChange={(value) => updateApprover(idx, value)}
//                   style={{ width: "100%" }}
//                   placeholder={`Select ${slot.role}`}
//                   size="middle"
//                   showSearch
//                   optionFilterProp="children"
//                 >
//                   <Option value="">-- Choose Approver --</Option>
//                   {Array.isArray(availableApprovers) &&
//                   availableApprovers.length > 0 ? (
//                     (() => {
//                       const matching = availableApprovers.filter(
//                         (a) => a.position === slot.role
//                       );
//                       const others = availableApprovers.filter(
//                         (a) => a.position !== slot.role
//                       );
//                       return (
//                         <>
//                           {matching.map((a) => (
//                             <Option key={a._id} value={a._id}>
//                               {a.name} — {a.position}
//                             </Option>
//                           ))}
//                           {others.map((a) => (
//                             <Option key={a._id} value={a._id}>
//                               {a.name}
//                               {a.position ? ` — ${a.position}` : ""}
//                             </Option>
//                           ))}
//                         </>
//                       );
//                     })()
//                   ) : (
//                     <Option value="">No approvers available</Option>
//                   )}
//                 </Select>
//               </div>
//             </div>
//           </div>
//         ))}

//         {/* Add button */}
//         <div style={{ display: "flex", justifyContent: "center" }}>
//           <Button onClick={() => handleAdd()} icon={<PlusOutlined />}>
//             Add
//           </Button>
//         </div>

//         <Divider />

//         {/* Actions */}
//         <div style={{ display: "flex", gap: 8 }}>
//           <Button
//             type="default"
//             size="large"
//             onClick={onCancel}
//             style={{ flex: 1 }}
//             disabled={isSubmitting}
//           >
//             Cancel
//           </Button>

//           <Button
//             onClick={onSubmitDeferral}
//             loading={isSubmitting}
//             size="large"
//             type="primary"
//             style={{ flex: 1 }}
//             disabled={selectedCount === 0}
//           >
//             {isSubmitting ? "Submitting..." : "Submit Deferral"}
//           </Button>
//         </div>

//         <div style={{ fontSize: 11, color: "#999", textAlign: "center" }}>
//           <Text type="secondary">{selectedCount} approver(s) selected</Text>
//         </div>
//       </div>
//     </>
//   );
// }
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Divider, Select, Typography } from "antd";
import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  WarningOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

export default function ApproverSelector({
  slots = [],
  availableApprovers = [],
  updateApprover,
  addApprover,
  removeApprover,
  onSubmitDeferral,
  isSubmitting,
  selectedDocuments = [],
  loanAmount = "",
}) {
  const requiredSteps = slots.length;
  const selectedCount = slots.filter((slot) => !!slot.userId).length;
  const remainingApprovers = Math.max(requiredSteps - selectedCount, 0);
  const selectedUserIds = slots.filter((slot) => !!slot.userId).map((slot) => String(slot.userId));
  const hasDuplicateApprovers = new Set(selectedUserIds).size !== selectedUserIds.length;
  const hasDocuments = Array.isArray(selectedDocuments) && selectedDocuments.length > 0;
  const hasLoanAmount = !!String(loanAmount || "").trim();
  const canDetermineMatrix = hasDocuments && hasLoanAmount;

  const parsedLoanAmount = useMemo(() => {
    const normalized = String(loanAmount || "").replace(/[^0-9.-]+/g, "");
    return parseFloat(normalized) || 0;
  }, [loanAmount]);

  const matrixLabel = useMemo(() => {
    if (!canDetermineMatrix || requiredSteps === 0) {
      return "Approver Matrix Pending";
    }

    const hasPrimary = selectedDocuments.some(
      (doc) => String(doc?.type || "").toLowerCase() === "primary"
    );
    const hasSecondary = selectedDocuments.some(
      (doc) => String(doc?.type || "").toLowerCase() === "secondary"
    );
    const amountLabel = parsedLoanAmount > 75000000 ? "Above 75M" : "Below 75M";

    if (hasPrimary) return `Primary Documents (${amountLabel})`;
    if (hasSecondary) return `Secondary Documents (${amountLabel})`;
    return `Selected Documents (${amountLabel})`;
  }, [canDetermineMatrix, requiredSteps, selectedDocuments, parsedLoanAmount]);

  const canSubmit = requiredSteps > 0 && selectedCount === requiredSteps && !hasDuplicateApprovers;

  const getApproverLabel = (index) => {
    if (index === requiredSteps - 1) return "Final Approver";
    return `Approver ${index + 1}`;
  };

  const handleSubmitClick = () => {
    if (!canSubmit || isSubmitting) return;
    if (typeof onSubmitDeferral === "function") {
      onSubmitDeferral();
    }
  };

  const handleAddApproverBetween = (insertIndex) => {
    if (typeof addApprover !== "function") return;
    addApprover(insertIndex, "Approver");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "78vh",
        width: "100%",
        boxSizing: "border-box",
        overflowY: "auto",
        overflowX: "hidden",
        overscrollBehavior: "contain",
        padding: "0 4px 12px",
        minHeight: 0,
      }}
    >
      <Title level={4} style={{ color: "#2B1C67", marginBottom: 8 }}>
        Approver Selection Matrix
      </Title>

      {!canDetermineMatrix || requiredSteps === 0 ? (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message="Select loan amount and documents to determine approver matrix"
          style={{
            borderRadius: 10,
            background: "#fff7e8",
            borderColor: "#ffd591",
            marginBottom: 12,
          }}
        />
      ) : (
        <div
          style={{
            border: "1px solid #95de64",
            borderLeft: "3px solid #52c41a",
            borderRadius: 6,
            padding: 10,
            background: "#f6ffed",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#389e0d",
              fontWeight: 600,
            }}
          >
            Applied: {matrixLabel}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: "#8c8c8c" }}>
            For selected documents with current loan amount
          </div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <Text type="secondary" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span>Required Steps:</span>
              <span
                style={{
                  border: "1px solid #d9d9d9",
                  background: "#fff",
                  color: "#595959",
                  borderRadius: 4,
                  padding: "0 6px",
                }}
              >
                {requiredSteps} levels
              </span>
            </Text>
            <Text type="secondary" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span>Completed:</span>
              <span
                style={{
                  border: "1px solid #d9d9d9",
                  background: "#fff",
                  color: "#595959",
                  borderRadius: 4,
                  padding: "0 6px",
                }}
              >
                {selectedCount}/{requiredSteps}
              </span>
            </Text>
          </div>
        </div>
      )}

      <Divider style={{ margin: "16px 0" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!canDetermineMatrix || requiredSteps === 0 ? (
          <div style={{ textAlign: "center", padding: "42px 14px", color: "#bfbfbf" }}>
            <InfoCircleOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />
            <div style={{ marginTop: 16, fontSize: 32, lineHeight: 1 }}>·</div>
            <div style={{ fontSize: 28, lineHeight: 1 }}>·</div>
            <Title level={4} style={{ margin: "12px 0 6px", color: "#bfbfbf" }}>
              Approver Matrix Pending
            </Title>
            <Text type="secondary">
              Select loan amount and documents to determine approver matrix
            </Text>
          </div>
        ) : (
          <>
            {slots.map((slot, index) => (
              <div key={`selector-${index}`}>
                <Text strong style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {getApproverLabel(index)}: {slot.role || "Approver"}
                </Text>
                <Select
                  value={slot.userId || undefined}
                  onChange={(value) => {
                    const selectedApprover = availableApprovers.find(
                      (approver) =>
                        String(approver.id || approver._id || approver.userId) === String(value)
                    );
                    const selectedRole = selectedApprover?.position || slot.role || "Approver";
                    updateApprover(index, value, selectedRole);
                  }}
                  onClear={() => updateApprover(index, "", slot.role || "Approver")}
                  style={{ width: "100%", marginTop: 6 }}
                  placeholder="-- Select --"
                  size="middle"
                  showSearch
                  allowClear
                  optionFilterProp="children"
                >
                  {Array.isArray(availableApprovers) && availableApprovers.length > 0 ? (
                    (() => {
                      const matching = availableApprovers.filter(
                        (approver) =>
                          String(approver.position || "").toLowerCase() ===
                          String(slot.role || "").toLowerCase()
                      );
                      const others = availableApprovers.filter(
                        (approver) =>
                          String(approver.position || "").toLowerCase() !==
                          String(slot.role || "").toLowerCase()
                      );

                      return (
                        <>
                          {matching.map((approver) => (
                            <Option
                              key={approver.id || approver._id || approver.userId}
                              value={approver.id || approver._id || approver.userId}
                              disabled={
                                selectedUserIds.includes(String(approver.id || approver._id || approver.userId)) &&
                                String(slot.userId || "") !== String(approver.id || approver._id || approver.userId)
                              }
                            >
                              {approver.name}
                              {approver.position ? ` — ${approver.position}` : ""}
                            </Option>
                          ))}
                          {others.map((approver) => (
                            <Option
                              key={approver.id || approver._id || approver.userId}
                              value={approver.id || approver._id || approver.userId}
                              disabled={
                                selectedUserIds.includes(String(approver.id || approver._id || approver.userId)) &&
                                String(slot.userId || "") !== String(approver.id || approver._id || approver.userId)
                              }
                            >
                              {approver.name}
                              {approver.position ? ` — ${approver.position}` : ""}
                            </Option>
                          ))}
                        </>
                      );
                    })()
                  ) : (
                    <Option key="no-approvers" value="__no_approvers__" disabled>
                      No approvers available
                    </Option>
                  )}
                </Select>

                {index < slots.length - 1 && (
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddApproverBetween(index + 1)}
                    style={{ marginTop: 8, width: 36, alignSelf: "center" }}
                    aria-label="Add approver"
                  />
                )}

                {slot.isCustom === true && typeof removeApprover === "function" && (
                  <Button
                    type="link"
                    danger
                    onClick={() => removeApprover(index)}
                    style={{ marginTop: 2, paddingLeft: 0 }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </>
        )}

      </div>
      <div
        style={{
          background: "#fff",
          borderTop: "1px solid #f0f0f0",
          padding: "12px 0 10px",
          marginTop: 8,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button
            onClick={handleSubmitClick}
            htmlType="button"
            loading={isSubmitting}
            size="large"
            type="primary"
            style={{ width: "100%", background: canSubmit ? "#52c41a" : undefined, borderColor: canSubmit ? "#52c41a" : undefined }}
            disabled={!canSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit Deferral"}
          </Button>
        </div>

        <div style={{ fontSize: 12, textAlign: "center", minHeight: 36, paddingTop: 10 }}>
          {!canDetermineMatrix || requiredSteps === 0 ? (
            <Text type="secondary">Complete loan amount and document selection first</Text>
          ) : hasDuplicateApprovers ? (
            <div style={{ color: "#ff4d4f" }}>
              <WarningOutlined /> Same approver cannot be selected in more than one step
            </div>
          ) : canSubmit ? (
            <div style={{ color: "#389e0d", fontWeight: 600 }}>
              <CheckCircleOutlined /> All approvers correctly selected
            </div>
          ) : (
            <div style={{ color: "#d48806" }}>
              <WarningOutlined /> Need {remainingApprovers} more approver(s)
            </div>
          )}
          {canDetermineMatrix && requiredSteps > 0 && (
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Matrix: {matrixLabel}
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}