'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const navItems = [
    { href: '/', label: 'Dashboard', icon: 'dashboard' },
    { href: '/transactions', label: 'Transaksi', icon: 'payments' },
    { href: '/budget', label: 'Budget', icon: 'calendar_today' },
    { href: '/categories', label: 'Kategori', icon: 'sell' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed top-0 left-0 h-screen w-[240px] bg-white dark:bg-card-dark border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Money Tracker</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                    ? 'active-nav text-primary font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            )}
                        >
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Profile Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 p-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[20px]">account_circle</span>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Bank Jago</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Account Main</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
