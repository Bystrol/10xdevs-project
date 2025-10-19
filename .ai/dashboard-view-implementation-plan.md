# Plan implementacji widoku Dashboard

## 1. Przegląd

Widok Dashboardu Analitycznego jest głównym interfejsem do wizualizacji i analizy danych o odpadach. Umożliwia użytkownikom przeglądanie danych zagregowanych w postaci trzech kluczowych wykresów, dynamiczne filtrowanie wyników w czasie rzeczywistym oraz generowanie podsumowań tekstowych przy użyciu AI. Celem jest dostarczenie intuicyjnego narzędzia, które przyspiesza analizę trendów i ułatwia raportowanie.

## 2. Routing widoku

Widok będzie dostępny pod główną ścieżką aplikacji:

- **Ścieżka:** `/`

## 3. Struktura komponentów

Komponenty zostaną zorganizowane w logiczną hierarchię, aby zapewnić reużywalność i separację odpowiedzialności. Główny komponent `DashboardView` będzie zarządzał stanem i koordynował przepływ danych.

```
/src/pages/index.astro
└── DashboardView.tsx (React Island)
    ├── hooks/useDashboard.ts (Logika i zarządzanie stanem)
    ├── FiltersPanel.tsx
    │   ├── DateRangePicker (z shadcn/ui)
    │   ├── MultiSelectCombobox.tsx (dla typów odpadów)
    │   └── MultiSelectCombobox.tsx (dla lokalizacji)
    ├── AIReportGenerator.tsx
    │   ├── Button (z shadcn/ui)
    │   └── Dialog (z shadcn/ui do wyświetlania raportu)
    ├── ChartComponent.tsx
    │   ├── Skeleton (z shadcn/ui do stanu ładowania)
    │   ├── Button (z shadcn/ui do eksportu PDF)
    │   └── Wykres (komponent z biblioteki Recharts)
    └── EmptyState.tsx (wyświetlany warunkowo)
```

## 4. Szczegóły komponentów

### `DashboardView.tsx`

- **Opis komponentu**: Główny kontener widoku. Odpowiedzialny za renderowanie wszystkich sub-komponentów, orkiestrację wywołań API poprzez customowy hook `useDashboard` oraz zarządzanie ogólnym układem interfejsu. Warunkowo wyświetla `EmptyState`, jeśli w systemie nie ma żadnych danych.
- **Główne elementy**: `div` (kontener główny w siatce CSS), `FiltersPanel`, `AIReportGenerator`, trzy instancje `ChartComponent`.
- **Obsługiwane interakcje**: Brak bezpośrednich; wszystkie interakcje są delegowane do komponentów podrzędnych.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak (logika i typy zarządzane w `useDashboard`).
- **Propsy**: Brak.

### `FiltersPanel.tsx`

- **Opis komponentu**: Panel zawierający wszystkie kontrolki do filtrowania danych na wykresach. Umożliwia użytkownikowi wybór zakresu dat, typów odpadów i lokalizacji.
- **Główne elementy**: `div` (formularz), `DateRangePicker`, dwie instancje `MultiSelectCombobox`, `Button` "Zastosuj" i "Resetuj".
- **Obsługiwane interakcje**:
  - `onChange`: Aktualizacja wewnętrznego stanu filtrów.
  - `onApply`: Przekazanie obiektu `FilterViewModel` do `DashboardView`.
  - `onReset`: Wyczyszczenie wszystkich filtrów i powrót do stanu początkowego.
- **Obsługiwana walidacja**: Data końcowa (`endDate`) nie może być wcześniejsza niż data początkowa (`startDate`). Przycisk "Zastosuj" jest nieaktywny, jeśli walidacja nie przejdzie.
- **Typy**: `FilterViewModel`, `WasteTypeDto`, `LocationDto`.
- **Propsy**:
  - `wasteTypes: WasteTypeDto[]`
  - `locations: LocationDto[]`
  - `onFilterChange: (filters: FilterViewModel) => void`
  - `onFilterReset: () => void`
  - `isLoading: boolean` (do blokowania formularza podczas ładowania danych)

### `ChartComponent.tsx`

- **Opis komponentu**: Reużywalny komponent do wyświetlania pojedynczego wykresu (słupkowego lub liniowego). Obsługuje stan ładowania (wyświetlając `Skeleton`), błędu oraz eksport do PDF.
- **Główne elementy**: `div` (kontener z tytułem), `Button` "Eksportuj do PDF", komponent `BarChart` lub `LineChart` z biblioteki `Recharts`.
- **Obsługiwane interakcje**:
  - `onExportToPdf`: Kliknięcie przycisku uruchamia logikę generowania pliku PDF z aktualnym widokiem wykresu.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `ChartDataViewModel`.
- **Propsy**:
  - `chartData: ChartDataViewModel`
  - `onExport: (chartId: string) => void`

### `AIReportGenerator.tsx`

