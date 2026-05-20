import { useQuery } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const DEMO_USER_ID = "user-1";

type AchievementWithStatus = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number | null;
  requirement: number;
  requirementType: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  streak: { label: "Streak", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  completion: { label: "Completion", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  quiz: { label: "Quiz", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  social: { label: "Social", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
};

export default function Achievements() {
  const { data: user } = useQuery({ queryKey: ["/api/users", DEMO_USER_ID] });
  const { data: achievements, isLoading } = useQuery<AchievementWithStatus[]>({
    queryKey: ["/api/users", DEMO_USER_ID, "achievements"],
  });

  const unlockedCount = achievements?.filter(a => a.unlocked).length ?? 0;
  const totalCount = achievements?.length ?? 0;
  const totalXp = achievements?.filter(a => a.unlocked).reduce((sum, a) => sum + (a.xpReward ?? 0), 0) ?? 0;

  const grouped = achievements?.reduce((acc, ach) => {
    if (!acc[ach.category]) acc[ach.category] = [];
    acc[ach.category].push(ach);
    return acc;
  }, {} as Record<string, AchievementWithStatus[]>);

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader user={user ?? null} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Achievements</h2>
          <p className="text-muted-foreground">Collect badges as you hit learning milestones</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{unlockedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Unlocked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{totalCount - unlockedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{totalXp}</p>
              <p className="text-xs text-muted-foreground mt-1">XP Earned</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall progress</span>
            <span className="font-medium">{unlockedCount}/{totalCount}</span>
          </div>
          <Progress value={totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0} className="h-2" />
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        )}

        {grouped && Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="text-lg font-semibold text-foreground capitalize">{category}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_LABELS[category]?.color ?? ""}`}>
                {CATEGORY_LABELS[category]?.label ?? category}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map(ach => (
                <Card
                  key={ach.id}
                  className={`transition-all ${ach.unlocked ? "border-primary/30 bg-primary/5" : "opacity-60 grayscale"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl ${ach.unlocked ? "bg-primary/10" : "bg-muted"}`}>
                        {ach.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-foreground truncate">{ach.name}</h4>
                          {ach.unlocked ? (
                            <Badge variant="default" className="text-xs ml-2 shrink-0">Unlocked</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs ml-2 shrink-0">Locked</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{ach.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-yellow-600 font-medium">+{ach.xpReward} XP</span>
                          {ach.unlocked && ach.unlockedAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(ach.unlockedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
