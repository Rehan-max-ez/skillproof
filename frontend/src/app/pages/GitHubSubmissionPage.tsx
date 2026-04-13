import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Sparkles, ChevronLeft, Send, Github, FileCode, CheckCircle2, GitBranch, FolderGit } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "../components/ThemeToggle";

export function GitHubSubmissionPage() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState("");

  const handleSubmit = () => {
    navigate("/evaluation");
  };

  const evaluationCriteria = [
    {
      icon: FileCode,
      title: "Code Quality",
      description: "Clean, readable code following best practices and design patterns",
    },
    {
      icon: GitBranch,
      title: "Architecture",
      description: "Well-structured project with proper separation of concerns",
    },
    {
      icon: CheckCircle2,
      title: "Testing",
      description: "Comprehensive test coverage and quality of test cases",
    },
    {
      icon: FolderGit,
      title: "Documentation",
      description: "Clear README, comments, and project documentation",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
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
              <Button size="sm" className="gap-2" onClick={handleSubmit} disabled={!repoUrl}>
                <Send className="w-4 h-4" />
                Submit for Review
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mx-auto mb-6">
            <Github className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            GitHub Repository Submission
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Submit your GitHub repository for comprehensive AI-powered code review and analysis
          </p>
        </div>

        {/* Repository Input */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Repository URL</CardTitle>
            <CardDescription>
              Paste the URL of your public GitHub repository
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="url"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSubmit} disabled={!repoUrl}>
                Analyze
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Make sure your repository is public so our AI can access and analyze it.
            </p>
          </CardContent>
        </Card>

        {/* What We Evaluate */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">What We Evaluate</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {evaluationCriteria.map((criteria, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <criteria.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{criteria.title}</h3>
                      <p className="text-sm text-muted-foreground">{criteria.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Evaluation Process */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI-Powered Evaluation Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-1">Repository Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI scans your entire codebase, analyzing file structure, dependencies, and code patterns
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-1">Code Quality Assessment</h4>
                  <p className="text-sm text-muted-foreground">
                    Evaluation of code style, best practices, design patterns, and maintainability
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-1">Detailed Feedback</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive comprehensive feedback with specific suggestions for improvement
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <div className="mt-12 p-6 bg-card border border-border rounded-xl">
          <h3 className="font-semibold mb-4">Tips for Better Results</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">•</span>
              <span>Include a comprehensive README.md with project description and setup instructions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">•</span>
              <span>Add comments to explain complex logic and design decisions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">•</span>
              <span>Organize your code with clear folder structure and naming conventions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">•</span>
              <span>Include tests to demonstrate code quality and reliability</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}