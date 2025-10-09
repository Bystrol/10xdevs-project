# CSV Import Test Files

This directory contains sample CSV files for testing the `POST /api/batches/import` endpoint. Each file tests different scenarios to ensure proper validation and error handling.

## Test Files

### Happy Path Scenarios

#### `happy_path.csv`

- **Purpose**: Tests successful import with valid data
- **Expected Result**: 201 Created with batch details
- **Data**: 10 records with valid dates, known waste types (plastic, bio, glass, paper, mixed), locations, and positive quantities

### Validation Error Scenarios

#### `missing_headers.csv`

- **Purpose**: Tests missing required columns
- **Expected Result**: 400 Bad Request - "Missing required columns: quantity"
- **Data**: Missing the "quantity" column

#### `invalid_date_format.csv`

- **Purpose**: Tests invalid date formats
- **Expected Result**: 400 Bad Request - "Invalid data format in row X: invalid date format"
- **Data**: Various invalid date formats (MM/DD/YYYY, invalid dates, text)

#### `future_dates.csv`

- **Purpose**: Tests future date validation
- **Expected Result**: 400 Bad Request - "Invalid data format in row X: date cannot be in the future"
- **Data**: Dates in the future

#### `unknown_waste_types.csv`

- **Purpose**: Tests unknown waste type validation
- **Expected Result**: 400 Bad Request - "Invalid value in row X: unknown waste type"
- **Data**: Waste types that don't exist in the database

#### `invalid_quantities.csv`

- **Purpose**: Tests quantity validation
- **Expected Result**: 400 Bad Request - "Invalid data format in row X: quantity must be a positive integer"
- **Data**: Zero, negative numbers, and non-numeric values

#### `over_limit_records.csv`

- **Purpose**: Tests record count limit
- **Expected Result**: 400 Bad Request - "File exceeds the 1000 record limit"
- **Data**: 1005 records (over the 1000 limit)

#### `empty_file.csv`

- **Purpose**: Tests empty file handling
- **Expected Result**: 400 Bad Request - "File contains no valid records"
- **Data**: Completely empty file

#### `malformed_csv.csv`

- **Purpose**: Tests CSV parsing errors
- **Expected Result**: 400 Bad Request - "CSV parsing failed"
- **Data**: Malformed CSV with extra columns and inconsistent formatting

#### `mixed_valid_invalid.csv`

- **Purpose**: Tests that validation stops at first error
- **Expected Result**: 400 Bad Request (should fail on first invalid row)
- **Data**: Mix of valid and invalid records

## Valid Waste Types

Based on the database seed data, these waste types are valid:

- `plastic`
- `bio`
- `glass`
- `paper`
- `mixed`

## Valid Locations

Locations are created dynamically, so any string can be used as a location name. The system will automatically create new locations if they don't exist.

## Usage

Upload these files to the `/api/batches/import` endpoint to test different scenarios. Each file is designed to test specific validation logic and error handling.

## Expected API Responses

- **Success (201)**: `{"message": "Import successful", "batch": {...}}`
- **Validation Error (400)**: `{"error": "detailed error message"}`
- **Server Error (500)**: `{"error": "Internal Server Error", "message": "details"}`
