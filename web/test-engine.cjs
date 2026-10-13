"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {evaluate} = require("./engine.js");
const base = {task_id:"T1",target_identifier:"X1",primary_metric:25,
  secondary_metric:12,status_descriptor:"NOMINAL",is_critical_flag:false};
test("boundary values are routine", () => {
  const r=evaluate(base);assert.equal(r.overall_urgency,"ROUTINE");assert.equal(r.total_alerts,0);
});
test("primary metric over 25 is elevated", () => {
  const r=evaluate({...base,primary_metric:25.01});assert.equal(r.overall_urgency,"ELEVATED_RISK");assert.equal(r.total_alerts,1);
});
test("secondary metric over 12 is elevated", () => {
  const r=evaluate({...base,secondary_metric:12.01});assert.equal(r.overall_urgency,"ELEVATED_RISK");
});
test("critical flag sets critical status", () => {
  const r=evaluate({...base,is_critical_flag:true});assert.equal(r.overall_urgency,"CRITICAL_STAT_PANIC");assert.equal(r.critical_alerts_count,1);
});
test("status anomaly is case insensitive and combines alerts", () => {
  const r=evaluate({...base,primary_metric:30,status_descriptor:"discordant"});assert.equal(r.total_alerts,2);
});
test("non-finite values and missing identifiers fail", () => {
  assert.throws(()=>evaluate({...base,primary_metric:NaN}));
  assert.throws(()=>evaluate({...base,secondary_metric:Infinity}));
  assert.throws(()=>evaluate({...base,task_id:" "}));
});
test("does not fabricate signed audit trail", () => {
  assert.equal(evaluate(base).audit_hash,null);
});
