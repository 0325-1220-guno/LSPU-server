import { ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, navItems, SESSION_KEY, STORAGE_KEY } from "./config.js";
import { initializeLanding } from "./landing.js";
import { hashPassword, randomSalt } from "./security.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const views = { login: $("#login-view"), signup: $("#signup-view") };
let data;
let currentUser = null;
let activePage = "my-information";
let toastTimer;
let studentSort = { key: "name", direction: 1 };

function emptyData() {
  return { accounts: [], students: [], enrollments: [], schedules: [], activity: [], studentNumberYear: "", nextStudentNumber: 1 };
}
function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function syncStudentNumberSequence() {
  const year = String(new Date().getFullYear());
  const highestExisting = data.students.reduce((highest, student) => {
    const match = String(student.studentId || "").match(/^LSPU-(\d{4})-(\d+)$/i);
    return match?.[1] === year ? Math.max(highest, Number(match[2])) : highest;
  }, 0);
  data.nextStudentNumber = data.studentNumberYear === year
    ? Math.max(Number(data.nextStudentNumber) || 1, highestExisting + 1)
    : highestExisting + 1;
  data.studentNumberYear = year;
}
function createStudentNumber() {
  syncStudentNumberSequence();
  let studentId;
  do {
    studentId = `LSPU-${data.studentNumberYear}-${String(data.nextStudentNumber++).padStart(4, "0")}`;
  } while (data.students.some((student) => student.studentId.toLowerCase() === studentId.toLowerCase()));
  return studentId;
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[character]);
}
function initials(name) {
  return String(name || "Student").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Could not save portal data.", error);
    showToast("Browser storage is full or unavailable. Your changes could not be saved.", true);
    return false;
  }
}
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyData();
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.accounts)) throw new Error("Saved portal data is not valid.");
    return {
      ...emptyData(), ...parsed,
      accounts: parsed.accounts.map((account) => ({
        ...account,
        role: String(account.email || "").toLowerCase() === ADMIN_EMAIL ? "admin" : "student"
      })),
      students: Array.isArray(parsed.students) ? parsed.students : [],
      enrollments: Array.isArray(parsed.enrollments) ? parsed.enrollments : [],
      schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
      activity: Array.isArray(parsed.activity) ? parsed.activity : []
    };
  } catch (error) {
    console.error("Could not read portal data.", error);
    $("#storage-warning").hidden = false;
    $("#storage-warning").textContent = "Saved data could not be read. Clear this demo’s browser storage to start over.";
    throw error;
  }
}
async function initializeData() {
  data = loadData();
  const admin = data.accounts.find((account) => account.email.toLowerCase() === ADMIN_EMAIL);
  if (!admin || admin.role !== "admin") {
    const salt = randomSalt();
    const adminAccount = {
      id: admin?.id || makeId(), displayName: "Administrator", email: ADMIN_EMAIL, role: "admin",
      salt, passwordHash: await hashPassword(DEFAULT_ADMIN_PASSWORD, salt),
      createdAt: admin?.createdAt || new Date().toISOString(), lastLogin: admin?.lastLogin || null
    };
    if (admin) Object.assign(admin, adminAccount);
    else data.accounts.push(adminAccount);
    if (!saveData()) throw new Error("Could not save the administrator account.");
  }
  data.accounts.forEach((account) => {
    account.role = account.role === "admin" ? "admin" : "student";
    account.lastLogin = account.lastLogin || null;
  });
  data.students = data.students.map((student) => ({
    id: student.id || makeId(), studentId: student.studentId || "", name: student.name || "",
    email: student.email || "", course: student.course || "", yearLevel: student.yearLevel || "",
    status: student.status || "Active", ownerId: student.ownerId || student.userId || ""
  }));
  syncStudentNumberSequence();
  data.enrollments = data.enrollments.map((record) => {
    const student = data.students.find((item) => item.id === record.studentRecordId || item.studentId === record.studentId);
    return {
      ...record, id: record.id || makeId(), studentRecordId: student?.id || record.studentRecordId || "",
      course: record.course || "", semester: record.semester || "", status: record.status || "Pending",
      createdAt: record.createdAt || new Date().toISOString()
    };
  });
  data.accounts.filter((account) => account.role === "student").forEach((account) => {
    let student = data.students.find((item) => item.ownerId === account.id || item.email.toLowerCase() === account.email.toLowerCase());
    if (!student) {
      student = { id: makeId(), studentId: "", name: account.displayName, email: account.email, course: "", yearLevel: "", status: "Active", ownerId: account.id };
      data.students.push(student);
    } else {
      student.ownerId = account.id;
      account.displayName = student.name || account.displayName;
      account.email = student.email || account.email;
    }
  });
  data.students.forEach((student) => {
    if (!student.studentId) student.studentId = createStudentNumber();
  });
  if (!saveData()) throw new Error("Could not save browser data.");
}
function addActivity(text) {
  data.activity.unshift({ id: makeId(), text, at: new Date().toISOString() });
  data.activity = data.activity.slice(0, 30);
  saveData();
}
function showToast(text, error = false) {
  const toast = $("#toast");
  toast.textContent = text;
  toast.classList.toggle("error", error);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}
