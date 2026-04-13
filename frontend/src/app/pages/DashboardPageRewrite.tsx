import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Brain, Code, Github, Play, ShieldCheck, Sparkles, Target, Trophy } from "lucide-react";

import { generateQuestion, startAssessment } from "../lib/api";
import { useSkillProof } from "../context/SkillProofContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ThemeToggle } from "../components/ThemeToggle";


export function DashboardPage() {
  const navigate = useNavigate();
  const { session, resetAssessment, updateAssessment } = useSkillProof();
  const [skill, setSkill] = useState("python");
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate("/login");
    }
  }, [navigate, session]);

  const beginAssessment = async () => {
    if (!session) {
      navigate("/login");
      return;
    }

    setError("");
    setIsStarting(true);
    resetAssessment();

    try {
      const started = await startAssessment(session, {
        skill: skill.trim(),
      });
      const question = await generateQuestion(session, started.session_id);

      updateAssessment({
        sessionId: started.session_id,
        skill: skill.trim(),
        currentQuestion: question,
        currentResponseId: null,
        latestEvaluation: null,
      });

      navigate(question.question_type === "coding" ? "/assessment/coding" : "/assessment/theory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start assessment");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold">SkillProof</span>
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">
                Welcome, {session?.username ?? "Developer"}
              </span>
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {(session?.username?.[0] ?? "D").toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Ready to be certified?</h1>
          <p className="text-muted-foreground">
            Start a real assessment flow and let SkillProof turn your answers into a polished technical evaluation.
          </p>
        </div>

        <Card className="mb-10 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10">
          <CardContent className="pt-8">
            <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-8 items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-muted-foreground mb-5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Adaptive technical assessment
                </div>
                <h2 className="text-3xl font-bold mb-4">Choose your skill and begin the certification-style flow</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl">
                  You’ll get an AI-generated first question, then adaptive follow-ups based on your answers, followed by detailed evaluation and a final result page.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-border bg-card/70 p-4">
                    <Code className="w-5 h-5 text-primary mb-3" />
                    <p className="font-medium mb-1">Coding layout</p>
                    <p className="text-sm text-muted-foreground">LeetCode-style split screen for coding questions.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card/70 p-4">
                    <Brain className="w-5 h-5 text-accent mb-3" />
                    <p className="font-medium mb-1">Theory layout</p>
                    <p className="text-sm text-muted-foreground">Focused long-form answer page for conceptual questions.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card/70 p-4">
                    <Trophy className="w-5 h-5 text-primary mb-3" />
                    <p className="font-medium mb-1">Final results</p>
                    <p className="text-sm text-muted-foreground">Structured scoring, AI feedback, and session summary.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-lg">
                <CardTitle className="mb-2">Start assessment</CardTitle>
                <CardDescription className="mb-6">
                  Pick the skill you want to be assessed on and we’ll route you into the right question layout automatically.
                </CardDescription>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="skill">Choose skill</Label>
                    <Input
                      id="skill"
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      placeholder="python, fastapi, sql, system design..."
                      className="bg-background"
                    />
                  </div>
                  <Button onClick={beginAssessment} disabled={isStarting || !skill.trim()} className="w-full gap-2">
                    <Play className="w-4 h-4" />
                    {isStarting ? "Starting..." : "Start Assessment"}
                  </Button>
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                  <p className="text-sm text-muted-foreground">
                    We’ll generate the first question from your chosen skill, then route you to the coding or theory layout automatically.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <button type="button" onClick={beginAssessment} className="group text-left">
            <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Code className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Coding Challenge</CardTitle>
                <CardDescription>Enter the LeetCode-style workspace when the backend gives you a coding question.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full gap-2 group-hover:bg-primary/10">
                  <Play className="w-4 h-4" />
                  Start Coding Flow
                </Button>
              </CardContent>
            </Card>
          </button>

          <button type="button" onClick={beginAssessment} className="group text-left">
            <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Brain className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Theory Questions</CardTitle>
                <CardDescription>Switch into the clean long-answer layout whenever the backend serves a theory prompt.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full gap-2 group-hover:bg-accent/10">
                  <Play className="w-4 h-4" />
                  Start Theory Flow
                </Button>
              </CardContent>
            </Card>
          </button>

          <div className="group">
            <Card className="h-full opacity-70">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Github className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Repository Review</CardTitle>
                <CardDescription>The GitHub repo submission step is reserved for the later extension of the flow.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full gap-2" disabled>
                  <Target className="w-4 h-4" />
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
