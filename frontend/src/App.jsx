import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AppRouter />
      </NotificationsProvider>
    </AuthProvider>
  );
}