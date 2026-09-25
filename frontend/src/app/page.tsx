"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/")
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      return res.json()
    })
    .then(data => setData(data))
    .catch(e => setError(String(e)))
  }, [])
  return (
    <div>
      {data}
    </div>
  );
}
