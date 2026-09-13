function validateEmployeeIdentities(rows) {
  const employeeIdCounts = new Map();
  const emailCounts = new Map();

  // First pass: count IDs and emails
  for (const row of rows) {
    if (row.employee_id) {
      employeeIdCounts.set(
        row.employee_id,
        (employeeIdCounts.get(row.employee_id) || 0) + 1
      );
    }

    if (row.email) {
      emailCounts.set(
        row.email,
        (emailCounts.get(row.email) || 0) + 1
      );
    }
  }

  const acceptedEmployees = [];
  const invalidRows = [];

  // Second pass: validate every row
  rows.forEach((row, index) => {
    const errors = [];

    if (!row.employee_id) {
      errors.push("employee_id is required");
    } else if (employeeIdCounts.get(row.employee_id) > 1) {
      errors.push("duplicate employee_id");
    }

    if (!row.email) {
      errors.push("email is required");
    } else if (emailCounts.get(row.email) > 1) {
      errors.push("duplicate email");
    }

    if (errors.length > 0) {
      invalidRows.push({
        sourceRow: index + 2,
        employeeId: row.employee_id,
        email: row.email,
        errors,
      });
    } else {
      acceptedEmployees.push({
        ...row,
        sourceRow: index + 2,
      });
    }
  });

  return {
    acceptedEmployees,
    invalidRows,
  };
}

function resolveManagers(acceptedEmployees) {
  const byId = new Map();
  const byEmail = new Map();

  for (const employee of acceptedEmployees) {
    byId.set(employee.employee_id, employee);
    byEmail.set(employee.email, employee);
  }

  const relationships = [];
  const roots = [];
  const managerErrors = [];

  for (const employee of acceptedEmployees) {
    const managerId = employee.manager_id;
    const managerEmail = employee.manager_email;

    // Both manager fields are blank -> root employee
    if (!managerId && !managerEmail) {
      roots.push(employee);
      continue;
    }

    let managerById = null;
    let managerByEmail = null;

    if (managerId) {
      managerById = byId.get(managerId);
    }

    if (managerEmail) {
      managerByEmail = byEmail.get(managerEmail);
    }

    let manager = null;

    // Only manager_id supplied
    if (managerId && !managerEmail) {
      if (!managerById) {
        managerErrors.push({
          sourceRow: employee.sourceRow,
          employeeId: employee.employee_id,
          errors: ["manager_id does not match any employee"],
        });
        continue;
      }

      manager = managerById;
    }

    // Only manager_email supplied
    if (!managerId && managerEmail) {
      if (!managerByEmail) {
        managerErrors.push({
          sourceRow: employee.sourceRow,
          employeeId: employee.employee_id,
          errors: ["manager_email does not match any employee"],
        });
        continue;
      }

      manager = managerByEmail;
    }

    // Both manager fields supplied
    if (managerId && managerEmail) {
      if (!managerById || !managerByEmail) {
        managerErrors.push({
          sourceRow: employee.sourceRow,
          employeeId: employee.employee_id,
          errors: ["manager could not be found"],
        });
        continue;
      }

      if (managerById.employee_id !== managerByEmail.employee_id) {
        managerErrors.push({
          sourceRow: employee.sourceRow,
          employeeId: employee.employee_id,
          errors: ["manager_id and manager_email refer to different employees"],
        });
        continue;
      }

      manager = managerById;
    }

    // Employee cannot manage themselves
    if (manager.employee_id === employee.employee_id) {
      managerErrors.push({
        sourceRow: employee.sourceRow,
        employeeId: employee.employee_id,
        errors: ["employee cannot be their own manager"],
      });
      continue;
    }

    relationships.push({
      managerId: manager.employee_id,
      employeeId: employee.employee_id,
    });
  }

  return {
    roots,
    relationships,
    managerErrors,
  };
}

function getManagerReportCounts(acceptedEmployees, relationships) {
  const employeesById = new Map();

  for (const employee of acceptedEmployees) {
    employeesById.set(employee.employee_id, employee);
  }

  const reportCounts = new Map();

  for (const relationship of relationships) {
    const managerId = relationship.managerId;

    reportCounts.set(
      managerId,
      (reportCounts.get(managerId) || 0) + 1
    );
  }

  const managers = [];

  for (const [managerId, count] of reportCounts) {
    const manager = employeesById.get(managerId);

    managers.push({
      employeeId: manager.employee_id,
      employeeName: manager.employee_name,
      directReportCount: count,
    });
  }

  return managers;
}

function findReportingCycles(acceptedEmployees, relationships) {
  const managerOf = new Map();

  for (const relationship of relationships) {
    managerOf.set(
      relationship.employeeId,
      relationship.managerId
    );
  }

  const state = new Map();
  const cycleEmployees = new Set();

  for (const employee of acceptedEmployees) {
    state.set(employee.employee_id, 0);
  }

  function dfs(employeeId, path, pathIndex) {
    state.set(employeeId, 1);
    path.push(employeeId);
    pathIndex.set(employeeId, path.length - 1);

    const managerId = managerOf.get(employeeId);

    if (managerId) {
      const managerState = state.get(managerId);

      if (managerState === 1) {
        const cycleStart = pathIndex.get(managerId);

        for (let i = cycleStart; i < path.length; i++) {
          cycleEmployees.add(path[i]);
        }
      } else if (managerState === 0) {
        dfs(managerId, path, pathIndex);
      }
    }

    path.pop();
    pathIndex.delete(employeeId);
    state.set(employeeId, 2);
  }

  for (const employee of acceptedEmployees) {
    if (state.get(employee.employee_id) === 0) {
      dfs(employee.employee_id, [], new Map());
    }
  }

  return acceptedEmployees.filter((employee) =>
    cycleEmployees.has(employee.employee_id)
  );
}

function analyzeHRIS(rows) {
  const identityResult = validateEmployeeIdentities(rows);

  const managerResult = resolveManagers(
    identityResult.acceptedEmployees
  );

  const managers = getManagerReportCounts(
    identityResult.acceptedEmployees,
    managerResult.relationships
  );

  const cycles = findReportingCycles(
    identityResult.acceptedEmployees,
    managerResult.relationships
  );

  return {
    totalSourceRows: rows.length,

    acceptedEmployees: identityResult.acceptedEmployees,

    invalidRows: identityResult.invalidRows,

    roots: managerResult.roots,

    managerErrors: managerResult.managerErrors,

    managers,

    cycles,

    relationships: managerResult.relationships,
  };
}
module.exports = {
   validateEmployeeIdentities,
  resolveManagers,
  getManagerReportCounts,
  findReportingCycles,
  analyzeHRIS
};