import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell, toCsv } from "./csv.ts";

test("csv quoting", () => {
  assert.equal(csvCell("plain"), "plain");
  assert.equal(csvCell('He said "hi"'), '"He said ""hi"""');
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell("line1\nline2"), '"line1\nline2"');
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(60.5), "60.5");
});

test("csv blocks formula injection", () => {
  assert.equal(csvCell("=HYPERLINK(\"x\")"), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell("+91 98765"), "'+91 98765");
  assert.equal(csvCell("-5"), "'-5");
  assert.equal(csvCell("@cmd"), "'@cmd");
  assert.equal(csvCell(-5), "-5"); // real numbers untouched
});

test("toCsv adds BOM and CRLF, keeps Hindi", () => {
  const out = toCsv(["name", "notes"], [["रवि", "कम तीखा"]]);
  assert.ok(out.startsWith("﻿name,notes\r\n"));
  assert.ok(out.endsWith("रवि,कम तीखा\r\n"));
});

