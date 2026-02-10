import React, { useState, useEffect } from "react";
import "./MFAVerification.css";

/**
 * MFA Verification Component
 * Displays MFA verification form during login
 */
const MFAVerification = ({ mfaSessionToken, onVerify, onBack, isLoading }) => {
  const [code, setCode] = useState("");
  const [method, setMethod] = useState("totp");
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onBack]);

  const handleSubmit = () => {
    if (!code || code.length < 4) {
      setError("Please enter a valid code");
      return;
    }

    onVerify({
      mfaToken: code,
      method: method,
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mfa-verification-container">
      <div className="mfa-verification-card">
        <div className="mfa-verification-header">
          <h2>Enter Verification Code</h2>
          <p>Your session expires in {formatTime(timeRemaining)}</p>
        </div>

        <div className="method-selector">
          <label
            className={`method-option ${method === "totp" ? "active" : ""}`}
          >
            <input
              type="radio"
              name="method"
              value="totp"
              checked={method === "totp"}
              onChange={(e) => {
                setMethod(e.target.value);
                setError("");
              }}
            />
            <span>Authenticator App</span>
          </label>

          <label
            className={`method-option ${method === "backup" ? "active" : ""}`}
          >
            <input
              type="radio"
              name="method"
              value="backup"
              checked={method === "backup"}
              onChange={(e) => {
                setMethod(e.target.value);
                setError("");
              }}
            />
            <span>Backup Code</span>
          </label>
        </div>

        <div className="mfa-input-group">
          {method === "totp" ? (
            <>
              <label>Enter 6-digit code from your authenticator app</label>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="mfa-verification-input"
                disabled={isLoading}
                autoFocus
              />
            </>
          ) : (
            <>
              <label>Enter one of your backup codes</label>
              <input
                type="text"
                placeholder="XXXXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mfa-verification-input"
                disabled={isLoading}
                autoFocus
              />
            </>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={isLoading || (method === "totp" && code.length !== 6)}
        >
          {isLoading ? "Verifying..." : "Verify"}
        </button>

        <button className="btn-link" onClick={onBack} disabled={isLoading}>
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default MFAVerification;
