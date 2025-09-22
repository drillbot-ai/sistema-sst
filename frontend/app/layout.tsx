import './globals.css';
import { ReactNode } from 'react';
import Providers from './providers';

export const metadata = {
  title: 'Sistema SG‑SST',
  description: 'Gestión de seguridad y salud en el trabajo para transporte',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
        {/* Wrap the application in Providers for React Query and other contexts. */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
