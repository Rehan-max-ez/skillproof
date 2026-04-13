import { Link, useNavigate } from "react-router";
import { Share2, Sparkles, Target, Trophy, TrendingUp } from "lucide-react";

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


export function FinalResultsPage() {
  const navigate = useNavigate();
  const { assessment, resetAssessment } = useSkillProof();
  const evaluation = assessment.latestEvaluation;

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <p>No final results are available yet.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const sectionEntries = Object.entries(evaluation.rubric_scores);
  const finalScore = evaluation.session_average_score ?? evaluation.final_score;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold">SkillProof</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" size="sm" className="gap-2" disabled>
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary via-primary to-accent rounded-full mb-6 relative">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Assessment Complete</h1>
          <p className="text-xl text-muted-foreground">
            You finished the adaptive SkillProof flow for <span className="capitalize">{assessment.skill || "your chosen skill"}</span>.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle>Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold text-primary">{finalScore}</div>
                <div className="text-muted-foreground">Average across the completed assessment</div>
                <Progress value={finalScore * 10} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary" />
                  <span>Skill</span>
                </div>
                <span className="font-semibold capitalize">{assessment.skill || "Unknown"}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <span>Session ID</span>
                </div>
                <span className="font-semibold">{assessment.sessionId}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Latest Rubric Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sectionEntries.map(([key, score]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{toSectionName(key)}</span>
                    <span className="text-sm font-semibold">{score}/10</span>
                  </div>
                  <Progress value={score * 10} className="h-3" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-12 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Final AI Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 leading-relaxed">
              {evaluation.ai_feedback || "No detailed feedback was returned."}
            </p>
          </CardContent>
        </Card>

        <div className="text-center">
          <div className="flex items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button
                size="lg"
                className="gap-2"
                onClick={() => {
                  resetAssessment();
                }}
              >
                Take Another Assessment
                <TrendingUp className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
