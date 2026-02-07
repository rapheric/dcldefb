// // import React, { useState } from "react";
// // import { Button, Divider, Table, Tag } from "antd";
// // import ChecklistsPage from "./ChecklistsPageCreator";
// // import ReviewChecklistModal from "../../components/modals/ReviewChecklistModal";
// // import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";

// // // Theme Colors
// // const PRIMARY_BLUE = "#164679";
// // const ACCENT_LIME = "#b5d334";
// // const HIGHLIGHT_GOLD = "#fcb116";
// // const LIGHT_YELLOW = "#fcd716";
// // const SECONDARY_PURPLE = "#7e6496";

// // /* -------------------------------------------------------------------
// //    ⭐ MAIN PAGE: CoChecklistPage
// // ------------------------------------------------------------------- */import React, { useState, useMemo } from "react";
// import { Button, Divider, Table, Tag } from "antd";
// import ChecklistsPage from "./ChecklistsPageCreator";
// import ReviewChecklistModal from "../../components/modals/ReviewChecklistModal";
// import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";// const CoChecklistPage = ({ userId }) => {
// //   const [drawerOpen, setDrawerOpen] = useState(false);
// //   const [selectedChecklist, setSelectedChecklist] = useState(null);

// //   const { data: checklists = [], refetch } =
// //     useGetAllCoCreatorChecklistsQuery();

// //   // Filter checklists created by current user AND status pending
// //   const myChecklists = checklists.filter(
// //     (c) =>
// //       c.createdBy?._id === userId &&
// //       (c.status || "").toLowerCase() === "pending"
// //   );

// //   const customTableStyles = `
// //     .ant-table-wrapper {
// //         border-radius: 12px;
// //         overflow: hidden;
// //         box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
// //         border: 1px solid #e0e0e0;
// //     }
// //     .ant-table-thead > tr > th {
// //         background-color: #f7f7f7 !important;
// //         color: ${PRIMARY_BLUE} !important;
// //         font-weight: 700;
// //         font-size: 15px;
// //         padding: 16px 16px !important;
// //         border-bottom: 3px solid ${ACCENT_LIME} !important;
// //         border-right: none !important;
// //     }
// //     .ant-table-tbody > tr > td {
// //         border-bottom: 1px solid #f0f0f0 !important;
// //         border-right: none !important;
// //         padding: 14px 16px !important;
// //         font-size: 14px;
// //         color: #333;
// //     }
// //     .ant-table-tbody > tr.ant-table-row:hover > td {
// //         background-color: rgba(181, 211, 52, 0.1) !important;
// //         cursor: pointer;
// //     }
// //     .ant-table-bordered .ant-table-container,
// //     .ant-table-bordered .ant-table-tbody > tr > td,
// //     .ant-table-bordered .ant-table-thead > tr > th {
// //         border: none !important;
// //     }
// //     .ant-pagination .ant-pagination-item-active {
// //         background-color: ${ACCENT_LIME} !important;
// //         border-color: ${ACCENT_LIME} !important;
// //     }
// //     .ant-pagination .ant-pagination-item-active a {
// //         color: ${PRIMARY_BLUE} !important;
// //         font-weight: 600;
// //     }
// //     .ant-pagination .ant-pagination-item:hover {
// //         border-color: ${ACCENT_LIME} !important;
// //     }
// //     .ant-pagination .ant-pagination-prev:hover .ant-pagination-item-link,
// //     .ant-pagination .ant-pagination-next:hover .ant-pagination-item-link {
// //         color: ${ACCENT_LIME} !important;
// //     }
// //     .ant-pagination .ant-pagination-options .ant-select-selector {
// //         border-radius: 8px !important;
// //     }
// //   `;

