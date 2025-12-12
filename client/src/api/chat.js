import fetchClient from "./client";

// --- AI Generation Endpoints ---

export const generateCaptionAPI = (formData) => {
  return fetchClient("/agents/generate-caption", {
    method: "POST",
    body: formData,
  });
};

export const analyzeCsv = (formData) => {
  return fetchClient("/agents/analyze-csv", {
    method: "POST",
    body: formData,
  });
};

export const generateEmail = (data) => {
  return fetchClient("/agents/generate-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

// --- Chat/Rag Endpoints ---

export const sendMessage = (message, sessionId) => {
  return fetchClient("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      sessionId,
    }),
  });
};

export const getHistory = (sessionId) => {
  return fetchClient(`/chat/history/${sessionId}`, {
    method: "GET",
  });
};
