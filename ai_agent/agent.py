import os
from typing import List, TypedDict, Annotated

from dotenv import load_dotenv
load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from pymongo import MongoClient
from langgraph.checkpoint.mongodb import MongoDBSaver

from retriver_tool import create_retrival_tool

# --- CONFIGURATION ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# LLM Setup (Gemini 2.5 Flash)
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=GOOGLE_API_KEY,
    temperature=0.2
)

# Tools Setup
get_tool = create_retrival_tool()
tools_list = [get_tool]


# State Definition
class AgentState(TypedDict):
    messages: Annotated[List, add_messages]


# --- NODES ---
async def assistant_node(state: AgentState):
    """Decides whether to answer directly or use a tool."""
    llm_with_tools = llm.bind_tools(tools_list)
    response = await llm_with_tools.ainvoke(state["messages"])
    return {"messages": [response]}


node_agent = ToolNode(tools_list)


# --- GRAPH CONSTRUCTION ---
def create_graph_agent():
    mongo_url = os.getenv("MONGO_URL")

    builder = StateGraph(AgentState)
    builder.add_node("assistant", assistant_node)
    builder.add_node("tools", node_agent)

    builder.add_edge(START, "assistant")
    builder.add_conditional_edges(
        "assistant",
        tools_condition,
        {
            "tools": "tools",
            "__end__": END,
        }
    )
    builder.add_edge("tools", "assistant")

    if mongo_url:
        print(f"🔗 Connecting to MongoDB for memory...")
        client = MongoClient(mongo_url)
        checkpointer = MongoDBSaver(
            client=client,
            db_name="khan_care_db",
            collection_name="checkpoints"
        )
        return builder.compile(checkpointer=checkpointer)
    else:
        print("⚠️ No MongoDB URL. Running without memory.")
        return builder.compile()


agent_app = create_graph_agent()
print("✅ Unified agent created successfully!")
