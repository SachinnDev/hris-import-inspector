const express = require("express");
const multer = require("multer");

const { parseHRISCsv } = require("../parser/csvParser");
const { analyzeHRIS } = require("../services/hrisAnalyzer");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/import", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please upload a CSV file.",
      });
    }

    if (
      !req.file.originalname.toLowerCase().endsWith(".csv")
    ) {
      return res.status(400).json({
        error: "Only CSV files are supported.",
      });
    }

    const csvContent = req.file.buffer.toString("utf8");

    const rows = parseHRISCsv(csvContent);

    const result = analyzeHRIS(rows);

    return res.json(result);
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      error: error.message || "Unable to process the CSV file.",
    });
  }
});

module.exports = router;