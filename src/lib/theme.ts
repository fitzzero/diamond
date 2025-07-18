import { createTheme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// Vaporwave/Synthwave color palette
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff0080', // Hot pink/magenta
      dark: '#cc0066', // Darker pink
      light: '#ff4da6', // Lighter pink
    },
    secondary: {
      main: '#00ffff', // Cyan
      dark: '#00cccc', // Darker cyan
      light: '#4dffff', // Lighter cyan
    },
    background: {
      default: '#0a0a0f', // Very dark purple-black
      paper: '#1a1a2e', // Dark purple surface
    },
    text: {
      primary: '#ffffff', // Pure white text
      secondary: '#00ffff', // Cyan text
    },
    success: {
      main: '#00ff41', // Neon green
      dark: '#00cc34',
      light: '#4dff6d',
    },
    warning: {
      main: '#ffaa00', // Electric orange
      dark: '#cc8800',
      light: '#ffbb4d',
    },
    error: {
      main: '#ff0040', // Electric red
      dark: '#cc0033',
      light: '#ff4d73',
    },
    info: {
      main: '#8000ff', // Electric purple
      dark: '#6600cc',
      light: '#a64dff',
    },
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none' as const,
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          minHeight: 36,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(255, 0, 128, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(255, 0, 128, 0.1)',
          border: '1px solid rgba(255, 0, 128, 0.2)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a2e',
          boxShadow: '0 1px 8px rgba(255, 0, 128, 0.2)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
