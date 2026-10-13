"use strict";
const form = document.getElementById("audit-form");
const output = document.getElementById("output");
const message = document.getElementById("message");
const count = document.getElementById("m-tasks");
const status = document.getElementById("m-status");
const exportButton = document.getElementById("export-json");
let lastResult = null;
let evaluated = 0;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "";
  try {
    const p = document.getElementById("primary_metric").value.trim();
    const s = document.getElementById("secondary_metric").value.trim();
    if (!p || !s) throw new Error("Enter both numerical metrics.");
    const result = window.RetinaDemo.evaluate({
      task_id: document.getElementById("task_id").value,
      target_identifier: document.getElementById("target_id").value,
      primary_metric: Number(p),
      secondary_metric: Number(s),
      status_descriptor: document.getElementById("status_descriptor").value,
      is_critical_flag: document.getElementById("is_critical").checked
    });
    lastResult = result;
    output.textContent = JSON.stringify(result, null, 2);
    count.textContent = String(++evaluated);
    status.textContent = result.overall_urgency;
    exportButton.disabled = false;
  } catch (error) {
    message.textContent = error.message;
  }
});

exportButton.addEventListener("click", () => {
  if (!lastResult) return;
  const blob = new Blob([JSON.stringify(lastResult, null, 2) + "\n"], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "oct-rule-evaluation.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
