import { api } from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';
import clsx from 'clsx';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// ── Category icon & color map ─────────────────────────────────────────────
const categoryStyle: Record<string, { icon: string; bg: string; text: string }> = {
    'Hiburan': { icon: 'movie', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600' },
    'Makanan': { icon: 'restaurant', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600' },
    'Pendapatan': { icon: 'work', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600' },
    'Belanja': { icon: 'shopping_cart', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600' },
    'Utilitas': { icon: 'bolt', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600' },
    'Transport': { icon: 'directions_car', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600' },
    'Kesehatan': { icon: 'favorite', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600' },
    'Kredit': { icon: 'payments', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600' },
    'default': { icon: 'receipt_long', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500' },
};

function getCategoryStyle(kategori: string | null, tipe: 'debit' | 'kredit') {
    if (tipe === 'kredit') return categoryStyle['Pendapatan'];
    return categoryStyle[kategori ?? ''] ?? categoryStyle['default'];
}

// ── Budget status config ──────────────────────────────────────────────────
const statusConfig = {
    SAFE: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', ring: 'text-emerald-500', alert: null },
    WARNING: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', ring: 'text-amber-500', alert: 'warning' },
    DANGER: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', ring: 'text-red-500', alert: 'danger' },
};

export default async function DashboardPage() {
    let summary = null;
    let error: string | null = null;

    try {
        summary = await api.getSummary();
    } catch (e) {
        console.error('FAILED TO FETCH SUMMARY:', e);
        error = 'Tidak dapat terhubung ke server. Pastikan backend berjalan.';
    }

    const budget = summary?.budget_bulan_ini;
    const stats = summary?.statistik_bulan_ini;
    const status = (budget?.status_budget ?? 'SAFE') as 'SAFE' | 'WARNING' | 'DANGER';
    const sc = statusConfig[status];

    // Circular SVG progress (r=70, circumference ≈ 440)
    const CIRCUMFERENCE = 2 * Math.PI * 70; // ≈ 439.8
    const pct = Math.min(Number(budget?.pct_saving_risk ?? 0), 100);
    const dashOffset = CIRCUMFERENCE * (1 - pct / 100);

    return (
        <div className="p-8">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Welcome back, here&apos;s your spending summary.</p>
                </div>
                <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Tambah Transaksi
                </button>
            </header>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {error}
                </div>
            )}

            {/* ── Stat Cards ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Saldo */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Saldo</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {summary ? formatRupiah(summary.saldo.saldo_sekarang) : '—'}
                    </p>
                    <div className="mt-4 flex items-center text-emerald-500 text-xs font-medium">
                        <span className="material-symbols-outlined text-sm">trending_up</span>
                        <span className="ml-1">
                            {summary?.saldo.updated_at ? `Update: ${formatDate(summary.saldo.updated_at)}` : 'Real-time via n8n'}
                        </span>
                    </div>
                </div>

                {/* Total Pengeluaran */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Pengeluaran</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {summary ? formatRupiah(budget?.total_pengeluaran) : '—'}
                    </p>
                    <div className="mt-4 flex items-center text-rose-500 text-xs font-medium">
                        <span className="material-symbols-outlined text-sm">trending_down</span>
                        <span className="ml-1">{stats?.total_transaksi_debit ?? 0} transaksi bulan ini</span>
                    </div>
                </div>

                {/* Total Pemasukan */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Pemasukan</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {summary ? formatRupiah(budget?.total_pemasukan) : '—'}
                    </p>
                    <div className="mt-4 flex items-center text-emerald-500 text-xs font-medium">
                        <span className="material-symbols-outlined text-sm">payments</span>
                        <span className="ml-1">{stats?.total_transaksi_kredit ?? 0} transaksi masuk</span>
                    </div>
                </div>

                {/* Sisa Budget */}
                <div className={clsx(
                    'bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4',
                    status === 'DANGER' ? 'border-l-red-500' : status === 'WARNING' ? 'border-l-amber-500' : 'border-l-primary'
                )}>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Sisa Budget</p>
                    <p className={clsx(
                        'text-2xl font-bold',
                        Number(budget?.sisa_budget ?? 0) < 0
                            ? 'text-red-500'
                            : 'text-slate-900 dark:text-white'
                    )}>
                        {summary ? formatRupiah(budget?.sisa_budget) : '—'}
                    </p>
                    <div className={clsx(
                        'mt-4 flex items-center text-xs font-medium',
                        status === 'DANGER' ? 'text-red-500' : status === 'WARNING' ? 'text-amber-500' : 'text-primary'
                    )}>
                        <span className="material-symbols-outlined text-sm">
                            {status === 'DANGER' ? 'warning' : status === 'WARNING' ? 'info' : 'check_circle'}
                        </span>
                        <span className="ml-1">
                            Target saving: {formatRupiah(budget?.target_saving)}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Main Grid: Transactions + Budget ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Recent Transactions — 2/3 */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Transaksi Terbaru</h3>
                            <Link href="/transactions" className="text-primary text-sm font-semibold hover:underline">
                                Lihat Semua
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                        <th className="px-6 py-4">Nama Transaksi</th>
                                        <th className="px-6 py-4">Kategori</th>
                                        <th className="px-6 py-4">Tanggal</th>
                                        <th className="px-6 py-4 text-right">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {(summary?.transaksi_terbaru ?? []).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                                                Belum ada transaksi bulan ini
                                            </td>
                                        </tr>
                                    )}
                                    {summary?.transaksi_terbaru.map((tx) => {
                                        const style = getCategoryStyle(tx.kategori_otomatis, tx.tipe);
                                        return (
                                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={clsx('w-8 h-8 rounded flex items-center justify-center', style.bg)}>
                                                            <span className={clsx('material-symbols-outlined text-sm', style.text)}>
                                                                {style.icon}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                            {tx.merchant_deskripsi || 'Transaksi'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                    {tx.kategori_otomatis || 'Lainnya'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {formatDate(tx.tanggal_waktu)}
                                                </td>
                                                <td className={clsx(
                                                    'px-6 py-4 text-sm font-bold text-right',
                                                    tx.tipe === 'debit' ? 'text-rose-500' : 'text-emerald-500'
                                                )}>
                                                    {tx.tipe === 'debit' ? '- ' : '+ '}
                                                    {formatRupiah(tx.nominal)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Budget + Tips — 1/3 */}
                <div className="flex flex-col gap-6">

                    {/* Budget Bulanan Card */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg">Budget Bulanan</h3>
                            <span className={clsx('px-2 py-1 rounded text-[10px] font-bold uppercase', sc.badge)}>
                                {status}
                            </span>
                        </div>

                        {/* Circular Progress */}
                        <div className="relative h-48 mb-6 flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-4xl font-black text-slate-900 dark:text-white">{Math.round(pct)}%</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tighter">Terpakai</p>
                                </div>
                            </div>
                            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                                <circle
                                    className="text-slate-100 dark:text-slate-800"
                                    cx="80" cy="80" r="70"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                />
                                <circle
                                    className={sc.ring}
                                    cx="80" cy="80" r="70"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    strokeDasharray={CIRCUMFERENCE}
                                    strokeDashoffset={dashOffset}
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>

                        {/* Budget numbers */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Budget Terpakai</p>
                                    <p className="text-lg font-bold">{formatRupiah(budget?.total_pengeluaran)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Limit Total</p>
                                    <p className="text-sm font-semibold text-slate-400 italic">
                                        {formatRupiah(
                                            Number(budget?.total_pemasukan ?? 0) - Number(budget?.target_saving ?? 0)
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Alert banner */}
                            {status === 'WARNING' && (
                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex gap-3">
                                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-500">warning</span>
                                    <div>
                                        <p className="text-sm font-bold text-amber-900 dark:text-amber-400 leading-tight">Waspada Pengeluaran!</p>
                                        <p className="text-xs text-amber-800 dark:text-amber-500/80 mt-1">
                                            Anda telah menggunakan {Math.round(pct)}% dari budget bulanan.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {status === 'DANGER' && (
                                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 flex gap-3">
                                    <span className="material-symbols-outlined text-red-600 dark:text-red-500">error</span>
                                    <div>
                                        <p className="text-sm font-bold text-red-900 dark:text-red-400 leading-tight">Budget Terlampaui!</p>
                                        <p className="text-xs text-red-800 dark:text-red-500/80 mt-1">
                                            Pengeluaran melebihi batas aman. Target saving terancam.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {status === 'SAFE' && (
                                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 flex gap-3">
                                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-500">check_circle</span>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400 leading-tight">Pengeluaran Aman</p>
                                        <p className="text-xs text-emerald-800 dark:text-emerald-500/80 mt-1">
                                            Target saving masih terjaga dengan baik.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tips Hemat Card */}
                    <div className="bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10 p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary">tips_and_updates</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-primary">Tips Hemat</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                {status === 'DANGER'
                                    ? 'Budget bulan ini sudah melebihi batas. Tahan pengeluaran non-esensial hingga akhir bulan.'
                                    : status === 'WARNING'
                                        ? 'Pengeluaran mendekati batas aman. Cek kategori terbesar dan kurangi yang tidak mendesak.'
                                        : 'Bagus! Keuangan bulan ini terkendali. Pertimbangkan investasi dari sisa budget.'}
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
