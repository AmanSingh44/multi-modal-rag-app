// controllers/aiController.js
import {
  executeEmailAgent,
  executeCaptionAgent,
  executeCSVAgent,
} from "../services/agentService.js";
import { parseCSV } from "../tools/csvTool.js";

export const generateEmail = async (req, res) => {
  try {
    const {
      sender_role,
      receiver_role,
      email_purpose,
      email_tone = "professional",
      additional_context = "",
    } = req.body;

    // Validation
    if (!sender_role || !receiver_role || !email_purpose) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: sender_role, receiver_role, and email_purpose",
      });
    }

    // Execute agent
    const result = await executeEmailAgent({
      sender_role,
      receiver_role,
      email_purpose,
      email_tone,
      additional_context,
    });

    res.status(200).json({
      success: true,
      email: result.email,
      full_email: result.full_email,
      metadata: {
        sender_role,
        receiver_role,
        email_purpose,
        email_tone,
      },
    });
  } catch (error) {
    console.error("Error generating email:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate email",
      details: error.message,
    });
  }
};

export const generateCaption = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    // Validate caption style if provided
    const caption_style = req.body.caption_style || "concise";
    const validStyles = ["concise", "descriptive", "creative", "professional"];

    if (!validStyles.includes(caption_style)) {
      return res.status(400).json({
        success: false,
        error: `Invalid caption_style. Must be one of: ${validStyles.join(
          ", "
        )}`,
      });
    }

    // Convert buffer to base64
    const base64Img = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    // Execute agent
    const result = await executeCaptionAgent({
      imageContent: base64Img,
      mimeType,
      caption_style,
    });

    res.status(200).json({
      success: true,
      caption: result.caption,
      metadata: {
        filename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        caption_style,
      },
    });
  } catch (error) {
    console.error("Error generating caption:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate caption",
      details: error.message,
    });
  }
};

export const analyzeCSV = async (req, res) => {
  try {
    console.log("File:", req.file);
    console.log("Body:", req.body);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No CSV file provided",
        details: "Please upload a CSV file using the 'csv' field name",
        received: {
          hasFile: !!req.file,
          bodyKeys: Object.keys(req.body),
          contentType: req.headers["content-type"],
        },
      });
    }

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: "Question is required for CSV analysis",
      });
    }

    // Parse CSV
    const csvData = await parseCSV(req.file.buffer);

    if (!csvData || csvData.length === 0) {
      return res.status(400).json({
        success: false,
        error: "CSV file is empty or could not be parsed",
      });
    }

    // Execute agent
    const result = await executeCSVAgent({
      csvData,
      question,
    });

    console.log(result.usage_metadata);

    res.status(200).json({
      success: true,
      analysis: result.analysis,
      data_summary: result.data_summary,
      metadata: {
        filename: req.file.originalname,
        size: req.file.size,
        question,
      },
    });
  } catch (error) {
    console.error("Error analyzing CSV:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze CSV",
      details: error.message,
    });
  }
};
