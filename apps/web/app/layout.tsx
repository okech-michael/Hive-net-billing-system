import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HiveNet | Internet that keeps you connected',
  description: 'Simple, reliable Wi-Fi access powered by HiveNet.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
