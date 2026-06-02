import os
from langchain_openai import OpenAIEmbeddings
from langchain_core.tools import create_retriever_tool
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()

FAISS_INDEX_PATH = os.path.join(os.path.dirname(__file__), "vector_database")


def create_retrival_tool():
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    # Load the local FAISS vector store
    vector_database = FAISS.load_local(
        FAISS_INDEX_PATH,
        embeddings,
        allow_dangerous_deserialization=True,
    )

    retriever = vector_database.as_retriever(
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

    print("✅ FAISS Retrieval tool created successfully!")
    return tool


if __name__ == "__main__":
    tool = create_retrival_tool()
