import React, { useState, useEffect } from "react";
import {
  useGetSSOProvidersQuery,
  useInitializeSSOLoginMutation,
} from "../api/ssoApi";
import "./SSOLogin.css";

/**
 * SSO Login Component
 * Displays available SSO providers and handles SSO login
 */
const SSOLogin = ({ onSuccess }) => {
  const { data: ssoStatus, isLoading } = useGetSSOProvidersQuery();
  const [initializeLogin] = useInitializeSSOLoginMutation();
  const [selectedProviders, setSelectedProviders] = useState(new Set());

  useEffect(() => {
    // Load available providers
    if (ssoStatus?.availableProviders) {
      const providerIds = new Set(
        ssoStatus.availableProviders.map((p) => p.id),
      );
      setSelectedProviders(providerIds);
    }
  }, [ssoStatus]);

  const handleLoginWithProvider = async (providerId) => {
    try {
      const result = await initializeLogin({
        ssoProviderId: providerId,
        redirectUri: `${window.location.origin}/auth/sso/callback`,
      }).unwrap();

      // Redirect to provider's authorization URL
      window.location.href = result.authorizationUrl;
    } catch (err) {
      console.error("SSO initialization failed:", err);
      alert(err?.data?.message || "Failed to initialize SSO login");
    }
  };

  if (isLoading) {
    return <div className="sso-login">Loading SSO options...</div>;
  }

  const providers = ssoStatus?.availableProviders || [];

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="sso-login">
      <div className="sso-divider">
        <span>Or continue with</span>
      </div>

      <div className="sso-providers">
        {providers.map((provider) => (
          <button
            key={provider.id}
            className="sso-provider-btn"
            onClick={() => handleLoginWithProvider(provider.id)}
            title={provider.displayName || provider.providerName}
          >
            {provider.iconUrl ? (
              <img src={provider.iconUrl} alt={provider.providerName} />
            ) : (
              <span>
                {provider.displayName?.charAt(0) ||
                  provider.providerName.charAt(0)}
              </span>
            )}
            <span className="provider-name">
              {provider.displayName || provider.providerName}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SSOLogin;
