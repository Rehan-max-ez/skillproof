import type {
  AssessmentQuestion,
  EvaluationSummary,
  QuestionExample,
  QuestionType,
  UserSession,
} from "../types";


const API_BASE_URL = "http://127.0.0.1:8000";

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

type StartAssessmentPayload = {
  skill: string;
};

type ApiErrorPayload = {
  detail?: string;
};


function normalizeQuestion(raw: {
  question_id: number;
  question: string;
  question_type: QuestionType;
  examples?: QuestionExample[];
  difficulty: "easy" | "medium" | "hard";
}): AssessmentQuestion {
  return {
    question_id: raw.question_id,
    question: raw.question,
    question_type: raw.question_type,
    examples: raw.examples ?? [],
    difficulty: raw.difficulty,
  };
}


async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    let detail = "Request failed";
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      detail = payload.detail ?? detail;
    } catch {
      // Ignore parse failures and use the fallback error text.
    }

    const lowered = detail.toLowerCase();
    if (
      lowered.includes("503")
      || lowered.includes("unavailable")
      || lowered.includes("high demand")
    ) {
      throw new Error(
        "Your answer is so special we are making sure to grade it properly. The local AI engine is a little busy right now, so please try again in a moment.",
      );
    }

    throw new Error(detail);
  }

  return (await response.json()) as T;
}


function authHeaders(session: UserSession) {
  return {
    Authorization: `Bearer ${session.token}`,
  };
}


export async function register(payload: RegisterPayload) {
  return request<{ message: string }>("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}


export async function login(username: string, password: string): Promise<UserSession> {
  const body = new URLSearchParams();
  body.set("username", username);
  body.set("password", password);

  const response = await request<{ access_token: string; token_type: string }>("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  return {
    username,
    token: response.access_token,
  };
}


export async function startAssessment(
  session: UserSession,
  payload: StartAssessmentPayload,
): Promise<{ session_id: number; message: string }> {
  return request("/assessment/start", {
    method: "POST",
    headers: {
      ...authHeaders(session),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}


export async function generateQuestion(session: UserSession, sessionId: number) {
  const response = await request<{
    question_id: number;
    question: string;
    question_type: QuestionType;
    examples?: QuestionExample[];
    difficulty: "easy" | "medium" | "hard";
  }>(`/assessment/generate-question?session_id=${sessionId}`, {
    method: "POST",
    headers: {
      ...authHeaders(session),
      "Content-Type": "application/json",
    },
    body: "",
  });

  return normalizeQuestion(response);
}


export async function getCurrentQuestion(session: UserSession, sessionId: number) {
  const response = await request<{
    question_id: number;
    question?: string;
    question_type?: QuestionType;
    examples?: QuestionExample[];
    difficulty?: "easy" | "medium" | "hard";
    message?: string;
  }>(`/assessment/current-question?session_id=${sessionId}`, {
    headers: authHeaders(session),
  });

  if (!response.question || !response.question_type || !response.difficulty) {
    throw new Error(response.message ?? "Current question is unavailable");
  }

  return normalizeQuestion({
    question_id: response.question_id,
    question: response.question,
    question_type: response.question_type,
    examples: response.examples ?? [],
    difficulty: response.difficulty,
  });
}


export async function submitAnswer(
  session: UserSession,
  questionId: number,
  answerText: string,
) {
  return request<{ message: string; response_id: number }>("/assessment/submit-answer", {
    method: "POST",
    headers: {
      ...authHeaders(session),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question_id: questionId,
      answer_text: answerText,
    }),
  });
}


export async function evaluateResponse(
  session: UserSession,
  responseId: number,
): Promise<EvaluationSummary> {
  const response = await request<{
    rubric_scores: Record<string, number>;
    final_score: number;
    ai_feedback: string;
    session_completed: boolean;
    session_average_score?: number;
    has_next_question?: boolean;
    next_question?: {
      question_id: number;
      question: string;
      question_type: QuestionType;
      examples?: QuestionExample[];
      difficulty: "easy" | "medium" | "hard";
    };
    message?: string;
  }>("/assessment/evaluate-response", {
    method: "POST",
    headers: {
      ...authHeaders(session),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      response_id: responseId,
    }),
  });

  return {
    ...response,
    next_question: response.next_question
      ? normalizeQuestion(response.next_question)
      : undefined,
  };
}
