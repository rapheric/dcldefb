// import React, { useState } from "react";
// import { Tabs, Card, Row, Col, Tooltip, Divider, Button, Space, message } from "antd";
// import {
//   DownloadOutlined,
//   CheckCircleOutlined,
//   FileTextOutlined,
//   FilePdfOutlined,
//   FileExcelOutlined,
//   BarChartOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";
// import { formatDateTime } from "../../utils/checklistUtils";
// import {
//   generatePDFReport,
//   generateExcelReport,
// } from "../../utils/reportGenerator";
// import ReportCharts from "../../components/reports/ReportCharts";

// import Deferrals from "./Deferrals";
// import AllDCLsTable from "./AllDCLsTable";
// import ReportsFilters from "./ReportsFilters";
// import useReportsFilters from "../../hooks/useReportsFilters";

// const { TabPane } = Tabs;

// export default function Reports() {
//   const [activeTab, setActiveTab] = useState("deferrals");
//   const [showCharts, setShowCharts] = useState(false);
//   const [reportData, setReportData] = useState(null);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [isMobile] = React.useState(window.innerWidth <= 375);

//   // Filter hook
//   const { filters, setFilters, clearFilters } = useReportsFilters();

//   // Export CSV
//   const exportReport = (data) => {
//     if (!data?.length) return;
//     const filename = `${activeTab}_${dayjs().format("YYYYMMDD_HHmmss")}.csv`;
//     const csv =
//       "data:text/csv;charset=utf-8," +
//       data.map((row) => Object.values(row).join(",")).join("\n");

//     const link = document.createElement("a");
//     link.href = encodeURI(csv);
//     link.download = filename;
//     link.click();
//   };

//   // Handle PDF Export
//   const handlePDFExport = () => {
//     if (!reportData || reportData.length === 0) {
//       message.warning("No data to export. Please load data first.");
//       return;
//     }
//     try {
//       setIsGenerating(true);
//       generatePDFReport(reportData, activeTab, filters);
//       message.success("PDF downloaded successfully!");
//     } catch (error) {
//       console.error("PDF export error:", error);
//       message.error("Failed to generate PDF");
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   // Handle Excel Export
//   const handleExcelExport = () => {
//     if (!reportData || reportData.length === 0) {
//       message.warning("No data to export. Please load data first.");
//       return;
//     }
//     try {
//       setIsGenerating(true);
//       generateExcelReport(reportData, activeTab, filters);
//       message.success("Excel file downloaded successfully!");
//     } catch (error) {
//       console.error("Excel export error:", error);
//       message.error("Failed to generate Excel");
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   // Render table based on active tab
//   const renderTable = () => {
//     switch (activeTab) {
//       case "deferrals":
//         return (
//           <Deferrals
//             hideFilters={true}
//             filters={filters}
//             onExport={exportReport}
//             onDataLoaded={setReportData}
//           />
//         );
//       case "allDCLs":
//         return (
//           <AllDCLsTable
//             filters={filters}
//             onExport={exportReport}
//             onDataLoaded={setReportData}
//           />
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div style={{ padding: isMobile ? "8px 2px" : 16, boxSizing: "border-box" }}>
//       {/* FILTERS */}
//       <ReportsFilters
//         activeTab={activeTab}
//         filters={filters}
//         setFilters={setFilters}
//         clearFilters={clearFilters}
//       />

//       {/* EXPORT BUTTONS */}
//       <Card
//         style={{
//           marginBottom: 16,
//           backgroundColor: "#f5f5f5",
//           border: "1px solid #e0e0e0",
//           borderRadius: 8,
//         }}
//         size="small"
//       >
//         <Row gutter={[12, 12]} align="middle">
//           <Col xs={24} sm="auto">
//             <span style={{ fontWeight: 600, color: "#333", marginRight: 8 }}>
//               Export Report:
//             </span>
//           </Col>
//           <Col xs={24} sm="auto">
//             <Space wrap>
//               <Tooltip title="Download report as PDF with formatted tables">
//                 <Button
//                   type="primary"
//                   icon={<FilePdfOutlined />}
//                   onClick={handlePDFExport}
//                   loading={isGenerating}
//                   danger
//                 >
//                   PDF
//                 </Button>
//               </Tooltip>

