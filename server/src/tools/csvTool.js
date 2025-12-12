// tool for analyzing csv files
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import Papa from "papaparse";

export const csvAnalysisTool = tool(
  async ({ csv_data_summary, question }) => {
    return `Analyze the CSV data to answer: ${question}

Data Summary:
${csv_data_summary}

Provide a detailed, accurate analysis with specific numbers and insights.`;
  },
  {
    name: "csv_analyzer",
    description:
      "Analyzes CSV data to answer questions accurately with real calculations",
    schema: z.object({
      csv_data_summary: z
        .string()
        .describe("Summary of the CSV data structure and sample"),
      question: z.string().describe("Question to answer about the data"),
    }),
  }
);

// Helper function to parse CSV from buffer
export const parseCSV = (csvBuffer) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvBuffer.toString("utf8"), {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(
            new Error(`CSV parsing errors: ${JSON.stringify(results.errors)}`)
          );
        } else {
          resolve(results.data);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};
