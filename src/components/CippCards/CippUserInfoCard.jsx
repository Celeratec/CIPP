import PropTypes from "prop-types";
import {
  Avatar,
  Card,
  CardContent,
  Divider,
  Skeleton,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Paper,
  ButtonBase,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";
import { 
  AccountCircle, 
  PhotoCamera, 
  Delete, 
  PersonAddAlt1,
  Work,
  Phone,
  LocationOn,
  Badge,
  CheckCircle,
  Cancel,
  Sync,
  Cloud,
  Business,
  Email,
  OpenInNew,
  Close,
} from "@mui/icons-material";
import { getCippFormatting } from "../../utils/get-cipp-formatting";
import { getCippLicenseTranslation } from "../../utils/get-cipp-license-translation";
import { Stack, Grid, Box } from "@mui/system";
import { useState, useRef } from "react";
import { ApiPostCall } from "../../api/ApiCall";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/router";
import { useQueryClient } from "@tanstack/react-query";

// Section component for consistent styling
const InfoSection = ({ icon: Icon, title, children, isEmpty = false }) => {
  if (isEmpty) return null;
  
  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Icon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight={600}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
};

// Info row component for label-value pairs
const InfoRow = ({ label, value, fullWidth = false }) => {
  if (!value) return null;
  
  return (
    <Grid size={{ xs: 12, sm: fullWidth ? 12 : 6 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Grid>
  );
};

export const CippUserInfoCard = (props) => {
  const { user, tenant, isFetching = false, onRefresh, ...other } = props;
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [photoTimestamp, setPhotoTimestamp] = useState(Date.now());
  const [uploadError, setUploadError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const fileInputRef = useRef(null);
  
  // License removal state
  const [licenseDialog, setLicenseDialog] = useState({
    open: false,
    license: null,
    licenseName: null,
  });
  const [isRemovingLicense, setIsRemovingLicense] = useState(false);
  const [licenseError, setLicenseError] = useState(null);
  
  // License removal API
  const removeLicenseMutation = ApiPostCall({
    urlFromData: true,
    relatedQueryKeys: [`ListUsers-${user?.id}`],
  });
  
  // Handle license chip click for removal
  const handleLicenseClick = (license, licenseName) => {
    setLicenseDialog({
      open: true,
      license,
      licenseName,
    });
    setLicenseError(null);
  };
  
  // Handle dialog close
  const handleLicenseDialogClose = () => {
    setLicenseDialog({
      open: false,
      license: null,
      licenseName: null,
    });
    setLicenseError(null);
  };
  
  // Handle license removal
  const handleRemoveLicense = async () => {
    const { license } = licenseDialog;
    setIsRemovingLicense(true);
    setLicenseError(null);
    
    try {
      await removeLicenseMutation.mutateAsync({
        url: "/api/ExecBulkLicense",
        data: [{
          tenantFilter: tenant,
          userIds: user.id,
          LicenseOperation: "Remove",
          Licenses: [{ value: license.skuId }],
        }],
      });
      
      // Invalidate user queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`ListUsers-${user?.id}`] });
      
      // Call onRefresh if provided
      if (onRefresh) {
        onRefresh();
      }
      
      handleLicenseDialogClose();
    } catch (error) {
      console.error("Failed to remove license:", error);
      setLicenseError(error.message || "Failed to remove license");
    } finally {
      setIsRemovingLicense(false);
    }
  };
  
  // Get translated license names with skuId preserved
  const getLicenseChips = () => {
    if (!user?.assignedLicenses || user.assignedLicenses.length === 0) {
      return null;
    }
    
    return user.assignedLicenses.map((license, index) => {
      // Get the translated name for this single license
      const translatedNames = getCippLicenseTranslation([license]);
      const displayName = Array.isArray(translatedNames) ? translatedNames[0] : translatedNames;
      
      return (
        <Tooltip 
          key={license.skuId || index} 
          title={`Click to remove: ${displayName}`}
        >
          <Chip
            label={displayName}
            variant="outlined"
            size="small"
            color="info"
            onDelete={() => handleLicenseClick(license, displayName)}
            deleteIcon={<Close sx={{ fontSize: 16 }} />}
            sx={{
              maxWidth: "100%",
              height: "auto",
              cursor: "pointer",
              "& .MuiChip-label": {
                whiteSpace: "normal",
                wordBreak: "break-word",
                py: 0.5,
              },
              "& .MuiChip-deleteIcon": {
                color: "text.secondary",
                "&:hover": {
                  color: "error.main",
                },
              },
            }}
          />
        </Tooltip>
      );
    });
  };

  // API mutations
  const setPhotoMutation = ApiPostCall({ urlFromData: true });
  const removePhotoMutation = ApiPostCall({ urlFromData: true });

  // Navigate to View User page
  const handleViewUser = () => {
    if (user?.id) {
      router.push(`/identity/administration/users/user?userId=${user.id}`);
    }
  };

  // Helper function to check if a section has any data
  const hasWorkInfo =
    user?.jobTitle || user?.department || user?.manager?.displayName || user?.companyName;
  const hasAddressInfo =
    user?.streetAddress || user?.postalCode || user?.city || user?.country || user?.officeLocation;
  const hasContactInfo =
    user?.mobilePhone || (user?.businessPhones && user?.businessPhones.length > 0);

  // Handle image URL with timestamp for cache busting
  const imageUrl =
    user?.id && tenant
      ? `/api/ListUserPhoto?TenantFilter=${tenant}&UserId=${user.id}&t=${photoTimestamp}`
      : undefined;

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    setUploadError(null);
    setSuccessMessage(null);

    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please select a valid image file (JPEG or PNG)");
      return;
    }

    // Validate file size (4MB max)
    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(
        `File size exceeds 4MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      );
      return;
    }

    // Convert to base64 and upload
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await setPhotoMutation.mutateAsync({
          url: "/api/ExecSetUserPhoto",
          data: {
            userId: user.id,
            tenantFilter: tenant,
            action: "set",
            photoData: reader.result,
          },
        });
        setPhotoTimestamp(Date.now());
        setSuccessMessage("Photo updated!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        setUploadError(error.message || "Failed to upload photo");
      }
    };
    reader.onerror = () => {
      setUploadError("Failed to read file");
    };
    reader.readAsDataURL(file);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    setUploadError(null);
    setSuccessMessage(null);

    try {
      await removePhotoMutation.mutateAsync({
        url: "/api/ExecSetUserPhoto",
        data: {
          userId: user.id,
          tenantFilter: tenant,
          action: "remove",
        },
      });
      setPhotoTimestamp(Date.now());
      setSuccessMessage("Photo removed!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setUploadError(error.message || "Failed to remove photo");
    }
  };

  const isLoading = setPhotoMutation.isPending || removePhotoMutation.isPending;

  if (isFetching) {
    return (
      <Card {...other}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Skeleton variant="circular" width={80} height={80} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="80%" />
              </Box>
            </Stack>
            <Skeleton variant="rectangular" height={100} />
            <Skeleton variant="rectangular" height={80} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...other}>
      <CardContent sx={{ p: 0 }}>
        {/* Hero Section with Photo and Name */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack direction="row" spacing={2.5} alignItems="flex-start">
            {/* Avatar with photo controls */}
            <Box sx={{ position: "relative" }}>
              <Tooltip title="View User">
                <ButtonBase
                  onClick={handleViewUser}
                  sx={{
                    borderRadius: "50%",
                    "&:hover": {
                      "& .MuiAvatar-root": {
                        boxShadow: theme.shadows[4],
                        transform: "scale(1.02)",
                      },
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      border: `3px solid ${theme.palette.background.paper}`,
                      boxShadow: theme.shadows[2],
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                    }}
                    src={imageUrl}
                  >
                    <AccountCircle sx={{ fontSize: 48 }} />
                  </Avatar>
                </ButtonBase>
              </Tooltip>
              {isLoading && (
                <CircularProgress
                  size={86}
                  sx={{
                    position: "absolute",
                    top: -3,
                    left: -3,
                    zIndex: 1,
                  }}
                />
              )}
              {/* Photo action buttons */}
              <Stack 
                direction="row" 
                spacing={0.5} 
                sx={{ 
                  position: "absolute", 
                  bottom: -8, 
                  left: "50%", 
                  transform: "translateX(-50%)",
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileSelect}
                />
                <Tooltip title="Change Photo">
                  <IconButton
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    sx={{
                      bgcolor: "background.paper",
                      boxShadow: 1,
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <PhotoCamera sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove Photo">
                  <IconButton
                    size="small"
                    onClick={handleRemovePhoto}
                    disabled={isLoading}
                    sx={{
                      bgcolor: "background.paper",
                      boxShadow: 1,
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "error.light", color: "error.contrastText" },
                    }}
                  >
                    <Delete sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {/* Name and basic info */}
            <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
              <Tooltip title="View User">
                <Typography 
                  variant="h6" 
                  onClick={handleViewUser}
                  sx={{ 
                    fontWeight: 600, 
                    mb: 0.5,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    "&:hover": {
                      color: "primary.main",
                      textDecoration: "underline",
                    },
                  }}
                >
                  {user?.displayName || "Unknown User"}
                  <OpenInNew sx={{ fontSize: 16, opacity: 0.5 }} />
                </Typography>
              </Tooltip>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 1.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.userPrincipalName}
              </Typography>
              
              {/* Status chips */}
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={user?.accountEnabled ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                  label={user?.accountEnabled ? "Enabled" : "Disabled"}
                  color={user?.accountEnabled ? "success" : "error"}
                  size="small"
                  variant="outlined"
                />
                {user?.onPremisesSyncEnabled && (
                  <Chip
                    icon={<Sync fontSize="small" />}
                    label="AD Synced"
                    color="info"
                    size="small"
                    variant="outlined"
                  />
                )}
                {user?.userType === "Guest" && (
                  <Chip
                    icon={<PersonAddAlt1 fontSize="small" />}
                    label="Guest"
                    color="warning"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>

              {/* Photo status messages */}
              {successMessage && (
                <Typography variant="caption" color="success.main" sx={{ display: "block", mt: 1 }}>
                  {successMessage}
                </Typography>
              )}
              {uploadError && (
                <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                  {uploadError}
                </Typography>
              )}
            </Box>
          </Stack>
        </Paper>

        {/* Content Sections */}
        <Box sx={{ p: 2.5 }}>
          {/* Licenses Section */}
          <InfoSection icon={Badge} title="Licenses">
            {!user?.assignedLicenses || user?.assignedLicenses.length === 0 ? (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1.5, 
                  bgcolor: alpha(theme.palette.info.main, 0.04),
                  borderColor: alpha(theme.palette.info.main, 0.2),
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No licenses assigned
                </Typography>
              </Paper>
            ) : (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {getLicenseChips()}
              </Stack>
            )}
          </InfoSection>

          <Divider sx={{ my: 2 }} />

          {/* Work Information */}
          <InfoSection icon={Work} title="Work" isEmpty={!hasWorkInfo}>
            <Grid container spacing={1.5}>
              <InfoRow label="Job Title" value={user?.jobTitle} />
              <InfoRow label="Department" value={user?.department} />
              <InfoRow label="Company" value={user?.companyName} />
              <InfoRow label="Manager" value={user?.manager?.displayName} fullWidth />
            </Grid>
          </InfoSection>

          {!hasWorkInfo && (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 1.5, 
                mb: 2.5,
                bgcolor: alpha(theme.palette.grey[500], 0.04),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Work fontSize="small" color="disabled" />
                <Typography variant="body2" color="text.secondary">
                  No work information available
                </Typography>
              </Stack>
            </Paper>
          )}

          {/* Contact Information */}
          <InfoSection icon={Phone} title="Contact" isEmpty={!hasContactInfo}>
            <Grid container spacing={1.5}>
              <InfoRow label="Mobile" value={user?.mobilePhone} />
              <InfoRow 
                label="Business Phone" 
                value={user?.businessPhones?.length > 0 ? user.businessPhones.join(", ") : null} 
              />
            </Grid>
          </InfoSection>

          {!hasContactInfo && (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 1.5, 
                mb: 2.5,
                bgcolor: alpha(theme.palette.grey[500], 0.04),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Phone fontSize="small" color="disabled" />
                <Typography variant="body2" color="text.secondary">
                  No contact information available
                </Typography>
              </Stack>
            </Paper>
          )}

          {/* Address Information */}
          <InfoSection icon={LocationOn} title="Location" isEmpty={!hasAddressInfo}>
            <Grid container spacing={1.5}>
              <InfoRow label="Office" value={user?.officeLocation} />
              <InfoRow label="Street" value={user?.streetAddress} fullWidth />
              <InfoRow label="City" value={user?.city} />
              <InfoRow label="Postal Code" value={user?.postalCode} />
              <InfoRow label="Country" value={user?.country} />
            </Grid>
          </InfoSection>

          {!hasAddressInfo && (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 1.5, 
                bgcolor: alpha(theme.palette.grey[500], 0.04),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocationOn fontSize="small" color="disabled" />
                <Typography variant="body2" color="text.secondary">
                  No location information available
                </Typography>
              </Stack>
            </Paper>
          )}
        </Box>
      </CardContent>
      
      {/* License Removal Confirmation Dialog */}
      <Dialog
        open={licenseDialog.open}
        onClose={handleLicenseDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Remove License?
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            Are you sure you want to remove the following license from{" "}
            <strong>{user?.displayName}</strong>?
            
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mt: 2, 
                bgcolor: alpha(theme.palette.warning.main, 0.04),
                borderColor: alpha(theme.palette.warning.main, 0.3),
              }}
            >
              <Typography variant="body1" fontWeight={600}>
                {licenseDialog.licenseName}
              </Typography>
            </Paper>
            
            <Alert severity="warning" sx={{ mt: 2 }}>
              This action will immediately remove the license from the user's account. 
              The user may lose access to associated services and features.
            </Alert>
          </DialogContentText>
          
          {licenseError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {licenseError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLicenseDialogClose} disabled={isRemovingLicense}>
            Cancel
          </Button>
          <Button
            onClick={handleRemoveLicense}
            color="error"
            variant="contained"
            disabled={isRemovingLicense}
            startIcon={isRemovingLicense ? <CircularProgress size={16} color="inherit" /> : <Delete />}
          >
            {isRemovingLicense ? "Removing..." : "Remove License"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

CippUserInfoCard.propTypes = {
  user: PropTypes.object,
  tenant: PropTypes.string,
  isFetching: PropTypes.bool,
  onRefresh: PropTypes.func,
};
