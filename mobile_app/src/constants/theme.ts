// mobile_app/src/constants/theme.ts

export const theme = {
  colors: {
    primary: '#285430',      // Verde Floresta
    background: '#F5F5F5',    // Fundo principal
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
  },
  spacing: {
    xs: 4,                   // Extra small
    small: 8,
    sm: 8,                   // Alias para small
    medium: 16,
    md: 16,                  // Alias para medium
    large: 24,
    lg: 24,                  // Alias para large
    xl: 32,                  // Extra large
  },
  typography: {
    // No futuro, podemos adicionar estilos de fonte aqui
    h1: {
      fontSize: 28,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    body: {
      fontSize: 16,
    },
  },
};