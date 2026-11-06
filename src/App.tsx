import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from './components/layout/PublicLayout'
import { Loader } from './components/ui/Loader'
import { ADMIN_PATH } from './lib/config'
import { ContactPage } from './pages/public/ContactPage'
import { DocumentsPage } from './pages/public/DocumentsPage'
import { EventsPage } from './pages/public/EventsPage'
import { HomePage } from './pages/public/HomePage'
import { NotFoundPage } from './pages/public/NotFoundPage'
import { PracticePage } from './pages/public/PracticePage'
import { SectionPage } from './pages/public/SectionPage'

// El panel se carga aparte: su código no viaja en el paquete público.
const AdminLayout = lazy(() => import('./components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const LoginPage = lazy(() => import('./pages/admin/LoginPage').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const SectionsAdminPage = lazy(() => import('./pages/admin/SectionsAdminPage').then((m) => ({ default: m.SectionsAdminPage })))
const EventsAdminPage = lazy(() => import('./pages/admin/EventsAdminPage').then((m) => ({ default: m.EventsAdminPage })))
const DocumentsAdminPage = lazy(() => import('./pages/admin/DocumentsAdminPage').then((m) => ({ default: m.DocumentsAdminPage })))
const PracticeAdminPage = lazy(() => import('./pages/admin/PracticeAdminPage').then((m) => ({ default: m.PracticeAdminPage })))
const RegistrationsAdminPage = lazy(() =>
  import('./pages/admin/RegistrationsAdminPage').then((m) => ({ default: m.RegistrationsAdminPage })),
)

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="seccion/:slug" element={<SectionPage />} />
            <Route path="eventos" element={<EventsPage />} />
            <Route path="documentos" element={<DocumentsPage />} />
            <Route path="practica" element={<PracticePage />} />
            <Route path="contacto" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path={`${ADMIN_PATH}/login`} element={<LoginPage />} />
          <Route path={ADMIN_PATH} element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="secciones" element={<SectionsAdminPage />} />
            <Route path="eventos" element={<EventsAdminPage />} />
            <Route path="documentos" element={<DocumentsAdminPage />} />
            <Route path="inscripciones" element={<RegistrationsAdminPage />} />
            <Route path="practica" element={<PracticeAdminPage />} />
            <Route path="mensajes" element={<Navigate to={`${ADMIN_PATH}/inscripciones`} replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