// //   const columns = [
// //     {
// //       title: "DCL No",
// //       dataIndex: "dclNo",
// //       width: 180,
// //       render: (text) => (
// //         <span style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>{text}</span>
// //       ),
// //     },
// //     {
// //       title: "Customer Name",
// //       dataIndex: "customerName",
// //       width: 180,
// //       render: (text) => <span style={{ color: SECONDARY_PURPLE }}>{text}</span>,
// //     },
// //     {
// //       title: "Customer Number",
// //       dataIndex: "customerNumber",
// //       width: 150,
// //       render: (text) => (
// //         <span style={{ color: PRIMARY_BLUE, fontWeight: 500 }}>{text}</span>
// //       ),
// //     },

// //     {
// //     title: "IBPS No", // ✅ New IBPS NO column
// //     dataIndex: "ibpsNo",
// //     width: 140,
// //     render: (text) => (
// //       <span style={{
// //         color: PRIMARY_BLUE,
// //         fontWeight: 500,
// //         fontFamily: "monospace",
// //         backgroundColor: text ? "rgba(181, 211, 52, 0.1)" : "transparent",
// //         padding: "2px 6px",
// //         borderRadius: 4,
// //         fontSize: 13
// //       }}>
// //         {text || "Not set"}
// //       </span>
// //     ),
// //   },

// // //   {
// // //   title: "IBPS No",
// // //   dataIndex: "ibpsNo",
// // //   width: 140,
// // //   sorter: (a, b) => (a.ibpsNo || "").localeCompare(b.ibpsNo || ""),
// // //   filters: [
// // //     { text: "Has IBPS No", value: "has" },
// // //     { text: "No IBPS No", value: "none" },
// // //   ],
// // //   onFilter: (value, record) => {
// // //     if (value === "has") return !!record.ibpsNo;
// // //     if (value === "none") return !record.ibpsNo;
// // //     return true;
// // //   },
// // //   render: (text) => (
// // //     <span style={{
// // //       color: PRIMARY_BLUE,
// // //       fontWeight: 500,
// // //       fontFamily: "monospace",
// // //       backgroundColor: text ? "rgba(181, 211, 52, 0.1)" : "transparent",
// // //       padding: "2px 6px",
// // //       borderRadius: 4,
// // //       fontSize: 13
// // //     }}>
// // //       {text || "Not set"}
// // //     </span>
// // //   ),
// // // },
// //     { title: "Loan Type", dataIndex: "loanType", width: 140 },
// //     {
// //       title: "Assigned RM",
// //       dataIndex: "assignedToRM",
// //       width: 120,
// //       render: (rm) => (
// //         <span style={{ color: PRIMARY_BLUE, fontWeight: "500" }}>
// //           {rm?.name || "Not Assigned"}
// //         </span>
// //       ),
// //     },
// //     {
// //       title: "# Docs",
// //       dataIndex: "documents",
// //       width: 80,
// //       align: "center",
// //       render: (docs = []) => {
// //         const totalDocCount = docs.reduce((total, category) => {
// //           const docListCount = category.docList ? category.docList.length : 0;
// //           return total + docListCount;
// //         }, 0);
// //         return (
// //           <Tag
// //             color={LIGHT_YELLOW}
// //             style={{
// //               fontSize: 12,
// //               borderRadius: 999,
// //               fontWeight: "bold",
// //               color: PRIMARY_BLUE,
// //               border: `1px solid ${HIGHLIGHT_GOLD}`,
// //             }}
// //           >
// //             {totalDocCount}
// //           </Tag>
// //         );
// //       },
// //     },
// //     {
// //       title: "Status",
// //       dataIndex: "status",
// //       width: 120,
// //       render: (status) => {
// //         let tagColor, tagText, bgColor;
// //         const normalizedStatus = status ? status.toLowerCase() : "";

