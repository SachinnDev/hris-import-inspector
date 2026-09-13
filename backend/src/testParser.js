const { parseHRISCsv } = require("./parser/csvParser");
const { analyzeHRIS } = require("./services/hrisAnalyzer");

const csv = `employee_id,employee_name,email,manager_id,manager_email,department
EMP001,Sachin,sachin@gmail.com,EMP003,,Engineering
EMP002,Rahul,rahul@gmail.com,EMP001,,Engineering
EMP003,Amit,amit@gmail.com,EMP002,,Engineering
EMP004,Neha,neha@gmail.com,EMP001,,Engineering
EMP005,Ravi,ravi@gmail.com,EMP004,,Engineering
EMP006,Priya,priya@gmail.com,EMP003,,Engineering`;

const rows = parseHRISCsv(csv);

const result = analyzeHRIS(rows);

console.log(JSON.stringify(result, null, 2));