import { useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { ExpandMore, ExpandLess, OpenInNew, InfoOutlined } from "@mui/icons-material";
import Link from "next/link";
import { ACCESS_TYPES, ACCESS_TYPE_CONTEXTS } from "../../data/accessTypes";

const SettingsLinks = ({ links }) => {
  if (!links?.length) return null;
  return (
    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
      {links.map((link) => (
        <Link key={link.href} href={link.href} passHref legacyBehavior>
          <Button
            component="a"
            size="small"
            variant="outlined"
            endIcon={<OpenInNew fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            {link.label}
          </Button>
        </Link>
      ))}
    </Stack>
  );
};

const AccessTypeColumn = ({ typeKey, highlighted }) => {
  const t = ACCESS_TYPES[typeKey];
  if (!t) return null;
  return (
    <Box
      sx={{
        flex: 1,
        p: 2,
        borderRadius: 1,
        border: "1px solid",
        borderColor: highlighted ? `${t.chipColor}.main` : "divider",
        bgcolor: highlighted ? (theme) => theme.palette[t.chipColor]?.main + "08" : "transparent",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Chip
          label={t.label}
          size="small"
          color={t.chipColor}
          variant={highlighted ? "filled" : "outlined"}
          sx={{ fontWeight: 600 }}
        />
        <Typography variant="caption" color="text.secondary">
          {t.microsoftTerm}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {t.shortDescription}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {t.characteristics.map((item, i) => (
          <Typography component="li" variant="body2" key={i} sx={{ mb: 0.5, fontSize: "0.8rem" }}>
            {item}
          </Typography>
        ))}
      </Box>
      <SettingsLinks links={t.settingsLinks} />
    </Box>
  );
};

const ChipVariant = ({ type }) => {
  const t = ACCESS_TYPES[type];
  if (!t) return null;
  return (
    <Tooltip
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {t.label} ({t.microsoftTerm})
          </Typography>
          <Typography variant="body2">{t.shortDescription}</Typography>
        </Box>
      }
      arrow
      placement="top"
    >
      <Chip
        icon={<InfoOutlined sx={{ fontSize: 14 }} />}
        label={t.label}
        size="small"
        color={t.chipColor}
        variant="outlined"
        sx={{ height: 22, fontSize: "0.7rem", "& .MuiChip-label": { px: 0.5 } }}
      />
    </Tooltip>
  );
};

const BannerVariant = ({ type, context, showSettingsLinks }) => {
  const t = ACCESS_TYPES[type];
  const ctx = context ? ACCESS_TYPE_CONTEXTS[context] : null;
  if (!t) return null;

  const description = ctx?.note || t.fullDescription;
  const severity = t.chipColor === "warning" ? "warning" : "info";

  return (
    <Alert severity={severity} variant="outlined" sx={{ mb: 2 }}>
      <AlertTitle>
        {t.label} ({t.microsoftTerm})
      </AlertTitle>
      <Typography variant="body2">{description}</Typography>
      {showSettingsLinks && <SettingsLinks links={t.settingsLinks} />}
    </Alert>
  );
};

const PanelVariant = ({ context, showSettingsLinks }) => {
  const [expanded, setExpanded] = useState(false);
  const ctx = context ? ACCESS_TYPE_CONTEXTS[context] : null;

  const typesToShow = ctx?.showBoth
    ? ["guest", "external"]
    : ctx?.secondary
      ? [ctx.primary, ctx.secondary]
      : ctx?.primary
        ? [ctx.primary, ctx.primary === "guest" ? "external" : "guest"]
        : ["guest", "external"];

  const primaryType = ctx?.primary || null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
        }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <InfoOutlined fontSize="small" color="info" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Understanding Access Types: Guest Access vs External Access
          </Typography>
        </Stack>
        {expanded ? <ExpandLess /> : <ExpandMore />}
      </Box>
      <Collapse in={expanded} unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          {ctx?.note && (
            <Alert severity="info" variant="standard" sx={{ mb: 2 }}>
              <Typography variant="body2">{ctx.note}</Typography>
            </Alert>
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            {typesToShow.map((typeKey) => (
              <AccessTypeColumn
                key={typeKey}
                typeKey={typeKey}
                highlighted={primaryType === typeKey || ctx?.showBoth}
              />
            ))}
          </Stack>
        </CardContent>
      </Collapse>
    </Card>
  );
};

/**
 * Reusable access type coaching component with three rendering modes.
 *
 * @param {"guest"|"external"} type - Which access type (for chip/banner variants)
 * @param {"chip"|"banner"|"panel"} variant - Rendering mode
 * @param {string} [context] - Context key from ACCESS_TYPE_CONTEXTS
 * @param {boolean} [showSettingsLinks=true] - Whether to show navigation links
 */
const CippAccessTypeGuide = ({ type, variant = "chip", context, showSettingsLinks = true }) => {
  switch (variant) {
    case "chip":
      return <ChipVariant type={type} />;
    case "banner":
      return <BannerVariant type={type} context={context} showSettingsLinks={showSettingsLinks} />;
    case "panel":
      return <PanelVariant context={context} showSettingsLinks={showSettingsLinks} />;
    default:
      return null;
  }
};

export default CippAccessTypeGuide;
