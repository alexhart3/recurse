"use client";

import { useEffect, useState } from "react";
import type { Problem } from "./problem";

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

  return { problems, isLoading, error };
}
