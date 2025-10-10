# Architektura UI dla WasteTrack Dashboard

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla WasteTrack Dashboard została zaprojektowana w oparciu o podejście wielostronicowe (MPA-like), wykorzystując Astro do routingu i renderowania stron po stronie serwera. Dynamiczne i interaktywne komponenty będą budowane w React. Taka hybrydowa struktura zapewnia szybkość ładowania i SEO, jednocześnie oferując bogate doświadczenie użytkownika w obszarach wymagających dużej interaktywności, jak dashboard analityczny.

Aplikacja będzie składać się z trzech głównych widoków: strony logowania, dashboardu analitycznego oraz strony zarządzania importami. Stan aplikacji, szczególnie filtry na dashboardzie, będzie zarządzany poprzez parametry URL, co zapewnia trwałość stanu i możliwość udostępniania linków z predefiniowanymi filtrami. Komunikacja z API będzie realizowana przez dedykowanego klienta HTTP z interceptorem dołączającym token JWT, a dane serwerowe będą zarządzane przez bibliotekę TanStack Query (React Query) w celu optymalizacji i buforowania.

## 2. Lista widoków

### Widok: Logowanie (Login)

- **Ścieżka widoku:** `/login`
- **Główny cel:** Uwierzytelnienie użytkownika w systemie. Dostęp do aplikacji jest zablokowany dla niezalogowanych użytkowników.
- **Kluczowe informacje do wyświetlenia:** Formularz logowania i rejestracji.
- **Kluczowe komponenty widoku:**
  - `LoginForm`: Komponent formularza logowania (email, hasło).
  - `RegisterForm`: Komponent formularza rejestracji.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Jasne komunikaty o błędach walidacji (np. "Nieprawidłowe hasło"). Prosty i intuicyjny proces logowania.
  - **Dostępność:** Poprawne etykiety dla pól formularza, obsługa nawigacji klawiaturą, odpowiedni kontrast.
  - **Bezpieczeństwo:** Komunikacja z API Supabase przez HTTPS. Token JWT jest bezpiecznie przechowywany przez klienta Supabase.

### Widok: Dashboard Analityczny (Dashboard)

- **Ścieżka widoku:** `/dashboard`
- **Główny cel:** Wizualizacja i analiza danych o odpadach za pomocą interaktywnych wykresów i filtrów.
- **Kluczowe informacje do wyświetlenia:**
  - Wykres ilości odpadów w podziale na miesiące.
  - Wykres ilości odpadów w podziale na typy.
  - Wykres ilości odpadów w podziale na lokalizacje.
  - Wygenerowany raport AI.
  - "Stan pusty" (empty state) z wezwaniem do działania (CTA), gdy brak danych.
- **Kluczowe komponenty widoku:**
  - `FiltersPanel`: Panel zawierający filtry (zakres dat, typ odpadu, lokalizacja).
  - `ChartComponent`: Generyczny komponent wykresu (używany trzykrotnie dla różnych agregacji).
  - `AIReportGenerator`: Przycisk do generowania raportu AI i modal do jego wyświetlania.
  - `EmptyState`: Komponent wyświetlany w przypadku braku danych.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Szybkie odświeżanie wykresów po zmianie filtrów (< 1s). Wskaźniki ładowania (skeleton loaders) dla wykresów podczas pobierania danych. Możliwość eksportu każdego wykresu do PDF.
  - **Dostępność:** Etykiety dla wszystkich kontrolek filtrów. Wykresy powinny mieć tekstowe alternatywy lub opisy.
  - **Bezpieczeństwo:** Wszystkie zapytania do API są uwierzytelnione za pomocą JWT.

### Widok: Zarządzanie Importami (Imports)

- **Ścieżka widoku:** `/imports`
- **Główny cel:** Zarządzanie partiami danych, w tym importowanie nowych plików CSV i usuwanie istniejących partii.
- **Kluczowe informacje do wyświetlenia:**
  - Formularz do przesyłania plików CSV.
  - Lista zaimportowanych partii (nazwa pliku, data importu, liczba rekordów, status).
