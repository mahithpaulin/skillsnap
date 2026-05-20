import { useQuery } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { SkillCard } from "@/components/skill-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const DEMO_USER_ID = "user-1";

export default function Skills() {
  const { data: user } = useQuery({
    queryKey: ["/api/users", DEMO_USER_ID],
  });

  const { data: userSkills, isLoading: userSkillsLoading } = useQuery({
    queryKey: ["/api/users", DEMO_USER_ID, "skills"],
  });

  const { data: skillCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/skill-categories"],
  });

  const { data: allSkills, isLoading: allSkillsLoading } = useQuery({
    queryKey: ["/api/skills"],
  });

  const isLoading = userSkillsLoading || categoriesLoading || allSkillsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader user={user || null} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const userSkillIds = userSkills?.map((us: any) => us.skillId) || [];
  const availableSkills = allSkills?.filter((skill: any) => !userSkillIds.includes(skill.id)) || [];

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader user={user || null} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Skills</h1>
          <p className="text-muted-foreground">
            Track your progress and discover new skills to learn
          </p>
        </div>

        {/* Current Skills */}
        {userSkills && userSkills.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Current Skills</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userSkills.map((userSkill: any) => (
                <SkillCard
                  key={userSkill.id}
                  userSkill={userSkill}
                  skill={userSkill.skill}
                  category={userSkill.category}
                />
              ))}
            </div>
          </section>
        )}

        {/* Skill Categories */}
        {skillCategories && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Explore Skills by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skillCategories.map((category: any) => {
                const categorySkills = allSkills?.filter((skill: any) => skill.categoryId === category.id) || [];
                const categoryColor = category.color || 'blue';
                
                return (
                  <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-category-${category.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <div className={`bg-${categoryColor}-100 dark:bg-${categoryColor}-900 text-${categoryColor}-600 dark:text-${categoryColor}-400 p-3 rounded-lg`}>
                          <i className={`${category.icon} text-xl`}></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">{category.name}</h3>
                          <p className="text-sm text-muted-foreground font-normal">{category.description}</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{categorySkills.length} skills available</span>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                          Explore <i className="fas fa-arrow-right ml-1"></i>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Available Skills */}
        {availableSkills.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Available Skills</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableSkills.map((skill: any) => {
                const category = skillCategories?.find((cat: any) => cat.id === skill.categoryId);
                
                return (
                  <Card key={skill.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`bg-${category?.color || 'blue'}-100 dark:bg-${category?.color || 'blue'}-900 text-${category?.color || 'blue'}-600 dark:text-${category?.color || 'blue'}-400 p-3 rounded-lg`}>
                            <i className={`${category?.icon || 'fas fa-book'} text-xl`}></i>
                          </div>
                          <div>
                            <h4 className="font-semibold text-card-foreground">{skill.name}</h4>
                            <p className="text-sm text-muted-foreground font-normal">{category?.name}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full
                          ${skill.difficulty === 'Beginner' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                            skill.difficulty === 'Intermediate' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                            'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                          {skill.difficulty}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{skill.description}</p>
                      
                      <div className="flex justify-between text-sm text-muted-foreground mb-4">
                        <span>{skill.totalLessons} lessons</span>
                        <span>~{skill.estimatedDays} days</span>
                      </div>
                      
                      <Button 
                        className="w-full"
                        data-testid={`button-start-skill-${skill.id}`}
                      >
                        Start Learning
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {userSkills?.length === 0 && availableSkills.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-graduation-cap text-4xl text-muted-foreground mb-4"></i>
            <h3 className="text-xl font-semibold text-foreground mb-2">No skills found</h3>
            <p className="text-muted-foreground">Start your learning journey by exploring available skills.</p>
          </div>
        )}
      </main>
    </div>
  );
}
