import {
  type User, type InsertUser,
  type SkillCategory, type InsertSkillCategory,
  type Skill, type InsertSkill,
  type Lesson, type InsertLesson,
  type UserSkill, type InsertUserSkill,
  type UserLesson, type InsertUserLesson,
  type DailyProgress, type InsertDailyProgress,
  type QuizQuestion, type InsertQuizQuestion,
  type QuizAttempt, type InsertQuizAttempt,
  type SpacedRepetition, type InsertSpacedRepetition,
  type Achievement, type InsertAchievement,
  type UserAchievement, type InsertUserAchievement,
  type StudyGroup, type InsertStudyGroup,
  type GroupMember, type InsertGroupMember,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser & { totalXp: number }>): Promise<User | undefined>;

  // Skill Categories
  getAllSkillCategories(): Promise<SkillCategory[]>;
  createSkillCategory(category: InsertSkillCategory): Promise<SkillCategory>;

  // Skills
  getAllSkills(): Promise<Skill[]>;
  getSkillsByCategory(categoryId: string): Promise<Skill[]>;
  getSkill(id: string): Promise<Skill | undefined>;
  createSkill(skill: InsertSkill): Promise<Skill>;

  // Lessons
  getLessonsBySkill(skillId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;

  // User Skills
  getUserSkills(userId: string): Promise<UserSkill[]>;
  getUserSkill(userId: string, skillId: string): Promise<UserSkill | undefined>;
  createUserSkill(userSkill: InsertUserSkill): Promise<UserSkill>;
  updateUserSkill(id: string, updates: Partial<InsertUserSkill>): Promise<UserSkill | undefined>;

  // User Lessons
  getUserLessons(userId: string): Promise<UserLesson[]>;
  getUserLesson(userId: string, lessonId: string): Promise<UserLesson | undefined>;
  createUserLesson(userLesson: InsertUserLesson): Promise<UserLesson>;
  updateUserLesson(id: string, updates: Partial<InsertUserLesson>): Promise<UserLesson | undefined>;

  // Daily Progress
  getDailyProgress(userId: string, date: Date): Promise<DailyProgress | undefined>;
  createDailyProgress(progress: InsertDailyProgress): Promise<DailyProgress>;
  updateDailyProgress(id: string, updates: Partial<InsertDailyProgress>): Promise<DailyProgress | undefined>;
  getUserProgressHistory(userId: string, days: number): Promise<DailyProgress[]>;

  // Quiz Questions
  getQuizQuestions(lessonId: string): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;

  // Quiz Attempts
  getQuizAttempts(userId: string, lessonId: string): Promise<QuizAttempt[]>;
  getLatestQuizAttempt(userId: string, lessonId: string): Promise<QuizAttempt | undefined>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;

  // Spaced Repetition
  getSpacedRepetition(userId: string, lessonId: string): Promise<SpacedRepetition | undefined>;
  getSpacedRepetitionDue(userId: string): Promise<SpacedRepetition[]>;
  createSpacedRepetition(sr: InsertSpacedRepetition): Promise<SpacedRepetition>;
  updateSpacedRepetition(id: string, updates: Partial<InsertSpacedRepetition>): Promise<SpacedRepetition | undefined>;

  // Achievements
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  createUserAchievement(ua: InsertUserAchievement): Promise<UserAchievement>;
  hasUserAchievement(userId: string, achievementId: string): Promise<boolean>;

  // Study Groups
  getStudyGroup(id: string): Promise<StudyGroup | undefined>;
  getStudyGroupByCode(inviteCode: string): Promise<StudyGroup | undefined>;
  getUserGroups(userId: string): Promise<StudyGroup[]>;
  createStudyGroup(group: InsertStudyGroup): Promise<StudyGroup>;
  getGroupMembers(groupId: string): Promise<GroupMember[]>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  isGroupMember(groupId: string, userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private skillCategories: Map<string, SkillCategory> = new Map();
  private skills: Map<string, Skill> = new Map();
  private lessons: Map<string, Lesson> = new Map();
  private userSkills: Map<string, UserSkill> = new Map();
  private userLessons: Map<string, UserLesson> = new Map();
  private dailyProgress: Map<string, DailyProgress> = new Map();
  private quizQuestions: Map<string, QuizQuestion> = new Map();
  private quizAttempts: Map<string, QuizAttempt> = new Map();
  private spacedRepetition: Map<string, SpacedRepetition> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private userAchievements: Map<string, UserAchievement> = new Map();
  private studyGroups: Map<string, StudyGroup> = new Map();
  private groupMembers: Map<string, GroupMember> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Skill categories
    const cats: SkillCategory[] = [
      { id: "cat-1", name: "Programming", description: "Learn programming languages and concepts", icon: "fas fa-code", color: "blue", createdAt: new Date() },
      { id: "cat-2", name: "Languages", description: "Learn new spoken languages", icon: "fas fa-language", color: "green", createdAt: new Date() },
      { id: "cat-3", name: "Design", description: "UI/UX and graphic design skills", icon: "fas fa-palette", color: "purple", createdAt: new Date() },
    ];
    cats.forEach(c => this.skillCategories.set(c.id, c));

    // Skills
    const skillsData: Skill[] = [
      { id: "skill-1", name: "JavaScript", description: "Learn modern JavaScript programming", categoryId: "cat-1", totalLessons: 22, estimatedDays: 30, difficulty: "Intermediate", createdAt: new Date() },
      { id: "skill-2", name: "Spanish", description: "Learn conversational Spanish", categoryId: "cat-2", totalLessons: 25, estimatedDays: 45, difficulty: "Beginner", createdAt: new Date() },
      { id: "skill-3", name: "UI Design", description: "Learn user interface design principles", categoryId: "cat-3", totalLessons: 25, estimatedDays: 35, difficulty: "Intermediate", createdAt: new Date() },
    ];
    skillsData.forEach(s => this.skills.set(s.id, s));

    // Lesson 1 with video support
    const lesson1: Lesson = {
      id: "lesson-1",
      skillId: "skill-1",
      title: "Understanding Array Methods",
      description: "Learn how to use map(), filter(), and reduce() effectively",
      content: JSON.stringify({
        videoUrl: "https://www.youtube.com/embed/R8rmfD9Y5-c",
        sections: [
          { type: "theory", title: "Introduction to Array Methods", content: "JavaScript arrays come with powerful built-in methods that help you transform and manipulate data efficiently. These functional methods make your code cleaner and more readable." },
          { type: "example", title: "Using map()", content: "const numbers = [1, 2, 3, 4];\nconst doubled = numbers.map(x => x * 2);\nconsole.log(doubled); // [2, 4, 6, 8]" },
          { type: "practice", title: "Try it yourself", content: "Create an array of names and use map() to convert them all to uppercase. Then use filter() to keep only names longer than 4 characters." },
        ],
      }),
      objectives: ["How to transform arrays with map()", "Filtering data with filter() method", "Reducing arrays to single values"],
      difficulty: "Intermediate",
      estimatedMinutes: 5,
      orderIndex: 1,
      createdAt: new Date(),
    };

    const lesson2: Lesson = {
      id: "lesson-2",
      skillId: "skill-1",
      title: "Promises and Async/Await",
      description: "Master asynchronous JavaScript with Promises and async/await",
      content: JSON.stringify({
        sections: [
          { type: "theory", title: "What are Promises?", content: "A Promise is an object representing the eventual completion or failure of an asynchronous operation. It lets you attach callbacks instead of passing them." },
          { type: "example", title: "Async/Await Syntax", content: "async function fetchData() {\n  try {\n    const response = await fetch('/api/data');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error(error);\n  }\n}" },
          { type: "practice", title: "Build an async function", content: "Write an async function that fetches user data from a URL and returns the user's name, handling any errors gracefully." },
        ],
      }),
      objectives: ["Understanding the Promise lifecycle", "Writing async/await functions", "Error handling with try/catch"],
      difficulty: "Intermediate",
      estimatedMinutes: 5,
      orderIndex: 2,
      createdAt: new Date(),
    };

    const lesson3: Lesson = {
      id: "lesson-3",
      skillId: "skill-2",
      title: "Basic Spanish Greetings",
      description: "Learn essential Spanish greetings and introductions",
      content: JSON.stringify({
        videoUrl: "https://www.youtube.com/embed/pLFvBREuPVE",
        sections: [
          { type: "theory", title: "Common Greetings", content: "Spanish greetings vary by time of day. 'Buenos días' is used in the morning, 'Buenas tardes' in the afternoon, and 'Buenas noches' in the evening or night." },
          { type: "example", title: "Greeting Dialogue", content: "A: ¡Buenos días! ¿Cómo estás?\nB: ¡Muy bien, gracias! ¿Y tú?\nA: Estoy bien. Me llamo Carlos.\nB: Mucho gusto, Carlos. Soy María." },
          { type: "practice", title: "Practice conversation", content: "Write a short dialogue introducing yourself to a new Spanish-speaking friend. Include your name, how you are, and where you are from (Soy de...)." },
        ],
      }),
      objectives: ["Common time-based greetings", "Introducing yourself in Spanish", "Basic question and answer patterns"],
      difficulty: "Beginner",
      estimatedMinutes: 5,
      orderIndex: 1,
      createdAt: new Date(),
    };

    [lesson1, lesson2, lesson3].forEach(l => this.lessons.set(l.id, l));

    // Quiz questions for lesson 1
    const quizQ1: QuizQuestion = {
      id: "q-1",
      lessonId: "lesson-1",
      question: "What does the map() method return?",
      options: ["The original array, modified", "A new array with transformed elements", "A single value", "undefined"],
      correctIndex: 1,
      explanation: "map() always returns a NEW array of the same length, with each element transformed by the callback function.",
      orderIndex: 1,
    };
    const quizQ2: QuizQuestion = {
      id: "q-2",
      lessonId: "lesson-1",
      question: "Which method would you use to get only even numbers from an array?",
      options: ["map()", "reduce()", "filter()", "forEach()"],
      correctIndex: 2,
      explanation: "filter() returns a new array containing only elements for which the callback returns true — perfect for selecting even numbers.",
      orderIndex: 2,
    };
    const quizQ3: QuizQuestion = {
      id: "q-3",
      lessonId: "lesson-1",
      question: "What is the output of [1,2,3].map(x => x * 2)?",
      options: ["[1,2,3]", "6", "[2,4,6]", "[1,4,9]"],
      correctIndex: 2,
      explanation: "map() applies the callback to each element: 1×2=2, 2×2=4, 3×2=6, producing [2,4,6].",
      orderIndex: 3,
    };

    const quizQ4: QuizQuestion = {
      id: "q-4",
      lessonId: "lesson-2",
      question: "What keyword makes a function return a Promise?",
      options: ["await", "async", "promise", "then"],
      correctIndex: 1,
      explanation: "The 'async' keyword before a function declaration makes it automatically return a Promise.",
      orderIndex: 1,
    };
    const quizQ5: QuizQuestion = {
      id: "q-5",
      lessonId: "lesson-2",
      question: "What does 'await' do inside an async function?",
      options: ["Runs code in parallel", "Pauses execution until the Promise resolves", "Creates a new Promise", "Catches errors"],
      correctIndex: 1,
      explanation: "'await' pauses the async function until the Promise settles, then returns the resolved value.",
      orderIndex: 2,
    };

    const quizQ6: QuizQuestion = {
      id: "q-6",
      lessonId: "lesson-3",
      question: "How do you say 'Good morning' in Spanish?",
      options: ["Buenas noches", "Buenas tardes", "Buenos días", "Hola amigo"],
      correctIndex: 2,
      explanation: "'Buenos días' literally means 'good days' and is used as a morning greeting.",
      orderIndex: 1,
    };
    const quizQ7: QuizQuestion = {
      id: "q-7",
      lessonId: "lesson-3",
      question: "Which phrase means 'Nice to meet you' in Spanish?",
      options: ["¿Cómo estás?", "Mucho gusto", "Me llamo", "Muy bien"],
      correctIndex: 1,
      explanation: "'Mucho gusto' literally means 'much pleasure' and is used when meeting someone.",
      orderIndex: 2,
    };

    [quizQ1, quizQ2, quizQ3, quizQ4, quizQ5, quizQ6, quizQ7].forEach(q => this.quizQuestions.set(q.id, q));

    // Demo user
    const demoUser: User = {
      id: "user-1",
      firstName: "Jessica",
      lastName: "Chen",
      email: "jessica@example.com",
      streakCount: 7,
      lastActivityDate: new Date(),
      totalMinutesLearned: 245,
      skillsCompleted: 12,
      totalXp: 1250,
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // User skills
    const userSkillsData: UserSkill[] = [
      { id: "us-1", userId: "user-1", skillId: "skill-1", status: "active", progress: 68, lessonsCompleted: 15, startedAt: new Date(Date.now() - 14 * 86400000), lastAccessedAt: new Date() },
      { id: "us-2", userId: "user-1", skillId: "skill-2", status: "paused", progress: 34, lessonsCompleted: 8, startedAt: new Date(Date.now() - 20 * 86400000), lastAccessedAt: new Date(Date.now() - 5 * 86400000) },
      { id: "us-3", userId: "user-1", skillId: "skill-3", status: "active", progress: 12, lessonsCompleted: 3, startedAt: new Date(Date.now() - 3 * 86400000), lastAccessedAt: new Date() },
    ];
    userSkillsData.forEach(us => this.userSkills.set(us.id, us));

    // Today's progress
    const todayProgress: DailyProgress = {
      id: "dp-1", userId: "user-1", date: new Date(),
      minutesLearned: 3.5, lessonsCompleted: 0, goalMet: false,
    };
    this.dailyProgress.set(todayProgress.id, todayProgress);

    // Achievements
    const achievementsData: Achievement[] = [
      { id: "ach-1", name: "First Step", description: "Complete your first lesson", icon: "🌱", category: "completion", xpReward: 50, requirement: 1, requirementType: "lessons_completed" },
      { id: "ach-2", name: "Getting Started", description: "Complete 10 lessons", icon: "📚", category: "completion", xpReward: 100, requirement: 10, requirementType: "lessons_completed" },
      { id: "ach-3", name: "Scholar", description: "Complete 50 lessons", icon: "🎓", category: "completion", xpReward: 500, requirement: 50, requirementType: "lessons_completed" },
      { id: "ach-4", name: "3-Day Streak", description: "Learn 3 days in a row", icon: "🔥", category: "streak", xpReward: 75, requirement: 3, requirementType: "streak_days" },
      { id: "ach-5", name: "Week Warrior", description: "Learn 7 days in a row", icon: "⚡", category: "streak", xpReward: 200, requirement: 7, requirementType: "streak_days" },
      { id: "ach-6", name: "Monthly Master", description: "Learn 30 days in a row", icon: "👑", category: "streak", xpReward: 1000, requirement: 30, requirementType: "streak_days" },
      { id: "ach-7", name: "Quiz Ace", description: "Score 100% on a quiz", icon: "🎯", category: "quiz", xpReward: 150, requirement: 1, requirementType: "quiz_perfect" },
      { id: "ach-8", name: "Speed Learner", description: "Learn 60 minutes total", icon: "⏱️", category: "completion", xpReward: 100, requirement: 60, requirementType: "minutes_learned" },
      { id: "ach-9", name: "Dedicated Learner", description: "Learn 10 hours total", icon: "💪", category: "completion", xpReward: 500, requirement: 600, requirementType: "minutes_learned" },
      { id: "ach-10", name: "Social Butterfly", description: "Join a study group", icon: "👥", category: "social", xpReward: 100, requirement: 1, requirementType: "groups_joined" },
    ];
    achievementsData.forEach(a => this.achievements.set(a.id, a));

    // Pre-unlock some achievements for the demo user (streak 7 = earned 3-day and 7-day)
    const preUnlocked: UserAchievement[] = [
      { id: "ua-1", userId: "user-1", achievementId: "ach-1", unlockedAt: new Date(Date.now() - 13 * 86400000) },
      { id: "ua-2", userId: "user-1", achievementId: "ach-2", unlockedAt: new Date(Date.now() - 5 * 86400000) },
      { id: "ua-3", userId: "user-1", achievementId: "ach-4", unlockedAt: new Date(Date.now() - 4 * 86400000) },
      { id: "ua-4", userId: "user-1", achievementId: "ach-5", unlockedAt: new Date(Date.now() - 1 * 86400000) },
      { id: "ua-5", userId: "user-1", achievementId: "ach-8", unlockedAt: new Date(Date.now() - 2 * 86400000) },
    ];
    preUnlocked.forEach(ua => this.userAchievements.set(ua.id, ua));

    // Demo study group
    const group1: StudyGroup = {
      id: "group-1",
      name: "JS Bootcamp Squad",
      description: "Learning JavaScript together, one lesson at a time!",
      createdBy: "user-1",
      inviteCode: "JSBOOT",
      createdAt: new Date(Date.now() - 7 * 86400000),
    };
    this.studyGroups.set(group1.id, group1);
    const gm1: GroupMember = { id: "gm-1", groupId: "group-1", userId: "user-1", role: "admin", joinedAt: new Date(Date.now() - 7 * 86400000) };
    this.groupMembers.set(gm1.id, gm1);

    // Demo spaced repetition record (lesson-2 due for review)
    const sr1: SpacedRepetition = {
      id: "sr-1", userId: "user-1", lessonId: "lesson-2",
      easeFactor: 2.5, interval: 1, repetitions: 1,
      nextReviewDate: new Date(Date.now() - 86400000), // yesterday = due now
      lastReviewedAt: new Date(Date.now() - 2 * 86400000),
    };
    this.spacedRepetition.set(sr1.id, sr1);
  }

  // ─── Users ───────────────────────────────────────────────────────────────
  async getUser(id: string) { return this.users.get(id); }
  async getUserByEmail(email: string) { return Array.from(this.users.values()).find(u => u.email === email); }
  async createUser(data: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...data, id, createdAt: new Date(), streakCount: 0, totalMinutesLearned: 0, skillsCompleted: 0, totalXp: 0, lastActivityDate: data.lastActivityDate ?? null };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id: string, updates: Partial<any>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // ─── Skill Categories ────────────────────────────────────────────────────
  async getAllSkillCategories() { return Array.from(this.skillCategories.values()); }
  async createSkillCategory(data: InsertSkillCategory): Promise<SkillCategory> {
    const id = randomUUID();
    const cat: SkillCategory = { ...data, id, createdAt: new Date(), description: data.description ?? null };
    this.skillCategories.set(id, cat);
    return cat;
  }

  // ─── Skills ──────────────────────────────────────────────────────────────
  async getAllSkills() { return Array.from(this.skills.values()); }
  async getSkillsByCategory(categoryId: string) { return Array.from(this.skills.values()).filter(s => s.categoryId === categoryId); }
  async getSkill(id: string) { return this.skills.get(id); }
  async createSkill(data: InsertSkill): Promise<Skill> {
    const id = randomUUID();
    const skill: Skill = { ...data, id, createdAt: new Date(), description: data.description ?? null, categoryId: data.categoryId ?? null, totalLessons: data.totalLessons ?? null, estimatedDays: data.estimatedDays ?? null };
    this.skills.set(id, skill);
    return skill;
  }

  // ─── Lessons ─────────────────────────────────────────────────────────────
  async getLessonsBySkill(skillId: string) {
    return Array.from(this.lessons.values()).filter(l => l.skillId === skillId).sort((a, b) => a.orderIndex - b.orderIndex);
  }
  async getLesson(id: string) { return this.lessons.get(id); }
  async createLesson(data: InsertLesson): Promise<Lesson> {
    const id = randomUUID();
    const lesson: Lesson = { ...data, id, createdAt: new Date(), description: data.description ?? null, skillId: data.skillId ?? null, objectives: data.objectives ?? null, estimatedMinutes: data.estimatedMinutes ?? null };
    this.lessons.set(id, lesson);
    return lesson;
  }

  // ─── User Skills ─────────────────────────────────────────────────────────
  async getUserSkills(userId: string) { return Array.from(this.userSkills.values()).filter(us => us.userId === userId); }
  async getUserSkill(userId: string, skillId: string) { return Array.from(this.userSkills.values()).find(us => us.userId === userId && us.skillId === skillId); }
  async createUserSkill(data: InsertUserSkill): Promise<UserSkill> {
    const id = randomUUID();
    const us: UserSkill = { ...data, id, startedAt: new Date(), progress: data.progress ?? null, userId: data.userId ?? null, skillId: data.skillId ?? null, lessonsCompleted: data.lessonsCompleted ?? null, lastAccessedAt: data.lastAccessedAt ?? null };
    this.userSkills.set(id, us);
    return us;
  }
  async updateUserSkill(id: string, updates: Partial<InsertUserSkill>): Promise<UserSkill | undefined> {
    const us = this.userSkills.get(id);
    if (!us) return undefined;
    const updated = { ...us, ...updates };
    this.userSkills.set(id, updated);
    return updated;
  }

  // ─── User Lessons ────────────────────────────────────────────────────────
  async getUserLessons(userId: string) { return Array.from(this.userLessons.values()).filter(ul => ul.userId === userId); }
  async getUserLesson(userId: string, lessonId: string) { return Array.from(this.userLessons.values()).find(ul => ul.userId === userId && ul.lessonId === lessonId); }
  async createUserLesson(data: InsertUserLesson): Promise<UserLesson> {
    const id = randomUUID();
    const ul: UserLesson = { ...data, id, createdAt: new Date(), userId: data.userId ?? null, lessonId: data.lessonId ?? null, timeSpent: data.timeSpent ?? null, completedAt: data.completedAt ?? null, comprehensionRating: data.comprehensionRating ?? null, notes: data.notes ?? null };
    this.userLessons.set(id, ul);
    return ul;
  }
  async updateUserLesson(id: string, updates: Partial<InsertUserLesson>): Promise<UserLesson | undefined> {
    const ul = this.userLessons.get(id);
    if (!ul) return undefined;
    const updated = { ...ul, ...updates };
    this.userLessons.set(id, updated);
    return updated;
  }

  // ─── Daily Progress ──────────────────────────────────────────────────────
  async getDailyProgress(userId: string, date: Date) {
    const dateStr = date.toDateString();
    return Array.from(this.dailyProgress.values()).find(dp => dp.userId === userId && dp.date.toDateString() === dateStr);
  }
  async createDailyProgress(data: InsertDailyProgress): Promise<DailyProgress> {
    const id = randomUUID();
    const dp: DailyProgress = { ...data, id, userId: data.userId ?? null, lessonsCompleted: data.lessonsCompleted ?? null, minutesLearned: data.minutesLearned ?? null, goalMet: data.goalMet ?? null };
    this.dailyProgress.set(id, dp);
    return dp;
  }
  async updateDailyProgress(id: string, updates: Partial<InsertDailyProgress>): Promise<DailyProgress | undefined> {
    const dp = this.dailyProgress.get(id);
    if (!dp) return undefined;
    const updated = { ...dp, ...updates };
    this.dailyProgress.set(id, updated);
    return updated;
  }
  async getUserProgressHistory(userId: string, days: number): Promise<DailyProgress[]> {
    const cutoff = new Date(Date.now() - days * 86400000);
    return Array.from(this.dailyProgress.values()).filter(dp => dp.userId === userId && dp.date >= cutoff).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // ─── Quiz Questions ──────────────────────────────────────────────────────
  async getQuizQuestions(lessonId: string) {
    return Array.from(this.quizQuestions.values()).filter(q => q.lessonId === lessonId).sort((a, b) => a.orderIndex - b.orderIndex);
  }
  async createQuizQuestion(data: InsertQuizQuestion): Promise<QuizQuestion> {
    const id = randomUUID();
    const q: QuizQuestion = { ...data, id, lessonId: data.lessonId ?? null, explanation: data.explanation ?? null };
    this.quizQuestions.set(id, q);
    return q;
  }

  // ─── Quiz Attempts ───────────────────────────────────────────────────────
  async getQuizAttempts(userId: string, lessonId: string) {
    return Array.from(this.quizAttempts.values()).filter(a => a.userId === userId && a.lessonId === lessonId);
  }
  async getLatestQuizAttempt(userId: string, lessonId: string) {
    const attempts = await this.getQuizAttempts(userId, lessonId);
    return attempts.sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0];
  }
  async createQuizAttempt(data: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = randomUUID();
    const attempt: QuizAttempt = { ...data, id, completedAt: new Date(), userId: data.userId ?? null, lessonId: data.lessonId ?? null };
    this.quizAttempts.set(id, attempt);
    return attempt;
  }

  // ─── Spaced Repetition ───────────────────────────────────────────────────
  async getSpacedRepetition(userId: string, lessonId: string) {
    return Array.from(this.spacedRepetition.values()).find(sr => sr.userId === userId && sr.lessonId === lessonId);
  }
  async getSpacedRepetitionDue(userId: string): Promise<SpacedRepetition[]> {
    const now = new Date();
    return Array.from(this.spacedRepetition.values()).filter(sr => sr.userId === userId && sr.nextReviewDate <= now);
  }
  async createSpacedRepetition(data: InsertSpacedRepetition): Promise<SpacedRepetition> {
    const id = randomUUID();
    const sr: SpacedRepetition = { ...data, id, userId: data.userId ?? null, lessonId: data.lessonId ?? null, easeFactor: data.easeFactor ?? null, interval: data.interval ?? null, repetitions: data.repetitions ?? null, lastReviewedAt: data.lastReviewedAt ?? null };
    this.spacedRepetition.set(id, sr);
    return sr;
  }
  async updateSpacedRepetition(id: string, updates: Partial<InsertSpacedRepetition>): Promise<SpacedRepetition | undefined> {
    const sr = this.spacedRepetition.get(id);
    if (!sr) return undefined;
    const updated = { ...sr, ...updates };
    this.spacedRepetition.set(id, updated);
    return updated;
  }

  // ─── Achievements ────────────────────────────────────────────────────────
  async getAllAchievements() { return Array.from(this.achievements.values()); }
  async getUserAchievements(userId: string) { return Array.from(this.userAchievements.values()).filter(ua => ua.userId === userId); }
  async createUserAchievement(data: InsertUserAchievement): Promise<UserAchievement> {
    const id = randomUUID();
    const ua: UserAchievement = { ...data, id, unlockedAt: new Date(), userId: data.userId ?? null, achievementId: data.achievementId ?? null };
    this.userAchievements.set(id, ua);
    return ua;
  }
  async hasUserAchievement(userId: string, achievementId: string) {
    return Array.from(this.userAchievements.values()).some(ua => ua.userId === userId && ua.achievementId === achievementId);
  }

  // ─── Study Groups ────────────────────────────────────────────────────────
  async getStudyGroup(id: string) { return this.studyGroups.get(id); }
  async getStudyGroupByCode(inviteCode: string) { return Array.from(this.studyGroups.values()).find(g => g.inviteCode === inviteCode.toUpperCase()); }
  async getUserGroups(userId: string): Promise<StudyGroup[]> {
    const memberGroupIds = Array.from(this.groupMembers.values()).filter(gm => gm.userId === userId).map(gm => gm.groupId);
    return Array.from(this.studyGroups.values()).filter(g => memberGroupIds.includes(g.id));
  }
  async createStudyGroup(data: InsertStudyGroup): Promise<StudyGroup> {
    const id = randomUUID();
    const group: StudyGroup = { ...data, id, createdAt: new Date(), description: data.description ?? null, createdBy: data.createdBy ?? null, inviteCode: data.inviteCode.toUpperCase() };
    this.studyGroups.set(id, group);
    return group;
  }
  async getGroupMembers(groupId: string) { return Array.from(this.groupMembers.values()).filter(gm => gm.groupId === groupId); }
  async addGroupMember(data: InsertGroupMember): Promise<GroupMember> {
    const id = randomUUID();
    const gm: GroupMember = { ...data, id, joinedAt: new Date(), groupId: data.groupId ?? null, userId: data.userId ?? null };
    this.groupMembers.set(id, gm);
    return gm;
  }
  async isGroupMember(groupId: string, userId: string) {
    return Array.from(this.groupMembers.values()).some(gm => gm.groupId === groupId && gm.userId === userId);
  }
}

export const storage = new MemStorage();
