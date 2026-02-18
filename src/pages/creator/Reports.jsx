import React, { useState } from "react";
import { Tabs, Card, Row, Col, Tooltip, Divider, Button, Space, message } from "antd";
import {
  DownloadOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { formatDateTime } from "../../utils/checklistUtils";
import {
  generatePDFReport,
  generateExcelReport,
} from "../../utils/reportGenerator";
import ReportCharts from "../../components/reports/ReportCharts";

import Deferrals from "./Deferrals";
import AllDCLsTable from "./AllDCLsTable";
import ReportsFilters from "./ReportsFilters";
import useReportsFilters from "../../hooks/useReportsFilters";

const { TabPane } = Tabs;

export default function Reports() {
  const [activeTab, setActiveTab] = useState("deferrals");
  const [showCharts, setShowCharts] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobile] = React.useState(window.innerWidth <= 375);

  // Filter hook
  const { filters, setFilters, clearFilters } = useReportsFilters();

  // Export CSV
  const exportReport = (data) => {
    if (!data?.length) return;
    const filename = `${activeTab}_${dayjs().format("YYYYMMDD_HHmmss")}.csv`;
    const csv =
      "data:text/csv;charset=utf-8," +
      data.map((row) => Object.values(row).join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = filename;
    link.click();
  };

  // Handle PDF Export
  const handlePDFExport = () => {
    if (!reportData || reportData.length === 0) {
      message.warning("No data to export. Please load data first.");
      return;
    }
    try {
      setIsGenerating(true);
      generatePDFReport(reportData, activeTab, filters);
      message.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      message.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Excel Export
  const handleExcelExport = () => {
    if (!reportData || reportData.length === 0) {
      message.warning("No data to export. Please load data first.");
      return;
    }
    try {
      setIsGenerating(true);
      generateExcelReport(reportData, activeTab, filters);
      message.success("Excel file downloaded successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      message.error("Failed to generate Excel");
    } finally {
      setIsGenerating(false);
    }
  };

  // Render table based on active tab
  const renderTable = () => {
    switch (activeTab) {
      case "deferrals":
        return (
          <Deferrals
            hideFilters={true}
            filters={filters}
            onExport={exportReport}
            onDataLoaded={setReportData}
          />
        );
      case "allDCLs":
        return (
          <AllDCLsTable
            filters={filters}
            onExport={exportReport}
            onDataLoaded={setReportData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: isMobile ? "8px 2px" : 16, boxSizing: "border-box" }}>
      {/* FILTERS */}
      <ReportsFilters
        activeTab={activeTab}
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
      />

      {/* EXPORT BUTTONS */}
      <Card
        style={{
          marginBottom: 16,
          backgroundColor: "#f5f5f5",
          border: "1px solid #e0e0e0",
          borderRadius: 8,
        }}
        size="small"
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm="auto">
            <span style={{ fontWeight: 600, color: "#333", marginRight: 8 }}>
              Export Report:
            </span>
          </Col>
          <Col xs={24} sm="auto">
            <Space wrap>
              <Tooltip title="Download report as PDF with formatted tables">
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={handlePDFExport}
                  loading={isGenerating}
                  danger
                >
                  PDF
                </Button>
              </Tooltip>

              <Tooltip title="Download report as Excel with summary sheet">
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  onClick={handleExcelExport}
                  loading={isGenerating}
                  style={{ backgroundColor: "#52c41a" }}
                >
                  Excel
                </Button>
              </Tooltip>

              <Tooltip title={showCharts ? "Hide charts" : "View interactive charts"}>
                <Button
                  icon={<BarChartOutlined />}
                  onClick={() => setShowCharts(!showCharts)}
                  type={showCharts ? "primary" : "default"}
                  style={
                    showCharts ? { backgroundColor: "#1890ff" } : undefined
                  }
                >
                  {showCharts ? "Hide Charts" : "View Charts"}
                </Button>
              </Tooltip>

              <Tooltip title="Download as CSV (basic format)">
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    if (reportData) exportReport(reportData);
                    else message.warning("No data to export");
                  }}
                >
                  CSV
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* CHARTS SECTION */}
      {showCharts && reportData && (
        <>
          <ReportCharts
            data={reportData}
            reportType={activeTab}
            isLoading={isGenerating}
          />
          <Divider />
        </>
      )}

      {/* TABS */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          setShowCharts(false); // Hide charts when switching tabs
          clearFilters(); // reset filters when switching tabs
        }}
        type="card"
        style={{ marginBottom: 8 }}
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
              <CheckCircleOutlined /> All DCLs
            </>
          }
        />
      </Tabs>

      <Divider style={{ margin: "4px 0" }} />

      {/* TABLE */}
      {renderTable()}

      {/* FOOTER */}
      <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
        Generated on {formatDateTime(new Date())}
      </div>
    </div>
  );
}
