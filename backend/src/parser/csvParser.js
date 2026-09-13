const { parse } = require("csv-parse/sync");

const REQUIRED_HEADERS = [
  "employee_id",
  "employee_name",
  "email",
  "manager_id",
  "manager_email",
  "department",
];

function normalizeValue(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeValue(value).toLowerCase();
}

function parseHRISCsv(csvContent) {
  if (!csvContent || csvContent.trim() === "") {
    throw new Error("CSV file is empty.");
  }

  // Parse once without converting rows into objects.
  // This lets us inspect the original header row,
  // including duplicate headers.
  const records = parse(csvContent, {
    bom: true,
    skip_empty_lines: true,
    trim: false,
  });

  if (records.length === 0) {
    throw new Error("CSV file is empty.");
  }

  const headers = records[0].map((header) =>
    normalizeValue(header)
  );

  const normalizedHeaders = headers.map((header) =>
    header.toLowerCase()
  );

  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !normalizedHeaders.includes(header)
  );

  const extraHeaders = normalizedHeaders.filter(
    (header) => !REQUIRED_HEADERS.includes(header)
  );

  const duplicateHeaders = normalizedHeaders.filter(
    (header, index) =>
      normalizedHeaders.indexOf(header) !== index
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required column: ${missingHeaders.join(", ")}`
    );
  }

  if (extraHeaders.length > 0) {
    throw new Error(
      `Unexpected column(s): ${[
        ...new Set(extraHeaders),
      ].join(", ")}`
    );
  }

  if (duplicateHeaders.length > 0) {
    throw new Error(
      `Duplicate column(s): ${[
        ...new Set(duplicateHeaders),
      ].join(", ")}`
    );
  }

  const dataRows = records.slice(1);

  return dataRows.map((values) => {
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return {
      employee_id: normalizeValue(row.employee_id),
      employee_name: normalizeValue(row.employee_name),
      email: normalizeEmail(row.email),
      manager_id: normalizeValue(row.manager_id),
      manager_email: normalizeEmail(row.manager_email),
      department: normalizeValue(row.department),
    };
  });
}

module.exports = {
  parseHRISCsv,
};