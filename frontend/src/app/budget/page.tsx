'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api, Budget } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';
import clsx from 'clsx';

const STATUS_BADGE: Record<string, string> = {
    SAFE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    WARNING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    DANGER: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

// Custom Tooltip untuk Recharts agar sesuai dark mode
const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: { color: string; name: string; value: number }[];
    label?: string;
}) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-navy-800 border border-slate-700 rounded-xl p-4 shadow-xl text-xs space-y-2 min-w-[180px]">
            <p className="font-bold text-slate-100 mb-2">{label}</p>
            {payload.map((p) => (
                <div key={p.name} className="flex justify-between gap-4">
                    <span style={{ color: p.color }}>{p.name}</span>
                    <span className="font-semibold text-slate-200">{formatRupiah(p.value)}</span>
                </div>
            ))}
        </div>
    );
};

export default function BudgetPage() {
    const currentYear = new Date().getFullYear();
    const [tahun, setTahun] = useState(currentYear);

    const { data: budgets, isLoading, error } = useSWR(
        ['budget', tahun],
        () => api.getBudget({ tahun }),
    );

    // Aggregasi untuk stat cards (total tahun ini)
    const totals = (budgets ?? []).reduce(
        (acc, b) => ({
            pemasukan: acc.pemasukan + Number(b.total_pemasukan),
            pengeluaran: acc.pengeluaran + Number(b.total_pengeluaran),
            sisa: acc.sisa + Number(b.sisa_budget),
        }),
        { pemasukan: 0, pengeluaran: 0, sisa: 0 }
    );

    // Data chart (ascending by month)
    const chartData = [...(budgets ?? [])]
        .reverse()
        .map((b) => ({
            name: b.bulan_label.slice(0, 3), // "Mar"
            Pemasukan: Number(b.total_pemasukan),
            Pengeluaran: Number(b.total_pengeluaran),
            'Target Saving': Number(b.target_saving),
        }));

    return (
        <div className="p-8">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                        Pelacak Anggaran
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Pantau pemasukan dan pengeluaran Anda secara real-time.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Year selector */}
                    <div className="relative">
                        <select
                            value={tahun}
                            onChange={(e) => setTahun(Number(e.target.value))}
                            className="appearance-none bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                        >
                            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                                <option key={y} value={y}>Tahun {y}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                            expand_more
                        </span>
                    </div>
                    {/* PDF button (placeholder) */}
                    <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-sm">download</span>
                        Laporan PDF
                    </button>
                </div>
            </header>

            {/* ── Stat Cards ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Pemasukan */}
                <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Pemasukan</p>
                        <h3 className="text-2xl font-bold mt-1 text-emerald-500">
                            {isLoading ? '—' : formatRupiah(totals.pemasukan)}
                        </h3>
                        <div className="flex items-center gap-1 mt-2 text-xs text-emerald-500 font-medium">
                            <span className="material-symbols-outlined text-xs">trending_up</span>
                            <span>Total tahun {tahun}</span>
                        </div>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                </div>

                {/* Total Pengeluaran */}
                <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Pengeluaran</p>
                        <h3 className="text-2xl font-bold mt-1 text-rose-500">
                            {isLoading ? '—' : formatRupiah(totals.pengeluaran)}
                        </h3>
                        <div className="flex items-center gap-1 mt-2 text-xs text-rose-500 font-medium">
                            <span className="material-symbols-outlined text-xs">trending_down</span>
                            <span>Total tahun {tahun}</span>
                        </div>
                    </div>
                    <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
                        <span className="material-symbols-outlined">shopping_cart</span>
                    </div>
                </div>

                {/* Sisa Budget */}
                <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sisa Budget</p>
                        <h3 className={clsx(
                            'text-2xl font-bold mt-1',
                            totals.sisa < 0 ? 'text-rose-500' : 'text-primary'
                        )}>
                            {isLoading ? '—' : formatRupiah(totals.sisa)}
                        </h3>
                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 font-medium">
                            <span className="material-symbols-outlined text-xs">info</span>
                            <span>{totals.sisa >= 0 ? 'Aman untuk target tabungan' : 'Budget terlampaui'}</span>
                        </div>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <span className="material-symbols-outlined">savings</span>
                    </div>
                </div>
            </div>

            {/* ── Bar Chart Section ────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold">Grafik Perbandingan Bulanan</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-xs text-slate-500 dark:text-slate-400">Pemasukan</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                            <span className="text-xs text-slate-500 dark:text-slate-400">Pengeluaran</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            <span className="text-xs text-slate-500 dark:text-slate-400">Target Saving</span>
                        </div>
                    </div>
                </div>

                {isLoading && (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm animate-pulse">
                        Memuat grafik…
                    </div>
                )}
                {error && (
                    <div className="h-64 flex items-center justify-center text-rose-400 text-sm">
                        ⚠️ Gagal memuat data
                    </div>
                )}
                {!isLoading && !error && chartData.length === 0 && (
                    <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                        Tidak ada data untuk tahun {tahun}
                    </div>
                )}
                {!isLoading && !error && chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f22" vertical={false} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
                                width={40}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,116,139,0.08)' }} />
                            <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                            <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                            <Bar dataKey="Target Saving" fill="#3c83f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Summary Table ────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Ringkasan Anggaran Bulanan
                    </h3>
                    <a
                        href="/budget"
                        className="text-sm font-medium text-primary flex items-center gap-1 hover:underline"
                    >
                        Lihat Semua Riwayat
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </a>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Bulan</th>
                                <th className="px-6 py-4">Pemasukan</th>
                                <th className="px-6 py-4">Pengeluaran</th>
                                <th className="px-6 py-4">Target Saving</th>
                                <th className="px-6 py-4">Sisa Budget</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm animate-pulse">
                                        Memuat data…
                                    </td>
                                </tr>
                            )}
                            {!isLoading && (budgets ?? []).length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">
                                        Tidak ada data budget tahun {tahun}
                                    </td>
                                </tr>
                            )}
                            {(budgets ?? []).map((b: Budget) => (
                                <tr
                                    key={b.bulan}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                                >
                                    <td className="px-6 py-4 font-semibold text-sm">{b.bulan_label}</td>
                                    <td className="px-6 py-4 text-sm text-emerald-500 font-medium">
                                        {formatRupiah(b.total_pemasukan)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-rose-500 font-medium">
                                        {formatRupiah(b.total_pengeluaran)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-primary font-medium">
                                        {formatRupiah(b.target_saving)}
                                    </td>
                                    <td className={clsx(
                                        'px-6 py-4 text-sm font-semibold',
                                        Number(b.sisa_budget) < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-slate-100'
                                    )}>
                                        {Number(b.sisa_budget) < 0 ? '- ' : ''}{formatRupiah(Math.abs(Number(b.sisa_budget)))}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx(
                                            'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase',
                                            STATUS_BADGE[b.status_budget] ?? STATUS_BADGE['SAFE']
                                        )}>
                                            {b.status_budget}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
