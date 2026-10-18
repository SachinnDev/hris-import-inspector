const express = require("express");
const cors = require("cors");

const importRoutes = require("./routes/importRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "HRIS Import Inspector API is running",
  });
});

app.use("/api", importRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});