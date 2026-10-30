const seedStudents = [
  ["2025-0418", "Alyssa Mendoza", "alyssa.mendoza@lspu.edu.ph", "BS Information Technology", "3rd Year", "Active"],
  ["2025-0417", "Miguel Santos", "miguel.santos@lspu.edu.ph", "BS Business Administration", "2nd Year", "Active"],
  ["2025-0416", "Camille Dela Cruz", "camille.delacruz@lspu.edu.ph", "BS Psychology", "1st Year", "Pending"],
  ["2025-0415", "Joshua Villanueva", "joshua.villanueva@lspu.edu.ph", "BS Computer Science", "4th Year", "Active"],
  ["2025-0414", "Sofia Garcia", "sofia.garcia@lspu.edu.ph", "BS Education", "2nd Year", "Active"],
  ["2025-0413", "Nathaniel Flores", "nathaniel.flores@lspu.edu.ph", "BS Accountancy", "3rd Year", "Pending"],
  ["2025-0412", "Isabelle Ramos", "isabelle.ramos@lspu.edu.ph", "BS Hospitality Management", "1st Year", "Active"],
  ["2025-0411", "Gabriel Torres", "gabriel.torres@lspu.edu.ph", "BS Information Technology", "2nd Year", "Active"],
  ["2025-0410", "Andrea Bautista", "andrea.bautista@lspu.edu.ph", "BS Computer Science", "4th Year", "Graduated"],
  ["2025-0409", "Paolo Navarro", "paolo.navarro@lspu.edu.ph", "BS Business Administration", "1st Year", "Active"],
  ["2025-0408", "Trisha Aquino", "trisha.aquino@lspu.edu.ph", "BS Psychology", "3rd Year", "Active"],
  ["2025-0407", "Enzo Castillo", "enzo.castillo@lspu.edu.ph", "BS Education", "2nd Year", "Active"]
].map(([id, name, email, program, year, status], index) => ({ id, name, email, program, year, status, joined: `Oct ${String(30 - Math.floor(index / 2)).padStart(2, "0")}, 2026` }));

const seedApplications = [
  ["EN-26084", "Camille Dela Cruz", "camille.delacruz@lspu.edu.ph", "BS Psychology", "New student", "Oct 29, 2026", "For review"],
  ["EN-26083", "Nathaniel Flores", "nathaniel.flores@lspu.edu.ph", "BS Accountancy", "Continuing", "Oct 29, 2026", "For review"],
  ["EN-26082", "Rhea Domingo", "rhea.domingo@lspu.edu.ph", "BS Information Technology", "New student", "Oct 28, 2026", "For review"],
  ["EN-26081", "Marco Lim", "marco.lim@lspu.edu.ph", "BS Hospitality Management", "Continuing", "Oct 28, 2026", "For review"],
  ["EN-26080", "Bea Fernandez", "bea.fernandez@lspu.edu.ph", "BS Education", "Continuing", "Oct 27, 2026", "Approved"],
  ["EN-26079", "Carl David", "carl.david@lspu.edu.ph", "BS Computer Science", "Continuing", "Oct 26, 2026", "Approved"],
  ["EN-26078", "Mikaela Cruz", "mikaela.cruz@lspu.edu.ph", "BS Accountancy", "New student", "Oct 25, 2026", "Needs documents"]
].map(([id, name, email, program, type, submitted, status]) => ({ id, name, email, program, type, submitted, status }));

