import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url"),
  cutterStlUrl: text("cutter_stl_url"),
  stampStlUrl: text("stamp_stl_url"),
  status: varchar("status").notNull().default("generating"), // generating, selecting, processing, ready
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  imageUrl: true,
  cutterStlUrl: true,
  stampStlUrl: true,
  status: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
