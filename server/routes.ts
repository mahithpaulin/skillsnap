import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePersonalizedRecommendations, analyzeLearningProgress } from "./services/openai";
import {
  insertUserSchema, insertUserSkillSchema, insertUserLessonSchema,
  insertDailyProgressSchema, insertQuizAttemptSchema,
  insertStudyGroupSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { randomUUID } from "crypto";

function preprocessTimestamps(body: any): any {
  const processed = { ...body };
  const tsFields = ["completedAt", "lastAccessedAt", "date", "nextReviewDate", "lastReviewedAt"];
  tsFields.forEach(field => {
    if (processed[field] && typeof processed[field] === "string") {
      const d = new Date(processed[field]);
      if (!isNaN(d.getTime())) processed[field] = d;
    }
  });
  return processed;
}

// SM-2 spaced repetition algorithm
function sm2Update(easeFactor: number, interval: number, repetitions: number, quality: number) {
  // quality: 0-5 (0-2 = fail, 3-5 = pass)
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(1.3, newEF);

  let newInterval: number;
  let newReps: number;

  if (quality < 3) {
    newInterval = 1;
    newReps = 0;
  } else {
    newReps = repetitions + 1;
    if (repetitions === 0) newInterval = 1;
    else if (repetitions === 1) newInterval = 6;
    else newInterval = Math.round(interval * newEF);
  }

  const nextReviewDate = new Date(Date.now() + newInterval * 86400000);
  return { easeFactor: newEF, interval: newInterval, repetitions: newReps, nextReviewDate };
}

// Achievement checker
async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const user = await storage.getUser(userId);
  if (!user) return [];

  const allAchievements = await storage.getAllAchievements();
  const userLessons = await storage.getUserLessons(userId);
  const userAchievements = await storage.getUserAchievements(userId);
  const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));
  const newlyUnlocked: string[] = [];

  const completedLessons = userLessons.filter(ul => ul.status === "completed").length;
  const latestAttempts = await Promise.all(
    userLessons.filter(ul => ul.status === "completed").map(ul => storage.getLatestQuizAttempt(userId, ul.lessonId!))
  );
  const perfectQuizzes = latestAttempts.filter(a => a && a.score === 100).length;
  const userGroups = await storage.getUserGroups(userId);

  for (const ach of allAchievements) {
    if (unlockedIds.has(ach.id)) continue;

    let met = false;
    switch (ach.requirementType) {
      case "lessons_completed": met = completedLessons >= ach.requirement; break;
      case "streak_days": met = (user.streakCount ?? 0) >= ach.requirement; break;
      case "quiz_perfect": met = perfectQuizzes >= ach.requirement; break;
      case "minutes_learned": met = (user.totalMinutesLearned ?? 0) >= ach.requirement; break;
      case "groups_joined": met = userGroups.length >= ach.requirement; break;
    }

    if (met) {
      await storage.createUserAchievement({ userId, achievementId: ach.id });
      await storage.updateUser(userId, { totalXp: (user.totalXp ?? 0) + (ach.xpReward ?? 0) });
      newlyUnlocked.push(ach.name);
    }
  }
  return newlyUnlocked;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ─── Users ───────────────────────────────────────────────────────────────
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch { res.status(500).json({ message: "Failed to fetch user" }); }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      res.status(201).json(await storage.createUser(data));
    } catch { res.status(400).json({ message: "Invalid user data" }); }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updates = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch { res.status(400).json({ message: "Invalid update data" }); }
  });

  // ─── Skill Categories ────────────────────────────────────────────────────
  app.get("/api/skill-categories", async (_req, res) => {
    try { res.json(await storage.getAllSkillCategories()); }
    catch { res.status(500).json({ message: "Failed to fetch categories" }); }
  });

  // ─── Skills ──────────────────────────────────────────────────────────────
  app.get("/api/skills", async (req, res) => {
    try {
      const { categoryId } = req.query;
      const skills = categoryId ? await storage.getSkillsByCategory(categoryId as string) : await storage.getAllSkills();
      res.json(skills);
    } catch { res.status(500).json({ message: "Failed to fetch skills" }); }
  });

  app.get("/api/skills/:id", async (req, res) => {
    try {
      const skill = await storage.getSkill(req.params.id);
      if (!skill) return res.status(404).json({ message: "Skill not found" });
      res.json(skill);
    } catch { res.status(500).json({ message: "Failed to fetch skill" }); }
  });

  // ─── Lessons ─────────────────────────────────────────────────────────────
  app.get("/api/lessons", async (req, res) => {
    try {
      const { skillId } = req.query;
      if (!skillId) return res.status(400).json({ message: "skillId is required" });
      res.json(await storage.getLessonsBySkill(skillId as string));
    } catch { res.status(500).json({ message: "Failed to fetch lessons" }); }
  });

  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) return res.status(404).json({ message: "Lesson not found" });
      res.json(lesson);
    } catch { res.status(500).json({ message: "Failed to fetch lesson" }); }
  });

  // ─── Quiz Questions ──────────────────────────────────────────────────────
  app.get("/api/lessons/:lessonId/quiz", async (req, res) => {
    try {
      const questions = await storage.getQuizQuestions(req.params.lessonId);
      // Hide correct answers from client
      const safe = questions.map(({ correctIndex: _ci, explanation: _ex, ...q }) => q);
      res.json(safe);
    } catch { res.status(500).json({ message: "Failed to fetch quiz" }); }
  });

  // Submit quiz attempt
  app.post("/api/users/:userId/quiz-attempts", async (req, res) => {
    try {
      const { lessonId, answers } = req.body;
      if (!lessonId || !Array.isArray(answers)) return res.status(400).json({ message: "lessonId and answers required" });

      const questions = await storage.getQuizQuestions(lessonId);
      if (questions.length === 0) return res.status(404).json({ message: "No quiz for this lesson" });

      let correct = 0;
      const feedback = questions.map((q, i) => {
        const selected = parseInt(answers[i] ?? "-1");
        const isCorrect = selected === q.correctIndex;
        if (isCorrect) correct++;
        return { questionId: q.id, selected, correctIndex: q.correctIndex, isCorrect, explanation: q.explanation };
      });
      const score = Math.round((correct / questions.length) * 100);

      const attempt = await storage.createQuizAttempt({
        userId: req.params.userId,
        lessonId,
        answers: answers.map(String),
        score,
      });

      // Update spaced repetition (quality = score/20, clamped 0-5)
      const quality = Math.min(5, Math.round(score / 20));
      const existing = await storage.getSpacedRepetition(req.params.userId, lessonId);
      if (existing) {
        const sm2 = sm2Update(existing.easeFactor ?? 2.5, existing.interval ?? 1, existing.repetitions ?? 0, quality);
        await storage.updateSpacedRepetition(existing.id, { ...sm2, lastReviewedAt: new Date() });
      } else {
        const sm2 = sm2Update(2.5, 1, 0, quality);
        await storage.createSpacedRepetition({ userId: req.params.userId, lessonId, ...sm2, lastReviewedAt: new Date() });
      }

      // Check achievements
      const newAchievements = await checkAndUnlockAchievements(req.params.userId);

      res.status(201).json({ attempt, feedback, score, newAchievements });
    } catch (error) {
      console.error("Quiz attempt error:", error);
      res.status(500).json({ message: "Failed to submit quiz" });
    }
  });

  // Get latest quiz attempt for a lesson
  app.get("/api/users/:userId/quiz-attempts/:lessonId", async (req, res) => {
    try {
      const attempt = await storage.getLatestQuizAttempt(req.params.userId, req.params.lessonId);
      res.json(attempt ?? null);
    } catch { res.status(500).json({ message: "Failed to fetch quiz attempt" }); }
  });

  // ─── Spaced Repetition ───────────────────────────────────────────────────
  app.get("/api/users/:userId/spaced-repetition/due", async (req, res) => {
    try {
      const dueSRs = await storage.getSpacedRepetitionDue(req.params.userId);
      const enriched = await Promise.all(dueSRs.map(async sr => {
        const lesson = await storage.getLesson(sr.lessonId!);
        return { ...sr, lesson };
      }));
      res.json(enriched);
    } catch { res.status(500).json({ message: "Failed to fetch due reviews" }); }
  });

  // ─── User Skills ─────────────────────────────────────────────────────────
  app.get("/api/users/:userId/skills", async (req, res) => {
    try {
      const userSkills = await storage.getUserSkills(req.params.userId);
      const enriched = await Promise.all(userSkills.map(async us => {
        const skill = await storage.getSkill(us.skillId!);
        const cats = await storage.getAllSkillCategories();
        const category = cats.find(c => c.id === skill?.categoryId);
        return { ...us, skill, category };
      }));
      res.json(enriched);
    } catch { res.status(500).json({ message: "Failed to fetch user skills" }); }
  });

  app.post("/api/users/:userId/skills", async (req, res) => {
    try {
      const data = insertUserSkillSchema.parse({ ...req.body, userId: req.params.userId });
      res.status(201).json(await storage.createUserSkill(data));
    } catch { res.status(400).json({ message: "Invalid user skill data" }); }
  });

  app.patch("/api/user-skills/:id", async (req, res) => {
    try {
      const updates = insertUserSkillSchema.partial().parse(req.body);
      const us = await storage.updateUserSkill(req.params.id, updates);
      if (!us) return res.status(404).json({ message: "User skill not found" });
      res.json(us);
    } catch { res.status(400).json({ message: "Invalid update data" }); }
  });

  // ─── User Lessons ────────────────────────────────────────────────────────
  app.get("/api/users/:userId/lessons", async (req, res) => {
    try {
      const userLessons = await storage.getUserLessons(req.params.userId);
      const enriched = await Promise.all(userLessons.map(async ul => {
        const lesson = await storage.getLesson(ul.lessonId!);
        return { ...ul, lesson };
      }));
      res.json(enriched);
    } catch { res.status(500).json({ message: "Failed to fetch user lessons" }); }
  });

  app.post("/api/users/:userId/lessons", async (req, res) => {
    try {
      const body = preprocessTimestamps(req.body);
      const data = insertUserLessonSchema.parse({ ...body, userId: req.params.userId });
      const ul = await storage.createUserLesson(data);

      // Update user total minutes
      if (data.status === "completed" && data.timeSpent) {
        const user = await storage.getUser(req.params.userId);
        if (user) await storage.updateUser(req.params.userId, { totalMinutesLearned: (user.totalMinutesLearned ?? 0) + data.timeSpent });
      }

      const newAchievements = await checkAndUnlockAchievements(req.params.userId);
      res.status(201).json({ ...ul, newAchievements });
    } catch (error) {
      console.error("User lesson creation error:", error);
      if (error instanceof ZodError) res.status(400).json({ message: "Invalid user lesson data", details: error.issues });
      else res.status(400).json({ message: "Invalid user lesson data" });
    }
  });

  app.patch("/api/user-lessons/:id", async (req, res) => {
    try {
      const body = preprocessTimestamps(req.body);
      const updates = insertUserLessonSchema.partial().parse(body);
      const ul = await storage.updateUserLesson(req.params.id, updates);
      if (!ul) return res.status(404).json({ message: "User lesson not found" });
      res.json(ul);
    } catch (error) {
      if (error instanceof ZodError) res.status(400).json({ message: "Invalid update data", details: error.issues });
      else res.status(400).json({ message: "Invalid update data" });
    }
  });

  // ─── Daily Progress ──────────────────────────────────────────────────────
  app.get("/api/users/:userId/progress/today", async (req, res) => {
    try {
      const today = new Date();
      let progress = await storage.getDailyProgress(req.params.userId, today);
      if (!progress) {
        progress = await storage.createDailyProgress({ userId: req.params.userId, date: today, minutesLearned: 0, lessonsCompleted: 0, goalMet: false });
      }
      res.json(progress);
    } catch { res.status(500).json({ message: "Failed to fetch daily progress" }); }
  });

  app.patch("/api/daily-progress/:id", async (req, res) => {
    try {
      const updates = insertDailyProgressSchema.partial().parse(req.body);
      const dp = await storage.updateDailyProgress(req.params.id, updates);
      if (!dp) return res.status(404).json({ message: "Daily progress not found" });
      res.json(dp);
    } catch { res.status(400).json({ message: "Invalid update data" }); }
  });

  app.get("/api/users/:userId/progress/history", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      res.json(await storage.getUserProgressHistory(req.params.userId, days));
    } catch { res.status(500).json({ message: "Failed to fetch progress history" }); }
  });

  // ─── Achievements ────────────────────────────────────────────────────────
  app.get("/api/achievements", async (_req, res) => {
    try { res.json(await storage.getAllAchievements()); }
    catch { res.status(500).json({ message: "Failed to fetch achievements" }); }
  });

  app.get("/api/users/:userId/achievements", async (req, res) => {
    try {
      const all = await storage.getAllAchievements();
      const userAch = await storage.getUserAchievements(req.params.userId);
      const unlockedIds = new Set(userAch.map(ua => ua.achievementId));
      const result = all.map(ach => ({
        ...ach,
        unlocked: unlockedIds.has(ach.id),
        unlockedAt: userAch.find(ua => ua.achievementId === ach.id)?.unlockedAt ?? null,
      }));
      res.json(result);
    } catch { res.status(500).json({ message: "Failed to fetch achievements" }); }
  });

  // ─── Study Groups ────────────────────────────────────────────────────────
  app.get("/api/users/:userId/groups", async (req, res) => {
    try {
      const groups = await storage.getUserGroups(req.params.userId);
      const enriched = await Promise.all(groups.map(async g => {
        const members = await storage.getGroupMembers(g.id);
        const memberDetails = await Promise.all(members.map(async m => {
          const user = await storage.getUser(m.userId!);
          return { ...m, user: user ? { id: user.id, firstName: user.firstName, lastName: user.lastName, streakCount: user.streakCount, totalMinutesLearned: user.totalMinutesLearned } : null };
        }));
        return { ...g, members: memberDetails };
      }));
      res.json(enriched);
    } catch { res.status(500).json({ message: "Failed to fetch study groups" }); }
  });

  app.post("/api/study-groups", async (req, res) => {
    try {
      const { name, description, userId } = req.body;
      if (!name || !userId) return res.status(400).json({ message: "name and userId required" });
      const inviteCode = randomUUID().slice(0, 6).toUpperCase();
      const group = await storage.createStudyGroup({ name, description: description ?? null, createdBy: userId, inviteCode });
      await storage.addGroupMember({ groupId: group.id, userId, role: "admin" });
      const newAchievements = await checkAndUnlockAchievements(userId);
      res.status(201).json({ ...group, newAchievements });
    } catch { res.status(400).json({ message: "Failed to create study group" }); }
  });

  app.post("/api/study-groups/join", async (req, res) => {
    try {
      const { inviteCode, userId } = req.body;
      if (!inviteCode || !userId) return res.status(400).json({ message: "inviteCode and userId required" });
      const group = await storage.getStudyGroupByCode(inviteCode);
      if (!group) return res.status(404).json({ message: "Group not found with that invite code" });
      const alreadyMember = await storage.isGroupMember(group.id, userId);
      if (alreadyMember) return res.status(409).json({ message: "Already a member of this group" });
      await storage.addGroupMember({ groupId: group.id, userId, role: "member" });
      const newAchievements = await checkAndUnlockAchievements(userId);
      res.status(201).json({ group, newAchievements });
    } catch { res.status(400).json({ message: "Failed to join study group" }); }
  });

  // ─── AI Recommendations ──────────────────────────────────────────────────
  app.post("/api/users/:userId/recommendations", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const userSkills = await storage.getUserSkills(req.params.userId);
      const activeSkillNames = await Promise.all(
        userSkills.filter(us => us.status === "active").map(async us => (await storage.getSkill(us.skillId!))?.name ?? "")
      );
      const recommendations = await generatePersonalizedRecommendations({
        completedLessons: (user.skillsCompleted ?? 0) * 15,
        activeSkills: activeSkillNames.filter(Boolean),
        strugglingAreas: [],
        preferences: [],
        learningTime: 5,
      });
      res.json(recommendations);
    } catch (error) {
      console.error("AI recommendations error:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.post("/api/users/:userId/analysis", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const analysis = await analyzeLearningProgress({
        streakCount: user.streakCount ?? 0,
        totalMinutesLearned: user.totalMinutesLearned ?? 0,
        skillsCompleted: user.skillsCompleted ?? 0,
        recentPerformance: [],
        learningSpeed: "moderate",
      });
      res.json(analysis);
    } catch { res.status(500).json({ message: "Failed to analyze progress" }); }
  });

  // ─── Dashboard ───────────────────────────────────────────────────────────
  app.get("/api/users/:userId/dashboard", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const today = new Date();
      let todayProgress = await storage.getDailyProgress(req.params.userId, today);
      const allUserLessons = await storage.getUserLessons(req.params.userId);
      const todayStr = today.toDateString();
      const todayLessons = allUserLessons.filter(ul => ul.status === "completed" && ul.completedAt?.toDateString() === todayStr);
      const todayMinutes = todayLessons.reduce((sum, ul) => sum + (ul.timeSpent ?? 0), 0);
      const todayCount = todayLessons.length;
      const goalMet = todayMinutes >= 5;

      if (!todayProgress) {
        todayProgress = await storage.createDailyProgress({ userId: req.params.userId, date: today, minutesLearned: todayMinutes, lessonsCompleted: todayCount, goalMet });
      } else {
        todayProgress = await storage.updateDailyProgress(todayProgress.id, { minutesLearned: todayMinutes, lessonsCompleted: todayCount, goalMet }) ?? todayProgress;
      }

      const userSkills = await storage.getUserSkills(req.params.userId);
      const enrichedSkills = await Promise.all(userSkills.map(async us => {
        const skill = await storage.getSkill(us.skillId!);
        const cats = await storage.getAllSkillCategories();
        return { ...us, skill, category: cats.find(c => c.id === skill?.categoryId) };
      }));

      const activeSkills = enrichedSkills.filter(us => us.status === "active");
      let todaysLesson = null;
      if (activeSkills.length > 0) {
        const primary = activeSkills[0];
        const lessons = await storage.getLessonsBySkill(primary.skillId!);
        const completedIds = allUserLessons.filter(ul => ul.status === "completed").map(ul => ul.lessonId);
        todaysLesson = lessons.find(l => !completedIds.includes(l.id)) ?? null;
      }

      const dueReviews = await storage.getSpacedRepetitionDue(req.params.userId);
      const dueReviewsEnriched = await Promise.all(dueReviews.map(async sr => ({ ...sr, lesson: await storage.getLesson(sr.lessonId!) })));

      const userAch = await storage.getUserAchievements(req.params.userId);
      const allAch = await storage.getAllAchievements();
      const recentAchievements = userAch
        .sort((a, b) => b.unlockedAt!.getTime() - a.unlockedAt!.getTime())
        .slice(0, 3)
        .map(ua => ({ ...ua, achievement: allAch.find(a => a.id === ua.achievementId) }));

      res.json({ user, todayProgress, userSkills: enrichedSkills, todaysLesson, dueReviews: dueReviewsEnriched, recentAchievements });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
