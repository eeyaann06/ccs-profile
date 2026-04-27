// src/pages/Curriculum.jsx
// ─────────────────────────────────────────────────────────────
// Admin / Academic Head feature
//  Tab 1 — Curriculum : define subjects per program & semester
//  Tab 2 — Sections   : create & manage student sections
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
  SUBJECT_TYPES,
  SCHOOL_YEARS,
  STUDENTS_COL,
  SECTIONS_COL,
  CURRICULUM_COL,
  Modal,
  ConfirmModal,
  CloseIcon,
  SpinnerIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  BookIcon,
  UserGrpIcon,
  CheckIcon,
} from "../utils/schedShared";

import "../styles/SchedulingCurriculum.css";

// ════════════════════════════════════════════════════════════
// TAB 1 — CURRICULUM
// ════════════════════════════════════════════════════════════

const BLANK_SUBJECT = { code: "", name: "", units: "3", type: "Lecture" };

function SubjectModal({ initial, onSave, onClose, saving }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(initial ?? BLANK_SUBJECT);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal>
      <div className="sc-overlay" onClick={onClose}>
        <div
          className="sc-modal sc-modal--sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sc-modal-header">
            <h2>{isEdit ? "Edit Subject" : "Add Subject"}</h2>
            <button className="sc-modal-close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          <div className="sc-modal-body">
            <div className="sc-form-grid sc-form-grid--2">
              <div className="sc-form-group">
                <label>Subject Code *</label>
                <input
                  required
                  value={form.code}
                  placeholder="CC101"
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                />
              </div>
              <div className="sc-form-group">
                <label>Units *</label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={form.units}
                  onChange={(e) => set("units", e.target.value)}
                />
              </div>
              <div className="sc-form-group sc-span-2">
                <label>Subject Name *</label>
                <input
                  required
                  value={form.name}
                  placeholder="Introduction to Computing"
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <div className="sc-form-group">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                >
                  {SUBJECT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="sc-form-actions sc-modal-footer">
            <button className="sc-btn sc-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="sc-btn sc-btn--primary"
              disabled={saving || !form.code || !form.name}
              onClick={() => onSave(form)}
            >
              {saving ? (
                <>
                  <SpinnerIcon /> Saving…
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Add Subject"
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CurriculumTab() {
  const [course, setCourse] = useState("BSCS");
  const [year, setYear] = useState(1);
  const [sem, setSem] = useState(1);
  const [currDoc, setCurrDoc] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjectModal, setSubjectModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function fetchCurriculum() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, CURRICULUM_COL),
          where("course", "==", course),
          where("yearLevel", "==", year),
          where("semester", "==", sem)
        )
      );
      if (snap.empty) {
        setCurrDoc(null);
        setSubjects([]);
      } else {
        const d = snap.docs[0];
        setCurrDoc({ _docId: d.id, ...d.data() });
        setSubjects(d.data().subjects ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCurriculum();
  }, [course, year, sem]);

  async function saveSubjects(newSubjects) {
    setSaving(true);
    try {
      if (currDoc) {
        await updateDoc(doc(db, CURRICULUM_COL, currDoc._docId), {
          subjects: newSubjects,
        });
        setCurrDoc((c) => ({ ...c, subjects: newSubjects }));
      } else {
        const data = {
          course,
          yearLevel: year,
          semester: sem,
          subjects: newSubjects,
        };
        const ref = await addDoc(collection(db, CURRICULUM_COL), data);
        setCurrDoc({ _docId: ref.id, ...data });
      }
      setSubjects(newSubjects);
    } finally {
      setSaving(false);
    }
  }

  function handleAddSubject(form) {
    const newSub = {
      code: form.code,
      name: form.name,
      units: parseInt(form.units),
      type: form.type,
    };
    saveSubjects([...subjects, newSub]).then(() => setSubjectModal(null));
  }

  function handleEditSubject(form) {
    const updated = subjects.map((s) =>
      s.code === subjectModal.code
        ? {
            code: form.code,
            name: form.name,
            units: parseInt(form.units),
            type: form.type,
          }
        : s
    );
    saveSubjects(updated).then(() => setSubjectModal(null));
  }

  function handleDeleteSubject() {
    saveSubjects(subjects.filter((s) => s.code !== deleteTarget.code)).then(
      () => setDeleteTarget(null)
    );
  }

  const totalUnits = subjects.reduce((a, s) => a + (s.units || 0), 0);

  return (
    <div className="sc-tab-content">
      {/* Selectors */}
      <div className="sc-curriculum-selectors">
        <div className="sc-sel-group">
          <label>Program</label>
          <select value={course} onChange={(e) => setCourse(e.target.value)}>
            {COURSES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="sc-sel-group">
          <label>Year Level</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {YEAR_LEVELS.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
        <div className="sc-sel-group">
          <label>Semester</label>
          <select
            value={sem}
            onChange={(e) => setSem(parseInt(e.target.value))}
          >
            {SEMESTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sc-sel-spacer" />
        <button
          className="sc-btn sc-btn--primary sc-btn--sm"
          onClick={() => setSubjectModal("add")}
        >
          <PlusIcon /> Add Subject
        </button>
      </div>

      {/* Summary strip */}
      <div className="sc-curr-meta">
        <span className="sc-curr-path">
          {course} › Year {year} ›{" "}
          {SEMESTERS.find((s) => s.value === sem)?.label}
        </span>
        <span className="sc-curr-units">
          {totalUnits} total units · {subjects.length} subjects
        </span>
      </div>

      {/* Table */}
      <div className="sc-table-wrap">
        {loading ? (
          <div className="sc-loading">
            <SpinnerIcon /> Loading curriculum…
          </div>
        ) : subjects.length === 0 ? (
          <div className="sc-empty-state">
            <span>📚</span>
            <p>No subjects yet for this curriculum.</p>
            <button
              className="sc-btn sc-btn--primary"
              onClick={() => setSubjectModal("add")}
            >
              <PlusIcon /> Add First Subject
            </button>
          </div>
        ) : (
          <table className="sc-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Units</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, i) => (
                <tr key={s.code}>
                  <td className="sc-td-muted">{i + 1}</td>
                  <td>
                    <span className="sc-code-badge">{s.code}</span>
                  </td>
                  <td className="sc-td-name">{s.name}</td>
                  <td>{s.units}</td>
                  <td>
                    <span
                      className={`sc-type-badge sc-type-badge--${s.type.toLowerCase()}`}
                    >
                      {s.type}
                    </span>
                  </td>
                  <td>
                    <div className="sc-row-actions">
                      <button
                        className="sc-action-btn sc-action-btn--edit"
                        onClick={() => setSubjectModal(s)}
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        className="sc-action-btn sc-action-btn--delete"
                        onClick={() => setDeleteTarget(s)}
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="sc-tfoot-label">
                  Total
                </td>
                <td className="sc-tfoot-units">{totalUnits}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {subjectModal === "add" && (
        <SubjectModal
          onSave={handleAddSubject}
          onClose={() => setSubjectModal(null)}
          saving={saving}
        />
      )}
      {subjectModal && subjectModal !== "add" && (
        <SubjectModal
          initial={subjectModal}
          onSave={handleEditSubject}
          onClose={() => setSubjectModal(null)}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Subject?"
          message={`Remove "${deleteTarget.name}" (${deleteTarget.code}) from this curriculum?`}
          onConfirm={handleDeleteSubject}
          onClose={() => setDeleteTarget(null)}
          busy={saving}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 2 — SECTIONS
// ════════════════════════════════════════════════════════════

const BLANK_SECTION = {
  sectionName: "",
  course: "BSCS",
  yearLevel: 1,
  semester: 1,
  schoolYear: SCHOOL_YEARS[2] ?? "",
};

function SectionFormModal({ initial, onSave, onClose, saving }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(initial ?? BLANK_SECTION);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const suggestion = `${form.course}-${form.yearLevel}`;

  return (
    <Modal>
      <div className="sc-overlay" onClick={onClose}>
        <div
          className="sc-modal sc-modal--sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sc-modal-header">
            <h2>{isEdit ? "Edit Section" : "Create Section"}</h2>
            <button className="sc-modal-close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          <div className="sc-modal-body">
            <div className="sc-form-grid sc-form-grid--2">
              <div className="sc-form-group">
                <label>Program</label>
                <select
                  value={form.course}
                  onChange={(e) => set("course", e.target.value)}
                >
                  {COURSES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="sc-form-group">
                <label>Year Level</label>
                <select
                  value={form.yearLevel}
                  onChange={(e) => set("yearLevel", parseInt(e.target.value))}
                >
                  {YEAR_LEVELS.map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sc-form-group">
                <label>Semester</label>
                <select
                  value={form.semester}
                  onChange={(e) => set("semester", parseInt(e.target.value))}
                >
                  {SEMESTERS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sc-form-group">
                <label>School Year</label>
                <select
                  value={form.schoolYear}
                  onChange={(e) => set("schoolYear", e.target.value)}
                >
                  {SCHOOL_YEARS.map((sy) => (
                    <option key={sy}>{sy}</option>
                  ))}
                </select>
              </div>
              <div className="sc-form-group sc-span-2">
                <label>
                  Section Name *
                  <span className="sc-form-hint">
                    {" "}
                    (e.g. {suggestion}A, {suggestion}B)
                  </span>
                </label>
                <input
                  required
                  value={form.sectionName}
                  placeholder={`e.g. ${suggestion}A`}
                  disabled={isEdit}
                  onChange={(e) =>
                    set("sectionName", e.target.value.toUpperCase())
                  }
                />
              </div>
            </div>
          </div>
          <div className="sc-form-actions sc-modal-footer">
            <button className="sc-btn sc-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="sc-btn sc-btn--primary"
              disabled={saving || !form.sectionName}
              onClick={() => onSave(form)}
            >
              {saving ? (
                <>
                  <SpinnerIcon /> Saving…
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Section"
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AssignStudentsModal({ section, onClose }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const snap = await getDocs(
        query(
          collection(db, STUDENTS_COL),
          where("course", "==", section.course),
          where("year", "==", section.yearLevel)
        )
      );
      const list = snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
      setStudents(list);
      setSelected(
        new Set(
          list
            .filter((s) => s.section === section.sectionName)
            .map((s) => s._docId)
        )
      );
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all(
        students.map((s) => {
          const newSection = selected.has(s._docId)
            ? section.sectionName
            : s.section === section.sectionName
            ? ""
            : s.section;
          if (newSection !== s.section) {
            return updateDoc(doc(db, STUDENTS_COL, s._docId), {
              section: newSection ?? "",
            });
          }
        })
      );
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal>
      <div className="sc-overlay" onClick={onClose}>
        <div
          className="sc-modal sc-modal--md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sc-modal-header">
            <div>
              <h2>Assign Students</h2>
              <p className="sc-modal-sub">
                Section: <strong>{section.sectionName}</strong> ·{" "}
                {section.course} Year {section.yearLevel}
              </p>
            </div>
            <button className="sc-modal-close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          <div className="sc-modal-body">
            <input
              className="sc-search-input"
              placeholder="Search student…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading ? (
              <div className="sc-loading">
                <SpinnerIcon /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <p className="sc-empty">
                No matching students found in {section.course} Year{" "}
                {section.yearLevel}.
              </p>
            ) : (
              <div className="sc-student-checklist">
                <div className="sc-checklist-header">
                  <span>{selected.size} selected</span>
                  <button
                    className="sc-link"
                    onClick={() =>
                      setSelected(
                        selected.size === students.length
                          ? new Set()
                          : new Set(students.map((s) => s._docId))
                      )
                    }
                  >
                    {selected.size === students.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                {filtered.map((s) => (
                  <label
                    key={s._docId}
                    className={`sc-checklist-item ${
                      selected.has(s._docId) ? "sc-checklist-item--checked" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(s._docId)}
                      onChange={() => {
                        const n = new Set(selected);
                        n.has(s._docId) ? n.delete(s._docId) : n.add(s._docId);
                        setSelected(n);
                      }}
                    />
                    <div className="sc-checklist-avatar">
                      {s.name?.charAt(0)}
                    </div>
                    <div className="sc-checklist-info">
                      <span className="sc-checklist-name">{s.name}</span>
                      <span className="sc-checklist-id">{s.studentId}</span>
                    </div>
                    {s.section && s.section !== section.sectionName && (
                      <span className="sc-checklist-tag">In {s.section}</span>
                    )}
                    {selected.has(s._docId) && <CheckIcon />}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="sc-form-actions sc-modal-footer">
            <button className="sc-btn sc-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="sc-btn sc-btn--primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <SpinnerIcon /> Saving…
                </>
              ) : (
                "Save Assignment"
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function SectionsTab() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sectionModal, setSectionModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [filterCourse, setFilterCourse] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSY, setFilterSY] = useState("");
  const [studentCounts, setStudentCounts] = useState({});

  useEffect(() => {
    async function load() {
      const [secSnap, stuSnap] = await Promise.all([
        getDocs(collection(db, SECTIONS_COL)),
        getDocs(collection(db, STUDENTS_COL)),
      ]);
      setSections(secSnap.docs.map((d) => ({ _docId: d.id, ...d.data() })));
      const counts = {};
      stuSnap.docs.forEach((d) => {
        const sec = d.data().section;
        if (sec) counts[sec] = (counts[sec] ?? 0) + 1;
      });
      setStudentCounts(counts);
      setLoading(false);
    }
    load();
  }, []);

  async function handleAdd(form) {
    setSaving(true);
    try {
      const data = { ...form };
      delete data._docId;
      const ref = await addDoc(collection(db, SECTIONS_COL), data);
      setSections((prev) => [...prev, { _docId: ref.id, ...data }]);
      setSectionModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form) {
    if (!sectionModal?._docId) return;
    setSaving(true);
    try {
      const data = { ...form };
      delete data._docId;
      await updateDoc(doc(db, SECTIONS_COL, sectionModal._docId), data);
      setSections((prev) =>
        prev.map((s) =>
          s._docId === sectionModal._docId ? { _docId: s._docId, ...data } : s
        )
      );
      setSectionModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, SECTIONS_COL, deleteTarget._docId));
      setSections((prev) =>
        prev.filter((s) => s._docId !== deleteTarget._docId)
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = useMemo(
    () =>
      sections.filter((s) => {
        const mc = filterCourse ? s.course === filterCourse : true;
        const my = filterYear ? s.yearLevel === parseInt(filterYear) : true;
        const msy = filterSY ? s.schoolYear === filterSY : true;
        return mc && my && msy;
      }),
    [sections, filterCourse, filterYear, filterSY]
  );

  return (
    <div className="sc-tab-content">
      <div className="sc-toolbar">
        <select
          className="sc-select"
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
        >
          <option value="">All Programs</option>
          {COURSES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          className="sc-select"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          <option value="">All Years</option>
          {YEAR_LEVELS.map((y) => (
            <option key={y} value={y}>
              Year {y}
            </option>
          ))}
        </select>
        <select
          className="sc-select"
          value={filterSY}
          onChange={(e) => setFilterSY(e.target.value)}
        >
          <option value="">All School Years</option>
          {SCHOOL_YEARS.map((sy) => (
            <option key={sy}>{sy}</option>
          ))}
        </select>
        <div className="sc-toolbar-spacer" />
        <span className="sc-count">
          {filtered.length} section{filtered.length !== 1 ? "s" : ""}
        </span>
        <button
          className="sc-btn sc-btn--primary sc-btn--sm"
          onClick={() => setSectionModal("add")}
        >
          <PlusIcon /> Create Section
        </button>
      </div>

      {loading ? (
        <div className="sc-loading">
          <SpinnerIcon /> Loading sections…
        </div>
      ) : filtered.length === 0 ? (
        <div className="sc-empty-state">
          <span>🏫</span>
          <p>
            {sections.length === 0
              ? "No sections created yet."
              : "No sections match the filters."}
          </p>
          {sections.length === 0 && (
            <button
              className="sc-btn sc-btn--primary"
              onClick={() => setSectionModal("add")}
            >
              <PlusIcon /> Create First Section
            </button>
          )}
        </div>
      ) : (
        <div className="sc-section-grid">
          {filtered.map((sec) => (
            <div key={sec._docId} className="sc-section-card">
              <div className="sc-section-header">
                <div className="sc-section-avatar">{sec.sectionName}</div>
                <div className="sc-section-info">
                  <span className="sc-section-name">{sec.sectionName}</span>
                  <span className="sc-section-meta">
                    {sec.course} · Year {sec.yearLevel}
                  </span>
                </div>
              </div>
              <div className="sc-section-body">
                <div className="sc-section-stat">
                  <span className="sc-section-stat-label">Semester</span>
                  <span className="sc-section-stat-value">
                    {SEMESTERS.find((s) => s.value === sec.semester)?.label ??
                      sec.semester}
                  </span>
                </div>
                <div className="sc-section-stat">
                  <span className="sc-section-stat-label">School Year</span>
                  <span className="sc-section-stat-value">
                    {sec.schoolYear}
                  </span>
                </div>
                <div className="sc-section-stat">
                  <span className="sc-section-stat-label">Students</span>
                  <span className="sc-section-stat-value sc-section-count">
                    {studentCounts[sec.sectionName] ?? 0}
                  </span>
                </div>
              </div>
              <div className="sc-section-actions">
                <button
                  className="sc-btn sc-btn--ghost sc-btn--xs"
                  onClick={() => setAssignTarget(sec)}
                >
                  <UserGrpIcon /> Assign Students
                </button>
                <button
                  className="sc-action-btn sc-action-btn--edit"
                  onClick={() => setSectionModal(sec)}
                  title="Edit"
                >
                  <EditIcon />
                </button>
                <button
                  className="sc-action-btn sc-action-btn--delete"
                  onClick={() => setDeleteTarget(sec)}
                  title="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sectionModal === "add" && (
        <SectionFormModal
          onSave={handleAdd}
          onClose={() => setSectionModal(null)}
          saving={saving}
        />
      )}
      {sectionModal && sectionModal !== "add" && (
        <SectionFormModal
          initial={sectionModal}
          onSave={handleEdit}
          onClose={() => setSectionModal(null)}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Section?"
          message={`Delete section "${deleteTarget.sectionName}"? Students will not be deleted.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          busy={deleting}
        />
      )}
      {assignTarget && (
        <AssignStudentsModal
          section={assignTarget}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN EXPORT — Curriculum page (Admin / Academic Head)
// ════════════════════════════════════════════════════════════

const TABS = [
  {
    key: "curriculum",
    label: "Curriculum",
    icon: <BookIcon />,
    desc: "Define subjects per program & semester",
  },
  {
    key: "sections",
    label: "Sections",
    icon: <UserGrpIcon />,
    desc: "Create & manage student sections",
  },
];

export default function Curriculum() {
  const [activeTab, setActiveTab] = useState("curriculum");

  return (
    <div className="sc-page">
      <div className="sc-page-header">
        <div>
          <h1 className="sc-page-title">Curriculum Management</h1>
          <p className="sc-page-sub">
            Define the academic structure — manage subjects per program and
            organize student sections.
          </p>
        </div>
      </div>

      <div className="sc-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`sc-tab ${activeTab === t.key ? "sc-tab--active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "curriculum" && <CurriculumTab />}
      {activeTab === "sections" && <SectionsTab />}
    </div>
  );
}
