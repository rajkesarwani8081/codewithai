import React, { useState, useMemo, useCallback } from "react";
import {
  LayoutDashboard, School, Users, UserCheck, AlertTriangle, ClipboardCheck,
  Utensils, MessageSquareWarning, Bell, LogOut, ChevronRight, Search,
  MapPin, Camera, CheckCircle2, Clock, XCircle, TrendingUp, TrendingDown,
  Building2, GraduationCap, ShieldAlert, Plus, X, ArrowLeft, Filter,
  BarChart3, PieChart as PieIcon, Info
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";

/* ---------------------------------------------------------------
   ESCHOOL — AI Government School Monitoring System (Prototype)
   Single-file React app. All data is in-memory mock data wired
   through real component state so every flow is fully clickable:
   login -> role dashboard -> drill into schools -> inspections ->
   complaints -> mid-day meal -> reports.
----------------------------------------------------------------*/

// ---------- Design tokens ----------
const COLORS = {
  ink: "#1E2A4A",       // deep indigo - authority/header
  inkSoft: "#3A4A73",
  paper: "#F7F5F0",     // warm off white
  paperDim: "#EDEAE1",
  line: "#DEDAD0",
  good: "#2D8659",
  goodBg: "#E6F2EB",
  warn: "#C98A00",
  warnBg: "#FBF0DA",
  bad: "#C4453A",
  badBg: "#FBE9E7",
  slate: "#6B7280",
  white: "#FFFFFF",
};

const RISK_META = {
  green:  { label: "Good",           color: COLORS.good, bg: COLORS.goodBg },
  yellow: { label: "Needs Attention",color: COLORS.warn, bg: COLORS.warnBg },
  red:    { label: "Critical",       color: COLORS.bad,  bg: COLORS.badBg },
};

// ---------- Mock data ----------
const SCHOOLS = [
  { id: "S001", name: "Govt. Sr. Sec. School, Rajpura", district: "Patiala", block: "Rajpura", students: 612, teachers: 24, attendanceToday: 91, teacherAttendance: 96, risk: "green", exam: 78, mdm: 96, infra: 88, complaints: 1 },
  { id: "S002", name: "Govt. Primary School, Sunderpur", district: "Gorakhpur", block: "Sahjanwa", students: 340, teachers: 9, attendanceToday: 62, teacherAttendance: 71, risk: "red", exam: 41, mdm: 58, infra: 45, complaints: 5 },
  { id: "S003", name: "Govt. Girls High School, Barhalganj", district: "Gorakhpur", block: "Barhalganj", students: 480, teachers: 16, attendanceToday: 84, teacherAttendance: 88, risk: "yellow", exam: 63, mdm: 82, infra: 70, complaints: 2 },
  { id: "S004", name: "Govt. Model School, Chandigarh Rd", district: "Patiala", block: "Patiala Urban", students: 890, teachers: 32, attendanceToday: 95, teacherAttendance: 98, risk: "green", exam: 85, mdm: 94, infra: 92, complaints: 0 },
  { id: "S005", name: "Govt. Middle School, Kauriram", district: "Gorakhpur", block: "Kauriram", students: 210, teachers: 7, attendanceToday: 58, teacherAttendance: 64, risk: "red", exam: 38, mdm: 51, infra: 40, complaints: 6 },
  { id: "S006", name: "Govt. High School, Ghanaur", district: "Patiala", block: "Ghanaur", students: 375, teachers: 14, attendanceToday: 79, teacherAttendance: 85, risk: "yellow", exam: 59, mdm: 76, infra: 65, complaints: 3 },
];

const ATTENDANCE_TREND = [
  { day: "Mon", student: 88, teacher: 94 },
  { day: "Tue", student: 85, teacher: 92 },
  { day: "Wed", student: 90, teacher: 95 },
  { day: "Thu", student: 82, teacher: 89 },
  { day: "Fri", student: 79, teacher: 87 },
  { day: "Sat", student: 76, teacher: 84 },
];

const RISK_DIST = [
  { name: "Good", value: SCHOOLS.filter(s => s.risk === "green").length, color: COLORS.good },
  { name: "Needs Attention", value: SCHOOLS.filter(s => s.risk === "yellow").length, color: COLORS.warn },
  { name: "Critical", value: SCHOOLS.filter(s => s.risk === "red").length, color: COLORS.bad },
];

const INITIAL_COMPLAINTS = [
  { id: "C101", school: "S002", type: "Teacher Absence", desc: "Class 6 teacher absent for 8 days this month.", status: "In Progress", date: "2026-07-01" },
  { id: "C102", school: "S005", type: "Mid-Day Meal", desc: "Meal quality poor, students refusing food.", status: "Pending", date: "2026-07-03" },
  { id: "C103", school: "S003", type: "Infrastructure", desc: "Girls' toilet block non-functional.", status: "Pending", date: "2026-07-04" },
  { id: "C104", school: "S001", type: "Cleanliness", desc: "Classroom 4B not cleaned regularly.", status: "Resolved", date: "2026-06-20" },
];

const INITIAL_INSPECTIONS = [
  { id: "I201", school: "S002", officer: "DEO R. Sharma", date: "2026-06-28", type: "Surprise", summary: "2 teachers absent without leave. Classroom 3 overcrowded (58 students). AI flagged repeated late arrivals.", status: "Filed" },
  { id: "I202", school: "S004", officer: "BEO A. Verma", date: "2026-06-25", type: "Scheduled", summary: "Infrastructure in good condition. Smart classroom functional. No issues found.", status: "Filed" },
];

const ROLES = [
  { id: "super_admin", label: "Super Admin", sub: "State Education Department" },
  { id: "deo", label: "District Education Officer", sub: "District-level oversight" },
  { id: "beo", label: "Block Education Officer", sub: "Block-level oversight" },
  { id: "principal", label: "Principal / Headmaster", sub: "School management" },
  { id: "teacher", label: "Teacher", sub: "Classroom & attendance" },
  { id: "parent", label: "Parent", sub: "Track your child" },
  { id: "smc", label: "School Management Committee", sub: "Community oversight" },
];

// ---------- Small UI atoms ----------
function RiskBadge({ risk, size = "md" }) {
  const m = RISK_META[risk];
  const dim = size === "sm" ? 8 : size === "lg" ? 14 : 10;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: m.bg, color: m.color, fontWeight: 600,
      fontSize: size === "lg" ? 13 : 12, padding: "4px 10px", borderRadius: 999,
      whiteSpace: "nowrap"
    }}>
      <span style={{ width: dim, height: dim, borderRadius: "50%", background: m.color, display: "inline-block" }} />
      {m.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, trend, accent }) {
  return (
    <div style={{
      background: COLORS.white, border: `1px solid ${COLORS.line}`, borderRadius: 14,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, background: accent + "1A",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Icon size={19} color={accent} />
        </div>
        {trend != null && (
          <span style={{
            fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 3,
            color: trend >= 0 ? COLORS.good : COLORS.bad
          }}>
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.ink, fontFamily: "'Manrope', sans-serif", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 13, color: COLORS.slate, marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: COLORS.slate, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Pill({ active, onClick, children, icon: Icon }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8, width: "100%",
      padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer",
      background: active ? "rgba(255,255,255,0.14)" : "transparent",
      color: active ? "#fff" : "rgba(255,255,255,0.72)",
      fontSize: 13.5, fontWeight: active ? 600 : 500, textAlign: "left",
      transition: "background 0.15s"
    }}>
      <Icon size={17} />
      {children}
    </button>
  );
}

function StatusChip({ status }) {
  const map = {
    Pending: { bg: COLORS.badBg, c: COLORS.bad, icon: XCircle },
    "In Progress": { bg: COLORS.warnBg, c: COLORS.warn, icon: Clock },
    Resolved: { bg: COLORS.goodBg, c: COLORS.good, icon: CheckCircle2 },
    Filed: { bg: COLORS.goodBg, c: COLORS.good, icon: CheckCircle2 },
  };
  const m = map[status] || map.Pending;
  const Icon = m.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: m.bg, color: m.c, fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 999 }}>
      <Icon size={12} /> {status}
    </span>
  );
}

