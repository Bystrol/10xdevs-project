# API Endpoint Implementation Plan: Generate AI Report

## 1. Przegląd punktu końcowego

Ten punkt końcowy generuje zwięzłe podsumowanie tekstowe danych o odpadach na podstawie określonych kryteriów filtrowania, wykorzystując do tego model AI. Umożliwia użytkownikom szybkie uzyskanie wglądu w trendy dotyczące odpadów bez konieczności ręcznej analizy danych.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/waste-data/report`
- **Request Body**:
  - `Content-Type`: `application/json`
  - **Struktura**:
    ```json
    {
      "startDate": "string",
      "endDate": "string",
      "wasteTypeIds": "number[]",
      "locationIds": "number[]"
    }
    ```
- **Parametry**:
  - **Wymagane**:
  - `groupBy` (string): Określa wymiar grupowania danych. Dozwolone wartości: `month`, `type`, `location`.
  - **Opcjonalne**:
    - `startDate` (string): Początkowa data filtrowania w formacie `YYYY-MM-DD`.
    - `endDate` (string): Końcowa data filtrowania w formacie `YYYY-MM-DD`.
    - `wasteTypeIds` (number[]): Tablica identyfikatorów typów odpadów do uwzględnienia.
    - `locationIds` (number[]): Tablica identyfikatorów lokalizacji do uwzględnienia.

## 3. Wykorzystywane typy

- **`GenerateAiReportCommand`**: Model polecenia dla ciała żądania, zdefiniowany w `src/types.ts`.
- **`GenerateAiReportResponseDto`**: Obiekt transferu danych dla pomyślnej odpowiedzi, zdefiniowany w `src/types.ts`.
- **`Zod Schema`**: Nowy schemat Zod do walidacji przychodzącego ciała żądania.

## 4. Szczegóły odpowiedzi

- **Pomyślna odpowiedź (Success)**:
  - **Kod statusu**: `200 OK`
  - **Struktura**:
    ```json
    {
      "report": "string"
    }
    ```
- **Odpowiedzi błędów (Error)**:
  - **Kod statusu**: `400 Bad Request` (Nieprawidłowe dane wejściowe)
  - **Kod statusu**: `401 Unauthorized` (Brak autoryzacji)
  - **Kod statusu**: `500 Internal Server Error` (Wewnętrzny błąd serwera, np. błąd bazy danych)
  - **Kod statusu**: `503 Service Unavailable` (Błąd zewnętrznego serwisu AI)

## 5. Przepływ danych

1.  Klient wysyła żądanie `POST` na adres `/api/waste-data/report` z filtrami w ciele żądania.
2.  Middleware Astro weryfikuje sesję użytkownika.
3.  Handler API w `src/pages/api/waste-data/report.ts` odbiera żądanie.
4.  Dane wejściowe są walidowane przy użyciu schematu Zod. W przypadku błędu walidacji zwracany jest błąd `400`.
5.  Handler wywołuje funkcję `generateAiReport` z serwisu `WasteDataService`.
6.  `WasteDataService` wywołuje metodę `getSummary` w celu pobrania zagregowanych danych na podstawie podanych filtrów.
7.  Serwis konstruuje prompt dla modelu językowego (dynamicznie, w zalezności od podanego parametru `groupBy`), zawierający zagregowane dane i polecenie wygenerowania podsumowania.
8.  Serwis wysyła żądanie do API OpenAI, używając klucza `OPENAI_API_KEY` przechowywanego w zmiennych środowiskowych.
9.  Po otrzymaniu odpowiedzi od AI, serwis zwraca wygenerowany raport do handlera API.
10. Handler API zwraca odpowiedź `200 OK` z raportem w ciele odpowiedzi.

## 6. Względy bezpieczeństwa

- **Autoryzacja**: Wszystkie zapytania do bazy danych muszą być ściśle powiązane z identyfikatorem zalogowanego użytkownika (`user_id`), aby zapobiec dostępowi do danych innych użytkowników.
- **Walidacja danych wejściowych**: Użycie Zod do walidacji typów danych i struktury ciała żądania zapobiega błędom przetwarzania i potencjalnym atakom (np. NoSQL injection, chociaż używamy SQL).
- **Ochrona przed Prompt Injection**: Dane z filtrów nie powinny być bezpośrednio wstawiane do instrukcji dla modelu AI. Zamiast tego, powinny być używane do filtrowania danych w bazie, a zagregowane, bezpieczne wyniki będą częścią promptu.
- **Zarządzanie sekretami**: Klucz API do OpenAI (`OPENAI_API_KEY`) musi być przechowywany jako zmienna środowiskowa i nigdy nie może być ujawniony po stronie klienta.

## 7. Obsługa błędów

- **Błąd walidacji (400)**: Jeśli ciało żądania nie przejdzie walidacji Zod, serwer zwróci odpowiedź z kodem `400` i szczegółami błędu.
- **Brak autoryzacji (401)**: Jeśli użytkownik nie jest zalogowany, serwer zwróci kod `401`.
- **Błąd usługi AI (503)**: Jeśli wywołanie API OpenAI nie powiedzie się (błąd sieciowy, niedostępność usługi), serwer zwróci kod `503`. Błąd powinien być zalogowany po stronie serwera.
- **Błąd bazy danych (500)**: Jeśli zapytanie do Supabase zakończy się niepowodzeniem, serwer zwróci ogólny błąd `500`. Szczegóły błędu powinny być logowane na serwerze, ale nie ujawniane klientowi.
- **Logowanie**: Wszystkie błędy po stronie serwera (5xx) powinny być logowane do konsoli (`console.error`) w celu ułatwienia debugowania.

## 8. Rozważania dotyczące wydajności

- **Czas odpowiedzi AI**: Zewnętrzne wywołanie API do modelu językowego może być czasochłonne. Należy zaimplementować odpowiedni timeout dla tego żądania. W przyszłości można rozważyć przetwarzanie asynchroniczne (np. przez webhook lub kolejkowanie zadań), jeśli generowanie raportu będzie trwało zbyt długo.
- **Limit danych**: Należy rozważyć ograniczenie zakresu dat lub ilości danych przekazywanych do modelu AI, aby uniknąć przekroczenia limitu tokenów i zoptymalizować koszty.

## 9. Etapy wdrożenia

1.  **Definicja schematu walidacji**: W pliku `src/pages/api/waste-data/report.ts`, utwórz schemat Zod, który waliduje ciało żądania zgodnie z typem `GenerateAiReportCommand`.
2.  **Implementacja logiki serwisowej**:
    - W pliku `src/lib/services/waste-data.service.ts`, dodaj nową asynchroniczną funkcję `generateAiReport(command: GenerateAiReportCommand, userId: string)`.
    - Wykorzystaj istniejącą metodę `getSummary` w celu otrzymania zagregowanych danych.
    - Dodaj logikę do formatowania danych i tworzenia promptu dla modelu AI.
    - Zainstaluj bibliotekę `openai`.
    - Wykorzystaj MCP `Context7` do pobrania aktualnej dokumentacji API OpenAI.
    - Zapewnij obsługę błędów dla zapytania do bazy danych i wywołania API AI.
3.  **Implementacja handlera API**:
    - Utwórz nowy plik `src/pages/api/waste-data/report.ts`.
    - Zaimplementuj handler dla metody `POST`.
    - Dodaj `export const prerender = false;`
    - Sprawdź sesję użytkownika. Jeśli brak, zwróć `401`.
    - Zwaliduj ciało żądania przy użyciu schematu Zod. W przypadku błędu zwróć `400`.
    - Wywołaj funkcję `generateAiReport` z serwisu, przekazując zwalidowane dane i `userId`.
    - Obsłuż potencjalne błędy zwrócone przez serwis i mapuj je na odpowiednie kody statusu HTTP (`500`, `503`).
    - W przypadku sukcesu, zwróć odpowiedź `200 OK` z raportem w formacie `GenerateAiReportResponseDto`.
