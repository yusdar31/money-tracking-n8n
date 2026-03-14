// Centralized API client — semua fetch ke backend melewati sini

const API_URL = typeof window === 'undefined' 
    ? 'http://backend:3001' // Server-side fetch (Docker internal network TCP)
    : 'https://yus-moneytracker.duckdns.org'; // Client-side hardcoded (Safe Route)

async function apiFetch<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 30 }, // ISR: revalidate tiap 30 detik
    });
    if (!res.ok) {
        throw new Error(`API error ${res.status}: ${await res.text()}`);
    }
    return res.json();
}

// ----- Types -----

export interface Transaction {
    id: string;
    tanggal_waktu: string;
    tipe: 'debit' | 'kredit';
    nominal: number;
    merchant_deskripsi: string | null;
    kategori_otomatis: string | null;
    email_subject: string | null;
    created_at: string;
}

export interface TransactionList {
    total: number;
    limit: number;
    offset: number;
    data: Transaction[];
}

export interface Saldo {
    saldo_sekarang: number;
    updated_at: string | null;
    keterangan: string | null;
}

export interface Budget {
    bulan: string;
    bulan_label: string;
    target_saving: number;
    total_pemasukan: number;
    total_pengeluaran: number;
    sisa_budget: number;
    pct_saving_risk: number;
    status_budget: 'SAFE' | 'WARNING' | 'DANGER';
    jumlah_transaksi: number;
}

export interface Summary {
    saldo: Saldo;
    budget_bulan_ini: Budget | null;
    statistik_bulan_ini: {
        total_transaksi: number;
        total_transaksi_debit: number;
        total_transaksi_kredit: number;
        total_debit: number;
        total_kredit: number;
    };
    transaksi_terbaru: Transaction[];
}

export interface Category {
    kategori: string;
    jumlah_transaksi: number;
    total_nominal: number;
    pct: number;
}

// ----- API Functions -----

export const api = {
    getSummary: () => apiFetch<Summary>('/api/summary'),
    getTrend: () => apiFetch<Budget[]>('/api/summary/trend'),

    getTransactions: (params?: {
        bulan?: string;
        tipe?: string;
        kategori?: string;
        limit?: number;
        offset?: number;
    }) => {
        const qs = new URLSearchParams();
        if (params?.bulan) qs.set('bulan', params.bulan);
        if (params?.tipe) qs.set('tipe', params.tipe);
        if (params?.kategori) qs.set('kategori', params.kategori);
        if (params?.limit) qs.set('limit', String(params.limit));
        if (params?.offset) qs.set('offset', String(params.offset));
        return apiFetch<TransactionList>(`/api/transactions?${qs}`);
    },

    getBudget: (params?: { tahun?: number; bulan?: string }) => {
        const qs = new URLSearchParams();
        if (params?.tahun) qs.set('tahun', String(params.tahun));
        if (params?.bulan) qs.set('bulan', params.bulan);
        return apiFetch<Budget[]>(`/api/budget?${qs}`);
    },

    getSaldo: () => apiFetch<Saldo>('/api/saldo'),

    getCategories: (params?: { bulan?: string; tipe?: string }) => {
        const qs = new URLSearchParams();
        if (params?.bulan) qs.set('bulan', params.bulan);
        if (params?.tipe) qs.set('tipe', params.tipe);
        return apiFetch<Category[]>(`/api/categories?${qs}`);
    },
};
