# API Endpoint Implementation Plan: DELETE /batches/:id

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest umożliwienie uwierzytelnionym użytkownikom bezpiecznego usuwania (soft-delete) utworzonych przez siebie partii danych. Usunięcie partii polega na zmianie jej statusu na `deleted`, co zachowuje integralność danych historycznych, jednocześnie ukrywając partię i powiązane z nią rekordy w interfejsie użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/batches/[id]` (plik `src/pages/api/batches/[id].ts` zgodnie z routingiem Astro)
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki): Identyfikator numeryczny partii do usunięcia. Musi być dodatnią liczbą całkowitą.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

Implementacja nie wymaga tworzenia nowych typów DTO. Będziemy operować na typach prostych (`number` dla ID partii) i istniejących typach z `context.locals` (dane użytkownika).

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod**: `204 No Content`
  - **Body**: Brak.
- **Odpowiedzi błędów**:
  - **Kod**: `400 Bad Request` - Jeśli parametr `id` jest nieprawidłowy.
  - **Kod**: `401 Unauthorized` - Jeśli użytkownik nie jest uwierzytelniony.
  - **Kod**: `404 Not Found` - Jeśli partia o podanym `id` nie istnieje lub nie należy do zalogowanego użytkownika.
  - **Kod**: `500 Internal Server Error` - W przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych

1.  Żądanie `DELETE` trafia na serwer Astro do ścieżki `/api/batches/[id]`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje sesję użytkownika Supabase. Jeśli sesja jest nieprawidłowa, zwraca `401 Unauthorized`. W przeciwnym razie, dołącza dane użytkownika do `context.locals`.
3.  Uruchamiany jest handler `DELETE` w pliku `src/pages/api/batches/[id].ts`.
4.  Handler waliduje parametr `id` przy użyciu Zod, upewniając się, że jest to dodatnia liczba całkowita. W przypadku błędu walidacji zwraca `400 Bad Request`.
5.  Handler wywołuje funkcję `deleteBatch(id, userId)` z serwisu `batch.service.ts`.
6.  Funkcja `deleteBatch` wykonuje operację `UPDATE` na tabeli `batches` w bazie danych Supabase, ustawiając `status` na `'deleted'`. Zapytanie zawiera klauzulę `WHERE`, która sprawdza zarówno `id` partii, jak i `user_id`, aby zapewnić, że użytkownik modyfikuje tylko własne zasoby.
7.  Serwis sprawdza liczbę zmodyfikowanych wierszy. Jeśli wynosi ona `0`, oznacza to, że partia nie została znaleziona lub użytkownik nie miał uprawnień. W takim przypadku serwis zwraca informację o niepowodzeniu.
8.  Po pomyślnej aktualizacji, serwis opcjonalnie dodaje wpis do tabeli `audit_logs`, rejestrując akcję usunięcia.
9.  Handler API, na podstawie odpowiedzi z serwisu, zwraca odpowiedni kod HTTP: `204 No Content` w przypadku sukcesu lub `404 Not Found` w przypadku niepowodzenia.
10. Cała logika jest opakowana w blok `try...catch` do obsługi nieoczekiwanych błędów i zwracania `500 Internal Server Error`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego jest ograniczony wyłącznie do uwierzytelnionych użytkowników poprzez middleware Astro, które weryfikuje token JWT Supabase.
- **Autoryzacja**: Kluczowym elementem bezpieczeństwa jest weryfikacja własności zasobu. Operacja `UPDATE` w serwisie `batch.service.ts` musi bezwzględnie zawierać warunek `AND user_id = :userId` w klauzuli `WHERE`, aby uniemożliwić jednemu użytkownikowi usunięcie partii innego użytkownika.
- **Walidacja danych wejściowych**: Parametr `id` jest walidowany za pomocą Zod, aby zapobiec atakom (np. SQL Injection) i błędom wynikającym z nieprawidłowego formatu danych.

## 7. Rozważania dotyczące wydajności

- Operacja `UPDATE` na tabeli `batches` jest wykonywana na kluczu głównym (`id`) i kluczu obcym (`user_id`). Aby zapewnić maksymalną wydajność, na kolumnie `user_id` powinien istnieć indeks.
- Operacja jest pojedynczym zapytaniem do bazy danych, więc jej wpływ na wydajność systemu powinien być minimalny.

## 8. Etapy wdrożenia

1.  **Utworzenie pliku routingu**: Stwórz nowy plik `src/pages/api/batches/[id].ts`.
2.  **Implementacja handlera `DELETE`**: W nowo utworzonym pliku zdefiniuj i wyeksportuj asynchroniczną funkcję `DELETE({ params, context })`.
3.  **Dodanie logiki do serwisu**: W pliku `src/lib/services/batch.service.ts` dodaj nową funkcję `deleteBatch(batchId: number, userId: string)`.
4.  **Implementacja soft-delete**: Wewnątrz `deleteBatch`, użyj klienta Supabase do wykonania zapytania: `supabase.from('batches').update({ status: 'deleted' }).match({ id: batchId, user_id: userId })`.
5.  **Sprawdzenie wyniku operacji**: W serwisie, po wykonaniu zapytania, sprawdź `error` oraz `count` (liczbę zmodyfikowanych wierszy) w odpowiedzi od Supabase. Zwróć wartość wskazującą na sukces (`count > 0`) lub porażkę (`count === 0`).
6.  **Integracja handlera z serwisem**: W handlerze API (`[id].ts`), pobierz `id` z `params` i `user` z `context.locals`.
7.  **Walidacja `id`**: Zaimplementuj walidację `id` za pomocą Zod. W przypadku błędu zwróć `Response` z kodem `400`.
8.  **Obsługa braku autoryzacji**: Sprawdź, czy `context.locals.user` istnieje. Jeśli nie, zwróć `Response` z kodem `401`.
9.  **Wywołanie serwisu**: Wywołaj funkcję `batchService.deleteBatch` z walidowanym `id` i `user.id`.
10. **Zwrócenie odpowiedzi**: Na podstawie wyniku z serwisu, zwróć `Response` z kodem `204` (sukces) lub `404` (porażka).
11. **Obsługa błędów**: Opakuj logikę handlera w blok `try...catch`, aby przechwytywać nieoczekiwane wyjątki i zwracać `Response` z kodem `500`.
12. **Audytowanie (opcjonalne)**: Po pomyślnym usunięciu, dodaj wywołanie do serwisu logującego, aby zapisać informację w tabeli `audit_logs`.
