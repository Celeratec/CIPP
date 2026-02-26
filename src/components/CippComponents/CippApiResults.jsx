import { Close, Download, ExpandMore, ExpandLess } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  Typography,
  Box,
  SvgIcon,
  Tooltip,
  keyframes,
} from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import { useEffect, useState, useMemo, useCallback } from "react";
import { getCippError } from "../../utils/get-cipp-error";
import { CippCopyToClipBoard } from "./CippCopyToClipboard";
import { CippCodeBlock } from "./CippCodeBlock";
import React from "react";
import { CippTableDialog } from "./CippTableDialog";
import { EyeIcon } from "@heroicons/react/24/outline";
import { useDialog } from "../../hooks/use-dialog";

const extractAllResults = (data) => {
  const results = [];

  const getSeverity = (text) => {
    if (typeof text !== "string") return "success";
    return /error|failed|exception|not found|invalid_grant/i.test(text) ? "error" : "success";
  };

  const processResultItem = (item) => {
    if (typeof item === "string") {
      return {
        text: item,
        copyField: item,
        severity: getSeverity(item),
      };
    }

    if (item && typeof item === "object") {
      const text = item.resultText || "";
      const copyField = item.copyField || "";
      const severity =
        typeof item.state === "string" ? item.state : getSeverity(item) ? "error" : "success";
      const details = item.details || null;

      if (text) {
        return {
          text,
          copyField,
          severity,
          details,
          ...item,
        };
      }
    }
    return null;
  };

  const extractFrom = (obj) => {
    if (!obj) return;

    if (Array.isArray(obj)) {
      obj.forEach((item) => extractFrom(item));
      return;
    }

    if (typeof obj === "string") {
      results.push({ text: obj, copyField: obj, severity: getSeverity(obj) });
      return;
    }

    if (obj?.resultText) {
      const processed = processResultItem(obj);
      if (processed) {
        results.push(processed);
      }
    } else {
      const ignoreKeys = ["metadata", "Metadata", "severity"];

      if (typeof obj === "object") {
        Object.keys(obj).forEach((key) => {
          const value = obj[key];
          if (ignoreKeys.includes(key)) return;
          if (["Results", "Result", "results", "result"].includes(key)) {
            if (Array.isArray(value)) {
              value.forEach((valItem) => {
                const processed = processResultItem(valItem);
                if (processed) {
                  results.push(processed);
                } else {
                  extractFrom(valItem);
                }
              });
            } else if (typeof value === "object") {
              const processed = processResultItem(value);
              if (processed) {
                results.push(processed);
              } else {
                extractFrom(value);
              }
            } else if (typeof value === "string") {
              results.push({
                text: value,
                copyField: value,
                severity: getSeverity(value),
              });
            }
          } else {
            extractFrom(value);
          }
        });
      }
    }
  };

  extractFrom(data);
  return results;
};

