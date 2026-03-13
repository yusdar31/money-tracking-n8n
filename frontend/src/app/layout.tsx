import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
    title: 'Money Tracker — Bank Jago Dashboard',
    description: 'Dashboard rekapitulasi keuangan Bank Jago secara real-time',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                {/* Material Symbols (used by Sidebar & components) */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                    rel="stylesheet"
                />
            </head>
            <body className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen">
                <div className="flex">
                    <Sidebar />
                    <main className="flex-1 ml-[240px] min-h-screen">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
