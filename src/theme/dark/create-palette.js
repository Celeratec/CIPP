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
      default: contrast === 'high' ? '#0F0F0F' : '#141414',
      paper: '#1C1C1C'
    },
    divider: neutral[800],
    error,
    info,
    mode: 'dark',
    neutral,
    primary: getPrimary(colorPreset),
    success,
    text: {
      primary: '#F5F5F5',
      secondary: '#A0A0A0',
      disabled: alpha(common.white, 0.38)
    },
    warning
  };
};
