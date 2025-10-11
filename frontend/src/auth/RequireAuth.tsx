import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { JSX } from 'react';

type Props = { children: JSX.Element };

export default function RequireAuth({ children }: Props) {
  const { token } = useAuth();
  const loc = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: loc }} />;
  return children;
}