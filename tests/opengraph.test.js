import { describe, it } from "node:test";
import assert from "node:assert/strict";
import opengraph from "../src/_data/opengraph.js";

describe("ogReadablePostDate", () => {
  it("formats a date string into British full date format", () => {
    // After the source fix to use setLocale("en-GB"), this should produce
    // "1 January 2025" (day without leading zero, full month name, year)
    const result = opengraph.ogReadablePostDate("2025-01-01");
    assert.equal(result, "1 January 2025");
  });

  it("formats a Date object input", () => {
    const result = opengraph.ogReadablePostDate(
      new Date("2025-06-15T12:00:00Z")
    );
    assert.equal(result, "15 June 2025");
  });

  it("handles BST timezone boundary (summer, UTC+1)", () => {
    // 2025-06-30 23:30 UTC = 2025-07-01 00:30 BST (London is UTC+1 in summer)
    const result = opengraph.ogReadablePostDate(
      new Date("2025-06-30T23:30:00Z")
    );
    assert.equal(result, "1 July 2025");
  });

  it("handles GMT dates (winter, no timezone shift)", () => {
    // In winter, London is UTC+0, so no shift
    const result = opengraph.ogReadablePostDate(
      new Date("2025-01-15T12:00:00Z")
    );
    assert.equal(result, "15 January 2025");
  });

  it("handles date string input for BST period", () => {
    const result = opengraph.ogReadablePostDate("2025-07-04");
    assert.equal(result, "4 July 2025");
  });
});
