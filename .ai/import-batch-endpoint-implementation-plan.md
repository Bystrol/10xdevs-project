# API Endpoint Implementation Plan: POST /batches/import

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom przesyłanie plików CSV z danymi o odpadach. System przetwarza plik, waliduje jego zawartość i zapisuje dane jako nowy batch w bazie danych. W przypadku powodzenia, zwraca szczegóły nowo utworzonego batcha.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/batches/import`
- **Typ zawartości**: `multipart/form-data`
- **Ciało żądania**:
  - `file`: (Wymagane) Plik w formacie CSV.

## 3. Wykorzystywane typy

- **Odpowiedź sukcesu**: `ImportCsvBatchResponseDto` (`src/types.ts`)

  ```typescript
  export interface ImportCsvBatchResponseDto {
    message: string;
    batch: BatchDto;
  }
  ```

- **Odpowiedź błędu**: Generyczny obiekt

  ```json
  { "error": "Szczegółowy opis błędu." }
  ```

- **Wewnętrzna reprezentacja wiersza CSV**:
  ```typescript
  interface WasteDataCsvRow {
    date: string;
    waste_type: string;
    location: string;
    quantity: number;
  }
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created)**:

  ```json
  {
    "message": "Import successful",
    "batch": {
      "id": 2,
      "filename": "q4_report.csv",
      "status": "active",
      "recordCount": 500,
      "createdAt": "2025-10-08T11:00:00Z"
    }
  }
  ```

- **Odpowiedzi błędów**:
  - `400 Bad Request`: W przypadku błędów walidacji danych wejściowych.
  - `401 Unauthorized`: W przypadku braku uwierzytelnienia.
  - `500 Internal Server Error`: W przypadku wewnętrznych błędów serwera.

## 5. Przepływ danych

1.  Klient wysyła żądanie `POST` z plikiem CSV na endpoint `/api/batches/import`.
2.  Middleware Astro weryfikuje sesję użytkownika za pomocą `context.locals.supabase`.
3.  Endpoint API (`src/pages/api/batches/import.ts`) odbiera żądanie, wykonuje podstawową walidację (obecność i typ pliku) i wywołuje metodę `batchService.importBatch(file, userId)`.
4.  `BatchService` (`src/lib/services/batch.service.ts`) wykonuje logikę biznesową:

a. Parsuje plik CSV.

b. Waliduje liczbę rekordów (max 1000) i sprawdza obecność wymaganych nagłówków.

c. Pobiera istniejące typy odpadów i lokalizacje z bazy danych w celu walidacji wierszy.

d. Iteruje przez każdy wiersz CSV, walidując format daty, istnienie typu odpadu i lokalizacji oraz poprawność ilości.

e. Jeśli walidacja przebiegnie pomyślnie, rozpoczyna transakcję bazodanową.

5.  W ramach transakcji w bazie danych Supabase:

a. Tworzony jest nowy rekord w tabeli `batches` z `user_id` zalogowanego użytkownika i nazwą pliku.

b. Wszystkie zwalidowane rekordy z CSV są masowo wstawiane do tabeli `waste_data`, powiązane z ID nowo utworzonego batcha.

6.  Jeśli transakcja się powiedzie, `BatchService` zwraca `BatchDto` do endpointu API.
7.  Endpoint API formatuje odpowiedź sukcesu (`ImportCsvBatchResponseDto`) i wysyła ją do klienta ze statusem `201 Created`.
8.  W przypadku błędu na którymkolwiek etapie, transakcja jest wycofywana, a odpowiedni komunikat o błędzie i status HTTP są zwracane do klienta.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do endpointu będzie chroniony. Każde żądanie musi zawierać ważny token sesji Supabase. Weryfikacja sesji odbędzie się za pomocą `context.locals.supabase.auth.getUser()`.
- **Autoryzacja**: Identyfikator użytkownika (`user_id`) do zapisu w tabeli `batches` będzie pobierany wyłącznie z obiektu sesji, aby zapobiec modyfikacji tego pola przez klienta.
- **Walidacja pliku**: Nazwa pliku będzie oczyszczana z potencjalnie niebezpiecznych znaków. Sprawdzany będzie typ MIME (`text/csv`), aby zezwolić tylko na przesyłanie plików CSV.
- **Transakcyjność**: Użycie transakcji bazodanowej (`supabase.rpc()`) zapewni atomowość operacji. Albo wszystkie dane zostaną zapisane poprawnie, albo żadne, co chroni integralność danych.

