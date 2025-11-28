// app/frontend/utils/jobStore.ts

import type { Job } from "../types/job";
import { API_URL } from "../config";
import { getAuthHeaders } from "./api";


/* ---------------------------------------------------
   WORKER: GET MATCHED JOBS
--------------------------------------------------- */
export async function getMatchedJobs(): Promise<Job[]> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/jobs/matches/me`, {
    method: "GET",
    headers,
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("FAILED_TO_FETCH_MATCHED_JOBS");

  const data = await res.json();

  return data.map((job: any) => ({
    ...job,
    required_all_tags: job.required_all_tags ?? job.tags ?? [],
    required_any_tags: job.required_any_tags ?? [],
  }));
}


/* ---------------------------------------------------
   EMPLOYER: GET ALL JOBS FOR THIS EMPLOYER
--------------------------------------------------- */
export async function getEmployerJobs(employerId: string): Promise<Job[]> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/jobs/employer/${employerId}`, {
    method: "GET",
    headers,
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("FAILED_TO_FETCH_EMPLOYER_JOBS");

  const data = await res.json();

  return data.map((job: any) => ({
    ...job,
    required_all_tags: job.required_all_tags ?? job.tags ?? [],
    required_any_tags: job.required_any_tags ?? [],
  }));
}


/* ---------------------------------------------------
   GET SINGLE JOB
--------------------------------------------------- */
export async function getJobById(jobId: string): Promise<Job> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "GET",
    headers,
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (res.status === 404) throw new Error("JOB_NOT_FOUND");
  if (!res.ok) throw new Error("FAILED_TO_FETCH_JOB");

  const job = await res.json();

  return {
    ...job,
    required_all_tags: job.required_all_tags ?? job.tags ?? [],
    required_any_tags: job.required_any_tags ?? [],
  };
}


/* ---------------------------------------------------
   CREATE JOB (EMPLOYER)
--------------------------------------------------- */
export async function addJob(jobData: any): Promise<Job> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    headers,
    body: JSON.stringify(jobData),
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (res.status === 403) throw new Error("FORBIDDEN");
  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ addJob error:", errorText);
    throw new Error("FAILED_TO_CREATE_JOB");
  }

  const job = await res.json();
  return {
    ...job,
    required_all_tags: job.required_all_tags ?? [],
    required_any_tags: job.required_any_tags ?? [],
  };
}
