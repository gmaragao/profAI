# LLM Agent for Moodle

This project implements an LLM agent that connects to the Ollama API and retrieves course information from a local Moodle instance.

## Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update the `config.ts` file with your Ollama API key and Moodle token.

## Run the Agent

To execute the agent, run:

```bash
npm start
```

For development with automatic restarts, use:

```bash
npm run dev
```

To build the project, run:

```bash
npm run build
```

## Dependencies

- `axios`: For HTTP requests.
- `typescript`: For type safety.
- `ts-node`: To run TypeScript files directly.
- `ts-node-dev`: For development with automatic restarts.

## Notes

Ensure that your Moodle instance is running locally and the web services are enabled.
