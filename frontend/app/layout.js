import { Toaster } from 'react-hot-toast';
import { AuthProvider, VisitProvider } from '../context/index';
import '../styles/globals.css';

export const metadata = { title: 'HVMS – Hostel Visit Management', description: 'Digital hostel visit management system' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      </head>
      <body>
        <AuthProvider>
          <VisitProvider>
            {children}
            <Toaster position="top-right" toastOptions={{
              style: { fontFamily: "'Plus Jakarta Sans', system-ui", fontSize: '13px', fontWeight: 500, borderRadius: '12px', padding: '12px 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              duration: 4000,
            }} />
          </VisitProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
