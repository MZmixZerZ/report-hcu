import { createTheme } from '@mui/material/styles';

// HCU University Official Brand Color Theme
// Primary: Red #D61514 (Pantone 2035), Yellow #FFBD00 (Pantone 7548)
const HCU = {
  red:         '#D61514',   // Pantone 2035 — primary brand red
  redDark:     '#AA020B',   // Pantone 2350 — dark red
  redDarker:   '#8C0E0E',   // Pantone 1815 — darkest red
  redLight:    '#C02020',   // lighter red for hover
  red50:       '#FFF5F5',
  red100:      '#FFECEC',
  red200:      '#FFCECE',
  yellow:      '#FFBD00',   // Pantone 7548 — primary brand yellow
  yellowLight: '#FFDA5D',   // Pantone 120
  yellowDark:  '#AE7517',   // Pantone 7551 — amber/dark gold
  yellowPale:  '#FFFCDC',   // Process Yellow 15%
  brown:       '#5F3B10',   // Pantone 731 — dark brown (text on yellow)
};

const theme = createTheme({
  palette: {
    primary: {
      main: HCU.red,
      light: HCU.redLight,
      dark: HCU.redDark,
      contrastText: '#fff',
      50: HCU.red50,
      100: HCU.red100,
      200: HCU.red200,
    },
    secondary: {
      main: HCU.yellow,
      light: HCU.yellowLight,
      dark: HCU.yellowDark,
      contrastText: HCU.brown,
    },
    success: {
      main: '#10B981',
      light: '#5FD4A8',
      dark: '#047857',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    info: {
      main: '#06B6D4',
      light: '#22D3EE',
      dark: '#0891B2',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: ['Sarabun', '"Segoe UI"', 'Roboto', 'sans-serif'].join(','),
    h1: {
      fontSize: '3.5rem',
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      color: '#111827',
    },
    h2: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
      color: '#111827',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
      color: '#111827',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#111827',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#111827',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#111827',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.3px',
      color: '#374151',
    },
    body2: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
      color: '#6B7280',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.5px',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 700,
          borderRadius: '12px',
          textTransform: 'none',
          fontSize: '1rem',
          padding: '12px 28px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: `0 20px 40px rgba(122, 30, 30, 0.25)`,
            '&.MuiButton-outlined': {
              boxShadow: `0 10px 25px rgba(122, 30, 30, 0.15)`,
            },
          },
          '&:active': {
            transform: 'translateY(-1px)',
          },
        }),
        contained: ({ theme }) => ({
          background: `linear-gradient(135deg, ${HCU.maroon} 0%, ${HCU.maroonDark} 100%)`,
          boxShadow: `0 8px 20px rgba(122, 30, 30, 0.3)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${HCU.maroonLight} 0%, ${HCU.maroon} 100%)`,
          },
        }),
        outlined: ({ theme }) => ({
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            backgroundColor: `rgba(122, 30, 30, 0.04)`,
          },
        }),
        containedSecondary: {
          background: `linear-gradient(135deg, ${HCU.gold} 0%, ${HCU.goldDark} 100%)`,
          boxShadow: `0 8px 20px rgba(212, 175, 55, 0.3)`,
          color: '#fff',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: '16px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          '&:hover': {
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-6px)',
            borderColor: `rgba(122, 30, 30, 0.2)`,
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: '16px',
          transition: 'all 0.3s ease',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5))',
        }),
        elevation1: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        },
        elevation3: {
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: `linear-gradient(135deg, ${HCU.maroon} 0%, ${HCU.maroonDark} 100%)`,
          boxShadow: `0 8px 32px rgba(122, 30, 30, 0.2)`,
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }),
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            border: '2px solid rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontSize: '1rem',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              borderColor: `rgba(122, 30, 30, 0.3)`,
            },
            '&.Mui-focused': {
              backgroundColor: `rgba(122, 30, 30, 0.02)`,
              borderColor: HCU.maroon,
              boxShadow: `0 0 0 4px rgba(122, 30, 30, 0.1)`,
            },
          },
          '& .MuiOutlinedInput-input': {
            padding: '16px 16px',
            fontSize: '1rem',
            '&::placeholder': {
              color: '#9CA3AF',
              opacity: 1,
            },
          },
        }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: '12px',
          margin: '4px 8px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          color: '#6B7280',
          '&:hover': {
            backgroundColor: `rgba(122, 30, 30, 0.08)`,
            color: HCU.maroon,
          },
          '&.Mui-selected': {
            backgroundColor: `rgba(122, 30, 30, 0.12)`,
            color: HCU.maroon,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: `rgba(122, 30, 30, 0.15)`,
            },
          },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 600,
          '& .MuiChip-icon': {
            marginLeft: '8px',
          },
        },
        filled: ({ theme }) => ({
          backgroundColor: `rgba(122, 30, 30, 0.1)`,
          color: HCU.maroon,
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 0, 0, 0.06)',
          padding: '16px',
        },
        head: {
          fontSize: '0.95rem',
          fontWeight: 700,
          backgroundColor: `rgba(122, 30, 30, 0.08)`,
          color: HCU.maroon,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          height: 8,
        },
        bar: {
          borderRadius: '8px',
          background: `linear-gradient(90deg, ${HCU.maroon}, ${HCU.gold})`,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: HCU.maroon,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: HCU.maroon,
        },
      },
    },
  },
});

export default theme;