//               <Tooltip title="Download report as Excel with summary sheet">
//                 <Button
//                   type="primary"
//                   icon={<FileExcelOutlined />}
//                   onClick={handleExcelExport}
//                   loading={isGenerating}
//                   style={{ backgroundColor: "#52c41a" }}
//                 >
//                   Excel
//                 </Button>
//               </Tooltip>

//               <Tooltip title={showCharts ? "Hide charts" : "View interactive charts"}>
//                 <Button
//                   icon={<BarChartOutlined />}
//                   onClick={() => setShowCharts(!showCharts)}
//                   type={showCharts ? "primary" : "default"}
//                   style={
//                     showCharts ? { backgroundColor: "#1890ff" } : undefined
//                   }
//                 >
//                   {showCharts ? "Hide Charts" : "View Charts"}
//                 </Button>
//               </Tooltip>

//               <Tooltip title="Download as CSV (basic format)">
//                 <Button
//                   icon={<DownloadOutlined />}
//                   onClick={() => {
//                     if (reportData) exportReport(reportData);
//                     else message.warning("No data to export");
//                   }}
//                 >
//                   CSV
//                 </Button>
//               </Tooltip>
//             </Space>
//           </Col>
//         </Row>
//       </Card>

//       {/* CHARTS SECTION */}
//       {showCharts && reportData && (
//         <>
//           <ReportCharts
//             data={reportData}
//             reportType={activeTab}
//             isLoading={isGenerating}
//           />
//           <Divider />
//         </>
//       )}

//       {/* TABS */}
//       <Tabs
//         activeKey={activeTab}
//         onChange={(key) => {
//           setActiveTab(key);
//           setShowCharts(false); // Hide charts when switching tabs
//           clearFilters(); // reset filters when switching tabs
//         }}
//         type="card"
//         style={{ marginBottom: 8 }}
//       >
//         <TabPane
//           key="deferrals"
//           tab={
//             <>
//               <CheckCircleOutlined /> Deferrals
//             </>
//           }
//         />
//         <TabPane
//           key="allDCLs"
//           tab={
//             <>
//               <CheckCircleOutlined /> All DCLs
//             </>
//           }
//         />
//       </Tabs>

//       <Divider style={{ margin: "4px 0" }} />

//       {/* TABLE */}
//       {renderTable()}