// Format result messages for readability
const FormattedResultText = ({ text, severity }) => {
  if (typeof text !== "string") {
    return <Typography variant="body2">{String(text)}</Typography>;
  }

  // Pattern: SharePoint token / CPV error — render structured guidance
  const isSharePointTokenError =
    text.includes("Failed to obtain a SharePoint token") ||
    text.includes("SharePoint denied access");
  if (isSharePointTokenError) {
    const colonIdx = text.indexOf(":");
    const preamble =
      colonIdx > 0 && colonIdx < 80 ? text.slice(0, colonIdx) : null;
    const detail = preamble ? text.slice(colonIdx + 1).trim() : text;
    return (
      <Stack spacing={1}>
        {preamble && (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {preamble}
          </Typography>
        )}
        <Typography variant="body2">{detail}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
          Suggested steps:
        </Typography>
        <Typography variant="body2" component="div">
          <ol style={{ margin: 0, paddingLeft: "1.2em" }}>
            <li>
              Run a <strong>CPV Refresh</strong> for this tenant from the tenant overview page
            </li>
            <li>Verify the site does not have restricted or unique permissions in SharePoint</li>
            <li>
              If the issue persists, check that the CIPP SAM app has the necessary SharePoint
              delegated permissions
            </li>
          </ol>
        </Typography>
      </Stack>
    );
  }

  // Pattern: error with Diagnostics section from backend policy checks
  if (text.includes("Diagnostics:")) {
    const [prelude, ...diagParts] = text.split(/Diagnostics:\s*/);
    const diagText = diagParts.join("Diagnostics: ");

    const preludeMatch = prelude.trim().match(/^(.+?)\.\s*Error:\s*(.+)$/s);
    const heading = preludeMatch ? preludeMatch[1] : null;
    const errorDetail = preludeMatch ? preludeMatch[2].trim() : prelude.trim();

    const diagItems = diagText
      .split(/\n\n|\r?\n(?=\[)/)
      .map((s) => s.trim())
      .filter(Boolean);

    const parseDiagItem = (item) => {
      const catMatch = item.match(/^\[([^\]]+)\]\s*/);
      const category = catMatch ? catMatch[1] : null;
      const rest = catMatch ? item.slice(catMatch[0].length) : item;

      const riskMatch = rest.match(/\s*Risk\((error|warning|info)\):\s*(.*?)(?:\s*CIPP Settings:\s*(\S+)\s*)?$/s);
      if (riskMatch) {
        const message = rest.slice(0, riskMatch.index).trim();
        return {
          category,
          message,
          riskSeverity: riskMatch[1],
          riskText: riskMatch[2].trim(),
          settingsPath: riskMatch[3] || null,
        };
      }

      const settingsMatch = rest.match(/\s*CIPP Settings:\s*(\S+)\s*$/);
      const message = settingsMatch ? rest.slice(0, settingsMatch.index).trim() : rest.trim();
      const settingsPath = settingsMatch ? settingsMatch[1] : null;
      return { category, message, settingsPath, riskSeverity: null, riskText: null };
    };

    return (
      <Stack spacing={1.5}>
        {heading && (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {heading}
          </Typography>
        )}
        {errorDetail && (
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {errorDetail}
          </Typography>
        )}
        {diagItems.length > 0 && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
              Diagnostics:
            </Typography>
            <Stack spacing={1.5}>
              {diagItems.map((item, i) => {
                const { category, message, settingsPath, riskSeverity, riskText } =
                  parseDiagItem(item);
                return (
                  <Box key={i}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                      {category && (
                        <Chip
                          label={category}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem", height: 20 }}
                        />
                      )}
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {message}
                    </Typography>
                    {riskSeverity && riskText && (
                      <Alert
                        severity={riskSeverity}
                        variant="outlined"
                        sx={{ mt: 1, mb: 0.5 }}
                      >
                        <AlertTitle>
                          {riskSeverity === "error"
                            ? "High Risk"
                            : riskSeverity === "warning"
                              ? "Security Consideration"
                              : "Note"}
                        </AlertTitle>
                        <Typography variant="body2">{riskText}</Typography>
                      </Alert>
                    )}
                    {settingsPath && (
                      <Button
                        href={settingsPath}
                        size="small"
                        variant="outlined"
                        startIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                        sx={{
                          textTransform: "none",
                          fontSize: "0.75rem",
                          mt: 0.5,
                        }}
                      >
                        Open CIPP Settings
                      </Button>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </>
        )}
      </Stack>
    );
  }

  // Pattern: "Failed to X. Error: Y" or "Successfully X. Message: Y"
  const errorSplit = text.match(/^(.+?)\.\s*Error:\s*(.+)$/s);
  if (errorSplit) {
    return (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {errorSplit[1]}
        </Typography>
        <Typography
          variant="body2"
          sx={{ mt: 0.5, opacity: 0.9, wordBreak: "break-word" }}
        >
          {errorSplit[2]}
        </Typography>
      </Box>
    );
  }

  // Pattern: quoted names like 'SiteName' or "SiteName" — bold them
  const hasQuotedNames = /['"][^'"]+['"]/.test(text);
  if (hasQuotedNames) {
    const parts = text.split(/(['"][^'"]+['"])/g);
    return (
      <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
        {parts.map((part, i) =>
          /^['"]/.test(part) ? (
            <strong key={i}>{part}</strong>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </Typography>
    );
  }

  return (
    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
      {text}
    </Typography>
  );
};

export const CippApiResults = (props) => {
  const { apiObject, errorsOnly = false, alertSx = {} } = props;

  const [errorVisible, setErrorVisible] = useState(false);
  const [fetchingVisible, setFetchingVisible] = useState(false);
  const [finalResults, setFinalResults] = useState([]);
  const [showDetails, setShowDetails] = useState({});
  const tableDialog = useDialog();
  const pageTitle = `${document.title} - Results`;
  const correctResultObj = useMemo(() => {
    if (!apiObject.isSuccess) return;

    const data = apiObject?.data;
    const dataData = data?.data;
    if (dataData !== undefined && dataData !== null) {
      if (dataData?.Results) {
        return dataData.Results;
      } else if (typeof dataData === "object" && dataData !== null && !("metadata" in dataData)) {
        return dataData;
      } else if (typeof dataData === "string") {
        return dataData;
      } else {
        return "This API has not sent the correct output format.";
      }
    }
    if (data?.Results) {
      return data.Results;
    } else if (typeof data === "object" && data !== null && !("metadata" in data)) {
      return data;
    } else if (typeof data === "string") {
      return data;
    }

    return "This API has not sent the correct output format.";
  }, [apiObject]);

  const allResults = useMemo(() => {
    const apiResults = extractAllResults(correctResultObj);

    // Also extract error results if there's an error
    if (apiObject.isError && apiObject.error) {
      const errorResults = extractAllResults(apiObject.error.response.data);
      if (errorResults.length > 0) {
        // Mark all error results with error severity and merge with success results
        return [...apiResults, ...errorResults.map((r) => ({ ...r, severity: "error" }))];
      }

      // Fallback to getCippError if extraction didn't work
      const processedError = getCippError(apiObject.error);
      if (typeof processedError === "string") {
        return [
          ...apiResults,
          { text: processedError, copyField: processedError, severity: "error" },
        ];
      }
    }

    return apiResults;
  }, [correctResultObj, apiObject.isError, apiObject.error]);

  useEffect(() => {
    setErrorVisible(!!apiObject.isError);

    if (apiObject.isFetching || (apiObject.isIdle === false && apiObject.isPending === true)) {
      setFetchingVisible(true);
    } else {
      setFetchingVisible(false);
    }
    if (!errorsOnly) {
      if (allResults.length > 0) {
        setFinalResults(
          allResults.map((res, index) => ({
            id: index,
            text: res.text,
            copyField: res.copyField,
            severity: res.severity,
            visible: true,
            ...res,
          }))
        );
      } else {
        setFinalResults([]);
      }
    }
  }, [
    apiObject.isError,
    apiObject.isFetching,
    apiObject.isPending,
    apiObject.isIdle,
    allResults,
    errorsOnly,
  ]);

  const handleCloseResult = useCallback((id) => {
    setFinalResults((prev) => prev.map((r) => (r.id === id ? { ...r, visible: false } : r)));
  }, []);

  const toggleDetails = useCallback((id) => {
    setShowDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleDownloadCsv = useCallback(() => {
    if (!finalResults?.length) return;

    const baseName = document.title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const fileName = `${baseName}-results.csv`;

    const headers = Object.keys(finalResults[0]);
    const rows = finalResults.map((item) =>
      headers.map((header) => `"${item[header] || ""}"`).join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [finalResults, apiObject]);

  const hasVisibleResults = finalResults.some((r) => r.visible);
  return (
    <Stack spacing={2}>
      {/* Loading alert */}
      {!errorsOnly && (
        <Collapse in={fetchingVisible} unmountOnExit>
          <Alert
            sx={alertSx}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setFetchingVisible(false)}
              >
                <Close fontSize="inherit" />
              </IconButton>
            }
            variant="outlined"
            severity="info"
          >
            <Typography variant="body2">
              <CircularProgress size={20} /> Loading...
            </Typography>
          </Alert>
        </Collapse>
      )}
      {/* Individual result alerts */}
      {hasVisibleResults && (
        <>
          {finalResults.map((resultObj) => (
            <React.Fragment key={resultObj.id}>
              <Collapse in={resultObj.visible} unmountOnExit>
                <Alert
                  sx={{
                    ...alertSx,
                    display: "flex",
                    width: "100%",
                    "& .MuiAlert-message": {
                      width: "100%",
                      flex: "1 1 auto",
                      minWidth: 0, // Allows content to shrink
                    },
                    "& .MuiAlert-action": {
                      flex: "0 0 auto",
                      alignSelf: "flex-start",
                      marginLeft: "auto",
                    },
                  }}
                  variant="filled"
                  severity={resultObj.severity || "success"}
                  action={
                    <>
                      <CippCopyToClipBoard
                        color="inherit"
                        text={resultObj.copyField || resultObj.text}
                      />

                      {resultObj.details && (
                        <Tooltip
                          title={showDetails[resultObj.id] ? "Hide Details" : "Show Details"}
                        >
                          <IconButton
                            size="small"
                            color="inherit"
                            onClick={() => toggleDetails(resultObj.id)}
                            aria-label={showDetails[resultObj.id] ? "Hide Details" : "Show Details"}
                          >
                            {showDetails[resultObj.id] ? (
                              <ExpandLess fontSize="inherit" />
                            ) : (
                              <ExpandMore fontSize="inherit" />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}

                      <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={() => handleCloseResult(resultObj.id)}
                      >
                        <Close fontSize="inherit" />
                      </IconButton>
                    </>
                  }
                >
                  <Box sx={{ width: "100%" }}>
                    <FormattedResultText text={resultObj.text} severity={resultObj.severity} />
                    {resultObj.details && (
                      <Collapse in={showDetails[resultObj.id]}>
                        <Box mt={2} sx={{ width: "100%" }}>
                          <CippCodeBlock
                            code={
                              typeof resultObj.details === "string"
                                ? resultObj.details
                                : JSON.stringify(resultObj.details, null, 2)
                            }
                            language={typeof resultObj.details === "object" ? "json" : "text"}
                            showLineNumbers={false}
                            type="syntax"
                          />
                        </Box>
                      </Collapse>
                    )}
                  </Box>
                </Alert>
              </Collapse>
            </React.Fragment>
          ))}
        </>
      )}
      {(apiObject.isSuccess || apiObject.isError) &&
      finalResults?.length > 0 &&
      hasVisibleResults ? (
        <Box display="flex" flexDirection="row">
          <Tooltip title="View Results">
            <IconButton onClick={() => tableDialog.handleOpen()}>
              <SvgIcon>
                <EyeIcon />
              </SvgIcon>
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Results">
            <IconButton aria-label="download-csv" onClick={handleDownloadCsv}>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      ) : null}
      {tableDialog.open && (
        <CippTableDialog
          createDialog={tableDialog}
          title={pageTitle}
          data={finalResults}
          noCard={true}
          simpleColumns={["severity", "text", "copyField"]}
        />
      )}
    </Stack>
  );
};
