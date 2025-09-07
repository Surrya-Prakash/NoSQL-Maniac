import './globals.css';
import { Inter } from 'next/font/google';
import { ConfirmProvider } from '@/hooks/useConfirm';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'NoSQL Knockout - MongoDB Competition',
  description: 'Professional MongoDB Query Competition Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <ConfirmProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </ConfirmProvider>
      </body>
    </html>
  );
}


