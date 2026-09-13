const { parseHRISCsv } = require("../src/parser/csvParser");

describe("CSV Parser", () => {
  test("normalizes whitespace and lowercases emails", () => {
    const csv = `employee_id,employee_name,email,manager_id,manager_email,department
EMP001, Alice , ALICE@EXAMPLE.COM , , , Engineering
EMP002,Bob,bob@example.com,, ALICE@EXAMPLE.COM ,Engineering`;

    const rows = parseHRISCsv(csv);

    expect(rows[0].employee_name).toBe("Alice");
    expect(rows[0].email).toBe("alice@example.com");
    expect(rows[1].manager_email).toBe("alice@example.com");
  });

  test("supports quoted CSV values containing commas", () => {
  const csv = `employee_id,employee_name,email,manager_id,manager_email,department
EMP001,"Doe, John",john@example.com,,,Engineering`;

  const rows = parseHRISCsv(csv);

  expect(rows).toHaveLength(1);
  expect(rows[0].employee_name).toBe("Doe, John");
  expect(rows[0].email).toBe("john@example.com");
});

test("supports UTF-8 BOM", () => {
  const csv =
    "\uFEFFemployee_id,employee_name,email,manager_id,manager_email,department\n" +
    "EMP001,Alice,alice@example.com,,,Engineering";

  const rows = parseHRISCsv(csv);

  expect(rows).toHaveLength(1);
  expect(rows[0].employee_id).toBe("EMP001");
  expect(rows[0].email).toBe("alice@example.com");
});

test("rejects CSV with missing required headers", () => {
  const csv = `employee_id,employee_name,email,manager_id,wrong_header,department
EMP001,Alice,alice@example.com,,,Engineering`;

  expect(() => parseHRISCsv(csv)).toThrow(
    "Missing required column: manager_email"
  );
});

test("rejects CSV with unexpected extra headers", () => {
  const csv = `employee_id,employee_name,email,manager_id,manager_email,department,phone
EMP001,Alice,alice@example.com,,,Engineering,9999999999`;

  expect(() => parseHRISCsv(csv)).toThrow(
    "Unexpected column(s): phone"
  );
});

test("rejects CSV with duplicate headers", () => {
  const csv = `employee_id,employee_name,email,email,manager_id,manager_email,department
EMP001,Alice,alice@example.com,alice2@example.com,,,Engineering`;

  expect(() => parseHRISCsv(csv)).toThrow(
    "Duplicate column(s): email"
  );
});

test("rejects an empty CSV", () => {
  expect(() => parseHRISCsv("")).toThrow(
    "CSV file is empty."
  );
});

test("rejects malformed CSV", () => {
  const csv = `employee_id,employee_name,email,manager_id,manager_email,department
EMP001,"Alice,alice@example.com,,,Engineering`;

  expect(() => parseHRISCsv(csv)).toThrow();
});

test("rejects invalid UTF-8 CSV", () => {
  const invalidUtf8 = Buffer.from([
    0xff,
    0xfe,
    0xfa,
  ]);

  expect(() => parseHRISCsv(invalidUtf8)).toThrow();
});
});