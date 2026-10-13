/* Deterministic demonstration of agents/workers.py thresholds; not OCT segmentation. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.RetinaDemo = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const TRIGGERS = ["DISCORDANT", "ANOMALY", "MUTANT", "VIOLATION", "FAIL", "REJECT"];

  function evaluate(input) {
    if (!input || typeof input !== "object") throw new TypeError("An evaluation payload is required.");
    const taskId = String(input.task_id ?? "").trim();
    const targetId = String(input.target_identifier ?? "").trim();
    const descriptor = String(input.status_descriptor ?? "NOMINAL").trim();
    if (!taskId || !targetId || !descriptor) throw new Error("Task ID, target ID and descriptor are required.");
    const primary = input.primary_metric;
    const secondary = input.secondary_metric ?? 0;
    if (typeof primary !== "number" || !Number.isFinite(primary) ||
        typeof secondary !== "number" || !Number.isFinite(secondary)) {
      throw new Error("Both metrics must be finite numbers.");
    }
    if (typeof input.is_critical_flag !== "boolean") throw new Error("Critical flag must be a boolean.");
    const alerts = [];
    if (primary > 25) alerts.push({origin_worker: "InvariantQCWorker",
      urgency: "ELEVATED_RISK", summary: "Primary Metric Threshold Exceeded",
      technical_details: "Primary measurement exceeds demonstration threshold (25)."});
    if (input.is_critical_flag || secondary > 12) alerts.push({
      origin_worker: "SafetyEscalationWorker",
      urgency: input.is_critical_flag ? "CRITICAL_STAT_PANIC" : "ELEVATED_RISK",
      summary: "Safety Flag or Secondary Threshold Triggered",
      technical_details: "Critical flag is " + input.is_critical_flag + "; secondary metric is " + secondary + " (threshold 12)."
    });
    if (TRIGGERS.some(t => descriptor.toUpperCase().includes(t))) alerts.push({
      origin_worker: "ProtocolConformanceWorker", urgency: "ELEVATED_RISK",
      summary: "Status Descriptor Flagged",
      technical_details: "Descriptor contains a configured anomaly keyword."
    });
    const criticalCount = alerts.filter(a => a.urgency === "CRITICAL_STAT_PANIC").length;
    const urgency = criticalCount ? "CRITICAL_STAT_PANIC" : alerts.length ? "ELEVATED_RISK" : "ROUTINE";
    const integrity = criticalCount ? "RECALIBRATION_REQUIRED" : alerts.length ? "DISCORDANT_ANOMALY" : "VALIDATED_OPTIMAL";
    return {
      mode: "LOCAL_RULE_DEMONSTRATION",
      task_id: taskId, target_identifier: targetId,
      overall_urgency: urgency, integrity_status: integrity,
      total_alerts: alerts.length, critical_alerts_count: criticalCount, alerts,
      consensus_summary: "Deterministic rule evaluation completed; no OCT image was analyzed.",
      audit_hash: null
    };
  }
  return {evaluate};
});
