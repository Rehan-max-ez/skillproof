import { Link, useNavigate } from "react-router";
import { ArrowRight, CheckCircle2, ChevronLeft, Lightbulb, Sparkles, TrendingUp } from "lucide-react";

import { useSkillProof } from "../context/SkillProofContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { ThemeToggle } from "../components/ThemeToggle";


function toSectionName(key: string) {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}


export function EvaluationPage() {
  const navigate = useNavigate();
  const { assessment } = useSkillProof();
  const evaluation = assessment.latestEvaluation;

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <p>No evaluation data is available yet.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const sections = Object.entries(evaluation.rubric_scores).map(([key, score]) => ({
    name: toSectionName(key),
    score,
  }));

  const nextRoute =
    evaluation.next_question?.question_type === "coding"
      ? "/assessment/coding"
      : "/assessment/theory";

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold">SkillProof</span>
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Question Evaluation</h1>
          <p className="text-lg text-muted-foreground">
            Your latest answer has been scored and reviewed.
          </p>
        </div>

        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="inline-flex items-baseline gap-2">
                <span className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {evaluation.final_score}
                </span>
                <span className="text-2xl text-muted-foreground">/ 10</span>
              </div>
              <Progress value={evaluation.final_score * 10} className="h-3 mt-6" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 mb-8">
          {sections.map((section) => (
            <Card key={section.name}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{section.name}</h3>
                  <span className="text-sm font-medium">{section.score}/10</span>
                </div>
                <Progress value={section.score * 10} className="h-2 mb-3" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              AI Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 leading-relaxed">
              {evaluation.ai_feedback || "No detailed feedback was returned."}
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-4">
          {evaluation.session_completed ? (
            <Link to="/results">
              <Button size="lg" className="gap-2">
                View Final Results
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <Button size="lg" className="gap-2" onClick={() => navigate(nextRoute)}>
              Continue Assessment
              <TrendingUp className="w-4 h-4" />
            </Button>
          )}
          <Link to="/dashboard">
            <Button size="lg" variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
