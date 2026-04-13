import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeft, Send, Sparkles } from "lucide-react";

import { useSkillProof } from "../context/SkillProofContext";
import { evaluateResponse, getCurrentQuestion, submitAnswer } from "../lib/api";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { ThemeToggle } from "../components/ThemeToggle";


export function TheoryQuestionPage() {
  const navigate = useNavigate();
  const { assessment, session, setCurrentQuestion, setLatestEvaluation, updateAssessment } = useSkillProof();
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

  const currentQuestion = assessment.currentQuestion;

  useEffect(() => {
    if (!session) {
      navigate("/login");
      return;
    }

    if (!assessment.sessionId) {
      navigate("/dashboard");
      return;
    }

    if (currentQuestion) {
      return;
    }

    setIsLoadingQuestion(true);
    getCurrentQuestion(session, assessment.sessionId)
      .then((question) => {
        setCurrentQuestion(question);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load question");
      })
      .finally(() => {
        setIsLoadingQuestion(false);
      });
  }, [assessment.sessionId, currentQuestion, navigate, session, setCurrentQuestion]);

  const handleSubmit = async () => {
    if (!session || !currentQuestion) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const responseId =
        assessment.currentResponseId ??
        (await submitAnswer(session, currentQuestion.question_id, answer)).response_id;

      updateAssessment({
        currentResponseId: responseId,
      });

      const evaluation = await evaluateResponse(session, responseId);

      updateAssessment({
        currentResponseId: null,
      });
      setLatestEvaluation(evaluation);

      if (evaluation.next_question) {
        setCurrentQuestion(evaluation.next_question);
      } else if (evaluation.session_completed) {
        setCurrentQuestion(null);
      }

      navigate(evaluation.session_completed ? "/results" : "/evaluation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentQuestion && isLoadingQuestion) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading question...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Back</span>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">SkillProof</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button size="sm" className="gap-2" onClick={handleSubmit} disabled={isSubmitting || !answer.trim()}>
                <Send className="w-4 h-4" />
                {isSubmitting ? "Grading Carefully..." : "Submit Answer"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-accent/10 text-accent text-xs rounded-full">Theory</span>
            <span className="text-sm text-muted-foreground">
              Difficulty: {currentQuestion?.difficulty ?? "medium"}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-4">
            {currentQuestion?.question ?? "Your theory question will appear here."}
          </h1>
          <p className="text-muted-foreground">
            Take your time to provide a thoughtful answer. Your response will be evaluated by the backend AI flow.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Question Details</h2>
          <div className="space-y-4 text-foreground/90">
            <p>Strong theory answers usually:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use precise technical terminology</li>
              <li>Show real understanding instead of short definitions</li>
              <li>Include tradeoffs or examples where useful</li>
              <li>Stay directly focused on the asked skill</li>
            </ul>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
          <h3 className="font-semibold mb-3 text-primary">Guidelines for a Strong Answer</h3>
          <div className="space-y-2 text-sm">
            <p>• Be specific and use technical terminology appropriately</p>
            <p>• Provide examples where they help explain your reasoning</p>
            <p>• Show both conceptual understanding and practical judgment</p>
            <p>• Structure the answer so the evaluator can follow it easily</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-semibold">Your Answer</label>
            <span className="text-sm text-muted-foreground">
              {answer.length} characters
            </span>
          </div>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[400px] bg-background resize-none text-base leading-relaxed"
            spellCheck={false}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {isSubmitting ? (
            <p className="text-sm text-muted-foreground">
              Your answer is so special we are making sure to grade it properly.
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button variant="outline" disabled>Save Draft</Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" disabled>Skip Question</Button>
            <Button className="gap-2" onClick={handleSubmit} disabled={isSubmitting || !answer.trim()}>
              <Send className="w-4 h-4" />
              {isSubmitting ? "Grading Carefully..." : "Submit Answer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
