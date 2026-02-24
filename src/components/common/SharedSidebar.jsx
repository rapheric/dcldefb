import React from "react";
import { Menu } from "antd";
import ncbabanklogo from "../../assets/ncbabanklogo.png";
import { getSidebarWidth } from "../../utils/sidebarUtils";

const SIDEBAR_BG = "#2B1C67";
const BORDER_COLOR = "rgba(255,255,255,0.15)";
const HOVER_BG = "rgba(255,255,255,0.1)";

const SharedSidebar = ({
    selectedKey,
    setSelectedKey,
    onMenuItemClick,
    collapsed,
    toggleCollapse,
    menuItems,
}) => {
    // Handle click: prefer specific handler, then default to setting key
    const handleClick = (e) => {
        if (onMenuItemClick) {
            onMenuItemClick(e);
        } else if (setSelectedKey) {
            setSelectedKey(e.key);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                height: "100vh",
                width: getSidebarWidth(collapsed),
                background: SIDEBAR_BG,
                transition: "width 0.2s cubic-bezier(0.2, 0, 0, 1) 0s",
                display: "flex",
                flexDirection: "column",
                zIndex: 1000,
                boxShadow: "2px 0 10px rgba(0,0,0,0.15)",
                color: "white",
            }}
        >
            {/* Logo Section - NCBA Logo aligned with navbar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 60,
                    borderBottom: `1px solid ${BORDER_COLOR}`,
                    padding: "0 10px",
                    background: "linear-gradient(180deg, rgba(22, 70, 121, 0.3) 0%, rgba(22, 70, 121, 0.1) 50%, transparent 100%)",
                }}
            >
                <div style={{ position: "relative" }}>
                    {/* Gradient glow effect behind logo */}
                    <div
                        style={{
                            position: "absolute",
                            inset: -8,
                            background: "radial-gradient(circle, rgba(22, 70, 121, 0.4) 0%, transparent 70%)",
                            borderRadius: "50%",
                            filter: "blur(8px)",
                            zIndex: 0,
                        }}
                    />
                    <img
                        src={ncbabanklogo}
                        alt="NCBA Logo"
                        style={{
                            position: "relative",
                            width: collapsed ? 40 : 70,
                            height: collapsed ? 40 : 70,
                            transition: "all 0.2s",
                            filter: "brightness(0) invert(1) drop-shadow(0 2px 8px rgba(22, 70, 121, 0.5))",
                            objectFit: "contain",
                            zIndex: 1,
                        }}
                    />
                </div>
            </div>

            {/* Divider line below logo */}
            <div
                style={{
                    height: "1px",
                    background: "linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)",
                    margin: "0 15px",
                }}
            />

            {/* Menu Section */}
            <div style={{ flex: 1, overflowY: "auto", marginTop: 15 }}>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    onClick={handleClick}
                    inlineCollapsed={collapsed}
                    items={menuItems}
                    style={{
                        background: "transparent",
                        borderRight: "none",
                        fontSize: 15,
                    }}
                />
            </div>

            {/* Footer / Copyright */}
            {!collapsed && (
                <div
                    style={{
                        padding: 16,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.6)",
                        borderTop: `1px solid ${BORDER_COLOR}`,
                        textAlign: "center",
                    }}
                >
                    © {new Date().getFullYear()} NCBA Bank
                </div>
            )}

            {/* Collapse Toggle */}
            <div style={{ padding: 12 }}>
                <button
                    onClick={toggleCollapse}
                    style={{
                        width: "100%",
                        padding: "8px",
                        border: "none",
                        borderRadius: 6,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: HOVER_BG, // Use consistent variable
                        color: "#fff",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {collapsed ? ">" : "< Collapse"}
                </button>
            </div>
        </div>
    );
};

export default SharedSidebar;
