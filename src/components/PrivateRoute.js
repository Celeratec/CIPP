import { useRef } from "react";
import { ApiGetCall } from "../api/ApiCall.jsx";
import UnauthenticatedPage from "../pages/unauthenticated.js";
import LoadingPage from "../pages/loading.js";
import ApiOfflinePage from "../pages/api-offline.js";

export const PrivateRoute = ({ children, routeType }) => {
  // Track if we've ever been authenticated to prevent flashing Access Denied during refetch
  const wasAuthenticated = useRef(false);

  const session = ApiGetCall({
    url: "/.auth/me",
    queryKey: "authmeswa",
    refetchOnWindowFocus: true,
    staleTime: 120000, // 2 minutes
  });

  const apiRoles = ApiGetCall({
    url: "/api/me",
    queryKey: "authmecipp",
    retry: 2,
    staleTime: 60000, // 1 minute - cache API roles to prevent unnecessary refetches
    waiting: !session.isSuccess || session.data?.clientPrincipal === null,
  });

  // Check if the session is still loading before determining authentication status
  // Also show loading during refetch if we have no previous data
  if (
    session.isLoading ||
    apiRoles.isLoading ||
    (apiRoles.isFetching && !apiRoles.data)
  ) {
    return <LoadingPage />;
  }

  // Check if the API is offline (404 error from /api/me endpoint)
  // Or other network errors that would indicate API is unavailable
  if (
    apiRoles?.error?.response?.status === 404 || // API endpoint not found
    apiRoles?.error?.response?.status === 502 || // Bad Gateway
    apiRoles?.error?.response?.status === 503 || // Service Unavailable
    (apiRoles?.isSuccess && !apiRoles?.data) // No client principal data, indicating API might be offline
  ) {
    return <ApiOfflinePage />;
  }

  // If not logged into SWA
  if (session?.data?.clientPrincipal === null || session?.data === undefined) {
    // Only show unauthenticated if we weren't previously authenticated
    // This prevents flash when the session is being validated
    if (!wasAuthenticated.current) {
      return <UnauthenticatedPage />;
    }
    // If we were authenticated before, show loading while state settles
    return <LoadingPage />;
  }

  // Handle user detail mismatch - trigger refetch but don't block rendering
  if (
    session?.isSuccess &&
    apiRoles?.isSuccess &&
    apiRoles?.data?.clientPrincipal !== undefined &&
    session?.data?.clientPrincipal?.userDetails &&
    apiRoles?.data?.clientPrincipal?.userDetails &&
    session?.data?.clientPrincipal?.userDetails !== apiRoles?.data?.clientPrincipal?.userDetails
  ) {
    // Refetch in background, don't block
    apiRoles.refetch();
  }

  // Extract roles - handle refetch state gracefully
  let roles = null;

  if (apiRoles?.data?.clientPrincipal !== null && apiRoles?.data !== undefined) {
    roles = apiRoles?.data?.clientPrincipal?.userRoles ?? [];
  } else {
    // During refetch, if we were previously authenticated, show loading instead of unauthenticated
    if (wasAuthenticated.current || apiRoles.isFetching) {
      return <LoadingPage />;
    }
    return <UnauthenticatedPage />;
  }

  if (roles === null) {
    if (wasAuthenticated.current) {
      return <LoadingPage />;
    }
    return <UnauthenticatedPage />;
  }

  const blockedRoles = ["anonymous", "authenticated"];
  const userRoles = roles?.filter((role) => !blockedRoles.includes(role)) ?? [];
  const isAuthenticated = userRoles.length > 0 && !apiRoles?.error;
  const isAdmin = roles?.includes("admin") || roles?.includes("superadmin");

  if (routeType === "admin" && !isAdmin) {
    return <UnauthenticatedPage />;
  }

  if (!isAuthenticated) {
    // If we were previously authenticated, this might be a transient state
    if (wasAuthenticated.current) {
      return <LoadingPage />;
    }
    return <UnauthenticatedPage />;
  }

  // Mark as successfully authenticated
  wasAuthenticated.current = true;
  
  return children;
};