function readStored(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : fallback; }
  catch { return fallback; }
}
const state = { page: "dashboard", search: "", studentFilter: "All statuses", applicationFilter: "All applications", students: readStored("lspu-students", seedStudents), applications: readStored("lspu-applications", seedApplications) };
const pageContent = document.querySelector("#page-content");
const modal = document.querySelector("#modal-backdrop");
const studentForm = document.querySelector("#student-form");
const toast = document.querySelector("#toast");
const loginScreen = document.querySelector("#login-screen");
const appShell = document.querySelector("#app-shell");
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const loginViews = Array.from(document.querySelectorAll(".login-view"));
let toastTimer;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function persist() {
  try { localStorage.setItem("lspu-students", JSON.stringify(state.students)); localStorage.setItem("lspu-applications", JSON.stringify(state.applications)); }
  catch { showToast("Changes are saved for this session only."); }
}
function showToast(message) {
  toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
function initials(name) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase(); }
function avatarClass(name) { return ["", "orange", "yellow", "blue"][name.charCodeAt(0) % 4]; }
function statusClass(status) { return status.toLowerCase().replace(/\s+/g, "-"); }
function matchingStudents() {
  const query = state.search.trim().toLowerCase();
  return state.students.filter((student) => (!query || [student.id, student.name, student.email, student.program, student.year].some((value) => value.toLowerCase().includes(query))) && (state.studentFilter === "All statuses" || student.status === state.studentFilter));
}
function matchingApplications() {
  const query = state.search.trim().toLowerCase();
  return state.applications.filter((application) => (!query || [application.id, application.name, application.email, application.program].some((value) => value.toLowerCase().includes(query))) && (state.applicationFilter === "All applications" || application.status === state.applicationFilter));
}
function heading(title, subtitle, action = "") {
  return `<div class="page-heading"><div><p class="eyebrow">LAGUNA STATE POLYTECHNIC UNIVERSITY</p><h1>${title}</h1><p>${subtitle}</p></div>${action ? `<div class="heading-actions">${action}</div>` : ""}</div>`;
}
function studentRows(students, actions = true) {
  if (!students.length) return `<tr><td class="empty-state" colspan="${actions ? 5 : 4}">No students match this search.</td></tr>`;
  return students.map((student) => `<tr><td><div class="student-cell"><span class="student-avatar ${avatarClass(student.name)}">${escapeHtml(initials(student.name))}</span><span class="student-name"><strong>${escapeHtml(student.name)}</strong><small>${escapeHtml(student.id)}</small></span></div></td><td class="program-cell">${escapeHtml(student.program)}</td><td>${escapeHtml(student.year)}</td><td><span class="status-pill ${statusClass(student.status)}">${escapeHtml(student.status)}</span></td>${actions ? `<td><div class="row-actions"><button class="action-button" data-edit-student="${escapeHtml(student.id)}" aria-label="Edit ${escapeHtml(student.name)}" title="Edit student">✎</button><button class="action-button danger" data-delete-student="${escapeHtml(student.id)}" aria-label="Delete ${escapeHtml(student.name)}" title="Delete student">×</button></div></td>` : ""}</tr>`).join("");
}
function applicationRows(applications) {
  if (!applications.length) return `<tr><td class="empty-state" colspan="6">No enrolment applications match this view.</td></tr>`;
  return applications.map((app) => `<tr><td><div class="student-cell"><span class="student-avatar ${avatarClass(app.name)}">${escapeHtml(initials(app.name))}</span><span class="student-name"><strong>${escapeHtml(app.name)}</strong><small>${escapeHtml(app.id)}</small></span></div></td><td class="program-cell">${escapeHtml(app.program)}</td><td>${escapeHtml(app.type)}</td><td>${escapeHtml(app.submitted)}</td><td><span class="status-pill ${statusClass(app.status)}">${escapeHtml(app.status)}</span></td><td><div class="row-actions">${app.status === "For review" ? `<button class="button button-primary button-small" data-application-action="${escapeHtml(app.id)}" data-next-status="Approved">Approve</button><button class="action-button danger" data-application-action="${escapeHtml(app.id)}" data-next-status="Needs documents" aria-label="Request documents for ${escapeHtml(app.name)}" title="Request documents">!</button>` : `<span class="row-actions-label">${app.status === "Approved" ? "Complete" : "Follow up"}</span>`}</div></td></tr>`).join("");
}
function renderDashboard() {
  const pending = state.applications.filter((app) => app.status === "For review").length;
  const active = state.students.filter((student) => student.status === "Active").length;
  const bars = [48, 65, 54, 75, 67, 89, 73].map((height, i) => `<div class="chart-month"><span class="chart-bar" style="height:${height}%"></span><span class="chart-bar previous" style="height:${Math.max(14, height - 19 + (i % 2) * 7)}%"></span></div>`).join("");
  return `${heading("Good morning, Maria", "Here’s what’s happening across student services today.", `<button class="button button-quiet" data-action="export">↓ Export report</button><button class="button button-primary" data-action="add-student"><span class="plus">+</span> Add student</button>`)}
    <section class="metrics-grid" aria-label="Student services summary">
      <article class="metric-card"><div class="metric-top"><span>Total students</span><span class="metric-icon">▤</span></div><div class="metric-value-row"><strong class="metric-value">${(1284 + state.students.length - seedStudents.length).toLocaleString()}</strong><span class="metric-change">↗ 8.2%</span></div><div class="metric-note">Compared with last semester</div></article>
      <article class="metric-card"><div class="metric-top"><span>For enrolment</span><span class="metric-icon orange">⇥</span></div><div class="metric-value-row"><strong class="metric-value">${(86 + state.applications.length - seedApplications.length).toLocaleString()}</strong><span class="metric-change">↗ 12.5%</span></div><div class="metric-note">Across all programs</div></article>
      <article class="metric-card"><div class="metric-top"><span>Needs review</span><span class="metric-icon yellow">◷</span></div><div class="metric-value-row"><strong class="metric-value">${pending}</strong><span class="metric-change attention">Requires action</span></div><div class="metric-note">Enrolment applications</div></article>
      <article class="metric-card"><div class="metric-top"><span>Active students</span><span class="metric-icon gray">✓</span></div><div class="metric-value-row"><strong class="metric-value">${(1198 + active - 10).toLocaleString()}</strong><span class="metric-change">↗ 4.1%</span></div><div class="metric-note">Currently enrolled</div></article>
    </section>
    <section class="dashboard-grid">
      <article class="panel chart-panel"><header class="panel-header"><div><h2 class="panel-title">Enrolment activity</h2><p class="panel-subtitle">Student registrations over the past 7 months</p></div><div class="chart-legend"><span class="legend-key"><i class="legend-dot"></i> 2026–27</span><span class="legend-key"><i class="legend-dot previous"></i> 2025–26</span></div></header><div class="chart"><div class="chart-y"><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span></div><div class="chart-body"><div class="chart-bars">${bars}</div><div class="chart-labels"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div></div></div><div class="chart-footer"><span>Peak activity in October</span><strong>+18.6% vs. last year</strong></div></article>
      <div class="side-stack"><article class="panel intake-panel"><header class="panel-header"><div><h2 class="panel-title">Application pipeline</h2><p class="panel-subtitle">1st semester intake</p></div><button class="text-link" data-page="enrolment">View queue →</button></header><div class="intake-total"><strong>${(86 + state.applications.length - seedApplications.length).toLocaleString()}</strong><span>total applications</span></div><div class="pipeline-list"><div class="pipeline-row"><span>Approved</span><div class="pipeline-track"><span style="width:69%"></span></div><strong>59</strong></div><div class="pipeline-row"><span>In review</span><div class="pipeline-track"><span style="width:${Math.max(7, pending * 4)}%"></span></div><strong>${pending}</strong></div><div class="pipeline-row"><span>Incomplete</span><div class="pipeline-track"><span style="width:21%"></span></div><strong>18</strong></div></div></article>
      <article class="panel deadline-panel"><header class="panel-header"><div><h2 class="panel-title">Upcoming dates</h2><p class="panel-subtitle">Important academic dates</p></div><button class="text-link" data-page="reports">View calendar →</button></header><div class="deadline-list"><div class="deadline-item"><span class="date-tile"><strong>02</strong><small>NOV</small></span><span class="deadline-copy"><strong>Priority enrolment</strong><small>Returning students</small></span><span class="deadline-tag">In 3 days</span></div><div class="deadline-item"><span class="date-tile"><strong>08</strong><small>NOV</small></span><span class="deadline-copy"><strong>Regular enrolment</strong><small>All undergraduate programs</small></span><span class="deadline-tag">In 9 days</span></div></div></article></div></section>
    <section class="panel" style="margin-top:15px"><header class="panel-header"><div><h2 class="panel-title">Recently added students</h2><p class="panel-subtitle">Latest updates to the student registry</p></div><button class="text-link" data-page="students">View all students →</button></header><div class="table-wrap"><table><thead><tr><th>STUDENT</th><th>PROGRAM</th><th>YEAR</th><th>STATUS</th></tr></thead><tbody>${studentRows(state.students.slice(0, 5), false)}</tbody></table></div></section>`;
}
function renderStudents() {
  const students = matchingStudents();
  return `${heading("Student directory", "Manage student profiles, program details, and academic standing.", `<button class="button button-primary" data-action="add-student"><span class="plus">+</span> Add student</button>`)}<section class="section-summary"><article class="summary-card"><span>All student records</span><strong>${state.students.length}</strong></article><article class="summary-card"><span>Active</span><strong>${state.students.filter((s) => s.status === "Active").length}</strong></article><article class="summary-card"><span>Pending registration</span><strong>${state.students.filter((s) => s.status === "Pending").length}</strong></article></section><section class="panel table-panel"><div class="table-toolbar"><div class="table-heading"><strong>Student records</strong><span>${students.length} shown</span></div><div class="table-tools"><select class="filter-select" id="student-filter" aria-label="Filter by student status"><option>All statuses</option><option>Active</option><option>Pending</option><option>Graduated</option></select><button class="button button-quiet button-small" data-action="export">↓ Export CSV</button></div></div><div class="table-wrap"><table><thead><tr><th>STUDENT</th><th>PROGRAM</th><th>YEAR</th><th>STATUS</th><th></th></tr></thead><tbody>${studentRows(students)}</tbody></table></div><div class="table-footer"><span>Showing ${students.length} of ${state.students.length} student records</span><span>Academic year 2026–2027</span></div></section>`;
}
function renderEnrolment() {
  const applications = matchingApplications();
  const pending = state.applications.filter((app) => app.status === "For review").length;
  return `${heading("Enrolment applications", "Review, approve, and track student registration submissions.", `<button class="button button-quiet" data-action="export-applications">↓ Export applications</button>`)}<section class="section-summary"><article class="summary-card"><span>Total applications</span><strong>${state.applications.length}</strong></article><article class="summary-card"><span>For review</span><strong>${pending}</strong></article><article class="summary-card"><span>Approved</span><strong>${state.applications.filter((a) => a.status === "Approved").length}</strong></article></section><section class="panel table-panel"><div class="table-toolbar"><div class="table-heading"><strong>Application queue</strong><span>${applications.length} shown</span></div><div class="table-tools"><select class="filter-select" id="application-filter" aria-label="Filter applications"><option>All applications</option><option>For review</option><option>Approved</option><option>Needs documents</option></select></div></div><div class="table-wrap"><table><thead><tr><th>APPLICANT</th><th>PROGRAM</th><th>TYPE</th><th>SUBMITTED</th><th>STATUS</th><th></th></tr></thead><tbody>${applicationRows(applications)}</tbody></table></div><div class="table-footer"><span>${pending} applications require review</span><span>1st semester · AY 2026–2027</span></div></section>`;
}
function renderReports() {
  const approved = state.applications.filter((a) => a.status === "Approved").length;
  const review = state.applications.filter((a) => a.status === "For review").length;
  const incomplete = state.applications.filter((a) => a.status === "Needs documents").length;
  const total = state.applications.length || 1;
  const studentCount = (status) => state.students.filter((s) => s.status === status).length;
  return `${heading("Reports & insights", "A snapshot of registration activity and student records.", `<button class="button button-primary" data-action="export">↓ Export student report</button>`)}<section class="report-grid"><article class="report-card"><h2>Enrolment status</h2><p>Current application outcomes</p><div class="report-number">${state.applications.length}<small> applications</small></div><div class="report-bar"><span style="width:${approved / total * 100}%"></span><span style="width:${review / total * 100}%"></span><span style="width:${incomplete / total * 100}%"></span></div><div class="report-legend"><span><i></i>${approved} approved</span><span><i></i>${review} in review</span><span><i></i>${incomplete} incomplete</span></div></article><article class="report-card"><h2>Student records</h2><p>Current directory breakdown</p><div class="report-number">${state.students.length}<small> records</small></div><div class="report-bar"><span style="width:${studentCount("Active") / state.students.length * 100 || 0}%"></span><span style="width:${studentCount("Pending") / state.students.length * 100 || 0}%"></span><span style="width:${studentCount("Graduated") / state.students.length * 100 || 0}%"></span></div><div class="report-legend"><span><i></i>${studentCount("Active")} active</span><span><i></i>${studentCount("Pending")} pending</span><span><i></i>${studentCount("Graduated")} graduated</span></div></article></section><section class="panel"><header class="panel-header"><div><h2 class="panel-title">Recent student activity</h2><p class="panel-subtitle">Latest records across all programs</p></div><button class="text-link" data-page="students">Open directory →</button></header><div class="table-wrap"><table><thead><tr><th>STUDENT</th><th>PROGRAM</th><th>YEAR</th><th>STATUS</th></tr></thead><tbody>${studentRows(state.students.slice(0, 5), false)}</tbody></table></div></section>`;
}
function render() {
  const pages = { dashboard: renderDashboard, students: renderStudents, enrolment: renderEnrolment, reports: renderReports };
  pageContent.innerHTML = pages[state.page]();
  const titles = { dashboard: "Overview", students: "Students", enrolment: "Enrolment", reports: "Reports" };
  document.querySelector("#breadcrumb-current").textContent = titles[state.page];
  document.querySelectorAll(".nav-item").forEach((item) => { const active = item.dataset.page === state.page; item.classList.toggle("active", active); if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current"); });
  document.querySelector("#student-nav-count").textContent = state.students.length;
  document.querySelector("#enrolment-nav-count").textContent = state.applications.filter((a) => a.status === "For review").length;
  const studentFilter = document.querySelector("#student-filter"); if (studentFilter) studentFilter.value = state.studentFilter;
  const applicationFilter = document.querySelector("#application-filter"); if (applicationFilter) applicationFilter.value = state.applicationFilter;
}
function setPage(page) {
  if (!["dashboard", "students", "enrolment", "reports"].includes(page)) return;
  state.page = page; document.querySelector("#sidebar").classList.remove("mobile-open"); document.querySelector("#menu-toggle").setAttribute("aria-expanded", "false"); render(); window.scrollTo({ top: 0, behavior: "smooth" });
}
function openStudentModal(student) {
  studentForm.reset(); studentForm.elements.id.value = student?.id || ""; studentForm.elements.name.value = student?.name || ""; studentForm.elements.email.value = student?.email || ""; studentForm.elements.program.value = student?.program || ""; studentForm.elements.year.value = student?.year || ""; studentForm.elements.status.value = student?.status || "Active";
  document.querySelector("#modal-title").textContent = student ? "Edit student" : "Add a student"; document.querySelector("#save-student").textContent = student ? "Save changes" : "Save student"; modal.hidden = false; studentForm.elements.name.focus();
}
function exportCsv(rows, filename, columns) {
  const csv = [columns.map(([, label]) => `"${label}"`).join(","), ...rows.map((row) => columns.map(([key]) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); showToast(`${rows.length} records exported.`);
}
function handleAction(action) {
  if (action === "add-student") openStudentModal();
  if (action === "export") exportCsv(state.students, "lspu-students.csv", [["id", "Student ID"], ["name", "Full name"], ["email", "Email"], ["program", "Program"], ["year", "Year level"], ["status", "Status"], ["joined", "Date added"]]);
  if (action === "export-applications") exportCsv(state.applications, "lspu-enrolment-applications.csv", [["id", "Application ID"], ["name", "Applicant"], ["email", "Email"], ["program", "Program"], ["type", "Application type"], ["submitted", "Submitted"], ["status", "Status"]]);
}
document.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-page]"); if (pageButton) { setPage(pageButton.dataset.page); return; }
  const actionButton = event.target.closest("[data-action]"); if (actionButton) { handleAction(actionButton.dataset.action); return; }
  const edit = event.target.closest("[data-edit-student]"); if (edit) { openStudentModal(state.students.find((s) => s.id === edit.dataset.editStudent)); return; }
  const remove = event.target.closest("[data-delete-student]"); if (remove) { const student = state.students.find((s) => s.id === remove.dataset.deleteStudent); if (student && confirm(`Remove ${student.name} from the student directory?`)) { state.students = state.students.filter((s) => s.id !== student.id); persist(); render(); showToast("Student record removed."); } return; }
  const appButton = event.target.closest("[data-application-action]"); if (appButton) { const app = state.applications.find((a) => a.id === appButton.dataset.applicationAction); if (app) { app.status = appButton.dataset.nextStatus; persist(); render(); showToast(app.status === "Approved" ? "Enrolment application approved." : "Documents requested from applicant."); } return; }
  if (event.target === modal || event.target.closest("#modal-close, #modal-cancel")) modal.hidden = true;
});
studentForm.addEventListener("submit", (event) => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(studentForm)); const existing = data.id && state.students.find((s) => s.id === data.id);
  if (existing) { Object.assign(existing, { name: data.name.trim(), email: data.email.trim(), program: data.program, year: data.year, status: data.status }); showToast("Student record updated."); }
  else { const number = Math.max(0, ...state.students.map((s) => Number(s.id.slice(-4)) || 0)) + 1; const joined = new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(new Date()); state.students.unshift({ id: `2026-${String(number).padStart(4, "0")}`, name: data.name.trim(), email: data.email.trim(), program: data.program, year: data.year, status: data.status, joined }); showToast("Student added to the directory."); }
  persist(); modal.hidden = true; render();
});
document.querySelector("#global-search").addEventListener("input", (event) => { state.search = event.target.value; if (state.search && state.page === "dashboard") state.page = "students"; render(); });
document.querySelector("#menu-toggle").addEventListener("click", (event) => { const open = document.querySelector("#sidebar").classList.toggle("mobile-open"); event.currentTarget.setAttribute("aria-expanded", String(open)); });
pageContent.addEventListener("change", (event) => { if (event.target.id === "student-filter") { state.studentFilter = event.target.value; render(); } if (event.target.id === "application-filter") { state.applicationFilter = event.target.value; render(); } });
document.querySelector("#notification-button").addEventListener("click", () => { const count = state.applications.filter((a) => a.status === "For review").length; setPage("enrolment"); showToast(`${count} applications are waiting for review.`); });
document.addEventListener("keydown", (event) => { if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) { event.preventDefault(); document.querySelector("#global-search").focus(); } if (event.key === "Escape" && !modal.hidden) modal.hidden = true; });

