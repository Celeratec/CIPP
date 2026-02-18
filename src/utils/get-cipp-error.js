export const getCippError = (data) => {
  const d = data.response?.data;

  if (d?.result) {
    return d.result;
  }
  // Backend PowerShell hashtables serialize with PascalCase keys ("Error"),
  // while some endpoints use lowercase ("error"). Check both.
  if (d?.error || d?.Error) {
    return d.error || d.Error;
  }
  if (d?.message) {
    return d.message;
  }

  if (typeof d === "string" && d.includes("<!DOCTYPE html>")) {
    return data.message;
  }

  if (d?.Results) {
    return d.Results;
  }

  if (d) {
    return d;
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
