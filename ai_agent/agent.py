import os
from typing import List, TypedDict, Annotated

# 1. Sabse pehle Environment Variables load karo
from dotenv import load_dotenv
load_dotenv()

# 2. Libraries Import (Deeply organized)
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from pymongo import MongoClient
from langgraph.checkpoint.mongodb import MongoDBSaver

# Humare banaye huye tools
from retriver_tool import create_retrival_tool

# --- CONFIGURATION ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# 3. Model Setup (Gemini 1.5 Flash - Free & Fast)
llm = ChatGoogleGenerativeAI(
   model="gemini-2.5-flash",
    google_api_key=GOOGLE_API_KEY,
    temperature=0.2 # Taaki AI 'feku' baatein na kare
)

# 4. Tools Setup
get_tool = create_retrival_tool()
tools_list = [get_tool]

# 5. State Definition (Memory ka Dhancha)
class AgentState(TypedDict):
    # 'add_messages' naye messages ko purani history mein jodta rehta hai
    messages: Annotated[List, add_messages]

# --- NODES (AI ke Dimaag ke Hisse) ---

async def assistant_node(state: AgentState):
    """Ye node faisla karta hai ki kya jawab dena hai ya tool use karna hai."""
    llm_with_tools = llm.bind_tools(tools_list)
    response = await llm_with_tools.ainvoke(state["messages"])
    return {"messages": [response]}

# ToolNode khud handle karega ki kab tool chalana hai
node_agent = ToolNode(tools_list)

# --- GRAPH CONSTRUCTION (The Logic Flow) ---

def create_graph_agent():
    # MongoDB Connection Setup
    mongo_url = os.getenv("MONGO_URL")
    
    # 1. Builder ko batao humara State kaisa dikhta hai
    builder = StateGraph(AgentState)

    # 2. Nodes jodo
    builder.add_node("assistant", assistant_node)
    builder.add_node("tools", node_agent)

    # 3. Raste banao (Edges)
    builder.add_edge(START, "assistant") # Start se seedha Assistant ke paas
    
    # Conditional Edge: Agar AI ko tool chahiye toh 'tools' par jao, nahi toh khatam karo
    builder.add_conditional_edges(
        "assistant", 
        tools_condition,
        {
            "tools": "tools",
            "__end__": END,
        }
    )
    
    # Tool chalne ke baad wapas Assistant ke paas jao jawab finalize karne
    builder.add_edge("tools", "assistant")

    # 4. Persistence (Checkpointer) Setup
    if mongo_url:
        print(f"🔗 Connecting to MongoDB: {mongo_url}")
        client = MongoClient(mongo_url)
        checkpointer = MongoDBSaver(
            client=client,
            db_name="khan_care_db",
            collection_name="checkpoints"
        )
        # Compile with memory
        return builder.compile(checkpointer=checkpointer)
    else:
        print("⚠️ No MongoDB URL. Running without memory (Checkpointing).")
        return builder.compile()

# Final App Export
agent_app = create_graph_agent()
print("✅ Agent graph created successfully!")