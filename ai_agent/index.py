"""
Run this ONCE to build the Qdrant vector database from the Jan Aushadhi PDF.

Usage:
    cd ai_agent
    venv\Scripts\activate
    python index.py
"""

import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from dotenv import load_dotenv

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = "khancare_memory"
PDF_PATH = "data/Pradhan Mantri Bhartiya Jan Aushadhi Pariyojna.pdf"

# ---- 1. Load PDF ----
print("📄 Loading PDF...")
loader = PyPDFLoader(PDF_PATH)
docs = loader.load()
print(f"   Pages loaded: {len(docs)}")

# ---- 2. Add metadata ----
for doc in docs:
    doc.metadata["file_source"] = "jan_aushadhi_medicine"

# ---- 3. Split into chunks ----
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=400)
chunks = splitter.split_documents(docs)
print(f"   Total chunks: {len(chunks)}")

# ---- 4. Embeddings ----
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# ---- 5. Qdrant setup ----
client = QdrantClient(url=QDRANT_URL)

# Delete old collection if exists
if client.collection_exists(COLLECTION_NAME):
    client.delete_collection(COLLECTION_NAME)
    print(f"🗑️  Old collection '{COLLECTION_NAME}' deleted.")

# Create fresh collection (1536 dims for text-embedding-3-small)
client.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
)
print(f"✅ Fresh collection '{COLLECTION_NAME}' created.")

# ---- 6. Upload documents ----
print("⬆️  Uploading chunks to Qdrant...")
QdrantVectorStore.from_documents(
    documents=chunks,
    embedding=embeddings,
    url=QDRANT_URL,
    collection_name=COLLECTION_NAME,
    force_recreate=False,   # collection already created above
)

print("🎉 Vector DB built successfully in Qdrant!")
print(f"   Collection: {COLLECTION_NAME}")
print(f"   Chunks stored: {len(chunks)}")