- **Opis komponentu**: Komponent odpowiedzialny za interakcję z API w celu generowania raportu AI. Zawiera przycisk inicjujący proces oraz modal do wyświetlania wyniku.
- **Główne elementy**: `Button` "Generuj raport AI", `Dialog` z `DialogContent` i `DialogHeader` (z `shadcn/ui`) do wyświetlenia raportu.
- **Obsługiwane interakcje**:
  - `onGenerate`: Kliknięcie przycisku wywołuje funkcję generującą raport. Przycisk przechodzi w stan ładowania.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**:
  - `onGenerateReport: () => void`
  - `report: string`
  - `isLoading: boolean`
  - `error: string | null`

### `EmptyState.tsx`

- **Opis komponentu**: Wyświetlany, gdy w aplikacji nie ma żadnych danych do wizualizacji. Zachęca użytkownika do wykonania pierwszej akcji.
- **Główne elementy**: Ikona lub ilustracja, nagłówek (`h2`), paragraf (`p`) z wyjaśnieniem, `Button` lub `Link` (`<a href="/imports">`) z wezwaniem do działania (CTA) np. "Zaimportuj pierwszy plik".
- **Obsługiwane interakcje**: Kliknięcie CTA przenosi do strony importu.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**: Brak.

## 5. Typy

Do implementacji widoku, oprócz istniejących DTO, potrzebne będą następujące typy ViewModel, które będą reprezentować stan na froncie.

- **`FilterViewModel`**: Obiekt przechowujący aktualny stan filtrów wybranych przez użytkownika.

  ```typescript
  interface FilterViewModel {
    dateRange: {
      from: Date | undefined;
      to: Date | undefined;
    };
    wasteTypeIds: number[];
    locationIds: number[];
  }
  ```

- **`ChartDataViewModel`**: Struktura danych dla pojedynczego `ChartComponent`.

  ```typescript
  interface ChartDataViewModel {
    id: string; // np. 'by-month', 'by-type'
    title: string;
    groupBy: "month" | "type" | "location";
    data: WasteDataSummaryItemDto[];
    isLoading: boolean;
    error: string | null;
  }
  ```

  - `id`: Unikalny identyfikator do obsługi eksportu PDF.
  - `title`: Tytuł wyświetlany nad wykresem.
  - `groupBy`: Wymiar grupowania danych, przekazywany do API.
  - `data`: Dane do wyrenderowania wykresu.
  - `isLoading`: Flaga informująca o stanie ładowania.
  - `error`: Komunikat błędu, jeśli wystąpił.

## 6. Zarządzanie stanem

Cała logika związana ze stanem, pobieraniem danych i obsługą akcji użytkownika zostanie zamknięta w customowym hooku `useDashboard.ts`. Komponent `DashboardView` będzie korzystał z tego hooka, pozostając czystym komponentem prezentacyjnym.

- **Hook**: `useDashboard`
- **Cel**: Separacja logiki od prezentacji. Zarządzanie stanem filtrów, danych dla wykresów, raportu AI oraz obsługą stanów ładowania i błędów.
- **Zwracane wartości**:
  - `state`: Obiekt zawierający wszystkie dane potrzebne widokowi (`filters`, `chartsData`, `aiReport`, `dictionaries`, `isLoading` etc.).
  - `actions`: Obiekt z funkcjami do obsługi interakcji (`handleFilterChange`, `handleGenerateReport`, `handleExportPdf`).

Wewnątrz hooka `useReducer` może zostać użyty do zarządzania złożonymi przejściami stanowymi, co uprości logikę i uczyni ją bardziej przewidywalną.

## 7. Integracja API

Integracja z API będzie realizowana wewnątrz hooka `useDashboard`.

1.  **Pobieranie słowników (dane dla filtrów)**:
    - **Endpointy**: `GET /api/waste-types`, `GET /api/locations`
    - **Akcja**: Wywoływane jednorazowo przy pierwszym renderowaniu komponentu.
    - **Typy odpowiedzi**: `GetWasteTypesResponseDto`, `GetLocationsResponseDto`.

2.  **Pobieranie danych do wykresów**:
    - **Endpoint**: `GET /api/waste-data`
    - **Akcja**: Wywoływane przy montowaniu komponentu oraz każdej zmianie w `FilterViewModel`. Trzy równoległe zapytania z różnymi wartościami `groupBy`.
    - **Typy żądania**: `GetWasteDataSummaryQueryDto`. Hook będzie transformował `FilterViewModel` (np. `dateRange` na string `YYYY-MM-DD`, a `wasteTypeIds: number[]` na string `"1,2,3"`).
    - **Typy odpowiedzi**: `WasteDataSummaryResponseDto`.

3.  **Generowanie raportu AI**:
    - **Endpoint**: `POST /api/waste-data/report`
    - **Akcja**: Wywoływane na żądanie użytkownika po kliknięciu przycisku.
    - **Typy żądania**: `GenerateAiReportCommand`. Hook transformuje `FilterViewModel`.
    - **Typy odpowiedzi**: `GenerateAiReportResponseDto`.

## 8. Interakcje użytkownika

