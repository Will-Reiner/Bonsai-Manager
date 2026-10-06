import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => {
        const status = (error as { response?: { status?: number } }).response?.status;
        return status !== undefined && status < 500 ? false : count < 2;
      },
    },
  },
});

// O Pré-transplante depende das tarefas: quando a lista de tarefas é invalidada, as plantas também são
queryClient.getQueryCache().subscribe((evento) => {
  if (evento.type === 'updated' && evento.action.type === 'invalidate' && evento.query.queryKey[0] === 'agendas') {
    queryClient.invalidateQueries({ queryKey: ['plantas'] });
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
