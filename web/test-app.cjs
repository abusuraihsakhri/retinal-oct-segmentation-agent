"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const engine = require("./engine.js");

test("browser form validates, evaluates, and exports a real local result", () => {
  const elements = new Map();
  function get(id) {
    if (!elements.has(id)) elements.set(id, {
      value: "", textContent: "", checked: false, disabled: true, events: {},
      addEventListener(type, handler) {this.events[type] = handler;}
    });
    return elements.get(id);
  }
  get("task_id").value = "T1";
  get("target_id").value = "X1";
  get("primary_metric").value = "26";
  get("secondary_metric").value = "2";
  get("status_descriptor").value = "NOMINAL";
  let downloaded = false;
  const context = {
    document: {
      getElementById: get,
      createElement: () => ({click() {downloaded = true;}})
    },
    window: {RetinaDemo: engine}, Blob,
    URL: {createObjectURL: () => "blob:local", revokeObjectURL() {}},
    setTimeout(fn) {fn();}
  };
  vm.runInNewContext(fs.readFileSync(__dirname + "/app.js", "utf8"), context);
  get("audit-form").events.submit({preventDefault() {}});
  assert.equal(get("m-tasks").textContent, "1");
  assert.equal(get("m-status").textContent, "ELEVATED_RISK");
  assert.equal(JSON.parse(get("output").textContent).audit_hash, null);
  assert.equal(get("export-json").disabled, false);
  get("export-json").events.click();
  assert.equal(downloaded, true);
  get("primary_metric").value = "";
  get("audit-form").events.submit({preventDefault() {}});
  assert.equal(get("m-tasks").textContent, "1");
  assert.match(get("message").textContent, /numerical metrics/);
});

test("static page loads relative resources and has a nonclinical warning", () => {
  const html = fs.readFileSync(__dirname + "/index.html", "utf8");
  assert.match(html, /src="\.\/engine\.js"/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.match(html, /does not upload or segment OCT scans/);
});
