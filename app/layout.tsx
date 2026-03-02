import type {Metadata} from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-arabic' });

export const metadata: Metadata = {
  title: 'بتروتريد - نظام الإخطارات',
  description: 'نظام إرسال إنذارات قانونية عبر واتساب لعملاء شركة بتروتريد',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${cairo.variable}`}>
      <body suppressHydrationWarning className="font-arabic">{children}</body>
    </html>
  );
}
