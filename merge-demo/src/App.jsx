import React, { useEffect, useMemo, useRef, useState } from "react";

const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

const initial = [
  { id: uid(), title: "Landing Page fixen", status: "todo", priority: "mid", tags: ["ui"], notes: "" },
  { id: uid(), title: "Login Bug", status: "doing", priority: "high", tags: ["auth"], notes: "Repro: Safari iOS" },
  { id: uid(), title: "Readme updaten", status: "done", priority: "low", tags: ["docs"], notes: "" },
];

const columns = [
  { key: "todo", label: "Todo" },
  { key: "doing", label: "Doing" },
  { key: "done", label: "Done" },
];

const badge = (p) => (p === "high" ? "High" : p === "mid" ? "Mid" : "Low");

export default function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("merge_demo_items");
    return saved ? JSON.parse(saved) : initial;
  });

  const [query, setQuery] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState("mid");
  const [quickStatus, setQuickStatus] = useState("todo");
  const [activeId, setActiveId] = useState(null);

  const dragFrom = useRef(null);

  useEffect(() => {
    localStorage.setItem("merge_demo_items", JSON.stringify(items));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((t) => {
      const blob = `${t.title} ${t.status} ${t.priority} ${t.tags.join(" ")} ${t.notes}`.toLowerCase();
      return blob.includes(q);
    });
  }, [items, query]);

  const counts = useMemo(() => {
    const c = { todo: 0, doing: 0, done: 0 };
    for (const t of filtered) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [filtered]);

  const addQuick = (e) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    const newItem = {
      id: uid(),
      title,
      status: quickStatus,
      priority: quickPriority,
      tags: [],
      notes: "",
    };
    setItems((prev) => [newItem, ...prev]);
    setQuickTitle("");
    setQuickPriority("mid");
    setQuickStatus("todo");
  };

  const remove = (id) => setItems((prev) => prev.filter((t) => t.id !== id));

  const update = (id, patch) =>
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const move = (id, status) => update(id, { status });

  const onDragStart = (id) => {
    dragFrom.current = id;
  };

  const onDropTo = (status) => {
    const id = dragFrom.current;
    dragFrom.current = null;
    if (!id) return;
    move(id, status);
  };

  const selected = activeId ? items.find((t) => t.id === activeId) : null;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.h1}>MiniBoard</div>
          <div style={styles.sub}>Version A: Kanban, Quick Add, lokales Speichern</div>
        </div>

        <div style={styles.searchWrap}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen: title, tag, notes..."
            style={styles.input}
          />
        </div>
      </header>

      <main style={styles.main}>
        <section style={{ ...styles.card, marginBottom: 14 }}>
          <form onSubmit={addQuick} style={styles.formRow}>
            <input
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Neue Task..."
              style={{ ...styles.input, flex: 1 }}
            />
            <select value={quickStatus} onChange={(e) => setQuickStatus(e.target.value)} style={styles.select}>
              {columns.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <select value={quickPriority} onChange={(e) => setQuickPriority(e.target.value)} style={styles.select}>
              <option value="high">High</option>
              <option value="mid">Mid</option>
              <option value="low">Low</option>
            </select>
            <button type="submit" style={styles.btn}>
              Add
            </button>
          </form>
        </section>

        <section style={styles.board}>
          {columns.map((col) => (
            <div
              key={col.key}
              style={styles.col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropTo(col.key)}
            >
              <div style={styles.colHeader}>
                <div>{col.label}</div>
                <div style={styles.pill}>{counts[col.key] || 0}</div>
              </div>

              <div style={styles.stack}>
                {filtered
                  .filter((t) => t.status === col.key)
                  .map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => onDragStart(t.id)}
                      onClick={() => setActiveId(t.id)}
                      style={{
                        ...styles.task,
                        borderColor: t.priority === "high" ? "rgba(255,80,80,.45)" : "rgba(255,255,255,.10)",
                      }}
                    >
                      <div style={styles.taskTop}>
                        <div style={styles.taskTitle}>{t.title}</div>
                        <div style={styles.badge}>{badge(t.priority)}</div>
                      </div>

                      <div style={styles.taskBottom}>
                        <div style={styles.mini}>
                          {t.tags.length ? t.tags.map((x) => `#${x}`).join(" ") : "keine tags"}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(t.id);
                          }}
                          style={styles.iconBtn}
                          aria-label="delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </section>

        <section style={{ ...styles.card, marginTop: 14 }}>
          <div style={styles.panelTitle}>Details</div>
          {!selected ? (
            <div style={styles.muted}>Klicke eine Task an, um sie zu bearbeiten.</div>
          ) : (
            <div style={styles.detailGrid}>
              <div style={styles.field}>
                <div style={styles.label}>Titel</div>
                <input
                  value={selected.title}
                  onChange={(e) => update(selected.id, { title: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <div style={styles.label}>Status</div>
                <select
                  value={selected.status}
                  onChange={(e) => update(selected.id, { status: e.target.value })}
                  style={styles.select}
                >
                  {columns.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <div style={styles.label}>Prioritaet</div>
                <select
                  value={selected.priority}
                  onChange={(e) => update(selected.id, { priority: e.target.value })}
                  style={styles.select}
                >
                  <option value="high">High</option>
                  <option value="mid">Mid</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                <div style={styles.label}>Notizen</div>
                <textarea
                  value={selected.notes}
                  onChange={(e) => update(selected.id, { notes: e.target.value })}
                  rows={4}
                  style={styles.textarea}
                />
              </div>

              <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                <div style={styles.label}>Tags (comma separated)</div>
                <input
                  value={selected.tags.join(",")}
                  onChange={(e) =>
                    update(selected.id, {
                      tags: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                  style={styles.input}
                />
              </div>
            </div>
          )}
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
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  h1: { fontSize: 20, fontWeight: 700, letterSpacing: 0.2 },
  sub: { fontSize: 13, opacity: 0.8, marginTop: 4 },
  searchWrap: { minWidth: 260 },
  main: { maxWidth: 1100, margin: "0 auto", padding: 16 },
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
  textarea: {
    width: "100%",
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 10,
    padding: 10,
    color: "#e9eefc",
    outline: "none",
    resize: "vertical",
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
  board: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  col: {
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 14,
    padding: 10,
    minHeight: 260,
  },
  colHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  pill: {
    fontSize: 12,
    opacity: 0.9,
    padding: "2px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.12)",
  },
  stack: { display: "flex", flexDirection: "column", gap: 10 },
  task: {
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 12,
    padding: 10,
    background: "rgba(255,255,255,.06)",
    cursor: "pointer",
  },
  taskTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  taskTitle: { fontWeight: 650, fontSize: 14, lineHeight: 1.2 },
  badge: {
    fontSize: 12,
    opacity: 0.9,
    padding: "2px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.12)",
  },
  taskBottom: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 8 },
  mini: { fontSize: 12, opacity: 0.75 },
  iconBtn: {
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.06)",
    borderRadius: 10,
    padding: "2px 10px",
    color: "#e9eefc",
    cursor: "pointer",
  },
  panelTitle: { fontWeight: 700, marginBottom: 10 },
  muted: { opacity: 0.8, fontSize: 13 },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, opacity: 0.8 },
};
