
import React, { useState } from "react";
import { Tabs, Card, Row, Col, Tooltip, Divider, Button } from "antd";
import {
  DownloadOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { formatDateTime } from "../../utils/checklistUtils";

import Deferrals from "./Deferrals";
import AllDCLsTable from "./AllDCLsTable";
import ReportsFilters from "./ReportsFilters";
import useReportsFilters from "../../hooks/useReportsFilters";

const { TabPane } = Tabs;

export default function Reports() {
  const [activeTab, setActiveTab] = useState("deferrals");
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

  // Render table based on active tab
  const renderTable = () => {
    switch (activeTab) {
      case "deferrals":
        return <Deferrals hideFilters={true} filters={filters} onExport={exportReport} />;
      case "allDCLs":
        return <AllDCLsTable filters={filters} onExport={exportReport} />;
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

      {/* TABS */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
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
