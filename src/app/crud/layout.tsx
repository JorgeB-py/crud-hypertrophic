// src/app/productos/layout.tsx
import { Header } from '@/components/header';
import RequireAuth from '@/components/requireAuth'

export default function Layout({ children }: { children: React.ReactNode }) {
  return( 
    <>
  <Header/>
  <RequireAuth>{children}</RequireAuth>
  </>
  );
}
