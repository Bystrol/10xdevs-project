# Plan Testów Aplikacji WasteTrack Dashboard

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje strategię, zakres, zasoby i harmonogram działań związanych z testowaniem aplikacji WasteTrack Dashboard. Projekt ten jest analitycznym pulpitem nawigacyjnym do zarządzania danymi o odpadach, umożliwiającym import danych z plików CSV i wizualizację trendów. Plan ten ma na celu zapewnienie, że finalny produkt spełnia najwyższe standardy jakości, niezawodności i bezpieczeństwa.

### 1.2. Cele testowania

Główne cele procesu testowego to:

- **Zapewnienie jakości:** Weryfikacja, czy wszystkie funkcjonalności działają zgodnie ze specyfikacją.
- **Weryfikacja integralności danych:** Upewnienie się, że proces importu, przetwarzania i przechowywania danych jest niezawodny i odporny na błędy.
- **Potwierdzenie bezpieczeństwa:** Sprawdzenie, czy dane użytkowników są odpowiednio chronione, a mechanizmy autoryzacji działają poprawnie.
- **Ocena wydajności:** Identyfikacja potencjalnych wąskich gardeł i zapewnienie, że aplikacja działa responsywnie pod oczekiwanym obciążeniem.
- **Zapewnienie użyteczności (UX):** Sprawdzenie, czy interfejs użytkownika jest intuicyjny i przyjazny dla użytkownika końcowego.

## 2. Zakres testów

### 2.1. Funkcjonalności objęte testami

- **Moduł uwierzytelniania:** Rejestracja, logowanie, resetowanie hasła, wylogowywanie, zarządzanie sesją.
- **Moduł importu danych CSV:** Przesyłanie plików, walidacja formatu i zawartości, przetwarzanie danych, obsługa błędów.
- **Zarządzanie partiami importu (Batches):** Lista importów, podgląd szczegółów, statusy przetwarzania.
- **Moduł raportowania i analizy:** Generowanie raportów, agregacja danych, integracja z zewnętrznym API (AI).
- **Interfejs użytkownika:** Nawigacja, wyświetlanie danych, interaktywne komponenty.

### 2.2. Funkcjonalności wyłączone z testów

- Testy wydajnościowe zewnętrznego serwisu AI (OpenAI). Testowana będzie jedynie integracja i obsługa błędów po stronie aplikacji WasteTrack.
- Testy kompatybilności z niezalecanymi lub przestarzałymi przeglądarkami internetowymi.

## 3. Typy testów do przeprowadzenia

Proces testowania zostanie podzielony na następujące poziomy i typy:

| Typ testu                  | Opis                                                                                                                                                             | Narzędzia                     | Odpowiedzialność  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------- |
| **Testy jednostkowe**      | Weryfikacja poszczególnych funkcji i komponentów React w izolacji. Skupienie na logice biznesowej w serwisach i hookach.                                         | Vitest, React Testing Library | Deweloperzy       |
| **Testy End-to-End (E2E)** | Symulacja rzeczywistych scenariuszy użytkownika w przeglądarce. Weryfikacja kompletnych przepływów, np. od logowania, przez import pliku, po weryfikację danych. | Playwright                    | Inżynier QA       |
| **Testy manualne (UAT)**   | Ręczna weryfikacja aplikacji przez zespół projektowy w celu ostatecznego potwierdzenia zgodności z wymaganiami biznesowymi.                                      | Zespół projektowy             | Product Owner, QA |

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Moduł importu danych CSV (Priorytet: Krytyczny)

- **Scenariusz 1 (Happy Path):** Użytkownik przesyła poprawnie sformatowany plik CSV z prawidłowymi danymi.
  - **Oczekiwany rezultat:** Plik zostaje przyjęty, przetworzony, dane zostają zapisane w bazie, a na liście partii pojawia się nowy wpis ze statusem "Zakończono".
- **Scenariusz 2 (Błędny format pliku):** Użytkownik przesyła plik w formacie innym niż CSV (np. .xlsx, .txt).
  - **Oczekiwany rezultat:** System odrzuca plik i wyświetla stosowny komunikat o błędzie.
- **Scenariusz 3 (Błędy w danych):** Użytkownik przesyła plik CSV z błędami (brakujące nagłówki, niepoprawny format daty, ujemna ilość odpadów).
  - **Oczekiwany rezultat:** Przetwarzanie partii kończy się statusem "Nieudane". System zwraca szczegółowe informacje o błędach i numerach wierszy, które je zawierają. Operacja zapisu do bazy danych jest w całości wycofywana (rollback).
