// import React from 'react';
// import { Progress } from 'antd';
// // import { useDocumentStats } from '../../hooks/useDocumentStats';
// // import { PRIMARY_BLUE, ACCENT_LIME } from '../../utils/constants';
// import { useDocumentStats } from '../../../hooks/useDocumentStats';
// import { ACCENT_LIME, PRIMARY_BLUE } from '../../../utils/constants';

// const ProgressStats = ({ docs }) => {
//   const stats = useDocumentStats(docs);
//   const {
//     total,
//     submitted,
//     pendingFromRM,
//     pendingFromCo,
//     deferred,
//     sighted,
//     waived,
//     tbo,
//     progressPercent,
//   } = stats;

//   return (
//     <div
//       style={{
//         padding: "16px",
//         background: "#f7f9fc",
//         borderRadius: 8,
//         border: "1px solid #e0e0e0",
//         marginBottom: 18,
//       }}
//     >
//       {/* Stats Row */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           marginBottom: 12,
//           flexWrap: "wrap",
//           gap: "8px",
//         }}
//       >
//         <div style={{ fontWeight: "700", color: PRIMARY_BLUE }}>
//           Total: {total}
//         </div>
//         <div style={{ fontWeight: "700", color: "green" }}>
//           Submitted: {submitted}
//         </div>
//         <div
//           style={{
//             fontWeight: "700",
//             color: pendingFromRM > 0 ? "#f59e0b" : "#8b5cf6",
//           }}
//         >
//           Pending RM: {pendingFromRM}
//         </div>
//         <div
//           style={{
//             fontWeight: "700",
//             color: "#8b5cf6",
//             border: pendingFromCo > 0 ? "2px solid #8b5cf6" : "none",
//             padding: "2px 6px",
//             borderRadius: "4px",
//             background: pendingFromCo > 0 ? "#f3f4f6" : "transparent",
//           }}
//         >
//           Pending Co: {pendingFromCo}
//         </div>
//         <div style={{ fontWeight: "700", color: "#ef4444" }}>
//           Deferred: {deferred}
//         </div>
//         <div style={{ fontWeight: "700", color: "#3b82f6" }}>
//           Sighted: {sighted}
//         </div>
//         <div style={{ fontWeight: "700", color: "#f59e0b" }}>
//           Waived: {waived}
//         </div>
//         <div style={{ fontWeight: "700", color: "#06b6d4" }}>
//           TBO: {tbo}
//         </div>
//       </div>

//       {/* Progress Bar */}
//       <div style={{ marginBottom: 8 }}>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             marginBottom: 4,
//           }}
//         >
//           <span style={{ fontSize: "12px", color: "#666" }}>
//             Completion Progress
//           </span>
//           <span
//             style={{
//               fontSize: "12px",
//               fontWeight: 600,
//               color: PRIMARY_BLUE,
//             }}
//           >
//             {progressPercent}%
//           </span>
//         </div>
//         <Progress
//           percent={progressPercent}
//           strokeColor={{
//             "0%": PRIMARY_BLUE,
//             "100%": ACCENT_LIME,
//           }}
//           strokeWidth={6}
//         />
//       </div>
//     </div>
//   );
// };

// export default ProgressStats;


import React from 'react';
import { Progress, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useDocumentStats } from '../../../hooks/useDocumentStats';
import { ACCENT_LIME, PRIMARY_BLUE } from '../../../utils/constants';

const ProgressStats = ({ docs }) => {
  const stats = useDocumentStats(docs);
  const {
    total,
    submitted,
    pendingFromRM,
    pendingFromCo,
    deferred,
    sighted,
    waived,
    tbo,
    progressPercent,
    completedDocs,
    incompleteDocs,
  } = stats;

  // Calculate completion ratio
  const completionRatio = total > 0 ? `${completedDocs}/${total}` : '0/0';

  return (
    <div
      style={{
        padding: "16px",
        background: "#f7f9fc",
        borderRadius: 8,
        border: "1px solid #e0e0e0",
        marginBottom: 18,
      }}
    >
      {/* Stats Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ fontWeight: "700", color: PRIMARY_BLUE }}>
          Total: {total}
        </div>
        <div style={{ fontWeight: "700", color: "green" }}>
          Submitted: {submitted}
        </div>
        <div
          style={{
            fontWeight: "700",
            color: pendingFromRM > 0 ? "#FF4D4F" : "#8b5cf6",
          }}
        >
          Pending RM: {pendingFromRM}
        </div>
        <div
          style={{
            fontWeight: "700",
            color: "#FF4D4F",
            border: pendingFromCo > 0 ? "2px solid #FF4D4F" : "none",
            padding: "2px 6px",
            borderRadius: "4px",
            background: pendingFromCo > 0 ? "#ffebe6" : "transparent",
          }}
        >
          Pending Co: {pendingFromCo}
        </div>
        <div style={{ fontWeight: "700", color: "#FAAD14" }}>
          Deferred: {deferred}
        </div>
        <div style={{ fontWeight: "700", color: "#52C41A" }}>
          Sighted: {sighted}
        </div>
        <div style={{ fontWeight: "700", color: "#FAAD14" }}>
          Waived: {waived}
        </div>
        <div style={{ fontWeight: "700", color: "#FAAD14" }}>
          TBO: {tbo}
        </div>
      </div>

      {/* Progress Bar with Info */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "12px", color: "#666" }}>
              Completion Progress
            </span>
            <Tooltip title={`${completedDocs} completed out of ${total} total documents. Pending documents reduce progress.`}>
              <InfoCircleOutlined style={{ color: PRIMARY_BLUE, cursor: "help" }} />
            </Tooltip>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: PRIMARY_BLUE,
              }}
            >
              {progressPercent}%
            </span>
            <span style={{ fontSize: "11px", color: "#666" }}>
              ({completionRatio})
            </span>
          </div>
        </div>
        
        <Progress
          percent={progressPercent}
          strokeColor={{
            "0%": PRIMARY_BLUE,
            "100%": ACCENT_LIME,
          }}
          strokeWidth={6}
          status={progressPercent < 100 ? "active" : "success"}
        />
        
        {/* Progress Details */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between",
          fontSize: "11px",
          color: "#666",
          marginTop: 8
        }}>
          <span>
            ✅ Completed: {completedDocs}
          </span>
          <span>
             Incomplete: {incompleteDocs}
          </span>
          <span>
             Progress: {progressPercent}%
          </span>
        </div>
        
        {/* Warning if pending documents exist */}
        {(pendingFromRM > 0 || pendingFromCo > 0) && (
          <div style={{
            fontSize: "10px",
            color: "#d97706",
            backgroundColor: "#fef3c7",
            padding: "6px 10px",
            borderRadius: "4px",
            marginTop: 8,
            border: "1px solid #f59e0b20"
          }}>
             {pendingFromRM + pendingFromCo} pending document(s) are reducing overall progress
          </div>
        )}
        
        {/* Success message if all completed */}
        {progressPercent === 100 && (
          <div style={{
            fontSize: "10px",
            color: "#047857",
            backgroundColor: "#d1fae5",
            padding: "6px 10px",
            borderRadius: "4px",
            marginTop: 8,
            border: "1px solid #10b98120"
          }}>
            ✅ All documents are completed!
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressStats;