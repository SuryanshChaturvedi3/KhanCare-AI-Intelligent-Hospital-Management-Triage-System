# Implementation Plan: MediStep AI — Medical Triage Assistant

## Overview

Implement the MediStep AI triage feature across three layers: a new LangGraph agent and FastAPI endpoint in the Python AI agent, a new Express proxy route in the Node.js backend, and a dedicated `TriageWidget` React component in the frontend. The implementation language is Python (AI agent), JavaScript/Node.js (backend), and React/JSX (frontend), matching the existing codebase.

## Tasks

- [ ] 1. Create `triage_agent.py` — LangGraph triage StateGraph
  - Create `ai_agent/triage_agent.py` with `TriageState` TypedDict, `triage_assistant_node` async function, and `create_triage_graph()` factory function
  - Define `MEDISTEP_SYSTEM_PROMPT` constant with the four-part response format (empathy, advice, routing, disclaimer)
  - Define `EMERGENCY_KEYWORDS` list and `DEPARTMENT_MAP` dict as module-level constants
  - Implement `guardrail_check(query: str) -> bool` as a pure function using case-insensitive substring matching against `EMERGENCY_KEYWORDS`
  - Implement `extract_department(response_text: str) -> Optional[str]` as a pure function using case-insensitive substring matching against `DEPARTMENT_MAP`
  - Initialize `triage_llm` as `ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.1)`
  - In `create_triage_graph()`: build `StateGraph(TriageState)`, add `triage_assistant_node`, set edges `START → triage_assistant_node → END`, configure `AsyncMongoDBSaver` on `triage_checkpoints` collection if `MONGO_URL` is set, compile and return the graph
  - Export `triage_app = create_triage_graph()` at module level
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 2.1, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3_

  - [ ]* 1.1 Write property tests for `guardrail_check` and `extract_department`
    - **Property 2: Guardrail Purity** — use `hypothesis` `@given(st.text())` to assert `guardrail_check` is deterministic and never raises
    - **Property 3: Safe Query Guardrail Pass-Through** — generate strings without any emergency keyword, assert `guardrail_check` returns `False`
    - **Property 8: Department Extraction Consistency** — generate strings containing/not containing department keywords, assert `extract_department` returns correct canonical name or `None` and never raises
    - _Requirements: 2.3, 2.4, 2.5, 5.1, 5.2, 5.3_

- [ ] 2. Add `/triage` endpoint to `server.py`
  - In `ai_agent/server.py`, add `from triage_agent import triage_app, guardrail_check, extract_department, MEDISTEP_SYSTEM_PROMPT`
  - Define `TriageQuery(BaseModel)` with `query: str` and `thread_id: Optional[str] = None`
  - Define `TriageResponse(BaseModel)` with `response: str`, `department: Optional[str]`, `is_emergency: bool = False`, `thread_id: Optional[str]`
  - Implement `POST /triage` endpoint: generate `thread_id` with `"triage_" + str(uuid4())` if not provided; run `guardrail_check()`; if emergency, return immediately with `is_emergency=True`, `department="Emergency"`, and the emergency message without calling the LLM; otherwise invoke `triage_app.ainvoke()` with `SystemMessage(MEDISTEP_SYSTEM_PROMPT)` and `HumanMessage(query)`, extract response text safely (handle list content), call `extract_department()`, return `TriageResponse`
  - Add fallback: if `messages` list is empty, return `"I'm sorry, I couldn't process your request. Please describe your symptoms again."` with `department=None`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.2, 3.1, 3.3, 3.4, 4.1, 5.4, 5.5_

  - [ ]* 2.1 Write property tests for the `/triage` endpoint
    - **Property 1: Emergency Bypass** — generate queries containing emergency keywords, POST to `/triage`, assert `is_emergency=True` and `department="Emergency"` and LLM is not called (mock `triage_app`)
    - **Property 4: Response Shape Completeness** — generate arbitrary non-empty queries (mocking LLM), assert all four fields present and `response` is non-empty
    - **Property 5: Thread ID Echo** — generate arbitrary `(query, thread_id)` pairs, assert `response.thread_id == input thread_id`
    - **Property 6: Auto Thread ID Generation** — generate queries without `thread_id`, assert `response.thread_id` starts with `"triage_"`
    - **Property 7: Disclaimer Presence** — generate non-emergency queries (mock LLM to return text with disclaimer), assert disclaimer string present in response
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 2.2, 4.1_

- [ ] 3. Checkpoint — Verify Python layer
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify: `uvicorn server:app --reload` starts without errors; `POST /triage` with a normal query returns a valid `TriageResponse`; `POST /triage` with `"chest pain"` returns `is_emergency=True`

- [ ] 4. Create `triageController.js` — Node.js proxy controller
  - Create `backend/controller/triageController.js`
  - Import `axios`; define `PYTHON_TRIAGE_URL = 'http://127.0.0.1:8000/triage'`
  - Implement `getTriageResponse(req, res)`: validate `req.body.message` is present (return HTTP 400 if missing); call `axios.post(PYTHON_TRIAGE_URL, { query: message, thread_id })` where `thread_id` is passed through from `req.body`; map `response.data.response` → `reply`; return `{ reply, department, is_emergency, thread_id }` with HTTP 200
  - In the `catch` block: return HTTP 503 with `{ reply: "MediStep AI is temporarily unavailable. Please contact the hospital reception.", is_emergency: false }`
  - Do NOT log `req.body.message` — log only `"Triage request received"` to avoid storing sensitive health data
  - Export `{ getTriageResponse }`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.7_

  - [ ]* 4.1 Write property tests for `triageController.js`
    - **Property 11: Controller Field Mapping** — mock `axios.post` to return arbitrary `{ response, department, is_emergency, thread_id }` values; assert `reply === response` and other fields pass through unchanged
    - **Property 12: Controller Query Mapping** — generate arbitrary `message` strings; assert `axios.post` is called with `{ query: message, thread_id }` matching the request body
    - _Requirements: 7.1, 7.2_

