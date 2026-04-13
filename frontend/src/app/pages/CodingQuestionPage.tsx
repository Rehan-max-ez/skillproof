import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Sparkles, Play, Send, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "../components/ThemeToggle";
import { evaluateResponse, getCurrentQuestion, submitAnswer } from "../lib/api";
import { useSkillProof } from "../context/SkillProofContext";

export function CodingQuestionPage() {
  const navigate = useNavigate();
  const { assessment, session, setCurrentQuestion, setLatestEvaluation, updateAssessment } = useSkillProof();
  const [code, setCode] = useState("");
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
        (await submitAnswer(session, currentQuestion.question_id, code)).response_id;

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
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit answer",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentQuestion && isLoadingQuestion) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading question...</div>;
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm z-50">
        <div className="px-4 sm:px-6 lg:px-8">
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
              <Button variant="outline" size="sm" className="gap-2" disabled>
                <Play className="w-4 h-4" />
                Run Code
              </Button>
              <Button size="sm" className="gap-2" onClick={handleSubmit} disabled={isSubmitting || !code.trim()}>
                <Send className="w-4 h-4" />
                {isSubmitting ? "Grading Carefully..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Problem Description */}
        <div className="w-1/2 border-r border-border overflow-y-auto">
          <div className="p-6">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
                <TabsTrigger value="constraints">Constraints</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Coding Challenge</h1>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 bg-accent/10 text-accent text-xs rounded-full">
                      {currentQuestion?.difficulty ?? "medium"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {assessment.skill || "Skill assessment"} • LeetCode-style layout
                    </span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-foreground/90 leading-relaxed">
                    {currentQuestion?.question ?? "Your coding question will appear here."}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="examples" className="space-y-6">
                {currentQuestion?.examples && currentQuestion.examples.length > 0 ? (
                  currentQuestion.examples.map((example, index) => (
                    <div key={`${example.input}-${index}`} className="p-4 bg-muted/30 rounded-lg border border-border">
                      <p className="font-semibold mb-3">Example {index + 1}</p>
                      <div className="space-y-2 font-mono text-sm">
                        <div>
                          <span className="text-muted-foreground">Input:</span>
                          <span className="ml-2 whitespace-pre-wrap">{example.input}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Output:</span>
                          <span className="ml-2 whitespace-pre-wrap">{example.output}</span>
                        </div>
                        {example.explanation ? (
                          <div>
                            <span className="text-muted-foreground">Explanation:</span>
                            <span className="ml-2 whitespace-pre-wrap">{example.explanation}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <p className="font-semibold mb-3">What to focus on</p>
                    <div className="space-y-2 text-sm text-foreground/90">
                      <p>Explain your approach clearly in code.</p>
                      <p>Handle common edge cases where relevant.</p>
                      <p>Favor readable, production-quality solutions.</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="constraints" className="space-y-4">
                <div className="space-y-3">
                  <p className="font-semibold mb-4">Evaluation rubric</p>
                  <ul className="space-y-2 list-disc list-inside text-foreground/90">
                    <li>Correctness</li>
                    <li>Time complexity</li>
                    <li>Edge case handling</li>
                    <li>Readability</li>
                  </ul>
                </div>

                <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="font-semibold mb-2 text-primary">Note</p>
                  <p className="text-sm text-foreground/90">
                    The next question difficulty adapts based on your current answer.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Side - Code Editor */}
        <div className="w-1/2 flex flex-col">
          <div className="border-b border-border p-4 flex items-center justify-between bg-card/30">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Language:</span>
              <span className="rounded-md border border-border px-3 py-2 text-sm capitalize">
                {assessment.skill || "python"}
              </span>
            </div>
          </div>

          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="absolute inset-0 w-full h-full p-6 bg-background font-mono text-sm resize-none focus:outline-none border-0"
              style={{ fontFamily: "var(--font-jetbrains)" }}
              spellCheck="false"
            />
          </div>

          <div className="border-t border-border bg-card/30">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Test Results</span>
                <span className="text-xs text-muted-foreground">Code execution is layout-only for now</span>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg border border-border min-h-[100px] flex items-center justify-center text-sm text-muted-foreground">
                {isSubmitting
                  ? "Your answer is so special we are making sure to grade it properly."
                  : error || 'Click "Submit" to send your solution for evaluation'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
