// app/frontend/utils/jobStore.ts

import type { Job } from "../types/job";
import { API_URL } from "../config";
import { getAuthHeaders } from "./api";

// ===== GET MATCHED JOBS FOR CURRENT WORKER =====
export async function getMatchedJobs(): Promise<Job[]> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/jobs/matches/me`, {
    method: "GET",
    headers,
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    throw new Error("Failed to fetch matched jobs");
  }

  const data = await res.json();

  const mappedJobs: Job[] = data.map((job: any) => ({
    ...job,
    required_all_tags: job.required_all_tags ?? job.tags ?? [],
    required_any_tags: job.required_any_tags ?? [],
  }));

  return mappedJobs;
}

/**
 * Lädt einen einzelnen Job per ID vom Backend.
 * Wird von Matches-Screen genutzt, um Jobdaten zu einer Application zu laden.
 */
export async function getJobById(jobId: string): Promise<Job> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "GET",
    headers,
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (res.status === 404) {
    throw new Error("JOB_NOT_FOUND");
  }

  if (!res.ok) {
    throw new Error("Failed to fetch job");
  }

  const job = await res.json();

  const mappedJob: Job = {
    ...job,
    required_all_tags: job.required_all_tags ?? job.tags ?? [],
    required_any_tags: job.required_any_tags ?? [],
  };

  return mappedJob;
}