- **Kluczowe komponenty widoku:**
  - `CSVUploader`: Komponent do wyboru i przesyłania pliku CSV z walidacją po stronie klienta i serwera.
  - `BatchesList`: Tabela lub lista wyświetlająca historyczne importy z akcją usunięcia.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Natychmiastowa informacja zwrotna (toast) o sukcesie lub błędzie importu. Jasne komunikaty o przyczynie odrzucenia pliku. Wskaźnik postępu podczas przesyłania pliku.
  - **Dostępność:** Dostępność formularza przesyłania plików, poprawne etykiety i obsługa klawiatury.
  - **Bezpieczeństwo:** Walidacja typu pliku (tylko CSV) i rozmiaru po stronie klienta i serwera.

## 3. Mapa podróży użytkownika

Główny przypadek użycia obejmuje import i analizę danych.

1.  **Logowanie:** Użytkownik otwiera aplikację i jest przekierowywany na stronę `/login`. Wprowadza swoje dane uwierzytelniające i po pomyślnym zalogowaniu zostaje przekierowany na `/dashboard`.
2.  **Stan Pusty:** Jeśli w systemie nie ma żadnych danych, na `/dashboard` wyświetlany jest "stan pusty" z przyciskiem "Importuj dane", który prowadzi do `/imports`.
3.  **Import Danych:** Użytkownik na stronie `/imports` wybiera plik CSV. System waliduje plik.
    - **Sukces:** Plik jest przetwarzany, a użytkownik otrzymuje powiadomienie (toast) o sukcesie. Lista importów jest aktualizowana.
    - **Błąd:** Użytkownik otrzymuje powiadomienie z konkretną przyczyną błędu (np. "Plik przekracza limit 1000 rekordów").
4.  **Analiza Danych:** Użytkownik wraca na `/dashboard`, który teraz automatycznie wyświetla wykresy z nowymi danymi. Użytkownik korzysta z panelu filtrów, aby zawęzić dane. Z każdą zmianą filtra, URL jest aktualizowany (`/dashboard?startDate=...`), a wykresy odświeżają się, pokazując przefiltrowane dane.
5.  **Generowanie Raportu:** Użytkownik klika przycisk "Generuj raport AI". Po chwili raport pojawia się w oknie modalnym, odnosząc się do aktualnie zastosowanych filtrów.
6.  **Zarządzanie Partiami:** Użytkownik zauważa błąd w zaimportowanych danych. Przechodzi do `/imports`, odnajduje błędną partię na liście i klika przycisk "Usuń". Po potwierdzeniu, partia jest usuwana, a dane na `/dashboard` są automatycznie aktualizowane.

## 4. Układ i struktura nawigacji

Aplikacja będzie posiadała prosty, stały układ nawigacyjny (sidebar), który będzie widoczny na wszystkich stronach po zalogowaniu.

- **Header:**
  - Logo aplikacji i nazwa.

- **Sidebar:**
  - Główne linki nawigacyjne:
    - **Dashboard** (`/dashboard`)
    - **Zarządzaj importami** (`/imports`)
  - Menu użytkownika (awatar, opcja wylogowania).

Taki układ zapewnia łatwy dostęp do kluczowych funkcji aplikacji z dowolnego miejsca i spójne doświadczenie użytkownika.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które będą wykorzystywane w różnych częściach aplikacji.

- **`Button`**: Standardowy przycisk (z `shadcn/ui`) z różnymi wariantami (primary, secondary, destructive) i obsługą stanu ładowania.
- **`ToastNotifier`**: Globalny komponent (oparty na bibliotece Sonner) do wyświetlania powiadomień o sukcesie, błędzie lub ostrzeżeniu.
- **`Modal`**: Generyczny komponent okna modalnego do wyświetlania dodatkowych informacji lub akcji (np. raport AI, potwierdzenie usunięcia).
- **`DatePicker`**: Komponent do wyboru zakresu dat (date-range-picker) używany w panelu filtrów.
- **`MultiSelectDropdown`**: Komponent rozwijanej listy z możliwością wielokrotnego wyboru, używany do filtrowania po typie odpadu i lokalizacji.
- **`SkeletonLoader`**: Komponent do wyświetlania animowanego "szkieletu" interfejsu podczas ładowania danych (np. dla wykresów).
- **`PageHeader`**: Komponent nagłówka strony, zawierający tytuł i opcjonalne akcje (np. przycisk importu).
