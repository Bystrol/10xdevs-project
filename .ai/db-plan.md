# WasteTrack Dashboard - PostgreSQL Database Schema

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### users

This table is managed by Supabase Auth.

- id: UUID PRIMARY KEY
- email: VARCHAR(255) NOT NULL UNIQUE
- encrypted_password: VARCHAR NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- confirmed_at: TIMESTAMPTZ

### waste_types

- id: SERIAL PRIMARY KEY
- name: TEXT UNIQUE NOT NULL
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW() (optional, for auditing)

_Pre-populate with: INSERT INTO waste_types (name) VALUES ('PLASTIC'), ('BIO'), ('GLASS'), ('PAPER'), ('MIXED');_

### locations

- id: SERIAL PRIMARY KEY
- name: TEXT UNIQUE NOT NULL
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW() (optional)

### batches

- id: SERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- filename: TEXT NOT NULL
- status: ENUM('active', 'deleted') DEFAULT 'active' NOT NULL
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL

### waste_data

- id: SERIAL PRIMARY KEY
- batch_id: INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE
- waste_type_id: INTEGER NOT NULL REFERENCES waste_types(id) ON DELETE RESTRICT
- location_id: INTEGER NOT NULL REFERENCES locations(id) ON DELETE RESTRICT
- date: DATE NOT NULL CHECK (date <= CURRENT_DATE)
- quantity: INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0)
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW() (optional)

### audit_logs (optional for MVP)

- id: SERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- action: TEXT NOT NULL (e.g., 'batch_import', 'batch_delete')
- batch_id: INTEGER REFERENCES batches(id)
- timestamp: TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL

## 2. Relacje między tabelami

- **users (1:N) batches**: Jeden użytkownik może mieć wiele partii (batches). Kardynalność: 1:N. Foreign key: batches.user_id → users.id.
- **batches (1:N) waste_data**: Jedna partia może zawierać wiele rekordów danych o odpadach. Kardynalność: 1:N. Foreign key: waste_data.batch_id → batches.id (ON DELETE CASCADE dla automatycznego rollbacku).
- **waste_types (N:1) waste_data**: Wiele rekordów danych może odnosić się do jednego typu odpadu. Kardynalność: N:1. Foreign key: waste_data.waste_type_id → waste_types.id (ON DELETE RESTRICT dla integralności).
- **locations (N:1) waste_data**: Wiele rekordów danych może odnosić się do jednej lokalizacji. Kardynalność: N:1. Foreign key: waste_data.location_id → locations.id (ON DELETE RESTRICT).
- **users (1:N) audit_logs**: Jeden użytkownik może mieć wiele wpisów w logach audytu. Kardynalność: 1:N. Foreign key: audit_logs.user_id → auth.users.id.
- **auth.users (1:1) users**: Relacja synchronizowana via trigger lub edge function w Supabase dla mirrorowania danych auth.

Brak relacji wiele-do-wielu; normalizacja do 3NF z tabelami lookup (waste_types, locations) dla uniknięcia duplikatów i błędów pisowni.

## 3. Indeksy

- **waste_data**:
  - UNIQUE INDEX ON (batch_id, waste_type_id, location_id, date) – zapobiega duplikatom w ramach batcha (bez quantity, aby pozwolić na agregację).
  - COMPOSITE INDEX ON (date, waste_type_id, location_id) – optymalizuje filtry i agregacje dla wykresów (per miesiąc/typ/lokalizacja).
  - INDEX ON batch_id – szybki dostęp do danych batcha.
  - INDEX ON date – wspiera BETWEEN dla zakresów dat i GROUP BY EXTRACT(YEAR/MONTH FROM date).

- **batches**:
  - INDEX ON user_id – szybki dostęp do partii użytkownika.
  - COMPOSITE INDEX ON (user_id, created_at DESC) – sortowanie i listowanie partii chronologicznie.

