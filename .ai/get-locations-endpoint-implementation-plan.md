# API Endpoint Implementation Plan: GET /locations

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za pobieranie pełnej listy dostępnych lokalizacji z bazy danych. Dane te będą wykorzystywane głównie do dynamicznego wypełniania opcji filtrowania w interfejsie użytkownika, umożliwiając użytkownikom segregowanie danych o odpadach na podstawie lokalizacji.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/locations`
- **Parametry**:
  - **Wymagane**: Brak
  - **Opcjonalne**: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy

- **`LocationDto`**: Reprezentuje pojedynczy obiekt lokalizacji.
  ```typescript
  export type LocationDto = Pick<Tables<"locations">, "id" | "name">;
  ```
- **`GetLocationsResponseDto`**: Reprezentuje odpowiedź API, będącą tablicą obiektów `LocationDto`.
  ```typescript
  export type GetLocationsResponseDto = LocationDto[];
  ```
  _Oba typy są już zdefiniowane w `src/types.ts`._

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**:
  - **Opis**: Zwraca tablicę obiektów lokalizacji.
  - **Struktura**:
    ```json
    [
      { "id": 1, "name": "Main Facility" },
      { "id": 2, "name": "Warehouse A" }
    ]
    ```
- **Odpowiedzi błędów**:
  - **`401 Unauthorized`**: Użytkownik nie jest uwierzytelniony.
  - **`500 Internal Server Error`**: Wystąpił nieoczekiwany błąd serwera (np. błąd połączenia z bazą danych).

## 5. Przepływ danych

1.  Klient wysyła żądanie `GET` na adres `/api/locations`.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie i weryfikuje, czy użytkownik ma aktywną sesję w Supabase. Jeśli nie, zwraca `401 Unauthorized`.
3.  Jeśli uwierzytelnianie powiedzie się, żądanie trafia do handlera w `src/pages/api/locations.ts`.
4.  Handler wywołuje funkcję `getLocations` z serwisu `src/lib/services/dictionary.service.ts`.
5.  Funkcja `getLocations` używa klienta Supabase (z `src/db/supabase.client.ts`) do wykonania zapytania `SELECT id, name FROM locations`.
6.  Serwis mapuje wyniki z bazy danych na tablicę obiektów `LocationDto`.
7.  Handler API otrzymuje dane z serwisu i zwraca je jako odpowiedź JSON ze statusem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego musi być ograniczony do uwierzytelnionych użytkowników. Należy to zrealizować za pomocą middleware Astro, które weryfikuje sesję Supabase.
- **Autoryzacja (RLS)**: Polityki Row-Level Security w Supabase na tabeli `locations` muszą być skonfigurowane tak, aby zezwalać na operacje odczytu (`SELECT`) dla roli `authenticated`.
- **Walidacja danych**: Nie dotyczy, ponieważ punkt końcowy nie przyjmuje żadnych danych wejściowych.

## 7. Rozważania dotyczące wydajności

- **Indeksowanie**: Tabela `locations` powinna mieć indeks na kluczu głównym `id`, co jest domyślnym zachowaniem.
- **Paginacja**: Obecnie nie jest wymagana, ponieważ liczba lokalizacji jest niewielka. Jeśli w przyszłości lista znacząco się rozrośnie, należy rozważyć wprowadzenie paginacji.
- **Cache**: Dane dotyczące lokalizacji zmieniają się rzadko. Można rozważyć wdrożenie mechanizmu buforowania (np. na poziomie serwera lub CDN), aby zredukować liczbę zapytań do bazy danych.

## 8. Etapy wdrożenia

1.  **Aktualizacja serwisu**: W pliku `src/lib/services/dictionary.service.ts` dodać nową, asynchroniczną funkcję `getLocations()`.
    - Wewnątrz funkcji należy wykonać zapytanie do Supabase, aby pobrać wszystkie rekordy z tabeli `locations` (`supabase.from('locations').select('id, name').order('id')`).
    - Należy obsłużyć potencjalne błędy zapytania i zwrócić pobrane dane.
2.  **Utworzenie pliku trasy API**: Stworzyć nowy plik `src/pages/api/locations.ts`.
3.  **Implementacja handlera GET**: W pliku `src/pages/api/locations.ts`:
    - Zaimportować niezbędne typy, w tym `APIRoute`.
    - Zaimplementować funkcję `GET({ context })` zgodnie ze standardami Astro.
    - Ustawić `export const prerender = false;`
    - Zaimportować klienta Supabase z `src/db/supabase.client.ts`.
    - Wywołać funkcję `getLocations()` z serwisu `dictionary.service`.
    - Obsłużyć ewentualne błędy z serwisu i zwrócić odpowiedź `500 Internal Server Error`.
    - W przypadku sukcesu, zwrócić pobrane dane jako odpowiedź JSON z kodem statusu `200 OK`.
