"use client";

import { useEffect, useState } from "react";
import type { NewProblem, NewReview, Problem, ProblemDetail } from "./problem";

export function useProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/problems")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        return response.json() as Promise<Problem[]>;
      })
      .then(setProblems)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load problems");
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function addProblem(newProblem: NewProblem) {
    const response = await fetch("http://localhost:8000/problems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProblem),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message =
        body && typeof body.detail === "string"
          ? body.detail
          : `Request failed: ${response.status}`;
      throw new Error(message);
    }

    const createdProblem = (await response.json()) as Problem;
    setProblems((currentProblems) =>
      [...currentProblems, createdProblem].sort(
        (first, second) =>
          first.next_review_date.localeCompare(second.next_review_date) ||
          second.created_at.localeCompare(first.created_at),
      ),
    );
    setError(null);
  }

  async function updateProblem(problemId: string, updatedProblem: NewProblem) {
    const response = await fetch(
      `http://localhost:8000/problems/${encodeURIComponent(problemId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProblem),
      },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message =
        body && typeof body.detail === "string"
          ? body.detail
          : `Request failed: ${response.status}`;
      throw new Error(message);
    }

    const updatedDetail = (await response.json()) as ProblemDetail;
    setProblems((currentProblems) =>
      currentProblems
        .map((problem) => (problem.id === problemId ? updatedDetail : problem))
        .sort(
          (first, second) =>
            first.next_review_date.localeCompare(second.next_review_date) ||
            second.created_at.localeCompare(first.created_at),
        ),
    );
    setError(null);
    return updatedDetail;
  }

  async function recordReview(problemId: string, review: NewReview) {
    const response = await fetch(
      `http://localhost:8000/problems/${encodeURIComponent(problemId)}/reviews`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(review),
      },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message =
        body && typeof body.detail === "string"
          ? body.detail
          : `Request failed: ${response.status}`;
      throw new Error(message);
    }

    const updatedDetail = (await response.json()) as ProblemDetail;
    setProblems((currentProblems) =>
      currentProblems
        .map((problem) => (problem.id === problemId ? updatedDetail : problem))
        .sort(
          (first, second) =>
            first.next_review_date.localeCompare(second.next_review_date) ||
            second.created_at.localeCompare(first.created_at),
        ),
    );
    setError(null);
    return updatedDetail;
  }

  async function deleteProblem(problemId: string) {
    const response = await fetch(
      `http://localhost:8000/problems/${encodeURIComponent(problemId)}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message =
        body && typeof body.detail === "string"
          ? body.detail
          : `Request failed: ${response.status}`;
      throw new Error(message);
    }

    setProblems((currentProblems) =>
      currentProblems.filter((problem) => problem.id !== problemId),
    );
    setError(null);
  }

  return {
    problems,
    isLoading,
    error,
    addProblem,
    updateProblem,
    recordReview,
    deleteProblem,
  };
}
