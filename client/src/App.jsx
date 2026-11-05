import { Route, Routes } from 'react-router-dom';
import GuestRoute from './components/GuestRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import EmployeeLayout from './layouts/EmployeeLayout.jsx';
import CompanyDocumentsPage from './pages/admin/CompanyDocumentsPage.jsx';
import DashboardPage from './pages/admin/DashboardPage.jsx';
import EmployeesPage from './pages/admin/EmployeesPage.jsx';
import KnowledgeGapsPage from './pages/admin/KnowledgeGapsPage.jsx';
import KnowledgeManagementPage from './pages/admin/KnowledgeManagementPage.jsx';
import LearningResourcesPage from './pages/admin/LearningResourcesPage.jsx';
import AdminProjectsPage from './pages/admin/ProjectsPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import DocumentDetailPage from './pages/employee/DocumentDetailPage.jsx';
import HomePage from './pages/employee/HomePage.jsx';
import KnowledgePage from './pages/employee/KnowledgePage.jsx';
import ProfilePage from './pages/employee/ProfilePage.jsx';
import ProjectDetailPage from './pages/employee/ProjectDetailPage.jsx';
import ProjectsPage from './pages/employee/ProjectsPage.jsx';
import ResolveUnknown from './pages/ResolveUnknown.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route element={<EmployeeLayout />}>
          <Route index element={<HomePage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="knowledge/documents/:id" element={<DocumentDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="knowledge" element={<KnowledgeManagementPage />} />
          <Route path="documents" element={<CompanyDocumentsPage />} />
          <Route path="learning" element={<LearningResourcesPage />} />
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="gaps" element={<KnowledgeGapsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<ResolveUnknown />} />
    </Routes>
  );
}
