'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { api, Category } from '@/lib/api';
import { formatRupiah, currentMonth } from '@/lib/utils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';

// ── Color palette untuk kategori ───────────────────────────────────────────
const CATEGORY_COLORS = [
    '#3c83f6', // blue   — primary
    '#10b981', // green  — emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#f43f5e', // rose
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
];

// ── Icon map per kategori ──────────────────────────────────────────────────
const CATEGORY_ICON: Record<string, { icon: string; color: string; bg: string }> = {
    'Makanan': { icon: 'restaurant', color: 'text-primary', bg: 'bg-primary/10' },
    'Belanja': { icon: 'shopping_bag', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    'Transport': { icon: 'flight', color: 'text-violet-500', bg: 'bg-violet-500/10' },
    'Utilitas': { icon: 'receipt_long', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    'Hiburan': { icon: 'movie', color: 'text-rose-500', bg: 'bg-rose-500/10' },
    'Kesehatan': { icon: 'favorite', color: 'text-pink-500', bg: 'bg-pink-500/10' },
    'Pendidikan': { icon: 'school', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    'Pendapatan': { icon: 'payments', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    'default': { icon: 'category', color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

function getCatStyle(name: string) {
    return CATEGORY_ICON[name] ?? CATEGORY_ICON['default'];
}

// ── Custom Recharts Tooltip ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: { name: string; value: number; payload: { pct: number } }[];
}) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 shadow-xl text-sm">
            <p className="font-bold text-white">{payload[0].name}</p>
            <p className="text-slate-300 mt-1">{formatRupiah(payload[0].value)}</p>
            <p className="text-slate-400 text-xs mt-1">{Number(payload[0].payload?.pct ?? 0).toFixed(1)}%</p>
        </div>
    );
};

export default function CategoriesPage() {
    const [bulan, setBulan] = useState(currentMonth());
    const [tipe, setTipe] = useState<'debit' | 'kredit'>('debit');

    const { data: categories, isLoading } = useSWR(
        ['categories', bulan, tipe],
        () => api.getCategories({ bulan, tipe }),
    );

    // Total nominal
    const totalNominal = useMemo(
        () => (categories ?? []).reduce((s, c) => s + Number(c.total_nominal), 0),
        [categories]
    );

    // Pie data
    const pieData = (categories ?? []).map((c) => ({
        name: c.kategori,
        value: Number(c.total_nominal),
        pct: Number(c.pct ?? 0),
    }));

    // Budget pct dari kategori debit (sederhana: pengeluaran / (totalNominal * 1.2) * 100)
    const topCategory = categories?.[0];

    // Format bulan label: "2026-03" -> "Maret 2026"
    const bulanLabel = useMemo(() => {
        if (!bulan) return '';
        const [y, m] = bulan.split('-');
        return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })
            .format(new Date(Number(y), Number(m) - 1, 1));
    }, [bulan]);

    return (
        <div className="p-8">
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <header className="mb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            Analisis Pengeluaran
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Pantau ke mana uang Anda mengalir bulan ini.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <input
                                type="month"
                                value={bulan}
                                onChange={(e) => setBulan(e.target.value)}
                                className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-slate-100"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                                calendar_month
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Debit / Kredit Toggle ────────────────────────────────────────── */}
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
                    {(['debit', 'kredit'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTipe(t)}
                            className={clsx(
                                'w-32 py-2 px-4 text-sm font-semibold rounded-lg transition-all capitalize',
                                tipe === t
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400'
                            )}
                        >
                            {t === 'debit' ? 'Debit' : 'Kredit'}
                        </button>
                    ))}
                </div>
                {/* Category filter chips (dekoratif - bisa dikembangkan) */}
                <div className="flex gap-2 flex-wrap">
                    <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                        Semua Kategori
                    </span>
                </div>
            </div>

            {/* ── Main Grid: Pie + Table ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* Pie Chart — 5/12 */}
                <div className="xl:col-span-5 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">
                        Distribusi Kategori
                    </h3>

                    {/* Donut chart */}
                    <div className="flex items-center justify-center py-4">
                        <div className="relative w-64 h-64">
                            {isLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm animate-pulse">
                                    Memuat…
                                </div>
                            ) : pieData.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                                    Tidak ada data
                                </div>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={72}
                                                outerRadius={112}
                                                paddingAngle={3}
                                                dataKey="value"
                                                strokeWidth={0}
                                            >
                                                {pieData.map((_, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center label */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                                            Total {tipe === 'debit' ? 'Pengeluaran' : 'Pemasukan'}
                                        </span>
                                        <span className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                                            {totalNominal >= 1_000_000
                                                ? `Rp ${(totalNominal / 1_000_000).toFixed(1)}jt`
                                                : formatRupiah(totalNominal)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        {(categories ?? []).slice(0, 8).map((c, i) => (
                            <div key={c.kategori} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                                />
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
                                    {c.kategori} ({Number(c.pct ?? 0).toFixed(0)}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table — 7/12 */}
                <div className="xl:col-span-7 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            Rincian Transaksi
                        </h3>
                        <a href="/transactions" className="text-primary text-sm font-bold hover:underline">
                            Lihat Semua
                        </a>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Transaksi</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total (Rp)</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">%</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {isLoading && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm animate-pulse">
                                            Memuat data…
                                        </td>
                                    </tr>
                                )}
                                {!isLoading && (categories ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                                            Tidak ada data kategori bulan ini
                                        </td>
                                    </tr>
                                )}
                                {(categories ?? []).map((c: Category, i: number) => {
                                    const style = getCatStyle(c.kategori);
                                    return (
                                        <tr
                                            key={c.kategori}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx(
                                                        'size-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                                        style.bg
                                                    )}
                                                        style={i >= Object.keys(CATEGORY_ICON).length - 1
                                                            ? { backgroundColor: `${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}1a` }
                                                            : undefined}
                                                    >
                                                        <span className={clsx('material-symbols-outlined text-lg', style.color)}>
                                                            {style.icon}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                        {c.kategori}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-center">
                                                {c.jumlah_transaksi}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100 text-right">
                                                {formatRupiah(c.total_nominal)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                                    {Number(c.pct ?? 0).toFixed(0)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Budget progress bar footer */}
                    {!isLoading && (categories ?? []).length > 0 && (
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Status Anggaran Bulan Ini
                                </span>
                                <span className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">trending_down</span>
                                    {bulanLabel}
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(pieData[0]?.pct ?? 0, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Analisis Cerdas (Insight) ────────────────────────────────────── */}
            {topCategory && (
                <section className="mt-8">
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="size-12 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                            <span className="material-symbols-outlined">lightbulb</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-base font-bold text-primary">Analisis Cerdas</h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                                Kategori terbesar bulan {bulanLabel} adalah{' '}
                                <strong className="text-slate-900 dark:text-slate-200">
                                    {topCategory.kategori}
                                </strong>{' '}
                                dengan {formatRupiah(topCategory.total_nominal)} ({Number(topCategory.pct ?? 0).toFixed(1)}% dari total{' '}
                                {tipe === 'debit' ? 'pengeluaran' : 'pemasukan'}).{' '}
                                {Number(topCategory.pct ?? 0) > 40
                                    ? 'Pengeluaran kategori ini cukup dominan — pertimbangkan untuk menetapkan limit.'
                                    : 'Distribusi pengeluaran antar kategori terlihat cukup seimbang.'}
                            </p>
                        </div>
                        <button className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-all whitespace-nowrap">
                            Atur Limit
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}
