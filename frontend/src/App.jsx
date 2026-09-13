import { useState } from "react";
import "./App.css";

function Metric({ label, value, note }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </div>
  );
}

function OverviewItem({ label, value, description }) {
  return (
    <div className="overview-item">
      <div className="overview-label">{label}</div>
      <div className="overview-value">{value}</div>
      <div className="overview-description">{description}</div>
    </div>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    setFile(selectedFile || null);
    setResult(null);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please choose a CSV file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to process the CSV file.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptedCount = result?.acceptedEmployees?.length || 0;
  const validationIssueCount =
    (result?.invalidRows?.length || 0) +
    (result?.managerErrors?.length || 0);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <a href="#" className="brand">
            <span className="brand-mark">H</span>
            <span>HRIS Import Inspector</span>
          </a>

          <div className="nav-links">
            <a href="#results">Analysis</a>
            <a href="#upload">Import CSV</a>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-eyebrow">HRIS DATA QUALITY</div>

          <h1>
            Inspect your HRIS import
            <span> before it reaches production.</span>
          </h1>

          <p>
            Upload an employee CSV and preview identity validation,
            manager relationships, reporting roots, and reporting cycles.
          </p>
        </section>

        <section className="upload-section" id="upload">
          <div className="upload-card">
            <div className="upload-card-header">
              <div>
                <div className="section-eyebrow">STEP 01</div>
                <h2>Upload employee data</h2>
                <p>
                  Select an HRIS CSV file to validate and analyze its
                  reporting structure.
                </p>
              </div>

              <div className="upload-icon">↑</div>
            </div>

            <label className="file-drop">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
              />

              <div className="file-icon">CSV</div>

              <div className="file-content">
                <strong>
                  {file ? file.name : "Choose a CSV file"}
                </strong>

                <span>
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB selected`
                    : "employee_id, employee_name, email, manager_id..."}
                </span>
              </div>

              <span className="browse-button">Browse</span>
            </label>

            <div className="upload-actions">
              <div className="upload-hint">
                No database writes · Analysis happens in memory
              </div>

              <button
                className="analyze-button"
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? "Analyzing..." : "Analyze import →"}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <section className="error-section">
            <div className="error-card">
              <div className="error-icon">!</div>
              <div>
                <strong>Unable to analyze file</strong>
                <p>{error}</p>
              </div>
            </div>
          </section>
        )}

        {result && (
          <section className="results-section" id="results">
            <div className="results-header">
              <div>
                <div className="section-eyebrow">STEP 02</div>
                <h2>Import analysis</h2>
              </div>

              <div className="preview-badge">
                <span></span>
                Preview · No data persisted
              </div>
            </div>

            <div className="metrics-grid">
              <Metric
                label="Source rows"
                value={result.totalSourceRows}
                note="Rows read from the uploaded CSV"
              />

              <Metric
                label="Accepted employees"
                value={acceptedCount}
                note="Employees available for hierarchy analysis"
              />

              <Metric
                label="Validation issues"
                value={validationIssueCount}
                note="Identity and manager validation issues"
              />
            </div>

            <div className="section-heading">
              <div>
                <div className="section-eyebrow">ORGANIZATION</div>
                <h3>Organization overview</h3>
              </div>
            </div>

            <div className="overview-grid">
              <OverviewItem
                label="Managers"
                value={result.managers?.length || 0}
                description="Employees with at least one direct report"
              />

              <OverviewItem
                label="Root employees"
                value={result.roots?.length || 0}
                description="Employees with no manager relationship"
              />

              <OverviewItem
                label="Reporting cycles"
                value={result.cycles?.length ? 1 : 0}
                description="Circular reporting structures detected"
              />
            </div>

            <section className="data-section">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">VALIDATION</div>
                  <h3>Validation issues</h3>
                </div>

                <span className="count-badge">
                  {validationIssueCount}
                </span>
              </div>

              {validationIssueCount === 0 ? (
                <div className="empty-state">
                  <span>✓</span>
                  No validation issues found.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Source row</th>
                        <th>Employee ID</th>
                        <th>Email</th>
                        <th>Issues</th>
                      </tr>
                    </thead>

                    <tbody>
                      {result.invalidRows?.map((row) => (
                        <tr key={`identity-${row.sourceRow}`}>
                          <td>
                            <span className="row-number">
                              {row.sourceRow}
                            </span>
                          </td>

                          <td>{row.employeeId || "—"}</td>

                          <td>{row.email || "—"}</td>

                          <td>
                            {row.errors.map((issue, index) => (
                              <span className="issue-pill" key={index}>
                                {issue}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}

                      {result.managerErrors?.map((row) => (
                        <tr key={`manager-${row.sourceRow}`}>
                          <td>
                            <span className="row-number">
                              {row.sourceRow}
                            </span>
                          </td>

                          <td>{row.employeeId}</td>

                          <td>—</td>

                          <td>
                            {row.errors.map((issue, index) => (
                              <span className="issue-pill" key={index}>
                                {issue}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="data-section">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">HIERARCHY</div>
                  <h3>Root employees</h3>
                </div>

                <span className="count-badge">
                  {result.roots?.length || 0}
                </span>
              </div>

              {result.roots?.length === 0 ? (
                <div className="empty-state">
                  No root employees found.
                </div>
              ) : (
                <div className="employee-grid">
                  {result.roots.map((employee) => (
                    <div
                      className="employee-card"
                      key={employee.employee_id}
                    >
                      <div className="avatar">
                        {employee.employee_name
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>{employee.employee_name}</strong>
                        <span>{employee.employee_id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="data-section">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">MANAGEMENT</div>
                  <h3>Managers & direct reports</h3>
                </div>

                <span className="count-badge">
                  {result.managers?.length || 0}
                </span>
              </div>

              {result.managers?.length === 0 ? (
                <div className="empty-state">
                  No manager relationships found.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Manager</th>
                        <th>Employee ID</th>
                        <th>Direct reports</th>
                      </tr>
                    </thead>

                    <tbody>
                      {result.managers.map((manager) => (
                        <tr key={manager.employeeId}>
                          <td>
                            <div className="manager-name">
                              <span className="small-avatar">
                                {manager.employeeName
                                  ?.charAt(0)
                                  .toUpperCase()}
                              </span>

                              {manager.employeeName}
                            </div>
                          </td>

                          <td>{manager.employeeId}</td>

                          <td>
                            <span className="report-count">
                              {manager.directReportCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="data-section">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">GRAPH ANALYSIS</div>
                  <h3>Reporting cycles</h3>
                </div>

                <span className="count-badge">
                  {result.cycles?.length ? 1 : 0}
                </span>
              </div>

              {result.cycles?.length === 0 ? (
                <div className="empty-state success">
                  <span>✓</span>
                  No reporting cycles detected.
                </div>
              ) : (
                <div className="cycle-card">
                  <div className="cycle-header">
                    <div>
                      <span className="cycle-label">CYCLE 01</span>
                      <h4>Employees participating in a cycle</h4>
                    </div>

                    <span className="cycle-warning">Circular</span>
                  </div>

                  <div className="cycle-members">
                    {result.cycles.map((employee, index) => (
                      <div
                        className="cycle-member-wrapper"
                        key={employee.employee_id}
                      >
                        <div className="cycle-member">
                          <span className="cycle-avatar">
                            {employee.employee_name
                              ?.charAt(0)
                              .toUpperCase()}
                          </span>

                          <div>
                            <strong>{employee.employee_name}</strong>
                            <span>{employee.employee_id}</span>
                          </div>
                        </div>

                        {index < result.cycles.length - 1 && (
                          <span className="cycle-arrow">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="data-section">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">ACCEPTED DATA</div>
                  <h3>Accepted employees</h3>
                </div>

                <span className="count-badge">
                  {acceptedCount}
                </span>
              </div>

              {acceptedCount === 0 ? (
                <div className="empty-state">
                  No employees were accepted for analysis.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Source row</th>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Manager ID</th>
                        <th>Department</th>
                      </tr>
                    </thead>

                    <tbody>
                      {result.acceptedEmployees.map((employee) => (
                        <tr key={employee.sourceRow}>
                          <td>
                            <span className="row-number">
                              {employee.sourceRow}
                            </span>
                          </td>

                          <td>{employee.employee_id}</td>

                          <td>{employee.employee_name}</td>

                          <td>{employee.email}</td>

                          <td>{employee.manager_id || "—"}</td>

                          <td>
                            <span className="department">
                              {employee.department || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </section>
        )}
      </main>

      <footer>
        <div>
          <strong>HRIS Import Inspector</strong>
          <span>Preview only · No persistence</span>
        </div>

        <span>Built with React + Node.js</span>
      </footer>
    </div>
  );
}

export default App;