// ---------- Login screen ----------
function LoginScreen({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [step, setStep] = useState("role"); // role -> creds
  const [username, setUsername] = useState("");

  return (
    <div style={{
      minHeight: "100vh", background: `linear-gradient(160deg, ${COLORS.ink} 0%, #12192E 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            border: "1px solid rgba(255,255,255,0.15)"
          }}>
            <School size={28} color="#fff" />
          </div>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 26, color: "#fff", letterSpacing: -0.5 }}>
            Eschool
          </div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13.5, marginTop: 4 }}>
            AI-Based Government School Monitoring System
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 22 }}>
          {step === "role" ? (
            <>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 14.5, marginBottom: 14 }}>Sign in as</div>
              <div style={{ display: "grid", gap: 8 }}>
                {ROLES.map(r => (
                  <button key={r.id} onClick={() => { setSelectedRole(r); setStep("creds"); }} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", textAlign: "left"
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</div>
                      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>{r.sub}</div>
                    </div>
                    <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setStep("role")} style={{
                display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                color: "rgba(255,255,255,0.6)", fontSize: 12.5, marginBottom: 16, cursor: "pointer", padding: 0
              }}>
                <ArrowLeft size={14} /> Change role
              </button>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 14.5, marginBottom: 2 }}>{selectedRole.label}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 18 }}>Enter your credentials to continue</div>

              <label style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Email or Employee ID</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. deo.gorakhpur@edu.gov.in" style={{
                width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13.5, marginBottom: 14, outline: "none", boxSizing: "border-box"
              }} />
              <label style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Password</label>
              <input type="password" placeholder="••••••••" style={{
                width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13.5, marginBottom: 8, outline: "none", boxSizing: "border-box"
              }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)" }}>2FA OTP will be sent to registered mobile</span>
              </div>
              <button onClick={() => onLogin(selectedRole)} style={{
                width: "100%", padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: "#fff", color: COLORS.ink, fontWeight: 700, fontSize: 14
              }}>
                Sign in
              </button>
              <div style={{ textAlign: "center", marginTop: 12, fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>
                Demo prototype — any credentials will work
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Schools list + detail ----------
function SchoolsView({ schools, onOpen }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = schools.filter(s =>
    (filter === "all" || s.risk === filter) &&
    s.name.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={15} color={COLORS.slate} style={{ position: "absolute", left: 12, top: 11 }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search schools..." style={{
            width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10, border: `1px solid ${COLORS.line}`,
            fontSize: 13.5, outline: "none", boxSizing: "border-box"
          }} />
        </div>
        {["all", "green", "yellow", "red"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "8px 14px", borderRadius: 10, border: `1px solid ${filter === f ? COLORS.ink : COLORS.line}`,
            background: filter === f ? COLORS.ink : "#fff", color: filter === f ? "#fff" : COLORS.ink,
            fontSize: 12.5, fontWeight: 600, cursor: "pointer"
          }}>
            {f === "all" ? "All" : RISK_META[f].label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map(s => (
          <div key={s.id} onClick={() => onOpen(s)} style={{
            background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "16px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 16, flexWrap: "wrap"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: "1 1 260px" }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, background: COLORS.paperDim,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <Building2 size={20} color={COLORS.ink} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: COLORS.slate }}>{s.block}, {s.district} · {s.students} students · {s.teachers} teachers</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, color: COLORS.slate }}>Attendance</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: s.attendanceToday < 70 ? COLORS.bad : COLORS.ink }}>{s.attendanceToday}%</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, color: COLORS.slate }}>Complaints</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>{s.complaints}</div>
              </div>
              <RiskBadge risk={s.risk} />
              <ChevronRight size={18} color={COLORS.slate} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: COLORS.slate, fontSize: 13.5 }}>No schools match this search.</div>
        )}
      </div>
    </div>
  );
}

function SchoolDetail({ school, onBack, complaints, inspections }) {
  const schoolComplaints = complaints.filter(c => c.school === school.id);
  const schoolInspections = inspections.filter(i => i.school === school.id);
  const metrics = [
    { label: "Student Attendance", value: school.attendanceToday, icon: Users },
    { label: "Teacher Attendance", value: school.teacherAttendance, icon: UserCheck },
    { label: "Exam Performance", value: school.exam, icon: GraduationCap },
    { label: "Mid-Day Meal", value: school.mdm, icon: Utensils },
    { label: "Infrastructure", value: school.infra, icon: Building2 },
  ];

  const aiNote = school.risk === "red"
    ? "AI risk model flags this school as Critical: attendance and academic performance are both trending below district thresholds, with a high complaint volume. Recommended action: schedule a surprise inspection within 7 days."
    : school.risk === "yellow"
    ? "AI risk model flags this school as Needs Attention: one or more indicators (attendance, infrastructure, or complaints) are below target. Recommended action: monitor over the next reporting cycle."
    : "AI risk model classifies this school as Good: all core indicators are within healthy thresholds. No immediate action required.";

  return (
    <div>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
        color: COLORS.ink, fontSize: 13, fontWeight: 600, marginBottom: 16, cursor: "pointer", padding: 0
      }}>
        <ArrowLeft size={16} /> Back to schools
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 21, color: COLORS.ink }}>{school.name}</div>
          <div style={{ color: COLORS.slate, fontSize: 13, marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
            <MapPin size={13} /> {school.block}, {school.district} · ID: {school.id}
          </div>
        </div>
        <RiskBadge risk={school.risk} size="lg" />
      </div>

      <div style={{
        background: COLORS.paperDim, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "14px 16px",
        display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-start"
      }}>
        <ShieldAlert size={18} color={COLORS.ink} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5 }}>{aiNote}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 24 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.slate, fontSize: 12, marginBottom: 8 }}>
              <m.icon size={13} /> {m.label}
            </div>
            <div style={{ fontWeight: 700, fontSize: 20, color: m.value < 60 ? COLORS.bad : m.value < 80 ? COLORS.warn : COLORS.good }}>{m.value}%</div>
            <div style={{ height: 5, background: COLORS.paperDim, borderRadius: 3, marginTop: 8 }}>
              <div style={{ height: 5, width: `${m.value}%`, background: m.value < 60 ? COLORS.bad : m.value < 80 ? COLORS.warn : COLORS.good, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: COLORS.ink, marginBottom: 10 }}>Complaints ({schoolComplaints.length})</div>
          <div style={{ display: "grid", gap: 8 }}>
            {schoolComplaints.length === 0 && <div style={{ color: COLORS.slate, fontSize: 13 }}>No complaints filed.</div>}
            {schoolComplaints.map(c => (
              <div key={c.id} style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.type}</span>
                  <StatusChip status={c.status} />
                </div>
                <div style={{ fontSize: 12.5, color: COLORS.slate }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: COLORS.ink, marginBottom: 10 }}>Recent Inspections ({schoolInspections.length})</div>
          <div style={{ display: "grid", gap: 8 }}>
            {schoolInspections.length === 0 && <div style={{ color: COLORS.slate, fontSize: 13 }}>No inspections recorded.</div>}
            {schoolInspections.map(i => (
              <div key={i.id} style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{i.type} · {i.officer}</span>
                  <span style={{ fontSize: 11.5, color: COLORS.slate }}>{i.date}</span>
                </div>
                <div style={{ fontSize: 12.5, color: COLORS.slate }}>{i.summary}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Dashboard ----------
function DashboardView({ schools, complaints }) {
  const totalStudents = schools.reduce((a, s) => a + s.students, 0);
  const totalTeachers = schools.reduce((a, s) => a + s.teachers, 0);
  const avgAttendance = Math.round(schools.reduce((a, s) => a + s.attendanceToday, 0) / schools.length);
  const avgTeacherAtt = Math.round(schools.reduce((a, s) => a + s.teacherAttendance, 0) / schools.length);
  const criticalCount = schools.filter(s => s.risk === "red").length;
  const pendingComplaints = complaints.filter(c => c.status !== "Resolved").length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard icon={School} label="Total Schools" value={schools.length} sub={`Across ${new Set(schools.map(s=>s.district)).size} districts`} accent={COLORS.ink} />
        <StatCard icon={Users} label="Total Students" value={totalStudents.toLocaleString()} accent={COLORS.slate} />
        <StatCard icon={UserCheck} label="Total Teachers" value={totalTeachers} accent={COLORS.slate} />
        <StatCard icon={TrendingUp} label="Today's Attendance" value={`${avgAttendance}%`} trend={-3} accent={COLORS.good} />
        <StatCard icon={UserCheck} label="Teacher Attendance" value={`${avgTeacherAtt}%`} trend={2} accent={COLORS.good} />
        <StatCard icon={ShieldAlert} label="Schools Needing Inspection" value={criticalCount} sub="AI risk: Critical" accent={COLORS.bad} />
        <StatCard icon={MessageSquareWarning} label="Open Complaints" value={pendingComplaints} accent={COLORS.warn} />
        <StatCard icon={Utensils} label="Avg. MDM Coverage" value={`${Math.round(schools.reduce((a,s)=>a+s.mdm,0)/schools.length)}%`} accent={COLORS.slate} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <BarChart3 size={16} color={COLORS.ink} />
            <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>Attendance Trend (Last 6 Days)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ATTENDANCE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${COLORS.line}` }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="student" name="Student %" stroke={COLORS.ink} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="teacher" name="Teacher %" stroke={COLORS.good} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <PieIcon size={16} color={COLORS.ink} />
            <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>AI Risk Distribution</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={RISK_DIST} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {RISK_DIST.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            {RISK_DIST.map(d => (
              <div key={d.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.slate }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} /> {d.name}
                </span>
                <span style={{ fontWeight: 700, color: COLORS.ink }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <AlertTriangle size={16} color={COLORS.bad} />
          <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>Live Alerts — Schools Needing Attention</span>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {schools.filter(s => s.risk !== "green").map(s => (
            <div key={s.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", borderRadius: 10, background: RISK_META[s.risk].bg
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{s.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 12, color: COLORS.slate }}>Attendance {s.attendanceToday}%</span>
                <RiskBadge risk={s.risk} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Complaints module ----------
function ComplaintsView({ complaints, setComplaints, schools }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ school: schools[0].id, type: "Teacher Absence", desc: "" });

  const cycle = { Pending: "In Progress", "In Progress": "Resolved", Resolved: "Resolved" };

  const advance = (id) => {
    setComplaints(cs => cs.map(c => c.id === id ? { ...c, status: cycle[c.status] } : c));
  };

  const submit = () => {
    if (!form.desc.trim()) return;
    const id = "C" + (100 + complaints.length + 1);
    setComplaints(cs => [{ id, ...form, status: "Pending", date: new Date().toISOString().slice(0, 10) }, ...cs]);
    setForm({ school: schools[0].id, type: "Teacher Absence", desc: "" });
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink }}>Complaint Management</div>
        <button onClick={() => setShowForm(v => !v)} style={{
          display: "flex", alignItems: "center", gap: 6, background: COLORS.ink, color: "#fff", border: "none",
          padding: "9px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer"
        }}>
          {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? "Cancel" : "New Complaint"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: "block", marginBottom: 5 }}>School</label>
              <select value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))} style={{
                width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13, boxSizing: "border-box"
              }}>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: "block", marginBottom: 5 }}>Category</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{
                width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13, boxSizing: "border-box"
              }}>
                {["Teacher Absence", "Mid-Day Meal", "Infrastructure", "Harassment", "Cleanliness", "Other"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: "block", marginBottom: 5 }}>Description</label>
          <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={3} placeholder="Describe the issue..." style={{
            width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13, marginBottom: 12, boxSizing: "border-box", fontFamily: "inherit", resize: "vertical"
          }} />
          <button onClick={submit} style={{
            background: COLORS.good, color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}>Submit Complaint</button>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {complaints.map(c => {
          const school = schools.find(s => s.id === c.school);
          return (
            <div key={c.id} style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.ink }}>{c.type}</span>
                  <span style={{ fontSize: 12, color: COLORS.slate, marginLeft: 8 }}>{school?.name} · {c.date}</span>
                </div>
                <StatusChip status={c.status} />
              </div>
              <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 10 }}>{c.desc}</div>
              {c.status !== "Resolved" && (
                <button onClick={() => advance(c.id)} style={{
                  fontSize: 12, fontWeight: 600, color: COLORS.ink, background: COLORS.paperDim,
                  border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer"
                }}>
                  Mark as {cycle[c.status]}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Inspections module ----------
function InspectionsView({ inspections, setInspections, schools }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ school: schools[0].id, officer: "", type: "Scheduled", notes: "" });

  const genSummary = (notes) => {
    if (!notes.trim()) return "No remarks entered. AI summary unavailable.";
    return `AI Summary: Inspector recorded — "${notes.slice(0, 90)}${notes.length > 90 ? "..." : ""}". Flagged for follow-up based on keyword analysis.`;
  };

  const submit = () => {
    if (!form.officer.trim()) return;
    const id = "I" + (200 + inspections.length + 1);
    setInspections(is => [{
      id, school: form.school, officer: form.officer, date: new Date().toISOString().slice(0, 10),
      type: form.type, summary: genSummary(form.notes), status: "Filed"
    }, ...is]);
    setForm({ school: schools[0].id, officer: "", type: "Scheduled", notes: "" });
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink }}>Inspection Module</div>
        <button onClick={() => setShowForm(v => !v)} style={{
          display: "flex", alignItems: "center", gap: 6, background: COLORS.ink, color: "#fff", border: "none",
          padding: "9px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer"
        }}>
          {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? "Cancel" : "Log Inspection"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: "block", marginBottom: 5 }}>School</label>
              <select value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))} style={{
                width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13, boxSizing: "border-box"
              }}>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: "block", marginBottom: 5 }}>Inspection Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{
                width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13, boxSizing: "border-box"
              }}>
                <option>Scheduled</option>
                <option>Surprise</option>
              </select>
            </div>
          </div>
          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: "block", marginBottom: 5 }}>Officer Name</label>
          <input value={form.officer} onChange={e => setForm(f => ({ ...f, officer: e.target.value }))} placeholder="e.g. BEO S. Kaur" style={{
            width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13, marginBottom: 12, boxSizing: "border-box"
          }} />
          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: "block", marginBottom: 5 }}>Remarks (photos / GPS / video capture simulated)</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Enter field remarks..." style={{
            width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13, marginBottom: 12, boxSizing: "border-box", fontFamily: "inherit", resize: "vertical"
          }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[{icon: Camera, label: "Add Photo"}, {icon: MapPin, label: "Capture GPS"}].map(b => (
              <button key={b.label} type="button" style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: COLORS.slate,
                background: COLORS.paperDim, border: "none", padding: "7px 12px", borderRadius: 8, cursor: "pointer"
              }}><b.icon size={13} /> {b.label}</button>
            ))}
          </div>
          <button onClick={submit} style={{
            background: COLORS.good, color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}>File Inspection Report</button>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {inspections.map(i => {
          const school = schools.find(s => s.id === i.school);
          return (
            <div key={i.id} style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.ink }}>{school?.name}</span>
                  <span style={{ fontSize: 12, color: COLORS.slate, marginLeft: 8 }}>{i.type} · {i.officer} · {i.date}</span>
                </div>
                <StatusChip status={i.status} />
              </div>
              <div style={{ fontSize: 13, color: COLORS.inkSoft, background: COLORS.paperDim, padding: "8px 10px", borderRadius: 8 }}>{i.summary}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Mid-Day Meal module ----------
function MDMView({ schools }) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink, marginBottom: 16 }}>Mid-Day Meal Monitoring</div>
      <div style={{ display: "grid", gap: 10 }}>
        {schools.map(s => {
          const anomaly = s.mdm < 60;
          return (
            <div key={s.id} style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.ink }}>{s.name}</span>
                {anomaly ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: COLORS.bad }}>
                    <AlertTriangle size={13} /> AI Anomaly Detected
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: COLORS.good }}>
                    <CheckCircle2 size={13} /> Normal
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 24, fontSize: 12.5, color: COLORS.slate, flexWrap: "wrap" }}>
                <span>Coverage: <b style={{ color: COLORS.ink }}>{s.mdm}%</b> of {s.students} students</span>
                <span>Stock: <b style={{ color: anomaly ? COLORS.bad : COLORS.good }}>{anomaly ? "Low" : "Adequate"}</b></span>
                <span>Today's menu: <b style={{ color: COLORS.ink }}>Rice, Dal, Vegetable Curry</b></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Attendance module ----------
