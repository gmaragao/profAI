# ProfAI - Professor Virtual Assistant

ProfAI is an intelligent assistant that helps professors manage their online courses by automatically responding to student queries, monitoring student activity, and taking proactive actions when necessary.
This project was done as the final project of a Computer Engineering (Engenharia Informática) course from Universidade Aberta.
The project aims to help professors in order to improve their work, by reducing the amount of repeated or "easy tasks", allowing them to focus on more impactful tasks.

## Project Overview

This system uses AI to:

- Analyze forum posts
- Classify intents
- Retrieve relevant course knowledge to generate accurate responses
- Proactively monitor student engagement and take appropriate actions
- Interface with Moodle LMS to post responses

## Requirements

- Node.js (v18+)
- Docker & Docker Compose
- MongoDB
- Ollama (for LLM inference)
- Moodle instance (local or remote)

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/gmaragao/profAI.git
cd profAI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the project root with the following variables:

```properties
DATABASE_URL="mongodb://root:prisma@localhost:27017/profai?authSource=admin&retryWrites=true&w=majority"
PRISMA_CLIENT_OUTPUT=./generated/prisma
OLLAMA_API_URL=http://localhost:11434/api
MOODLE_BASE_URL=http://localhost:8080/webservice/rest/server.php

## USER CONFIGURATION
MOODLE_TOKEN=your_moodle_token_here
COURSE_ID=your_course_id_here
CRON_FREQUENCY_MINUTES="1" # Default: Every 1 minute
```

### 4. Start the databases

Navigate to the database directory:

```bash
cd src/database
```

Run:

```bash
docker-compose up -d
```

```bash
cd src/RAG/qdrant
```

Run:

```bash
docker-compose up -d
```

### 5. Run Prisma migration

Go to:

```bash
cd src/prisma
```

Run:

```bash
npx prisma generate
```

### 6. Setup Ollama

Install Ollama from [ollama.ai](https://ollama.ai/) and pull the required model:

```bash
ollama pull llama3-groq-tool-use
ollama pull gemma3:4b
```

### 7. Configure Moodle

1. Set up a Moodle instance (you can use the provided Docker setup or connect to an existing instance)
2. Enable the Web Services API in Moodle
3. Create a token with the necessary permissions
4. Update the `.env` file with your Moodle token and course ID

### 8. Add course materials

Place your course materials in the appropriate directory structure.

```
/src/KnowledgeBase/
```

The files must have the prefixes:

1. subject_knowledge
2. subject_metadata

For development mode:

```bash
npm run dev
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific tests
npm test -- src/ProfessorAgent/tools.test.ts

# Run with coverage report
npm test -- --coverage
```
