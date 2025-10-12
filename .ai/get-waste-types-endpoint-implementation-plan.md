# API Endpoint Implementation Plan: Get Waste Types

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest dostarczenie listy wszystkich dostępnych typów odpadów z bazy danych. Dane te będą wykorzystywane w interfejsie użytkownika do wypełniania opcji filtrowania, umożliwiając użytkownikom segregację i analizę danych na podstawie określonych typów odpadów. Punkt końcowy jest chroniony i wymaga uwierzytelnienia.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/waste-types`
- **Parametry**:
  - **Wymagane**: Brak
  - **Opcjonalne**: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy

Implementacja będzie korzystać z istniejących typów zdefiniowanych w `src/types.ts`:

- `WasteTypeDto`: Reprezentuje pojedynczy obiekt typu odpadu.
  ```typescript
  export type WasteTypeDto = Pick<Tables<"waste_types">, "id" | "name">;
  ```
- `GetWasteTypesResponseDto`: Reprezentuje tablicę obiektów `WasteTypeDto`, która jest ciałem odpowiedzi.
  ```typescript
  export type GetWasteTypesResponseDto = WasteTypeDto[];
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**:
  - **Opis**: Zwracana, gdy lista typów odpadów zostanie pomyślnie pobrana.
  - **Ciało odpowiedzi**:
    ```json
    [
      { "id": 1, "name": "PLASTIC" },
      { "id": 2, "name": "BIO" },
      { "id": 3, "name": "GLASS" },
      { "id": 4, "name": "PAPER" },
      { "id": 5, "name": "MIXED" }
    ]
    ```
- **Odpowiedzi błędów**:
  - `401 Unauthorized`: Zwracany, gdy żądanie jest wykonywane przez nieuwierzytelnionego użytkownika.
  - `500 Internal Server Error`: Zwracany w przypadku problemów z serwerem lub bazą danych.

## 5. Przepływ danych

1. Klient wysyła żądanie `GET` na adres `/api/waste-types`.
2. Astro server-side routing kieruje żądanie do handlera w pliku `src/pages/api/waste-types.ts`.
3. Handler API w pierwszej kolejności sprawdza, czy użytkownik jest uwierzytelniony, korzystając z `context.locals.supabase`.
4. Jeśli uwierzytelnianie się powiedzie, handler wywołuje funkcję `getWasteTypes` z nowego serwisu `src/lib/services/dictionary.service.ts`.
5. Funkcja `getWasteTypes` wykonuje zapytanie do bazy danych Supabase: `SELECT id, name FROM waste_types`.
6. Baza danych zwraca listę rekordów, które są mapowane na tablicę obiektów `WasteTypeDto`.
7. Handler API serializuje tablicę DTO do formatu JSON i wysyła ją jako odpowiedź z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego będzie ograniczony wyłącznie do uwierzytelnionych użytkowników. Każde żądanie będzie musiało zawierać ważny token JWT, który zostanie zweryfikowany po stronie serwera za pomocą integracji Astro z Supabase.
- **Autoryzacja (RLS)**: Polityki Row-Level Security w Supabase na tabeli `waste_types` muszą być skonfigurowane tak, aby zezwalać na operacje odczytu (`SELECT`) dla roli `authenticated`.

## 7. Rozważania dotyczące wydajności

- **Wielkość danych**: Tabela `waste_types` jest małą tabelą słownikową, więc zapytanie będzie bardzo szybkie.
- **Indeksowanie**: Kolumna `id` jest kluczem głównym, co oznacza, że jest automatycznie indeksowana. Nie są wymagane dodatkowe indeksy.
- **Caching**: Na obecnym etapie nie jest wymagane buforowanie po stronie serwera. W przyszłości można rozważyć dodanie nagłówków `Cache-Control` w odpowiedzi, aby umożliwić buforowanie po stronie klienta lub CDN.

## 8. Etapy wdrożenia

1. **Utworzenie serwisu**: Stwórz nowy plik `src/lib/services/dictionary.service.ts`.
2. **Implementacja logiki w serwisie**: W pliku `dictionary.service.ts` zaimplementuj asynchroniczną funkcję `getWasteTypes()`, która:
   - Pobierze wszystkie rekordy z tabeli `waste_types`.
   - Obsłuży potencjalne błędy zapytania do bazy danych.
   - Zwróci listę typów odpadów lub rzuci błąd.
3. **Utworzenie pliku endpointa**: Stwórz nowy plik `src/pages/api/waste-types.ts`.
4. **Implementacja handlera API**: W pliku `waste-types.ts` zaimplementuj handler `GET`, który:
   - Wyeksportuje stałą `export const prerender = false;`.
   - Wykorzysta `supabaseClient` oraz `DEFAULT_USER_ID` ze ściezki `src/db/supabase.client.ts`.
   - Wywoła funkcję `getWasteTypes` z serwisu `dictionary.service`.
   - W przypadku błędu z serwisu, zwróci odpowiedź `500 Internal Server Error`.
   - W przypadku sukcesu, zwróci dane jako JSON z kodem statusu `200 OK`.
5. **Konfiguracja RLS**: Upewnij się, że w Supabase istnieje polityka RLS dla tabeli `waste_types`, która zezwala na odczyt (`SELECT`) dla uwierzytelnionych użytkowników.
