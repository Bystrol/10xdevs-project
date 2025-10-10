# Plan implementacji widoku Imports

## 1. Przegląd

Widok `Imports` (`/imports`) jest centralnym miejscem do zarządzania partiami danych w aplikacji WasteTrack. Umożliwia użytkownikom przesyłanie nowych plików CSV z danymi o odpadach oraz przeglądanie i usuwanie wcześniej zaimportowanych partii. Główne cele tego widoku to zapewnienie prostego i intuicyjnego interfejsu do importu danych oraz transparentnego zarządzania historią importów.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

- **Ścieżka:** `/imports`
- **Plik:** `src/pages/imports.astro`

## 3. Struktura komponentów

Struktura widoku będzie oparta na architekturze "Astro Islands", gdzie strona Astro renderuje interaktywne komponenty React.

```
/src/pages/imports.astro
└── /src/components/views/ImportsView.tsx (React Island)
    ├── /src/components/features/CSVUploader.tsx
    │   ├── <Input type="file"> (z shadcn/ui)
    │   ├── <Button type="submit"> (z shadcn/ui)
    │   └── <Progress> (z shadcn/ui, opcjonalnie)
    └── /src/components/features/BatchesList.tsx
        ├── <Table> (z shadcn/ui)
        │   └── <TableRow> (dla każdej partii)
        │       └── <Button variant="destructive"> (przycisk Delete)
        └── <Pagination> (z shadcn/ui)
```

## 4. Szczegóły komponentów

### `ImportsView.tsx`

- **Opis komponentu:** Główny komponent-kontener dla widoku `/imports`. Zarządza stanem całego widoku, w tym listą partii, paginacją oraz obsługą procesów importu i usuwania. Komunikuje się z API i przekazuje dane do komponentów podrzędnych.
- **Główne elementy:** Komponent ten renderuje `CSVUploader` oraz `BatchesList`, dostarczając im niezbędne propsy i funkcje zwrotne.
- **Obsługiwane interakcje:**
  - Pobieranie listy partii przy pierwszym renderowaniu i przy zmianie strony.
  - Obsługa pomyślnego (`onUploadSuccess`) i niepomyślnego (`onUploadError`) importu pliku.
  - Obsługa żądania usunięcia partii (`onDeleteBatch`).
- **Typy:** `BatchDto`, `PaginationDto`.
- **Propsy:** Brak (komponent jest głównym kontenerem).

### `CSVUploader.tsx`

- **Opis komponentu:** Formularz umożliwiający wybór i przesłanie pliku CSV. Odpowiada za walidację pliku po stronie klienta oraz komunikację z API w celu jego wysłania.
- **Główne elementy:**
  - `shadcn/ui <Input type="file">` do wyboru pliku.
  - `shadcn/ui <Button type="submit">` do rozpoczęcia przesyłania.
  - Etykieta wyświetlająca nazwę wybranego pliku.
  - Opcjonalnie `shadcn/ui <Progress>` do wizualizacji postępu przesyłania.
- **Obsługiwane interakcje:**
  - Wybór pliku z dysku.
  - Przesłanie formularza.
- **Obsługiwana walidacja (po stronie klienta):**
  - **Typ pliku:** Akceptuje tylko pliki z rozszerzeniem `.csv` lub typem MIME `text/csv`.
  - **Obecność pliku:** Przycisk "Upload" jest nieaktywny, jeśli żaden plik nie jest wybrany.
- **Typy:** `ImportCsvBatchResponseDto`.
- **Propsy:**
  - `onUploadSuccess: (newBatch: BatchDto) => void`: Funkcja zwrotna wywoływana po pomyślnym imporcie.
  - `isUploading: boolean`: Flaga informująca, czy trwa proces przesyłania, używana do blokowania formularza.

### `BatchesList.tsx`

- **Opis komponentu:** Tabela wyświetlająca listę historycznych importów. Umożliwia paginację wyników oraz inicjowanie akcji usunięcia dla każdej partii.
- **Główne elementy:**
  - `shadcn/ui <Table>` do wyświetlania danych w formie tabelarycznej.
  - Kolumny: `Filename`, `Import Date`, `Record Count`, `Status`, `Actions`.
  - `shadcn/ui <Button variant="destructive">` w każdej komórce akcji.
  - `shadcn/ui <Pagination>` do nawigacji między stronami.
