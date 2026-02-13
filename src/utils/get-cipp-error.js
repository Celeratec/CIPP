export const getCippError = (data) => {
  if (data.response?.data?.result) {
    return data.response.data.result;
  }
  if (data.response?.data?.error) {
    return data.response.data.error;
  }
  if (data.response?.data?.message) {
    return data.response.data.message;
  }

  if (typeof data.response?.data === "string" && data.response.data.includes("<!DOCTYPE html>")) {
    return data.message;
  }

  if (data.response?.data?.Results) {
    return data.response.data.Results;
  }
  
  if (data.response?.data) {
    return data.response.data;
  }

  // CORS-blocked auth redirect: network error on /api/ call with no response
  // indicates the Azure SWA session has expired and the request was redirected
  // to the identity provider, which failed CORS preflight.
  if (
    !data.response &&
    data.code === "ERR_NETWORK" &&
    data.config?.url?.startsWith("/api/")
  ) {
    return "Your session has expired. Please refresh the page to log in again.";
  }

  if (data.message) {
    return data.message;
  }
};
