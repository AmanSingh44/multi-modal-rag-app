import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useMutation } from "@tanstack/react-query";
import { generateCaptionAPI } from "../api/chat";
import "./CaptionGenerator.css";

const CaptionGenerator = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState("");

  const [error, setError] = useState("");

  // React Query Mutation
  const mutation = useMutation({
    mutationFn: generateCaptionAPI,
    onSuccess: (data) => {
      if (data.success) {
        setCaption(data.caption);
      } else {
        setError(data.error || "Failed to generate caption");
      }
    },
    onError: (err) => {
      console.error("Error:", err);
      setError(err.message || "Failed to connect to server. Please try again.");
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a valid image file (JPEG, JPG or PNG)");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setSelectedImage(file);
      setError("");
      setCaption("");
      mutation.reset(); // Clear previous API state

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateCaption = () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    setError("");
    setCaption("");

    const formData = new FormData();
    formData.append("image", selectedImage);

    // Trigger the mutation instead of fetch
    mutation.mutate(formData);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCaption("");
    setError("");
    mutation.reset();
  };

  // Helper to check loading state
  const isLoading = mutation.isPending;

  return (
    <div className="caption-generator">
      <div className="caption-container">
        <h1 className="caption-title">AI Caption Generator</h1>
        <p className="caption-subtitle">
          Upload an image and let AI create the perfect caption
        </p>

        <div className="upload-section">
          {!imagePreview ? (
            <label className="upload-box" htmlFor="image-upload">
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="upload-text">Click to upload or drag and drop</p>
                <p className="upload-hint">PNG, JPG, WebP, GIF (max 10MB)</p>
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
            </label>
          ) : (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button onClick={handleReset} className="reset-btn">
                Change Image
              </button>
            </div>
          )}
        </div>

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
          onClick={handleGenerateCaption}
          disabled={!selectedImage || isLoading}
          className={`generate-btn ${isLoading ? "loading" : ""}`}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Generating...
            </>
          ) : (
            "Generate Caption"
          )}
        </button>

        {caption && (
          <div className="caption-result">
            <h3 className="result-title">Generated Caption:</h3>

            <div className="result-text">
              <ReactMarkdown>{caption}</ReactMarkdown>
            </div>

            <button
              onClick={() => navigator.clipboard.writeText(caption)}
              className="copy-btn"
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptionGenerator;
