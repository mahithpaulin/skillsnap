import { Card, CardContent } from "@/components/ui/card";

interface SkillCardProps {
  userSkill: {
    id: string;
    status: string;
    progress: number;
    lessonsCompleted: number;
  };
  skill: {
    id: string;
    name: string;
    totalLessons: number;
  } | undefined;
  category: {
    name: string;
    icon: string;
    color: string;
  } | undefined;
}

export function SkillCard({ userSkill, skill, category }: SkillCardProps) {
  if (!skill || !category) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300';
    }
  };

  const getProgressColor = () => {
    switch (category.color) {
      case 'blue':
        return 'bg-blue-500';
      case 'green':
        return 'bg-green-500';
      case 'purple':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getCategoryIconColor = () => {
    switch (category.color) {
      case 'blue':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400';
      case 'green':
        return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400';
      case 'purple':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400';
      default:
        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400';
    }
  };

  const remainingLessons = skill.totalLessons - userSkill.lessonsCompleted;

  return (
    <Card 
      className="shadow-sm hover:shadow-md transition-shadow skill-category cursor-pointer"
      data-testid={`card-skill-${skill.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${getCategoryIconColor()}`}>
              <i className={`${category.icon} text-xl`}></i>
            </div>
            <div>
              <h4 className="font-semibold text-card-foreground" data-testid="text-skill-name">
                {skill.name}
              </h4>
              <p className="text-sm text-muted-foreground">{category.name}</p>
            </div>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(userSkill.status)}`}>
            {userSkill.status.charAt(0).toUpperCase() + userSkill.status.slice(1)}
          </span>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground" data-testid="text-skill-progress">
              {userSkill.progress}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor()}`}
              style={{ width: `${userSkill.progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-muted-foreground">
          <span data-testid="text-lessons-completed">
            {userSkill.lessonsCompleted} lessons completed
          </span>
          <span data-testid="text-lessons-remaining">
            {remainingLessons} lessons remaining
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
