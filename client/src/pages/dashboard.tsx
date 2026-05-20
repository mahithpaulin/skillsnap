import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { NavigationHeader } from "@/components/navigation-header";
import { ProgressRing } from "@/components/progress-ring";
import { LessonCard } from "@/components/lesson-card";
import { SkillCard } from "@/components/skill-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const DEMO_USER_ID = "user-1";

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/users", DEMO_USER_ID, "dashboard"],
  });

  const { data: recommendations } = useQuery({
    queryKey: ["/api/users", DEMO_USER_ID, "recommendations"],
    enabled: !!dashboardData,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader user={null} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
            </div>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader user={null} />
        <main className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-destructive">Failed to load dashboard data</p>
        </main>
      </div>
    );
  }

  const { user, todayProgress, userSkills, todaysLesson, dueReviews = [], recentAchievements = [] } = dashboardData;
  const todayPercentage = Math.min(100, Math.round(((todayProgress.minutesLearned ?? 0) / 5) * 100));

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Welcome */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Good morning, {user.firstName}! 👋
              </h2>
              <p className="text-muted-foreground">Ready for your daily 5-minute learning session?</p>
            </div>
            {todaysLesson && (
              <Link href={`/lesson/${todaysLesson.id}`}>
                <Button className="mt-4 md:mt-0 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 font-semibold" data-testid="button-start-todays-lesson">
                  <i className="fas fa-play mr-2"></i>Start Today's Lesson
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-card-foreground">Today's Goal</h3>
                <ProgressRing percentage={todayPercentage} size={48} strokeWidth={4} data-testid="progress-today" />
              </div>
              <p className="text-2xl font-bold text-green-600" data-testid="text-today-minutes">
                {todayProgress.minutesLearned ?? 0} min
              </p>
              <p className="text-xs text-muted-foreground">of 5 min daily goal</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-card-foreground">Streak</h3>
                <i className="fas fa-fire text-2xl text-orange-500"></i>
              </div>
              <p className="text-2xl font-bold text-orange-600" data-testid="text-streak-count">
                {user.streakCount ?? 0} days
              </p>
              <p className="text-xs text-muted-foreground">Keep it up! 🔥</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-card-foreground">Skills Mastered</h3>
                <i className="fas fa-trophy text-2xl text-yellow-500"></i>
              </div>
              <p className="text-2xl font-bold text-primary" data-testid="text-skills-completed">
                {user.skillsCompleted ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">across {userSkills.length} active</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-card-foreground">Total XP</h3>
                <i className="fas fa-star text-2xl text-yellow-400"></i>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {user.totalXp ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">experience points</p>
            </CardContent>
          </Card>
        </section>

        {/* Due for Review (Spaced Repetition) */}
        {dueReviews.length > 0 && (
          <section className="mb-8">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
              <div className="flex items-start space-x-3 mb-4">
                <div className="bg-amber-100 dark:bg-amber-800 rounded-lg p-2 shrink-0">
                  <i className="fas fa-brain text-amber-700 dark:text-amber-200 text-lg"></i>
                </div>
                <div>
                  <h3 className="font-bold text-amber-900 dark:text-amber-100">
                    {dueReviews.length} Lesson{dueReviews.length > 1 ? "s" : ""} Due for Review
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Spaced repetition helps lock in what you've learned</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {dueReviews.map((sr: any) => (
                  <Link key={sr.id} href={`/lesson/${sr.lessonId}`}>
                    <Button variant="outline" size="sm" className="border-amber-300 bg-white dark:bg-amber-900/30 hover:bg-amber-50">
                      <i className="fas fa-redo mr-2 text-xs"></i>
                      {sr.lesson?.title ?? "Review Lesson"}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* AI Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <section className="mb-8">
            <div className="bg-gradient-to-r from-primary to-purple-600 rounded-xl p-6 text-primary-foreground">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 rounded-lg p-3 shrink-0">
                  <i className="fas fa-robot text-xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">AI Recommendations for You</h3>
                  <p className="text-primary-foreground/90 mb-4" data-testid="text-ai-recommendation">
                    Based on your learning pattern, we suggest{" "}
                    <span className="font-semibold">{recommendations[0]?.skillName || "new skills"}</span>.{" "}
                    {recommendations[0]?.reason}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.slice(0, 3).map((rec: any, i: number) => (
                      <span key={i} className="bg-white/20 px-3 py-1 rounded-full text-sm" data-testid={`tag-recommendation-${i}`}>
                        {rec.skillName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Today's Lesson */}
        {todaysLesson && (
          <section className="mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Today's Lesson</h3>
            <LessonCard lesson={todaysLesson} />
          </section>
        )}

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground">Recent Achievements</h3>
              <Link href="/achievements">
                <Button variant="ghost" size="sm" className="text-primary">
                  View all <i className="fas fa-arrow-right ml-1"></i>
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentAchievements.map((ua: any) => (
                <Card key={ua.id} className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <span className="text-3xl">{ua.achievement?.icon ?? "🏆"}</span>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{ua.achievement?.name}</p>
                      <p className="text-xs text-muted-foreground">{ua.achievement?.description}</p>
                      <Badge variant="secondary" className="text-xs mt-1">+{ua.achievement?.xpReward} XP</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Your Skills */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-foreground">Your Skills</h3>
            <Link href="/skills">
              <Button variant="ghost" size="sm" className="text-primary" data-testid="button-view-all-skills">
                View All <i className="fas fa-arrow-right ml-1"></i>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userSkills.slice(0, 3).map((us: any) => (
              <SkillCard key={us.id} userSkill={us} skill={us.skill} category={us.category} />
            ))}
          </div>
        </section>

        {/* Study Groups CTA */}
        <section className="mb-8">
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-3xl">👥</span>
                <div>
                  <h4 className="font-bold text-foreground">Learn With Friends</h4>
                  <p className="text-sm text-muted-foreground">Join a study group to stay accountable and share progress</p>
                </div>
              </div>
              <Link href="/groups">
                <Button variant="outline" className="border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 shrink-0">
                  Explore Groups
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
