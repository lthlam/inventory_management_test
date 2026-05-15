import './globals.css';
import { ReactNode } from 'react';
import { Be_Vietnam_Pro } from 'next/font/google';
import Header from '../components/Header';

export const metadata = {
  title: 'Quản Lý Kho VIMES',
  description: 'Hệ thống quản lý phiếu nhập kho chuyên nghiệp',
};

import QueryProvider from '../providers/QueryProvider';

const appFont = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${appFont.className} antialiased text-slate-100 min-h-screen`}>
        <QueryProvider>
          <main className="max-w-7xl mx-auto p-6">
            <Header />
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
