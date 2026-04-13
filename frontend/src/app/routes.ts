import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CodingQuestionPage } from "./pages/CodingQuestionPage";
import { TheoryQuestionPage } from "./pages/TheoryQuestionPage";
import { GitHubSubmissionPage } from "./pages/GitHubSubmissionPage";
import { EvaluationPage } from "./pages/EvaluationPage";
import { FinalResultsPage } from "./pages/FinalResultsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/signup",
    Component: SignUpPage,
  },
  {
    path: "/dashboard",
    Component: DashboardPage,
  },
  {
    path: "/assessment/coding",
    Component: CodingQuestionPage,
  },
  {
    path: "/assessment/theory",
    Component: TheoryQuestionPage,
  },
  {
    path: "/assessment/github",
    Component: GitHubSubmissionPage,
  },
  {
    path: "/evaluation",
    Component: EvaluationPage,
  },
  {
    path: "/results",
    Component: FinalResultsPage,
  },
]);
