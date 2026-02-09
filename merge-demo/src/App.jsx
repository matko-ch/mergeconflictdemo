import React, { useEffect, useMemo, useState } from "react";

const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

const seed = [
  { id: uid(), title: "Video schneiden", done: false, minutes: 25, category: "Creative" },
  { id: uid(), title: "SQL Uebungen", done: false, minutes: 45, category: "Schule" },
  { id: uid(), title: "Portfolio updaten", done: true, minutes: 15, category: "Career" },
];

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function fmtTime(sec) {
  const s = clamp(sec, 0, 999999);
  const m = Math.floor(s / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, "0");
  const rr = String(r).padStart(2, "0");
  return `${mm}:${rr}`;
}

export default function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("merge_demo_tasks");
    return saved ? JSON.parse(saved) : seed;
  });

  const [filter, setFilter] = useState("all");
  const [newTitle, setNewTitle] = useState("");
  const [newMinutes, setNewMinutes] = useState(25);
  const [newCategory, setNewCategory] = useState("Schule");
  const [activeId, setActiveId] = useState(null);

  const [mode, setMode] = useState("focus"); // focus | break
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    localStorage.setItem("merge_demo_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (secondsLeft > 0) return;
    setRunning(false);
    if (mode === "focus") {
      setMode("break");
      setSecondsLeft(5 * 60);
    } else {
      setMode("focus");
      setSecondsLeft(25 * 60);
    }
  }, [secondsLeft, running, mode]);

  const visible = useMemo(() => {
    if (filter === "all") return tasks;
    if (filter === "done") return tasks.filter((t) => t.done);
    if (filter === "open") return tasks.filter((t) => !t.done);
    return tasks;
  }, [tasks, filter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    const open = total - done;
    const minutes = tasks.reduce((sum, t) => sum + (Number(t.minutes) || 0), 0);
    return { total, done, open, minutes };
  }, [tasks]);

  const addTask = (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const minutes = clamp(Number(newMinutes) || 25, 5, 180);
    const t = { id: uid(), title, done: false, minutes, category: newCategory };
    setTasks((prev) => [t, ...prev]);
    setNewTitle("");
    setNewMinutes(25);
    setNewCategory("Schule");
  };

  const toggle = (id) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const remove = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const pick = (id) => {
    setActiveId(id);
    const t = tasks.find((x) => x.id === id);
    if (t) setSecondsLeft((Number(t.minutes) || 25) * 60);
    setMode("focus");
    setRunning(false);
  };

  const active = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.h1}>FocusBoard</div>
          <div style={styles.sub}>Version B: Pomodoro, Stats, Filter</div>
        </div>

        <div style={styles.timer}>
          <div style={styles.timerMode}>{mode === "focus" ? "Focus" : "Break"}</div>
          <div style={styles.timerTime}>{fmtTime(secondsLeft)}</div>
          <div style={styles.timerBtns}>
            <button
              style={styles.btn}
              onClick={() => setRunning((r) => !r)}
              disabled={!active}
              title={!active ? "Waehle eine Task" : "Start/Stop"}
            >
              {running ? "Stop" : "Start"}
            </button>
            <button
              style={styles.btn}
              onClick={() => {
                setRunning(false);
                setMode("focus");
                setSecondsLeft(((active?.minutes ?? 25) || 25) * 60);
              }}
              disabled={!active}
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <section style={{ ...styles.card, marginBottom: 14 }}>
          <form onSubmit={addTask} style={styles.formRow}>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Neue Task..."
              style={{ ...styles.input, flex: 1 }}
            />
            <input
              type="number"
              min={5}
              max={180}
              value={newMinutes}
              onChange={(e) => setNewMinutes(e.target.value)}
              style={{ ...styles.input, width: 110 }}
            />
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={styles.select}>
              <option value="Schule">Schule</option>
              <option value="Creative">Creative</option>
              <option value="Career">Career</option>
              <option value="Private">Private</option>
            </select>
            <button type="submit" style={styles.btn}>
              Add
            </button>
          </form>

          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <div style={styles.statNum}>{stats.total}</div>
              <div style={styles.statLabel}>Total</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNum}>{stats.open}</div>
              <div style={styles.statLabel}>Open</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNum}>{stats.done}</div>
              <div style={styles.statLabel}>Done</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNum}>{stats.minutes}</div>
              <div style={styles.statLabel}>Min</div>
            </div>
          </div>
        </section>

        <section style={styles.board}>
          <div style={styles.toolbar}>
            <div style={styles.toolbarTitle}>Tasks</div>
            <div style={styles.toolbarControls}>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} style={styles.select}>
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div style={styles.list}>
            {visible.map((t) => (
              <div
                key={t.id}
                style={{
                  ...styles.row,
                  opacity: t.done ? 0.7 : 1,
                  borderColor: activeId === t.id ? "rgba(120,200,255,.5)" : "rgba(255,255,255,.10)",
                }}
                onClick={() => pick(t.id)}
              >
                <div style={styles.rowLeft}>
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggle(t.id);
                    }}
                  />
                  <div>
                    <div style={styles.title}>{t.title}</div>
                    <div style={styles.meta}>
                      {t.category} · {t.minutes}min
                    </div>
                  </div>
                </div>

                <button
                  style={styles.iconBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(t.id);
                    if (activeId === t.id) setActiveId(null);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div style={{ ...styles.card, marginTop: 14 }}>
            <div style={styles.panelTitle}>Aktiv</div>
            {!active ? (
              <div style={styles.muted}>Klicke eine Task in der Liste, um den Timer zu setzen.</div>
            ) : (
              <div style={styles.activeBox}>
                <div>
                  <div style={styles.activeTitle}>{active.title}</div>
                  <div style={styles.activeMeta}>
                    {active.category} · {active.minutes} Minuten
                  </div>
                </div>

                <button
                  style={styles.btn}
                  onClick={() => {
                    toggle(active.id);
                  }}
                >
                  {active.done ? "Mark open" : "Mark done"}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0b1020", color: "#e9eefc" },
  header: {
    padding: 18,
    borderBottom: "1px solid rgba(255,255,255,.08)",
    display: "flex",
    gap: 14,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  h1: { fontSize: 20, fontWeight: 700, letterSpacing: 0.2 },
  sub: { fontSize: 13, opacity: 0.8, marginTop: 4 },
  main: { maxWidth: 980, margin: "0 auto", padding: 16 },
  card: {
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 14,
    padding: 12,
  },
  formRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: {
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 10,
    padding: 10,
    color: "#e9eefc",
    outline: "none",
  },
  select: {
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 10,
    padding: 10,
    color: "#e9eefc",
    outline: "none",
  },
  btn: {
    border: "1px solid rgba(255,255,255,.18)",
    background: "rgba(255,255,255,.10)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#e9eefc",
    cursor: "pointer",
  },
  board: { display: "grid", gridTemplateColumns: "1fr", gap: 12 },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 14,
    background: "rgba(255,255,255,.04)",
  },
  toolbarTitle: { fontWeight: 700 },
  toolbarControls: { display: "flex", gap: 10, alignItems: "center" },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 14,
    background: "rgba(255,255,255,.06)",
    cursor: "pointer",
  },
  rowLeft: { display: "flex", alignItems: "center", gap: 10 },
  title: { fontWeight: 650, fontSize: 14 },
  meta: { fontSize: 12, opacity: 0.75, marginTop: 2 },
  iconBtn: {
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.06)",
    borderRadius: 10,
    padding: "2px 10px",
    color: "#e9eefc",
    cursor: "pointer",
  },
  timer: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.05)",
  },
  timerMode: { fontSize: 12, opacity: 0.85 },
  timerTime: { fontSize: 20, fontWeight: 800, letterSpacing: 0.5 },
  timerBtns: { display: "flex", gap: 8 },
  panelTitle: { fontWeight: 700, marginBottom: 10 },
  muted: { opacity: 0.8, fontSize: 13 },
  activeBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  activeTitle: { fontWeight: 800, fontSize: 16 },
  activeMeta: { opacity: 0.8, marginTop: 4, fontSize: 13 },
  stat: {
    flex: 1,
    minWidth: 90,
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 14,
    padding: 10,
    background: "rgba(255,255,255,.05)",
  },
  statsRow: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" },
  statNum: { fontWeight: 900, fontSize: 18 },
  statLabel: { opacity: 0.8, fontSize: 12, marginTop: 2 },
};
