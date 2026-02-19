import React, { useState, useMemo } from "react";
import { Button, message, Card, Space, Typography, Row, Col, Statistic, Tooltip } from "antd";
import { UserAddOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import UserTable from "./UserTable";
import CreateUserDrawer from "./CreateUserModal";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useToggleActiveMutation,
  useChangeRoleMutation,
} from "../../api/userApi";

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const { data: users = [], isLoading, refetch } = useGetUsersQuery();
  const [createUser] = useCreateUserMutation();
  const [toggleActive] = useToggleActiveMutation();
  const [changeRole] = useChangeRoleMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.active).length;
  const inactiveUsers = totalUsers - activeUsers;
  const adminUsers = users.filter(u => u.role === "admin").length;
  const customerUsers = users.filter(u => u.role === "customer").length;
  const approverUsers = users.filter(u => u.role === "approver").length;
  const coCreatorUsers = users.filter(u => u.role === "cocreator").length;
  const rmUsers = users.filter(u => u.role === "rm").length;
  const coCheckerUsers = users.filter(u => u.role === "cochecker").length;

  // Chart data
  const usersByRoleData = useMemo(() => [
    { name: "Admin", value: adminUsers, fill: "#1e3a8a" },
    { name: "Approver", value: approverUsers, fill: "#3b82f6" },
    { name: "Customer", value: customerUsers, fill: "#60a5fa" },
  ], [adminUsers, approverUsers, customerUsers]);

  const userStatusData = useMemo(() => [
    { name: "Week 1", active: Math.floor(activeUsers * 0.8), inactive: Math.floor(inactiveUsers * 0.6) },
    { name: "Week 2", active: Math.floor(activeUsers * 0.85), inactive: Math.floor(inactiveUsers * 0.7) },
    { name: "Week 3", active: Math.floor(activeUsers * 0.9), inactive: Math.floor(inactiveUsers * 0.5) },
    { name: "Week 4", active: activeUsers, inactive: inactiveUsers },
  ], [activeUsers, inactiveUsers]);

  const roleDistributionData = useMemo(() => [
    { name: "Admin", users: adminUsers },
    { name: "Approver", users: approverUsers },
    { name: "Customer", users: customerUsers },
  ], [adminUsers, approverUsers, customerUsers]);

  const handleCreateUser = async () => {
    try {
      await createUser(formData).unwrap();
      message.success("User created successfully!");
      setDrawerOpen(false);
      setFormData({ name: "", email: "", password: "", role: "customer" });
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to create user");
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await toggleActive(id).unwrap();
      message.success("User status updated");
      refetch();
    } catch (err) {
      message.error("Failed to update status", err);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await changeRole({ id, role }).unwrap();
      message.success("User role updated");
      refetch();
    } catch (err) {
      message.error("Failed to update role", err);
    }
  };

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
                📊 Admin Dashboard
              </Title>
              <Text style={{ color: "#e0e7ff", fontSize: "14px" }}>
                Monitor system analytics and user management
              </Text>
            </div>
          </Col>
          <Col>
            <Tooltip title="Refresh data">
              <Button
                icon={<ReloadOutlined />}
                size="large"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white"
                }}
                onClick={() => {
                  refetch();
                  message.success("Data refreshed!");
                }}
              />
            </Tooltip>
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
                background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
                height: "100%",
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
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <UserOutlined style={{ color: "white", fontSize: 14 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: "9px", fontWeight: 500 }}>
                    Total Users
                  </Text>
                  <Statistic
                    value={totalUsers}
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
                height: "100%",
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
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <CheckCircleOutlined style={{ color: "white", fontSize: 14 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: "9px", fontWeight: 500 }}>
                    Active Users
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
                background: "linear-gradient(135deg, #ffffff 0%, #fefce8 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
                height: "100%",
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
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <ClockCircleOutlined style={{ color: "white", fontSize: 14 }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: "9px", fontWeight: 500 }}>
                    Inactive Users
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

          {/* Admin Count Card */}
          <div style={{ flex: 1, minWidth: "120px" }}>
            <Card
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
                height: "100%",
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
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <UserAddOutlined style={{ color: "white", fontSize: 14 }} />
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
                height: "100%",
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
                  borderRadius: "6px",
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
                height: "100%",
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
                  borderRadius: "6px",
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

          {/* Co Creator Card */}
          <div style={{ flex: 1, minWidth: "120px" }}>
            <Card
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
                height: "100%",
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
                  borderRadius: "6px",
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

          {/* RM Card */}
          <div style={{ flex: 1, minWidth: "120px" }}>
            <Card
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #fce7f3 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
                height: "100%",
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
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <UserAddOutlined style={{ color: "white", fontSize: 14 }} />
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

          {/* Co Checker Card */}
          <div style={{ flex: 1, minWidth: "120px" }}>
            <Card
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #ffffff 0%, #dbeafe 100%)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: "2px",
                height: "100%",
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
                  borderRadius: "6px",
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

        {/* ACTION BUTTONS */}
        <Row gutter={16} style={{ marginBottom: 32 }}>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<UserAddOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)",
                border: "none",
                fontWeight: "600",
                height: 40,
                paddingLeft: 24,
                paddingRight: 24,
              }}
            >
              Create New User
            </Button>
          </Col>
        </Row>

        {/* USERS TABLE CARD */}
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
              👥 User Management
            </Title>
            <Text type="secondary" style={{ fontSize: "13px" }}>
              View, edit, and manage all system users
            </Text>
          </div>
          <UserTable
            users={users}
            onToggleActive={handleToggleActive}
            loading={isLoading}
          />
        </Card>
      </div>

      {/* CREATE USER DRAWER */}
      <CreateUserDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onCreate={handleCreateUser}
      />
    </div>
  );
};

export default AdminDashboard;
