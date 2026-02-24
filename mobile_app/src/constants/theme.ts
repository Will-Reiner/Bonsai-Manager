// mobile_app/src/constants/theme.ts

export const theme = {
  colors: {
    primary: '#285430',      // Verde Floresta
    primaryLight: '#E8F0E9', // Verde Claro (backgrounds suaves)
    primaryDark: '#1A3A20',  // Verde Escuro (textos destaque)
    background: '#F5F5F5',    // Fundo principal
    surface: '#FAFAF8',      // Superfícies alternativas
    card: '#FFFFFF',          // Cor dos cards
    text: '#333333',          // Texto principal
    subtext: '#666666',       // Texto secundário
    textSecondary: '#666666', // Texto secundário (alias para subtext)
    success: '#28a745',      // Sucesso
    warning: '#ffc107',      // Alerta
    danger: '#dc3545',        // Perigo
    error: '#dc3545',         // Erro (alias para danger)
    accent: '#A47C6A',        // Marrom Amadeirado
    lightGray: '#EAEAEA',     // Cinza Claro
    border: '#E0E0D8',       // Bordas sutis
    // Cores de prioridade
    urgent: '#dc3545',        // Vermelho — tarefas em atraso
    important: '#ffc107',     // Amarelo — importantes
    normal: '#285430',        // Verde — normais
  },
  spacing: {
    xs: 4,
    small: 8,
    sm: 8,
    medium: 16,
    md: 16,
    large: 24,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
  },
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: 'bold' as const,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold' as const,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 16,
    },
    caption: {
      fontSize: 12,
      color: '#666666',
    },
    button: {
      fontSize: 16,
      fontWeight: 'bold' as const,
    },
  },
};