- **Obsługiwane interakcje:**
  - Kliknięcie przycisku "Delete", co inicjuje proces usuwania partii.
  - Zmiana strony w komponencie paginacji.
- **Obsługiwana walidacja:**
  - Wyświetlenie modala z prośbą o potwierdzenie przed usunięciem partii.
- **Typy:** `BatchDto`, `PaginationDto`.
- **Propsy:**
  - `batches: BatchDto[]`: Tablica obiektów partii do wyświetlenia.
  - `pagination: PaginationDto`: Obiekt z informacjami o paginacji.
  - `onDelete: (batchId: number) => void`: Funkcja zwrotna wywoływana po potwierdzeniu usunięcia.
  - `onPageChange: (page: number) => void`: Funkcja zwrotna wywoływana przy zmianie strony.

## 5. Typy

Widok będzie korzystał z istniejących typów zdefiniowanych w `src/types.ts`. Nie ma potrzeby tworzenia nowych, złożonych typów ViewModel.

- **`BatchDto`**: Reprezentuje pojedynczą partię na liście.
  ```typescript
  interface BatchDto {
    id: number;
    filename: string;
    status: "active" | "deleted" | "processing";
    recordCount: number;
    createdAt: string;
  }
  ```
- **`PaginationDto`**: Zawiera informacje o paginacji.
  ```typescript
  interface PaginationDto {
    page: number;
    limit: number;
    total: number;
  }
  ```
- **`ListBatchesResponseDto`**: Struktura odpowiedzi dla `GET /api/batches`.
- **`ImportCsvBatchResponseDto`**: Struktura odpowiedzi dla `POST /api/batches/import`.

## 6. Zarządzanie stanem

Stan widoku będzie zarządzany lokalnie w komponencie `ImportsView.tsx` przy użyciu hooków `useState` i `useEffect`. W celu lepszej organizacji logiki, zostanie stworzony dedykowany custom hook `useBatches`.

### Custom Hook: `useBatches`

- **Cel:** Abstrakcja logiki związanej z pobieraniem, dodawaniem i usuwaniem partii.
- **Zarządzany stan:**
  - `batches: BatchDto[]`
  - `pagination: PaginationDto | null`
  - `isLoading: boolean` (dla pobierania listy)
  - `error: string | null`
- **Udostępniane funkcje:**
  - `fetchBatches(page: number)`: Pobiera dane dla określonej strony.
  - `addBatch(batch: BatchDto)`: Dodaje nową partię do stanu (po pomyślnym imporcie).
  - `removeBatch(batchId: number)`: Usuwa partię ze stanu (po pomyślnym usunięciu).

Komponent `ImportsView.tsx` będzie również zarządzał stanem `isUploading: boolean`, aby kontrolować proces przesyłania pliku.

## 7. Integracja API

Komponenty będą komunikować się z trzema endpointami API:

1.  **Pobieranie listy partii**
    - **Endpoint:** `GET /api/batches`
    - **Akcja:** Wywoływane przy montowaniu komponentu `ImportsView` oraz przy zmianie strony w `BatchesList`.
    - **Typ odpowiedzi:** `ListBatchesResponseDto`

2.  **Import pliku CSV**
    - **Endpoint:** `POST /api/batches/import`
    - **Akcja:** Wywoływane przez `CSVUploader` po przesłaniu formularza.
    - **Typ żądania:** `multipart/form-data` z polem `file`.
    - **Typ odpowiedzi:** `ImportCsvBatchResponseDto`

3.  **Usuwanie partii**
    - **Endpoint:** `DELETE /api/batches/:id`
    - **Akcja:** Wywoływane z `BatchesList` po potwierdzeniu przez użytkownika.
    - **Typ odpowiedzi:** `204 No Content`

Do obsługi zapytań API zostanie użyta biblioteka `axios` oraz `Tanstack-Query`. Do odświezania danych uzyj query keys, które powinny być wyniesione do zmiennej.

## 8. Interakcje użytkownika