- [ ] 5. Create `triageRoutes.js` — Express route with rate limiting
  - Create `backend/routes/triageRoutes.js`
  - Import `express`, `express-rate-limit`, and `{ getTriageResponse }` from `../controller/triageController`
  - Reuse the same `rateLimit` configuration as `aiRoutes.js` (100 req / 15 min per IP, HTTP 429 on exceed)
  - Register `router.post('/chat', apiLimiter, getTriageResponse)`
  - Do NOT apply `authMiddleware` — the route must be publicly accessible
  - Export `router`
  - _Requirements: 7.5, 7.6_

- [ ] 6. Register triage route in `backend/index.js`
  - In `backend/index.js`, add `const triageRoutes = require('./routes/triageRoutes')`
  - Register `app.use('/api/triage', triageRoutes)` alongside the existing `aiRoutes` and `appointRoutes` registrations
  - _Requirements: 7.1, 7.5, 7.6_

- [ ] 7. Checkpoint — Verify Node.js layer
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify: `POST /api/triage/chat` with `{ "message": "I have a headache" }` returns `{ reply, department, is_emergency, thread_id }`; request without `message` returns HTTP 400; request without `Authorization` header is not rejected

- [ ] 8. Create `TriageWidget.jsx` — React triage chat component
  - Create `frontend/src/components/TriageWidget.jsx`
  - Import `React`, `useState`, `axios`, and `{ Stethoscope, X, Send }` from `lucide-react`
  - Define `TriageWidget` functional component with state: `isOpen` (bool), `messages` (array of `{ sender, text, department?, is_emergency? }`), `input` (string), `isLoading` (bool), `threadId` (string, initially `null`)
  - Initialize `messages` with a welcome message: `{ sender: "ai", text: "Hello! I'm MediStep AI. Please describe your symptoms and I'll help route you to the right department." }`
  - Implement `sendMessage()`: POST to `http://localhost:5000/api/triage/chat` with `{ message: input, thread_id: threadId }`; on success, update `threadId` from `response.data.thread_id`; append AI message with `{ sender: "ai", text: reply, department, is_emergency }`
  - Render floating button using `Stethoscope` icon; position with `fixed bottom-24 right-6 z-50` (above `ChatWidget` which uses `bottom-6`)
  - In the chat window, for each AI message: if `is_emergency` is true, render a red banner (`bg-red-600` or similar) with no "Book Appointment" button; if `is_emergency` is false and `department` is non-null, render a "Book Appointment" button below the message; if `department` is null, render message text only
  - Show loading indicator (`"MediStep is analyzing..."`) while `isLoading` is true
  - Use a visually distinct color scheme from `ChatWidget` (e.g., `bg-green-600` or `bg-emerald-600` for the header instead of `bg-cyan-600`)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 8.1 Write property tests for `TriageWidget.jsx`
    - **Property 13: TriageWidget Thread Continuity** — mock `axios.post` to return arbitrary `thread_id` values; render `TriageWidget`, send a message, assert the second `axios.post` call includes the `thread_id` from the first response
    - Write example-based tests: emergency response renders red banner and no booking button; non-null department renders booking button; null department renders no booking button; loading indicator shown while awaiting response
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.8_

- [ ] 9. Add `TriageWidget` to `App.jsx`
  - In `frontend/src/App.jsx`, add `import TriageWidget from "./components/TriageWidget"`
  - Add `<TriageWidget />` as a sibling to `<ChatWidget />` inside the `<div className="relative min-h-screen bg-black">` wrapper, placed before `<ChatWidget />` in the JSX so it renders above it visually
  - _Requirements: 8.1, 8.7_

- [ ] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify end-to-end: open the app, click the Stethoscope button, type a symptom, confirm the response includes a department and disclaimer; type an emergency phrase (e.g., "chest pain"), confirm the red emergency banner appears with no booking button; click "Book Appointment" on a normal response and confirm the department is pre-filled

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["3"] },
    { "wave": 4, "tasks": ["4", "5"] },
    { "wave": 5, "tasks": ["6"] },
    { "wave": 6, "tasks": ["7"] },
    { "wave": 7, "tasks": ["8"] },
    { "wave": 8, "tasks": ["9"] },
    { "wave": 9, "tasks": ["10"] }
  ]
}
```

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at each layer boundary
- Property tests use `hypothesis` (Python) for the AI agent layer and `@testing-library/react` + `jest` (or `vitest`) for the React layer
- The `TriageWidget` is intentionally unauthenticated — do not add `authMiddleware` or JWT checks to the triage route
- The `triage_checkpoints` MongoDB collection is separate from `checkpoints` to prevent state collision with the Jan Aushadhi medicine agent
- If `MONGO_URL` is not set, the triage agent runs statelessly — this is acceptable for development
