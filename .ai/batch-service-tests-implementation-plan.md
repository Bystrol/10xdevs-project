# Plan Implementacji Testów Jednostkowych - Moduł Importu Danych CSV

## 1. Wprowadzenie i Cel

Niniejszy dokument opisuje plan implementacji testów jednostkowych dla kluczowej funkcjonalności aplikacji WasteTrack: importu danych z plików CSV. Celem testów jest zapewnienie, że logika walidacji danych jest solidna, odporna na błędy i działa zgodnie z założeniami biznesowymi opisanymi w głównym planie testów.

Testy jednostkowe pozwolą na weryfikację logiki w izolacji, co przyspieszy development i ułatwi utrzymanie kodu w przyszłości.

## 2. Identyfikacja Logiki do Testowania

- **Klasa docelowa:** `BatchService`
- **Metoda docelowa:** `importBatch(file: File, userId: string)`
- **Główny fokus:** Logika walidacji zawarta wewnątrz tej metody, która jest odpowiedzialna za sprawdzanie poprawności struktury pliku oraz poszczególnych rekordów.

**Rekomendacja:** Obecnie cała logika (odczyt pliku, parsowanie, walidacja, komunikacja z bazą danych) znajduje się w jednej dużej metodzie. W celu ułatwienia testowania i zwiększenia czytelności kodu, **zaleca się refaktoryzację i wydzielenie samej logiki walidacji** do osobnej, prywatnej metody (np. `validateBatchRows(rows: Record<string, string>[])`). Taka metoda przyjmowałaby jako argument sparsowane dane i zwracała tablicę błędów lub przetworzone dane, co pozwoliłoby na jej testowanie w całkowitej izolacji od zależności zewnętrznych (`File`, `Papa`, `supabaseClient`).

## 3. Strategia Testowania

Testy zostaną zaimplementowane przy użyciu frameworka **Vitest**. Zależności zewnętrzne, takie jak `supabaseClient` i `papaparse`, zostaną zamockowane za pomocą `vi.mock`, aby odizolować testowaną logikę od bazy danych i systemu plików.

Dla każdego scenariusza testowego zostanie stworzony symulowany obiekt `File` z odpowiednią zawartością CSV, aby naśladować realne warunki użytkowania.

## 4. Scenariusze Testowe do Implementacji

Nowy plik testowy zostanie utworzony w lokalizacji: `src/__tests__/unit/batch.service.test.ts`.

### Grupa 1: Scenariusz "Happy Path"

- **Opis:** Testuje poprawny przepływ dla prawidłowo sformatowanego pliku.
- **Przypadek testowy:** `should process a valid CSV file and call the database function with correct data`.
- **Kryteria akceptacji:**
  - Metoda nie rzuca błędu.
  - Funkcja RPC `import_csv_batch` w `supabaseClient` jest wywoływana dokładnie raz z poprawnie przetworzonymi danymi.

### Grupa 2: Walidacja Struktury Pliku i Limitów

- **Opis:** Testuje reguły dotyczące ogólnej struktury pliku CSV.
- **Przypadki testowe:**
  1.  `should throw an error if the file contains no data records`.
  2.  `should throw an error if the file exceeds the 1000 record limit`.
  3.  `should throw an error if required headers ("date", "waste_type", "location", "quantity") are missing`.
  4.  `should throw an error if Papa.parse returns parsing errors` (zamockowana odpowiedź `Papa.parse`).
- **Kryteria akceptacji:** Dla każdego przypadku metoda `importBatch` powinna rzucić wyjątek (`Error`) z odpowiednim komunikatem.

### Grupa 3: Walidacja Danych na Poziomie Wiersza

- **Opis:** Testuje szczegółowe reguły walidacyjne dla poszczególnych rekordów w pliku.
- **Przypadki testowe:**
  1.  `should throw an error for rows with an invalid date format (e.g., "DD/MM/YYYY")`.
  2.  `should throw an error for rows with a future date`.
  3.  `should throw an error for rows with a negative quantity`.
  4.  `should throw an error for rows with a non-numeric quantity (e.g., "abc")`.
  5.  `should throw an error for rows with an unknown waste_type` (mock `supabaseClient` zwróci ograniczoną listę typów odpadów).
  6.  (Opcjonalnie) `should collect and report errors from multiple invalid rows in a single run`, jeśli logika zostanie rozbudowana o zbieranie wszystkich błędów.
- **Kryteria akceptacji:** Metoda powinna rzucić wyjątek z komunikatem zawierającym informację o numerze wiersza i przyczynie błędu.

## 5. Narzędzia i Konfiguracja

- **Framework testowy:** Vitest
- **Mockowanie:** `vi.mock` do izolacji zależności.
- **Asystent AI:** Posłuży do wygenerowania kodu dla powyższych scenariuszy testowych.

## 6. Następne Kroki

1.  Utworzenie pliku `src/__tests__/unit/batch.service.test.ts`.
2.  Implementacja mocków dla `supabaseClient` i `papaparse`.
3.  Implementacja poszczególnych przypadków testowych zgodnie z powyższym planem.
4.  Uruchomienie testów i upewnienie się, że wszystkie przechodzą pomyślnie.