// //         if (normalizedStatus === "approved") {
// //           tagText = "Approved";
// //           tagColor = ACCENT_LIME;
// //           bgColor = ACCENT_LIME;
// //         } else if (normalizedStatus === "rejected") {
// //           tagText = "Rejected";
// //           tagColor = HIGHLIGHT_GOLD;
// //           bgColor = HIGHLIGHT_GOLD;
// //         } else if (normalizedStatus === "pending") {
// //           tagText = "Pending...";
// //           tagColor = "#01FFF3";
// //           bgColor = "#01FFF3";
// //         } else {
// //           tagText = "In Progress";
// //           tagColor = PRIMARY_BLUE;
// //           bgColor = LIGHT_YELLOW;
// //         }

// //         return (
// //           <Tag
// //             color={tagColor}
// //             style={{
// //               fontSize: 12,
// //               borderRadius: 999,
// //               fontWeight: "bold",
// //               padding: "4px 8px",
// //               color: "#5F0707",
// //               backgroundColor: `${bgColor}40`,
// //               borderColor: bgColor,
// //             }}
// //           >
// //             {tagText}
// //           </Tag>
// //         );
// //       },
// //     },
// //     {
// //       title: "Actions",
// //       width: 100,
// //       render: (_, record) => (
// //         <Button
// //           size="small"
// //           type="link"
// //           onClick={() => setSelectedChecklist(record)}
// //           style={{
// //             color: SECONDARY_PURPLE,
// //             fontWeight: "bold",
// //             fontSize: 13,
// //             borderRadius: 6,
// //             "--antd-wave-shadow-color": ACCENT_LIME,
// //           }}
// //         >
// //           View
// //         </Button>
// //       ),
// //     },
// //   ];

// //   return (
// //     <div style={{ padding: 16 }}>
// //       <Button type="primary" size="small" onClick={() => setDrawerOpen(true)}>
// //         Create New DCL
// //       </Button>

// //       {drawerOpen && (
// //         <ChecklistsPage
// //           open={drawerOpen}
// //           onClose={() => {
// //             setDrawerOpen(false);
// //             refetch();
// //           }}
// //           coCreatorId={userId}
// //         />
// //       )}

// //       <Divider style={{ margin: "12px 0" }}>
// //         Created Checklists For Review
// //       </Divider>

// //       <style>{customTableStyles}</style>

// //       <Table
// //         columns={columns}
// //         dataSource={myChecklists}
// //         rowKey="_id"
// //         size="large"
// //         pagination={{
// //           pageSize: 5,
// //           showSizeChanger: true,
// //           pageSizeOptions: ["5", "10", "20", "50"],
// //           position: ["bottomCenter"],
// //         }}
// //         rowClassName={(record, index) =>
// //           index % 2 === 0 ? "bg-white" : "bg-gray-50"
// //         }
// //       />

// //       {selectedChecklist && (
// //         <ReviewChecklistModal
// //           checklist={selectedChecklist}
// //           open={!!selectedChecklist}
// //           onClose={() => setSelectedChecklist(null)}
// //         />
// //       )}
// //     </div>
// //   );
// // };

// // export default CoChecklistPage;

// import React, { useState } from "react";
// import { Button, Divider, Table, Tag } from "antd";
// import ChecklistsPage from "./ChecklistsPageCreator";
// import ReviewChecklistModal from "../../components/modals/ReviewChecklistModal";
// import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";

// // Theme Colors
// const PRIMARY_BLUE = "#164679";
// const ACCENT_LIME = "#b5d334";
// const HIGHLIGHT_GOLD = "#fcb116";
// const LIGHT_YELLOW = "#fcd716";
// const SECONDARY_PURPLE = "#7e6496";

// /* -------------------------------------------------------------------
//    ⭐ MAIN PAGE: CoChecklistPage
// ------------------------------------------------------------------- */
// const CoChecklistPage = ({ userId }) => {
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [selectedChecklist, setSelectedChecklist] = useState(null);

//   const { data: checklists = [], refetch } =
//     useGetAllCoCreatorChecklistsQuery();

