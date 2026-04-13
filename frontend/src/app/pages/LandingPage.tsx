import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Code, Brain, Github, Sparkles, CheckCircle2, Zap, Shield, ArrowRight } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold">SkillProof</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">AI-Powered Technical Assessments</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Prove Your Skills with
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI-Driven Evaluations
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
              SkillProof is an AI-powered platform that evaluates your technical abilities through coding challenges, 
              theoretical questions, and repository analysis. Get instant, detailed feedback on your performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="gap-2">
                  Start Assessment <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="gap-2">
                  See the Flow
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comprehensive Skill Evaluation
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform assesses multiple dimensions of your technical expertise
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Coding Challenges</h3>
              <p className="text-muted-foreground">
                Solve real-world problems in a LeetCode-style environment. Support for multiple programming languages 
                with instant code execution.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Theory Questions</h3>
              <p className="text-muted-foreground">
                Demonstrate your understanding of core concepts, algorithms, design patterns, and best practices 
                through comprehensive questions.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Github className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Repository Analysis</h3>
              <p className="text-muted-foreground">
                Submit your GitHub repositories for AI-powered code review. Get insights on code quality, 
                architecture, and best practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, straightforward process to assess and improve your skills
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Sign Up", desc: "Create your account in seconds" },
              { step: "02", title: "Choose Assessment", desc: "Select from coding, theory, or repository review" },
              { step: "03", title: "Complete Tasks", desc: "Solve problems and answer questions" },
              { step: "04", title: "Get Feedback", desc: "Receive detailed AI-powered evaluation" },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Choose SkillProof?
              </h2>
              <div className="space-y-4">
                {[
                  { icon: CheckCircle2, text: "Instant AI-powered feedback on your solutions" },
                  { icon: Zap, text: "Real-world coding challenges from top companies" },
                  { icon: Shield, text: "Comprehensive evaluation of multiple skill areas" },
                  { icon: Sparkles, text: "Personalized improvement recommendations" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <item.icon className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-lg">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg"></div>
                  <div className="flex gap-2">
                    <div className="h-10 bg-primary/20 rounded flex-1"></div>
                    <div className="h-10 bg-accent/20 rounded flex-1"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-primary to-accent p-[1px] rounded-2xl">
            <div className="bg-card rounded-2xl p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to be certified?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Step into a clean assessment flow, answer adaptive questions, and leave with a polished AI-backed result.
              </p>
              <Link to="/signup">
                <Button size="lg" className="gap-2">
                  Start Your Assessment <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold">SkillProof</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 SkillProof. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