- **Import pliku:**
  1. Użytkownik klika na pole wyboru pliku i wybiera plik `.csv`.
  2. Nazwa pliku pojawia się w interfejsie.
  3. Użytkownik klika "Upload". Przycisk staje się nieaktywny.
  4. Po pomyślnym zakończeniu: pojawia się toast "Import successful", a nowa partia jest dodawana na górę listy `BatchesList`.
  5. W przypadku błędu: pojawia się toast z komunikatem błędu zwróconym przez API.
- **Usuwanie partii:**
  1. Użytkownik klika przycisk "Delete" w wierszu danej partii.
  2. Pojawia się modal z pytaniem o potwierdzenie.
  3. Po potwierdzeniu: wiersz zostaje usunięty z tabeli, a użytkownik widzi toast "Batch deleted".
- **Paginacja:**
  1. Użytkownik klika na numer strony w komponencie paginacji.
  2. Tabela `BatchesList` jest odświeżana z danymi dla wybranej strony.

## 9. Warunki i walidacja

- **Formularz importu (`CSVUploader`):**
  - Przycisk "Upload" jest aktywny tylko wtedy, gdy plik został wybrany.
  - Akceptowane są tylko pliki z rozszerzeniem `.csv` (walidacja po stronie klienta).
- **Lista partii (`BatchesList`):**
  - Jeśli lista partii jest pusta, wyświetlany jest komunikat "No batches have been imported yet."
  - Przycisk "Delete" jest widoczny dla każdej partii ze statusem `active`.
- **API (po stronie serwera):**
  - Walidacja limitu 1000 rekordów.
  - Walidacja formatu kolumn i dat (`YYYY-MM-DD`).
  - Błędy walidacji są propagowane do interfejsu i wyświetlane w toastach.

## 10. Obsługa błędów

- **Błędy sieciowe:** Generyczny toast "Network error. Please try again."
- **Błędy serwera (5xx):** Generyczny toast "An unexpected server error occurred."
- **Błędy walidacji importu (400):** Toast z dokładnym komunikatem błędu z odpowiedzi API (np. "File exceeds the 1000 record limit.").
- **Nieznaleziona partia (404 przy usuwaniu):** Toast "This batch no longer exists." i odświeżenie listy.
- **Stan ładowania:** Komponenty `CSVUploader` i `BatchesList` będą wyświetlać wskaźniki ładowania (np. spinnery, dezaktywowane przyciski), aby poinformować użytkownika o trwających operacjach.

## 11. Kroki implementacji

1.  **Utworzenie struktury plików:**
    - `src/pages/imports.astro`
    - `src/components/views/ImportsView.tsx`
    - `src/components/features/CSVUploader.tsx`
    - `src/components/features/BatchesList.tsx`
    - `src/hooks/useBatches.ts` (opcjonalnie, ale zalecane)
2.  **Implementacja strony `imports.astro`:** Stworzenie strony i osadzenie w niej komponentu `ImportsView.tsx` jako `client:load`.
3.  **Implementacja `BatchesList.tsx`:** Stworzenie statycznej wersji tabeli i paginacji przy użyciu komponentów `shadcn/ui`, przyjmującej dane przez propsy.
4.  **Implementacja `CSVUploader.tsx`:** Stworzenie formularza z inputem na plik i przyciskiem, wraz z logiką walidacji po stronie klienta.
5.  **Implementacja `useBatches.ts` (lub logiki w `ImportsView`):**
    - Zaimplementowanie funkcji `fetchBatches` do pobierania danych z `GET /api/batches`.
    - Zaimplementowanie funkcji `removeBatch` i logiki usuwania z `DELETE /api/batches/:id`.
6.  **Implementacja `ImportsView.tsx`:**
    - Zintegrowanie `useBatches` do zarządzania stanem.
    - Przekazanie danych i funkcji do `BatchesList`.
    - Zaimplementowanie logiki przesyłania pliku z `POST /api/batches/import` i przekazanie funkcji zwrotnych do `CSVUploader`.
    - Dodanie obsługi toastów (`sonner`) dla wszystkich operacji.
7.  **Stylowanie i UX:** Dopracowanie wyglądu, dodanie stanów ładowania, obsługi pustych stanów i komunikatów o błędach.
8.  **Testowanie:** Ręczne przetestowanie wszystkich historyjek użytkownika (US-001, US-002, US-005, US-008, US-009).
