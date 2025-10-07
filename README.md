# WasteTrack Dashboard

An analytical dashboard for waste management data, enabling quick CSV data import and visualization of waste trends.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

WasteTrack Dashboard is a web-based analytical application designed for waste department managers. It allows for the import of CSV files containing waste data to instantly generate clear visualizations of trends. The primary goal of the MVP is to provide a simple tool that enables users to upload data, analyze it through charts, and generate a concise AI-powered text summary in under 5 minutes.

This tool addresses the common challenge faced by waste processing companies where data is scattered across various spreadsheets and PDF reports, making it difficult to:

- Identify dominant waste types over a specific period.
- Quickly compare locations and time-based trends.
- Prepare succinct reports for stakeholders.

The absence of a centralized, visual analytical tool often leads to delayed decision-making and increased manual effort.

## Tech Stack

The project is built with a modern tech stack:

- **Frontend**:
  - [Astro 5](https://astro.build/)
  - [React 19](https://react.dev/)
  - [TypeScript 5](https://www.typescriptlang.org/)
  - [Tailwind CSS 4](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/)

- **Backend & Database**:
  - [Supabase](https://supabase.io/)

- **AI**:
  - [OpenRouter.ai](https://openrouter.ai/)

- **CI/CD & Hosting**:
  - [GitHub Actions](https://github.com/features/actions)
  - [Cloudflare](https://www.cloudflare.com/)

## Getting Started Locally

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js version `22.14.0` (it is recommended to use `nvm` - Node Version Manager).
- `npm` package manager.

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Bystrol/10xdevs-project
   ```
2. **Navigate to the project directory:**
   ```sh
   cd your-repository
   ```
3. **Use the correct Node.js version:**
   ```sh
   nvm use
   ```
4. **Install NPM packages:**
   ```sh
   npm install
   ```
5. **Set up environment variables:**
   - Create a `.env` file in the root of the project.
   - Add the necessary environment variables (e.g., `SUPABASE_URL`, `SUPABASE_KEY`, `OPENROUTER_API_KEY`).

6. **Run the development server:**
   ```sh
   npm run dev
   ```

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run preview`: Starts a local preview server for the production build.
- `npm run astro`: Access the Astro CLI.
- `npm run lint`: Lints the code using ESLint.
- `npm run lint:fix`: Lints and automatically fixes problems.
- `npm run format`: Formats code with Prettier.

## Project Scope

### In Scope (MVP Features)

- Import a single CSV file (up to 1000 records) with `waste_type`, `location`, and `date` columns.
- Validate files for correct format and required fields.
- Store data in a Supabase database.
- Display a list of imported batches with an option to delete an entire batch.
- A dashboard with charts for waste per month, type, and location.
- Filter charts by date range, waste type, and location.
- Export the currently displayed chart to a PDF.
- Generate a concise (1-3 sentences) AI summary of the filtered data.
- User feedback through toast notifications for success/error messages.
- User authentication (login/registration).

### Out of Scope

- Authorization and user role management.
- Editing individual records after import.
- Predictive analytics or integration with ERP/GPS systems.
- A responsive mobile interface.
- Storing the original uploaded CSV file.
- Full report generation for PDF export (only chart and title are included).

## Project Status

**Status:** In Progress

This project is currently under active development for the Minimum Viable Product (MVP) release.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more information.
