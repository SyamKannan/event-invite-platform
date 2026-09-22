import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import InvitationPage from './pages/InvitationPage.jsx';
import Landing from './pages/Landing.jsx';
import { ErrorBoundary, PageErrorFallback } from './components/ErrorBoundary.jsx';

// The admin area (editor, dnd-kit, dashboard...) is split into its own
// chunks — a guest opening an invitation on a phone never downloads it.
const AdminLayout = lazy(() => import('./admin/AdminLayout.jsx'));
const Login = lazy(() => import('./admin/Login.jsx'));
const HomeRouter = lazy(() => import('./admin/HomeRouter.jsx'));
const InvitationEditor = lazy(() => import('./admin/InvitationEditor.jsx'));
const RsvpList = lazy(() => import('./admin/RsvpList.jsx'));
const WishList = lazy(() => import('./admin/WishList.jsx'));

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <p className="text-sm uppercase tracking-[0.3em] text-fg-soft">Loading…</p>
    </div>
  );
}

export default function App() {
  return (
    // reducedMotion="user": Framer Motion skips transform/layout animations
    // for visitors whose OS asks for reduced motion (index.css handles the
    // CSS keyframe animations the same way).
    <MotionConfig reducedMotion="user">
      <ErrorBoundary name="app" fallback={<PageErrorFallback />}>
        <Suspense fallback={<Loading />}>
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
        </Suspense>
      </ErrorBoundary>
    </MotionConfig>
  );
}
