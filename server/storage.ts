import { type Job, type InsertJob } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJobImage(id: string, imageUrl: string): Promise<Job | undefined>;
  updateJobStatus(id: string, status: string): Promise<Job | undefined>;
  updateJobStls(id: string, cutterUrl: string, stampUrl: string): Promise<Job | undefined>;
}

export class MemStorage implements IStorage {
  private jobs: Map<string, Job>;

  constructor() {
    this.jobs = new Map();
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = {
      id,
      prompt: insertJob.prompt,
      imageUrl: null,
      cutterStlUrl: null,
      stampStlUrl: null,
      status: "generating",
      createdAt: new Date(),
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJobImage(id: string, imageUrl: string): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    const updated = { ...job, imageUrl };
    this.jobs.set(id, updated);
    return updated;
  }

  async updateJobStatus(id: string, status: string): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    const updated = { ...job, status };
    this.jobs.set(id, updated);
    return updated;
  }

  async updateJobStls(id: string, cutterUrl: string, stampUrl: string): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    const updated = { ...job, cutterStlUrl: cutterUrl, stampStlUrl: stampUrl, status: "ready" };
    this.jobs.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
