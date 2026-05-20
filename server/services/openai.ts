import OpenAI from "openai";

// Configured to use OpenRouter API which provides access to multiple AI models
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key",
  baseURL: "https://openrouter.ai/api/v1"
});

export interface AIRecommendation {
  skillName: string;
  reason: string;
  topics: string[];
  priority: number; // 1-5, 5 being highest
}

export interface LearningAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendedSkills: string[];
  nextTopics: string[];
  motivationalMessage: string;
}

export async function generatePersonalizedRecommendations(
  userProgress: {
    completedLessons: number;
    activeSkills: string[];
    strugglingAreas: string[];
    preferences: string[];
    learningTime: number; // minutes per day
  }
): Promise<AIRecommendation[]> {
  try {
    const prompt = `You are an AI learning advisor for college students. Based on the following user data, provide personalized skill recommendations:

User Progress:
- Completed lessons: ${userProgress.completedLessons}
- Active skills: ${userProgress.activeSkills.join(", ")}
- Struggling areas: ${userProgress.strugglingAreas.join(", ")}
- Preferences: ${userProgress.preferences.join(", ")}
- Daily learning time: ${userProgress.learningTime} minutes

Provide 3-5 skill recommendations in JSON format with this structure:
{
  "recommendations": [
    {
      "skillName": "string",
      "reason": "string explaining why this skill is recommended",
      "topics": ["array of specific topics to focus on"],
      "priority": number (1-5, 5 being highest priority)
    }
  ]
}

Focus on skills that complement their current learning path and address gaps or build on strengths.`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert learning advisor specializing in personalized skill recommendations for college students."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.recommendations || [];
  } catch (error) {
    console.error("Failed to generate AI recommendations:", error);
    return [];
  }
}

export async function analyzeLearningProgress(
  userStats: {
    streakCount: number;
    totalMinutesLearned: number;
    skillsCompleted: number;
    recentPerformance: { topic: string; score: number }[];
    learningSpeed: string; // "fast", "moderate", "slow"
  }
): Promise<LearningAnalysis> {
  try {
    const prompt = `Analyze this student's learning progress and provide insights:

Learning Stats:
- Current streak: ${userStats.streakCount} days
- Total learning time: ${userStats.totalMinutesLearned} minutes
- Skills completed: ${userStats.skillsCompleted}
- Recent performance: ${JSON.stringify(userStats.recentPerformance)}
- Learning speed: ${userStats.learningSpeed}

Provide analysis in JSON format:
{
  "strengths": ["array of identified strengths"],
  "weaknesses": ["array of areas needing improvement"],
  "recommendedSkills": ["array of skill recommendations"],
  "nextTopics": ["array of specific topics to focus on next"],
  "motivationalMessage": "encouraging message based on their progress"
}`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI learning analyst that provides constructive feedback and motivation to students."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      recommendedSkills: result.recommendedSkills || [],
      nextTopics: result.nextTopics || [],
      motivationalMessage: result.motivationalMessage || "Keep up the great work!",
    };
  } catch (error) {
    console.error("Failed to analyze learning progress:", error);
    return {
      strengths: [],
      weaknesses: [],
      recommendedSkills: [],
      nextTopics: [],
      motivationalMessage: "Keep learning and growing!",
    };
  }
}

export async function generateLessonContent(
  skillName: string,
  topic: string,
  difficulty: string,
  previousLessons: string[]
): Promise<{
  title: string;
  description: string;
  content: any;
  objectives: string[];
}> {
  try {
    const prompt = `Create a 5-minute lesson for college students on ${topic} in ${skillName} at ${difficulty} level.

Previous lessons covered: ${previousLessons.join(", ")}

Generate a structured lesson in JSON format:
{
  "title": "engaging lesson title",
  "description": "brief description of what students will learn",
  "content": {
    "sections": [
      {
        "type": "theory|example|practice",
        "title": "section title",
        "content": "section content"
      }
    ]
  },
  "objectives": ["specific learning objectives"]
}

Keep it concise but comprehensive for a 5-minute session.`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert curriculum designer creating engaging micro-lessons for college students."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      title: result.title || "New Lesson",
      description: result.description || "",
      content: result.content || { sections: [] },
      objectives: result.objectives || [],
    };
  } catch (error) {
    console.error("Failed to generate lesson content:", error);
    return {
      title: "New Lesson",
      description: "Learn something new today",
      content: { sections: [] },
      objectives: [],
    };
  }
}
