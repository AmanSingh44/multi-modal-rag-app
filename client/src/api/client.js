const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const fetchClient = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, options);

  // Check if response is JSON (to avoid crashing on empty/text responses)
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(
      data.error ||
        data.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

export default fetchClient;
