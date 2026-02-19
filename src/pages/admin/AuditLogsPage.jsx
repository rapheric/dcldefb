import React, { useState, useMemo } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Button,
  Statistic,
  Row,
  Col,
  Select,
  message,
  Tooltip,
  Modal,
  Descriptions,
} from "antd";
import {
  DownloadOutlined,
  UserOutlined,
  FileTextOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from "recharts";
import { useGetUsersQuery } from "../../api/userApi";
import dayjs from "dayjs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const { Title, Text } = Typography;

const AuditLogsPage = () => {
  const { data: users = [], isLoading, refetch } = useGetUsersQuery();
  const [selectedRole, setSelectedRole] = useState("all");
  const [downloadLoading, setDownloadLoading] = useState({});
  const [viewActivityModalOpen, setViewActivityModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Generate PDF for user activity
  const generateUserActivityPDF = async (user) => {
    try {
      setDownloadLoading((prev) => ({ ...prev, [user._id]: true }));
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Header
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("User Activity Report", 14, 20);
      
      // User Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      let yPos = 45;
      doc.text(`User: ${user.name}`, 14, yPos);
      yPos += 8;
      doc.text(`Email: ${user.email}`, 14, yPos);
      yPos += 8;
      doc.text(`Role: ${user.role}`, 14, yPos);
      yPos += 8;
      doc.text(`Status: ${user.active ? "Active" : "Inactive"}`, 14, yPos);
      yPos += 8;
      doc.text(`Joined: ${dayjs(user.createdAt).format("YYYY-MM-DD HH:mm:ss")}`, 14, yPos);
      yPos += 8;
      doc.text(`Last Updated: ${dayjs(user.updatedAt).format("YYYY-MM-DD HH:mm:ss")}`, 14, yPos);
      yPos += 15;
      
      // Activity summary table
      const activityData = [
        ["Activity", "Details"],
        ["Login Activity", `Last login: ${dayjs(user.updatedAt).format("YYYY-MM-DD")}`],
        ["Account Status", user.active ? "Active" : "Inactive"],
        ["Role Assignment", user.role],
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [activityData[0]],
        body: activityData.slice(1),
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 10,
        },
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        margin: { left: 14, right: 14 },
      });
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated on ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`,
        14,
        pageHeight - 10
      );
      
      // Download
      doc.save(`${user.name}_activity_${dayjs().format("YYYY-MM-DD")}.pdf`);
      message.success(`Downloaded activity report for ${user.name}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to download activity report");
    } finally {
      setDownloadLoading((prev) => ({ ...prev, [user._id]: false }));
    }
  };

  // Count users by role
  const usersByRole = useMemo(() => ({
    all: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    cocreator: users.filter((u) => u.role === "cocreator").length,
    cochecker: users.filter((u) => u.role === "cochecker").length,
    customer: users.filter((u) => u.role === "customer").length,
    rm: users.filter((u) => u.role === "rm").length,
  }), [users]);

  // Filter users by selected role
  const filteredUsers = useMemo(() => 
    selectedRole === "all"
      ? users
      : users.filter((u) => u.role === selectedRole),
    [users, selectedRole]
  );

  // Calculate statistics
  const totalLogs = filteredUsers.length;
  const activeUsers = filteredUsers.filter(u => u.active).length;
  const inactiveUsers = totalLogs - activeUsers;
  const adminUsers = filteredUsers.filter(u => u.role === "admin").length;
  const approverUsers = filteredUsers.filter(u => u.role === "approver").length;
  const customerUsers = filteredUsers.filter(u => u.role === "customer").length;
  const coCreatorUsers = filteredUsers.filter(u => u.role === "cocreator").length;
  const rmUsers = filteredUsers.filter(u => u.role === "rm").length;
  const coCheckerUsers = filteredUsers.filter(u => u.role === "cochecker").length;

  // Chart data - User activity by role
  const userActivityData = useMemo(() => {
    const roles = ["admin", "cocreator", "cochecker", "customer", "rm"];
    return roles.map(role => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      users: usersByRole[role] || 0,
    }));
  }, [usersByRole]);

  // Pie chart data for role distribution
  const roleDistributionData = useMemo(() => {
    const roleColors = {
      "Admin": "#1e3a8a",
      "Cocreator": "#3b82f6",
      "Cochecker": "#60a5fa",
      "Customer": "#93c5fd",
      "Rm": "#bfdbfe",
    };
    return userActivityData.map(item => ({
      ...item,
      fill: roleColors[item.name] || "#d1d5db",
    }));
  }, [userActivityData]);

  // Activity trend data
  const activityTrendData = useMemo(() => [
    { day: "Mon", logs: Math.floor(totalLogs * 0.7) },
    { day: "Tue", logs: Math.floor(totalLogs * 0.8) },
    { day: "Wed", logs: Math.floor(totalLogs * 0.9) },
    { day: "Thu", logs: totalLogs },
    { day: "Fri", logs: Math.floor(totalLogs * 0.85) },
    { day: "Sat", logs: Math.floor(totalLogs * 0.6) },
    { day: "Sun", logs: Math.floor(totalLogs * 0.4) },
  ], [totalLogs]);

  const getRoleColor = (role) => {
    const colors = {
      admin: "red",
      cocreator: "green",
      cochecker: "purple",
      customer: "blue",
      rm: "orange",
    };
    return colors[role] || "default";
  };

  const columns = [
    {
      title: <Space><UserOutlined /> Name</Space>,
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, record) => (
        <Space>
          <div style={{
            width: 32,
            height: 32,
            background: "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px"
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      filters: [
        { text: "Admin", value: "admin" },
        { text: "CO Creator", value: "cocreator" },
        { text: "CO Checker", value: "cochecker" },
        { text: "Customer", value: "customer" },
        { text: "RM", value: "rm" },
      ],
      onFilter: (value, record) => record.role === value,
      render: (role) => (
        <Tag color={getRoleColor(role)} className="capitalize">
          {role}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "status",
      render: (active) => (
        <Tag color={active ? "success" : "default"}>
          {active ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Joined Date",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => (
        <Tooltip title={dayjs(date).format("YYYY-MM-DD HH:mm:ss")}>
          <Text>{dayjs(date).format("YYYY-MM-DD")}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Last Activity",
      dataIndex: "updatedAt",
      key: "lastActivity",
      sorter: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      render: (date) => (
        <Tooltip title={dayjs(date).format("YYYY-MM-DD HH:mm:ss")}>
          <Text type="secondary">{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space>
          <Tooltip title="View activity details">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setSelectedUser(record);
                setViewActivityModalOpen(true);
              }}
              style={{
                background: "#3b82f6",
                border: "none"
              }}
            >
              View
            </Button>
          </Tooltip>
          <Tooltip title="Download activity report">
            <Button
              type="link"
              icon={<DownloadOutlined />}
              loading={downloadLoading[record._id]}
              onClick={() => generateUserActivityPDF(record)}
              size="small"
            >
              Download
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      {/* TOP HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
        padding: "24px 32px",
        borderBottom: "1px solid #e0e7ff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div>
              <Title level={2} style={{ color: "white", margin: 0, marginBottom: 4 }}>
                📋 Audit Logs
              </Title>
              <Text style={{ color: "#e0e7ff", fontSize: "14px" }}>
                Track user activities and generate detailed reports
              </Text>
            </div>
          </Col>
          <Col>
            <Space>
              <Select
                value={selectedRole}
                onChange={setSelectedRole}
                style={{ width: 160 }}
                options={[
                  { value: "all", label: `All (${usersByRole.all})` },
                  { value: "admin", label: `Admin (${usersByRole.admin})` },
                  { value: "cocreator", label: `CO Creator (${usersByRole.cocreator})` },
                  { value: "cochecker", label: `CO Checker (${usersByRole.cochecker})` },
                  { value: "customer", label: `Customer (${usersByRole.customer})` },
                  { value: "rm", label: `RM (${usersByRole.rm})` },
                ]}
              />
              <Tooltip title="Refresh data">
                <Button
                  icon={<ReloadOutlined />}
                  size="large"
                  onClick={() => {
                    refetch();
                    message.success("Data refreshed!");
                  }}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "white"
                  }}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ padding: "32px" }}>

        {/* STATISTICS CARDS */}
        <div style={{ display: "flex", gap: "8px", marginBottom: 24, flexWrap: "nowrap", overflowX: "auto" }}>

          {/* Total Users Card */}
          <div style={{ flex: 1, minWidth: "120px" }}>
            <Card
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(30, 58, 138, 0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Space direction="vertical" size={0} style={{ width: "100%" }}>
                <div style={{
                  width: 28,
                  height: 28,
                  background: "linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <FileTextOutlined style={{ color: "white", fontSize: 14 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: "9px", fontWeight: 500 }}>
                    Total
                  </Text>
                  <Statistic
                    value={totalLogs}
                    style={{ color: "#1e3a8a" }}
                    valueStyle={{ fontSize: 18, fontWeight: 700, color: "#1e3a8a" }}
                  />
                </div>
              </Space>
            </Card>
          </div>

          {/* Active Users Card */}
          <div style={{ flex: 1, minWidth: "120px" }}>
            <Card
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(34, 197, 94, 0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Space direction="vertical" size={0} style={{ width: "100%" }}>
                <div style={{
                  width: 28,
                  height: 28,
                  background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <EyeOutlined style={{ color: "white", fontSize: 14 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: "9px", fontWeight: 500 }}>
                    Active
                  </Text>
                  <Statistic
                    value={activeUsers}
                    style={{ color: "#15803d" }}
                    valueStyle={{ fontSize: 18, fontWeight: 700, color: "#15803d" }}
                  />
                </div>
              </Space>
            </Card>
          </div>

          {/* Inactive Users Card */}
          <div style={{ flex: 1, minWidth: "120px" }}>
            <Card
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(202, 138, 4, 0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Space direction="vertical" size={0} style={{ width: "100%" }}>
                <div style={{
                  width: 28,
                  height: 28,
                  background: "linear-gradient(135deg, #ca8a04 0%, #92400e 100%)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <FileTextOutlined style={{ color: "white", fontSize: 14 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: "9px", fontWeight: 500 }}>
                    Inactive
                  </Text>
                  <Statistic
                    value={inactiveUsers}
                    style={{ color: "#92400e" }}
                    valueStyle={{ fontSize: 18, fontWeight: 700, color: "#92400e" }}
                  />
                </div>
              </Space>
            </Card>
          </div>

          {/* Admins Card */}
          <div style={{ flex: 1, minWidth: "120px" }}>
            <Card
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(236, 72, 153, 0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Space direction="vertical" size={0} style={{ width: "100%" }}>
                <div style={{
                  width: 28,
                  height: 28,
                  background: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <UserOutlined style={{ color: "white", fontSize: 14 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: "9px", fontWeight: 500 }}>
                    Admins
                  </Text>
                  <Statistic
                    value={adminUsers}
                    style={{ color: "#be185d" }}
                    valueStyle={{ fontSize: 18, fontWeight: 700, color: "#be185d" }}
                  />
                </div>
              </Space>
            </Card>
          </div>

          {/* Approvers Card */}
          <div style={{ flex: 1, minWidth: "120px" }}>
            <Card
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(59, 130, 246, 0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Space direction="vertical" size={0} style={{ width: "100%" }}>
                <div style={{
                  width: 28,
                  height: 28,
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <CheckCircleOutlined style={{ color: "white", fontSize: 14 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: "9px", fontWeight: 500 }}>
                    Approvers
                  </Text>
                  <Statistic
                    value={approverUsers}
                    style={{ color: "#1d4ed8" }}
                    valueStyle={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8" }}
                  />
                </div>
              </Space>
            </Card>
          </div>

          {/* Customers Card */}
          <div style={{ flex: 1, minWidth: "120px" }}>
            <Card
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(217, 119, 6, 0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Space direction="vertical" size={0} style={{ width: "100%" }}>
                <div style={{
                  width: 28,
                  height: 28,
                  background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <UserOutlined style={{ color: "white", fontSize: 14 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: "9px", fontWeight: 500 }}>
                    Customers
                  </Text>
                  <Statistic
                    value={customerUsers}
                    style={{ color: "#b45309" }}
                    valueStyle={{ fontSize: 18, fontWeight: 700, color: "#b45309" }}
                  />
                </div>
              </Space>
            </Card>
          </div>

          {/* Co Creators Card */}
          <div style={{ flex: 1, minWidth: "120px" }}>
            <Card
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(6, 182, 212, 0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Space direction="vertical" size={0} style={{ width: "100%" }}>
                <div style={{
                  width: 28,
                  height: 28,
                  background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <UserOutlined style={{ color: "white", fontSize: 14 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: "9px", fontWeight: 500 }}>
                    Co Creators
                  </Text>
                  <Statistic
                    value={coCreatorUsers}
                    style={{ color: "#0891b2" }}
                    valueStyle={{ fontSize: 18, fontWeight: 700, color: "#0891b2" }}
                  />
                </div>
              </Space>
            </Card>
          </div>

          {/* RMs Card */}
          <div style={{ flex: 1, minWidth: "120px" }}>
            <Card
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #fce7f3 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(168, 85, 247, 0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Space direction="vertical" size={0} style={{ width: "100%" }}>
                <div style={{
                  width: 28,
                  height: 28,
                  background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <UserOutlined style={{ color: "white", fontSize: 14 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: "9px", fontWeight: 500 }}>
                    RMs
                  </Text>
                  <Statistic
                    value={rmUsers}
                    style={{ color: "#7c3aed" }}
                    valueStyle={{ fontSize: 18, fontWeight: 700, color: "#7c3aed" }}
                  />
                </div>
              </Space>
            </Card>
          </div>

          {/* Co Checkers Card */}
          <div style={{ flex: 1, minWidth: "120px" }}>
            <Card
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #dbeafe 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(59, 130, 246, 0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Space direction="vertical" size={0} style={{ width: "100%" }}>
                <div style={{
                  width: 28,
                  height: 28,
                  background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <CheckCircleOutlined style={{ color: "white", fontSize: 14 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: "9px", fontWeight: 500 }}>
                    Co Checkers
                  </Text>
                  <Statistic
                    value={coCheckerUsers}
                    style={{ color: "#1e40af" }}
                    valueStyle={{ fontSize: 18, fontWeight: 700, color: "#1e40af" }}
                  />
                </div>
              </Space>
            </Card>
          </div>

        </div>

        {/* CHARTS */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* Activity Trend - Line Chart */}
          <Col xs={24} md={12}>
            <Card
              style={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                  📈 Weekly Activity Trend
                </Title>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  User activity logs by day
                </Text>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={activityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <ChartTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="logs" 
                    stroke="#3b82f6" 
                    dot={{ fill: "#3b82f6", r: 4 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Role Distribution - Pie Chart */}
          <Col xs={24} md={12}>
            <Card
              style={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                  👥 Users by Role
                </Title>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Current distribution across roles
                </Text>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={roleDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, users }) => `${name}: ${users}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="users"
                  >
                    {roleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* ACTIVITY LOGS TABLE */}
        <Card
          style={{
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            padding: "24px",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <Title level={4} style={{ margin: 0, color: "#1f2937" }}>
              📝 Activity Logs
            </Title>
            <Text type="secondary" style={{ fontSize: "13px" }}>
              Detailed tracking of user activities in the system
            </Text>
          </div>
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="_id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} records`,
            }}
            style={{ marginTop: 16 }}
          />
        </Card>

        {/* VIEW ACTIVITY MODAL */}
        <Modal
          open={viewActivityModalOpen}
          onCancel={() => {
            setViewActivityModalOpen(false);
            setSelectedUser(null);
          }}
          footer={null}
          centered
          width={1100}
          bodyStyle={{ maxHeight: "80vh", overflowY: "auto" }}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <EyeOutlined style={{ fontSize: "18px", color: "#3b82f6" }} />
              <span>User Activity Details & Logs</span>
            </div>
          }
        >
          {selectedUser && (
            <div style={{ background: "#f5f7fa", padding: "24px", borderRadius: "8px" }}>
              {/* User Info Section */}
              <Card style={{ marginBottom: "24px", border: "1px solid #e5e7eb" }}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12} md={6}>
                    <div>
                      <Text type="secondary" style={{ fontSize: "12px", fontWeight: "600" }}>NAME</Text>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937", marginTop: "4px" }}>
                        {selectedUser.name}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div>
                      <Text type="secondary" style={{ fontSize: "12px", fontWeight: "600" }}>EMAIL</Text>
                      <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                        {selectedUser.email}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div>
                      <Text type="secondary" style={{ fontSize: "12px", fontWeight: "600" }}>ROLE</Text>
                      <div style={{ marginTop: "4px" }}>
                        <Tag color={getRoleColor(selectedUser.role)} className="capitalize">
                          {selectedUser.role}
                        </Tag>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div>
                      <Text type="secondary" style={{ fontSize: "12px", fontWeight: "600" }}>STATUS</Text>
                      <div style={{ marginTop: "4px" }}>
                        <Tag color={selectedUser.active ? "success" : "default"}>
                          {selectedUser.active ? "Active" : "Inactive"}
                        </Tag>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Key Metrics */}
              <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
                <Col xs={24} sm={12} md={8}>
                  <Card size="small" style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)", border: "1px solid #bae6fd" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "#0369a1", fontWeight: "600", marginBottom: "8px" }}>LAST LOGIN</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#0c4a6e" }}>
                        {dayjs(selectedUser.updatedAt).format("MMM DD, YYYY")}
                      </div>
                      <div style={{ fontSize: "12px", color: "#0369a1", marginTop: "4px" }}>
                        {dayjs(selectedUser.updatedAt).fromNow()}
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card size="small" style={{ background: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)", border: "1px solid #bbf7d0" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "#15803d", fontWeight: "600", marginBottom: "8px" }}>MEMBER SINCE</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#166534" }}>
                        {dayjs(selectedUser.createdAt).format("MMM DD, YYYY")}
                      </div>
                      <div style={{ fontSize: "12px", color: "#15803d", marginTop: "4px" }}>
                        {dayjs().diff(dayjs(selectedUser.createdAt), 'days')} days ago
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card size="small" style={{ background: "linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)", border: "1px solid #fbcfe8" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "#be185d", fontWeight: "600", marginBottom: "8px" }}>ACCOUNT AGE</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#831843" }}>
                        {Math.floor(dayjs().diff(dayjs(selectedUser.createdAt), 'months'))} months
                      </div>
                      <div style={{ fontSize: "12px", color: "#be185d", marginTop: "4px" }}>
                        {dayjs(selectedUser.createdAt).format("MMM YYYY")}
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Activity Timeline */}
              <div style={{ marginBottom: "24px" }}>
                <Title level={5} style={{ marginBottom: "16px", color: "#1f2937", display: "flex", alignItems: "center", gap: "8px" }}>
                  📋 Activity Timeline
                </Title>
                <Card style={{ border: "1px solid #e5e7eb" }}>
                  <Table
                    columns={[
                      {
                        title: "Activity Type",
                        dataIndex: "type",
                        key: "type",
                        width: 200,
                        render: (type) => {
                          const icons = {
                            login: "🔓",
                            logout: "🔒",
                            created: "✨",
                            updated: "✏️",
                            activated: "✅",
                            deactivated: "❌",
                          };
                          return `${icons[type] || "📌"} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
                        },
                      },
                      {
                        title: "Timestamp",
                        dataIndex: "timestamp",
                        key: "timestamp",
                        width: 200,
                        render: (timestamp) => (
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937" }}>
                              {dayjs(timestamp).format("MMM DD, YYYY")}
                            </div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              {dayjs(timestamp).format("HH:mm:ss")}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: "Time Ago",
                        dataIndex: "timestamp",
                        key: "timeAgo",
                        width: 150,
                        render: (timestamp) => (
                          <Text style={{ color: "#3b82f6", fontWeight: "500" }}>
                            {dayjs(timestamp).fromNow()}
                          </Text>
                        ),
                      },
                      {
                        title: "Details",
                        dataIndex: "details",
                        key: "details",
                        render: (details) => (
                          <Text type="secondary" style={{ fontSize: "13px" }}>
                            {details}
                          </Text>
                        ),
                      },
                    ]}
                    dataSource={[
                      {
                        key: 1,
                        type: "updated",
                        timestamp: selectedUser.updatedAt,
                        details: `Last activity recorded`,
                      },
                      {
                        key: 2,
                        type: "created",
                        timestamp: selectedUser.createdAt,
                        details: `Account created by administrator`,
                      },
                      {
                        key: 3,
                        type: "activated",
                        timestamp: selectedUser.createdAt,
                        details: `Account activation`,
                      },
                    ]}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </div>

              {/* User Metadata */}
              <Card style={{ marginBottom: "24px", background: "#ffffff", border: "1px solid #e5e7eb" }}>
                <Title level={5} style={{ marginBottom: "16px", color: "#1f2937" }}>
                  ℹ️ Account Information
                </Title>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="User ID">
                    <Text code>{selectedUser._id}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Account Status">
                    <Tag color={selectedUser.active ? "success" : "default"}>
                      {selectedUser.active ? "Active" : "Inactive"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Created At" span={2}>
                    {dayjs(selectedUser.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Last Modified" span={2}>
                    {dayjs(selectedUser.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
                  </Descriptions.Item>
                  {selectedUser.customerNumber && (
                    <Descriptions.Item label="Customer Number" span={2}>
                      <Tag color="blue">{selectedUser.customerNumber}</Tag>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>

              {/* Download Button */}
              <div style={{ textAlign: "right", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    generateUserActivityPDF(selectedUser);
                    setViewActivityModalOpen(false);
                  }}
                  loading={downloadLoading[selectedUser._id]}
                  size="large"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)",
                    border: "none",
                    fontWeight: "600",
                  }}
                >
                  Download Full Activity Report
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default AuditLogsPage;
