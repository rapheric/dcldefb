import React from "react";
import { Card, Row, Col, Input, DatePicker, Select, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ReportsFilters({
  activeTab,
  filters,
  setFilters,
  clearFilters,
}) {
  return (
    <Card
      size="small"
      style={{ marginBottom: 12, background: "#fafafa", padding: "8px 12px" }}
    >
      <Row gutter={[12, 12]} align="middle" justify="space-between">
        {/* Left Section - Deferral Filter */}
        {activeTab !== "allDCLs" && (
          <Col xs={24} sm={12} md={10}>
            <RangePicker
              style={{ width: "100%" }}
              placeholder={["Start Date", "End Date"]}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              size="middle"
            />
          </Col>
        )}

        {/* Right Section - DCL Filter */}
        {activeTab === "allDCLs" && (
          <Col xs={24} sm={12} md={10}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Search by DCL No, Customer..."
                  value={filters.searchText}
                  onChange={(e) =>
                    setFilters({ ...filters, searchText: e.target.value })
                  }
                  allowClear
                  size="middle"
                />
              </Col>
              <Col>
                <Select
                  style={{ width: 200 }}
                  placeholder="Filter by status"
                  value={filters.status}
                  onChange={(value) =>
                    setFilters({ ...filters, status: value })
                  }
                  size="middle"
                >
                  <Option value="">All Statuses</Option>
                  <Option value="Pending">Pending</Option>
                  <Option value="CoCreatorReview">Co-Creator Review</Option>
                  <Option value="RMReview">RM Review</Option>
                  <Option value="CoCheckerReview">Co-Checker Review</Option>
                  <Option value="Approved">Approved</Option>
                  <Option value="Rejected">Rejected</Option>
                  <Option value="Active">Active</Option>
                  <Option value="Completed">Completed</Option>
                  <Option value="Revived">Revived</Option>
                  <Option value="Deferred">Deferred</Option>
                </Select>
              </Col>
              <Col>
                <Button onClick={clearFilters} size="middle">
                  Clear
                </Button>
              </Col>
            </Row>
          </Col>
        )}
      </Row>
    </Card>
  );
}
