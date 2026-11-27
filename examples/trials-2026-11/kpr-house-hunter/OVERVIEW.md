# KPR House Hunter — plain-language overview

## What this is
KPR House Hunter is a small app for your own house search. It runs only on your laptop. You give it a list of houses in a CSV file. It shows which houses you can really afford, best first. Your income and savings never leave your laptop.

## What was decided
- **It runs only on your laptop.** No website, no account, no login. This keeps your money data private (D-002, D-006, D-007).
- **You copy the listings by hand** from Rumah123, 99.co or Lamudi. The app never visits those sites (D-003).
- **A house passes only if the bank would likely say yes.** The monthly payment after the promo rate ends must stay under 30% of your net income (your choice in S4.q2, D-035). The loan length is cut to fit your age (D-055).
- **A house passes only if you have the cash to close.** The app adds the down payment, BPHTB tax, bank fees, notary and insurance (D-011, D-059). Until you enter the notary and insurance amounts, the app says "belum lengkap" and does not mark houses as passing (D-056).
- **The best houses come first.** First by how many of your "nice to have" wishes they meet, then by the smallest cash needed (D-036).
- **You keep the cost figures fresh.** Each figure shows its date and source. After 30 days a yellow bar asks you to check it (D-020).
- **You control your data.** You can save a backup file, delete everything by typing HAPUS, and restore a backup (D-026, D-044).
- **Built with Python and Django**, the tools that fit your laptop best (D-050, D-051, D-052).

## What it costs
| Item | Price | When | Source |
|---|---|---|---|
| Python (already on your laptop) | Rp0 | one time | [cite: price · https://www.python.org/downloads/ · upd 2026-10-25 · acc 2026-11-27 · primary · live] |
| Hosting, domain, accounts | Rp0 | none needed | S2.q3 (answered 2026-11-26) |
| Running the app in a typical or busy month | Rp0 | every month | S2.q5 (answered 2026-11-26) |
| **Total for the app** | **Rp0 per month, Rp0 one time** | | |

Costs of buying a house are not costs of the app, but the app uses them. Example, BCA: provisi 1% of the loan, administration Rp500.000 up to Rp500 juta, 0,10% of the loan up to Rp3 miliar, Rp3.000.000 above [cite: price · https://www.bca.co.id/id/individu/produk/pinjaman/kpr/kpr-first · n.d. · acc 2026-11-27 · primary · live].

## How you will use it
1. Open a terminal in the project folder and type `./start.sh`. Open the bookmark `http://127.0.0.1:8000/`.
2. The first time, fill in **Profil & Kriteria**: your income, other monthly payments, cash you have, your age, your bank settings and what the house must have.
3. Fill in your notary and insurance estimates under **Angka bawaan**.
4. On **Impor CSV**, choose your listings file and click **Impor**.
5. The **Daftar** page shows the houses you can afford, best first. For each house you see the monthly payment during the promo and after it, the loan length and the cash you need.
6. Click **Simpan CSV** to keep the list.

Success means: a file of about 200 houses becomes a saved list in under 10 minutes, and when you check 5 houses by hand, none breaks the 30% rule (D-060).

## What is parked
Nothing. All five parts are in the first version (D-062).

## Limitations
- All answers from the middle of the interview on (S1.q6 onward) were given by a test agent on your behalf, for this trial. Please read DECISIONS.md once and correct anything that is not right for you.
- The app only estimates. The bank also checks your credit record (SLIK OJK) and its own rules (D-013).
- First-home BPHTB relief in Jakarta is not applied automatically; sources disagree (D-012).
- The Depok NPOPTKP of Rp80 juta (your choice in S2.q2) is the legal minimum, not a confirmed Depok figure; ask a notary or Bapenda Depok (D-016).
- Backup files are not encrypted. Keep them on your laptop or a private flash drive (D-031).
- You do not yet know whether your laptop disk is encrypted. HANDOVER.md shows how to check (D-025).
- Degraded planning aids (an internal method was used instead): discover-competitive-analysis (S5), cost-estimator (S6), define-prioritization-framework (S7), api-designer (S9). The UI aids impeccable, antislop-human, antislop-layoutmobile and emil-design-eng were used through the packaged guide excerpts, not as installed skills.
- No Section ran blocked.
