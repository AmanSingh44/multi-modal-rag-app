# Multi-Modal RAG App

A full-stack Multi-Modal Retrieval-Augmented Generation (RAG) system with AI agents, built using LangChain JS and Google Gemini 2.5 Flash. Features intelligent chatbot with document knowledge base (PDF, CSV, JSON), automated email generation, image caption creation, and advanced CSV data analysis.
##  Features & Functionalities

**Multi-Modal RAG System**

- PDF, CSV, and JSON document ingestion
- Weaviate vector database for semantic search
- Cosine similarity K-nearest neighbors retrieval
- Query enhancement and re-ranking
- Dynamic model and system-prompt selection
- Hallucination prevention through context-based prompting

**AI Agent Tools**

- **Email Generator** – Professional email composition with customizable tone
- **Image Caption Generator** – AI-powered image analysis and caption creation
- **CSV Data Analyzer** – Natural language data analysis with caching


**Frontend Interface**

- React-based responsive UI
- File upload with drag-and-drop
- Markdown-formatted responses
- Copy-to-clipboard functionality

##  Tech Stack

**Frontend:** React.js, Vanilla CSS

**Backend:** Node.js, Express.js, LangChain.js

**AI/ML:** Google Gemini 2.5 Flash API, LangChain Agents

**Vector Database:** Weaviate

**File Processing:** Multer, PapaParse, PDF-Parse

##  Run Locally

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

**Prerequisites**

- Node.js and NPM installed
- Docker (for Weaviate vector database)

Clone the project
```bash
git clone https://github.com/AmanSingh44/multi-modal-rag-app.git
```

Go to the project directory
```bash
cd multi-modal-rag-app
```

**Start Weaviate Vector Database**

Start Weaviate using Docker
```bash
docker run -d \
  -p 8080:8080 \
  -p 50051:50051 \
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
  -e PERSISTENCE_DATA_PATH=/var/lib/weaviate \
  cr.weaviate.io/semitechnologies/weaviate:latest
```

**Backend Setup**

Go to server folder
```bash
cd server
```

Install dependencies
```bash
npm install
```

Create a `.env` file and add the following
```bash
GOOGLE_API_KEY=your_google_api_key
WEAVIATE_URL=http://localhost:8080
WEAVIATE_CLASS_NAME=your_document_name
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8080
WEAVIATE_GRPC_PORT=50051
LLM_MODEL_NAME=your_llm_model_name
FAST_LLM_MODEL_NAME=your_faster_model_name
EMBEDDING_MODEL_NAME=choose_your_embedding_model
JINA_API_KEY=your_jina_api_key
JINA_URL=https://api.jina.ai/v1/rerank
JINA_MODEL_NAME=your_jina_model_name
PORT=your_port_number
FRONTEND_ORIGIN=your_frontend_url
```

Start the server
```bash
npm start
```

**Frontend Setup**

Go to client folder
```bash
cd ../client
```

Install dependencies
```bash
npm install
```

Start the development server
```bash
npm run dev
```

Access the web app at http://localhost:5173
## Screenshots

### RAG workflow 
The type of query is identified and it is processed based on its type.
![App Screenshots](https://github.com/AmanSingh44/multi-modal-rag-app/blob/main/docs/images/workflow.png?raw=true)

### Query and Result Interface
![Query Interface](https://github.com/AmanSingh44/multi-modal-rag-app/blob/main/docs/images/Screenshot%20(1128).png?raw=true)

![Query Interface](https://github.com/AmanSingh44/multi-modal-rag-app/blob/main/docs/images/Screenshot%20(1129).png?raw=true)

![Query Interface](https://github.com/AmanSingh44/multi-modal-rag-app/blob/main/docs/images/Screenshot%20(1130).png?raw=true)

### AI Agent Tools UI

![Query Interface](https://github.com/AmanSingh44/multi-modal-rag-app/blob/main/docs/images/Screenshot%20(1131).png?raw=true)
![Query Interface](https://github.com/AmanSingh44/multi-modal-rag-app/blob/main/docs/images/Screenshot%20(1132).png?raw=true)
![Query Interface](https://github.com/AmanSingh44/multi-modal-rag-app/blob/main/docs/images/Screenshot%20(1133).png?raw=true)

