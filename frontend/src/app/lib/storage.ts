import type { AssessmentState, UserSession } from "../types";


const SESSION_KEY = "skillproof-user-session";
const ASSESSMENT_KEY = "skillproof-assessment-state";

const emptyAssessmentState: AssessmentState = {
  sessionId: null,
  skill: "",
  currentQuestion: null,
  currentResponseId: null,
  latestEvaluation: null,
};


function readJson<T>(key: string): T | null {
  const value = window.localStorage.getItem(key);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}


export function getStoredSession(): UserSession | null {
  return readJson<UserSession>(SESSION_KEY);
}


export function setStoredSession(session: UserSession | null) {
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}


export function getStoredAssessmentState(): AssessmentState {
  return readJson<AssessmentState>(ASSESSMENT_KEY) ?? emptyAssessmentState;
}


export function setStoredAssessmentState(state: AssessmentState) {
  window.localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(state));
}


export function clearStoredAssessmentState() {
  window.localStorage.removeItem(ASSESSMENT_KEY);
}
