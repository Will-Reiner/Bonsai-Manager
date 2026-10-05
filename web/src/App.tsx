import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { CareProvider } from '@/context/CareContext';
import { LoginPage, RegisterPage } from '@/pages/AuthPages';
import { TodayPage } from '@/pages/TodayPage';
import { CollectionPage } from '@/pages/CollectionPage';
import { AddPlantPage } from '@/pages/AddPlantPage';
import { PlantDetailPage } from '@/pages/PlantDetailPage';
import { EditPlantPage } from '@/pages/EditPlantPage';
import { ConcluirPage } from '@/pages/ConcluirPage';
import { EditProfilePage, ProfilePage } from '@/pages/ProfilePages';
import { AdminPage } from '@/pages/AdminPage';

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Publica><LoginPage /></Publica>} />
        <Route path="/cadastro" element={<Publica><RegisterPage /></Publica>} />

        <Route element={<Privada><Layout /></Privada>}>
          <Route index element={<TodayPage />} />
          <Route path="colecao" element={<CollectionPage />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Route>

        <Route path="/plantas/nova" element={<Privada><AddPlantPage /></Privada>} />
        <Route path="/plantas/:id" element={<Privada><PlantDetailPage /></Privada>} />
        <Route path="/plantas/:id/editar" element={<Privada><EditPlantPage /></Privada>} />
        <Route path="/concluir" element={<Privada><ConcluirPage /></Privada>} />
        <Route path="/perfil/editar" element={<Privada><EditProfilePage /></Privada>} />
        <Route path="/admin" element={<Privada><SoAdmin><AdminPage /></SoAdmin></Privada>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
