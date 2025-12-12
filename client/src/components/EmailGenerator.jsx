import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateEmail } from "../api/chat";
import "./EmailGenerator.css";

const EmailGenerator = () => {
  const [formData, setFormData] = useState({
    sender_role: "",
    receiver_role: "",
    email_purpose: "",
    email_tone: "professional",
    additional_context: "",
  });
  const [generatedEmail, setGeneratedEmail] = useState(null);

  const [error, setError] = useState("");

  const toneOptions = [
    { value: "professional", label: "Professional" },
    { value: "formal", label: "Formal" },
    { value: "casual", label: "Casual" },
    { value: "friendly", label: "Friendly" },
    { value: "polite", label: "Polite" },
    { value: "urgent", label: "Urgent" },
  ];

  // React Query Mutation
  const mutation = useMutation({
    mutationFn: generateEmail,
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedEmail(data.email);
      } else {
        setError(data.error || "Failed to generate email");
      }
    },
    onError: (err) => {
      console.error("Error:", err);
      setError(err.message || "Failed to connect to server. Please try again.");
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleGenerate = () => {
    // Validation
    if (
      !formData.sender_role ||
      !formData.receiver_role ||
      !formData.email_purpose
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setError("");
    // Trigger mutation (API call)
    mutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData({
      sender_role: "",
      receiver_role: "",
      email_purpose: "",
      email_tone: "professional",
      additional_context: "",
    });
    setGeneratedEmail(null);
    setError("");
    mutation.reset(); // Reset React Query state
  };

  const handleCopy = () => {
    const fullEmail = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.greeting}\n\n${generatedEmail.body}\n\n${generatedEmail.closing}`;
    navigator.clipboard.writeText(fullEmail);
    alert("Email copied to clipboard!");
  };

  // Helper to check loading state
  const isLoading = mutation.isPending;

  return (
    <div className="email-generator">
      <div className="email-container">
        <div className="email-header">
          <h1 className="email-title">AI Email Generator</h1>
          <p className="email-subtitle">
            Generate professional emails in seconds
          </p>
        </div>

        <div className="email-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sender_role">Your Role *</label>
              <input
                type="text"
                id="sender_role"
                name="sender_role"
                value={formData.sender_role}
                onChange={handleChange}
                placeholder="e.g., Student, Employee, Manager"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="receiver_role">Recipient Role *</label>
              <input
                type="text"
                id="receiver_role"
                name="receiver_role"
                value={formData.receiver_role}
                onChange={handleChange}
                placeholder="e.g., Professor, HR, Client"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email_purpose">Email Purpose *</label>
            <textarea
              id="email_purpose"
              name="email_purpose"
              value={formData.email_purpose}
              onChange={handleChange}
              placeholder="Describe the purpose of your email..."
              className="form-textarea"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email_tone">Email Tone *</label>
              <select
                id="email_tone"
                name="email_tone"
                value={formData.email_tone}
                onChange={handleChange}
                className="form-select"
              >
                {toneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="additional_context">Additional Context</label>
              <input
                type="text"
                id="additional_context"
                name="additional_context"
                value={formData.additional_context}
                onChange={handleChange}
                placeholder="Optional extra details..."
                className="form-input"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <svg
                className="error-icon"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className={`generate-btn ${isLoading ? "loading" : ""}`}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="btn-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Generate Email
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="reset-btn"
              disabled={isLoading}
            >
              Reset
            </button>
          </div>
        </div>

        {generatedEmail && (
          <div className="email-result">
            <div className="result-header">
              <h3>Generated Email</h3>
              <button onClick={handleCopy} className="copy-btn">
                <svg
                  className="copy-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </button>
            </div>

            <div className="email-preview">
              <div className="email-field">
                <strong>Subject:</strong> {generatedEmail.subject}
              </div>
              <div className="email-field">
                <strong>Greeting:</strong> {generatedEmail.greeting}
              </div>
              <div className="email-field email-body">
                <strong>Body:</strong>
                <p>{generatedEmail.body}</p>
              </div>
              <div className="email-field">
                <strong>Closing:</strong> {generatedEmail.closing}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailGenerator;
