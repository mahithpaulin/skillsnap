import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    estimatedMinutes: number;
    objectives: string[];
  };
}

export function LessonCard({ lesson }: LessonCardProps) {
  return (
    <Card className="overflow-hidden lesson-card shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm font-medium mb-3">
              JavaScript
            </span>
            <h4 className="text-xl font-bold mb-2" data-testid="text-lesson-title">
              {lesson.title}
            </h4>
            <p className="text-blue-100" data-testid="text-lesson-description">
              {lesson.description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{lesson.estimatedMinutes}</div>
            <div className="text-sm text-blue-100">minutes</div>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-clock text-muted-foreground"></i>
              <span className="text-sm text-muted-foreground">
                Estimated: {lesson.estimatedMinutes} min
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-signal text-muted-foreground"></i>
              <span className="text-sm text-muted-foreground" data-testid="text-lesson-difficulty">
                {lesson.difficulty}
              </span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground font-medium">Not Started</div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h5 className="font-semibold text-foreground mb-2">What you'll learn:</h5>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {lesson.objectives.map((objective, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <i className="fas fa-check-circle text-green-500 text-xs"></i>
                  <span data-testid={`text-objective-${index}`}>{objective}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <Link href={`/lesson/${lesson.id}`}>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              data-testid="button-start-lesson"
            >
              Start Lesson
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
