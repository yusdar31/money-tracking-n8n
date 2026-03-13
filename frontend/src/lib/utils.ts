// Utility: format angka ke Rupiah
export function formatRupiah(value: number | string | null | undefined): string {
    const num = Number(value ?? 0);
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(num);
}

// Utility: format tanggal ke bahasa Indonesia
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
    }).format(new Date(dateStr));
}

// Utility: bulan YYYY-MM ke label Indonesia
export function formatBulan(bulan: string): string {
    const [year, month] = bulan.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}

// Utility: current month as YYYY-MM
export function currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
