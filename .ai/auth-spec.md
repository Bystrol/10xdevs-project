# Specyfikacja Techniczna: Moduł Autentykacji Użytkowników

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i implementację modułu autentykacji, rejestracji i odzyskiwania hasła dla aplikacji WasteTrack Dashboard. Rozwiązanie bazuje na usłudze Supabase Auth i jest zintegrowane z frameworkiem Astro w trybie renderowania serwerowego (SSR).

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Strony i Layouty

Wprowadzone zostaną nowe strony publiczne oraz zaktualizowane istniejące w celu obsługi stanu zalogowanego i niezalogowanego użytkownika.

#### 2.1.1. Nowe strony publiczne (Non-Auth)

Te strony będą dostępne dla niezalogowanych użytkowników i będą korzystać z nowego, uproszczonego layoutu.

- `src/pages/login.astro`: Strona logowania. Będzie renderować komponent `LoginForm.tsx`.
- `src/pages/register.astro`: Strona rejestracji. Będzie renderować komponent `RegisterForm.tsx`.
- `src/pages/reset-password.astro`: Strona do inicjowania procesu odzyskiwania hasła. Będzie renderować `ResetPasswordForm.tsx`.
- `src/pages/auth/confirm.astro`: Strona, na którą użytkownik jest przekierowywany po kliknięciu linku aktywacyjnego w mailu. Obsługuje weryfikację tokena i ustawienie sesji.

#### 2.1.2. Nowy Layout (`AuthLayout.astro`)

- `src/layouts/AuthLayout.astro`: Prosty layout dla stron publicznych (logowanie, rejestracja). Będzie zawierał logo aplikacji i centrowany kontener na formularz, bez nawigacji i menu bocznego.

#### 2.1.3. Modyfikacja istniejących stron i layoutu (Auth)

Istniejące strony stają się chronione i będą dostępne tylko dla zalogowanych użytkowników.

- `src/pages/index.astro` (Dashboard)
- `src/pages/imports.astro` (Lista importów)

Modyfikacje w `src/layouts/Layout.astro`:

- Layout będzie pobierał informacje o sesji użytkownika z `Astro.locals.session`.
- Jeśli sesja nie istnieje, middleware (`src/middleware/index.ts`) przekieruje użytkownika na stronę `/login`.
- W nagłówku zostanie dodany nowy komponent `UserMenu.tsx`, wyświetlający email zalogowanego użytkownika i przycisk "Wyloguj".

### 2.2. Komponenty React (Client-side)

Wszystkie formularze zostaną zaimplementowane jako komponenty React z walidacją po stronie klienta (z użyciem `zod` i `react-hook-form`) w celu zapewnienia natychmiastowej informacji zwrotnej dla użytkownika.

- `src/components/features/auth/LoginForm.tsx`:
  - Pola: `email`, `password`.
  - Logika: Wysyła zapytanie `POST` do endpointu `/api/auth/login`.
  - Obsługa błędów: Wyświetla komunikaty (np. "Nieprawidłowy email lub hasło") na podstawie odpowiedzi z API.
  - Nawigacja: Linki do `/register` i `/reset-password`.

- `src/components/features/auth/RegisterForm.tsx`:
  - Pola: `email`, `password`, `confirmPassword`.
  - Logika: Wysyła zapytanie `POST` do `/api/auth/register`. Po pomyślnej rejestracji wyświetla komunikat o konieczności sprawdzenia skrzynki mailowej w celu aktywacji konta.

- `src/components/features/auth/ResetPasswordForm.tsx`:
  - Pole: `email`.
  - Logika: Wywołuje metodę `supabase.auth.resetPasswordForEmail()` po stronie klienta, podając adres URL do przekierowania (`/auth/confirm`). Po sukcesie wyświetla komunikat o wysłaniu linku.

- `src/components/features/auth/UserMenu.tsx`:
  - Wyświetla awatar/inicjały użytkownika i jego email.
  - Zawiera rozwijane menu z opcją "Wyloguj".
  - Kliknięcie "Wyloguj" wysyła zapytanie `POST` do `/api/auth/logout` i przekierowuje na `/login`.

### 2.3. Scenariusze Użytkownika i Walidacja

- **Walidacja formularzy**: Każde pole będzie miało walidację (np. poprawność formatu email, minimalna długość hasła). Komunikaty będą wyświetlane pod odpowiednimi polami.
- **Logowanie**:
  - Sukces: Użytkownik zostaje przekierowany na stronę główną (`/`).
  - Błąd: Formularz wyświetla ogólny błąd "Nieprawidłowe dane logowania".
- **Rejestracja**:
  - Sukces: Formularz zostaje ukryty, a na jego miejscu pojawia się komunikat "Sprawdź swoją skrzynkę mailową, aby dokończyć rejestrację."
  - Błąd (np. email już istnieje): Formularz wyświetla błąd pod polem email.
- **Toast notifications (Sonner)**: Kluczowe akcje, takie jak wylogowanie czy wysłanie linku resetującego hasło, będą potwierdzane przez globalne powiadomienia toast.

## 3. Logika Backendowa

### 3.1. Middleware (`src/middleware/index.ts`)

Middleware będzie centralnym punktem logiki autentykacji po stronie serwera.

