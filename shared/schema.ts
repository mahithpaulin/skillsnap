import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  streakCount: integer("streak_count").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  totalMinutesLearned: integer("total_minutes_learned").default(0),
  skillsCompleted: integer("skills_completed").default(0),
  totalXp: integer("total_xp").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const skillCategories = pgTable("skill_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => skillCategories.id),
  totalLessons: integer("total_lessons").default(0),
  estimatedDays: integer("estimated_days").default(30),
  difficulty: text("difficulty").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  skillId: varchar("skill_id").references(() => skills.id),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(), // JSON string with sections, optional video
  objectives: text("objectives").array(),
  difficulty: text("difficulty").notNull(),
  estimatedMinutes: integer("estimated_minutes").default(5),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSkills = pgTable("user_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  skillId: varchar("skill_id").references(() => skills.id),
  status: text("status").notNull(),
  progress: integer("progress").default(0),
  lessonsCompleted: integer("lessons_completed").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at"),
});

export const userLessons = pgTable("user_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  lessonId: varchar("lesson_id").references(() => lessons.id),
  status: text("status").notNull(),
  timeSpent: integer("time_spent").default(0),
  completedAt: timestamp("completed_at"),
  comprehensionRating: integer("comprehension_rating"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyProgress = pgTable("daily_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  date: timestamp("date").notNull(),
  minutesLearned: integer("minutes_learned").default(0),
  lessonsCompleted: integer("lessons_completed").default(0),
  goalMet: boolean("goal_met").default(false),
});

// === QUIZ SYSTEM ===
export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").references(() => lessons.id),
  question: text("question").notNull(),
  options: text("options").array().notNull(), // 4 options
  correctIndex: integer("correct_index").notNull(), // 0-3
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  lessonId: varchar("lesson_id").references(() => lessons.id),
  answers: text("answers").array().notNull(), // selected indices as strings
  score: integer("score").notNull(), // 0-100
  completedAt: timestamp("completed_at").defaultNow(),
});

// === SPACED REPETITION (SM-2) ===
export const spacedRepetition = pgTable("spaced_repetition", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  lessonId: varchar("lesson_id").references(() => lessons.id),
  easeFactor: real("ease_factor").default(2.5), // SM-2 ease factor
  interval: integer("interval").default(1), // days until next review
  repetitions: integer("repetitions").default(0),
  nextReviewDate: timestamp("next_review_date").notNull(),
  lastReviewedAt: timestamp("last_reviewed_at"),
});

// === ACHIEVEMENT SYSTEM ===
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(), // "streak", "completion", "quiz", "social"
  xpReward: integer("xp_reward").default(50),
  requirement: integer("requirement").notNull(), // threshold value
  requirementType: text("requirement_type").notNull(), // "streak_days", "lessons_completed", "quiz_perfect", "minutes_learned"
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  achievementId: varchar("achievement_id").references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// === SOCIAL FEATURES ===
export const studyGroups = pgTable("study_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").references(() => users.id),
  inviteCode: varchar("invite_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => studyGroups.id),
  userId: varchar("user_id").references(() => users.id),
  role: text("role").notNull().default("member"), // "admin" | "member"
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSkillCategorySchema = createInsertSchema(skillCategories).omit({ id: true, createdAt: true });
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true, createdAt: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export const insertUserSkillSchema = createInsertSchema(userSkills).omit({ id: true, startedAt: true });
export const insertUserLessonSchema = createInsertSchema(userLessons).omit({ id: true, createdAt: true });
export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({ id: true });
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ id: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, completedAt: true });
export const insertSpacedRepetitionSchema = createInsertSchema(spacedRepetition).omit({ id: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true });
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true, unlockedAt: true });
export const insertStudyGroupSchema = createInsertSchema(studyGroups).omit({ id: true, createdAt: true });
export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({ id: true, joinedAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSkillCategory = z.infer<typeof insertSkillCategorySchema>;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type InsertUserSkill = z.infer<typeof insertUserSkillSchema>;
export type InsertUserLesson = z.infer<typeof insertUserLessonSchema>;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type InsertSpacedRepetition = z.infer<typeof insertSpacedRepetitionSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type InsertStudyGroup = z.infer<typeof insertStudyGroupSchema>;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

export type User = typeof users.$inferSelect;
export type SkillCategory = typeof skillCategories.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type UserSkill = typeof userSkills.$inferSelect;
export type UserLesson = typeof userLessons.$inferSelect;
export type DailyProgress = typeof dailyProgress.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type SpacedRepetition = typeof spacedRepetition.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type StudyGroup = typeof studyGroups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