- **users**: INDEX ON email (choć UNIQUE już implikuje indeks).

- **locations**: INDEX ON name (choć UNIQUE implikuje).

Te indeksy zapewniają wydajność zapytań <1s dla ≤1000 rekordów/batch i ≤100 batches/user (~100k rekordów total).

## 4. Zasady PostgreSQL (RLS Policies)

Włącz RLS na tabelach: batches, waste_data, audit_logs (ENABLE ROW LEVEL SECURITY;).

- **batches**:
  - CREATE POLICY "Users can access own batches" ON batches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  - (SELECT, INSERT, UPDATE, DELETE ograniczone do własnych danych użytkownika).

- **waste_data**:
  - CREATE POLICY "Users can access own waste data via batch" ON waste_data FOR ALL USING (EXISTS (SELECT 1 FROM batches WHERE batches.id = waste_data.batch_id AND auth.uid() = batches.user_id)) WITH CHECK (EXISTS (SELECT 1 FROM batches WHERE batches.id = waste_data.batch_id AND auth.uid() = batches.user_id));
  - (Subquery zapewnia izolację via batch.user_id; wspiera INSERT/UPDATE tylko dla własnych batchy).

- **audit_logs** (opcjonalne):
  - CREATE POLICY "Users can access own audit logs" ON audit_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  - Lub uproszczone: USING (true) dla admin/read-only w MVP.

- **users**: RLS opcjonalne; polityka SELECT USING (auth.uid() = id) dla samo-dostępu.

Polityki izolują dane per użytkownik (brak dostępu do cudzych batchy/danych), zgodne z Supabase Auth (US-010). Brak ról; walidacja w app dla mapowania CSV do ID (e.g., INSERT OR IGNORE dla locations).

## 5. Dodatkowe uwagi lub wyjaśnienia dotyczące decyzji projektowych

- **Normalizacja**: Schemat w 3NF; tabele lookup (waste_types pre-filled, locations dynamiczne) minimalizują duplikaty i błędy (np. 'plastic' vs 'PLASTIC' – mapuj via LOWER(name)). Brak denormalizacji dla MVP (mała skala).
- **Integralność**: CHECK constraints (date <= CURRENT_DATE, quantity > 0) i FK (RESTRICT/CASCADE) zapewniają spójność. Transakcje w API dla importu: BEGIN; INSERT batch; INSERT waste_data ON CONFLICT DO NOTHING; COMMIT; – obsługa błędów via affected rows (US-001/US-002/US-009).
- **Skalowalność**: Brak partycjonowania dla MVP (≤100k rows); indeksy pokrywają zapytania agregujące (VIEW monthly_totals AS SELECT EXTRACT(YEAR FROM date) AS year, EXTRACT(MONTH FROM date) AS month, waste_type_id, location_id, SUM(quantity) FROM waste_data GROUP BY ...;). Max 100 active batches/user obsługiwane w app (SELECT COUNT(\*) < 100 WHERE status='active').
- **Bezpieczeństwo**: RLS + Supabase Auth izoluje dane; audit_logs z triggerem AFTER INSERT/DELETE ON batches (e.g., INSERT INTO audit_logs ...). Brak przechowywania CSV; rollback via DELETE batch (CASCADE czyści waste_data).
- **Wydajność**: Proste VIEW dla dashboardu (US-003/US-004); przetestuj EXPLAIN ANALYZE dla filtrów. Synchronizacja public.users z auth.users via Supabase trigger (e.g., AFTER INSERT ON auth.users → INSERT public.users).
- **Zgodność z PRD**: Wspiera import/walidację (US-001/US-002), rollback (US-005), wykresy/filtrowanie (US-003/US-004), AI-raport/eksport (US-006/US-007) via agregacje. Toasty błędów via app (duplikaty, >1000 rows).
- **MVP Ograniczenia**: Brak materialized views; audit opcjonalne; brak edycji pojedynczych rekordów (tylko batch rollback).
