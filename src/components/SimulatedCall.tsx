"use client";

import { useEffect, useMemo, useState } from "react";

type SimulatedCallProps = {
  service: string;
  incident: string;
  paused: boolean;
  isEvolving: boolean;
  onCompleteAction: () => void;
};

const prepSteps = [
  "Locate responsible service",
  "Assemble incident context",
  "Package satellite evidence",
  "Open simulated dispatch line",
];

export function SimulatedCall({
  service,
  incident,
  paused,
  isEvolving,
  onCompleteAction,
}: SimulatedCallProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const transcript = useMemo(
    () => [
      {
        speaker: "EYEVOLVE",
        text: `I'm reporting ${incident.toLowerCase()} near the monitored corridor.`,
      },
      { speaker: "DISPATCH", text: "What kind of obstruction or hazard is visible?" },
      {
        speaker: "EYEVOLVE",
        text: "The satellite delta shows an actionable condition with stopped or exposed traffic nearby.",
      },
      { speaker: "DISPATCH", text: "Understood. We'll dispatch a crew." },
    ],
    [incident],
  );
  const totalLines = prepSteps.length + transcript.length;
  const isComplete = visibleLines >= totalLines;

  useEffect(() => {
    setVisibleLines(0);
  }, [incident, service]);

  useEffect(() => {
    if (paused || isComplete) {
      return;
    }

    const initialDelay = visibleLines === 0 ? 700 : 0;
    const timeout = window.setTimeout(() => {
      setVisibleLines((current) => Math.min(totalLines, current + 1));
    }, initialDelay || 1120);

    return () => window.clearTimeout(timeout);
  }, [isComplete, paused, totalLines, visibleLines]);

  const currentStepIndex = Math.min(visibleLines, prepSteps.length);
  const transcriptCount = Math.max(0, visibleLines - prepSteps.length);

  return (
    <div className="dispatch-panel">
      <div className="dispatch-head">
        <div>
          <span className="eyebrow">Simulated agent action</span>
          <h3>Dispatch request</h3>
        </div>
        <span className={`dispatch-state ${isComplete ? "complete" : ""}`}>
          {isComplete ? "Confirmed" : paused ? "Queued" : "In progress"}
        </span>
      </div>

      <div className="dispatch-route">
        <span>EYEVOLVE</span>
        <span className="route-line" />
        <span>{service}</span>
      </div>

      <div className="action-stage-list">
        {prepSteps.map((step, index) => {
          const done = index < currentStepIndex;
          const active = index === currentStepIndex && !paused && !isComplete;
          return (
            <div
              className={`action-stage ${done ? "done" : ""} ${active ? "active" : ""}`}
              key={step}
            >
              <span>{done ? "✓" : active ? "●" : "○"}</span>
              <div>{step}</div>
            </div>
          );
        })}
      </div>

      <div className="call-panel compact">
        {transcript.slice(0, transcriptCount).map((line) => (
          <div className="call-line" key={`${line.speaker}-${line.text}`}>
            <span className="call-speaker">{line.speaker}</span>
            <div>{line.text}</div>
          </div>
        ))}
      </div>

      {isComplete ? (
        <div className="action-complete-banner">
          <div>
            <span className="eyebrow">Action complete</span>
            <strong>{service} confirmed dispatch.</strong>
            <p>Incident context has been added to EYEVOLVE history.</p>
          </div>
          <button
            className="primary-button"
            disabled={isEvolving}
            onClick={onCompleteAction}
          >
            {isEvolving ? "Persisting..." : "Continue evolution"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
