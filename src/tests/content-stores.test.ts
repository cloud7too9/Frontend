import { beforeEach, describe, expect, it } from "vitest";
import { useNotesStore } from "../features/content/notes.store";
import { useTasksStore } from "../features/content/tasks.store";
import { normalizeUrl, useFilesStore } from "../features/content/files.store";
import { useActivityStore } from "../features/content/activity.store";

beforeEach(() => {
  localStorage.clear();
  useNotesStore.setState({ text: "" });
  useTasksStore.setState({ tasks: [] });
  useFilesStore.setState({ files: [] });
  useActivityStore.setState({ entries: [] });
});

describe("notes.store", () => {
  it("stores and updates text", () => {
    useNotesStore.getState().setText("Hallo Welt");
    expect(useNotesStore.getState().text).toBe("Hallo Welt");
  });

  it("persists to localStorage under the correct key", () => {
    useNotesStore.getState().setText("persist me");
    const raw = localStorage.getItem("mainhub.notes.v1");
    expect(raw).toBeTruthy();
    expect(raw).toContain("persist me");
  });
});

describe("tasks.store", () => {
  it("adds a task", () => {
    useTasksStore.getState().addTask("Layout fixen");
    const tasks = useTasksStore.getState().tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].text).toBe("Layout fixen");
    expect(tasks[0].done).toBe(false);
  });

  it("ignores empty input", () => {
    useTasksStore.getState().addTask("   ");
    expect(useTasksStore.getState().tasks.length).toBe(0);
  });

  it("toggles done state", () => {
    useTasksStore.getState().addTask("Test");
    const id = useTasksStore.getState().tasks[0].id;
    useTasksStore.getState().toggleTask(id);
    expect(useTasksStore.getState().tasks[0].done).toBe(true);
    useTasksStore.getState().toggleTask(id);
    expect(useTasksStore.getState().tasks[0].done).toBe(false);
  });

  it("removes a task by id", () => {
    useTasksStore.getState().addTask("A");
    useTasksStore.getState().addTask("B");
    const first = useTasksStore.getState().tasks[0].id;
    useTasksStore.getState().removeTask(first);
    const tasks = useTasksStore.getState().tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].text).toBe("B");
  });

  it("logs an activity entry on add", () => {
    useTasksStore.getState().addTask("Neues Ding");
    const entries = useActivityStore.getState().entries;
    expect(entries[0].type).toBe("task");
    expect(entries[0].label).toContain("Neues Ding");
  });
});

describe("files.store", () => {
  it("adds a file entry with optional url", () => {
    useFilesStore.getState().addFile("plan.md", "https://example.org/plan");
    const files = useFilesStore.getState().files;
    expect(files.length).toBe(1);
    expect(files[0].name).toBe("plan.md");
    expect(files[0].url).toBe("https://example.org/plan");
  });

  it("stores entry without url when none is given", () => {
    useFilesStore.getState().addFile("notes.txt");
    expect(useFilesStore.getState().files[0].url).toBeUndefined();
  });

  it("ignores empty name", () => {
    useFilesStore.getState().addFile("   ");
    expect(useFilesStore.getState().files.length).toBe(0);
  });

  it("removes a file by id", () => {
    useFilesStore.getState().addFile("a.txt");
    const id = useFilesStore.getState().files[0].id;
    useFilesStore.getState().removeFile(id);
    expect(useFilesStore.getState().files.length).toBe(0);
  });
});

describe("normalizeUrl", () => {
  it("prepends https:// when no scheme is given", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com/");
  });

  it("keeps an existing http scheme", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("keeps an existing https scheme", () => {
    expect(normalizeUrl("https://example.com/path")).toBe("https://example.com/path");
  });

  it("returns undefined for empty input", () => {
    expect(normalizeUrl("")).toBeUndefined();
    expect(normalizeUrl("   ")).toBeUndefined();
  });

  it("returns undefined for invalid urls", () => {
    expect(normalizeUrl("http://")).toBeUndefined();
  });
});

describe("files.store URL handling", () => {
  it("normalizes URLs before storing", () => {
    useFilesStore.getState().addFile("doc", "example.com/doc");
    expect(useFilesStore.getState().files[0].url).toBe("https://example.com/doc");
  });

  it("drops invalid URLs but keeps the entry", () => {
    useFilesStore.getState().addFile("doc", "http://");
    const file = useFilesStore.getState().files[0];
    expect(file.name).toBe("doc");
    expect(file.url).toBeUndefined();
  });
});

describe("activity.store", () => {
  it("prepends new entries (newest first)", () => {
    useActivityStore.getState().log({ type: "note", label: "first" });
    useActivityStore.getState().log({ type: "task", label: "second" });
    const entries = useActivityStore.getState().entries;
    expect(entries[0].label).toBe("second");
    expect(entries[1].label).toBe("first");
  });

  it("caps the log at 20 entries", () => {
    for (let i = 0; i < 30; i++) {
      useActivityStore.getState().log({ type: "note", label: `entry ${i}` });
    }
    expect(useActivityStore.getState().entries.length).toBe(20);
  });

  it("ignores blank labels", () => {
    useActivityStore.getState().log({ type: "note", label: "   " });
    expect(useActivityStore.getState().entries.length).toBe(0);
  });

  it("clear empties the log", () => {
    useActivityStore.getState().log({ type: "tool", label: "x" });
    useActivityStore.getState().clear();
    expect(useActivityStore.getState().entries.length).toBe(0);
  });
});
