# Requirements Document

## Introduction

MediStep AI is a medical triage assistant integrated into the KhanCare AI platform. It accepts patient-reported symptoms through a dedicated chat widget, applies emergency guardrails before any LLM invocation, routes patients to the correct hospital department, and escalates emergencies immediately with a red-banner UI. The feature spans three layers: a new `/triage` FastAPI endpoint on the Python AI agent (port 8000), a new Express proxy route on the Node.js backend (port 5000), and a dedicated `TriageWidget` React component on the frontend (port 5173). MediStep AI operates without requiring user authentication, making it accessible to all patients at any point in their visit.

---

## Glossary

- **Triage_Agent**: The LangGraph `StateGraph` compiled in `triage_agent.py` that invokes Gemini 2.5 Flash with the MediStep system prompt.
- **Triage_Endpoint**: The FastAPI `POST /triage` route added to `server.py` that orchestrates guardrail checking and agent invocation.
- **Triage_Controller**: The Express controller `triageController.js` that proxies triage requests from the frontend to the Python agent.
- **Triage_Route**: The Express route `triageRoutes.js` that exposes `POST /api/triage/chat` on the Node.js backend.
- **TriageWidget**: The React component `TriageWidget.jsx` that renders the floating triage chat UI on the frontend.
- **Guardrail**: The `guardrail_check()` pure function that detects emergency keywords in a patient query before any LLM call is made.
- **Department_Router**: The `extract_department()` pure function that maps keywords in the LLM response to a canonical hospital department name.
- **Emergency_Keywords**: The predefined list of strings (`"chest pain"`, `"severe bleeding"`, `"can't breathe"`, `"cannot breathe"`, `"difficulty breathing"`, `"stroke"`, `"unconscious"`, `"heart attack"`, `"not breathing"`, `"severe chest"`) used by the Guardrail.
- **Department_Map**: The predefined mapping from lowercase symptom keywords to canonical department names (e.g., `"cardiologist"` → `"Cardiologist"`).
- **Thread_ID**: A unique string identifier that scopes a patient's conversation history within the LangGraph checkpointer.
- **MediStep_System_Prompt**: The constant string injected as a `SystemMessage` into every triage LangGraph invocation, defining guardrails, routing logic, and response format.
- **Disclaimer**: The fixed string `"Disclaimer: I am an AI assistant, not a doctor. Please consult the recommended specialist for proper diagnosis."` that must appear at the end of every non-emergency response.

---

## Requirements

### Requirement 1: Triage Endpoint — Request Handling

**User Story:** As a patient, I want to submit my symptoms to the triage system, so that I receive safe medical guidance and department routing without needing to log in.

#### Acceptance Criteria

1. WHEN a `POST /triage` request is received with a non-empty `query` string, THE Triage_Endpoint SHALL return a `TriageResponse` containing `response`, `department`, `is_emergency`, and `thread_id` fields.
2. WHEN a `POST /triage` request is received with an empty or missing `query` field, THE Triage_Endpoint SHALL return HTTP 422 with a validation error message.
3. WHEN a `POST /triage` request is received without a `thread_id`, THE Triage_Endpoint SHALL generate a unique `thread_id` prefixed with `"triage_"` and include it in the response.
4. WHEN a `POST /triage` request is received with a `thread_id`, THE Triage_Endpoint SHALL echo the same `thread_id` back in the response.
5. THE Triage_Endpoint SHALL always return a non-empty `response` string, even when the LLM produces no output.

---

### Requirement 2: Emergency Guardrail

**User Story:** As a patient in a medical emergency, I want the system to immediately escalate my situation, so that I receive urgent guidance without waiting for LLM processing.

#### Acceptance Criteria

1. WHEN a patient query contains any string from the Emergency_Keywords list (case-insensitive substring match), THE Guardrail SHALL return `True` without invoking the Triage_Agent.
2. WHEN the Guardrail returns `True`, THE Triage_Endpoint SHALL return a `TriageResponse` with `is_emergency` set to `True`, `department` set to `"Emergency"`, and `response` containing an emergency escalation message directing the patient to the nearest Emergency Room.
3. WHEN a patient query does not contain any Emergency_Keywords, THE Guardrail SHALL return `False` and THE Triage_Endpoint SHALL proceed to invoke the Triage_Agent.
4. THE Guardrail SHALL be a pure function — given the same input string, it SHALL always return the same boolean result with no side effects.
5. THE Guardrail SHALL handle any string input, including empty strings, Unicode characters, and special characters, without raising an exception.