//   // Filter checklists: Only show Pending checklists and Revived checklists
//   // EXCLUDE co_creator_review status checklists (non-revived)
//   const myChecklists = useMemo(() => {
//     return checklists.filter((c) => {
//       const statusLower = (c.status || "").toLowerCase();
//       const isRevived = c.dclNo?.toLowerCase().includes("copy");

//       // Only include:
//       // 1. Checklists with "pending" status (newly created)
//       // 2. Revived checklists (with "Copy" in DCL number) that are still in co_creator_review
//       // EXCLUDE: checklists that have been submitted (status changed from co_creator_review)

//       if (isRevived) {
//         // Show revived checklists only if they're still in editable state
//         // Once submitted (status changes), they should disappear
//         return statusLower === "co_creator_review";
//       }

//       // Only show pending status checklists
//       return statusLower === "pending";
//     }).filter((c) => c.createdBy?._id === userId);
//   }, [checklists, userId]);

//   const customTableStyles = `
//     .ant-table-wrapper {
//         border-radius: 12px;
//         overflow: hidden;
//         box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
//         border: 1px solid #e0e0e0;
//     }
//     .ant-table-thead > tr > th {
//         background-color: #f7f7f7 !important;
//         color: ${PRIMARY_BLUE} !important;
//         font-weight: 700;
//         font-size: 15px;
//         padding: 16px 16px !important;
//         border-bottom: 3px solid ${ACCENT_LIME} !important;
//         border-right: none !important;
//     }
//     .ant-table-tbody > tr > td {
//         border-bottom: 1px solid #f0f0f0 !important;
//         border-right: none !important;
//         padding: 14px 16px !important;
//         font-size: 14px;
//         color: #333;
//     }
//     .ant-table-tbody > tr.ant-table-row:hover > td {
//         background-color: rgba(181, 211, 52, 0.1) !important;
//         cursor: pointer;
//     }
//     .ant-table-bordered .ant-table-container,
//     .ant-table-bordered .ant-table-tbody > tr > td,
//     .ant-table-bordered .ant-table-thead > tr > th {
//         border: none !important;
//     }
//     .ant-pagination .ant-pagination-item-active {
//         background-color: ${ACCENT_LIME} !important;
//         border-color: ${ACCENT_LIME} !important;
//     }
//     .ant-pagination .ant-pagination-item-active a {
//         color: ${PRIMARY_BLUE} !important;
//         font-weight: 600;
//     }
//     .ant-pagination .ant-pagination-item:hover {
//         border-color: ${ACCENT_LIME} !important;
//     }
//     .ant-pagination .ant-pagination-prev:hover .ant-pagination-item-link,
//     .ant-pagination .ant-pagination-next:hover .ant-pagination-item-link {
//         color: ${ACCENT_LIME} !important;
//     }
//     .ant-pagination .ant-pagination-options .ant-select-selector {
//         border-radius: 8px !important;
//     }
//   `;

