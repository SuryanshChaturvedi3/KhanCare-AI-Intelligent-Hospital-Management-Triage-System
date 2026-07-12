import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.tools import create_retriever_tool
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from dotenv import load_dotenv

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = "khancare_memory"


def create_retrival_tool():
    # Gemini embeddings instead of OpenAI
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
    )

    # Connect to Qdrant vector database
    # If QDRANT_API_KEY is set → cloud mode, otherwise → local
    api_key = os.getenv("QDRANT_API_KEY")
    client = QdrantClient(
        url=QDRANT_URL,
        api_key=api_key if api_key else None,
    )

    vector_store = QdrantVectorStore(
        client=client,
        collection_name=COLLECTION_NAME,
        embedding=embeddings,
    )

    retriever = vector_store.as_retriever(
        search_kwargs={"k": 5}
    )

    tool = create_retriever_tool(
        retriever=retriever,
        name="Medicine_Retriever",
        description=(
            "Use this tool to find medicine prices and details from the Jan Aushadhi list. "
            "Search for generic medicine names (salts) to get their MRP and Unit Size. "
            "If the answer is not in the PDF, say 'I don't know'."
        ),
    )

    print("✅ Qdrant Retrieval tool created successfully!")
    return tool


if __name__ == "__main__":
    tool = create_retrival_tool()