- **Ochrona stron**: Na podstawie `context.url.pathname` będzie sprawdzać, czy żądanie dotyczy strony chronionej.
- **Zarządzanie sesją**:
  1.  Przy każdym żądaniu odczyta tokeny (`access_token`, `refresh_token`) z ciasteczek `astro-auth-token`.
  2.  Jeśli tokeny istnieją, użyje `supabase.auth.setSession()` do ich weryfikacji.
  3.  Jeśli sesja jest ważna, zapisze ją w `context.locals.session`, udostępniając ją na potrzeby renderowania strony.
  4.  Jeśli `access_token` wygasł, użyje `refresh_token` do jego odświeżenia i zaktualizuje ciasteczko.
- **Przekierowania**:
  - Jeśli użytkownik niezalogowany próbuje uzyskać dostęp do strony chronionej, zostanie przekierowany na `/login`.
  - Jeśli użytkownik zalogowany próbuje uzyskać dostęp do `/login` lub `/register`, zostanie przekierowany na `/`.

### 3.2. Endpointy API (`src/pages/api/auth/`)

Endpointy te będą pośredniczyć między formularzami klienckimi a Supabase Auth, zarządzając sesją za pomocą bezpiecznych ciasteczek HTTP-Only.

- `POST /api/auth/login.ts`:
  1.  Waliduje `email` i `password` przychodzące w ciele żądania (Zod).
  2.  Wywołuje `supabase.auth.signInWithPassword()`.
  3.  W przypadku sukcesu, pobiera sesję i ustawia ciasteczko `astro-auth-token` (HTTP-Only, Secure, SameSite=Lax) z `access_token` i `refresh_token`.
  4.  Zwraca status 200 OK.
  5.  W przypadku błędu zwraca odpowiedni status (np. 400) z komunikatem błędu.

- `POST /api/auth/register.ts`:
  1.  Waliduje `email` i `password` (Zod).
  2.  Wywołuje `supabase.auth.signUp()`, przekazując `email_redirect_to` wskazujący na stronę `/auth/confirm`.
  3.  Zwraca status 201 Created lub odpowiedni błąd.

- `POST /api/auth/logout.ts`:
  1.  Wywołuje `supabase.auth.signOut()`.
  2.  Usuwa ciasteczko `astro-auth-token`.
  3.  Zwraca status 200 OK.

### 3.3. Walidacja i Obsługa Błędów

- Każdy endpoint API będzie używał schematów `Zod` do walidacji danych wejściowych. Niepoprawne dane zwrócą błąd 400.
- Błędy z Supabase (np. błąd połączenia, nieprawidłowe dane) będą logowane po stronie serwera i zwracane do klienta jako ustandaryzowane odpowiedzi błędu (np. status 500 z ogólnym komunikatem).

## 4. System Autentykacji (Supabase + Astro)

### 4.1. Procesy Autentykacji

- **Rejestracja**:
  1.  Frontend (`RegisterForm.tsx`) wysyła dane do `/api/auth/register`.
  2.  Backend wywołuje `supabase.auth.signUp()`.
  3.  Supabase wysyła email weryfikacyjny z unikalnym linkiem.
  4.  Użytkownik klika link, trafia na `/auth/confirm`.
  5.  Supabase weryfikuje token, aktywuje użytkownika i przekierowuje na `/login` z komunikatem o sukcesie.

- **Logowanie**:
  1.  Frontend (`LoginForm.tsx`) wysyła `email` i `password` do `/api/auth/login`.
  2.  Backend wywołuje `supabase.auth.signInWithPassword()`.
  3.  Po sukcesie, backend ustawia ciasteczko sesji.
  4.  Frontend po otrzymaniu odpowiedzi 200 OK przekierowuje użytkownika na stronę główną.

- **Wylogowanie**:
  1.  Frontend (`UserMenu.tsx`) wysyła żądanie do `/api/auth/logout`.
  2.  Backend usuwa sesję z Supabase i czyści ciasteczko.
  3.  Frontend przekierowuje użytkownika na `/login`.

- **Odzyskiwanie hasła**:
  1.  Frontend (`ResetPasswordForm.tsx`) wywołuje `supabase.auth.resetPasswordForEmail()` bezpośrednio po stronie klienta.
  2.  Użytkownik otrzymuje email z linkiem do resetu.
  3.  Link prowadzi do strony `/auth/confirm` (lub dedykowanej strony do zmiany hasła), która po weryfikacji tokenu pozwoli na ustawienie nowego hasła. Nowe hasło jest ustawiane przez `supabase.auth.updateUser()`.

### 4.3. Zarządzanie Sesją (Cookie-based)

- **Źródło prawdy**: Stan sesji jest zarządzany centralnie przez ciasteczko `astro-auth-token` (HTTP-Only). Middleware na serwerze jest jedynym "źródłem prawdy" podczas renderowania stron.
- **Synchronizacja klienta**: Po stronie klienta, Supabase Client będzie nasłuchiwać na zdarzenie `onAuthStateChange`, aby dynamicznie aktualizować interfejs (np. `UserMenu`) w odpowiedzi na zmiany stanu autentykacji bez konieczności przeładowania strony.
