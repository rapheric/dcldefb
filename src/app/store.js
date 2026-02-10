import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../api/authApi";
import { userApi } from "../api/userApi";
import { logApi } from "../api/logApi"; // <-- added logApi
import { auditApi } from "../api/auditApi"; // <-- added auditApi
import { checklistApi } from "../api/checklistApi";
import { mfaApi } from "../api/mfaApi"; // <-- added mfaApi
import { ssoApi } from "../api/ssoApi"; // <-- added ssoApi
import authReducer from "../api/authSlice";
import { extensionApi } from "../api/extensionApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [checklistApi.reducerPath]: checklistApi.reducer,
    [logApi.reducerPath]: logApi.reducer, // <-- added logApi reducer
    [auditApi.reducerPath]: auditApi.reducer, // <-- added auditApi reducer
    [mfaApi.reducerPath]: mfaApi.reducer, // <-- added mfaApi reducer
    [ssoApi.reducerPath]: ssoApi.reducer, // <-- added ssoApi reducer
    [extensionApi.reducerPath]: extensionApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      userApi.middleware,
      checklistApi.middleware,
      logApi.middleware, // <-- added logApi middleware
      auditApi.middleware, // <-- added auditApi middleware
      mfaApi.middleware, // <-- added mfaApi middleware
      ssoApi.middleware, // <-- added ssoApi middleware
      extensionApi.middleware,
    ),
  devTools: true,
});