- **Scenariusz 4 (Przekroczenie limitu):** Użytkownik przesyła plik zawierający więcej rekordów niż zdefiniowany limit (np. 10 000).
  - **Oczekiwany rezultat:** System odrzuca plik przed przetworzeniem, informując o przekroczeniu limitu.
- **Scenariusz 5 (Pusty plik):** Użytkownik przesyła pusty plik CSV.
  - **Oczekiwany rezultat:** System informuje użytkownika, że plik jest pusty i nie inicjuje procesu importu.

### 4.2. Moduł uwierzytelniania i autoryzacji (Priorytet: Wysoki)

- **Scenariusz 1 (Dostęp do danych):** Użytkownik A loguje się i importuje dane. Użytkownik B loguje się na swoje konto.
  - **Oczekiwany rezultat:** Użytkownik B nie widzi partii importu ani danych należących do użytkownika A.
- **Scenariusz 2 (Dostęp do API):** Użytkownik B próbuje uzyskać dostęp do szczegółów partii importu użytkownika A poprzez bezpośrednie wywołanie API (np. `/api/batches/{id_partii_A}`).
  - **Oczekiwany rezultat:** API zwraca błąd autoryzacji (np. 403 Forbidden lub 404 Not Found).
- **Scenariusz 3 (Reset hasła):** Użytkownik zapomina hasła i poprawnie przechodzi przez proces jego resetowania.
  - **Oczekiwany rezultat:** Użytkownik może zalogować się przy użyciu nowego hasła. Stary token resetowania hasła jest nieważny.

## 5. Środowisko testowe

- **Baza danych:** Dedykowana, odizolowana instancja Supabase dla celów testowych, regularnie czyszczona i seedowana danymi testowymi.
- **Backend/Frontend:** Aplikacja uruchamiana lokalnie lub na dedykowanym środowisku stagingowym na Cloudflare, skonfigurowana do komunikacji z testową bazą danych.
- **Przeglądarki:** Testy E2E i manualne będą przeprowadzane na najnowszych wersjach przeglądarek: Google Chrome, Mozilla Firefox, Safari.

## 6. Narzędzia do testowania

- **Frameworki testowe:** Vitest (jednostkowe, integracyjne), Playwright (E2E).
- **Zarządzanie testami i błędami:** GitHub Issues.
- **CI/CD:** GitHub Actions (automatyczne uruchamianie testów po każdym commicie).
- **Analiza kodu:** ESLint, Prettier (zapewnienie jakości kodu).

## 7. Harmonogram testów

| Faza       | Opis                                                                | Planowany czas                              |
| ---------- | ------------------------------------------------------------------- | ------------------------------------------- |
| **Faza 1** | Implementacja i uruchamianie testów jednostkowych i integracyjnych  | Równolegle z developmentem                  |
| **Faza 2** | Tworzenie i automatyzacja scenariuszy E2E dla kluczowych przepływów | Po ustabilizowaniu głównych funkcjonalności |
| **Faza 3** | Testy akceptacyjne użytkownika (UAT)                                | Tuż przed wdrożeniem produkcyjnym           |

## 8. Kryteria akceptacji testów

### 8.1. Kryteria wejścia

- Kod źródłowy został wdrożony na środowisku testowym.
- Wszystkie testy jednostkowe i integracyjne przechodzą pomyślnie.
- Dokumentacja techniczna jest dostępna.

### 8.2. Kryteria wyjścia

- 100% testów E2E dla krytycznych ścieżek przechodzi pomyślnie.
- Brak otwartych błędów o priorytecie krytycznym lub wysokim.
- Testy UAT zostały zakończone i zaakceptowane przez Product Ownera.

## 9. Role i odpowiedzialności

| Rola              | Odpowiedzialność                                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deweloperzy**   | Pisanie testów jednostkowych i integracyjnych, naprawa błędów.                                                                                       |
| **Inżynier QA**   | Projektowanie i implementacja testów E2E, wydajnościowych i bezpieczeństwa, zarządzanie procesem zgłaszania błędów, przygotowanie raportów z testów. |
| **Product Owner** | Definiowanie wymagań, udział w testach UAT, ostateczna akceptacja funkcjonalności.                                                                   |
