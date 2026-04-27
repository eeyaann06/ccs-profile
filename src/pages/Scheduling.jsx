// src/pages/Scheduling.jsx
// ─────────────────────────────────────────────────────────────
// Admin / Registrar feature
//  Assign faculty, room, and time slots to subjects per section.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

import {
  COURSES,
  YEAR_LEVELS,
  SEMESTERS,
  DAYS,
  COLOR_PALETTE,
  SECTIONS_COL,
  SCHEDULES_COL,
  CURRICULUM_COL,
  USERS_COL,
  Modal,
  ConfirmModal,
  CloseIcon,
  SpinnerIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  GridIcon,
  CalIcon,
} from "../utils/schedShared";

import "../styles/SchedulingCurriculum.css";

// ── Schedule Entry Modal ────────────────────────────────────

const BLANK_SCHED = {
  subjectCode: "",
  subjectName: "",
  units: 3,
  type: "Lecture",
  facultyId: "",
  facultyName: "",
  room: "",
  days: [],
  timeStart: "07:00",
  timeEnd: "08:30",
};

function ScheduleEntryModal({
  initial,
  subjects,
  faculty,
  onSave,
  onClose,
  saving,
}) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(initial ?? BLANK_SCHED);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function toggleDay(d) {
    const days = form.days.includes(d)
      ? form.days.filter((x) => x !== d)
      : [...form.days, d];
    set("days", days);
  }

  function handleSubjectChange(code) {
    const sub = subjects.find((s) => s.code === code);
    if (sub) {
      set("subjectCode", sub.code);
      set("subjectName", sub.name);
      set("units", sub.units);
      set("type", sub.type);
    }
  }

  function handleFacultyChange(id) {
    const fac = faculty.find((f) => f.user_id === id || f._docId === id);
    if (fac) {
      set("facultyId", fac.user_id ?? fac._docId);
      set("facultyName", fac.name);
    }
  }

  const valid =
    form.subjectCode &&
    form.facultyId &&
    form.room &&
    form.days.length > 0 &&
    form.timeStart &&
    form.timeEnd;

  return (
    <Modal>
      <div className="sc-overlay" onClick={onClose}>
        <div
          className="sc-modal sc-modal--md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sc-modal-header">
            <h2>{isEdit ? "Edit Schedule" : "Add Schedule Entry"}</h2>
            <button className="sc-modal-close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          <div className="sc-modal-body">
            <div className="sc-form-grid sc-form-grid--2">
              {/* Subject */}
              <div className="sc-form-group sc-span-2">
                <label>Subject *</label>
                <select
                  value={form.subjectCode}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                >
                  <option value="">— Select Subject —</option>
                  {subjects.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} — {s.name} ({s.units} units)
                    </option>
                  ))}
                </select>
                {subjects.length === 0 && (
                  <span className="sc-form-hint">
                    No subjects found. Add subjects in Curriculum first.
                  </span>
                )}
              </div>

              {/* Faculty */}
              <div className="sc-form-group sc-span-2">
                <label>Faculty *</label>
                <select
                  value={form.facultyId}
                  onChange={(e) => handleFacultyChange(e.target.value)}
                >
                  <option value="">— Select Faculty —</option>
                  {faculty.map((f) => (
                    <option key={f._docId} value={f.user_id ?? f._docId}>
                      {f.name}
                    </option>
                  ))}
                </select>
                {faculty.length === 0 && (
                  <span className="sc-form-hint">
                    No faculty found. Add faculty accounts first.
                  </span>
                )}
              </div>

              {/* Room */}
              <div className="sc-form-group">
                <label>Room / Lab *</label>
                <input
                  value={form.room}
                  placeholder="e.g. Lab 1, Room 201"
                  onChange={(e) => set("room", e.target.value)}
                />
              </div>

              {/* Type (auto-filled from subject) */}
              <div className="sc-form-group">
                <label>Type</label>
                <input readOnly value={form.type} className="sc-readonly" />
              </div>

              {/* Time */}
              <div className="sc-form-group">
                <label>Time Start *</label>
                <input
                  type="time"
                  value={form.timeStart}
                  onChange={(e) => set("timeStart", e.target.value)}
                />
              </div>
              <div className="sc-form-group">
                <label>Time End *</label>
                <input
                  type="time"
                  value={form.timeEnd}
                  onChange={(e) => set("timeEnd", e.target.value)}
                />
              </div>

              {/* Days */}
              <div className="sc-form-group sc-span-2">
                <label>Days *</label>
                <div className="sc-days-picker">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`sc-day-btn ${
                        form.days.includes(d) ? "sc-day-btn--active" : ""
                      }`}
                      onClick={() => toggleDay(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="sc-form-actions sc-modal-footer">
            <button className="sc-btn sc-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="sc-btn sc-btn--primary"
              disabled={saving || !valid}
              onClick={() => onSave(form)}
            >
              {saving ? (
                <>
                  <SpinnerIcon /> Saving…
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Add to Schedule"
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Weekly Timetable Grid ────────────────────────────────────

function Timetable({ schedules }) {
  const HOUR_START = 7;
  const HOUR_END = 21;
  const TOTAL_MINS = (HOUR_END - HOUR_START) * 60;

  const toMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const colorMap = useMemo(() => {
    const map = {};
    [...new Set(schedules.map((s) => s.subjectCode))].forEach((code, i) => {
      map[code] = COLOR_PALETTE[i % COLOR_PALETTE.length];
    });
    return map;
  }, [schedules]);

  const hours = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) hours.push(h);

  return (
    <div className="sc-timetable">
      {/* Time axis */}
      <div className="sc-tt-time-col">
        <div className="sc-tt-day-header" />
        {hours.map((h) => (
          <div key={h} className="sc-tt-hour-label">
            {h === 12 ? "12PM" : h < 12 ? `${h}AM` : `${h - 12}PM`}
          </div>
        ))}
      </div>

      {/* Day columns */}
      {DAYS.map((day) => {
        const dayScheds = schedules.filter((s) => s.days?.includes(day));
        return (
          <div key={day} className="sc-tt-day-col">
            <div className="sc-tt-day-header">{day}</div>
            <div className="sc-tt-day-body">
              {hours.map((h) => (
                <div
                  key={h}
                  className="sc-tt-hour-line"
                  style={{
                    top: `${
                      ((h - HOUR_START) / (HOUR_END - HOUR_START)) * 100
                    }%`,
                  }}
                />
              ))}
              {dayScheds.map((sched, i) => {
                const startMins = toMins(sched.timeStart) - HOUR_START * 60;
                const endMins = toMins(sched.timeEnd) - HOUR_START * 60;
                const top = (startMins / TOTAL_MINS) * 100;
                const height = ((endMins - startMins) / TOTAL_MINS) * 100;
                const color = colorMap[sched.subjectCode] ?? "#4f8ef7";
                return (
                  <div
                    key={i}
                    className="sc-tt-block"
                    style={{
                      top: `${top}%`,
                      height: `${height}%`,
                      background: color,
                    }}
                  >
                    <span className="sc-tt-block-code">
                      {sched.subjectCode}
                    </span>
                    <span className="sc-tt-block-room">{sched.room}</span>
                    <span className="sc-tt-block-time">
                      {sched.timeStart}–{sched.timeEnd}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Scheduling Tab ───────────────────────────────────────────

function SchedulingTab() {
  const [sections, setSections] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [currSubjects, setCurrSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selSection, setSelSection] = useState(null);
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [schedModal, setSchedModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Load sections & faculty once
  useEffect(() => {
    async function load() {
      const [secSnap, facSnap] = await Promise.all([
        getDocs(collection(db, SECTIONS_COL)),
        getDocs(
          query(collection(db, USERS_COL), where("role", "==", "Faculty"))
        ),
      ]);
      setSections(secSnap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
      setFaculty(facSnap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
    }
    load();
  }, []);

  // Load schedules & curriculum when section changes
  useEffect(() => {
    if (!selSection) return;
    async function load() {
      setLoading(true);
      const [schedSnap, currSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, SCHEDULES_COL),
            where("sectionId", "==", selSection._docId)
          )
        ),
        getDocs(
          query(
            collection(db, CURRICULUM_COL),
            where("course", "==", selSection.course),
            where("yearLevel", "==", selSection.yearLevel),
            where("semester", "==", selSection.semester)
          )
        ),
      ]);
      setSchedules(schedSnap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
      setCurrSubjects(
        currSnap.empty ? [] : currSnap.docs[0].data().subjects ?? []
      );
      setLoading(false);
    }
    load();
  }, [selSection]);

  async function handleAdd(form) {
    setSaving(true);
    try {
      const data = {
        ...form,
        sectionId: selSection._docId,
        sectionName: selSection.sectionName,
        schoolYear: selSection.schoolYear,
        semester: selSection.semester,
      };
      const ref = await addDoc(collection(db, SCHEDULES_COL), data);
      setSchedules((prev) => [...prev, { _docId: ref.id, ...data }]);
      setSchedModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form) {
    if (!schedModal?._docId) return;
    setSaving(true);
    try {
      const data = { ...form };
      delete data._docId;
      await updateDoc(doc(db, SCHEDULES_COL, schedModal._docId), data);
      setSchedules((prev) =>
        prev.map((s) =>
          s._docId === schedModal._docId ? { _docId: s._docId, ...data } : s
        )
      );
      setSchedModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, SCHEDULES_COL, deleteTarget._docId));
      setSchedules((prev) =>
        prev.filter((s) => s._docId !== deleteTarget._docId)
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  // Group schedules by day for list view
  const byDay = useMemo(() => {
    const map = {};
    DAYS.forEach((d) => {
      map[d] = [];
    });
    schedules.forEach((s) =>
      (s.days ?? []).forEach((d) => {
        if (map[d]) map[d].push(s);
      })
    );
    return map;
  }, [schedules]);

  return (
    <div className="sc-tab-content">
      {/* Section selector + controls */}
      <div className="sc-sched-header">
        <div className="sc-sel-group sc-sel-group--lg">
          <label>Select Section</label>
          <select
            value={selSection?._docId ?? ""}
            onChange={(e) => {
              const s = sections.find((sec) => sec._docId === e.target.value);
              setSelSection(s ?? null);
            }}
          >
            <option value="">— Choose a Section —</option>
            {sections.map((s) => (
              <option key={s._docId} value={s._docId}>
                {s.sectionName} · {s.course} Yr{s.yearLevel} ·{" "}
                {SEMESTERS.find((x) => x.value === s.semester)?.label}{" "}
                {s.schoolYear}
              </option>
            ))}
          </select>
        </div>

        {selSection && (
          <>
            <div className="sc-view-toggle">
              <button
                className={`sc-view-btn ${
                  view === "list" ? "sc-view-btn--active" : ""
                }`}
                onClick={() => setView("list")}
                title="List View"
              >
                <CalIcon />
              </button>
              <button
                className={`sc-view-btn ${
                  view === "grid" ? "sc-view-btn--active" : ""
                }`}
                onClick={() => setView("grid")}
                title="Timetable View"
              >
                <GridIcon />
              </button>
            </div>
            <button
              className="sc-btn sc-btn--primary sc-btn--sm"
              onClick={() => setSchedModal("add")}
            >
              <PlusIcon /> Add Entry
            </button>
          </>
        )}
      </div>

      {!selSection ? (
        <div className="sc-empty-state">
          <span>📅</span>
          <p>Select a section to view or build its schedule.</p>
          {sections.length === 0 && (
            <p className="sc-empty-sub">
              No sections found. Create sections first in Curriculum → Sections.
            </p>
          )}
        </div>
      ) : loading ? (
        <div className="sc-loading">
          <SpinnerIcon /> Loading schedule…
        </div>
      ) : (
        <>
          {/* Meta bar */}
          <div className="sc-sched-meta">
            <span className="sc-sched-section-badge">
              {selSection.sectionName}
            </span>
            <span>
              {selSection.course} · Year {selSection.yearLevel}
            </span>
            <span>·</span>
            <span>
              {SEMESTERS.find((s) => s.value === selSection.semester)?.label}
            </span>
            <span>·</span>
            <span>S.Y. {selSection.schoolYear}</span>
            <span className="sc-sched-count">
              {schedules.length} subject{schedules.length !== 1 ? "s" : ""}{" "}
              scheduled
            </span>
          </div>

          {currSubjects.length === 0 && (
            <div className="sc-alert sc-alert--warn">
              ⚠️ No curriculum found for {selSection.course} Year{" "}
              {selSection.yearLevel}. Add subjects in{" "}
              <strong>Curriculum → Curriculum tab</strong> first.
            </div>
          )}

          {schedules.length === 0 ? (
            <div className="sc-empty-state">
              <span>📋</span>
              <p>No schedule entries yet for {selSection.sectionName}.</p>
              <button
                className="sc-btn sc-btn--primary"
                onClick={() => setSchedModal("add")}
              >
                <PlusIcon /> Add First Entry
              </button>
            </div>
          ) : view === "grid" ? (
            <Timetable schedules={schedules} />
          ) : (
            /* List View — grouped by day */
            <div className="sc-sched-list">
              {DAYS.map(
                (day) =>
                  byDay[day].length > 0 && (
                    <div key={day} className="sc-sched-day-group">
                      <div className="sc-sched-day-label">{day}</div>
                      {byDay[day]
                        .sort((a, b) => a.timeStart.localeCompare(b.timeStart))
                        .map((sched, i) => (
                          <div
                            key={sched._docId + day + i}
                            className="sc-sched-entry"
                          >
                            <div className="sc-sched-entry-time">
                              <span>{sched.timeStart}</span>
                              <span className="sc-sched-entry-sep">–</span>
                              <span>{sched.timeEnd}</span>
                            </div>
                            <div
                              className="sc-sched-entry-color"
                              style={{
                                background:
                                  COLOR_PALETTE[
                                    schedules.indexOf(sched) %
                                      COLOR_PALETTE.length
                                  ],
                              }}
                            />
                            <div className="sc-sched-entry-info">
                              <span className="sc-sched-entry-code">
                                {sched.subjectCode}
                              </span>
                              <span className="sc-sched-entry-name">
                                {sched.subjectName}
                              </span>
                            </div>
                            <div className="sc-sched-entry-right">
                              <span className="sc-sched-faculty">
                                {sched.facultyName}
                              </span>
                              <span className="sc-sched-room">
                                {sched.room}
                              </span>
                            </div>
                            <span
                              className={`sc-type-badge sc-type-badge--${sched.type?.toLowerCase()}`}
                            >
                              {sched.type}
                            </span>
                            <div className="sc-row-actions">
                              <button
                                className="sc-action-btn sc-action-btn--edit"
                                onClick={() => setSchedModal(sched)}
                                title="Edit"
                              >
                                <EditIcon />
                              </button>
                              <button
                                className="sc-action-btn sc-action-btn--delete"
                                onClick={() => setDeleteTarget(sched)}
                                title="Delete"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )
              )}
            </div>
          )}
        </>
      )}

      {schedModal === "add" && (
        <ScheduleEntryModal
          subjects={currSubjects}
          faculty={faculty}
          onSave={handleAdd}
          onClose={() => setSchedModal(null)}
          saving={saving}
        />
      )}
      {schedModal && schedModal !== "add" && (
        <ScheduleEntryModal
          initial={schedModal}
          subjects={currSubjects}
          faculty={faculty}
          onSave={handleEdit}
          onClose={() => setSchedModal(null)}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Remove Schedule Entry?"
          message={`Remove ${deleteTarget.subjectCode} — ${deleteTarget.subjectName} from this schedule?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          busy={deleting}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN EXPORT — Scheduling page (Admin / Registrar)
// ════════════════════════════════════════════════════════════

export default function Scheduling() {
  return (
    <div className="sc-page">
      <div className="sc-page-header">
        <div>
          <h1 className="sc-page-title">Class Scheduling</h1>
          <p className="sc-page-sub">
            Assign faculty, rooms, and time slots to each subject per section.
          </p>
        </div>
      </div>

      {/* Single tab — no tab nav needed, the page itself is one feature */}
      <SchedulingTab />
    </div>
  );
}