- **Zmiana filtrów**: Użytkownik modyfikuje wartości w `FiltersPanel`. Po kliknięciu "Zastosuj", stan `FilterViewModel` jest aktualizowany, co inicjuje ponowne pobranie danych dla wszystkich trzech wykresów.
- **Resetowanie filtrów**: Użytkownik klika "Resetuj", co przywraca `FilterViewModel` do wartości domyślnych i odświeża dane na wykresach.
- **Generowanie raportu**: Użytkownik klika "Generuj raport AI". Przycisk pokazuje stan ładowania, wysyłane jest zapytanie do API z aktualnymi filtrami. Po otrzymaniu odpowiedzi, wyświetlany jest modal z treścią raportu.
- **Eksport do PDF**: Użytkownik klika ikonę eksportu na wybranym wykresie. Biblioteka `html2canvas` tworzy obraz elementu DOM wykresu, a `jsPDF` zapisuje go do pliku PDF, którego nazwa zawiera aktualną datę.

## 9. Warunki i walidacja

- **Panel filtrów**:
  - **Warunek**: Data "do" nie może być wcześniejsza niż data "od".
  - **Obsługa**: Komponent `DateRangePicker` zostanie skonfigurowany, aby uniemożliwić wybór nieprawidłowego zakresu. Przycisk "Zastosuj filtry" będzie nieaktywny, dopóki zakres nie będzie poprawny.
- **Przyciski**: Wszystkie przyciski inicjujące akcje (Zastosuj, Resetuj, Generuj raport) będą nieaktywne (`disabled`), gdy trwa operacja ładowania danych, aby zapobiec wielokrotnym zapytaniom.

## 10. Obsługa błędów

- **Błąd ładowania słowników**: Jeśli pobieranie danych dla filtrów (`waste-types`, `locations`) nie powiedzie się, odpowiednie kontrolki w `FiltersPanel` zostaną zablokowane, a użytkownik zobaczy toast z informacją o błędzie.
- **Błąd ładowania danych wykresu**: Jeśli zapytanie o dane dla konkretnego wykresu zwróci błąd, w miejscu tego wykresu pojawi się komunikat o błędzie i przycisk "Spróbuj ponownie". Pozostałe wykresy, które załadowały się poprawnie, będą widoczne.
- **Błąd generowania raportu AI**: Jeśli API zwróci błąd (np. 503), stan ładowania przycisku zostanie zakończony, a użytkownik zobaczy toast z odpowiednią informacją (np. "Usługa generowania raportów jest tymczasowo niedostępna").
- **Brak danych w systemie**: Jeśli pierwsze zapytanie o dane do wykresów zwróci pustą tablicę, cały widok dashboardu zostanie zastąpiony przez komponent `EmptyState`.

## 11. Kroki implementacji

1.  **Struktura plików**: Utworzenie wszystkich niezbędnych plików komponentów (`DashboardView.tsx`, `FiltersPanel.tsx`, `ChartComponent.tsx`, itd.) oraz hooka `useDashboard.ts`.
2.  **Instalacja zależności**: Dodanie do projektu bibliotek `recharts` (do wykresów), `jspdf` oraz `html2canvas` (do eksportu PDF).
3.  **Implementacja `useDashboard`**: Zdefiniowanie logiki zarządzania stanem, w tym pobieranie słowników i danych dla wykresów przy inicjalizacji.
4.  **Implementacja `FiltersPanel`**: Zbudowanie formularza z użyciem komponentów `shadcn/ui`. Stworzenie reużywalnego `MultiSelectCombobox` na podstawie prymitywów `shadcn/ui`. Podłączenie logiki z `useDashboard`.
5.  **Implementacja `ChartComponent`**: Zintegrowanie biblioteki `recharts` do renderowania wykresu. Dodanie obsługi stanu ładowania (`Skeleton`) i błędu.
6.  **Implementacja `DashboardView`**: Połączenie wszystkich komponentów. Renderowanie trzech instancji `ChartComponent` i przekazanie im odpowiednich danych z `useDashboard`.
7.  **Logika filtrowania**: Zaimplementowanie w `useDashboard` funkcji `handleFilterChange`, która będzie transformować `FilterViewModel` i odświeżać dane wykresów.
8.  **Implementacja `AIReportGenerator`**: Dodanie przycisku i modala. Podłączenie funkcji `handleGenerateReport` z `useDashboard`.
9.  **Implementacja eksportu do PDF**: Dodanie w `useDashboard` funkcji `handleExportPdf` wykorzystującej `html2canvas` i `jspdf`.
10. **Implementacja `EmptyState`**: Dodanie logiki w `DashboardView` do warunkowego renderowania `EmptyState` na podstawie danych z `useDashboard`.
11. **Stylowanie i UX**: Dopracowanie wyglądu, responsywności (w podstawowym zakresie) oraz dodanie toastów (Sonner) dla wszystkich akcji (sukces/błąd).
12. **Testowanie manualne**: Przeklikanie wszystkich interakcji, sprawdzenie przypadków brzegowych i obsługi błędów.
