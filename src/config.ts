export const config = {
  ollama: {
    apiUrl: "https://api.ollama.ai",
    localUrl: "http://localhost:11434/api", // URL for the local Ollama server
    useLocal: true, // Set to true to use the local server
    apiKey: "your-ollama-api-key", // Replace with your Ollama API key
  },
  moodle: {
    baseUrl: "http://localhost:8080", // Replace with your Moodle base URL
    token: "1c37bcdd46b40749639659fb7184ef67", // Replace with your Moodle token
  },
};
