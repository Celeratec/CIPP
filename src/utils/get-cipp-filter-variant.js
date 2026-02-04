import { getCippUniqueLicenses } from "./get-cipp-unique-licenses";

export const getCippFilterVariant = (providedColumnKeys, arg) => {
  // Back-compat + new options mode
  const isOptions =
    arg &&
    typeof arg === "object" &&
    (Object.prototype.hasOwnProperty.call(arg, "sampleValue") ||
      Array.isArray(arg?.values) ||
      typeof arg?.getValue === "function");

  const sampleValue = isOptions ? arg.sampleValue : arg;
  const values = isOptions && Array.isArray(arg.values) ? arg.values : undefined;
  const tailKey = providedColumnKeys?.split(".").pop() ?? providedColumnKeys;

  const timeAgoArray = [
    "ExecutedTime",
    "ScheduledTime",
    "Timestamp",
    "DateTime",
    "LastRun",
    "LastRefresh",
    "createdDateTime",
    "activatedDateTime",
    "lastModifiedDateTime",
    "endDateTime",
    "ReceivedTime",
    "Expires",
    "updatedAt",
    "createdAt",
    "Received",
    "Date",
    "WhenCreated",
    "WhenChanged",
  ];
  const matchDateTime =
    /[dD]ate(?:[tT]ime)?|(?:^|\.)(?:updatedAt|createdAt|LastRun|LastRefresh|Expires)$/;

  const typeOf = typeof sampleValue;
  //First key based filters
  switch (tailKey) {
    case "assignedLicenses":
      // Extract unique licenses from the data if available
      let filterSelectOptions = [];
      if (isOptions && arg.dataArray && Array.isArray(arg.dataArray)) {
        const uniqueLicenses = getCippUniqueLicenses(arg.dataArray);
        filterSelectOptions = uniqueLicenses.map((license) => ({
          label: license.displayName,
          value: license.skuId,
        }));
      }

      return {
        filterVariant: "multi-select",
        sortingFn: "alphanumeric",
        filterFn: (row, columnId, filterValue) => {
          const userLicenses = row.original.assignedLicenses;
          const hasLicenses = userLicenses && Array.isArray(userLicenses) && userLicenses.length > 0;
          
          // Handle special "licensed"/"unlicensed" filter values (from preset filters)
          if (filterValue === "licensed") {
            return hasLicenses;
          }
          if (filterValue === "unlicensed") {
            return !hasLicenses;
          }
          
          // Handle array of filter values (could be skuIds or special values)
          if (Array.isArray(filterValue)) {
            if (filterValue.length === 0) {
              return true;
            }
            // Check for special string values first
            if (filterValue.includes("licensed")) {
              return hasLicenses;
            }
            if (filterValue.includes("unlicensed")) {
              return !hasLicenses;
            }
            // Otherwise filter by skuId
            if (!hasLicenses) {
              return false;
            }
            const userSkuIds = userLicenses.map((license) => license.skuId).filter(Boolean);
            return filterValue.some((selectedSkuId) => userSkuIds.includes(selectedSkuId));
          }
          
          // No filter or unrecognized format - show all
          return true;
        },
        filterSelectOptions: filterSelectOptions,
      };
    case "accountEnabled":
      return {
        filterVariant: "select",
        sortingFn: "alphanumeric",
        filterFn: (row, columnId, filterValue) => {
          const rawValue = row.original.accountEnabled;
          const isEnabled = rawValue === true || rawValue === "true" || rawValue === "Yes";
          
          // Handle "Yes"/"No" filter values (from preset filters or column filter dropdown)
          if (filterValue === "Yes" || filterValue === true) {
            return isEnabled;
          }
          if (filterValue === "No" || filterValue === false) {
            return !isEnabled;
          }
          
          // Handle array of filter values
          if (Array.isArray(filterValue)) {
            if (filterValue.length === 0) {
              return true;
            }
            if (filterValue.includes("Yes") || filterValue.includes(true)) {
              return isEnabled;
            }
            if (filterValue.includes("No") || filterValue.includes(false)) {
              return !isEnabled;
            }
          }
          
          // No filter or empty - show all
          return true;
        },
      };
    case "primDomain":
      return {
        filterVariant: "select",
        sortingFn: "alphanumeric",
        filterFn: "includes",
      };
    case "number":
      return {
        filterVariant: "range",
        sortingFn: "number",
        filterFn: "betweenInclusive",
      };
    case "id":
      return {
        filterVariant: "text",
        sortingFn: "alphanumeric",
        filterFn: "includes",
      };
  }
  //Type based filters
  if (typeOf === "boolean") {
    return {
      filterVariant: "select",
      sortingFn: "boolean",
      filterFn: "equals",
    };
  }

  if (typeOf === "number") {
    return {
      filterVariant: "range",
      sortingFn: "number",
      filterFn: "betweenInclusive",
    };
  }

  if (timeAgoArray.includes(tailKey) || matchDateTime.test(providedColumnKeys)) {
    return {
      filterVariant: "datetime-range",
      sortingFn: "dateTimeNullsLast",
      filterFn: "betweenInclusive",
    };
  }
};
