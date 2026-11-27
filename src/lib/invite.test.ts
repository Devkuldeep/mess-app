import { test } from "node:test";
import assert from "node:assert/strict";
import { homeFor, inviteExpiry, isInviteExpired, isInviteToken, isStaffRole, maskPhone } from "./invite.ts";

test("invite expires after 7 days, exactly at the boundary", () => {
  const now = new Date("2026-11-27T10:00:00Z");
  const exp = inviteExpiry(now);
  assert.equal(exp.toISOString(), "2026-12-04T10:00:00.000Z");
  assert.equal(isInviteExpired(exp, new Date("2026-12-04T09:59:59Z")), false);
  assert.equal(isInviteExpired(exp, exp), true);
});

test("only manager/delivery can be invited", () => {
  assert.equal(isStaffRole("manager"), true);
  assert.equal(isStaffRole("delivery"), true);
  assert.equal(isStaffRole("owner"), false);
  assert.equal(isStaffRole(""), false);
});

test("token shape check", () => {
  assert.equal(isInviteToken("a".repeat(32)), true);
  assert.equal(isInviteToken("A-_9".repeat(8)), true);
  assert.equal(isInviteToken("a".repeat(31)), false);
  assert.equal(isInviteToken("a/b".padEnd(32, "x")), false);
  assert.equal(isInviteToken(undefined), false);
});

test("mask phone and home route", () => {
  assert.equal(maskPhone("9876543210"), "98•••••210");
  assert.equal(homeFor("delivery"), "/delivery");
  assert.equal(homeFor("manager"), "/today");
});
