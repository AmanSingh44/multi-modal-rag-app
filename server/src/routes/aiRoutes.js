// routes/aiRoutes.js
import express from "express";
import multer from "multer";
import {
  generateEmail,
  generateCaption,
  analyzeCSV,
} from "../controllers/aiController.js";

const router = express.Router();

// Configure multer for image uploads
const imageStorage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
      ),
      false
    );
  }
};

const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Configure multer for CSV uploads
const csvStorage = multer.memoryStorage();

const csvFilter = (req, file, cb) => {
  const allowedTypes = ["text/csv", "application/vnd.ms-excel"];

  if (
    allowedTypes.includes(file.mimetype) ||
    file.originalname.endsWith(".csv")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only CSV files are allowed."), false);
  }
};

const csvUpload = multer({
  storage: csvStorage,
  fileFilter: csvFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for CSV
  },
});

// Email generation route
router.post("/generate-email", generateEmail);

// Caption generation route
router.post("/generate-caption", imageUpload.single("image"), generateCaption);

// CSV analysis route
router.post("/analyze-csv", csvUpload.single("csv"), analyzeCSV);

export default router;
