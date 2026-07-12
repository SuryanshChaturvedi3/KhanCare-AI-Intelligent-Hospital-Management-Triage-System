import os
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from uuid import uuid4
from agent import agent_app
from langchain_core.messages import HumanMessage, SystemMessage
import uvicorn
from langchain_core.runnables import RunnableConfig
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
load_dotenv()


app = FastAPI(
    title="KhanCare AI Agent API",
    description="Unified AI Agent — Medicine Search + Symptom Triage",
    version="2.0.0",
)

# CORS — reads from env var for production
allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Emergency Detection ---
EMERGENCY_KEYWORDS = [
    "chest pain", "severe bleeding", "can't breathe", "cannot breathe",
    "difficulty breathing", "stroke", "unconscious", "heart attack",
    "not breathing", "severe chest", "suicide", "dying"
]

DEPARTMENT_MAP = {
    "gynecologist": "Gynecology",
    "obstetrics": "Gynecology",
    "gynecology": "Gynecology",
    "pregnancy": "Gynecology",
    "cardiologist": "Cardiology",
    "cardiology": "Cardiology",
    "orthopedic": "Orthopedic",
    "orthopedics": "Orthopedic",
    "gastroenterologist": "Gastroenterology",
    "gastroenterology": "Gastroenterology",
    "gastro": "Gastroenterology",
    "neurologist": "Neurology",
    "neurology": "Neurology",
    "general physician": "General Medicine",
    "general medicine": "General Medicine",
    "dermatologist": "Dermatology",
    "dermatology": "Dermatology",
    "pediatrician": "Pediatrics",
    "pediatrics": "Pediatrics",
    "emergency": "Emergency",
    "ent": "ENT",
    "ophthalmology": "Ophthalmology",
    "eye": "Ophthalmology",
}

EMERGENCY_MESSAGE = "🚨 MEDICAL EMERGENCY: Please visit the nearest Emergency Room (ER) or call an ambulance (108/112) immediately. Do NOT wait."


def is_emergency(query: str) -> bool:
    q = query.lower()
    return any(kw in q for kw in EMERGENCY_KEYWORDS)


def extract_department(response_text: str) -> Optional[str]:
    text = response_text.lower()
    for key, dept in DEPARTMENT_MAP.items():
        if key in text:
            return dept
    return None


# --- Unified System Prompt ---
SYSTEM_PROMPT = """You are KhanCare AI — a unified medical assistant for KhanCare Hospital.

You have TWO capabilities:

═══ CAPABILITY 1: MEDICINE SEARCH ═══
If the user asks about medicine names, prices, generics, or Jan Aushadhi medicines:
- ALWAYS use the 'Medicine_Retriever' tool to search.
- The tool searches the Jan Aushadhi medicine database.
- If user asks for a BRAND name (e.g., Dolo, Volini), map it to its generic salt and search.
- Provide MRP and Unit Size from the tool's output.

═══ CAPABILITY 2: SYMPTOM TRIAGE ═══
If the user describes symptoms, health complaints, or asks which doctor to see:
- Understand their symptoms with empathy.
- Provide ONLY safe general advice (rest, hydration, etc.).
- NEVER prescribe specific medications or diagnose.
- Route to the correct department:
  • Pregnancy / Menstrual → Gynecologist / Obstetrics
  • Heart / Chest Pain → Cardiologist
  • Bones / Joints / Fractures → Orthopedic
  • Stomach / Digestion / Gas → Gastroenterologist
  • Brain / Nerve / Headache → Neurologist
  • Fever / Cold / General → General Physician (Medicine)
  • Skin / Rashes / Hair → Dermatologist
  • Children / Infants → Pediatrician
  • Ear / Nose / Throat → ENT Specialist
  • Eyes / Vision → Ophthalmologist

RESPONSE FORMAT for symptoms:
1. Empathy (1-2 sentences)
2. Safe general advice (1-2 lines)
3. Department recommendation
4. Disclaimer: "*I am an AI assistant, not a doctor. Please consult the recommended specialist.*"

═══ GENERAL RULES ═══
- Be concise and helpful.
- If unsure whether it's medicine or symptoms, ask a clarifying question.
- Never make up information — if tool returns nothing, say so honestly.
"""


# --- Request/Response Models ---
class UserQuery(BaseModel):
    query: str
    thread_id: Optional[str] = None


class AgentResponse(BaseModel):
    response: str
    thread_id: Optional[str] = None
    department: Optional[str] = None
    is_emergency: bool = False


# --- Endpoints ---
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "KhanCare AI Agent v2"}


@app.post("/chat", response_model=AgentResponse)
async def chat(user_query: UserQuery):
    """Unified endpoint — handles medicine search + symptom triage."""

    # Emergency guardrail — instant response, no LLM call
    if is_emergency(user_query.query):
        return AgentResponse(
            response=EMERGENCY_MESSAGE,
            department="Emergency",
            is_emergency=True,
            thread_id=user_query.thread_id or "emergency",
        )

    # Build messages
    system_msg = SystemMessage(content=SYSTEM_PROMPT)
    human_msg = HumanMessage(content=user_query.query)

    # Thread ID for conversation memory
    thread_id = user_query.thread_id or str(uuid4())
    config = RunnableConfig(configurable={"thread_id": thread_id})

    # Invoke the agent
    result = await agent_app.ainvoke(
        {"messages": [system_msg, human_msg]},
        config=config,
    )

    # Extract response
    messages = result.get("messages", [])
    if not messages:
        return AgentResponse(
            response="I couldn't process your request. Please try again.",
            thread_id=thread_id,
        )

    last_message = messages[-1]
    response_text = getattr(last_message, "content", "")

    # Handle list-type responses from Gemini
    if isinstance(response_text, list):
        extracted = ""
        for item in response_text:
            if isinstance(item, dict) and "text" in item:
                extracted += item["text"]
            else:
                extracted += str(item)
        response_text = extracted.strip()

    if not response_text:
        response_text = "I couldn't generate a meaningful response. Please rephrase your question."

    # Extract department if mentioned in response
    department = extract_department(response_text)

    return AgentResponse(
        response=str(response_text),
        thread_id=thread_id,
        department=department,
        is_emergency=False,
    )
