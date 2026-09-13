# HRIS Import Inspector

A React and Node.js/Express application that previews and validates an HRIS CSV before any employee or reporting relationship data is persisted.

The application analyzes the uploaded HRIS data in memory and provides validation results, manager relationships, root employees, direct-report counts, and reporting-cycle detection.

## Features

* Upload an HRIS CSV from the browser
* Count total source rows
* Validate employee identity
* Detect duplicate employee IDs and emails
* Detect missing employee IDs and emails
* Normalize whitespace and email addresses
* Support CSV headers in any order
* Handle UTF-8 CSV files with or without BOM
* Correctly parse quoted CSV values containing commas
* Resolve managers by employee ID or email
* Detect conflicting manager references
* Detect missing managers
* Detect self-management
* Identify root employees
* Calculate direct-report counts
* Detect reporting cycles
* Distinguish employees participating in cycles from employees merely reporting into a cycle
* Display row-level validation and manager errors
* Handle malformed uploads with clear errors
* Automated tests for important business rules
* No database persistence, as it is not required for this exercise

## Tech Stack

### Frontend

* React
* Vite
* JavaScript

### Backend

* Node.js
* Express.js
* Multer
* csv-parse
* CORS

### Testing

* Jest

## Project Structure

```text
hris-import-inspector/
│
├── backend/
│   ├── src/
│   │   ├── parser/
│   │   │   └── csvParser.js
│   │   │
│   │   ├── services/
│   │   │   └── hrisAnalyzer.js
│   │   │
│   │   ├── routes/
│   │   │   └── importRoutes.js
│   │   │
│   │   └── server.js
│   │
│   ├── tests/
│   │   └── hrisAnalyzer.test.js
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
└── README.md
```

## HRIS CSV Format

The application expects the following columns:

```text
employee_id
employee_name
email
manager_id
manager_email
department
```

The columns may appear in any order.

### Normalization

Before analysis:

* All values are trimmed.
* Emails are converted to lowercase.
* Employee IDs preserve their original case.

## Identity Validation

An employee must have:

* `employee_id`
* `email`

Employee IDs and emails must be unique after normalization.

If an employee ID or email appears more than once, every row containing that duplicate identity is considered invalid.

Invalid identity rows are excluded from manager and hierarchy analysis.

## Manager Resolution

Manager references are resolved using the following rules:

### No manager reference

If both `manager_id` and `manager_email` are blank, the employee is considered a root employee.

### Manager ID only

If only `manager_id` is provided, the manager is looked up using employee ID.

### Manager email only

If only `manager_email` is provided, the manager is looked up using normalized email.

### Both manager ID and email

If both are provided, both references must resolve to the same employee.

Otherwise, the row receives a manager-reference error.

### Invalid manager reference

An employee with a manager-reference error remains an accepted employee, but:

* No reporting relationship is created.
* The employee is not considered a root.

Self-management is also reported as an error.

## Architecture

The application separates HTTP handling, CSV parsing, and HRIS business logic.

### `backend/src/parser/csvParser.js`

Responsible for:

* Parsing CSV input
* Validating required headers
* Handling BOM
* Normalizing CSV values
* Converting emails to lowercase
* Returning normalized employee rows

### `backend/src/services/hrisAnalyzer.js`

Contains the main HRIS analysis logic:

* Identity validation
* Duplicate detection
* Manager resolution
* Root employee detection
* Direct-report calculation
* Reporting-cycle detection

The business logic is kept separate from the HTTP layer so it can be tested independently.

### `backend/src/routes/importRoutes.js`

Handles the CSV upload endpoint.

It:

1. Receives the uploaded file.
2. Validates the file.
3. Converts the file buffer to UTF-8 text.
4. Parses the CSV.
5. Runs HRIS analysis.
6. Returns the analysis result as JSON.

### `frontend/src/App.jsx`

Provides the browser interface for:

* Selecting a CSV file
* Uploading the file
* Displaying import summary
* Displaying validation errors
* Displaying manager errors
* Displaying root employees
* Displaying managers and direct-report counts
* Displaying reporting-cycle employees

## Data Structures and Algorithms

Employee lookup is performed using JavaScript `Map` objects indexed by:

```text
employee_id -> employee
email       -> employee
```

This allows manager references to be resolved without repeatedly scanning the entire employee list.

