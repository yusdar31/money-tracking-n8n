'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import clsx from 'clsx';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES = [
    'Makanan', 'Transport', 'Hiburan', 'Belanja', 
    'Kesehatan', 'Utilitas', 'Pendidikan', 'Investasi', 'Lain-lain'
];

export default function AddTransactionModal({ isOpen, onClose, onSuccess }: AddTransactionModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        merchant_deskripsi: '',
        nominal: '',
        tipe: 'debit' as 'debit' | 'kredit',
        kategori_otomatis: 'Lain-lain',
        tanggal_waktu: new Date().toISOString().slice(0, 16) // Format YYYY-MM-DDTHH:mm
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.createTransaction({
                ...formData,
                nominal: Number(formData.nominal),
                tanggal_waktu: new Date(formData.tanggal_waktu).toISOString()
            });
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                merchant_deskripsi: '',
                nominal: '',
                tipe: 'debit',
                kategori_otomatis: 'Lain-lain',
                tanggal_waktu: new Date().toISOString().slice(0, 16)
            });
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan transaksi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tambah Transaksi</h3>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Deskripsi / Merchant
                        </label>
                        <input 
                            required
                            type="text"
                            placeholder="Contoh: Nasi Goreng, Top Up..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all dark:text-white"
                            value={formData.merchant_deskripsi}
                            onChange={(e) => setFormData({...formData, merchant_deskripsi: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                Nominal (Rp)
                            </label>
                            <input 
                                required
                                type="number"
                                placeholder="0"
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all dark:text-white"
                                value={formData.nominal}
                                onChange={(e) => setFormData({...formData, nominal: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                Tipe
                            </label>
                            <select 
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all dark:text-white"
                                value={formData.tipe}
                                onChange={(e) => setFormData({...formData, tipe: e.target.value as 'debit' | 'kredit'})}
                            >
                                <option value="debit">Pengeluaran (Debit)</option>
                                <option value="kredit">Pemasukan (Kredit)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                Kategori
                            </label>
                            <select 
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all dark:text-white"
                                value={formData.kategori_otomatis}
                                onChange={(e) => setFormData({...formData, kategori_otomatis: e.target.value})}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                Waktu
                            </label>
                            <input 
                                type="datetime-local"
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all dark:text-white"
                                value={formData.tanggal_waktu}
                                onChange={(e) => setFormData({...formData, tanggal_waktu: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            disabled={loading}
                            type="submit"
                            className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">save</span>
                                    Simpan
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
