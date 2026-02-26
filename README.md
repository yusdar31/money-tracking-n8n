# 💰 Bank Jago Expense Tracker

Sistem pencatatan keuangan otomatis berbasis **n8n**, **AWS**, dan **AI Gemini** yang memantau transaksi Bank Jago secara real-time melalui email, menyimpannya ke database PostgreSQL, dan memberikan notifikasi serta chatbot AI melalui Telegram.

![AWS](https://img.shields.io/badge/AWS-EC2%20%2B%20RDS-orange?logo=amazon-aws)
![Terraform](https://img.shields.io/badge/IaC-Terraform-purple?logo=terraform)
![n8n](https://img.shields.io/badge/Automation-n8n-red)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-green?logo=google)

---

## ✨ Fitur

- 📧 **Pencatatan Otomatis** — Setiap email notifikasi dari Bank Jago otomatis diproses dan dicatat ke database
- 💸 **Deteksi Tipe Transaksi** — Membedakan debit, kredit, dan transfer antar pocket
- 📊 **Tracking Budget Bulanan** — Memantau pengeluaran vs pemasukan vs target saving secara otomatis
- 💰 **Tracking Saldo Real-time** — Saldo rekening terupdate setiap ada transaksi
- 🔔 **Telegram Alert** — Notifikasi otomatis ke Telegram ketika ada transaksi atau budget mendekati batas
- 🤖 **AI Chatbot (Gemini)** — Tanya jawab keuangan via Telegram menggunakan bahasa natural
- 🏗️ **Infrastructure as Code** — Seluruh infrastruktur AWS dikelola dengan Terraform
- 🔄 **CI/CD Pipeline** — Deploy otomatis menggunakan GitHub Actions

---

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                        AWS Cloud                        │
│                                                         │
│  ┌──────────────┐         ┌──────────────────────────┐  │
│  │   EC2 (t3.micro)       │   RDS PostgreSQL         │  │
│  │              │◄───────►│   (db.t3.micro)          │  │
│  │  n8n         │         │                          │  │
│  │  (Docker)    │         │  - jago_transactions     │  │
│  │              │         │  - monthly_budget        │  │
│  └──────┬───────┘         │  - saldo_rekening        │  │
│         │                 └──────────────────────────┘  │
│         │ Caddy (HTTPS)                                  │
└─────────┼───────────────────────────────────────────────┘
          │
    ┌─────┴──────┐
    │  Internet  │
    └─────┬──────┘
          │
  ┌───────┴────────┐
  │  Gmail API     │── Email Bank Jago ──► n8n Workflow
  │  Telegram API  │◄─ Alert & AI Chat ──  n8n Workflow
  │  Google Gemini │── AI Processing ───►  n8n Workflow
  └────────────────┘
```

### Alur Kerja Utama

```
📧 Email Bank Jago
        ↓
   Gmail Trigger (polling/menit)
        ↓
   Extract Transaction Data (JavaScript)
   • Deteksi tipe: debit/kredit/transfer_pocket
   • Ekstrak nominal, merchant, tanggal
   • Kategorisasi otomatis
        ↓
   Insert to PostgreSQL
        ↓
   Update Saldo Rekening
        ↓
   Get Monthly Budget Status
        ↓
   IF budget < batas?
   ├── ⚠️ Telegram Budget Alert
   └── ✅ Telegram Transaction Confirm
```

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|---|---|
| Automation | n8n (self-hosted, Docker) |
| Database | PostgreSQL 15 (AWS RDS) |
| Server | AWS EC2 t3.micro |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| AI | Google Gemini 2.5 Flash |
| Notifikasi | Telegram Bot API |
| Email Source | Gmail API (OAuth2) |
| DNS/HTTPS | DuckDNS + Caddy |

---

## 📁 Struktur Project

```
money-tracking/
├── terraform/
│   ├── main.tf              # EC2, RDS, Security Groups, IAM
│   ├── variables.tf         # Input variables
│   ├── backend.tf           # S3 remote state
│   ├── user_data.sh         # EC2 bootstrap script (Docker, n8n, Caddy)
│   └── terraform.tfvars.example
├── database/
│   ├── schema.sql           # Database schema + triggers + views
│   └── migrate_add_saldo.sql # Migration: tambah tracking saldo
├── n8n/
│   ├── jago_expense_tracker_workflow.json  # Workflow utama
│   └── ai_chatbot_workflow.json            # Workflow AI Chatbot
├── .github/
│   └── workflows/
│       ├── terraform-cicd.yml  # Deploy infrastruktur
│       ├── n8n-sync.yml        # Sync workflow ke n8n
│       └── db-migrate.yml      # Jalankan database migration
└── README.md
```

---

## 🚀 Setup & Deployment

### Prerequisites

- AWS Account dengan akses CLI
- Terraform >= 1.0
- GitHub repository dengan Secrets yang sudah dikonfigurasi
- Google Cloud Project untuk Gmail OAuth2
- Telegram Bot (via BotFather)
- Google AI Studio API Key (Gemini)

### 1. Clone Repository

```bash
git clone https://github.com/<username>/money-tracking.git
cd money-tracking
```

### 2. Konfigurasi Terraform Variables

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Edit terraform.tfvars sesuai environment kamu
```

### 3. Setup GitHub Secrets

Tambahkan secrets berikut di GitHub repository → Settings → Secrets:

| Secret | Keterangan |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS Access Key |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key |
| `TF_VAR_db_password` | Password database PostgreSQL |
| `TF_VAR_n8n_password` | Password login n8n |
| `TF_VAR_duckdns_token` | Token DuckDNS |
| `N8N_API_KEY` | API Key n8n untuk sync workflow |

### 4. Deploy Infrastruktur

Push ke branch `main` untuk memicu GitHub Actions CI/CD pipeline:

```bash
git push origin main
```

Atau deploy manual:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 5. Setup n8n

Setelah infrastruktur berjalan:
1. Akses n8n di `https://<your-domain>`
2. Import workflow dari folder `n8n/`
3. Konfigurasi credentials (Gmail, PostgreSQL, Telegram)
4. Tambahkan environment variable `GEMINI_API_KEY` di `docker-compose.yml`
5. Aktifkan kedua workflow

### 6. Konfigurasi Database

```bash
# Jalankan schema awal
psql -h <RDS_ENDPOINT> -U n8n_user -d expense_tracker -f database/schema.sql

# Jalankan migration saldo
psql -h <RDS_ENDPOINT> -U n8n_user -d expense_tracker -f database/migrate_add_saldo.sql
```

---

## 🤖 AI Chatbot Commands

Kirim pesan ke bot Telegram kamu:

| Perintah | Contoh |
|---|---|
| Cek saldo | `"Berapa saldo saya?"` |
| Cek budget | `"Berapa pengeluaran bulan ini?"` |
| Cek target saving | `"Berapa target saving saya?"` |
| Lihat transaksi | `"Tampilkan 5 transaksi terakhir"` |
| Ubah target saving | `"Ubah target saving jadi 4 juta"` |
| Info umum | `"Halo"`, `"Apa yang bisa kamu lakukan?"` |

---

## 📊 Database Schema

```sql
-- Tabel utama transaksi
jago_transactions (id, tanggal_waktu, tipe, nominal, merchant_deskripsi, 
                   kategori_otomatis, saldo_akhir, email_subject)

-- Budget & tracking bulanan (auto-update via trigger)
monthly_budget (bulan, target_saving, total_pengeluaran, total_pemasukan,
                sisa_budget [computed], pct_saving_risk [computed])

-- Saldo rekening real-time
saldo_rekening (saldo_sekarang, updated_at, keterangan)
```

---

## 📱 Contoh Notifikasi Telegram

```
🔔 Transaksi Baru
Merchant: WARUNG ERDY
Nominal: Rp 45.000
Tipe: Debit
Waktu: 25 Feb 2026, 14:30

📊 Budget Bulan Ini:
Total Pengeluaran: Rp 1.200.000
Sisa Budget: Rp 800.000
⚠️ Pengeluaran mendekati batas aman!
```

---

## 🔧 CI/CD Pipeline

```
Push to main
    ↓
Terraform Plan & Apply (infrastruktur)
    ↓
Database Migration
    ↓
n8n Workflow Sync
```

---

## 📝 License

MIT License — bebas digunakan dan dimodifikasi.

---

## 👤 Author

**Andi Yusdar Al Imran** — Bank Jago Expense Tracker menggunakan AWS + n8n + Gemini AI
