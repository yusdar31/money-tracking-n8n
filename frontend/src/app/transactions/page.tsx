'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { formatRupiah, currentMonth, formatBulan } from '@/lib/utils';

import clsx from 'clsx';

// Icon map for Transaction Category
const CATEGORY_STYLE: Record<string, { icon: string; bg: string; text: string }> = {
    'Hiburan': { icon: 'movie', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
    'Makanan': { icon: 'restaurant', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
    'Pendapatan': { icon: 'work', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    'Belanja': { icon: 'shopping_cart', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
    'Utilitas': { icon: 'bolt', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    'Transportasi': { icon: 'directions_car', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
    'Kesehatan': { icon: 'favorite', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
    'Kredit': { icon: 'payments', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    'default': { icon: 'receipt_long', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500 dark:text-slate-400' },
};

function getCatStyle(kategori: string | null, tipe: 'debit' | 'kredit') {
    if (tipe === 'kredit') return CATEGORY_STYLE['Pendapatan'];
    return CATEGORY_STYLE[kategori ?? ''] ?? CATEGORY_STYLE['default'];
}

export default function TransactionsPage() {
    const [bulan, setBulan] = useState(currentMonth());
    const [tipe, setTipe] = useState<'all' | 'debit' | 'kredit'>('all');
    const [page, setPage] = useState(1);
    const limit = 10;

    // SWR fetch with keepPreviousData for smooth pagination
    const { data, isLoading } = useSWR(
        ['transactions', bulan, tipe, page, limit],
        () => api.getTransactions({ bulan, tipe, page, limit }),
        { keepPreviousData: true }
    );

    const txs = data?.data ?? [];
    const meta = data;
    const totalItems = meta?.total ?? 0;
    const totalPages = meta?.totalPages ?? 1;

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus transaksi ini?')) return;
        try {
            await api.deleteTransaction(id);
            // Refresh SWR
            mutate(['transactions', bulan, tipe, page, limit]);
            alert('Transaksi berhasil dihapus');
        } catch (err) {
            alert('Gagal menghapus transaksi');
        }
    };

    // Helper untuk format tanggal ala "24 Okt 2023"
    const formatTxDate = (dateStr: string) => {
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(new Date(dateStr));
    };

    return (
        <div className="p-8 max-w-7xl w-full mx-auto">
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Riwayat Transaksi
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Pantau semua pemasukan dan pengeluaran Anda
                </p>
            </div>

            {/* ── Filters ─────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {/* Periode filter */}
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Periode</label>
                    <div className="relative">
                        <input
                            type="month"
                            value={bulan}
                            onChange={(e) => {
                                setBulan(e.target.value);
                                setPage(1);
                            }}
                            className="appearance-none flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-44 pl-10 pr-4 py-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                            calendar_month
                        </span>
                    </div>
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block" />

                {/* Tipe filter */}
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipe</label>
                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                        {(['all', 'debit', 'kredit'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => { setTipe(t); setPage(1); }}
                                className={clsx(
                                    'px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize',
                                    tipe === t
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                )}
                            >
                                {t === 'all' ? 'Semua' : t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1" />

                {/* Search (Placeholder - UI only) */}
                <div className="relative w-full md:w-auto">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                        search
                    </span>
                    <input
                        className="pl-10 pr-4 py-2 w-full md:w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                        placeholder="Cari transaksi..."
                        type="text"
                        disabled // Placeholder
                    />
                </div>
            </div>

            {/* ── Data Table ──────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tanggal</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Keterangan</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kategori</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tipe</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nominal</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {isLoading && txs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm animate-pulse">
                                        Memuat transaksi...
                                    </td>
                                </tr>
                            )}
                            {!isLoading && txs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                                        Tidak ada transaksi {tipe !== 'all' ? tipe : ''} bulan {formatBulan(bulan)}
                                    </td>
                                </tr>
                            )}
                            {txs.map((tx) => {
                                const style = getCatStyle(tx.kategori_otomatis, tx.tipe);
                                return (
                                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-5 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {formatTxDate(tx.tanggal_waktu)}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-slate-900 dark:text-slate-100">
                                                {tx.merchant_deskripsi || 'Transaksi'}
                                            </div>
                                            {tx.catatan_n8n && (
                                                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1 max-w-xs truncate">
                                                    {tx.catatan_n8n}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold">
                                                <span className={style.text}>
                                                    <span className="material-symbols-outlined text-[14px] align-middle">{style.icon}</span>
                                                </span>
                                                <span>{tx.kategori_otomatis || 'Lainnya'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={clsx(
                                                'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight',
                                                tx.tipe === 'debit'
                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                            )}>
                                                {tx.tipe}
                                            </span>
                                        </td>
                                        <td className={clsx(
                                            'px-6 py-5 text-right font-bold whitespace-nowrap',
                                            tx.tipe === 'debit' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                                        )}>
                                            {tx.tipe === 'debit' ? '- ' : '+ '}
                                            {formatRupiah(tx.nominal)}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <button
                                                onClick={() => handleDelete(tx.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Pagination ──────────────────────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Menampilkan <span className="font-bold text-slate-900 dark:text-slate-100">{txs.length}</span> dari <span className="font-bold text-slate-900 dark:text-slate-100">{totalItems}</span> transaksi
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="size-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        <span className="px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {page} / {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="size-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
