import React from "react";
import {
  MenuOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { Dropdown, message, Modal, Menu } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../api/authSlice";
import { useNavigate } from "react-router-dom";

const Navbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const [logoutSessionId, setLogoutSessionId] = React.useState(null);
  const [showVerificationModal, setShowVerificationModal] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);

  // Dashboard navigation items based on user role
  const getDashboardItems = () => {
    const role = user?.role?.toLowerCase();
    const items = [];

    // Define dashboard items with bold styling (ALL CAPS)
    const dashboardOptions = {
      creator: { key: "/cocreator", label: "CREATOR DASHBOARD", icon: <HomeOutlined /> },
      rm: { key: "/rm", label: "RM DASHBOARD", icon: <HomeOutlined /> },
      checker: { key: "/cochecker", label: "CHECKER DASHBOARD", icon: <HomeOutlined /> },
      admin: { key: "/admin", label: "ADMIN DASHBOARD", icon: <HomeOutlined /> },
      approver: { key: "/approver", label: "APPROVER DASHBOARD", icon: <HomeOutlined /> },
    };

    switch (role) {
      case "cocreator":
      case "co_creator":
      case "creator":
        items.push(dashboardOptions.creator);
        break;
      case "rm":
        items.push(dashboardOptions.rm);
        break;
      case "cochecker":
      case "checker":
        items.push(dashboardOptions.checker);
        break;
      case "admin":
        items.push(dashboardOptions.admin);
        break;
      case "approver":
        items.push(dashboardOptions.approver);
        break;
      default:
        break;
    }
    return items;
  };

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = async () => {
    try {
      // Call the backend logout endpoint to initiate verification process
      const response = await fetch("http://localhost:5000/api/admin/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to initiate logout");
      }

      const data = await response.json();
      setLogoutSessionId(data.sessionId);
      setShowVerificationModal(true);
      message.info("Verification code sent to your email");
    } catch (error) {
      console.error("Logout error:", error);
      // If API fails, allow local logout anyway
      dispatch(logout());
      message.success("Logged out successfully");
      navigate("/login");
    }
  };

  const handleVerifyLogout = async () => {
    if (!verificationCode || !logoutSessionId) {
      message.error("Please enter the verification code");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/auth/verify-logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: logoutSessionId,
          code: verificationCode,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid verification code");
      }

      // Verification successful, complete logout
      dispatch(logout());
      setShowVerificationModal(false);
      message.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Verification error:", error);
      message.error(error.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const menuItems = [
    {
      key: "profile",
      label: "Profile",
      icon: <UserOutlined />,
    },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Responsive values
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 375;
  const navPadding = isMobile ? '0 8px' : '0 24px';
  const dashboardItems = getDashboardItems();

  return (
    <div
      style={{
        height: isMobile ? 56 : 60,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: navPadding,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        borderBottom: "1px solid #f0f0f0",
        zIndex: 1000,
        flexShrink: 0,
      }}
    >
      {/* Left section: Menu toggle and Dashboard links */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 20 }}>
        <div onClick={toggleSidebar} style={{ cursor: "pointer" }}>
          <MenuOutlined style={{ fontSize: isMobile ? 20 : 24 }} />
        </div>

        {/* Dashboard Navigation Menu */}
        {dashboardItems.length > 0 && !isMobile && (
          <Menu
            mode="horizontal"
            items={dashboardItems}
            onClick={handleMenuClick}
            selectedKeys={[window.location.pathname]}
            style={{
              border: "none",
              minWidth: 240,
              fontSize: 16,
              fontWeight: 800,
              color: "#2B1C67",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          />
        )}
      </div>

      {/* Right section: Notifications and User */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 20 }}>
        <BellOutlined style={{ fontSize: isMobile ? 18 : 20, cursor: "pointer" }} />

        <Dropdown
          menu={{ items: menuItems }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <UserOutlined style={{ fontSize: isMobile ? 16 : 18 }} />
            {!isMobile && <span style={{ fontWeight: 500 }}>{user?.name || "User"}</span>}
          </div>
        </Dropdown>
      </div>

      {/* Email Verification Modal */}
      <Modal
        title="Logout Verification"
        open={showVerificationModal}
        onCancel={() => setShowVerificationModal(false)}
        loading={isVerifying}
        okText="Verify & Logout"
        cancelText="Cancel"
        onOk={handleVerifyLogout}
      >
        <p>A verification code has been sent to your email.</p>
        <p>Please enter the 6-digit code below:</p>
        <input
          type="text"
          placeholder="Enter 6-digit code"
          maxLength="6"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: "16px",
            letterSpacing: "6px",
            textAlign: "center",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            marginTop: "12px",
          }}
        />
      </Modal>
    </div>
  );
};

export default Navbar;
