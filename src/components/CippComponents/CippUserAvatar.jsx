import { useState, useEffect, useRef, memo } from "react";
import { Avatar, Skeleton } from "@mui/material";

/**
 * Generates initials from a name
 */
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Generates a consistent color from a string
 */
const stringToColor = (string) => {
  if (!string) return "#757575";
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#1976d2", "#388e3c", "#d32f2f", "#7b1fa2", "#c2185b",
    "#0288d1", "#00796b", "#f57c00", "#5d4037", "#455a64",
  ];
  return colors[Math.abs(hash) % colors.length];
};

// In-memory cache for photo URLs and failed lookups
const photoCache = new Map();
const failedPhotos = new Set();

/**
 * CippUserAvatar - A lazy-loading avatar component with caching
 * 
 * Features:
 * - Lazy loads photos only when visible in viewport
 * - Caches successful and failed photo lookups
 * - Shows initials as fallback
 * - Smooth loading transition
 */
const CippUserAvatar = memo(({
  userId,
  tenantFilter,
  displayName,
  size = 48,
  sx = {},
  enablePhoto = true,
}) => {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const avatarRef = useRef(null);
  const observerRef = useRef(null);

  // Cache key for this user
  const cacheKey = `${tenantFilter}-${userId}`;

  useEffect(() => {
    // Don't try to load if photos are disabled or no userId
    if (!enablePhoto || !userId || !tenantFilter) {
      return;
    }

    // Check if we already know this photo failed
    if (failedPhotos.has(cacheKey)) {
      setHasError(true);
      return;
    }

    // Check if we have a cached URL
    if (photoCache.has(cacheKey)) {
      setPhotoUrl(photoCache.get(cacheKey));
      return;
    }

    // Set up intersection observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoading && !hasError && !photoUrl) {
            loadPhoto();
          }
        });
      },
      {
        rootMargin: "100px", // Start loading 100px before visible
        threshold: 0.1,
      }
    );

    if (avatarRef.current) {
      observer.observe(avatarRef.current);
    }
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [userId, tenantFilter, enablePhoto, cacheKey, isLoading, hasError, photoUrl]);

  const loadPhoto = async () => {
    if (isLoading || hasError || photoUrl) return;
    
    setIsLoading(true);
    
    try {
      const url = `/api/ListUserPhoto?TenantFilter=${encodeURIComponent(tenantFilter)}&UserId=${encodeURIComponent(userId)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        // Photo not found or error - cache this failure
        failedPhotos.add(cacheKey);
        setHasError(true);
        return;
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        failedPhotos.add(cacheKey);
        setHasError(true);
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      photoCache.set(cacheKey, objectUrl);
      setPhotoUrl(objectUrl);
      
    } catch (error) {
      failedPhotos.add(cacheKey);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Don't revoke cached URLs as they may be used by other instances
    };
  }, []);

  const bgColor = stringToColor(displayName);
  const initials = getInitials(displayName);

  if (isLoading) {
    return (
      <Skeleton 
        variant="circular" 
        width={size} 
        height={size}
        sx={sx}
      />
    );
  }

  return (
    <Avatar
      ref={avatarRef}
      src={photoUrl}
      sx={{
        bgcolor: bgColor,
        width: size,
        height: size,
        fontSize: size * 0.35,
        fontWeight: 600,
        ...sx,
      }}
    >
      {initials}
    </Avatar>
  );
});

CippUserAvatar.displayName = "CippUserAvatar";

export default CippUserAvatar;

// Utility to clear the photo cache (e.g., on tenant change)
export const clearPhotoCache = () => {
  // Revoke all object URLs
  photoCache.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      // Ignore errors
    }
  });
  photoCache.clear();
  failedPhotos.clear();
};
