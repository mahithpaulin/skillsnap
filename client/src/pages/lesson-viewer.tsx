import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const DEMO_USER_ID = "user-1";

type QuizQuestion = {
  id: string;
  lessonId: string;
  question: string;
  options: string[];
  orderIndex: number;
};

type QuizFeedback = {
  questionId: string;
  selected: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string | null;
};

export default function LessonViewer() {
  const [, params] = useRoute("/lesson/:id");
  const [, navigate] = useLocation();
  const [currentSection, setCurrentSection] = useState(0);
  const [startTime] = useState(() => Date.now());
  const [isCompleting, setIsCompleting] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; feedback: QuizFeedback[]; newAchievements: string[] } | null>(null);
  const { toast } = useToast();

  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: ["/api/lessons", params?.id],
    enabled: !!params?.id,
  });

  const { data: user } = useQuery({ queryKey: ["/api/users", DEMO_USER_ID] });

  const { data: userLesson } = useQuery({
    queryKey: ["/api/users", DEMO_USER_ID, "lessons", params?.id],
    enabled: !!params?.id,
  });

  const { data: quizQuestions } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/lessons", params?.id, "quiz"],
    enabled: !!params?.id,
  });

  const { data: latestAttempt } = useQuery({
    queryKey: ["/api/users", DEMO_USER_ID, "quiz-attempts", params?.id],
    enabled: !!params?.id,
  });

  const completeLesson = useMutation({
    mutationFn: async () => {
      if (!params?.id) throw new Error("Lesson ID is required");
      const timeSpentMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      if (userLesson) {
        return apiRequest("PATCH", `/api/user-lessons/${userLesson.id}`, {
          status: "completed", timeSpent: timeSpentMinutes, completedAt: new Date(),
        });
      } else {
        return apiRequest("POST", `/api/users/${DEMO_USER_ID}/lessons`, {
          lessonId: params.id, status: "completed", timeSpent: timeSpentMinutes, completedAt: new Date(),
        });
      }
    },
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.newAchievements?.length > 0) {
        toast({ title: "Achievement Unlocked! 🏆", description: data.newAchievements.join(", ") });
      }
      toast({ title: "Lesson Completed! 🎉", description: "Great job! Take the quiz to reinforce your learning." });
      await queryClient.invalidateQueries({ queryKey: ["/api/users", DEMO_USER_ID, "dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/users", DEMO_USER_ID] });
      await queryClient.invalidateQueries({ queryKey: ["/api/users", DEMO_USER_ID, "lessons"] });
      await queryClient.refetchQueries({ queryKey: ["/api/users", DEMO_USER_ID, "dashboard"], type: "active" });
      setIsCompleting(false);

      // Show quiz if available
      if (quizQuestions && quizQuestions.length > 0) {
        setShowQuiz(true);
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message ?? "Failed to complete lesson", variant: "destructive" });
      setIsCompleting(false);
    },
  });

  const submitQuiz = useMutation({
    mutationFn: async () => {
      if (!params?.id || !quizQuestions) throw new Error("Missing data");
      const answers = quizQuestions.map((_, i) => quizAnswers[i] ?? -1);
      const res = await apiRequest("POST", `/api/users/${DEMO_USER_ID}/quiz-attempts`, {
        lessonId: params.id,
        answers,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setQuizResult(data);
      if (data.newAchievements?.length > 0) {
        toast({ title: "Achievement Unlocked! 🏆", description: data.newAchievements.join(", ") });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users", DEMO_USER_ID, "quiz-attempts", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", DEMO_USER_ID, "spaced-repetition"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", DEMO_USER_ID, "dashboard"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to submit quiz", variant: "destructive" }),
  });

  const handleNext = () => {
    if (!lesson) return;
    const content = JSON.parse(lesson.content || '{"sections":[]}');
    const sections = content.sections || [];
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else if (!isCompleting && userLesson?.status !== "completed") {
      setIsCompleting(true);
      completeLesson.mutate();
    } else if (userLesson?.status === "completed" && quizQuestions && quizQuestions.length > 0 && !showQuiz) {
      setShowQuiz(true);
    }
  };

  if (lessonLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader user={user ?? null} />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader user={user ?? null} />
        <main className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-destructive">Lesson not found</p>
        </main>
      </div>
    );
  }

  const content = JSON.parse(lesson.content || '{"sections":[]}');
  const sections = content.sections || [];
  const videoUrl: string | undefined = content.videoUrl;
  const progress = ((currentSection + 1) / sections.length) * 100;
  const allAnswered = quizQuestions ? quizQuestions.every((_, i) => quizAnswers[i] !== undefined) : false;

  // Quiz results screen
  if (quizResult) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader user={user ?? null} />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{quizResult.score === 100 ? "🎯" : quizResult.score >= 70 ? "✅" : "📖"}</div>
            <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-5xl font-bold text-primary mb-2">{quizResult.score}%</p>
            <p className="text-muted-foreground">
              {quizResult.score === 100 ? "Perfect score! Outstanding!" : quizResult.score >= 70 ? "Great job! Keep it up!" : "Good effort! Review the explanations below."}
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {quizResult.feedback.map((fb, i) => (
              <Card key={fb.questionId} className={fb.isCorrect ? "border-green-300 bg-green-50 dark:bg-green-900/10" : "border-red-300 bg-red-50 dark:bg-red-900/10"}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-lg mt-0.5">{fb.isCorrect ? "✅" : "❌"}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground mb-1">Question {i + 1}</p>
                      {quizQuestions && <p className="text-sm text-foreground mb-2">{quizQuestions[i]?.question}</p>}
                      <p className="text-sm text-muted-foreground">
                        Your answer: <span className={fb.isCorrect ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
                          {quizQuestions?.[i]?.options[fb.selected] ?? "No answer"}
                        </span>
                      </p>
                      {!fb.isCorrect && (
                        <p className="text-sm text-green-700 dark:text-green-400">
                          Correct: <span className="font-medium">{quizQuestions?.[i]?.options[fb.correctIndex]}</span>
                        </p>
                      )}
                      {fb.explanation && (
                        <p className="text-xs text-muted-foreground mt-2 italic">{fb.explanation}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" className="flex-1" onClick={() => { setQuizResult(null); setShowQuiz(false); setQuizAnswers({}); }}>
              <i className="fas fa-redo mr-2"></i>Retake Quiz
            </Button>
            <Button className="flex-1" onClick={() => navigate("/")}>
              <i className="fas fa-home mr-2"></i>Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Quiz screen
  if (showQuiz && quizQuestions && quizQuestions.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader user={user ?? null} />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Knowledge Check</h2>
              <Badge variant="secondary">{quizQuestions.length} questions</Badge>
            </div>
            <p className="text-muted-foreground text-sm">Test what you've learned from "{lesson.title}"</p>
          </div>

          {latestAttempt && !submitQuiz.isSuccess && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6 text-sm text-blue-800 dark:text-blue-200">
              <i className="fas fa-info-circle mr-2"></i>
              Your previous score: <strong>{latestAttempt.score}%</strong>
            </div>
          )}

          <div className="space-y-6 mb-8">
            {quizQuestions.map((q, qi) => (
              <Card key={q.id}>
                <CardContent className="p-5">
                  <p className="font-semibold text-foreground mb-4">
                    <span className="text-muted-foreground text-sm mr-2">Q{qi + 1}.</span>
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((option, oi) => (
                      <button
                        key={oi}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                          quizAnswers[qi] === oi
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <span className="inline-block w-6 h-6 rounded-full border mr-3 text-center text-xs leading-6 font-medium">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {option}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setShowQuiz(false)}>
              <i className="fas fa-arrow-left mr-2"></i>Back to Lesson
            </Button>
            <Button
              className="flex-1"
              onClick={() => submitQuiz.mutate()}
              disabled={!allAnswered || submitQuiz.isPending}
            >
              {submitQuiz.isPending ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i>Submitting...</>
              ) : (
                <><i className="fas fa-check mr-2"></i>Submit Quiz ({Object.keys(quizAnswers).length}/{quizQuestions.length} answered)</>
              )}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Lesson content screen
  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader user={user ?? null} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-lesson-title">
                {lesson.title}
              </h1>
              <p className="text-muted-foreground" data-testid="text-lesson-description">
                {lesson.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{lesson.estimatedMinutes}</div>
              <div className="text-sm text-muted-foreground">minutes</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-lesson" />
          </div>
        </div>

        {/* Video embed (if available) */}
        {videoUrl && (
          <Card className="mb-6 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <i className="fas fa-play-circle text-primary"></i>
                <span>Video Introduction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={videoUrl}
                  title="Lesson video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lesson Content */}
        {sections.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span data-testid="text-section-title">{sections[currentSection]?.title}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {currentSection + 1} of {sections.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sections[currentSection]?.type === "example" ? (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code data-testid="text-section-content">{sections[currentSection]?.content}</code>
                  </pre>
                ) : (
                  <p className="text-foreground leading-relaxed" data-testid="text-section-content">
                    {sections[currentSection]?.content}
                  </p>
                )}

                {sections[currentSection]?.type === "practice" && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      <i className="fas fa-lightbulb mr-2"></i>Practice Exercise
                    </h4>
                    <p className="text-blue-800 dark:text-blue-200">{sections[currentSection]?.content}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Learning Objectives */}
        {lesson.objectives && lesson.objectives.length > 0 && (
          <Card className="mb-8">
            <CardHeader><CardTitle>What you'll learn</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {lesson.objectives.map((obj, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <i className="fas fa-check-circle text-green-500 text-sm"></i>
                    <span className="text-foreground" data-testid={`text-objective-${i}`}>{obj}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Quiz teaser if available */}
        {quizQuestions && quizQuestions.length > 0 && userLesson?.status === "completed" && (
          <Card className="mb-8 border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <p className="font-semibold text-foreground">Quiz available</p>
                  <p className="text-sm text-muted-foreground">{quizQuestions.length} questions to test your knowledge</p>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowQuiz(true)}>
                Take Quiz
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => setCurrentSection(Math.max(0, currentSection - 1))} disabled={currentSection === 0} data-testid="button-previous">
            <i className="fas fa-arrow-left mr-2"></i>Previous
          </Button>

          <div className="flex space-x-2">
            {sections.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i <= currentSection ? "bg-primary" : "bg-muted"}`}
                data-testid={`indicator-section-${i}`} />
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={completeLesson.isPending || isCompleting || (currentSection === sections.length - 1 && userLesson?.status === "completed" && (!quizQuestions || quizQuestions.length === 0))}
            data-testid="button-next"
          >
            {currentSection < sections.length - 1 ? (
              <><span>Next</span><i className="fas fa-arrow-right ml-2"></i></>
            ) : (completeLesson.isPending || isCompleting) ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Completing...</>
            ) : userLesson?.status === "completed" ? (
              quizQuestions && quizQuestions.length > 0 ? (
                <><span>Take Quiz</span><i className="fas fa-question-circle ml-2"></i></>
              ) : (
                <><span>Completed</span><i className="fas fa-check ml-2"></i></>
              )
            ) : (
              <><span>Complete</span><i className="fas fa-check ml-2"></i></>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
