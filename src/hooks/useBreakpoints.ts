import { useTheme, useMediaQuery } from '@mui/material';

export function useBreakpoints() {
  const theme = useTheme();

  return {
    isMobile: useMediaQuery(theme.breakpoints.down('md')),
    isTablet: useMediaQuery(theme.breakpoints.between('md', 'lg')),
    isDesktop: useMediaQuery(theme.breakpoints.up('lg')),
    isSmall: useMediaQuery(theme.breakpoints.down('sm')),
    isLarge: useMediaQuery(theme.breakpoints.up('xl')),
  };
}
