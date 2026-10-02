"use client";
import { useEffect, useState } from "react";
export function Countdown({
  deadline,
  active,
}: {
  deadline: string;
  active: boolean;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds =
    now === null
      ? null
      : Math.max(0, Math.floor((Date.parse(deadline) - now) / 1000));
  return (
    <div>
      <strong>
        {!active
          ? "Experiment ended"
          : seconds === null
            ? "Calculating time remaining…"
            : seconds === 0
              ? "Deadline reached — final analysis only"
              : `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s remaining`}
      </strong>
      <p>
        Deadline: <time dateTime={deadline}>{deadline.replace("T", " ")}</time>
      </p>
    </div>
  );
}
