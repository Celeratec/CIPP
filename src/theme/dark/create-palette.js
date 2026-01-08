import { common } from '@mui/material/colors';
import { alpha } from '@mui/material/styles';
import { error, info, neutral, success, warning } from '../colors';
import { getPrimary } from '../utils';

export const createPalette = (config) => {
  const { colorPreset, contrast } = config;

  return {
    action: {
      active: neutral[400],
      disabled: alpha(neutral[400], 0.38),
      disabledBackground: alpha(neutral[400], 0.12),
      focus: alpha(neutral[400], 0.16),
      hover: alpha(neutral[400], 0.08),
      selected: alpha(neutral[400], 0.12)
    },
    background: {
      default: contrast === 'high' ? '#1A1A1A' : '#222222',
      paper: '#2A2A2A'
    },
    divider: neutral[700],
    error,
    info,
    mode: 'dark',
    neutral,
    primary: getPrimary(colorPreset),
    success,
    text: {
      primary: '#D8D8D8',
      secondary: '#9A9A9A',
      disabled: alpha(common.white, 0.38)
    },
    warning
  };
};
