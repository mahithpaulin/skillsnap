import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import LessonViewer from "@/pages/lesson-viewer";
import Skills from "@/pages/skills";
import Achievements from "@/pages/achievements";
import StudyGroups from "@/pages/study-groups";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/lesson/:id" component={LessonViewer} />
      <Route path="/skills" component={Skills} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/groups" component={StudyGroups} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