function showMessage(id, text, success = false) {
  const element = $(`#${id}`);
  element.textContent = text;
  element.classList.toggle("success", success);
  element.hidden = false;
}
function setBusy(button, busy, loadingText) {
  if (!button.dataset.label) button.dataset.label = button.textContent.trim();
  button.disabled = busy;
  button.innerHTML = busy ? `<span class="spinner" aria-hidden="true"></span>${loadingText}` : "";
  if (!busy) button.textContent = button.dataset.label;
  button.setAttribute("aria-busy", String(busy));
}
function showView(name) {
  const selected = name === "signup" ? "signup" : "login";
  Object.entries(views).forEach(([key, element]) => { element.hidden = key !== selected; });
  $("#login-tab").setAttribute("aria-selected", String(selected === "login"));
  $("#signup-tab").setAttribute("aria-selected", String(selected === "signup"));
  $$(".message").forEach((message) => { message.hidden = true; message.textContent = ""; message.classList.remove("success"); });
  requestAnimationFrame(() => views[selected].querySelector("input")?.focus());
}
initializeLanding(showView);
function setHelper(input, selector, message) {
  const helper = $(selector);
  helper.textContent = message;
  helper.classList.toggle("error", Boolean(message));
  input.setAttribute("aria-invalid", String(Boolean(message)));
}
function validateEmail(inputSelector, helperSelector) {
  const input = $(inputSelector);
  const message = !input.value.trim() ? "Enter your email address." : input.validity.valid ? "" : "Enter a valid email address.";
  setHelper(input, helperSelector, message);
  return !message;
}
function validateSignupName() {
  const input = $("#signup-name");
  const message = input.value.trim().length < 2 ? "Enter your full name." : "";
  setHelper(input, "#signup-name-help", message);
  return !message;
}
function validateSignupCourse() {
  const input = $("#signup-course");
  const message = input.value.trim() ? "" : "Enter your course or program.";
  setHelper(input, "#signup-course-help", message);
  return !message;
}
function validateSignupYearLevel() {
  const input = $("#signup-year-level");
  const message = input.value ? "" : "Choose your current year level.";
  setHelper(input, "#signup-year-level-help", message);
  return !message;
}
function validateSignupPassword() {
  const input = $("#signup-password");
  const message = input.value.length < 8 ? "Use at least 8 characters." : "";
  setHelper(input, "#signup-password-help", message);
  if ($("#signup-confirm").value) validateSignupConfirm();
  return !message;
}
function validateSignupConfirm(required = false) {
  const input = $("#signup-confirm");
  const message = !input.value && required ? "Confirm your password." : input.value && input.value !== $("#signup-password").value ? "Passwords do not match." : "";
  setHelper(input, "#signup-confirm-help", message);
  return !message;
}
$("#signup-name").addEventListener("input", validateSignupName);
$("#signup-email").addEventListener("input", () => validateEmail("#signup-email", "#signup-email-help"));
$("#signup-course").addEventListener("input", validateSignupCourse);
$("#signup-year-level").addEventListener("change", validateSignupYearLevel);
$("#signup-password").addEventListener("input", validateSignupPassword);
$("#signup-confirm").addEventListener("input", () => validateSignupConfirm());

