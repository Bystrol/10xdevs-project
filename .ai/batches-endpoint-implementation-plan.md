# API Endpoint Implementation Plan: GET /batches

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za pobieranie paginowanej listy wszystkich partii (batches) zaimportowanych przez aktualnie uwierzytelnionego użytkownika. Zapewnia kluczową funkcjonalność do przeglądania historii importów.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/batches`
- **Parametry zapytania (Query Parameters)**:
  - **Wymagane**: Brak
  - **Opcjonalne**:
    - `page` (number): Numer strony do wyświetlenia. Domyślnie: `1`.
    - `limit` (number): Liczba wyników na stronie. Domyślnie: `10`.

## 3. Wykorzystywane typy

Do implementacji tego punktu końcowego zostaną wykorzystane następujące typy DTO zdefiniowane w `src/types.ts`:

- `BatchDto`: Struktura danych dla pojedynczej partii na liście.
- `PaginationDto`: Struktura danych dla informacji o paginacji.
- `ListBatchesResponseDto`: Główny obiekt odpowiedzi, zawierający `data: BatchDto[]` i `pagination: PaginationDto`.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**: Zwraca obiekt JSON zgodny z `ListBatchesResponseDto`.
  ```json
  {
    "data": [
      {
        "id": 1,
        "filename": "q3_report.csv",
        "status": "active",
        "recordCount": 750,
        "createdAt": "2025-10-08T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1
    }
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe parametry zapytania (np. `page` nie jest liczbą dodatnią).
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: Wewnętrzne błędy serwera (np. problem z połączeniem z bazą danych).

## 5. Przepływ danych

1.  Żądanie `GET` przychodzi do serwera Astro na adres `/api/batches`.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token sesji Supabase i, jeśli jest prawidłowy, umieszcza dane użytkownika w `Astro.locals.user`.
3.  Handler `GET` w `src/pages/api/batches.ts` jest wywoływany.
4.  Handler sprawdza, czy `Astro.locals.user` istnieje. Jeśli nie, zwraca `401 Unauthorized`.
5.  Parametry zapytania (`page`, `limit`) są walidowane przy użyciu biblioteki `zod`. W przypadku błędu walidacji, zwracany jest `400 Bad Request`.
6.  Handler wywołuje metodę `listBatches` z nowo utworzonego `BatchService` (`src/lib/services/batch.service.ts`), przekazując `userId` oraz zwalidowane parametry paginacji.
7.  `BatchService` komunikuje się z bazą danych Supabase, wykonując dwa zapytania:
    a. Jedno zapytanie o łączną liczbę partii dla danego `user_id`, aby obliczyć `total` w paginacji.
    b. Drugie zapytanie, które pobiera paginowaną listę partii, łącząc tabelę `batches` z widokiem `active_batches_summary`, aby uzyskać `recordCount`.
8.  `BatchService` mapuje wyniki z bazy danych na obiekty DTO i zwraca `ListBatchesResponseDto` do handlera.
9.  Handler serializuje odpowiedź do formatu JSON i wysyła ją do klienta z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp jest ograniczony wyłącznie do uwierzytelnionych użytkowników. Middleware będzie rygorystycznie sprawdzać ważność sesji Supabase.
- **Autoryzacja**: Każde zapytanie do bazy danych w `BatchService` musi zawierać warunek `WHERE user_id = :userId`, aby zapewnić, że użytkownicy widzą tylko swoje własne dane. Dodatkowo, na tabeli `batches` zostaną zaimplementowane polityki RLS (Row-Level Security) w Supabase.
- **Walidacja danych wejściowych**: Parametry `page` i `limit` będą ściśle walidowane, aby zapobiec błędom i potencjalnym atakom (np. żądanie `limit` o bardzo dużej wartości).

## 7. Rozważania dotyczące wydajności

- **Indeksowanie**: Kolumna `user_id` w tabeli `batches` musi być zindeksowana, aby zapewnić szybkie wyszukiwanie partii dla danego użytkownika.
- **Paginacja**: Implementacja paginacji po stronie serwera jest kluczowa, aby unikać przesyłania dużych ilości danych i nadmiernego obciążania zarówno serwera, jak i klienta.
- **Widok zmaterializowany (opcjonalnie)**: Jeśli obliczanie `recordCount` na widoku `active_batches_summary` stanie się wolne, można rozważyć jego materializację.

## 8. Etapy wdrożenia

1.  **Migracja Bazy Danych**:
    - Utwórz nową migrację Supabase.
    - W migracji zdefiniuj widok `active_batches_summary`, który zlicza liczbę rekordów w `waste_data` dla każdej aktywnej partii.

    ```sql
    CREATE OR REPLACE VIEW public.active_batches_summary AS
    SELECT
      b.id AS batch_id,
      count(wd.id) AS record_count
    FROM
      batches b
      LEFT JOIN waste_data wd ON b.id = wd.batch_id
    WHERE
      b.status = 'active'
    GROUP BY
      b.id;
    ```

    - Upewnij się, że na tabeli `batches` istnieje indeks na kolumnie `user_id`.

2.  **Utworzenie Serwisu**:
    - Stwórz plik `src/lib/services/batch.service.ts`.
    - Zaimplementuj klasę `BatchService` z metodą `async listBatches(userId: string, page: number, limit: number): Promise<ListBatchesResponseDto>`.
    - Metoda ta powinna pobierać dane z Supabase, obsługiwać logikę paginacji i zwracać dane w formacie DTO.
3.  **Implementacja API Route**:
    - Stwórz plik `src/pages/api/batches.ts`.
    - Zaimplementuj `GET` handler zgodnie ze specyfikacją Astro API routes.
4.  **Uwierzytelnianie i Walidacja**:
    - W handlerze `GET`, dodaj logikę sprawdzającą obecność użytkownika w `Astro.locals.user`.
    - Zaimplementuj walidację `page` i `limit` przy użyciu `zod`, włączając parsowanie na liczby i ustawianie wartości domyślnych.
5.  **Integracja i Obsługa Błędów**:
    - W handlerze `GET`, wywołaj `batchService.listBatches`.
    - Zaimplementuj blok `try...catch` do przechwytywania ewentualnych błędów z serwisu i zwracania odpowiedzi `500 Internal Server Error`.
    - Zwróć poprawną odpowiedź (`200 OK`) lub odpowiedź błędu (`400`, `401`) w odpowiednim formacie.