function showPortal(name) {
  document.querySelector(".profile-copy strong").textContent = name || "Registrar";
  document.querySelector(".profile-avatar").textContent = initials(name || "Registrar");
  loginScreen.hidden = true;
  appShell.hidden = false;
  render();
}

function showLoginView(viewId) {
  const activeView = loginViews.find((view) => view.id === `login-view-${viewId}`);
  if (!activeView) return;
  loginViews.forEach((view) => { view.hidden = view !== activeView; });
  loginViews.forEach((view) => view.querySelector(".login-message")?.setAttribute("hidden", ""));
  activeView.classList.remove("login-view-enter");
  void activeView.offsetWidth;
  activeView.classList.add("login-view-enter");
  activeView.querySelector("input, button")?.focus();
}

function signOut() {
  localStorage.removeItem("lspu-portal-session");
  localStorage.removeItem("lspu-portal-user");
  sessionStorage.removeItem("lspu-portal-session");
  sessionStorage.removeItem("lspu-portal-user");
  appShell.hidden = true;
  loginScreen.hidden = false;
  loginForm.reset();
  loginMessage.hidden = true;
  showLoginView("sign-in");
}

document.querySelectorAll("[data-login-view]").forEach((button) => {
  button.addEventListener("click", () => showLoginView(button.dataset.loginView));
});