---

### Requirement 3: Triage Agent — LLM Invocation

**User Story:** As a patient, I want the AI to understand my symptoms and provide empathetic, safe guidance, so that I know what to do before seeing a doctor.

#### Acceptance Criteria

1. WHEN the Guardrail returns `False`, THE Triage_Agent SHALL invoke Gemini 2.5 Flash with `temperature=0.1` using the MediStep_System_Prompt as a `SystemMessage` and the patient query as a `HumanMessage`.
2. THE Triage_Agent SHALL use a separate `StateGraph` from the existing Jan Aushadhi medicine agent, with no shared state or tools.
3. WHEN the Triage_Agent produces a response, THE Triage_Endpoint SHALL include the full response text in the `response` field of the `TriageResponse`.
4. IF the Triage_Agent returns an empty `messages` list, THEN THE Triage_Endpoint SHALL return the fallback message `"I'm sorry, I couldn't process your request. Please describe your symptoms again."` with `department` set to `null`.
5. THE Triage_Agent SHALL NOT bind any tools — triage responses SHALL be generated purely by the LLM without tool calls.

---

### Requirement 4: Response Format Compliance

**User Story:** As a patient, I want the triage response to follow a consistent, safe format, so that I receive empathetic guidance, actionable advice, and a clear department recommendation.

#### Acceptance Criteria

1. WHEN the Triage_Agent produces a non-emergency response, THE Triage_Endpoint SHALL ensure the `response` field contains the Disclaimer string.
2. WHEN the Triage_Agent produces a non-emergency response, THE Triage_Endpoint SHALL ensure the `response` field does not contain the phrase `"You have"` followed by a medical condition name.
3. WHEN the Triage_Agent produces a non-emergency response, THE Triage_Endpoint SHALL ensure the `response` field does not contain specific prescription drug names from scheduled medicine categories.
4. THE MediStep_System_Prompt SHALL instruct the Triage_Agent to structure every response with: (1) empathy and validation, (2) general home-care advice, (3) department routing, and (4) the Disclaimer.

---

### Requirement 5: Department Routing

**User Story:** As a patient, I want to be directed to the correct hospital department based on my symptoms, so that I can book an appointment with the right specialist.

#### Acceptance Criteria

1. WHEN the Triage_Agent produces a response containing a keyword from the Department_Map (case-insensitive), THE Department_Router SHALL return the corresponding canonical department name string.
2. WHEN the Triage_Agent produces a response containing no keyword from the Department_Map, THE Department_Router SHALL return `None`.
3. THE Department_Router SHALL be a pure function — it SHALL handle any string input without raising an exception, and the same input SHALL always produce the same output.
4. WHEN the Department_Router returns a non-`None` value, THE Triage_Endpoint SHALL include that department name in the `department` field of the `TriageResponse`.
5. WHEN the Department_Router returns `None`, THE Triage_Endpoint SHALL set the `department` field to `null` in the `TriageResponse`.

---

### Requirement 6: Conversation Thread Isolation

**User Story:** As a patient, I want my triage conversation to be remembered across messages in the same session, so that the AI has context for follow-up questions.

#### Acceptance Criteria

1. WHEN the Triage_Agent is invoked with a `thread_id`, THE Triage_Agent SHALL use that `thread_id` as the LangGraph checkpointer key to scope conversation history.
2. WHEN two concurrent requests are made with different `thread_id` values, THE Triage_Agent SHALL maintain independent conversation state for each thread with no state bleed between them.
3. WHERE `MONGO_URL` is set in the environment, THE Triage_Agent SHALL persist conversation state to the `triage_checkpoints` MongoDB collection (not the `checkpoints` collection used by the medicine agent).
4. WHERE `MONGO_URL` is not set in the environment, THE Triage_Agent SHALL compile and operate without a checkpointer, treating each request as stateless.

---

### Requirement 7: Node.js Backend Proxy

**User Story:** As a frontend developer, I want the Node.js backend to proxy triage requests to the Python agent, so that the frontend communicates through a single backend and benefits from rate limiting.

#### Acceptance Criteria

