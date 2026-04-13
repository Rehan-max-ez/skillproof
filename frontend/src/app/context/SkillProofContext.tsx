import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { AssessmentQuestion, AssessmentState, EvaluationSummary, UserSession } from "../types";
import {
  clearStoredAssessmentState,
  getStoredAssessmentState,
  getStoredSession,
  setStoredAssessmentState,
  setStoredSession,
} from "../lib/storage";


type SkillProofContextValue = {
  session: UserSession | null;
  assessment: AssessmentState;
  setSession: (value: UserSession | null) => void;
  logout: () => void;
  updateAssessment: (value: Partial<AssessmentState>) => void;
  setCurrentQuestion: (question: AssessmentQuestion | null) => void;
  setLatestEvaluation: (evaluation: EvaluationSummary | null) => void;
  resetAssessment: () => void;
};


const emptyAssessmentState: AssessmentState = {
  sessionId: null,
  skill: "",
  currentQuestion: null,
  currentResponseId: null,
  latestEvaluation: null,
};

const SkillProofContext = createContext<SkillProofContextValue | null>(null);


export function SkillProofProvider({ children }: PropsWithChildren) {
  const [session, setSessionState] = useState<UserSession | null>(() => getStoredSession());
  const [assessment, setAssessment] = useState<AssessmentState>(() => getStoredAssessmentState());

  useEffect(() => {
    setStoredSession(session);
  }, [session]);

  useEffect(() => {
    setStoredAssessmentState(assessment);
  }, [assessment]);

  const value = useMemo<SkillProofContextValue>(
    () => ({
      session,
      assessment,
      setSession: (nextSession) => {
        setSessionState(nextSession);
      },
      logout: () => {
        setSessionState(null);
        setAssessment(emptyAssessmentState);
        clearStoredAssessmentState();
      },
      updateAssessment: (partialState) => {
        setAssessment((current) => ({
          ...current,
          ...partialState,
        }));
      },
      setCurrentQuestion: (question) => {
        setAssessment((current) => ({
          ...current,
          currentQuestion: question,
        }));
      },
      setLatestEvaluation: (evaluation) => {
        setAssessment((current) => ({
          ...current,
          latestEvaluation: evaluation,
        }));
      },
      resetAssessment: () => {
        setAssessment(emptyAssessmentState);
        clearStoredAssessmentState();
      },
    }),
    [assessment, session],
  );

  return <SkillProofContext.Provider value={value}>{children}</SkillProofContext.Provider>;
}


export function useSkillProof() {
  const context = useContext(SkillProofContext);
  if (!context) {
    throw new Error("useSkillProof must be used within SkillProofProvider");
  }

  return context;
}