// New accounts are always students; the admin role is never selected at sign-up.
$("#signup-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (![validateSignupName(), validateEmail("#signup-email", "#signup-email-help"), validateSignupCourse(), validateSignupYearLevel(), validateSignupPassword(), validateSignupConfirm(true)].every(Boolean)) return;
  const button = $("#signup-button");
  setBusy(button, true, "Creating account…");
  try {
    const email = $("#signup-email").value.trim().toLowerCase();
    if (data.accounts.some((account) => account.email.toLowerCase() === email)) {
      setHelper($("#signup-email"), "#signup-email-help", "This email is already registered.");
      return;
    }
    const name = $("#signup-name").value.trim().replace(/\s+/g, " ");
    const salt = randomSalt();
    const account = { id: makeId(), displayName: name, email, role: "student", salt, passwordHash: await hashPassword($("#signup-password").value, salt), createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() };
    const student = { id: makeId(), studentId: createStudentNumber(), name, email, course: $("#signup-course").value.trim(), yearLevel: $("#signup-year-level").value, status: "Active", ownerId: account.id };
    data.accounts.push(account);
    data.students.push(student);
    if (!saveData()) {
      data.accounts = data.accounts.filter((item) => item.id !== account.id);
      data.students = data.students.filter((item) => item.id !== student.id);
      return;
    }
    currentUser = account;
    localStorage.setItem(SESSION_KEY, account.id);
    addActivity(`${name} created a student account`);
    $("#signup-form").reset();
    renderWorkspace("my-information");
    showToast("Student account created successfully.");
  } catch (error) {
    console.error("Account could not be created.", error);
    showMessage("signup-message", error.message.includes("hashing") ? error.message : "Something went wrong. Please try again.");
  } finally {
    setBusy(button, false, "Creating account…");
  }
});
$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const button = $("#login-button");
  setBusy(button, true, "Signing in…");
  try {
    const email = form.elements.email.value.trim().toLowerCase();
    const account = data.accounts.find((item) => item.email.toLowerCase() === email);
    if (!account || await hashPassword(form.elements.password.value, account.salt) !== account.passwordHash) {
      showMessage("login-message", "Incorrect email or password.");
      return;
    }
    if (account.role !== "admin" && account.role !== "student") {
      showMessage("login-message", "This account cannot access the portal.");
      return;
    }
    currentUser = account;
    account.lastLogin = new Date().toISOString();
    if ($("#remember-me").checked) {
      localStorage.setItem(SESSION_KEY, account.id);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, account.id);
      localStorage.removeItem(SESSION_KEY);
    }
    addActivity(`${account.displayName} (${account.role}) logged in`);
    saveData();
    form.reset();
    renderWorkspace(account.role === "admin" ? "admin-dashboard" : "my-information");
  } catch (error) {
    console.error("Login failed.", error);
    showMessage("login-message", "Something went wrong. Please try again.");
  } finally {
    setBusy(button, false, "Signing in…");
  }
});
$("#logout-button").addEventListener("click", () => {
  if (currentUser) addActivity(`${currentUser.displayName} logged out`);
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  currentUser = null;
  showAuthScreen();
  showView("login");
  showToast("You have logged out.");
});
function showAuthScreen() {
  $("#auth-screen").hidden = false;
  $("#app-shell").hidden = true;
}
function profileFor(account = currentUser) {
  let student = data.students.find((item) => item.ownerId === account.id || item.email.toLowerCase() === account.email.toLowerCase());
  if (!student && account.role === "student") {
    student = { id: makeId(), studentId: "", name: account.displayName, email: account.email, course: "", yearLevel: "", status: "Active", ownerId: account.id };
    data.students.push(student);
    saveData();
  }
  return student;
}
function renderWorkspace(page) {
  if (!currentUser) return showAuthScreen();
  const isAdmin = currentUser.role === "admin";
  const allowedPages = isAdmin ? navItems.admin.map(([key]) => key) : navItems.student.map(([key]) => key);
  if (!allowedPages.includes(page)) page = isAdmin ? "admin-dashboard" : "my-information";
  activePage = page;
  $("#auth-screen").hidden = true;
  $("#app-shell").hidden = false;
  $("#nav-label").textContent = isAdmin ? "Administration" : "Student workspace";
  $("#side-nav").innerHTML = (isAdmin ? navItems.admin : navItems.student).map(([key, label, icon]) =>
    `<button class="nav-item" type="button" data-page="${key}" aria-current="${key === page ? "page" : "false"}"><span class="nav-symbol" aria-hidden="true">${icon}</span>${label}</button>`
  ).join("");
  $("#sidebar-user-name").textContent = currentUser.displayName;
  $("#sidebar-user-role").textContent = isAdmin ? "Administrator" : "Student account";
  $("#sidebar-avatar").textContent = initials(currentUser.displayName);
  $("#topbar-user-name").textContent = isAdmin ? "Administrator" : currentUser.displayName;
  $("#topbar-role").textContent = isAdmin ? "Admin account" : "Student account";
  $("#topbar-date").textContent = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date());
  const label = (isAdmin ? navItems.admin : navItems.student).find(([key]) => key === page)?.[1] || "";
  $("#topbar-page").textContent = label;
  const content = $("#page-content");
  content.innerHTML = "";
  pagesForRole()[page](content);
}
function pagesForRole() {
  return currentUser.role === "admin"
    ? { "admin-dashboard": renderAdminDashboard, "admin-students": renderAdminStudents, "admin-enrollments": renderAdminEnrollments, "admin-accounts": renderAdminAccounts }
    : { "my-information": renderMyInformation, "my-enrollment": renderMyEnrollment, "my-schedule": renderMySchedule };
}
$("#side-nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-page]");
  if (!button) return;
  renderWorkspace(button.dataset.page);
  $("#sidebar").classList.remove("open");
  $("#mobile-nav-toggle").setAttribute("aria-expanded", "false");
});
$("#mobile-nav-toggle").addEventListener("click", () => {
  const open = $("#sidebar").classList.toggle("open");
  $("#mobile-nav-toggle").setAttribute("aria-expanded", String(open));
  $("#mobile-nav-toggle").setAttribute("aria-label", open ? "Close menu" : "Open menu");
});
function heading(title, description, action = "") {
  return `<div class="page-heading"><div><h1>${escapeHTML(title)}</h1><p>${escapeHTML(description)}</p></div>${action}</div>`;
}
function summaryCard(label, value, caption) {
  return `<article class="summary-card"><span class="summary-label">${escapeHTML(label)}</span><strong class="summary-value">${value}</strong><span class="summary-caption">${escapeHTML(caption)}</span></article>`;
}
function formatDate(value, withTime = false) {
  if (!value) return "Not yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : new Intl.DateTimeFormat("en", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}
function renderAdminDashboard(content) {
  const enrolledStudents = new Set(data.enrollments.filter((item) => item.status === "Enrolled").map((item) => item.studentRecordId));
  const recent = data.activity.slice(0, 7);
  content.innerHTML = `${heading("Administrator dashboard", "Manage student records, enrollment, and accounts across this browser.")}
    <div class="summary-grid">
      ${summaryCard("Total Students", data.students.length, "Student profiles")}
      ${summaryCard("Enrolled", enrolledStudents.size, "Students with enrolled subjects")}
      ${summaryCard("Not Enrolled", Math.max(0, data.students.length - enrolledStudents.size), "No active enrollment")}
      ${summaryCard("Total Accounts", data.accounts.length, "Students and administrators")}
    </div>
    <section class="workspace-panel"><div class="workspace-heading"><div><h2>Administration workspace</h2><p>Choose an area to manage the student system.</p></div><span>ADMINISTRATOR</span></div>
      <div class="workspace-grid">
        ${workspaceCard("admin-students","Students","Manage student profiles and details.","Manage students","◉")}
        ${workspaceCard("admin-enrollments","Enrollments","Add or update student enrollment records.","Manage enrollment","▤")}
        ${workspaceCard("admin-accounts","User Accounts","Review accounts and recent sign-ins.","View accounts","♙")}
      </div>
    </section>
    <section class="content-panel"><div class="panel-heading"><div><h2>Recent activity</h2><p>Recent account and record changes in this browser.</p></div></div>
      ${recent.length ? `<div class="activity-list">${recent.map((item) => `<div class="activity-item"><span class="activity-dot" aria-hidden="true"></span><p>${escapeHTML(item.text)}</p><time>${escapeHTML(formatDate(item.at, true))}</time></div>`).join("")}</div>` : `<p class="empty-note">No recent activity yet.</p>`}
    </section>`;
}
function workspaceCard(page, title, copy, link, icon) {
  return `<button class="workspace-card" type="button" data-workspace-page="${page}"><span class="workspace-icon" aria-hidden="true">${icon}</span><strong>${title}</strong><small>${copy}</small><span class="workspace-arrow">${link} &rarr;</span></button>`;
}
function renderMyInformation(content) {
  const student = profileFor();
  content.innerHTML = `${heading(`Welcome, ${escapeHTML(currentUser.displayName.split(/\s+/)[0])}`, "Your student profile and contact information.", `<button class="primary-button add-button" type="button" data-action="edit-profile">Edit My Information</button>`)}
    <section class="content-panel profile-panel"><div class="profile-heading"><span class="profile-avatar">${escapeHTML(initials(student.name))}</span><div><h2>${escapeHTML(student.name || currentUser.displayName)}</h2><p>${escapeHTML(student.course || "Course not added yet")}</p></div><span class="status ${escapeHTML(student.status.toLowerCase())}">${escapeHTML(student.status)}</span></div>
      <div class="profile-grid">
        ${profileItem("Full name", student.name)}
        ${profileItem("Email", student.email)}
        ${profileItem("Student ID", student.studentId)}
        ${profileItem("Course", student.course)}
        ${profileItem("Year level", student.yearLevel)}
        ${profileItem("Status", student.status)}
      </div>
    </section><p class="profile-help">Keep your contact details and student information up to date. If your student ID has not been assigned, you can leave it blank.</p>`;
}
function profileItem(label, value) {
  return `<div class="profile-item"><small>${escapeHTML(label)}</small><strong>${escapeHTML(value || "Not added yet")}</strong></div>`;
}
function renderMyEnrollment(content) {
  const student = profileFor();
  const records = data.enrollments.filter((item) => item.studentRecordId === student.id);
  const enrollmentStatus = records.some((item) => item.status === "Enrolled")
    ? "Enrolled"
    : records.some((item) => item.status === "Pending")
      ? "Pending"
      : "Not Enrolled";
  content.innerHTML = `${heading("My Enrollment", "View the enrollment details saved for your student profile.")}
    <div class="summary-grid student-summary">
      ${summaryCard("Enrollment Status", enrollmentStatus, "Based on your records")}
      ${summaryCard("Enrolled Subjects", records.filter((item) => item.status === "Enrolled").length, "Currently enrolled")}
      ${summaryCard("Pending Review", records.filter((item) => item.status === "Pending").length, "Awaiting review")}
      ${summaryCard("Total Records", records.length, "Your enrollment history")}
    </div>
    <section class="content-panel"><div class="panel-heading"><div><h2>My subjects</h2><p>Only enrollment records connected to your own profile are shown.</p></div></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Course / Subject</th><th>Semester</th><th>Status</th></tr></thead><tbody>${records.length ? records.map((item) => `<tr><td>${escapeHTML(item.course)}</td><td>${escapeHTML(item.semester)}</td><td><span class="status ${escapeHTML(item.status.toLowerCase().replaceAll(" ", "-"))}">${escapeHTML(item.status)}</span></td></tr>`).join("") : `<tr><td class="empty-cell" colspan="3">No enrollment records are available yet. Please check back later.</td></tr>`}</tbody></table></div>
    </section>`;
}
function renderMySchedule(content) {
  const student = profileFor();
  const records = data.schedules.filter((item) => item.studentRecordId === student.id || (student.studentId && item.studentId === student.studentId));
  content.innerHTML = `${heading("My Schedule", "View class schedules connected to your student profile.")}
    <section class="content-panel"><div class="panel-heading"><div><h2>Class schedule</h2><p>Your schedule information appears here when it is available.</p></div></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Course / Subject</th><th>Semester</th><th>Day</th><th>Time</th><th>Room</th></tr></thead><tbody>${records.length ? records.map((item) => `<tr><td>${escapeHTML(item.course)}</td><td>${escapeHTML(item.semester)}</td><td>${escapeHTML(item.day || "Not set")}</td><td>${escapeHTML(item.time || "Not set")}</td><td>${escapeHTML(item.room || "Not set")}</td></tr>`).join("") : `<tr><td class="empty-cell" colspan="5">No schedule is available yet. Please check back later.</td></tr>`}</tbody></table></div></section>`;
}
function renderAdminStudents(content) {
  content.innerHTML = `${heading("Students", "Search, sort, and manage student profiles.", `<button class="primary-button add-button" type="button" data-action="add-student">Add Student</button>`)}
    <section class="content-panel"><div class="table-toolbar"><input id="student-search" type="search" placeholder="Search name, ID, email, course" aria-label="Search all students"><span class="toolbar-count" id="student-count"></span></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th><button type="button" data-sort="studentId">Student ID ↕</button></th><th><button type="button" data-sort="name">Name ↕</button></th><th>Email</th><th>Course</th><th>Year</th><th>Status</th><th>Actions</th></tr></thead><tbody id="student-table-body"></tbody></table></div></section>`;
  drawStudentRows();
  $("#student-search").addEventListener("input", drawStudentRows);
}
function drawStudentRows() {
  const body = $("#student-table-body");
  if (!body) return;
  const term = $("#student-search").value.trim().toLowerCase();
  const records = data.students.filter((item) => [item.studentId,item.name,item.email,item.course,item.yearLevel,item.status].some((value) => String(value || "").toLowerCase().includes(term)));
  records.sort((a,b) => String(a[studentSort.key] || "").localeCompare(String(b[studentSort.key] || "")) * studentSort.direction);
  $("#student-count").textContent = `${records.length} ${records.length === 1 ? "student" : "students"}`;
  body.innerHTML = records.length ? records.map((student) => `<tr><td>${escapeHTML(student.studentId || "Not assigned")}</td><td>${escapeHTML(student.name)}</td><td>${escapeHTML(student.email)}</td><td>${escapeHTML(student.course || "Not added")}</td><td>${escapeHTML(student.yearLevel || "—")}</td><td><span class="status ${escapeHTML(student.status.toLowerCase())}">${escapeHTML(student.status)}</span></td><td><div class="row-actions"><button class="small-button" type="button" data-action="edit-student" data-id="${escapeHTML(student.id)}">Edit</button><button class="small-button danger" type="button" data-action="delete-student" data-id="${escapeHTML(student.id)}">Delete</button></div></td></tr>`).join("") : `<tr><td class="empty-cell" colspan="7">${term ? "No students match your search." : "No student records yet."}</td></tr>`;
}
$("#page-content").addEventListener("click", (event) => {
  if (event.target.closest("[data-sort]")) {
    const key = event.target.closest("[data-sort]").dataset.sort;
    studentSort = { key, direction: studentSort.key === key ? -studentSort.direction : 1 };
    drawStudentRows();
    return;
  }
  const workspace = event.target.closest("[data-workspace-page]");
  if (workspace) { renderWorkspace(workspace.dataset.workspacePage); return; }
  const action = event.target.closest("[data-action]");
  if (!action) return;
  if (action.dataset.action === "edit-profile") openProfileDialog();
  if (action.dataset.action === "add-student") openStudentDialog();
  if (action.dataset.action === "edit-student") {
    const student = data.students.find((item) => item.id === action.dataset.id);
    if (student) openStudentDialog(student);
  }
  if (action.dataset.action === "delete-student") deleteStudent(action.dataset.id);
  if (action.dataset.action === "add-enrollment") openEnrollmentDialog();
  if (action.dataset.action === "edit-enrollment") {
    const record = data.enrollments.find((item) => item.id === action.dataset.id);
    if (record) openEnrollmentDialog(record);
  }
  if (action.dataset.action === "delete-enrollment") deleteEnrollment(action.dataset.id);
  if (action.dataset.action === "delete-account") deleteAccount(action.dataset.id);
});
function renderAdminEnrollments(content) {
  content.innerHTML = `${heading("Enrollments", "Review and update student course enrollment.", `<button class="primary-button add-button" type="button" data-action="add-enrollment">Add Enrollment</button>`)}
    <section class="content-panel"><div class="table-toolbar"><input id="enrollment-search" type="search" placeholder="Search student, subject, semester" aria-label="Search enrollment records"></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Student ID</th><th>Student</th><th>Course / Subject</th><th>Semester</th><th>Status</th><th>Actions</th></tr></thead><tbody id="enrollment-table-body"></tbody></table></div></section>`;
  drawEnrollmentRows();
  $("#enrollment-search").addEventListener("input", drawEnrollmentRows);
}
function drawEnrollmentRows() {
  const body = $("#enrollment-table-body");
  if (!body) return;
  const term = $("#enrollment-search").value.trim().toLowerCase();
  const records = data.enrollments.filter((item) => {
    const student = data.students.find((entry) => entry.id === item.studentRecordId);
    return [student?.studentId,student?.name,item.course,item.semester,item.status].some((value) => String(value || "").toLowerCase().includes(term));
  });
  body.innerHTML = records.length ? records.map((item) => {
    const student = data.students.find((entry) => entry.id === item.studentRecordId);
    return `<tr><td>${escapeHTML(student?.studentId || "Not assigned")}</td><td>${escapeHTML(student?.name || "Student record missing")}</td><td>${escapeHTML(item.course)}</td><td>${escapeHTML(item.semester)}</td><td><span class="status ${escapeHTML(item.status.toLowerCase().replaceAll(" ", "-"))}">${escapeHTML(item.status)}</span></td><td><div class="row-actions"><button class="small-button" type="button" data-action="edit-enrollment" data-id="${escapeHTML(item.id)}">Edit</button><button class="small-button danger" type="button" data-action="delete-enrollment" data-id="${escapeHTML(item.id)}">Remove</button></div></td></tr>`;
  }).join("") : `<tr><td class="empty-cell" colspan="6">No enrollment records yet.</td></tr>`;
}
function renderAdminAccounts(content) {
  content.innerHTML = `${heading("User Accounts", "Review accounts and see when each user last signed in.")}
    <section class="content-panel"><div class="table-toolbar"><input id="account-search" type="search" placeholder="Search name, email, or role" aria-label="Search user accounts"><span class="toolbar-count">${data.accounts.length} accounts</span></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Date Created</th><th>Last Login</th><th>Actions</th></tr></thead><tbody id="account-table-body"></tbody></table></div></section>`;
  drawAccountRows();
  $("#account-search").addEventListener("input", drawAccountRows);
}
function drawAccountRows() {
  const body = $("#account-table-body");
  if (!body) return;
  const term = $("#account-search").value.trim().toLowerCase();
  const accounts = data.accounts.filter((account) => [account.displayName,account.email,account.role].some((value) => String(value || "").toLowerCase().includes(term)));
  body.innerHTML = accounts.length ? accounts.map((account) => `<tr><td>${escapeHTML(account.displayName)}</td><td>${escapeHTML(account.email)}</td><td><span class="status ${account.role === "admin" ? "approved" : "active"}">${account.role === "admin" ? "Administrator" : "Student"}</span></td><td>${escapeHTML(formatDate(account.createdAt))}</td><td>${escapeHTML(formatDate(account.lastLogin, true))}</td><td>${account.id === currentUser.id ? `<span class="account-you">Current account</span>` : `<button class="small-button danger" type="button" data-action="delete-account" data-id="${escapeHTML(account.id)}">Remove</button>`}</td></tr>`).join("") : `<tr><td class="empty-cell" colspan="6">No accounts match your search.</td></tr>`;
}
function openStudentDialog(student = null) {
  const form = $("#student-form");
  form.reset();
  $("#student-form-message").hidden = true;
  form.elements.recordId.value = student?.id || "";
  for (const key of ["name","studentId","email","yearLevel","status"]) form.elements[key].value = student?.[key] || (key === "status" ? "Active" : "");
  setCourseSelection(form.elements.course, student?.course);
  $("#student-dialog-title").textContent = student ? "Edit student details" : "Add student";
  $("#save-student-button").textContent = student ? "Save Changes" : "Save Student";
  $("#student-dialog-backdrop").hidden = false;
  requestAnimationFrame(() => form.elements.name.focus());
}
function openProfileDialog() {
  const student = profileFor();
  const form = $("#profile-form");
  form.reset();
  $("#profile-form-message").hidden = true;
  for (const key of ["name","email","studentId","yearLevel"]) form.elements[key].value = student[key] || "";
  setCourseSelection(form.elements.course, student.course);
  $("#profile-dialog-backdrop").hidden = false;
  requestAnimationFrame(() => form.elements.name.focus());
}
function setCourseSelection(select, course) {
  if (course && !Array.from(select.options).some((option) => option.value === course)) {
    const option = document.createElement("option");
    option.value = course;
    option.textContent = `${course} (existing)`;
    select.add(option);
  }
  select.value = course || "";
}
function openEnrollmentDialog(record = null) {
  if (!data.students.length) return showToast("Add a student record before creating an enrollment.", true);
  const form = $("#enrollment-form");
  form.reset();
  $("#enrollment-form-message").hidden = true;
  form.elements.recordId.value = record?.id || "";
  $("#enrollment-student").innerHTML = data.students.map((student) => `<option value="${escapeHTML(student.id)}">${escapeHTML(student.studentId || "No ID")} — ${escapeHTML(student.name)}</option>`).join("");
  if (record) {
    $("#enrollment-student").value = record.studentRecordId;
    form.elements.course.value = record.course;
    form.elements.semester.value = record.semester;
    form.elements.status.value = record.status;
  }
  $("#enrollment-dialog-title").textContent = record ? "Update enrollment" : "Add enrollment";
  $("#enrollment-dialog-backdrop").hidden = false;
  requestAnimationFrame(() => $("#enrollment-student").focus());
}
function closeDialog(kind) { $(`#${kind}-dialog-backdrop`).hidden = true; }
function deleteStudent(id) {
  if (!currentUser || currentUser.role !== "admin") return;
  const student = data.students.find((item) => item.id === id);
  if (!student || !confirm(`Are you sure? Delete the student record for ${student.name}? Related enrollments will also be removed.`)) return;
  data.students = data.students.filter((item) => item.id !== id);
  data.enrollments = data.enrollments.filter((item) => item.studentRecordId !== id);
  data.schedules = data.schedules.filter((item) => item.studentRecordId !== id && item.studentId !== student.studentId);
  addActivity(`Administrator deleted student ${student.name}`);
  if (saveData()) { renderWorkspace("admin-students"); showToast("Student removed successfully."); }
}
function deleteEnrollment(id) {
  if (!currentUser || currentUser.role !== "admin") return;
  const item = data.enrollments.find((record) => record.id === id);
  if (!item || !confirm("Are you sure? Remove this enrollment record?")) return;
  data.enrollments = data.enrollments.filter((record) => record.id !== id);
  addActivity("Administrator removed an enrollment record");
  if (saveData()) { renderWorkspace("admin-enrollments"); showToast("Enrollment removed successfully."); }
}
function deleteAccount(id) {
  if (!currentUser || currentUser.role !== "admin") return;
  const account = data.accounts.find((item) => item.id === id);
  if (!account || account.id === currentUser.id || !confirm(`Are you sure? Remove the account for ${account.displayName}?`)) return;
  data.accounts = data.accounts.filter((item) => item.id !== id);
  if (account.role === "student") {
    const profile = data.students.find((item) => item.ownerId === account.id);
    if (profile) {
      data.students = data.students.filter((item) => item.id !== profile.id);
      data.enrollments = data.enrollments.filter((item) => item.studentRecordId !== profile.id);
      data.schedules = data.schedules.filter((item) => item.studentRecordId !== profile.id);
    }
  }
  addActivity(`Administrator removed the account for ${account.displayName}`);
  if (saveData()) { renderWorkspace("admin-accounts"); showToast("Account removed successfully."); }
}
$("#student-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (currentUser?.role !== "admin") return;
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const id = form.elements.recordId.value;
  const old = data.students.find((student) => student.id === id);
  const studentId = form.elements.studentId.value.trim() || old?.studentId || createStudentNumber();
  const email = form.elements.email.value.trim().toLowerCase();
  const duplicateId = data.students.some((student) => student.studentId.toLowerCase() === studentId.toLowerCase() && student.id !== id);
  if (duplicateId) return showMessage("student-form-message", "This student ID is already in use.");
  const duplicateStudentEmail = data.students.some((student) => student.email.toLowerCase() === email && student.id !== id);
  if (duplicateStudentEmail) return showMessage("student-form-message", "This email is already used by another student.");
  const duplicateEmail = data.accounts.some((account) => account.email.toLowerCase() === email && account.id !== data.students.find((student) => student.id === id)?.ownerId);
  if (duplicateEmail) return showMessage("student-form-message", "This email belongs to another account.");
  const student = {
    id: id || makeId(), studentId, email,
    name: form.elements.name.value.trim().replace(/\s+/g, " "), course: form.elements.course.value.trim(),
    yearLevel: form.elements.yearLevel.value, status: form.elements.status.value, ownerId: old?.ownerId || ""
  };
  if (old) Object.assign(old, student); else data.students.push(student);
  const linked = data.accounts.find((account) => account.id === student.ownerId);
  if (linked) { linked.displayName = student.name; linked.email = student.email; }
  data.enrollments.filter((item) => item.studentRecordId === student.id).forEach((item) => { item.studentName = student.name; });
  addActivity(`${old ? "Updated" : "Added"} student ${student.name}`);
  if (saveData()) { closeDialog("student"); renderWorkspace("admin-students"); showToast(old ? "Student updated successfully." : "Student added successfully."); }
});
$("#profile-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (currentUser?.role !== "student") return;
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const email = form.elements.email.value.trim().toLowerCase();
  if (data.accounts.some((account) => account.id !== currentUser.id && account.email.toLowerCase() === email)) return showMessage("profile-form-message", "This email is already used by another account.");
  const student = profileFor();
  if (data.students.some((item) => item.id !== student.id && item.email.toLowerCase() === email)) return showMessage("profile-form-message", "This email is already used by another student.");
  student.name = form.elements.name.value.trim().replace(/\s+/g, " ");
  student.email = email;
  student.course = form.elements.course.value.trim();
  student.yearLevel = form.elements.yearLevel.value;
  currentUser.displayName = student.name;
  currentUser.email = email;
  addActivity(`${student.name} updated their student information`);
  if (saveData()) { closeDialog("profile"); renderWorkspace("my-information"); showToast("Your information was updated."); }
});
$("#enrollment-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (currentUser?.role !== "admin") return;
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const student = data.students.find((item) => item.id === form.elements.studentRecordId.value);
  if (!student) return showMessage("enrollment-form-message", "Choose a student from the list.");
  const id = form.elements.recordId.value;
  const course = form.elements.course.value.trim();
  const semester = form.elements.semester.value.trim();
  const duplicate = data.enrollments.some((record) => record.id !== id && record.studentRecordId === student.id && record.course.toLowerCase() === course.toLowerCase() && record.semester.toLowerCase() === semester.toLowerCase());
  if (duplicate) return showMessage("enrollment-form-message", "This student already has a record for that course and semester.");
  const old = data.enrollments.find((record) => record.id === id);
  const record = { id: id || makeId(), studentRecordId: student.id, course, semester, status: form.elements.status.value, createdAt: old?.createdAt || new Date().toISOString() };
  if (old) Object.assign(old, record); else data.enrollments.push(record);
  addActivity(`${old ? "Updated" : "Added"} enrollment for ${student.name}`);
  if (saveData()) { closeDialog("enrollment"); renderWorkspace("admin-enrollments"); showToast(old ? "Enrollment updated successfully." : "Enrollment added successfully."); }
});
document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => closeDialog(button.dataset.closeDialog)));
["student","profile","enrollment"].forEach((kind) => $(`#${kind}-dialog-backdrop`).addEventListener("click", (event) => { if (event.target === event.currentTarget) closeDialog(kind); }));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    ["student","profile","enrollment"].forEach(closeDialog);
    $("#sidebar").classList.remove("open");
    $("#mobile-nav-toggle").setAttribute("aria-expanded", "false");
  }
});
async function startApp() {
  $("#login-button").disabled = true;
  $("#signup-button").disabled = true;
  try {
    await initializeData();
    const sessionId = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    const account = data.accounts.find((item) => item.id === sessionId);
    if (account && ["admin","student"].includes(account.role)) {
      currentUser = account;
      renderWorkspace(account.role === "admin" ? "admin-dashboard" : "my-information");
    } else {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      showAuthScreen();
    }
    if (!crypto.subtle) {
      $("#storage-warning").hidden = false;
      $("#storage-warning").textContent = "Password protection is not available here. Open this site through localhost or a secure website address.";
      $("#login-button").disabled = true;
      $("#signup-button").disabled = true;
    } else {
      $("#login-button").disabled = false;
      $("#signup-button").disabled = false;
    }
  } catch (error) {
    console.error("Student portal could not start.", error);
    showAuthScreen();
    $("#storage-warning").hidden = false;
    $("#storage-warning").textContent = "The portal could not load browser data. Clear this demo’s browser storage and try again.";
    $("#login-button").disabled = true;
    $("#signup-button").disabled = true;
  }
}
startApp();
