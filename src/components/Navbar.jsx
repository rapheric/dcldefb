import React from "react";
import {
  MenuOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Dropdown, message } from "antd";
import { useDispatch } from "react-redux";
import { logout } from "../api/authSlice";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const Navbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    message.success("Logged out successfully");
    navigate("/login");
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

  return (
    <div
      style={{
        height: 60,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        borderBottom: "1px solid #f0f0f0",
        zIndex: 1000,
        flexShrink: 0, // Ensure it doesn't shrink in flex columns
      }}
    >
      <div onClick={toggleSidebar} style={{ cursor: "pointer" }}>
        <MenuOutlined style={{ fontSize: 24 }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />

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
            <UserOutlined style={{ fontSize: 18 }} />
            <span style={{ fontWeight: 500 }}>{user?.name || "User"}</span>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default Navbar;
