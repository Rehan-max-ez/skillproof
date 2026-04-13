export type QuestionType = "coding" | "theory";

export type Difficulty = "easy" | "medium" | "hard";

export type UserSession = {
  username: string;
  token: string;
};

export type QuestionExample = {
  input: string;
  output: string;
  explanation?: string;
};

export type AssessmentQuestion = {
  question_id: number;
  question: string;
  question_type: QuestionType;
  examples?: QuestionExample[];
  difficulty: Difficulty;
};

export type EvaluationSection = {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
  status: "excellent" | "good" | "needs-improvement";
};

export type EvaluationSummary = {
  rubric_scores: Record<string, number>;
  final_score: number;
  ai_feedback: string;
  session_completed: boolean;
  session_average_score?: number;
  has_next_question?: boolean;
  next_question?: AssessmentQuestion;
  message?: string;
};

export type AssessmentState = {
  sessionId: number | null;
  skill: string;
  currentQuestion: AssessmentQuestion | null;
  currentResponseId: number | null;
  latestEvaluation: EvaluationSummary | null;
};
