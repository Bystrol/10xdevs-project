# API Endpoint Implementation Plan: Get Waste Data Summary

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest dostarczenie zagregowanych danych dotyczących odpadów, które będą wykorzystywane do renderowania wykresów na pulpicie analitycznym. Umożliwia dynamiczne grupowanie i filtrowanie danych w celu wsparcia interaktywnych wizualizacji.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/waste-data`
- **Parametry zapytania**:
  - **Wymagane**:
    - `groupBy` (string): Określa wymiar grupowania danych. Dozwolone wartości: `month`, `type`, `location`.
  - **Opcjonalne**:
    - `startDate` (string): Data początkowa filtrowania w formacie `YYYY-MM-DD`.
    - `endDate` (string): Data końcowa filtrowania w formacie `YYYY-MM-DD`.
    - `wasteTypeIds` (string): Lista identyfikatorów typów odpadów oddzielonych przecinkami (np. `1,3,5`).
    - `locationIds` (string): Lista identyfikatorów lokalizacji oddzielonych przecinkami (np. `2,4`).

## 3. Wykorzystywane typy

Do implementacji tego punktu końcowego wykorzystane zostaną następujące, już zdefiniowane, typy z `src/types.ts`:

- `GetWasteDataSummaryQueryDto`: Definiuje strukturę parametrów zapytania.
- `WasteDataSummaryResponseDto`: Definiuje strukturę odpowiedzi API.
- `WasteDataSummaryItemDto`: Definiuje strukturę pojedynczego elementu w zagregowanej liście danych.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**:
  - Zwraca obiekt `WasteDataSummaryResponseDto` z zagregowanymi danymi.
  - Przykład dla `groupBy=type`:
    ```json
    {
      "data": [
        { "label": "PLASTIC", "value": 1500 },
        { "label": "BIO", "value": 800 }
      ]
    }
    ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe lub brakujące parametry zapytania.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych

1.  Żądanie `GET` trafia do endpointu `/api/waste-data.ts`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje sesję użytkownika Supabase. W przypadku braku autoryzacji zwraca `401`.
3.  W endpointcie, schemat Zod waliduje i parsuje parametry zapytania. W przypadku błędu walidacji zwraca `400`.
4.  Endpoint wywołuje metodę z nowego serwisu, np. `WasteDataService.getSummary(validatedParams, userId)`, przekazując zweryfikowane parametry, ID użytkownika oraz klienta Supabase z `context.locals.supabase`.
5.  `WasteDataService` buduje i wykonuje zapytanie do Supabase. Zalecane jest użycie funkcji RPC w PostgreSQL (`get_waste_summary`) w celu optymalizacji i hermetyzacji logiki.
6.  Funkcja w bazie danych agreguje dane z tabeli `waste_data`, łącząc ją z `batches` (w celu filtrowania po `user_id`), `waste_types` oraz `locations` (w celu uzyskania etykiet).
7.  Serwis otrzymuje zagregowane dane, mapuje je na strukturę `WasteDataSummaryItemDto[]` i zwraca do endpointu.
8.  Endpoint wysyła odpowiedź `200 OK` z danymi w formacie `WasteDataSummaryResponseDto`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do endpointu jest bezwzględnie wymagany i realizowany przez middleware Astro, który sprawdza ważność tokenu JWT Supabase.
- **Autoryzacja**: Każdy użytkownik ma dostęp wyłącznie do swoich danych. Zostanie to zapewnione przez polityki RLS (Row-Level Security) w Supabase na tabelach `batches` i `waste_data`, które automatycznie filtrują zapytania na podstawie `user_id` z aktywnej sesji.
- **Walidacja danych wejściowych**: Wszystkie parametry zapytania są rygorystycznie walidowane za pomocą Zod, aby zapobiec nieoczekiwanemu zachowaniu i potencjalnym atakom.

## 7. Obsługa błędów

- **Błędy walidacji (400)**: Obsługiwane przez Zod; odpowiedź będzie zawierać szczegóły dotyczące nieprawidłowych pól.
- **Brak autoryzacji (401)**: Obsługiwane centralnie przez middleware.
- **Błędy serwera (500)**: Wszystkie operacje w endpointcie i serwisie będą opakowane w bloki `try...catch`. W przypadku wystąpienia błędu (np. problem z bazą danych), zostanie on zarejestrowany, a klient otrzyma standardową odpowiedź błędu.

## 8. Rozważania dotyczące wydajności

- **Indeksowanie bazy danych**: Należy założyć indeksy na kluczach obcych (`waste_type_id`, `location_id`) oraz na kolumnie `date` w tabeli `waste_data`, a także na `user_id` w tabeli `batches`, aby przyspieszyć operacje filtrowania i łączenia.
- **Funkcje bazodanowe (RPC)**: Zaimplementowanie logiki agregacji jako funkcji PostgreSQL i wywoływanie jej przez `supabase.rpc()` będzie znacznie wydajniejsze niż konstruowanie złożonego zapytania w kodzie aplikacji, ponieważ obliczenia odbywają się bezpośrednio w bazie danych.

## 9. Etapy wdrożenia

1.  **Baza danych**: Utworzyć nową migrację Supabase w celu:
    - Dodania niezbędnych indeksów do tabeli `waste_data` i `batches`.
    - Stworzenia funkcji PostgreSQL `get_waste_summary(user_id_param, ...filters)` do hermetyzacji logiki agregacji.
2.  **Serwis**: Stworzyć plik `src/lib/services/waste-data.service.ts` i zaimplementować w nim metodę `getSummary`, która będzie wywoływać funkcję `get_waste_summary` poprzez `supabase.rpc()`.
3.  **Endpoint API**: Stworzyć plik `src/pages/api/waste-data.ts`.
4.  **Walidacja**: W pliku endpointu zdefiniować schemat Zod do walidacji parametrów zapytania.
5.  **Integracja**: W endpointcie połączyć walidację z wywołaniem serwisu, przekazując klienta Supabase z `context.locals`. Obsłużyć przypadki sukcesu i błędu, zwracając odpowiednie kody statusu i dane.
6.  **Middleware**: Upewnić się, że middleware (`src/middleware/index.ts`) poprawnie zabezpiecza ścieżkę `/api/waste-data`.
