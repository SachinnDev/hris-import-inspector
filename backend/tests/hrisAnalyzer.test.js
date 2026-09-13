const {
  validateEmployeeIdentities,
  resolveManagers,
  findReportingCycles,
  analyzeHRIS,
} = require("../src/services/hrisAnalyzer");

describe("HRIS Analyzer", () => {
  test("invalidates all rows with duplicate employee IDs", () => {
    const rows = [
      {
        employee_id: "EMP001",
        employee_name: "Alice",
        email: "alice@example.com",
        manager_id: "",
        manager_email: "",
        department: "Engineering",
      },
      {
        employee_id: "EMP001",
        employee_name: "Bob",
        email: "bob@example.com",
        manager_id: "",
        manager_email: "",
        department: "Engineering",
      },
      {
        employee_id: "EMP002",
        employee_name: "Charlie",
        email: "charlie@example.com",
        manager_id: "",
        manager_email: "",
        department: "HR",
      },
    ];

    const result = validateEmployeeIdentities(rows);

    expect(result.invalidRows).toHaveLength(2);
    expect(result.invalidRows[0].errors).toContain(
      "duplicate employee_id"
    );
    expect(result.invalidRows[1].errors).toContain(
      "duplicate employee_id"
    );

    expect(result.acceptedEmployees).toHaveLength(1);
    expect(result.acceptedEmployees[0].employee_id).toBe("EMP002");
  });

  test("resolves manager references correctly", () => {
    const employees = [
      {
        employee_id: "EMP001",
        employee_name: "Alice",
        email: "alice@example.com",
        manager_id: "",
        manager_email: "",
        department: "Engineering",
        sourceRow: 2,
      },
      {
        employee_id: "EMP002",
        employee_name: "Bob",
        email: "bob@example.com",
        manager_id: "EMP001",
        manager_email: "",
        department: "Engineering",
        sourceRow: 3,
      },
      {
        employee_id: "EMP003",
        employee_name: "Charlie",
        email: "charlie@example.com",
        manager_id: "",
        manager_email: "alice@example.com",
        department: "Engineering",
        sourceRow: 4,
      },
    ];

    const result = resolveManagers(employees);

    expect(result.roots).toHaveLength(1);
    expect(result.roots[0].employee_id).toBe("EMP001");

    expect(result.relationships).toHaveLength(2);

    expect(result.managerErrors).toHaveLength(0);
  });

  test("detects only employees that are actually part of a cycle", () => {
    const employees = [
      {
        employee_id: "EMP001",
        employee_name: "Alice",
        email: "alice@example.com",
      },
      {
        employee_id: "EMP002",
        employee_name: "Bob",
        email: "bob@example.com",
      },
      {
        employee_id: "EMP003",
        employee_name: "Charlie",
        email: "charlie@example.com",
      },
      {
        employee_id: "EMP004",
        employee_name: "David",
        email: "david@example.com",
      },
    ];

    const relationships = [
      {
        managerId: "EMP002",
        employeeId: "EMP001",
      },
      {
        managerId: "EMP003",
        employeeId: "EMP002",
      },
      {
        managerId: "EMP001",
        employeeId: "EMP003",
      },
      {
        managerId: "EMP001",
        employeeId: "EMP004",
      },
    ];

    const cycles = findReportingCycles(
      employees,
      relationships
    );

    const cycleIds = cycles.map(
      (employee) => employee.employee_id
    );

    expect(cycleIds).toEqual(
      expect.arrayContaining([
        "EMP001",
        "EMP002",
        "EMP003",
      ])
    );

    expect(cycleIds).not.toContain("EMP004");
  });

 test("calculates direct report counts correctly", () => {
  const rows = [
    {
      employee_id: "EMP001",
      employee_name: "Alice",
      email: "alice@example.com",
      manager_id: "",
      manager_email: "",
      department: "Engineering",
    },
    {
      employee_id: "EMP002",
      employee_name: "Bob",
      email: "bob@example.com",
      manager_id: "EMP001",
      manager_email: "",
      department: "Engineering",
    },
    {
      employee_id: "EMP003",
      employee_name: "Charlie",
      email: "charlie@example.com",
      manager_id: "EMP001",
      manager_email: "",
      department: "Engineering",
    },
    {
      employee_id: "EMP004",
      employee_name: "David",
      email: "david@example.com",
      manager_id: "EMP002",
      manager_email: "",
      department: "Engineering",
    },
  ];

  const result = analyzeHRIS(rows);

  const alice = result.managers.find(
    (manager) => manager.employeeId === "EMP001"
  );

  const bob = result.managers.find(
    (manager) => manager.employeeId === "EMP002"
  );

  expect(alice.directReportCount).toBe(2);
  expect(bob.directReportCount).toBe(1);
});  

test("invalidates all rows with duplicate emails", () => {
  const rows = [
    {
      employee_id: "EMP001",
      employee_name: "Alice",
      email: "same@example.com",
      manager_id: "",
      manager_email: "",
      department: "Engineering",
    },
    {
      employee_id: "EMP002",
      employee_name: "Bob",
      email: "same@example.com",
      manager_id: "",
      manager_email: "",
      department: "Engineering",
    },
  ];

  const result = analyzeHRIS(rows);

  expect(result.acceptedEmployees).toHaveLength(0);
  expect(result.invalidRows).toHaveLength(2);

  expect(result.invalidRows[0].errors).toContain(
    "duplicate email"
  );

  expect(result.invalidRows[1].errors).toContain(
    "duplicate email"
  );
});

test("rejects employees with missing identity fields", () => {
  const rows = [
    {
      employee_id: "",
      employee_name: "Alice",
      email: "alice@example.com",
      manager_id: "",
      manager_email: "",
      department: "Engineering",
    },
    {
      employee_id: "EMP002",
      employee_name: "Bob",
      email: "",
      manager_id: "",
      manager_email: "",
      department: "Engineering",
    },
  ];

  const result = analyzeHRIS(rows);

  expect(result.acceptedEmployees).toHaveLength(0);
  expect(result.invalidRows).toHaveLength(2);

  expect(result.invalidRows[0].errors).toContain(
    "employee_id is required"
  );

  expect(result.invalidRows[1].errors).toContain(
    "email is required"
  );
});
test("excludes duplicate identity rows from hierarchy analysis", () => {
  const rows = [
    {
      employee_id: "EMP001",
      employee_name: "Alice",
      email: "alice@example.com",
      manager_id: "",
      manager_email: "",
      department: "Engineering",
    },
    {
      employee_id: "EMP001",
      employee_name: "Alice Duplicate",
      email: "alice2@example.com",
      manager_id: "",
      manager_email: "",
      department: "Engineering",
    },
    {
      employee_id: "EMP002",
      employee_name: "Bob",
      email: "bob@example.com",
      manager_id: "EMP001",
      manager_email: "",
      department: "Engineering",
    },
  ];

  const result = analyzeHRIS(rows);

  expect(result.acceptedEmployees).toHaveLength(1);
  expect(result.acceptedEmployees[0].employee_id).toBe("EMP002");

  expect(result.invalidRows).toHaveLength(2);

  // Bob's invalid manager reference should not
  // create a relationship because EMP001 was invalid.
  expect(result.relationships).toHaveLength(0);

  // Bob has a manager error, so he should not become a root.
  expect(result.roots).toHaveLength(0);
});

test("resolves manager by employee ID", () => {
  const rows = [
    {
      employee_id: "EMP001",
      employee_name: "Alice",
      email: "alice@example.com",
      manager_id: "",
      manager_email: "",
      department: "Engineering",
    },
    {
      employee_id: "EMP002",
      employee_name: "Bob",
      email: "bob@example.com",
      manager_id: "EMP001",
      manager_email: "",
      department: "Engineering",
    },
  ];

  const result = analyzeHRIS(rows);

  expect(result.relationships).toEqual([
    {
      managerId: "EMP001",
      employeeId: "EMP002",
    },
  ]);

  expect(result.roots.map((employee) => employee.employee_id)).toEqual([
    "EMP001",
  ]);

  expect(result.managerErrors).toHaveLength(0);
});

test("accepts manager ID and manager email when both refer to the same employee", () => {
  const rows = [
    {
      employee_id: "EMP001",
      employee_name: "Alice",
      email: "alice@example.com",
      manager_id: "",
      manager_email: "",
      department: "Engineering",
    },
    {
      employee_id: "EMP002",
      employee_name: "Bob",
      email: "bob@example.com",
      manager_id: "EMP001",
      manager_email: "alice@example.com",
      department: "Engineering",
    },
  ];

  const result = analyzeHRIS(rows);

  expect(result.relationships).toEqual([
    {
      managerId: "EMP001",
      employeeId: "EMP002",
    },
  ]);

  expect(result.managerErrors).toHaveLength(0);
});

test("rejects conflicting manager ID and manager email", () => {
  const rows = [
    {
      employee_id: "EMP001",
      employee_name: "Alice",
      email: "alice@example.com",
      manager_id: "",
      manager_email: "",
      department: "Engineering",
    },
    {
      employee_id: "EMP002",
      employee_name: "Bob",
      email: "bob@example.com",
      manager_id: "",
      manager_email: "",
      department: "Engineering",
    },
    {
      employee_id: "EMP003",
      employee_name: "Charlie",
      email: "charlie@example.com",
      manager_id: "EMP001",
      manager_email: "bob@example.com",
      department: "Engineering",
    },
  ];

  const result = analyzeHRIS(rows);

  expect(result.relationships).toHaveLength(0);
  expect(result.managerErrors).toHaveLength(1);

  expect(result.managerErrors[0].errors).toContain(
    "manager_id and manager_email refer to different employees"
  );
});
test("rejects self-management", () => {
  const rows = [
    {
      employee_id: "EMP001",
      employee_name: "Alice",
      email: "alice@example.com",
      manager_id: "EMP001",
      manager_email: "",
      department: "Engineering",
    },
  ];

  const result = analyzeHRIS(rows);

  expect(result.relationships).toHaveLength(0);
  expect(result.roots).toHaveLength(0);
  expect(result.managerErrors).toHaveLength(1);

  expect(result.managerErrors[0].errors).toContain(
    "employee cannot be their own manager"
  );
});
test("employee with manager error does not become a root", () => {
  const rows = [
    {
      employee_id: "EMP001",
      employee_name: "Alice",
      email: "alice@example.com",
      manager_id: "EMP999",
      manager_email: "",
      department: "Engineering",
    },
  ];

  const result = analyzeHRIS(rows);

  expect(result.relationships).toHaveLength(0);
  expect(result.managerErrors).toHaveLength(1);
  expect(result.roots).toHaveLength(0);
});
});