1. WHEN a `POST /api/triage/chat` request is received with a `message` field, THE Triage_Controller SHALL forward the request to `http://127.0.0.1:8000/triage` via HTTP POST with `query` mapped from `message`.
2. WHEN the Python agent returns a successful response, THE Triage_Controller SHALL map the `response` field to `reply` and return `{ reply, department, is_emergency, thread_id }` to the frontend.
3. WHEN a `POST /api/triage/chat` request is received without a `message` field, THE Triage_Controller SHALL return HTTP 400 with a descriptive error message.
4. IF the Python agent is unreachable, THEN THE Triage_Controller SHALL return HTTP 503 with `{ reply: "MediStep AI is temporarily unavailable. Please contact the hospital reception.", is_emergency: false }`.
5. THE Triage_Route SHALL apply the existing `express-rate-limit` middleware, returning HTTP 429 when a single IP exceeds 100 requests within 15 minutes.
6. THE Triage_Route SHALL NOT apply `authMiddleware`, allowing unauthenticated access to the triage endpoint.
7. THE Triage_Controller SHALL NOT log the patient's `message` content to server logs to avoid storing sensitive health data.

---

### Requirement 8: TriageWidget — Frontend Chat Interface

**User Story:** As a patient, I want a dedicated triage chat widget on the hospital website, so that I can describe my symptoms and receive guidance before or after logging in.

#### Acceptance Criteria

1. THE TriageWidget SHALL render as a floating button positioned above the existing ChatWidget (bottom-right of the viewport), using a visually distinct icon (`Stethoscope` from `lucide-react`).
2. WHEN a patient submits a message, THE TriageWidget SHALL send `POST /api/triage/chat` with `{ message, thread_id }` to the Node.js backend and display the AI response in the chat window.
3. WHEN the AI response has `is_emergency` set to `true`, THE TriageWidget SHALL render the response with a red emergency banner and SHALL NOT display a "Book Appointment" button.
4. WHEN the AI response has `is_emergency` set to `false` and `department` is non-null, THE TriageWidget SHALL display a "Book Appointment" button that pre-fills the department when initiating an appointment booking.
5. WHEN the AI response has `is_emergency` set to `false` and `department` is `null`, THE TriageWidget SHALL display the response text without a "Book Appointment" button.
6. WHEN the TriageWidget receives a `thread_id` in the AI response, THE TriageWidget SHALL store that `thread_id` in component state and include it in all subsequent requests within the same session.
7. THE TriageWidget SHALL be accessible to unauthenticated users — it SHALL NOT require a valid JWT token to render or send messages.
8. WHEN the TriageWidget is waiting for an AI response, THE TriageWidget SHALL display a loading indicator to the patient.

---

### Requirement 9: Triage Agent Initialization

**User Story:** As a system operator, I want the triage agent to initialize correctly alongside the existing medicine agent, so that both agents run independently in the same FastAPI process.

#### Acceptance Criteria

1. THE `triage_agent.py` module SHALL export a `triage_app` compiled `StateGraph` that is imported and used by `server.py`.
2. THE `create_triage_graph()` function SHALL build a `StateGraph` with the topology `START → triage_assistant_node → END`.
3. THE Triage_Agent SHALL use `temperature=0.1` for the Gemini 2.5 Flash model, independent of the medicine agent's temperature setting.
4. IF `MONGO_URL` is set, THEN `create_triage_graph()` SHALL configure the checkpointer to use the `triage_checkpoints` collection.
5. IF `MONGO_URL` is not set, THEN `create_triage_graph()` SHALL return a compiled graph without a checkpointer and SHALL NOT raise an exception.

---

### Requirement 10: No New Production Dependencies

**User Story:** As a developer, I want the triage feature to use only existing production dependencies, so that the deployment footprint and security surface remain unchanged.

#### Acceptance Criteria

1. THE Triage_Endpoint SHALL be implemented using only Python packages already listed in `ai_agent/requirements.txt` (`fastapi`, `langgraph`, `langchain-google-genai`, `langchain-core`, `langgraph-checkpoint-mongodb`).
2. THE Triage_Controller and Triage_Route SHALL be implemented using only Node.js packages already listed in `backend/package.json` (`axios`, `express-rate-limit`).
3. THE TriageWidget SHALL be implemented using only React packages already present in `frontend/package.json` (`axios`, `lucide-react`).
4. WHERE new packages are required, THE system SHALL restrict them to development/test dependencies only (`hypothesis`, `pytest-asyncio`).
