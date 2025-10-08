# REST API Plan

This document outlines the REST API for the WasteTrack Dashboard application, designed based on the product requirements, database schema, and technical stack.

## 1. Resources

- **Batches**: Represents a single CSV file import session. Corresponds to the `batches` table.
- **Waste Data**: Represents aggregated waste data records for dashboard visualizations. Derived from the `waste_data` table.
- **Waste Types**: A dictionary of available waste types. Corresponds to the `waste_types` table.
- **Locations**: A dictionary of available locations. Corresponds to the `locations` table.

## 2. Endpoints

All endpoints are prefixed with `/api`.

### 2.1. Batches

#### List Batches

- **Method**: `GET`
- **URL**: `/batches`
- **Description**: Retrieves a list of all batches imported by the authenticated user.
- **Query Parameters**:
  - `page` (optional, number): The page number for pagination. Defaults to 1.
  - `limit` (optional, number): The number of items per page. Defaults to 10.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    {
      "data": [
        {
          "id": 1,
          "filename": "q3_report.csv",
          "status": "active",
          "recordCount": 750,
          "createdAt": "2025-10-08T10:00:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1
      }
    }
    ```
- **Error Response**:
  - **Code**: `401 Unauthorized` - If the user is not authenticated.

#### Import CSV Batch

- **Method**: `POST`
- **URL**: `/batches/import`
- **Description**: Imports a new batch of waste data from a CSV file. The request must be `multipart/form-data`.
- **Request Body**:
  - `file`: The CSV file to be imported.
- **Success Response**:
  - **Code**: `201 Created`
  - **Content**:
    ```json
    {
      "message": "Import successful",
      "batch": {
        "id": 2,
        "filename": "q4_report.csv",
        "status": "active",
        "recordCount": 500,
        "createdAt": "2025-10-08T11:00:00Z"
      }
    }
    ```
- **Error Responses**:
  - **Code**: `400 Bad Request`
    - `{ "error": "No file uploaded." }`
    - `{ "error": "Invalid file type. Only CSV is allowed." }`
    - `{ "error": "File exceeds the 1000 record limit." }`
    - `{ "error": "Missing required columns: [column_name]." }`
    - `{ "error": "Invalid date format in row X. Expected YYYY-MM-DD." }`
    - `{ "error": "Invalid waste type in row X: [waste_type]." }`
  - **Code**: `401 Unauthorized`

#### Delete Batch

- **Method**: `DELETE`
- **URL**: `/batches/:id`
- **Description**: Deletes a specific batch and all associated waste data records.
- **URL Parameters**:
  - `id` (required, number): The ID of the batch to delete.
- **Success Response**:
  - **Code**: `204 No Content`
- **Error Responses**:
  - **Code**: `401 Unauthorized`
  - **Code**: `404 Not Found` - If a batch with the given ID doesn't exist or doesn't belong to the user.

### 2.2. Waste Data

#### Get Waste Data Summary

- **Method**: `GET`
- **URL**: `/waste-data`
- **Description**: Retrieves aggregated waste data for dashboard charts, with optional filtering.
- **Query Parameters**:
  - `groupBy` (required, string): The dimension to group data by. Allowed values: `month`, `type`, `location`.
  - `startDate` (optional, string): Start date for filtering (YYYY-MM-DD).
  - `endDate` (optional, string): End date for filtering (YYYY-MM-DD).
  - `wasteTypeIds` (optional, string): Comma-separated list of waste type IDs to filter by.
  - `locationIds` (optional, string): Comma-separated list of location IDs to filter by.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    // Example for groupBy=type
    {
      "data": [
        {
          "label": "PLASTIC",
          "value": 1500
        },
        {
          "label": "BIO",
          "value": 800
        }
      ]
    }
    ```
- **Error Responses**:
  - **Code**: `400 Bad Request` - If `groupBy` is missing or invalid.
  - **Code**: `401 Unauthorized`

#### Generate AI Report

- **Method**: `POST`
- **URL**: `/waste-data/report`
- **Description**: Generates a brief text summary of the filtered waste data using an AI model.
- **Request Body**:
  ```json
  {
    "startDate": "2025-01-01",
    "endDate": "2025-03-31",
    "wasteTypeIds": [1, 2],
    "locationIds": [5]
  }
  ```
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    {
      "report": "In the first quarter of 2025, PLASTIC was the dominant waste type at the Central Warehouse, accounting for over 65% of the total volume."
    }
    ```
- **Error Responses**:
  - **Code**: `400 Bad Request` - If the request body is invalid.
  - **Code**: `401 Unauthorized`
  - **Code**: `503 Service Unavailable` - If the AI service fails.

### 2.3. Dictionaries

#### Get Waste Types

- **Method**: `GET`
- **URL**: `/waste-types`
- **Description**: Retrieves the list of all available waste types. Used to populate UI filters.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    [
      { "id": 1, "name": "PLASTIC" },
      { "id": 2, "name": "BIO" },
      { "id": 3, "name": "GLASS" },
      { "id": 4, "name": "PAPER" },
      { "id": 5, "name": "MIXED" }
    ]
    ```
- **Error Response**: `401 Unauthorized`

#### Get Locations

- **Method**: `GET`
- **URL**: `/locations`
- **Description**: Retrieves the list of all available locations. Used to populate UI filters.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    [
      { "id": 1, "name": "Main Facility" },
      { "id": 2, "name": "Warehouse A" }
    ]
    ```
- **Error Response**: `401 Unauthorized`

## 3. Authentication and Authorization

- **Authentication**: The API will use JWTs provided by Supabase Auth. The client must include the JWT in the `Authorization` header of every request as a Bearer token (`Authorization: Bearer <SUPABASE_JWT>`).
- **Implementation**: An Astro middleware will intercept all incoming requests to `/api/*`. It will validate the JWT using the Supabase client. If the token is invalid or missing, it will return a `401 Unauthorized` response.
- **Authorization**: Data access control is enforced at the database level using PostgreSQL's Row-Level Security (RLS), as defined in the database schema. The policies ensure that users can only access, modify, or delete data associated with their own `user_id`. The API relies entirely on RLS and does not contain separate authorization logic.

## 4. Validation and Business Logic

- **CSV Import Validation (`POST /batches/import`)**:
  - The uploaded file must be of type `text/csv`.
  - The file cannot contain more than 1000 data rows.
  - The file must contain the headers: `waste_type`, `location`, `date`.
  - The `date` column must be in `YYYY-MM-DD` format and cannot be in the future.
  - The `waste_type` column must be of enum type: `('PLASTIC'), ('BIO'), ('GLASS'), ('PAPER'), ('MIXED')`
  - If any validation fails, the entire import is rejected with a descriptive error message.
- **Data Integrity**:
  - The import process happens within a single database transaction. If any part of the process fails (e.g., a data row is invalid), the entire transaction is rolled back, ensuring no partial data is saved.
  - New `locations` and `waste_types` found in the CSV will be created automatically. The system will perform a case-insensitive lookup to avoid duplicates (e.g., 'plastic' and 'PLASTIC' will be treated as the same).
- **Deletion Logic**:
  - When a batch is deleted via `DELETE /batches/:id`, the `ON DELETE CASCADE` constraint in the database ensures all associated `waste_data` records are also deleted automatically.
