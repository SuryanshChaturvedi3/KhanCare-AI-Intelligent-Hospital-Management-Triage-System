import os
from typing import List, TypedDict, Annotated, Optional
from dotenv import load_dotenv
load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph, START, END, add_messages
from pymongo import MongoClient
from langgraph.checkpoint.mongodb import MongoDBSaver

EMERGENCY_KEYWORDS = [
    "chest pain", "severe bleeding", "can't breathe", "cannot breathe",
    "difficulty breathing", "stroke", "unconscious", "heart attack",
    "not breathing", "severe chest"
]

DEPARTMENT_MAP = {
    "gynecologist": "Gynecologist / Obstetrics",
    "obstetrics": "Gynecologist / Obstetrics",
    "pregnancy": "Gynecologist / Obstetrics",
    "cardiologist": "Cardiologist",
    "orthopedic": "Orthopedic",
    "gastroenterologist": "Gastroenterologist",
    "neurologist": "Neurologist",
    "general physician": "General Physician (Medicine)",
    "dermatologist": "Dermatologist",
    "pediatrician": "Pediatrician",
    "emergency": "Emergency",
}

EMERGENCY_MESSAGE = "🚨 MEDICAL EMERGENCY: Please visit the nearest Emergency Room (ER) or call an ambulance immediately."

MEDISTEP_SYSTEM_PROMPT = """You are MediStep AI, a highly professional, empathetic, and strict Medical Triage Assistant for KhanCare Hospital.

YOUR OBJECTIVES:
1. Understand the user's symptoms.
2. Provide ONLY safe, general first-aid or lifestyle advice (hydration, rest, etc.).
3. Strictly route the patient to the correct medical department.

CRITICAL GUARDRAILS (NEVER VIOLATE):
- NEVER prescribe specific medications.
- NEVER diagnose. Use "These symptoms might be related to..." instead of "You have...".

ROUTING LOGIC:
- Pregnancy / Menstrual issues → Gynecologist / Obstetrics
- Heart / Chest Pain → Cardiologist
- Bones / Joints / Fractures → Orthopedic
- Digestion / Stomach / Gas → Gastroenterologist
- Brain / Nerve / Severe chronic headache → Neurologist
- General Fever / Cold / Cough → General Physician (Medicine)
- Skin / Hair / Rashes → Dermatologist
- Children / Infants → Pediatrician

RESPONSE FORMAT (always follow exactly):
1. Empathy & Validation: Acknowledge their discomfort (1-2 sentences).
2. General Advice: 1-2 lines of safe home-care advice only.
3. Department Routing: State which doctor they need to see.
4. Disclaimer: ALWAYS end with: "*Disclaimer: I am an AI assistant, not a doctor. Please consult the recommended specialist for proper diagnosis.*"
"""


def guardrail_check(query: str) -> bool:
    q = query.lower()
    return any(kw in q for kw in EMERGENCY_KEYWORDS)


def extract_department(response_text: str) -> Optional[str]:
    text = response_text.lower()
    for key, dept in DEPARTMENT_MAP.items():
        if key in text:
            return dept
    return None


class TriageState(TypedDict):
    messages: Annotated[List, add_messages]


triage_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.1
)


async def triage_assistant_node(state: TriageState):
    response = await triage_llm.ainvoke(state["messages"])
    return {"messages": [response]}


def create_triage_graph():
    mongo_url = os.getenv("MONGO_URL")
    builder = StateGraph(TriageState)
    builder.add_node("triage_assistant", triage_assistant_node)
    builder.add_edge(START, "triage_assistant")
    builder.add_edge("triage_assistant", END)

    if mongo_url:
        client = MongoClient(mongo_url)
        checkpointer = MongoDBSaver(client=client, db_name="khan_care_db", collection_name="triage_checkpoints")
        return builder.compile(checkpointer=checkpointer)
    return builder.compile()


triage_app = create_triage_graph()
print("✅ Triage agent created successfully!")
