# Dokument wymagań produktu (PRD) - WasteTrack Dashboard

## 1. Przegląd produktu

WasteTrack Dashboard to webowa aplikacja analityczna umożliwiająca kierownikowi działu odpadów import pliku CSV z danymi o odpadach i natychmiastowe uzyskanie czytelnych wizualizacji trendów. Głównym celem MVP jest dostarczenie prostego narzędzia, które w < 5 minut pozwoli załadować dane, przeanalizować je na wykresach oraz wygenerować krótkie podsumowanie tekstowe z wykorzystaniem AI.

## 2. Problem użytkownika

Firmy przetwarzające odpady przechowują dane w różnych arkuszach i raportach PDF, co utrudnia:

- identyfikację dominujących rodzajów odpadów w danym okresie,
- szybkie porównanie lokalizacji i trendów czasowych,
- przygotowanie zwięzłych raportów dla interesariuszy.
- brak scentralizowanego, wizualnego narzędzia analitycznego skutkuje opóźnionymi decyzjami i zwiększonym nakładem pracy.

## 3. Wymagania funkcjonalne

1. Import pojedynczego pliku CSV (≤ 1000 rekordów) zawierającego kolumny: `waste_type`, `location`, `date` (format YYYY-MM-DD).
2. Walidacja pliku: brak dowolnego pola lub niepoprawny format daty → odrzucenie importu z komunikatem błędu.
3. Przechowywanie rekordów w bazie danych Supabase.
4. Wyświetlenie listy zaimportowanych partii oraz możliwość usunięcia całej partii jednym kliknięciem (rollback).
5. Dashboard prezentujący wykresy:
   - ilość odpadów per miesiąc,
   - ilość odpadów per typ,
   - ilość odpadów per lokalizacja.
6. Filtrowanie wykresów po zakresie dat, typie odpadu i lokalizacji (wielokrotne kryteria naraz).
7. Eksport pojedynczego, aktualnie wyświetlanego wykresu do pliku PDF zawierającego tytuł i grafikę.
8. Generowanie zwięzłego raportu AI (1-3 zdania) na podstawie przefiltrowanych danych.
9. Systemowe komunikaty sukcesu/błędu wyświetlane jako toast (Sonner).
10. Interfejs w języku angielskim, mechanizm logowania oraz rejestracji.

## 4. Granice produktu

- Brak autoryzacji i zarządzania rolami użytkowników.
- Brak edycji pojedynczych rekordów; poprawki wyłącznie poprzez ponowny upload.
- Brak predykcyjnej analityki i integracji z ERP/GPS.
- Brak responsywnego interfejsu mobilnego.
- Oryginalny plik CSV nie jest przechowywany po imporcie.
- Funkcja eksportu PDF obejmuje wyłącznie wykres i nagłówek – brak pełnego raportu.

## 5. Historyjki użytkowników

| ID     | Tytuł                   | Opis                                                                                                                          | Kryteria akceptacji                                                                                                                                                                                |
| ------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-001 | Import pliku CSV        | Jako kierownik chcę przesłać plik CSV, aby załadować dane do systemu.                                                         | 1. Mogę wybrać plik z dysku. 2. Jeśli plik zawiera ≤1000 rekordów i poprawne kolumny, pojawia się toast "Import successful". 3. Niepoprawny plik wyświetla toast z konkretną przyczyną odrzucenia. |
| US-002 | Walidacja danych        | Jako kierownik chcę, aby system odrzucał pliki z brakującymi polami lub błędnymi datami, abym nie analizował błędnych danych. | 1. Plik z brakującą kolumną jest odrzucony. 2. Plik z datą spoza formatu YYYY-MM-DD jest odrzucony. 3. Treść toasta wskazuje problem.                                                              |
| US-003 | Wyświetlenie dashboardu | Jako kierownik chcę zobaczyć domyślne wykresy po imporcie, aby natychmiast ocenić dane.                                       | 1. Widzę trzy wykresy (miesiąc, typ, lokalizacja) z danymi z całego zakresu.                                                                                                                       |
| US-004 | Filtrowanie danych      | Jako kierownik chcę filtrować wykresy po dacie, typie i lokalizacji, aby analizować wybrany podzbiór danych.                  | 1. Interfejs umożliwia wybór zakresu dat oraz wielokrotnego typu i lokalizacji. 2. Po zastosowaniu filtrów wykresy odświeżają się w < 1 s.                                                         |
| US-005 | Usunięcie partii danych | Jako kierownik chcę usunąć błędną partię, aby wyeliminować nieprawidłowe dane z dashboardu.                                   | 1. Lista importów wyświetla każdą partię z przyciskiem "Delete". 2. Kliknięcie usuwa partię i aktualizuje dashboard. 3. Pojawia się toast "Batch deleted".                                         |
| US-006 | Generowanie AI-raportu  | Jako kierownik chcę otrzymać krótkie podsumowanie AI, aby szybko przekazać wnioski interesariuszom.                           | 1. Przycisk "Generate report" zwraca notatkę (≤ 3 zdania) w < 10 s. 2. Raport odnosi się do aktualnie zastosowanych filtrów.                                                                       |
| US-007 | Eksport wykresu do PDF  | Jako kierownik chcę pobrać wykres jako PDF, aby dołączyć go do prezentacji.                                                   | 1. Przycisk "Export to PDF" zapisuje plik z nazwą zawierającą datę. 2. Plik zawiera dokładną grafikę i tytuł wykresu.                                                                              |
| US-008 | Informacja zwrotna      | Jako kierownik chcę widzieć toasty sukcesu/błędu, aby wiedzieć, czy operacja się powiodła.                                    | 1. Każda akcja (import, filtr, eksport, delete) wyświetla odpowiedni toast. 2. Wiadomości są jednoznaczne i znikają po 5 s.                                                                        |
| US-009 | Obsługa dużych plików   | Jako kierownik chcę dostać ostrzeżenie, jeśli plik przekracza 1000 rekordów, aby podzielić dane.                              | 1. Plik >1000 rekordów wywołuje toast "File exceeds limit" i nie jest importowany.                                                                                                                 |
| US-010 | Logowanie               | Jako kierownik chcę mieć mozliwosc zalogowania się do panelu.                                                                 | 1. Aplikacja nie jest dostępna dla osoby niezalogowanej.                                                                                                                                           |

## 6. Metryki sukcesu

1. Import + renderowanie domyślnych wykresów w < 5 minut od przesłania pliku.
2. Generowanie AI-raportu w < 10 s dla danych ≤1000 rekordów.
3. Poprawność danych na wykresach potwierdzona przez kierownika w ≥ 95% przypadków testowych.
4. ≥ 90% użytkowników testowych deklaruje, że potrafi odnaleźć dominujący typ odpadu po pierwszym użyciu.
5. Co najmniej 1 eksport PDF działa poprawnie w ≥ 90% prób.