//       {/* FOOTER */}
//       <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
//         Generated on {formatDateTime(new Date())}
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Tabs,
  Card,
  Row,
  Col,
  Tooltip,
  Divider,
  Button,
  Table,
  Typography,
  Spin,
  Empty,
  Tag,
} from "antd";
import {
  DownloadOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from "recharts";

import deferralApi from "../../service/deferralApi";
import AllDCLsTable from "./AllDCLsTable";
import ReportsFilters from "./ReportsFilters";
import useReportsFilters from "../../hooks/useReportsFilters";

const { TabPane } = Tabs;
const { Text } = Typography;

const PIE_COLORS = ["#8fd19e", "#243f73"];

const RISK_PRIORITY_ORDER = [
  "Primary Allowable",
  "Primary Non Allowable",
  "Secondary Allowable",
  "Secondary Non Allowable",
];

const ALLOWABLE_NAME_KEYWORDS = [
  "share certificate",
  "search",
  "clean title",
  "valuation",
  "offer letter",
  "land rates",
  "deeds",
  "certificate",
  "title",
  "annual returns",
  "corporate guarantee",
  "personal guarantee",
  "tcc",
];

const formatNumber = (value) => Number(value || 0).toLocaleString();

const safeLower = (value) => String(value || "").trim().toLowerCase();

const parseLoanAmount = (value) => {
  if (typeof value === "number") return value;
  const numeric = String(value || "").replace(/[^\d.-]/g, "");
  return Number(numeric || 0);
};

const getDueDate = (deferral) => {
  if (deferral?.nextDueDate) return dayjs(deferral.nextDueDate);
  if (deferral?.nextDocumentDueDate) return dayjs(deferral.nextDocumentDueDate);
  if (deferral?.expiryDate) return dayjs(deferral.expiryDate);

  const createdAt = deferral?.createdAt ? dayjs(deferral.createdAt) : null;
  const daysSought = Number(deferral?.daysSought || 0);
  if (createdAt && createdAt.isValid() && Number.isFinite(daysSought) && daysSought > 0) {
    return createdAt.add(daysSought, "day");
  }

  return createdAt && createdAt.isValid() ? createdAt : null;
};

const getOverdueDays = (deferral) => {
  const dueDate = getDueDate(deferral);
  if (!dueDate || !dueDate.isValid()) return 0;
  const diff = dayjs().startOf("day").diff(dueDate.startOf("day"), "day");
  return diff > 0 ? diff : 0;
};

const classifyOverdueBucket = (days) => {
  if (days <= 0) return "Not Overdue";
  if (days < 30) return "Less than 30 days";
  if (days <= 90) return "30 to 90 days";
  if (days <= 180) return "91 to 180 days";
  return "Over 180 Days";
};

const classifyExposureRisk = (overdueDays) => {
  if (overdueDays > 180) return "NPL";
  if (overdueDays >= 30) return "WATCH";
  return "NORMAL";
};

const classifyItemCategory = (doc) => {
  const type = safeLower(doc?.type);
  const category = safeLower(doc?.category);
  const name = safeLower(doc?.name);
  const combined = `${type} ${category} ${name}`;

  const isPrimary = combined.includes("primary");
  const isSecondary = combined.includes("secondary");

  if (isPrimary) return "Primary";
  if (isSecondary) return "Secondary";
  return "Secondary";
};

const classifyAllowability = (doc) => {
  const type = safeLower(doc?.type);
  const category = safeLower(doc?.category);
  const name = safeLower(doc?.name);
  const combined = `${type} ${category} ${name}`;

  if (combined.includes("non allowable") || combined.includes("non-allowable") || combined.includes("not allowable")) {
    return "Non Allowable";
  }

  if (combined.includes("allowable")) {
    return "Allowable";
  }

  const isAllowableByName = ALLOWABLE_NAME_KEYWORDS.some((keyword) => name.includes(keyword));
  return isAllowableByName ? "Allowable" : "Non Allowable";
};

const getDocumentEntries = (deferral) => {
  const docs = [];

  if (Array.isArray(deferral?.documents)) {
    deferral.documents.forEach((d) => {
      if (!d) return;
      docs.push({
        name: d.name || d.documentName || d.title || "Unnamed Document",
        type: d.type || d.documentType || "",
        category: d.category || d.documentCategory || "",
      });
    });
  }

  if (Array.isArray(deferral?.selectedDocuments)) {
    deferral.selectedDocuments.forEach((d) => {
      if (!d) return;
      docs.push({
        name: d.name || d.title || "Unnamed Document",
        type: d.type || "",
        category: d.category || "",
      });
    });
  }

  if (!docs.length) {
    docs.push({
      name: deferral?.deferralDescription || "Unspecified Item",
      type: "",
      category: "",
    });
  }

  return docs;
};

function DeferralsDashboard({ rows }) {
  const computed = useMemo(() => {
    if (!rows.length) {
      return {
        overdueTimeRows: [],
        overdueStatusRows: [],
        riskClassificationRows: [],
        rmCountRows: [],
        deferredItemRows: [],
        itemDeferredGroupRows: [],
        riskByCategoryRows: [],
        movementData: [],
        overduePieData: [],
      };
    }

    const now = dayjs();

    const overdueBucketOrder = [
      "Not Overdue",
      "Less than 30 days",
      "30 to 90 days",
      "91 to 180 days",
      "Over 180 Days",
    ];

    const overdueBucketMap = new Map(overdueBucketOrder.map((bucket) => [bucket, 0]));
    const overdueStatusMap = new Map([
      ["Not Overdue", 0],
      ["Over Due", 0],
    ]);

    const riskExposureMap = new Map([
      ["NORMAL", 0],
      ["NPL", 0],
      ["WATCH", 0],
    ]);

    const rmCountMap = new Map();
    const deferredItemMap = new Map();
    const itemDeferredGroupMap = new Map();
    const riskMatrixMap = new Map();

    rows.forEach((deferral) => {
      const overdueDays = getOverdueDays(deferral);
      const overdueBucket = classifyOverdueBucket(overdueDays);
      const overdueStatus = overdueDays > 0 ? "Over Due" : "Not Overdue";

      overdueBucketMap.set(overdueBucket, (overdueBucketMap.get(overdueBucket) || 0) + 1);
      overdueStatusMap.set(overdueStatus, (overdueStatusMap.get(overdueStatus) || 0) + 1);

      const loanAmount = parseLoanAmount(deferral.loanAmount);
      const riskClass = classifyExposureRisk(overdueDays);
      riskExposureMap.set(riskClass, (riskExposureMap.get(riskClass) || 0) + loanAmount);

      const rmName =
        deferral?.createdBy?.name ||
        deferral?.requestor?.name ||
        deferral?.requestedBy?.name ||
        "Unassigned RM";

      if (!rmCountMap.has(rmName)) {
        rmCountMap.set(rmName, { rm: rmName, notOverdue: 0, overDue: 0, total: 0 });
      }
      const rmStats = rmCountMap.get(rmName);
      rmStats.total += 1;
      if (overdueStatus === "Over Due") rmStats.overDue += 1;
      else rmStats.notOverdue += 1;

      const docEntries = getDocumentEntries(deferral);

      docEntries.forEach((doc) => {
        const itemName = doc.name || "Unspecified Item";
        const primarySecondary = classifyItemCategory(doc);
        const allowability = classifyAllowability(doc);
        const riskGroup = `${primarySecondary} ${allowability}`;

        if (!deferredItemMap.has(itemName)) {
          deferredItemMap.set(itemName, { item: itemName, notOverdue: 0, overDue: 0, total: 0 });
        }
        const itemStats = deferredItemMap.get(itemName);
        itemStats.total += 1;
        if (overdueStatus === "Over Due") itemStats.overDue += 1;
        else itemStats.notOverdue += 1;

        const groupKey = `${riskGroup}::${itemName}`;
        if (!itemDeferredGroupMap.has(groupKey)) {
          itemDeferredGroupMap.set(groupKey, {
            group: riskGroup,
            risk: riskGroup,
            item: itemName,
            notOverdue: 0,
            overDue: 0,
            total: 0,
          });
        }
        const groupStats = itemDeferredGroupMap.get(groupKey);
        groupStats.total += 1;
        if (overdueStatus === "Over Due") groupStats.overDue += 1;
        else groupStats.notOverdue += 1;

        if (!riskMatrixMap.has(riskGroup)) {
          riskMatrixMap.set(riskGroup, { group: riskGroup, total: 0, overDue: 0, notOverdue: 0 });
        }
        const riskStats = riskMatrixMap.get(riskGroup);
        riskStats.total += 1;
        if (overdueStatus === "Over Due") riskStats.overDue += 1;
        else riskStats.notOverdue += 1;
      });
    });

    const overdueTimeRows = overdueBucketOrder
      .map((bucket, idx) => {
        const count = overdueBucketMap.get(bucket) || 0;
        return {
          key: `${idx}-${bucket}`,
          bucket,
          count,
        };
      })
      .filter((r) => r.count > 0 || r.bucket === "Not Overdue")
      .map((r) => ({
        ...r,
        pct: rows.length ? Math.round((r.count / rows.length) * 100) : 0,
      }));

    overdueTimeRows.push({
      key: "grand-overdue-time",
      bucket: "Grand Total",
      count: rows.length,
      pct: 100,
    });

    const overdueStatusRows = ["Not Overdue", "Over Due"].map((label) => {
      const count = overdueStatusMap.get(label) || 0;
      return {
        key: label,
        label,
        count,
        pct: rows.length ? Math.round((count / rows.length) * 100) : 0,
      };
    });
    overdueStatusRows.push({ key: "grand-overdue-status", label: "Grand Total", count: rows.length, pct: 100 });

    const riskClassificationRows = ["NORMAL", "NPL", "WATCH"].map((classification) => ({
      key: classification,
      classification,
      exposure: Math.round(riskExposureMap.get(classification) || 0),
    }));
    riskClassificationRows.push({
      key: "grand-risk",
      classification: "Grand Total",
      exposure: riskClassificationRows.reduce((sum, r) => sum + r.exposure, 0),
    });

    const rmCountRows = Array.from(rmCountMap.values())
      .sort((a, b) => b.total - a.total)
      .map((r, idx) => ({ key: `rm-${idx}`, ...r }));
    rmCountRows.push({
      key: "grand-rm",
      rm: "Grand Total",
      notOverdue: rmCountRows.reduce((sum, r) => sum + r.notOverdue, 0),
      overDue: rmCountRows.reduce((sum, r) => sum + r.overDue, 0),
      total: rmCountRows.reduce((sum, r) => sum + r.total, 0),
    });

    const deferredItemRows = Array.from(deferredItemMap.values())
      .sort((a, b) => b.total - a.total)
      .map((r, idx) => ({ key: `item-${idx}`, ...r }));
    deferredItemRows.push({
      key: "grand-item",
      item: "Grand Total",
      notOverdue: deferredItemRows.reduce((sum, r) => sum + r.notOverdue, 0),
      overDue: deferredItemRows.reduce((sum, r) => sum + r.overDue, 0),
      total: deferredItemRows.reduce((sum, r) => sum + r.total, 0),
    });

    const orderIndex = (group) => {
      const idx = RISK_PRIORITY_ORDER.indexOf(group);
      return idx === -1 ? 999 : idx;
    };

    const itemDeferredGroupRows = Array.from(itemDeferredGroupMap.values())
      .sort((a, b) => {
        const orderDiff = orderIndex(a.group) - orderIndex(b.group);
        if (orderDiff !== 0) return orderDiff;
        return b.total - a.total;
      })
      .map((r, idx) => ({ key: `group-${idx}`, ...r }));

    itemDeferredGroupRows.push({
      key: "grand-group",
      group: "Grand Total",
      risk: "",
      item: "",
      notOverdue: itemDeferredGroupRows.reduce((sum, r) => sum + r.notOverdue, 0),
      overDue: itemDeferredGroupRows.reduce((sum, r) => sum + r.overDue, 0),
      total: itemDeferredGroupRows.reduce((sum, r) => sum + r.total, 0),
    });

    const riskByCategoryRows = RISK_PRIORITY_ORDER.map((group) => {
      const item = riskMatrixMap.get(group) || { total: 0, overDue: 0, notOverdue: 0 };
      return {
        key: group,
        group,
        notOverdue: item.notOverdue,
        overDue: item.overDue,
        total: item.total,
      };
    });

    riskByCategoryRows.push({
      key: "grand-risk-by-category",
      group: "Grand Total",
      notOverdue: riskByCategoryRows.reduce((sum, r) => sum + r.notOverdue, 0),
      overDue: riskByCategoryRows.reduce((sum, r) => sum + r.overDue, 0),
      total: riskByCategoryRows.reduce((sum, r) => sum + r.total, 0),
    });

    const monthMap = new Map();
    rows.forEach((d) => {
      const created = d.createdAt ? dayjs(d.createdAt) : null;
      if (!created || !created.isValid()) return;
      const key = created.startOf("month").format("YYYY-MM");
      const monthLabel = created.format("MMM-YY");
      if (!monthMap.has(key)) {
        monthMap.set(key, { key, month: monthLabel, newDeferred: 0, overdue: 0 });
      }
      const monthRow = monthMap.get(key);
      monthRow.newDeferred += 1;
      if (getOverdueDays(d) > 0) monthRow.overdue += 1;
    });

    const monthRows = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));
    let runningTotal = 0;
    let runningOverdue = 0;
    const movementData = monthRows.map((row) => {
      runningTotal += row.newDeferred;
      runningOverdue += row.overdue;
      return {
        month: row.month,
        total: runningTotal,
        historical: runningOverdue,
        newlyDeferred: runningTotal - runningOverdue,
      };
    });

    const overduePieData = [
      { name: "Not Overdue", value: overdueStatusMap.get("Not Overdue") || 0 },
      { name: "Over Due", value: overdueStatusMap.get("Over Due") || 0 },
    ];

    return {
      overdueTimeRows,
      overdueStatusRows,
      riskClassificationRows,
      rmCountRows,
      deferredItemRows,
      itemDeferredGroupRows,
      riskByCategoryRows,
      movementData,
      overduePieData,
    };
  }, [rows]);

  if (!rows.length) {
    return <Empty description="No live deferral data found for the selected filters" style={{ marginTop: 24 }} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <Card title="Overdue Time" size="small" style={{ marginBottom: 16 }}>
            <Table
              size="small"
              pagination={false}
              dataSource={computed.overdueTimeRows}
              columns={[
                { title: "Bucket", dataIndex: "bucket", key: "bucket" },
                { title: "Count", dataIndex: "count", key: "count", align: "right" },
                { title: "% age", dataIndex: "pct", key: "pct", align: "right", render: (v) => `${v}%` },
              ]}
            />
          </Card>

          <Card title="Overdue Status" size="small" style={{ marginBottom: 16 }}>
            <Table
              size="small"
              pagination={false}
              dataSource={computed.overdueStatusRows}
              columns={[
                { title: "Row Labels", dataIndex: "label", key: "label" },
                { title: "Count", dataIndex: "count", key: "count", align: "right" },
                { title: "% age", dataIndex: "pct", key: "pct", align: "right", render: (v) => `${v}%` },
              ]}
            />
          </Card>

          <Card title="Risk Classification" size="small">
            <Table
              size="small"
              pagination={false}
              dataSource={computed.riskClassificationRows}
              columns={[
                { title: "Classification", dataIndex: "classification", key: "classification" },
                {
                  title: "Exposure KES'000",
                  dataIndex: "exposure",
                  key: "exposure",
                  align: "right",
                  render: (v) => formatNumber(v),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card title="Consumer Deferral Movement" size="small" style={{ height: "100%" }}>
            <div style={{ width: "100%", height: 430 }}>
              <ResponsiveContainer>
                <ComposedChart data={computed.movementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" angle={-90} textAnchor="end" height={80} interval={0} />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#243f73" name="Total" barSize={24} />
                  <Line type="monotone" dataKey="historical" stroke="#50c8d3" strokeWidth={3} name="Historical Deferrals" />
                  <Line type="monotone" dataKey="newlyDeferred" stroke="#75b87d" strokeWidth={3} name="New Deferrals" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="RM Count" size="small">
            <Table
              size="small"
              pagination={false}
              dataSource={computed.rmCountRows}
              columns={[
                { title: "RM", dataIndex: "rm", key: "rm" },
                { title: "Not Overdue", dataIndex: "notOverdue", key: "notOverdue", align: "right" },
                { title: "Over Due", dataIndex: "overDue", key: "overDue", align: "right" },
                { title: "Grand Total", dataIndex: "total", key: "total", align: "right" },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title="Deferred Item COUNT" size="small">
            <Table
              size="small"
              pagination={false}
              dataSource={computed.deferredItemRows}
              columns={[
                { title: "Count of Customer Number", dataIndex: "item", key: "item" },
                { title: "Not Overdue", dataIndex: "notOverdue", key: "notOverdue", align: "right" },
                { title: "Over Due", dataIndex: "overDue", key: "overDue", align: "right" },
                { title: "Grand Total", dataIndex: "total", key: "total", align: "right" },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Item Deferred Group Count" size="small" style={{ marginBottom: 16 }}>
            <Table
              size="small"
              pagination={false}
              dataSource={computed.itemDeferredGroupRows}
              columns={[
                {
                  title: "Deferral Categorization",
                  dataIndex: "group",
                  key: "group",
                  render: (v) => {
                    if (v === "Grand Total") return <b>{v}</b>;
                    return (
                      <Tag color={v.includes("Primary") ? "blue" : "green"}>
                        {v}
                      </Tag>
                    );
                  },
                },
                { title: "Item deferred group", dataIndex: "item", key: "item" },
                { title: "Not Overdue", dataIndex: "notOverdue", key: "notOverdue", align: "right" },
                { title: "Over Due", dataIndex: "overDue", key: "overDue", align: "right" },
                { title: "Grand Total", dataIndex: "total", key: "total", align: "right" },
              ]}
            />
          </Card>

          <Card title="Item Deferred Risk Classification" size="small">
            <Table
              size="small"
              pagination={false}
              dataSource={computed.riskByCategoryRows}
              columns={[
                { title: "Risk Priority", dataIndex: "group", key: "group" },
                { title: "Not Overdue", dataIndex: "notOverdue", key: "notOverdue", align: "right" },
                { title: "Over Due", dataIndex: "overDue", key: "overDue", align: "right" },
                { title: "Grand Total", dataIndex: "total", key: "total", align: "right" },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card title="Classification" size="small" style={{ marginBottom: 16 }}>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart
                  data={computed.riskClassificationRows.filter((r) => r.classification !== "Grand Total")}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="classification" width={80} />
                  <RechartsTooltip formatter={(v) => formatNumber(v)} />
                  <Bar dataKey="exposure" fill="#75a65e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Overdue status" size="small">
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={computed.overduePieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={86}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {computed.overduePieData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Text type="secondary">Live system data (deferrals + documents) aggregated in report format.</Text>
    </div>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState("deferrals");
  const [loading, setLoading] = useState(false);
  const [allDeferrals, setAllDeferrals] = useState([]);
  const token = useSelector((state) => state?.auth?.token);

  const { filters, setFilters, clearFilters } = useReportsFilters();

  const fetchLiveDeferrals = async () => {
    setLoading(true);
    try {
      const [pending, approved, returned, mine] = await Promise.all([
        deferralApi.getPendingDeferrals(token).catch(() => []),
        deferralApi.getApprovedDeferrals(token).catch(() => []),
        deferralApi.getReturnedDeferrals(token).catch(() => []),
        deferralApi.getMyDeferrals(token).catch(() => []),
      ]);

      const combined = [
        ...(Array.isArray(pending) ? pending : []),
        ...(Array.isArray(approved) ? approved : []),
        ...(Array.isArray(returned) ? returned : []),
        ...(Array.isArray(mine) ? mine : []),
      ];

      const deduped = Array.from(
        new Map(combined.map((d) => [String(d?._id || d?.id || ""), d])).values(),
      ).filter((d) => !!(d?._id || d?.id));

      setAllDeferrals(deduped);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "deferrals") {
      fetchLiveDeferrals();
    }
  }, [activeTab]);

  const filteredDeferrals = useMemo(() => {
    let rows = [...allDeferrals];

    if (filters.searchText) {
      const q = safeLower(filters.searchText);
      rows = rows.filter((d) => {
        const docNames = getDocumentEntries(d).map((doc) => safeLower(doc.name)).join(" ");
        return (
          safeLower(d.deferralNumber).includes(q) ||
          safeLower(d.customerName).includes(q) ||
          safeLower(d.customerNumber).includes(q) ||
          safeLower(d.dclNo || d.dclNumber).includes(q) ||
          safeLower(d.createdBy?.name).includes(q) ||
          docNames.includes(q)
        );
      });
    }

    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const [start, end] = filters.dateRange;
      rows = rows.filter((d) => {
        const createdAt = d.createdAt ? dayjs(d.createdAt) : null;
        return createdAt && createdAt.isValid() && createdAt.isBetween(start.startOf("day"), end.endOf("day"), null, "[]");
      });
    }

    return rows;
  }, [allDeferrals, filters]);

  const exportReport = (data) => {
    if (!data?.length) return;
    const filename = `${activeTab}_${dayjs().format("YYYYMMDD_HHmmss")}.csv`;

    const keys = Array.from(
      data.reduce((set, row) => {
        Object.keys(row || {}).forEach((k) => set.add(k));
        return set;
      }, new Set()),
    );

    const csvRows = [
      keys.join(","),
      ...data.map((row) => keys.map((k) => JSON.stringify(row?.[k] ?? "")).join(",")),
    ];

    const csv = `data:text/csv;charset=utf-8,${csvRows.join("\n")}`;
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = filename;
    link.click();
  };

  const renderTable = () => {
    switch (activeTab) {
      case "deferrals":
        if (loading) {
          return (
            <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
              <Spin />
            </div>
          );
        }
        return <DeferralsDashboard rows={filteredDeferrals} />;
      case "allDCLs":
        return <AllDCLsTable filters={filters} onExport={exportReport} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between">
          <Col>
            <h2>DCL Reports & Analytics</h2>
          </Col>
          <Col>
            <Tooltip title="Export Report">
              <Button
                icon={<DownloadOutlined />}
                onClick={() => exportReport(filteredDeferrals)}
              />
            </Tooltip>
          </Col>
        </Row>
      </Card>

      <ReportsFilters
        activeTab={activeTab}
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
      />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          clearFilters();
        }}
        type="card"
      >
        <TabPane
          key="deferrals"
          tab={
            <>
              <CheckCircleOutlined /> Deferrals
            </>
          }
        />
        <TabPane
          key="allDCLs"
          tab={
            <>
              <FileTextOutlined /> All DCLs
            </>
          }
        />
      </Tabs>

      <Divider />

      {renderTable()}

      <div style={{ marginTop: 24, fontSize: 12 }}>
        Generated on {dayjs().format("DD/MM/YYYY HH:mm:ss")}
      </div>
    </div>
  );
}