//   const columns = [
//     {
//       title: "DCL No",
//       dataIndex: "dclNo",
//       width: 180,
//       render: (text) => (
//         <span style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>{text}</span>
//       ),
//     },
//     {
//       title: "Customer Name",
//       dataIndex: "customerName",
//       width: 180,
//       render: (text) => <span style={{ color: SECONDARY_PURPLE }}>{text}</span>,
//     },
//     {
//       title: "Customer Number",
//       dataIndex: "customerNumber",
//       width: 150,
//       render: (text) => (
//         <span style={{ color: PRIMARY_BLUE, fontWeight: 500 }}>{text}</span>
//       ),
//     },
//     {
//       title: "IBPS No",
//       dataIndex: "ibpsNo",
//       width: 140,
//       render: (text) => (
//         <span
//           style={{
//             color: PRIMARY_BLUE,
//             fontWeight: 500,
//             fontFamily: "monospace",
//             backgroundColor: text ? "rgba(181, 211, 52, 0.1)" : "transparent",
//             padding: "2px 6px",
//             borderRadius: 4,
//             fontSize: 13,
//           }}
//         >
//           {text || "Not set"}
//         </span>
//       ),
//     },
//     { title: "Loan Type", dataIndex: "loanType", width: 140 },
//     {
//       title: "Assigned RM",
//       dataIndex: "assignedToRM",
//       width: 120,
//       render: (rm) => (
//         <span style={{ color: PRIMARY_BLUE, fontWeight: "500" }}>
//           {rm?.name || "Not Assigned"}
//         </span>
//       ),
//     },
//     {
//       title: "# Docs",
//       dataIndex: "documents",
//       width: 80,
//       align: "center",
//       render: (docs = []) => {
//         const totalDocCount = docs.reduce((total, category) => {
//           const docListCount = category.docList ? category.docList.length : 0;
//           return total + docListCount;
//         }, 0);
//         return (
//           <Tag
//             color={LIGHT_YELLOW}
//             style={{
//               fontSize: 12,
//               borderRadius: 999,
//               fontWeight: "bold",
//               color: PRIMARY_BLUE,
//               border: `1px solid ${HIGHLIGHT_GOLD}`,
//             }}
//           >
//             {totalDocCount}
//           </Tag>
//         );
//       },
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       width: 120,
//       render: (status) => {
//         let tagColor, tagText, bgColor;
//         const normalizedStatus = status ? status.toLowerCase() : "";

//         if (normalizedStatus === "approved") {
//           tagText = "Approved";
//           tagColor = ACCENT_LIME;
//           bgColor = ACCENT_LIME;
//         } else if (normalizedStatus === "rejected") {
//           tagText = "Rejected";
//           tagColor = HIGHLIGHT_GOLD;
//           bgColor = HIGHLIGHT_GOLD;
//         } else if (normalizedStatus === "pending") {
//           tagText = "Pending...";
//           tagColor = "#01FFF3";
//           bgColor = "#01FFF3";
//         } else {
//           tagText = "In Progress";
//           tagColor = PRIMARY_BLUE;
//           bgColor = LIGHT_YELLOW;
//         }

//         return (
//           <Tag
//             color={tagColor}
//             style={{
//               fontSize: 12,
//               borderRadius: 999,
//               fontWeight: "bold",
//               padding: "4px 8px",
//               color: "#5F0707",
//               backgroundColor: `${bgColor}40`,
//               borderColor: bgColor,
//             }}
//           >
//             {tagText}
//           </Tag>
//         );
//       },
//     },
//     // Removed the "Actions" column since we're making the entire row clickable
//   ];

//   return (
//     <div style={{ padding: 16 }}>
//       <Button type="primary" size="small" onClick={() => setDrawerOpen(true)}>
//         Create New DCL
//       </Button>

//       {drawerOpen && (
//         <ChecklistsPage
//           open={drawerOpen}
//           onClose={() => {
//             setDrawerOpen(false);
//             refetch();
//           }}
//           coCreatorId={userId}
//         />
//       )}

//       <Divider style={{ margin: "12px 0" }}>
//         Created Checklists For Review
//       </Divider>

//       <style>{customTableStyles}</style>

//       <Table
//         columns={columns}
//         dataSource={myChecklists}
//         rowKey="_id"
//         size="large"
//         pagination={{
//           pageSize: 5,
//           showSizeChanger: true,
//           pageSizeOptions: ["5", "10", "20", "50"],
//           position: ["bottomCenter"],
//         }}
//         rowClassName={(record, index) =>
//           index % 2 === 0 ? "bg-white" : "bg-gray-50"
//         }
//         // Make the entire row clickable
//         onRow={(record) => ({
//           onClick: () => {
//             setSelectedChecklist(record);
//           },
//           style: { cursor: "pointer" },
//         })}
//       />

