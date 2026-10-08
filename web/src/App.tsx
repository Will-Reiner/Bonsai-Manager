import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { CareProvider } from '@/context/CareContext';
import { LoginPage, RegisterPage } from '@/pages/AuthPages';
import { BancadaPage } from '@/pages/BancadaPage';
import { CollectionPage } from '@/pages/CollectionPage';
import { AddPlantPage } from '@/pages/AddPlantPage';
import { PlantDetailPage } from '@/pages/PlantDetailPage';
import { EditPlantPage } from '@/pages/EditPlantPage';
import { PlantGalleryPage } from '@/pages/PlantGalleryPage';
import { PlantHistoryPage } from '@/pages/PlantHistoryPage';
import { TarefaPage } from '@/pages/TarefaPage';
import { RegistrarPage } from '@/pages/RegistrarPage';
import { AgendarPage } from '@/pages/AgendarPage';
import { ConcluirPage } from '@/pages/ConcluirPage';
import { BatchPhotosPage } from '@/pages/BatchPhotosPage';
import { EditProfilePage, ProfilePage } from '@/pages/ProfilePages';
import { AdminPage } from '@/pages/AdminPage';
import { deveRolarParaTopo } from '@/lib/rolagem';

function Privada({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <CareProvider>{children}</CareProvider> : <Navigate to="/login" replace />;
}

function Publica({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

function SoAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/perfil" replace />;
}

/** Nova tela abre no topo; no "voltar" (POP) ou com `MANTER_ROLAGEM` (deslizar o carrossel) mantém a rolagem. */
function RolarParaTopo() {
  const { pathname, state } = useLocation();
  const tipo = useNavigationType();
  useEffect(() => {
    if (deveRolarParaTopo(tipo, state)) window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só a troca de tela decide; o state vem junto dela
  }, [pathname, tipo]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <RolarParaTopo />
      <Routes>
        <Route path="/login" element={<Publica><LoginPage /></Publica>} />
        <Route path="/cadastro" element={<Publica><RegisterPage /></Publica>} />

        <Route element={<Privada><Layout /></Privada>}>
          <Route index element={<BancadaPage />} />
          <Route path="colecao" element={<CollectionPage />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Route>

        <Route path="/plantas/nova" element={<Privada><AddPlantPage /></Privada>} />
        <Route path="/plantas/:id" element={<Privada><PlantDetailPage /></Privada>} />
        <Route path="/plantas/:id/editar" element={<Privada><EditPlantPage /></Privada>} />
        <Route path="/plantas/:id/galeria" element={<Privada><PlantGalleryPage /></Privada>} />
        <Route path="/plantas/:id/historico" element={<Privada><PlantHistoryPage /></Privada>} />
        <Route path="/tarefas/:id" element={<Privada><TarefaPage /></Privada>} />
        <Route path="/concluir" element={<Privada><ConcluirPage /></Privada>} />
        <Route path="/registrar" element={<Privada><RegistrarPage /></Privada>} />
        <Route path="/agendar" element={<Privada><AgendarPage /></Privada>} />
        <Route path="/fotos/lote" element={<Privada><BatchPhotosPage /></Privada>} />
        <Route path="/perfil/editar" element={<Privada><EditProfilePage /></Privada>} />
        <Route path="/admin" element={<Privada><SoAdmin><AdminPage /></SoAdmin></Privada>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
