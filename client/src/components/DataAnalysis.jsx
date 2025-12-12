import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useMutation } from "@tanstack/react-query";
import { analyzeCsv } from "../api/chat";
import "./DataAnalysis.css";

const DataAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [analysis, setAnalysis] = useState("");

  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: analyzeCsv,
    onSuccess: (data) => {
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || "Failed to analyze CSV");
      }
    },
    onError: (err) => {
      console.error("Error:", err);
      setError(err.message || "Failed to connect to server. Please try again.");
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        setError("Please upload a valid CSV file");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB");
        return;
      }

      setSelectedFile(file);
      setError("");
      setAnalysis("");
      mutation.reset(); // Clear previous results/errors from mutation
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile) {
      setError("Please select a CSV file first");
      return;
    }

    if (!question.trim()) {
      setError("Please enter a question about your data");
      return;
    }

    setError("");
    setAnalysis("");

    const formData = new FormData();
    formData.append("csv", selectedFile);
    formData.append("question", question);

    mutation.mutate(formData);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setQuestion("");
    setAnalysis("");
    setError("");
    mutation.reset();
  };

  const isLoading = mutation.isPending;

  return (
    <div className="data-analysis">
      <div className="analysis-container">
        <h1 className="analysis-title">AI Data Analysis</h1>
        <p className="analysis-subtitle">
          Upload your CSV and ask questions in natural language
        </p>

        <div className="upload-section">
          {!selectedFile ? (
            <label className="upload-box" htmlFor="csv-upload">
              <div className="upload-content">
                <svg
                  className="upload-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="upload-text">Click to upload CSV file</p>
                <p className="upload-hint">Maximum file size: 50MB</p>
              </div>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="file-input"
              />
            </label>
          ) : (
            <div className="file-preview-container">
              <div className="file-info">
                <svg
                  className="file-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                </svg>
                <div className="file-details">
                  <p className="file-name">{selectedFile.name}</p>
                  <p className="file-size">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button onClick={handleReset} className="reset-btn">
                Change File
              </button>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="question-section">
            <label className="section-label" htmlFor="question">
              Your Question
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your data... e.g., 'What is the average salary by department?'"
              className="question-input"
              rows={4}
            />
          </div>
        )}

        {error && (
          <div className="error-message">
            <svg className="error-icon" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || !question.trim() || isLoading}
          className={`analyze-btn ${isLoading ? "loading" : ""}`}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Analyzing Data...
            </>
          ) : (
            "Analyze Data"
          )}
        </button>

        {analysis && (
          <div className="results-section">
            <div className="analysis-result">
              <h3 className="result-title"> Analysis Results</h3>
              <div className="result-text">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(analysis)}
                className="copy-btn"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataAnalysis;
