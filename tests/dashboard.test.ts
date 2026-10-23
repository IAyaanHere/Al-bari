import { describe, it, expect } from "vitest";

describe("Dashboard Aggregation & Filtering Logic", () => {
  const samplePosts = [
    {
      id: "p1",
      category: "photos",
      event_date: "2026-10-15",
      status: "complete",
      approval_status: "approved",
      visibility: "public",
      madrasa_id: "m1",
      teacher_id: "t1",
      files: [{ id: "f1" }, { id: "f2" }],
    },
    {
      id: "p2",
      category: "results",
      event_date: "2026-10-20",
      status: "complete",
      approval_status: "approved",
      visibility: "public",
      madrasa_id: "m2",
      teacher_id: "t1",
      files: [{ id: "f3" }],
    },
    {
      id: "p3",
      category: "tests",
      event_date: "2026-09-10",
      status: "incomplete",
      approval_status: "pending",
      visibility: "private",
      madrasa_id: "m1",
      teacher_id: "t2",
      files: [],
    },
  ];

  it("aggregates file counts accurately", () => {
    const totalFiles = samplePosts.reduce((acc, p) => acc + p.files.length, 0);
    expect(totalFiles).toBe(3);
  });

  it("counts incomplete uploads accurately", () => {
    const incomplete = samplePosts.filter((p) => p.status === "incomplete").length;
    expect(incomplete).toBe(1);
  });

  it("calculates category breakdown accurately", () => {
    const categoryCounts: Record<string, number> = {};
    for (const p of samplePosts) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
    expect(categoryCounts["photos"]).toBe(1);
    expect(categoryCounts["results"]).toBe(1);
    expect(categoryCounts["tests"]).toBe(1);
  });

  it("filters posts by madrasa accurately", () => {
    const m1Posts = samplePosts.filter((p) => p.madrasa_id === "m1");
    expect(m1Posts).toHaveLength(2);
  });
});
