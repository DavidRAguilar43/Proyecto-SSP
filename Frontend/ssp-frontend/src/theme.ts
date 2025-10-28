import { createTheme } from '@mui/material/styles';

/**
 * Sistema de Diseño Visual - SSP Dashboard
 * 
 * Paleta de colores diseñada para proporcionar:
 * - Diferenciación visual clara entre componentes
 * - Contraste adecuado para accesibilidad (WCAG AA)
 * - Apariencia limpia y moderna con colores suaves
 * - Jerarquía visual consistente
 */

// Paleta de colores personalizada
const colors = {
  // Colores primarios - Azul profesional
  primary: {
    main: '#1976d2',      // Azul principal
    light: '#42a5f5',     // Azul claro
    dark: '#1565c0',      // Azul oscuro
    contrastText: '#ffffff',
  },
  
  // Colores secundarios - Púrpura/Morado
  secondary: {
    main: '#9c27b0',      // Púrpura principal
    light: '#ba68c8',     // Púrpura claro
    dark: '#7b1fa2',      // Púrpura oscuro
    contrastText: '#ffffff',
  },
  
  // Colores de estado
  success: {
    main: '#2e7d32',      // Verde
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#ffffff',
  },
  
  error: {
    main: '#d32f2f',      // Rojo
    light: '#ef5350',
    dark: '#c62828',
    contrastText: '#ffffff',
  },
  
  warning: {
    main: '#ed6c02',      // Naranja
    light: '#ff9800',
    dark: '#e65100',
    contrastText: '#ffffff',
  },
  
  info: {
    main: '#0288d1',      // Azul info
    light: '#03a9f4',
    dark: '#01579b',
    contrastText: '#ffffff',
  },
  
  // Fondos y superficies
  background: {
    default: '#f5f7fa',   // Fondo principal - gris azulado muy claro
    paper: '#ffffff',     // Fondo de tarjetas y contenedores
    secondary: '#e3f2fd', // Fondo secundario - azul muy claro
    tertiary: '#f3e5f5',  // Fondo terciario - púrpura muy claro
  },
  
  // Grises
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Colores de texto
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  
  // Divisores y bordes
  divider: 'rgba(0, 0, 0, 0.12)',
};

// Crear tema personalizado
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    background: colors.background,
    grey: colors.grey,
    text: colors.text,
    divider: colors.divider,
  },
  
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
  },
  
  // Personalización de componentes
  components: {
    // AppBar
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    
    // Paper (tarjetas y contenedores)
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
        elevation2: {
          boxShadow: '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
        },
        elevation3: {
          boxShadow: '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
        },
      },
    },
    
    // Card
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    
    // Button
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
          },
        },
      },
    },
    
    // TextField
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            '&:hover': {
              backgroundColor: '#fafafa',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
            },
          },
        },
      },
    },
    
    // Table
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.secondary,
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: colors.text.primary,
          },
        },
      },
    },
    
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: '#fafafa',
          },
          '&:hover': {
            backgroundColor: colors.background.secondary,
          },
        },
      },
    },
    
    // Chip
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    
    // Dialog
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    
    // Divider
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.divider,
        },
      },
    },
  },
  
  // Espaciado
  spacing: 8,
  
  // Bordes redondeados
  shape: {
    borderRadius: 8,
  },
});

export default theme;

