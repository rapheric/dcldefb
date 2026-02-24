import React, { useEffect, useRef, useState } from "react";
import { Modal } from "antd";
import { useDispatch } from "react-redux";
// import { logout } from "../../redux/slices/authSlice"; // Adjust path as needed
import { useNavigate } from "react-router-dom";

const SessionTimeout = ({ timeoutDuration = 15 * 60 * 1000, warningDuration = 30 * 1000 }) => {
    // 15 minutes default timeout, 30 seconds warning before logout
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const timeoutRef = useRef(null);
    const warningTimeoutRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const [isWarningVisible, setIsWarningVisible] = useState(false);
    const [countdown, setCountdown] = useState(warningDuration / 1000);

    const resetTimer = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

        // Show warning before actual timeout
        warningTimeoutRef.current = setTimeout(showWarning, timeoutDuration - warningDuration);
        timeoutRef.current = setTimeout(handleLogout, timeoutDuration);
    };

    const showWarning = () => {
        setIsWarningVisible(true);
        setCountdown(warningDuration / 1000);

        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownIntervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleExtendSession = () => {
        // Clear countdown and hide modal
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setIsWarningVisible(false);
        resetTimer();
    };

    const handleLogout = () => {
        // Clear all timers
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsWarningVisible(false);

        Modal.warning({
            title: "Session Expired",
            content: "You have been logged out due to inactivity.",
            onOk: () => {
                // Perform logout logic
                localStorage.removeItem("token");
                localStorage.removeItem("userId");
                localStorage.removeItem("userRole");
                localStorage.removeItem("userName");

                // If you have a redux action: dispatch(logout());
                // For now, manual clear and redirect

                navigate("/login");
                window.location.reload(); // Ensure clean state
            },
        });
    };

    useEffect(() => {
        const events = [
            "load",
            "mousemove",
            "mousedown",
            "click",
            "scroll",
            "keypress",
        ];

        const handleActivity = () => {
            if (!isWarningVisible) {
                resetTimer();
            }
        };

        // Initial start
        resetTimer();

        // Add listeners
        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [isWarningVisible]);

    // Auto logout when countdown reaches zero
    useEffect(() => {
        if (countdown === 0 && isWarningVisible) {
            handleLogout();
        }
    }, [countdown, isWarningVisible]);

    // Format time for display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <Modal
                title="Session Timeout Warning"
                open={isWarningVisible}
                onOk={handleExtendSession}
                onCancel={handleLogout}
                okText="Extend Session"
                cancelText="Logout Now"
                maskClosable={false}
                centered
                width={400}
            >
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <p style={{ fontSize: '14px', marginBottom: '15px' }}>
                        Your session will expire in:
                    </p>
                    <div
                        style={{
                            fontSize: '48px',
                            fontWeight: 'bold',
                            color: countdown <= 10 ? '#ff4d4f' : '#164679',
                            margin: '15px 0',
                        }}
                    >
                        {formatTime(countdown)}
                    </div>
                    <p style={{ fontSize: '13px', color: '#666' }}>
                        {countdown <= 10
                            ? 'Click "Extend Session" to continue working.'
                            : 'Move your mouse or click to extend your session.'}
                    </p>
                </div>
            </Modal>
        </>
    );
};

export default SessionTimeout;