//       {selectedChecklist && (
//         <ReviewChecklistModal
//           checklist={selectedChecklist}
//           open={!!selectedChecklist}
//           onClose={() => setSelectedChecklist(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default CoChecklistPage;

import React, { useState, useMemo } from "react";
import { Button, Divider, Table, Tag } from "antd";
import ChecklistsPage from "./ChecklistsPageCreator";
// import ReviewChecklistModal from "../../components/modals/ReviewChecklistModalComponents";
import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";
import ReviewChecklistModal from "../../components/modals/ReviewChecklistModalComponents/ReviewChecklistModal";
// import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";

// Theme Colors
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";

/* -------------------------------------------------------------------
   ⭐ MAIN PAGE: CoChecklistPage
------------------------------------------------------------------- */
const CoChecklistPage = ({ userId }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  const { data: checklists = [], refetch } =
    useGetAllCoCreatorChecklistsQuery();

  // Filter checklists: Only show Pending checklists and Revived checklists
  // EXCLUDE coCreatorReview status checklists (non-revived)
  const myChecklists = useMemo(() => {
    return checklists.filter((c) => {
      const statusLower = (c.status || "").toLowerCase();
      const isRevived = c.dclNo?.toLowerCase().includes("copy");

      // Only include:
      // 1. Checklists with "pending" status (newly created)
      // 2. Revived checklists (with "Copy" in DCL number) that are still in coCreatorReview
      // EXCLUDE: checklists that have been submitted (status changes from coCreatorReview)

      if (isRevived) {
        // Show revived checklists only if they're still in editable state
        // Once submitted (status changes), they should disappear
        return statusLower === "cocreatorreview";
      }

      // Only show pending status checklists
      return statusLower === "pending";
    });
  }, [checklists]);

  const customTableStyles = `
    .ant-table-wrapper {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
        border: 1px solid #e0e0e0;
    }
    .ant-table-thead > tr > th {
        background-color: #f7f7f7 !important;
        color: ${PRIMARY_BLUE} !important;
        font-weight: 700;
        font-size: 15px;
        padding: 16px 16px !important;
        border-bottom: 3px solid ${ACCENT_LIME} !important;
        border-right: none !important;
    }
    .ant-table-tbody > tr > td {
        border-bottom: 1px solid #f0f0f0 !important;
        border-right: none !important;
        padding: 14px 16px !important;
        font-size: 14px;
        color: #333;
    }
    .ant-table-tbody > tr.ant-table-row:hover > td {
        background-color: rgba(181, 211, 52, 0.1) !important;
        cursor: pointer;
    }
    .ant-table-bordered .ant-table-container,
    .ant-table-bordered .ant-table-tbody > tr > td,
    .ant-table-bordered .ant-table-thead > tr > th {
        border: none !important;
    }
    .ant-pagination .ant-pagination-item-active {
        background-color: ${ACCENT_LIME} !important;
        border-color: ${ACCENT_LIME} !important;
    }
    .ant-pagination .ant-pagination-item-active a {
        color: ${PRIMARY_BLUE} !important;
        font-weight: 600;
    }
    .ant-pagination .ant-pagination-item:hover {
        border-color: ${ACCENT_LIME} !important;
    }
    .ant-pagination .ant-pagination-prev:hover .ant-pagination-item-link,
    .ant-pagination .ant-pagination-next:hover .ant-pagination-item-link {
        color: ${ACCENT_LIME} !important;
    }
    .ant-pagination .ant-pagination-options .ant-select-selector {
        border-radius: 8px !important;
    }
  `;

  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 180,
      render: (text) => (
        <span style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>{text}</span>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 180,
      render: (text) => <span style={{ color: SECONDARY_PURPLE }}>{text}</span>,
    },
    {
      title: "Customer Number",
      dataIndex: "customerNumber",
      width: 150,
      render: (text) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: 500 }}>{text}</span>
      ),
    },
    {
      title: "IBPS No",
      dataIndex: "ibpsNo",
      width: 140,
      render: (text) => (
        <span
          style={{
            color: PRIMARY_BLUE,
            fontWeight: 500,
            fontFamily: "monospace",
            backgroundColor: text ? "rgba(181, 211, 52, 0.1)" : "transparent",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {text || "Not set"}
        </span>
      ),
    },
    { title: "Loan Type", dataIndex: "loanType", width: 140 },
    {
      title: "Assigned RM",
      dataIndex: "assignedToRM",
      width: 120,
      render: (rm) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: "500" }}>
          {rm?.name || "Not Assigned"}
        </span>
      ),
    },
    {
      title: "# Docs",
      dataIndex: "documents",
      width: 80,
      align: "center",
      render: (docs = []) => {
        const totalDocCount = docs.reduce((total, category) => {
          const docListCount = category.docList ? category.docList.length : 0;
          return total + docListCount;
        }, 0);
        return (
          <Tag
            color={LIGHT_YELLOW}
            style={{
              fontSize: 12,
              borderRadius: 999,
              fontWeight: "bold",
              color: PRIMARY_BLUE,
              border: `1px solid ${HIGHLIGHT_GOLD}`,
            }}
          >
            {totalDocCount}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (status, record) => {
        let tagColor, tagText, bgColor;
        const normalizedStatus = status ? status.toLowerCase() : "";

        // Check if this is a revived checklist (has "Copy" in DCL number)
        const isRevived = record.dclNo?.toLowerCase().includes("copy");

        if (isRevived) {
          // Revived checklists from Completed section
          tagText = "Revived";
          tagColor = "#9254de";
          bgColor = "#9254de";
        } else if (normalizedStatus === "approved") {
          tagText = "Approved";
          tagColor = ACCENT_LIME;
          bgColor = ACCENT_LIME;
        } else if (normalizedStatus === "rejected") {
          tagText = "Rejected";
          tagColor = HIGHLIGHT_GOLD;
          bgColor = HIGHLIGHT_GOLD;
        } else if (normalizedStatus === "pending") {
          tagText = "Pending...";
          tagColor = "#01FFF3";
          bgColor = "#01FFF3";
        } else {
          tagText = "In Progress";
          tagColor = PRIMARY_BLUE;
          bgColor = LIGHT_YELLOW;
        }

        return (
          <Tag
            color={tagColor}
            style={{
              fontSize: 12,
              borderRadius: 999,
              fontWeight: "bold",
              padding: "4px 8px",
              color: "#5F0707",
              backgroundColor: `${bgColor}40`,
              borderColor: bgColor,
            }}
          >
            {tagText}
          </Tag>
        );
      },
    },
    // Removed the "Actions" column since we're making the entire row clickable
  ];

  return (
    <div style={{ padding: 16 }}>
      <Button type="primary" size="small" onClick={() => setDrawerOpen(true)}>
        Create New DCL
      </Button>

      {drawerOpen && (
        <ChecklistsPage
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            refetch();
          }}
          coCreatorId={userId}
        />
      )}

      <Divider style={{ margin: "12px 0" }}>
        Created Checklists For Review
      </Divider>

      <style>{customTableStyles}</style>

      <Table
        columns={columns}
        dataSource={myChecklists}
        rowKey="id"
        size="large"
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          position: ["bottomCenter"],
        }}
        rowClassName={(record, index) =>
          index % 2 === 0 ? "bg-white" : "bg-gray-50"
        }
        // Make the entire row clickable
        onRow={(record) => ({
          onClick: () => {
            setSelectedChecklist(record);
          },
          style: { cursor: "pointer" },
        })}
      />

      {selectedChecklist && (
        <ReviewChecklistModal
          checklist={selectedChecklist}
          open={!!selectedChecklist}
          onClose={() => setSelectedChecklist(null)}
        />
      )}
    </div>
  );
};

export default CoChecklistPage;
