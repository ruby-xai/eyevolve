"use client";

import { useEffect, useState } from "react";
import type { AutonomyMode, SceneDef, ScoredChange } from "@/lib/types";
import { selectAutonomousActionPlan } from "@/lib/evolution-narrative";
import { formatScore } from "@/lib/scoring";
import { SimulatedCall } from "./SimulatedCall";

type IntelligencePanelProps = {
  scene: SceneDef;
  mode: AutonomyMode;
  scores: ScoredChange[];
  ranking: string[];
  selectedActionIds: string[];
  isCorrecting: boolean;
  correctionReason: string;
  isEvolving: boolean;
  actionsPaused: boolean;
  onHoverChange: (changeId: string | null) => void;
  onMoveRank: (changeId: string, direction: -1 | 1) => void;
  onToggleAction: (changeId: string) => void;
  onSubmitHuman: () => void;
  onAcceptAi: () => void;
  onStartCorrection: () => void;
  onCancelCorrection: () => void;
  onCorrectionReasonChange: (reason: string) => void;
  onSubmitCorrection: () => void;
  onRecordAutonomousAction: () => void;
};

const correctionReasons = [
  "Wrong priority",
  "Too severe",
  "Not severe enough",
  "Wrong action",
  "Should have been ignored",
  "Other",
];

const IMAGE_READY_DELAY_MS = 5400;
const CHANGE_SCAN_STEP_MS = 950;
const ACTION_OVERLAY_DELAY_MS = 1800;

function RankingEditor({
  scores,
  ranking,
  selectedActionIds,
  onMoveRank,
  onToggleAction,
  onHoverChange,
}: Pick<
  IntelligencePanelProps,
  | "scores"
  | "ranking"
  | "selectedActionIds"
  | "onMoveRank"
  | "onToggleAction"
  | "onHoverChange"
>) {
  const byId = new Map(scores.map((score) => [score.id, score]));
  const ranked = ranking.map((id) => byId.get(id)).filter(Boolean) as ScoredChange[];

  return (
    <div className="change-list">
      {ranked.map((change, index) => (
        <article
          className="change-card"
          key={change.id}
          onMouseEnter={() => onHoverChange(change.id)}
          onMouseLeave={() => onHoverChange(null)}
        >
          <div className="change-row">
            <span className="panel-badge">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <div className="change-name">{change.label}</div>
              <p className="change-description">{change.description}</p>
            </div>
            <div className="rank-buttons">
              <button
                className="icon-button"
                aria-label={`Move ${change.label} up`}
                disabled={index === 0}
                onClick={() => onMoveRank(change.id, -1)}
              >
                ↑
              </button>
              <button
                className="icon-button"
                aria-label={`Move ${change.label} down`}
                disabled={index === ranked.length - 1}
                onClick={() => onMoveRank(change.id, 1)}
              >
                ↓
              </button>
            </div>
          </div>
          <label className="action-select">
            <input
              type="checkbox"
              checked={selectedActionIds.includes(change.id)}
              onChange={() => onToggleAction(change.id)}
            />
            Requires intervention
          </label>
        </article>
      ))}
    </div>
  );
}

