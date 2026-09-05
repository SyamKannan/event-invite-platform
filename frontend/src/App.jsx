import { Navigate, Route, Routes } from 'react-router-dom';
import InvitationPage from './pages/InvitationPage.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import Login from './admin/Login.jsx';
import HomeRouter from './admin/HomeRouter.jsx';
import InvitationEditor from './admin/InvitationEditor.jsx';
import RsvpList from './admin/RsvpList.jsx';
import WishList from './admin/WishList.jsx';
import Landing from './pages/Landing.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/i/:slug" element={<InvitationPage />} />

      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<HomeRouter />} />
        <Route path="invitations/:id" element={<InvitationEditor />} />
        <Route path="invitations/:id/rsvps" element={<RsvpList />} />
        <Route path="invitations/:id/wishes" element={<WishList />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