function AttendanceView({ schools }) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink, marginBottom: 16 }}>AI Attendance Monitoring</div>
      <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={schools.map(s => ({ name: s.name.split(",")[0].replace("Govt. ", ""), Student: s.attendanceToday, Teacher: s.teacherAttendance }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: COLORS.slate }} interval={0} angle={-20} textAnchor="end" height={70} axisLine={{ stroke: COLORS.line }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Student" fill={COLORS.ink} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Teacher" fill={COLORS.good} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {schools.map(s => {
          const flags = [];
          if (s.attendanceToday < 70) flags.push("Low student attendance");
          if (s.teacherAttendance < 80) flags.push("Teacher absence detected");
          return (
            <div key={s.id} style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.ink }}>{s.name}</div>
                {flags.length > 0 ? (
                  <div style={{ fontSize: 12, color: COLORS.bad, marginTop: 3 }}>⚠ {flags.join(" · ")}</div>
                ) : (
                  <div style={{ fontSize: 12, color: COLORS.good, marginTop: 3 }}>No anomalies detected</div>
                )}
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: COLORS.slate }}>Students</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.attendanceToday}%</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: COLORS.slate }}>Teachers</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.teacherAttendance}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Reports module ----------
function ReportsView({ schools }) {
  const [generating, setGenerating] = useState(false);
  const [ready, setReady] = useState(false);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setReady(true); }, 1100);
  };

  const ranked = [...schools].sort((a, b) => (b.exam + b.attendanceToday) - (a.exam + a.attendanceToday));

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink, marginBottom: 16 }}>Reports & Rankings</div>

      <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: COLORS.ink, marginBottom: 12 }}>Generate Monthly Report</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={generate} disabled={generating} style={{
            background: COLORS.ink, color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: generating ? "default" : "pointer", opacity: generating ? 0.7 : 1
          }}>
            {generating ? "Generating with AI…" : "Generate PDF Report"}
          </button>
          <button onClick={generate} disabled={generating} style={{
            background: "#fff", color: COLORS.ink, border: `1px solid ${COLORS.line}`, padding: "9px 16px", borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: generating ? "default" : "pointer"
          }}>
            Export as Excel
          </button>
        </div>
        {ready && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, background: COLORS.goodBg, color: COLORS.good, padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
            <CheckCircle2 size={16} /> Report generated — District_Monthly_Report_July2026.pdf (prototype: no file is actually produced)
          </div>
        )}
      </div>

      <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: COLORS.ink, marginBottom: 14 }}>School Ranking Leaderboard</div>
        <div style={{ display: "grid", gap: 8 }}>
          {ranked.map((s, idx) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 12px", borderRadius: 10, background: idx === 0 ? COLORS.goodBg : COLORS.paperDim }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: idx === 0 ? COLORS.good : "#fff", color: idx === 0 ? "#fff" : COLORS.ink, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: COLORS.slate }}>{s.district}</div>
              </div>
              <div style={{ fontSize: 12.5, color: COLORS.slate }}>Exam {s.exam}%</div>
              <div style={{ fontSize: 12.5, color: COLORS.slate }}>Attend. {s.attendanceToday}%</div>
              <RiskBadge risk={s.risk} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Main app ----------
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "schools", label: "Schools", icon: School },
  { id: "attendance", label: "AI Attendance", icon: UserCheck },
  { id: "inspections", label: "Inspections", icon: ClipboardCheck },
  { id: "mdm", label: "Mid-Day Meal", icon: Utensils },
  { id: "complaints", label: "Complaints", icon: MessageSquareWarning },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

export default function EschoolApp() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [inspections, setInspections] = useState(INITIAL_INSPECTIONS);

  const handleOpenSchool = useCallback((s) => { setSelectedSchool(s); }, []);

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.paper, fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 232, background: COLORS.ink, padding: "20px 14px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 10px 22px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <School size={17} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, fontFamily: "'Manrope', sans-serif" }}>Eschool</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>School Monitoring</div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 3, flex: 1 }}>
          {NAV.map(n => (
            <Pill key={n.id} icon={n.icon} active={tab === n.id} onClick={() => { setTab(n.id); setSelectedSchool(null); }}>
              {n.label}
            </Pill>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 14, marginTop: 14 }}>
          <div style={{ padding: "0 10px 12px", color: "rgba(255,255,255,0.85)", fontSize: 12.5 }}>
            <div style={{ fontWeight: 700 }}>{user.label}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{user.sub}</div>
          </div>
          <Pill icon={LogOut} onClick={() => { setUser(null); setTab("dashboard"); setSelectedSchool(null); }}>
            Sign out
          </Pill>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          height: 60, borderBottom: `1px solid ${COLORS.line}`, background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", position: "sticky", top: 0, zIndex: 5
        }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.ink, fontFamily: "'Manrope', sans-serif" }}>
            {selectedSchool ? "School Detail" : NAV.find(n => n.id === tab)?.label}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <Bell size={18} color={COLORS.slate} />
              <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: "50%", background: COLORS.bad }} />
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.paperDim, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12.5, color: COLORS.ink }}>
              {user.label.split(" ").map(w => w[0]).slice(0,2).join("")}
            </div>
          </div>
        </div>

        <div style={{ padding: "24px 26px 60px" }}>
          {selectedSchool ? (
            <SchoolDetail school={selectedSchool} onBack={() => setSelectedSchool(null)} complaints={complaints} inspections={inspections} />
          ) : (
            <>
              {tab === "dashboard" && <DashboardView schools={SCHOOLS} complaints={complaints} />}
              {tab === "schools" && <SchoolsView schools={SCHOOLS} onOpen={handleOpenSchool} />}
              {tab === "attendance" && <AttendanceView schools={SCHOOLS} />}
              {tab === "inspections" && <InspectionsView inspections={inspections} setInspections={setInspections} schools={SCHOOLS} />}
              {tab === "mdm" && <MDMView schools={SCHOOLS} />}
              {tab === "complaints" && <ComplaintsView complaints={complaints} setComplaints={setComplaints} schools={SCHOOLS} />}
              {tab === "reports" && <ReportsView schools={SCHOOLS} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}