function AutonomousScanList({
  scores,
  primaryId,
  imagesReady,
  scanIndex,
  primaryStatusLabel,
  onHoverChange,
}: {
  scores: ScoredChange[];
  primaryId: string | undefined;
  imagesReady: boolean;
  scanIndex: number;
  primaryStatusLabel: string;
  onHoverChange: (changeId: string | null) => void;
}) {
  if (!imagesReady) {
    return (
      <div className="autonomous-scan-wait">
        <span className="eyebrow">Waiting for imagery</span>
        <strong>Satellite mosaic is still rendering.</strong>
        <p>The autonomous review begins after the before/after tiles are fully visible.</p>
      </div>
    );
  }

  return (
    <div className="autonomous-scan-list">
      {scores.map((change, index) => {
        const processed = index < scanIndex;
        const isPrimary = change.id === primaryId;
        const suppressed = processed && !isPrimary;
        const status = !processed
          ? "Scanning"
          : isPrimary
            ? primaryStatusLabel
            : change.ignored
              ? "Suppressed"
              : "No action";

        return (
          <article
            className={[
              "autonomous-scan-card",
              processed ? "processed" : "",
              suppressed ? "suppressed" : "",
              processed && isPrimary ? "critical" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={change.id}
            onMouseEnter={() => onHoverChange(change.id)}
            onMouseLeave={() => onHoverChange(null)}
          >
            <div className="scan-card-topline">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{status}</strong>
            </div>
            <div className="change-name">{change.label}</div>
            <p className="change-description">{change.description}</p>
          </article>
        );
      })}
    </div>
  );
}

function AiPriorityList({
  scores,
  onHoverChange,
  showIgnored,
}: {
  scores: ScoredChange[];
  onHoverChange: (changeId: string | null) => void;
  showIgnored: boolean;
}) {
  const visible = showIgnored ? scores : scores.filter((score) => !score.ignored);
  return (
    <div className="change-list">
      {visible.map((change, index) => (
        <article
          className={`change-card ${change.ignored ? "ignored" : ""}`}
          key={change.id}
          onMouseEnter={() => onHoverChange(change.id)}
          onMouseLeave={() => onHoverChange(null)}
        >
          <div className="change-row">
            <span className="panel-badge">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <div className="change-name">{change.label}</div>
              <p className="change-description">{change.description}</p>
            </div>
            <strong>{formatScore(change.attentionScore)}</strong>
          </div>
        </article>
      ))}
    </div>
  );
}

export function IntelligencePanel(props: IntelligencePanelProps) {
  const {
    scene,
    mode,
    scores,
    ranking,
    selectedActionIds,
    isCorrecting,
    correctionReason,
    isEvolving,
    actionsPaused,
    onHoverChange,
    onMoveRank,
    onToggleAction,
    onSubmitHuman,
    onAcceptAi,
    onStartCorrection,
    onCancelCorrection,
    onCorrectionReasonChange,
    onSubmitCorrection,
    onRecordAutonomousAction,
  } = props;
  const actionable = scores.find((score) => score.actionRequired && !score.ignored);
  const ignored = scores.filter((score) => score.ignored);
  const analyzed = scores.filter((score) => !score.ignored);
  const [autonomousScanIndex, setAutonomousScanIndex] = useState(0);
  const [autonomousImagesReady, setAutonomousImagesReady] = useState(false);
  const [showActionOverlay, setShowActionOverlay] = useState(false);
  const autonomousPrimary = actionable ?? analyzed[0];
  const autonomousPrimaryId = autonomousPrimary?.id;
  const actionPlan = selectAutonomousActionPlan(scene, autonomousPrimary);
  const scanComplete =
    autonomousImagesReady && autonomousScanIndex >= scores.length;

  useEffect(() => {
    if (mode !== "autonomous" && mode !== "exception-management") {
      setAutonomousScanIndex(0);
      setAutonomousImagesReady(false);
      setShowActionOverlay(false);
      return;
    }

    const timers: number[] = [];
    setAutonomousScanIndex(0);
    setAutonomousImagesReady(false);
    setShowActionOverlay(false);

    timers.push(
      window.setTimeout(() => {
        setAutonomousImagesReady(true);
      }, IMAGE_READY_DELAY_MS),
    );

    scores.forEach((_, index) => {
      timers.push(
        window.setTimeout(
          () => {
            setAutonomousScanIndex(index + 1);
            if (scores[index]?.id === autonomousPrimaryId) {
              onHoverChange(scores[index].id);
            }
          },
          IMAGE_READY_DELAY_MS + CHANGE_SCAN_STEP_MS * (index + 1),
        ),
      );
    });

    if (mode === "autonomous") {
      timers.push(
        window.setTimeout(
          () => setShowActionOverlay(true),
          IMAGE_READY_DELAY_MS +
            CHANGE_SCAN_STEP_MS * scores.length +
            ACTION_OVERLAY_DELAY_MS,
        ),
      );
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      onHoverChange(null);
    };
  }, [autonomousPrimaryId, mode, onHoverChange, scene.id, scores]);

  if (mode === "human") {
    return (
      <section className="panel intelligence-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Human training mode</span>
            <h2>Rank what matters</h2>
          </div>
          <span className="panel-badge">{scores.length} changes</span>
        </div>
        <p className="change-description">
          Move changes from most to least important, then mark any change that
          requires intervention.
        </p>
        <RankingEditor
          scores={scores}
          ranking={ranking}
          selectedActionIds={selectedActionIds}
          onMoveRank={onMoveRank}
          onToggleAction={onToggleAction}
          onHoverChange={onHoverChange}
        />
        <div className="button-row">
          <button className="primary-button" disabled={isEvolving} onClick={onSubmitHuman}>
            {isEvolving ? "Updating policy..." : "Submit judgment"}
          </button>
        </div>
      </section>
    );
  }

  if (isCorrecting) {
    return (
      <section className="panel intelligence-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Correction mode</span>
            <h2>Correct EYEVOLVE</h2>
          </div>
        </div>
        <RankingEditor
          scores={scores}
          ranking={ranking}
          selectedActionIds={selectedActionIds}
          onMoveRank={onMoveRank}
          onToggleAction={onToggleAction}
          onHoverChange={onHoverChange}
        />
        <div className="correction-box">
          <label>
            <span className="eyebrow">Reason</span>
            <select
              className="select-field"
              value={correctionReason}
              onChange={(event) => onCorrectionReasonChange(event.target.value)}
            >
              {correctionReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>
          <div className="button-row">
            <button className="primary-button" disabled={isEvolving} onClick={onSubmitCorrection}>
              {isEvolving ? "Applying correction..." : "Apply correction"}
            </button>
            <button className="secondary-button" disabled={isEvolving} onClick={onCancelCorrection}>
              Cancel
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (mode === "ai-review") {
    return (
      <section className="panel intelligence-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">AI review mode</span>
            <h2>EYEVOLVE judgment</h2>
          </div>
          <span className="panel-badge">Human confirms</span>
        </div>
        <AiPriorityList scores={scores} onHoverChange={onHoverChange} showIgnored />
        <div className="learned-callout">
          <div className="eyebrow">Action recommendation</div>
          <strong>
            {actionable ? actionable.suggestedAction ?? scene.recommendedAction : "No intervention recommended"}
          </strong>
          <p className="change-description">
            {actionable
              ? `${actionable.label} crossed the learned action threshold.`
              : "No change crossed the current learned action threshold."}
          </p>
        </div>
        <div className="button-row">
          <button className="primary-button" disabled={isEvolving} onClick={onAcceptAi}>
            {isEvolving ? "Updating trust..." : "Yes, matches my judgment"}
          </button>
          <button className="secondary-button" disabled={isEvolving} onClick={onStartCorrection}>
            Correct EYEVOLVE
          </button>
        </div>
      </section>
    );
  }

  if (mode === "exception-management") {
    return (
      <section className="panel intelligence-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Exception management</span>
            <h2>Only meaningful exceptions</h2>
          </div>
          <span className="panel-badge">{ignored.length} suppressed</span>
        </div>
        <AutonomousScanList
          scores={scores}
          primaryId={autonomousPrimaryId}
          imagesReady={autonomousImagesReady}
          scanIndex={autonomousScanIndex}
          primaryStatusLabel={actionPlan.label}
          onHoverChange={onHoverChange}
        />
        <div className={`learned-callout ${scanComplete ? "" : "pending-scan"}`}>
          <div className="eyebrow">Proposed action</div>
          <strong>
            {scanComplete
              ? actionable
                ? actionable.suggestedAction ?? scene.recommendedAction
                : "Monitor only"
              : "Scanning observed changes..."}
          </strong>
        </div>
        <div className="button-row">
          <button
            className="primary-button"
            disabled={isEvolving || !scanComplete}
            onClick={onAcceptAi}
          >
            {isEvolving ? "Recording agreement..." : "Confirm judgment"}
          </button>
          <button
            className="secondary-button"
            disabled={isEvolving || !scanComplete}
            onClick={onStartCorrection}
          >
            Override
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`panel intelligence-panel autonomous-panel ${
        showActionOverlay ? "action-overlay-open" : ""
      }`}
    >
      <div className="panel-underlay">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Autonomous mode</span>
            <h2>Autonomous dispatch</h2>
          </div>
          <span className="panel-badge">Override available</span>
        </div>
        <AutonomousScanList
          scores={scores}
          primaryId={autonomousPrimaryId}
          imagesReady={autonomousImagesReady}
          scanIndex={autonomousScanIndex}
          primaryStatusLabel={actionPlan.label}
          onHoverChange={onHoverChange}
        />
        <div className="button-row">
          <button className="secondary-button" disabled={isEvolving} onClick={onStartCorrection}>
            Override
          </button>
        </div>
      </div>

      {showActionOverlay ? (
        <div className="judgment-action-popup">
          <SimulatedCall
            service={scene.actionService ?? "Service desk"}
            incident={actionable?.label ?? scene.recommendedAction ?? "an actionable satellite event"}
            plan={actionPlan}
            paused={actionsPaused}
            isEvolving={isEvolving}
            onCompleteAction={onRecordAutonomousAction}
          />
        </div>
      ) : null}
    </section>
  );
}