## 7. Obsługa błędów

| Błąd | Kod HTTP | Ciało odpowiedzi |

| -------------------------------------------------- | -------- | ------------------------------------------------------ |

| Użytkownik nie jest zalogowany | 401 | `{ "error": "Unauthorized" }` |

| Brak pliku w żądaniu | 400 | `{ "error": "No file uploaded." }` |

| Nieprawidłowy typ pliku (inny niż CSV) | 400 | `{ "error": "Invalid file type. Only CSV is allowed." }` |

| Plik przekracza limit 1000 rekordów | 400 | `{ "error": "File exceeds the 1000 record limit." }` |

| Brak wymaganych kolumn w CSV | 400 | `{ "error": "Missing required columns: [column_name]." }` |

| Błąd formatu danych w wierszu (np. data) | 400 | `{ "error": "Invalid data format in row X: [details]." }` |

| Nieznany typ odpadu lub lokalizacja w wierszu | 400 | `{ "error": "Invalid value in row X: [details]." }` |

| Wewnętrzny błąd serwera (np. błąd bazy danych) | 500 | `{ "error": "Internal Server Error" }` |

## 8. Rozważania dotyczące wydajności

- **Parsowanie CSV**: Do parsowania dużych plików zostanie użyta wydajna biblioteka, np. `papaparse`, która obsługuje strumieniowanie, aby zminimalizować zużycie pamięci.
- **Operacje bazodanowe**: Zamiast wstawiać każdy rekord `waste_data` osobno, zostanie użyta operacja masowego wstawiania (`supabase.from('waste_data').insert([...])`), co znacznie zredukuje liczbę zapytań do bazy danych. Pobieranie słowników (`waste_types`, `locations`) odbędzie się raz przed walidacją wierszy.

## 9. Etapy wdrożenia

1.  **Utworzenie pliku endpointu**: Stworzyć nowy plik `src/pages/api/batches/import.ts`.
2.  **Implementacja obsługi żądania**: W pliku endpointu dodać handler `POST`, który:
    - Odbiera `formData` i wyodrębnia plik.
    - Wykonuje podstawową walidację pliku (obecność, typ).
    - Wywołuje metodę serwisową, opakowując ją w blok `try...catch`.
    - Mapuje wynik (sukces lub błąd) na odpowiedź HTTP.

3.  **Rozszerzenie `BatchService`**: W pliku `src/lib/services/batch.service.ts`:
    - Dodać nową, asynchroniczną metodę `importBatch(file: File, userId: string)`.
    - Zaimplementować logikę parsowania i walidacji CSV (nagłówki, wiersze).

4.  **Implementacja logiki bazodanowej**:
    - Stworzyć funkcję `pl/pgsql` w nowej migracji Supabase do obsługi transakcyjnego wstawiania batcha i danych o odpadach.
    - W `BatchService`, w metodzie `importBatch`, wywołać tę funkcję RPC (`supabase.rpc(...)`) z przetworzonymi danymi.

5.  **Mapowanie DTO**: Zaimplementować logikę transformującą wynik z bazy danych na `BatchDto`, wliczając w to obliczenie `recordCount`.
6.  **Obsługa błędów**: Zaimplementować szczegółowe komunikaty o błędach walidacji i generyczne komunikaty dla błędów serwera.
7.  **Testowanie**: Przygotować pliki CSV do testowania scenariuszy pozytywnych i negatywnych (np. błędne dane, brakujące kolumny, przekroczony limit wierszy).
8.  **Dokumentacja**: Zaktualizować dokumentację API, jeśli istnieje, o nowy endpoint.
