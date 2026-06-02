from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from uuid import uuid4
from agent import agent_app
from triage_agent import triage_app, guardrail_check, extract_department, MEDISTEP_SYSTEM_PROMPT, EMERGENCY_MESSAGE
from langchain_core.messages import HumanMessage, SystemMessage
import uvicorn
from langchain_core.runnables import RunnableConfig
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
load_dotenv()


app = FastAPI(
    title="KhanCare AI Agent API",
    description="API for interacting with the KhanCare AI Agent",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Input Format (User kya bheje?)
class UserQuery(BaseModel):
    query: str
    thread_id: Optional[str] = None


class AgentResponse(BaseModel):
    response: str
    thread_id: Optional[str] = None


class TriageQuery(BaseModel):
    query: str
    thread_id: Optional[str] = None


class TriageResponse(BaseModel):
    response: str
    department: Optional[str] = None
    is_emergency: bool = False
    thread_id: Optional[str] = None


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "KhanCare AI Agent"}


@app.post("/chat", response_model=AgentResponse)
async def chat_with_agent(user_query: UserQuery):
    # Step A: Messages taiyar karo
    # System message optional hai agar tumne graph mein pehle se prompt diya hai
     
    system_instruction = (
            "You are an expert AI Assistant for the 'Pradhan Mantri Jan Aushadhi Pariyojna'. "
            "Your main task is to help users find affordable generic medicines from the provided PDF list.\n\n"
            "RULES:\n"
            "1. ALWAYS use the 'Medicine_Retriever' tool to search for medicines.\n"
            "2. The PDF lists medicines by their GENERIC SALT NAMES (e.g., 'Paracetamol', 'Diclofenac').\n"
            "3. If a user asks for a BRAND name (e.g., 'Dolo', 'Volini', 'Pan-D'), you MUST mentally map it to its generic salt "
            "and search for that salt in the PDF. (e.g., Dolo -> Search for 'Paracetamol').\n"
            "4. Provide the 'MRP' and 'Unit Size' clearly from the tool's output."
        )


    systemMmsg = SystemMessage(content=system_instruction)
    human_msg = HumanMessage(content=user_query.query)

    # Step B: Config taiyar karo (Memory ID)
    # None thread_id MongoDB checkpointer crash karta hai
    thread_id = user_query.thread_id or "default_thread"

    config = RunnableConfig(
        configurable={"thread_id": thread_id}
    )

    # Step C: Agent ko call karo (Dimaag lagao)
    # Note: 'await' ke saath 'ainvoke' use hota hai (Async Invoke)
    # 'invoke' synchronous hota hai jo server ko rok dega
    # SystemMessage PEHLE aana chahiye, phir HumanMessage
    result = await agent_app.ainvoke(
        {"messages": [systemMmsg, human_msg]},
        config=config,
    )

    # Step D: Jawab nikalo
    # result['messages'] poori chat history hai (User + AI).
    # Humein [-1] yaani sabse aakhri message chahiye jo AI ne diya hai.
    messages = result.get("messages", [])

    # Step E: Response bhejo
    if not messages:
        return AgentResponse(
            response="No response generated.",
            thread_id=user_query.thread_id or "default_thread",
        )

    last_message = messages[-1]

    # Safe extraction
    response_text = getattr(last_message, "content", "")

    # Agar Gemini list return kare to text nikaalo
    if isinstance(response_text, list):
        extracted_text = ""
        for item in response_text:
            if isinstance(item, dict) and "text" in item:
                extracted_text += item["text"]
            else:
                extracted_text += str(item)
        response_text = extracted_text.strip()

    if not response_text:
        response_text = "No meaningful response generated."

    return AgentResponse(
        response=str(response_text),
        thread_id=thread_id,
    )


@app.post("/triage", response_model=TriageResponse)
async def triage_chat(user_query: TriageQuery):
    thread_id = user_query.thread_id or "triage_" + str(uuid4())

    # Emergency guardrail — no LLM call
    if guardrail_check(user_query.query):
        return TriageResponse(
            response=EMERGENCY_MESSAGE,
            department="Emergency",
            is_emergency=True,
            thread_id=thread_id,
        )

    system_msg = SystemMessage(content=MEDISTEP_SYSTEM_PROMPT)
    human_msg = HumanMessage(content=user_query.query)
    config = RunnableConfig(configurable={"thread_id": thread_id})

    result = await triage_app.ainvoke({"messages": [system_msg, human_msg]}, config=config)
    messages = result.get("messages", [])

    if not messages:
        return TriageResponse(
            response="I'm sorry, I couldn't process your request. Please describe your symptoms again.",
            department=None,
            is_emergency=False,
            thread_id=thread_id,
        )

    last_message = messages[-1]
    response_text = getattr(last_message, "content", "")

    if isinstance(response_text, list):
        extracted = ""
        for item in response_text:
            if isinstance(item, dict) and "text" in item:
                extracted += item["text"]
            else:
                extracted += str(item)
        response_text = extracted.strip()

    if not response_text:
        response_text = "I'm sorry, I couldn't process your request. Please describe your symptoms again."

    department = extract_department(response_text)

    return TriageResponse(
        response=str(response_text),
        department=department,
        is_emergency=False,
        thread_id=thread_id,
    )


# Server run karne ke liye terminal mein likhna:
# uvicorn server:app --reload