document.querySelector("#password-toggle").addEventListener("click", (event) => {
  const password = document.querySelector("#login-password");
  const visible = password.type === "password";
  password.type = visible ? "text" : "password";
  event.currentTarget.textContent = visible ? "Hide" : "Show";
  event.currentTarget.setAttribute("aria-label", `${visible ? "Hide" : "Show"} password`);
  event.currentTarget.setAttribute("aria-pressed", String(visible));
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = String(formData.get("email")).trim();
  const accountName = (email.split("@")[0] || "registrar").split(/[._-]+/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
  const storage = formData.has("remember") ? localStorage : sessionStorage;
  localStorage.removeItem("lspu-portal-session");
  localStorage.removeItem("lspu-portal-user");
  sessionStorage.removeItem("lspu-portal-session");
  sessionStorage.removeItem("lspu-portal-user");
  storage.setItem("lspu-portal-session", "active");
  storage.setItem("lspu-portal-user", accountName);
  showPortal(accountName);
});

document.querySelector("#logout-button").addEventListener("click", signOut);
document.querySelector("#today-date").textContent = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date());
const savedName = localStorage.getItem("lspu-portal-session") === "active" ? localStorage.getItem("lspu-portal-user") : sessionStorage.getItem("lspu-portal-session") === "active" ? sessionStorage.getItem("lspu-portal-user") : "";
if (savedName) showPortal(savedName);
else { appShell.hidden = true; loginScreen.hidden = false; }