Manager relationships are represented as:

```text
employee_id -> manager_id
```

Direct-report counts are calculated by iterating through the relationships and maintaining:

```text
manager_id -> direct report count
```

### Reporting Cycle Detection

Reporting cycles are detected using DFS with three states:

```text
0 = not visited
1 = currently being visited
2 = completely processed
```

When DFS reaches an employee whose state is `1`, that employee is already present in the current traversal path.

The employees from that point to the end of the current path form the actual reporting cycle.

Employees that only report into a cycle are not included as cycle members.

## Complexity

For `n` employees:

* CSV parsing: `O(n)`
* Identity validation: `O(n)`
* Manager lookup: `O(n)` average time using `Map`
* Direct-report calculation: `O(n)`
* Cycle detection: `O(n)`
* Overall expected time: `O(n)`
* Space: `O(n)`

The implementation is designed to handle datasets approaching 100,000 employees without repeatedly scanning the complete employee list for manager lookups.

## Setup

### Backend

Open a terminal:

```bash
cd backend
npm install
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
```

## Run

Start the backend:

```bash
cd backend
npm start
```

The backend runs at:

```text
http://localhost:5000
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

Open the frontend URL in a browser and upload an HRIS CSV.

## API

### Health Check

```text
GET /api/health
```

Returns:

```json
{
  "success": true,
  "message": "HRIS Import Inspector API is running"
}
```

### HRIS Import

```text
POST /api/import
```

The CSV file is sent as multipart form data using the field:

```text
file
```

The API analyzes the CSV in memory and returns the validation and hierarchy results.

## Tests

The project uses Jest for automated testing.

Run:

```bash
cd backend
npm test
```

The current test suite covers:

* Duplicate employee identity validation
* Manager reference resolution
* Reporting-cycle detection
* Excluding employees that only report into a cycle

Current test result:

```text
Test Suites: 1 passed
Tests:       3 passed
```

## Assumptions and Known Limitations

* Employee IDs are case-sensitive.
* Emails are normalized to lowercase.
* Surrounding whitespace is removed from values.
* Invalid employee identity rows are excluded from manager lookup and hierarchy analysis.
* An employee with a manager reference error remains accepted but does not create a reporting relationship and is not considered a root.
* Database persistence is intentionally not implemented because it is not required for this exercise.
* Authentication is outside the scope of the exercise.
* Production deployment is outside the scope of the exercise.
* The frontend uses a simple React interface because the focus is on correctness of the import analysis rather than elaborate UI design.
* The current automated test suite focuses on the core business rules; additional malformed-CSV and edge-case tests could be added with more time.

## Sample Input

The application is designed to work with the supplied Diversio HRIS sample CSV and the HRIS format specified in the exercise.

It also handles edge cases such as:

* Duplicate employee IDs
* Duplicate emails
* Missing employee identity
* Missing managers
* Manager references by ID
* Manager references by email
* Conflicting manager references
* Self-management
* Reporting cycles
* Employees reporting into cycles without being part of the cycle
* Quoted CSV values containing commas
* UTF-8 BOM

## Database Decision

No database is used in this implementation.

The assignment explicitly states that persistence is not required, so the application performs the complete analysis in memory.

This keeps the implementation focused on the required import-preview and validation workflow.

If persistence were required later, the analyzed employee and relationship data could be stored in MongoDB or another database without changing the core validation and hierarchy algorithms.

## AI Usage

AI tools were used as a development aid for:

* Understanding the assignment requirements
* Exploring implementation approaches
* Structuring the Node.js/Express application
* Reviewing edge cases
* Understanding and testing the reporting-cycle algorithm

Generated suggestions were reviewed and tested rather than being used blindly.

In particular, the manager-resolution and cycle-detection logic was tested against custom cases to verify that:

* Invalid manager references do not create relationships.
* Conflicting manager references are reported.
* Only employees actually participating in a cycle are reported as cyclic.
* Employees merely reporting into a cycle are excluded from the cycle result.

## Future Improvements

With more time, I would:

* Add more automated tests for malformed CSV input.
* Add more manager-reference edge-case tests.
* Improve the visual presentation of the hierarchy.
* Add a larger performance test dataset approaching 100,000 employees.
* Add pagination or virtualization for very large result tables.
* Add optional database persistence if the application requirements expand.
* Add production deployment configuration.

