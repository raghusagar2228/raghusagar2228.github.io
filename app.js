/* ==========================================================================
   DSCE SMART CAMPUS SYSTEM - APPLICATION LOGIC ENGINE
   Dayananda Sagar College of Engineering - Lab 1 to Lab 8 Web Integration
   ========================================================================== */

// ─────────────────────────────────────────────────────────────
// GLOBAL DATA STATE STORES (Real-time Synced Memory)
// ─────────────────────────────────────────────────────────────
let studentRegistry   = [];          // registered students
let enrollmentData    = {};          // course enrollments per student
let studentRecords    = [];          // list-of-dict records + ages/grades
let feeData           = {};          // fee details per student
let rawIds            = [105, 102, 110, 108, 101, 115]; // raw student IDs for sorting
let fileContent       = "";          // virtual content of student_records.txt
let directoryStructure = {};         // virtual folder structure
let activeSortRunning = false;       // sort mutex
let subjectAveragesChart = null;     // Chart.js instances
let studentPerformanceChart = null;

// Available catalog courses
const COURSE_CATALOG = [
    { id: "math", name: "Mathematics", credits: 4 },
    { id: "physics", name: "Physics", credits: 3 },
    { id: "chemistry", name: "Chemistry", credits: 3 },
    { id: "python", name: "Python Lab", credits: 2 },
    { id: "graphics", name: "Engineering Graphics", credits: 4 },
    { id: "communication", name: "Professional Communication", credits: 2 }
];

// Default initial profiles as per Lab scripts
const INITIAL_STUDENTS = [
    { name: "Priya", score: 88, age: 20, grades: [85, 90, 78], math: 88, science: 82, english: 90 },
    { name: "Rahul", score: 72, age: 21, grades: [72, 88, 91], math: 72, science: 79, english: 85 },
    { name: "Anita", score: 95, age: 19, grades: [95, 89, 92], math: 95, science: 91, english: 88 },
    { name: "Kiran", score: 55, age: 20, grades: [55, 60, 50], math: 55, science: 60, english: 52 },
    { name: "Sneha", score: 38, age: 22, grades: [35, 42, 38], math: 38, science: 45, english: 41 }
];

// Event participation lists (Sets)
let eventA = new Set(["Priya", "Rahul", "Anita", "Kiran"]);
let eventB = new Set(["Rahul", "Anita", "Sneha"]);

// ─────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function evaluateGrade(score) {
    if (score >= 90 && score <= 100) {
        return { grade: "A", remark: "Excellent" };
    } else if (score >= 75) {
        return { grade: "B", remark: "Very Good" };
    } else if (score >= 60) {
        return { grade: "C", remark: "Good" };
    } else if (score >= 40) {
        return { grade: "D", remark: "Average" };
    } else {
        return { grade: "F", remark: "Needs Improvement" };
    }
}

function formatCurrency(num) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
}

function logActivity(moduleName, message, type = "info") {
    const logBox = document.getElementById("terminal-activity-log");
    if (!logBox) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const line = document.createElement("div");
    line.className = `log-line ${type}-line`;
    line.textContent = `[${timestamp}] [${moduleName.toUpperCase()}] ${message}`;
    
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
}

// ─────────────────────────────────────────────────────────────
// STATE CONTROLLER & CORE INITS
// ─────────────────────────────────────────────────────────────
function initApp() {
    setupEventListeners();
    resetToDefaultState();
}

function resetToDefaultState() {
    studentRegistry = [];
    enrollmentData = {};
    studentRecords = [];
    feeData = {};
    rawIds = [105, 102, 110, 108, 101, 115];
    fileContent = "";
    
    // 1. Module 1 Initialization
    INITIAL_STUDENTS.forEach((s, index) => {
        const id = 101 + index;
        const evalRes = evaluateGrade(s.score);
        studentRegistry.push({
            id: id,
            name: s.name,
            score: s.score,
            grade: evalRes.grade,
            remark: evalRes.remark,
            age: s.age,
            grades: s.grades,
            math: s.math,
            science: s.science,
            english: s.english
        });
    });

    // 2. Module 2 Initialization
    enrollmentData = {
        "Priya": [["Mathematics", 4], ["Physics", 3], ["Python Lab", 2]],
        "Rahul": [["Mathematics", 4], ["Chemistry", 3]],
        "Anita": [["Mathematics", 4], ["Physics", 3], ["Chemistry", 3], ["Python Lab", 2]],
        "Kiran": [["Mathematics", 4]],
        "Sneha": [["Physics", 3], ["Chemistry", 3], ["Python Lab", 2]]
    };

    // 3. Module 5 Initialization
    studentRegistry.forEach(s => {
        // default: Priya has hostel and transport, Rahul has hostel, Anita has transport, Kiran has none, Sneha has hostel and transport
        let tuition = 50000;
        let hostel = 0;
        let transport = 0;
        
        if (s.name === "Priya" || s.name === "Sneha") {
            hostel = 30000;
            transport = 10000;
        } else if (s.name === "Rahul") {
            hostel = 30000;
        } else if (s.name === "Anita") {
            transport = 10000;
        }
        feeData[s.name] = tuition + hostel + transport;
    });

    // 4. Set Events Re-initialization
    eventA = new Set(["Priya", "Rahul", "Anita", "Kiran"]);
    eventB = new Set(["Rahul", "Anita", "Sneha"]);

    // 5. Directory tree VFS setup
    directoryStructure = {
        name: "StudentProjects",
        isDir: true,
        children: [
            {
                name: "Priya",
                isDir: true,
                children: [
                    { name: "report.docx", isDir: false },
                    { name: "code.py", isDir: false }
                ]
            },
            {
                name: "Rahul",
                isDir: true,
                children: [
                    { name: "project.py", isDir: false }
                ]
            },
            {
                name: "Anita",
                isDir: true,
                children: [
                    { name: "analysis.ipynb", isDir: false },
                    { name: "data.csv", isDir: false }
                ]
            },
            {
                name: "EmptyFolder",
                isDir: true,
                children: []
            }
        ]
    };

    logActivity("system", "Global state reset to textbook Python project inputs.", "system");
    syncAllUIComponents();
}

function syncAllUIComponents() {
    updateTopHUD();
    renderRegistryTable();
    updateModuleSelectors();
    renderClassRoster();
    renderStudentRecords();
    renderEventSets();
    renderSortingBars();
    renderFeeInvoice();
    renderDirectoryTree();
    updateVirtualFileView();
    updateAnalyticsModule();
}

function updateTopHUD() {
    document.getElementById("hud-student-count").textContent = studentRegistry.length;
    document.getElementById("dash-student-count").textContent = studentRegistry.length;
    
    let totalEnrolled = 0;
    Object.values(enrollmentData).forEach(arr => totalEnrolled += arr.length);
    document.getElementById("hud-course-count").textContent = totalEnrolled;
    document.getElementById("dash-enroll-count").textContent = totalEnrolled;

    document.getElementById("hud-file-status").textContent = fileContent ? "SAVED" : "EMPTY";
    
    let totalFee = Object.values(feeData).reduce((sum, v) => sum + v, 0);
    document.getElementById("dash-fee-total").textContent = formatCurrency(totalFee);
    
    let totalScoreSum = studentRegistry.reduce((sum, s) => sum + s.score, 0);
    let avgScore = studentRegistry.length ? (totalScoreSum / studentRegistry.length) : 0;
    document.getElementById("dash-perf-avg").textContent = `${avgScore.toFixed(1)}%`;
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR NAVIGATION SWITCHER
// ─────────────────────────────────────────────────────────────
function switchTab(tabId) {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
        if (item.getAttribute("data-tab") === tabId) {
            item.classList.add("active");
        }
    });

    document.querySelectorAll(".tab-panel").forEach(panel => {
        panel.classList.remove("active");
    });
    const activePanel = document.getElementById(tabId);
    if (activePanel) {
        activePanel.classList.add("active");
    }
}

function setupEventListeners() {
    // Navigation binding
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            switchTab(item.getAttribute("data-tab"));
        });
    });

    // Reset button
    document.getElementById("btn-reset-global").addEventListener("click", () => {
        resetToDefaultState();
    });

    // Activity Log clearer
    document.getElementById("btn-clear-logs").addEventListener("click", () => {
        document.getElementById("terminal-activity-log").innerHTML = "";
    });

    // MODULE 1: Registration form
    const formReg = document.getElementById("form-register");
    const regName = document.getElementById("reg-name");
    const regScore = document.getElementById("reg-score");
    const previewGrade = document.getElementById("preview-grade");
    const previewRemark = document.getElementById("preview-remark");
    const previewRange = document.getElementById("preview-range");

    function handleLiveGradeEval() {
        const score = parseFloat(regScore.value);
        if (isNaN(score) || score < 0 || score > 100) {
            previewGrade.textContent = "-";
            previewRemark.textContent = "Pending Input...";
            previewRange.textContent = "Enter score between 0 and 100.";
            previewGrade.className = "preview-grade-badge";
            return;
        }
        const res = evaluateGrade(score);
        previewGrade.textContent = res.grade;
        previewRemark.textContent = res.remark;
        previewRange.textContent = `Score of ${score} evaluates successfully.`;
        
        previewGrade.className = `preview-grade-badge badge-${res.grade.toLowerCase()}`;
    }
    regScore.addEventListener("input", handleLiveGradeEval);
    regScore.addEventListener("change", handleLiveGradeEval);

    formReg.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = regName.value.trim();
        const score = parseFloat(regScore.value);

        if (!name) return;
        if (studentRegistry.some(s => s.name.toLowerCase() === name.toLowerCase())) {
            alert("Error: Student already registered!");
            return;
        }

        const id = 101 + studentRegistry.length;
        const evalRes = evaluateGrade(score);

        // Generate synthetic scores for analytics
        const math = Math.round(score * (0.9 + Math.random() * 0.15));
        const science = Math.round(score * (0.85 + Math.random() * 0.2));
        const english = Math.round(score * (0.92 + Math.random() * 0.1));

        const newStudent = {
            id: id,
            name: name,
            score: score,
            grade: evalRes.grade,
            remark: evalRes.remark,
            age: Math.floor(18 + Math.random() * 5),
            grades: [Math.round(score * 0.95), Math.round(score), Math.round(score * 1.02)].map(g => Math.min(100, g)),
            math: Math.min(100, math),
            science: Math.min(100, science),
            english: Math.min(100, english)
        };

        studentRegistry.push(newStudent);
        enrollmentData[name] = [["Mathematics", 4]]; // default single class enrollment
        feeData[name] = 50000; // default basic fee

        // Auto add to sorting IDs list
        rawIds.push(id);

        logActivity("module 1", `Successfully registered student ${name} (ID: ${id}) with score ${score}.`, "success");
        
        // Reset form
        formReg.reset();
        handleLiveGradeEval();

        // Sync
        syncAllUIComponents();
    });

    // MODULE 2: Student Enrollment selector
    document.getElementById("enroll-student-select").addEventListener("change", (e) => {
        renderStudentEnrollmentChecklist(e.target.value);
    });

    // MODULE 3: Venn Set operations selector
    document.querySelectorAll(".set-operation-selectors button").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".set-operation-selectors button").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            triggerVennHighlight(e.target.getAttribute("data-op"));
        });
    });

    // MODULE 4: Shuffler & Sort triggers
    document.getElementById("btn-shuffle-ids").addEventListener("click", () => {
        if (activeSortRunning) return;
        // Shuffle rawIds
        for (let i = rawIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rawIds[i], rawIds[j]] = [rawIds[j], rawIds[i]];
        }
        logActivity("module 4", `ID sequence shuffled: ${JSON.stringify(rawIds)}`);
        renderSortingBars();
    });

    const speedSlider = document.getElementById("sort-speed");
    speedSlider.addEventListener("input", (e) => {
        document.getElementById("speed-value").textContent = `${e.target.value} ms`;
    });

    document.getElementById("btn-bubble-sort").addEventListener("click", async () => {
        if (activeSortRunning) return;
        activeSortRunning = true;
        disableSortButtons(true);
        await runBubbleSortVisualizer();
        activeSortRunning = false;
        disableSortButtons(false);
    });

    document.getElementById("btn-selection-sort").addEventListener("click", async () => {
        if (activeSortRunning) return;
        activeSortRunning = true;
        disableSortButtons(true);
        await runSelectionSortVisualizer();
        activeSortRunning = false;
        disableSortButtons(false);
    });

    // Searches
    document.getElementById("btn-linear-search").addEventListener("click", () => {
        const target = parseInt(document.getElementById("search-target").value);
        if (isNaN(target)) return;
        runLinearSearchDemo(target);
    });

    document.getElementById("btn-binary-search").addEventListener("click", () => {
        const target = parseInt(document.getElementById("search-target").value);
        if (isNaN(target)) return;
        runBinarySearchDemo(target);
    });

    // MODULE 5: Fee adjustment sliders
    const tSlider = document.getElementById("fee-tuition");
    const tuitionVal = document.getElementById("val-tuition");
    tSlider.addEventListener("input", (e) => {
        tuitionVal.textContent = parseFloat(e.target.value).toLocaleString('en-IN');
        renderFeeInvoice();
    });

    document.getElementById("fee-student-select").addEventListener("change", () => {
        renderFeeInvoice();
    });
    document.getElementById("fee-has-hostel").addEventListener("change", () => {
        renderFeeInvoice();
    });
    document.getElementById("fee-has-transport").addEventListener("change", () => {
        renderFeeInvoice();
    });

    document.getElementById("btn-save-fee").addEventListener("click", () => {
        const student = document.getElementById("fee-student-select").value;
        const tuition = parseFloat(tSlider.value);
        const hostel = document.getElementById("fee-has-hostel").checked ? 30000 : 0;
        const transport = document.getElementById("fee-has-transport").checked ? 10000 : 0;
        const total = tuition + hostel + transport;
        
        feeData[student] = total;
        logActivity("module 5", `Updated fee configuration for ${student}. Total fee assessed: ${formatCurrency(total)}.`, "success");
        updateTopHUD();
    });

    // MODULE 6: File Actions
    document.getElementById("btn-file-write").addEventListener("click", () => {
        // Build virtual file lines
        let str = "ID,Name,Score,Grade,Remark\n";
        studentRegistry.forEach(s => {
            str += `${s.id},${s.name},${s.score},${s.grade},${s.remark}\n`;
        });
        fileContent = str;
        updateVirtualFileView();
        logActivity("module 6", "Successfully compiled registry state into file 'student_records.txt'.", "success");
        updateTopHUD();
        
        document.getElementById("file-terminal-log").textContent = `VFS Event: WRITE
Target: student_records.txt
Lines written: ${studentRegistry.length + 1}
Status: SUCCESS`;
    });

    document.getElementById("btn-file-read").addEventListener("click", () => {
        const logTerm = document.getElementById("file-terminal-log");
        if (!fileContent) {
            logTerm.textContent = `VFS Event: READ
Target: student_records.txt
Error: File is empty. Run 'Write Registry to File' first.`;
            logActivity("module 6", "VFS Read Error: File empty.", "error");
            return;
        }

        // Parse file lines
        const lines = fileContent.trim().split("\n");
        const header = lines[0];
        const dataLines = lines.slice(1);
        
        let total = 0;
        let scoreSum = 0;
        let topName = "None";
        let topScore = -1;

        dataLines.forEach(line => {
            const parts = line.split(",");
            if (parts.length < 5) return;
            const score = parseFloat(parts[2]);
            const name = parts[1];
            
            total++;
            scoreSum += score;
            if (score > topScore) {
                topScore = score;
                topName = name;
            }
        });

        document.getElementById("report-total-students").textContent = total;
        document.getElementById("report-avg-score").textContent = total ? (scoreSum / total).toFixed(2) : "0.0";
        document.getElementById("report-top-student").textContent = `${topName} (${topScore} marks)`;

        logTerm.textContent = `VFS Event: READ
Target: student_records.txt
Header: [${header}]
Parsed Records count: ${total}
Parsed Mean score: ${(scoreSum / total).toFixed(2)}
Parsed Top performer: ${topName} (${topScore} marks)`;

        logActivity("module 6", `Virtual file successfully parsed. Loaded average: ${(scoreSum / total).toFixed(2)} marks.`, "success");
    });

    // MODULE 7: Scan Directories
    document.getElementById("btn-reset-tree").addEventListener("click", () => {
        syncAllUIComponents();
    });

    document.getElementById("btn-scan-valid").addEventListener("click", () => {
        const logBox = document.getElementById("exception-terminal-log");
        document.getElementById("exception-display-box").style.display = "none";
        
        let logStr = "  Scanning: StudentProjects/\n\n";
        
        function scanNode(node, level = 0) {
            const indent = "    ".repeat(level);
            logStr += `  ${indent}${node.name}/\n`;
            if (node.isDir) {
                node.children.forEach(child => {
                    if (child.isDir) {
                        scanNode(child, level + 1);
                    } else {
                        const fileIndent = "    ".repeat(level + 1);
                        logStr += `  ${fileIndent}${child.name}\n`;
                    }
                });
            }
        }
        scanNode(directoryStructure);
        logBox.textContent = logStr;
        logActivity("module 7", "Completed normal directory scanning on StudentProjects/.", "success");
    });

    document.getElementById("btn-trigger-custom").addEventListener("click", () => {
        const logBox = document.getElementById("exception-terminal-log");
        const alertBox = document.getElementById("exception-display-box");
        
        logActivity("module 7", "Traversal encountered empty folder exception inside traversal loop.", "error");
        logBox.textContent = "Scanning: StudentProjects/\n  StudentProjects/\n    Priya/\n      report.docx\n      code.py\n    Rahul/\n      project.py\n    Anita/\n      analysis.ipynb\n      data.csv\n    EmptyFolder/\n\n[FATAL SYSTEM INTERRUPT]";

        alertBox.style.display = "flex";
        document.getElementById("exception-type-title").textContent = "Custom Error: MissingFileOrFolderError";
        document.getElementById("exception-message-desc").textContent = "Directory Scan failed! Empty folder encountered: 'StudentProjects/EmptyFolder'. Execution terminated.";
    });

    document.getElementById("btn-trigger-notfound").addEventListener("click", () => {
        const logBox = document.getElementById("exception-terminal-log");
        const alertBox = document.getElementById("exception-display-box");
        
        logActivity("module 7", "Invalid path traversal triggered exception: FileNotFoundError.", "error");
        logBox.textContent = "Scanning: NonExistentPath/xyz/\n\n[SYSTEM INTERRUPT]";

        alertBox.style.display = "flex";
        document.getElementById("exception-type-title").textContent = "Error: FileNotFoundError";
        document.getElementById("exception-message-desc").textContent = "Invalid directory path: 'NonExistentPath/xyz'. System cannot locate directory tree.";
    });
}

// ─────────────────────────────────────────────────────────────
// DATA RENDER PROCEDURES
// ─────────────────────────────────────────────────────────────
function renderRegistryTable() {
    const tbody = document.querySelector("#table-registry tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    studentRegistry.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${s.id}</td>
            <td><strong>${s.name}</strong></td>
            <td>${s.score.toFixed(1)}</td>
            <td><span class="badge badge-${s.grade.toLowerCase()}">${s.grade}</span></td>
            <td>${s.remark}</td>
            <td>
                <button class="btn-delete-student" onclick="deleteStudent(${s.id})" title="Delete student record">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteStudent(id) {
    const student = studentRegistry.find(s => s.id === id);
    if (!student) return;

    if (confirm(`Are you sure you want to delete ${student.name}'s registry files?`)) {
        studentRegistry = studentRegistry.filter(s => s.id !== id);
        delete enrollmentData[student.name];
        delete feeData[student.name];
        eventA.delete(student.name);
        eventB.delete(student.name);
        
        // Remove from sort list
        rawIds = rawIds.filter(i => i !== id);

        logActivity("module 1", `Removed student ${student.name} (ID: ${id}) from global memory scope.`, "error");
        syncAllUIComponents();
    }
}

function updateModuleSelectors() {
    const enrollSelect = document.getElementById("enroll-student-select");
    const feeSelect = document.getElementById("fee-student-select");
    if (!enrollSelect || !feeSelect) return;

    const previousEnrollVal = enrollSelect.value;
    const previousFeeVal = feeSelect.value;

    enrollSelect.innerHTML = "";
    feeSelect.innerHTML = "";

    studentRegistry.forEach(s => {
        const opt1 = document.createElement("option");
        opt1.value = s.name;
        opt1.textContent = `${s.name} (#${s.id})`;
        enrollSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = s.name;
        opt2.textContent = `${s.name} (#${s.id})`;
        feeSelect.appendChild(opt2);
    });

    if (studentRegistry.length) {
        enrollSelect.value = studentRegistry.some(s => s.name === previousEnrollVal) ? previousEnrollVal : studentRegistry[0].name;
        feeSelect.value = studentRegistry.some(s => s.name === previousFeeVal) ? previousFeeVal : studentRegistry[0].name;
    }

    renderStudentEnrollmentChecklist(enrollSelect.value);
}

function renderStudentEnrollmentChecklist(studentName) {
    const container = document.getElementById("course-checklist-container");
    if (!container || !studentName) {
        if (container) container.innerHTML = "<p class='helper-text'>Register a student in Module 1 first.</p>";
        return;
    }

    container.innerHTML = "";
    const activeCourses = enrollmentData[studentName] || [];
    
    COURSE_CATALOG.forEach(course => {
        const isChecked = activeCourses.some(c => c[0] === course.name);
        
        const row = document.createElement("div");
        row.className = `enrollment-checkbox-row ${isChecked ? 'checked' : ''}`;
        
        row.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" data-course-name="${course.name}" data-credits="${course.credits}" ${isChecked ? 'checked' : ''}>
                <span class="checkmark"></span>
                ${course.name}
            </label>
            <span class="credit-tag">${course.credits}cr</span>
        `;

        row.querySelector("input").addEventListener("change", (e) => {
            handleCourseToggle(studentName, e.target.getAttribute("data-course-name"), parseInt(e.target.getAttribute("data-credits")), e.target.checked);
        });

        container.appendChild(row);
    });

    updateCreditGauge(studentName);
}

function handleCourseToggle(studentName, courseName, credits, isEnrolled) {
    if (!enrollmentData[studentName]) {
        enrollmentData[studentName] = [];
    }

    const currentCount = enrollmentData[studentName].length;

    if (isEnrolled) {
        if (currentCount >= 5) {
            alert("DSCE Rule Violation: A student cannot enroll in more than 5 courses simultaneously!");
            renderStudentEnrollmentChecklist(studentName); // re-render to reset state
            return;
        }
        enrollmentData[studentName].push([courseName, credits]);
        logActivity("module 2", `Enrolled [${studentName}] in course '${courseName}' (${credits} Credits).`);
    } else {
        enrollmentData[studentName] = enrollmentData[studentName].filter(c => c[0] !== courseName);
        logActivity("module 2", `De-enrolled [${studentName}] from course '${courseName}'.`, "warning");
    }

    updateCreditGauge(studentName);
    renderClassRoster();
    updateTopHUD();
}

function updateCreditGauge(studentName) {
    const list = enrollmentData[studentName] || [];
    const count = list.length;
    
    document.getElementById("course-count-display").textContent = `${count} / 5`;
    const fill = document.getElementById("course-count-bar");
    fill.style.width = `${(count / 5) * 100}%`;

    const warning = document.getElementById("course-limit-warning");
    if (count >= 5) {
        warning.style.display = "block";
    } else {
        warning.style.display = "none";
    }
}

function renderClassRoster() {
    const container = document.getElementById("enrollment-cards-container");
    if (!container) return;
    container.innerHTML = "";

    if (studentRegistry.length === 0) {
        container.innerHTML = "<p class='helper-text'>No active students in database registry.</p>";
        return;
    }

    studentRegistry.forEach(s => {
        const card = document.createElement("div");
        card.className = "student-enrollment-card";
        
        const courses = enrollmentData[s.name] || [];
        
        let listItems = "";
        courses.forEach(c => {
            listItems += `<li><span>${c[0]}</span> <span class="credit">${c[1]} cr</span></li>`;
        });

        if (!courses.length) {
            listItems = "<li class='helper-text'>No enrolled classes</li>";
        }

        card.innerHTML = `
            <h4>${s.name} (#${s.id})</h4>
            <ul class="enrollment-courses-list">
                ${listItems}
            </ul>
        `;
        container.appendChild(card);
    });
}

function renderStudentRecords() {
    const container = document.getElementById("records-list-container");
    if (!container) return;
    container.innerHTML = "";

    if (!studentRegistry.length) {
        container.innerHTML = "<p class='helper-text'>No registered student record sheets found.</p>";
        return;
    }

    studentRegistry.forEach(s => {
        const card = document.createElement("div");
        card.className = "student-record-card";
        
        const avg = s.grades.reduce((sum, v) => sum + v, 0) / s.grades.length;

        card.innerHTML = `
            <div class="record-main">
                <h4>${s.name}</h4>
                <p>Age: ${s.age} | Internal Files: [${s.grades.join(', ')}]</p>
            </div>
            <div class="record-grades">AVG: ${avg.toFixed(1)}</div>
            <div class="record-avg-bubble badge-${s.grade.toLowerCase()}">${s.grade}</div>
        `;
        container.appendChild(card);
    });
}

function renderEventSets() {
    const aBox = document.getElementById("event-a-participants");
    const bBox = document.getElementById("event-b-participants");
    if (!aBox || !bBox) return;

    aBox.innerHTML = "";
    bBox.innerHTML = "";

    // Sync Event Sets with active registry names (remove names not in registry)
    const activeNames = new Set(studentRegistry.map(s => s.name));
    eventA.forEach(name => { if (!activeNames.has(name)) eventA.delete(name); });
    eventB.forEach(name => { if (!activeNames.has(name)) eventB.delete(name); });

    eventA.forEach(name => {
        aBox.innerHTML += `<span class="participant-chip">${name}</span>`;
    });
    if (!eventA.size) aBox.innerHTML = "<span class='helper-text'>Empty Set</span>";

    eventB.forEach(name => {
        bBox.innerHTML += `<span class="participant-chip">${name}</span>`;
    });
    if (!eventB.size) bBox.innerHTML = "<span class='helper-text'>Empty Set</span>";

    // Re-trigger active operations Venn display
    const activeOpBtn = document.querySelector(".set-operation-selectors button.active");
    if (activeOpBtn) {
        triggerVennHighlight(activeOpBtn.getAttribute("data-op"));
    }
}

function triggerVennHighlight(op) {
    const circleA = document.getElementById("venn-circle-a");
    const circleB = document.getElementById("venn-circle-b");
    const outputList = document.getElementById("venn-output-list");
    if (!circleA || !circleB || !outputList) return;

    circleA.classList.remove("active");
    circleB.classList.remove("active");
    
    let result = [];
    
    switch (op) {
        case "union":
            circleA.classList.add("active");
            circleB.classList.add("active");
            result = Array.from(new Set([...eventA, ...eventB]));
            outputList.textContent = `A ∪ B = { ${result.join(", ")} }`;
            break;
        case "intersect":
            circleA.classList.add("active");
            circleB.classList.add("active");
            result = Array.from(eventA).filter(n => eventB.has(n));
            outputList.textContent = result.length ? `A ∩ B = { ${result.join(", ")} }` : `A ∩ B = Ø (Disjoint)`;
            break;
        case "diff-a":
            circleA.classList.add("active");
            result = Array.from(eventA).filter(n => !eventB.has(n));
            outputList.textContent = result.length ? `A - B = { ${result.join(", ")} }` : `A - B = Ø`;
            break;
        case "diff-b":
            circleB.classList.add("active");
            result = Array.from(eventB).filter(n => !eventA.has(n));
            outputList.textContent = result.length ? `B - A = { ${result.join(", ")} }` : `B - A = Ø`;
            break;
    }
}

// ─────────────────────────────────────────────────────────────
// MODULE 4: INTERACTIVE ALGORITHMIC ENGINE
// ─────────────────────────────────────────────────────────────
function renderSortingBars() {
    const container = document.getElementById("sorting-bars-container");
    if (!container) return;
    container.innerHTML = "";

    // Sync rawIds to studentRegistry IDs to represent actual data
    if (!rawIds.length && studentRegistry.length) {
        rawIds = studentRegistry.map(s => s.id);
    }

    const maxVal = Math.max(...rawIds, 120);

    rawIds.forEach((id) => {
        const bar = document.createElement("div");
        bar.className = "sort-bar";
        bar.id = `bar-${id}`;
        
        // Percent-height calculator
        const heightPct = (id / maxVal) * 85;
        bar.style.height = `${heightPct}%`;
        bar.innerHTML = `<span>#${id}</span>`;
        
        container.appendChild(bar);
    });
}

function disableSortButtons(disable) {
    document.getElementById("btn-bubble-sort").disabled = disable;
    document.getElementById("btn-selection-sort").disabled = disable;
    document.getElementById("btn-shuffle-ids").disabled = disable;
    
    document.querySelectorAll(".nav-item").forEach(item => {
        if (disable) {
            item.style.pointerEvents = "none";
            item.style.opacity = "0.5";
        } else {
            item.style.pointerEvents = "auto";
            item.style.opacity = "1";
        }
    });
}

async function runBubbleSortVisualizer() {
    const arr = [...rawIds];
    const n = arr.length;
    const speed = parseInt(document.getElementById("sort-speed").value);
    
    logActivity("module 4", "Bubble Sort engine initialized. O(n²) complexity.", "info");

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            const barA = document.getElementById(`bar-${arr[j]}`);
            const barB = document.getElementById(`bar-${arr[j+1]}`);

            if (barA && barB) {
                barA.classList.add("comparing");
                barB.classList.add("comparing");
            }
            await sleep(speed);

            if (arr[j] > arr[j + 1]) {
                if (barA && barB) {
                    barA.classList.remove("comparing");
                    barA.classList.add("swapping");
                    barB.classList.remove("comparing");
                    barB.classList.add("swapping");
                }
                
                // Swap values in visual memory
                [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
                rawIds = [...arr];
                
                renderSortingBars();
                
                // Re-fetch glowing elements since DOM was recreated
                const newBarA = document.getElementById(`bar-${arr[j]}`);
                const newBarB = document.getElementById(`bar-${arr[j+1]}`);
                if (newBarA && newBarB) {
                    newBarA.classList.add("swapping");
                    newBarB.classList.add("swapping");
                }
                await sleep(speed);
            }

            // Clean colors
            const cleanA = document.getElementById(`bar-${arr[j]}`);
            const cleanB = document.getElementById(`bar-${arr[j+1]}`);
            if (cleanA && cleanB) {
                cleanA.className = "sort-bar";
                cleanB.className = "sort-bar";
            }
        }
        
        // Mark sorted
        const sortedBar = document.getElementById(`bar-${arr[n - i - 1]}`);
        if (sortedBar) {
            sortedBar.classList.add("sorted");
        }
    }
    
    // Final green sweep
    rawIds = [...arr];
    renderSortingBars();
    document.querySelectorAll(".sort-bar").forEach(bar => bar.classList.add("sorted"));
    
    logActivity("module 4", "Bubble Sort complete. Sorted sequence: " + JSON.stringify(arr), "success");
    updateTopHUD();
}

async function runSelectionSortVisualizer() {
    const arr = [...rawIds];
    const n = arr.length;
    const speed = parseInt(document.getElementById("sort-speed").value);
    
    logActivity("module 4", "Selection Sort engine initialized. O(n²) comparisons.", "info");

    for (let i = 0; i < n; i++) {
        let minIdx = i;
        
        for (let j = i + 1; j < n; j++) {
            const barCheck = document.getElementById(`bar-${arr[j]}`);
            const barMin = document.getElementById(`bar-${arr[minIdx]}`);
            
            if (barCheck) barCheck.classList.add("comparing");
            if (barMin) barMin.classList.add("comparing");
            
            await sleep(speed);

            if (arr[j] < arr[minIdx]) {
                if (barMin) barMin.classList.remove("comparing");
                minIdx = j;
            } else {
                if (barCheck) barCheck.classList.remove("comparing");
            }
        }

        if (minIdx !== i) {
            const barI = document.getElementById(`bar-${arr[i]}`);
            const barMin = document.getElementById(`bar-${arr[minIdx]}`);
            if (barI) barI.classList.add("swapping");
            if (barMin) barMin.classList.add("swapping");
            
            await sleep(speed);

            // Swap visual arrays
            [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
            rawIds = [...arr];
            renderSortingBars();
            await sleep(speed);
        }

        const sortedBar = document.getElementById(`bar-${arr[i]}`);
        if (sortedBar) sortedBar.classList.add("sorted");
    }

    rawIds = [...arr];
    renderSortingBars();
    document.querySelectorAll(".sort-bar").forEach(bar => bar.classList.add("sorted"));
    
    logActivity("module 4", "Selection Sort complete. Sorted sequence: " + JSON.stringify(arr), "success");
}

function runLinearSearchDemo(target) {
    const term = document.getElementById("search-terminal-log");
    term.textContent = `Starting Linear Search for ID: ${target}\n`;
    
    let steps = "";
    let foundIdx = -1;

    for (let i = 0; i < rawIds.length; i++) {
        steps += `Step ${i + 1}: Checking index ${i} (Value: ${rawIds[i]})...\n`;
        if (rawIds[i] === target) {
            foundIdx = i;
            steps += `👉 TARGET MATCH FOUND AT INDEX ${i}!\n`;
            break;
        }
    }

    if (foundIdx === -1) {
        steps += `❌ Linear search finished. ID ${target} NOT found in database registry.\n`;
        logActivity("module 4", `Linear Search failed. ID ${target} not found.`, "warning");
    } else {
        logActivity("module 4", `Linear Search target ${target} found at index ${foundIdx}.`, "success");
    }

    term.textContent = steps;
}

function runBinarySearchDemo(target) {
    const term = document.getElementById("search-terminal-log");
    let steps = `Starting Binary Search for ID: ${target}\n`;
    steps += `Prerequisite: Array must be fully sorted. Sorting array...\n`;
    
    // Sort array
    const sorted = [...rawIds].sort((a,b) => a-b);
    steps += `Sorted Array Context: ${JSON.stringify(sorted)}\n\n`;
    
    let low = 0;
    let high = sorted.length - 1;
    let foundIdx = -1;
    let iterations = 0;

    while (low <= high) {
        iterations++;
        const mid = Math.floor((low + high) / 2);
        steps += `Iteration ${iterations}: Bounds [${low} to ${high}], Mid index: ${mid} (Value: ${sorted[mid]})\n`;

        if (sorted[mid] === target) {
            foundIdx = mid;
            steps += `👉 MATCH FOUND AT INDEX ${mid}!\n`;
            break;
        } else if (sorted[mid] < target) {
            steps += `  - Mid-value ${sorted[mid]} < target ${target}. Shifting search boundary to RIGHT.\n`;
            low = mid + 1;
        } else {
            steps += `  - Mid-value ${sorted[mid]} > target ${target}. Shifting search boundary to LEFT.\n`;
            high = mid - 1;
        }
    }

    if (foundIdx === -1) {
        steps += `\n❌ Binary search finished. ID ${target} NOT found in sorted registry.\n`;
        logActivity("module 4", `Binary Search failed. ID ${target} not found.`, "warning");
    } else {
        logActivity("module 4", `Binary Search target ${target} found in index ${foundIdx} (steps: ${iterations}).`, "success");
    }

    term.textContent = steps;
}

// ─────────────────────────────────────────────────────────────
// MODULE 5: INVOICE GENERATOR & calculations
// ─────────────────────────────────────────────────────────────
function renderFeeInvoice() {
    const student = document.getElementById("fee-student-select").value;
    if (!student) return;

    const tuition = parseInt(document.getElementById("fee-tuition").value);
    const hasHostel = document.getElementById("fee-has-hostel").checked;
    const hasTransport = document.getElementById("fee-has-transport").checked;

    const hostel = hasHostel ? 30000 : 0;
    const transport = hasTransport ? 10000 : 0;
    const total = tuition + hostel + transport;

    document.getElementById("inv-student-name").textContent = student;
    document.getElementById("inv-tuition").textContent = formatCurrency(tuition);
    document.getElementById("inv-hostel").textContent = formatCurrency(hostel);
    document.getElementById("inv-transport").textContent = formatCurrency(transport);
    document.getElementById("inv-total").textContent = formatCurrency(total);
}

// ─────────────────────────────────────────────────────────────
// MODULE 6: FLAT FILE SIMULATION
// ─────────────────────────────────────────────────────────────
function updateVirtualFileView() {
    const view = document.getElementById("file-textarea");
    if (!view) return;

    if (!fileContent) {
        view.value = "// Virtual flat file database (student_records.txt) is empty.\n// Click 'Write Registry to File' on the dashboard workspace header to compile registry scope into string streams.";
    } else {
        view.value = fileContent;
    }
}

// ─────────────────────────────────────────────────────────────
// MODULE 7: DIRECTORY SCANNING GRAPHIC TREE VIEW
// ─────────────────────────────────────────────────────────────
function renderDirectoryTree() {
    const container = document.getElementById("tree-container");
    if (!container) return;
    container.innerHTML = "";

    function makeTreeNode(node) {
        const wrap = document.createElement("div");
        wrap.className = "tree-node";

        const row = document.createElement("div");
        row.className = "tree-row";
        
        const icon = document.createElement("span");
        icon.className = node.isDir ? "tree-icon" : "tree-icon file-icon";
        icon.innerHTML = node.isDir ? "📁" : "📄";

        const label = document.createElement("span");
        label.textContent = node.name;

        row.appendChild(icon);
        row.appendChild(label);
        wrap.appendChild(row);

        if (node.isDir && node.children.length) {
            const childrenContainer = document.createElement("div");
            childrenContainer.className = "tree-children";
            
            node.children.forEach(child => {
                childrenContainer.appendChild(makeTreeNode(child));
            });

            row.addEventListener("click", () => {
                const isCollapsed = childrenContainer.style.display === "none";
                childrenContainer.style.display = isCollapsed ? "block" : "none";
                icon.innerHTML = isCollapsed ? "📁" : "📂";
            });

            wrap.appendChild(childrenContainer);
        }

        return wrap;
    }

    container.appendChild(makeTreeNode(directoryStructure));
}

// ─────────────────────────────────────────────────────────────
// MODULE 8: NUMPY / PANDAS ANALYTICS SYSTEM
// ─────────────────────────────────────────────────────────────
function updateAnalyticsModule() {
    if (!studentRegistry.length) return;

    // Collect scores
    const mathScores = studentRegistry.map(s => s.math);
    const scienceScores = studentRegistry.map(s => s.science);
    const englishScores = studentRegistry.map(s => s.english);

    // Dynamic Math helpers (NumPy math formulas equivalents)
    function calcMean(arr) {
        return arr.reduce((sum, v) => sum + v, 0) / arr.length;
    }

    function calcMedian(arr) {
        const s = [...arr].sort((a,b)=>a-b);
        const mid = Math.floor(s.length / 2);
        return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
    }

    function calcStdDev(arr) {
        const mean = calcMean(arr);
        const diffs = arr.map(v => Math.pow(v - mean, 2));
        return Math.sqrt(calcMean(diffs));
    }

    function getTopScorer(subject) {
        let max = -1;
        let topName = "None";
        studentRegistry.forEach(s => {
            if (s[subject] > max) {
                max = s[subject];
                topName = s.name;
            }
        });
        return `${topName} (${max})`;
    }

    const mathMean = calcMean(mathScores);
    const mathMed = calcMedian(mathScores);
    const mathStd = calcStdDev(mathScores);

    const sciMean = calcMean(scienceScores);
    const sciMed = calcMedian(scienceScores);
    const sciStd = calcStdDev(scienceScores);

    const engMean = calcMean(englishScores);
    const engMed = calcMedian(englishScores);
    const engStd = calcStdDev(englishScores);

    document.getElementById("stat-avg-math").textContent = mathMean.toFixed(1);
    document.getElementById("stat-avg-science").textContent = sciMean.toFixed(1);
    document.getElementById("stat-avg-english").textContent = engMean.toFixed(1);

    // Subject top calculator
    let topSubject = "Math";
    let topVal = mathMean;
    if (sciMean > topVal) { topSubject = "Science"; topVal = sciMean; }
    if (engMean > topVal) { topSubject = "English"; }
    document.getElementById("stat-top-subject").textContent = topSubject;

    // Render Matrix Tbody
    const matrix = document.getElementById("stats-matrix-tbody");
    if (matrix) {
        matrix.innerHTML = `
            <tr>
                <td><strong>Math</strong></td>
                <td>${mathMean.toFixed(2)}</td>
                <td>${mathMed.toFixed(1)}</td>
                <td>${mathStd.toFixed(2)}</td>
                <td>${getTopScorer('math')}</td>
            </tr>
            <tr>
                <td><strong>Science</strong></td>
                <td>${sciMean.toFixed(2)}</td>
                <td>${sciMed.toFixed(1)}</td>
                <td>${sciStd.toFixed(2)}</td>
                <td>${getTopScorer('science')}</td>
            </tr>
            <tr>
                <td><strong>English</strong></td>
                <td>${engMean.toFixed(2)}</td>
                <td>${engMed.toFixed(1)}</td>
                <td>${engStd.toFixed(2)}</td>
                <td>${getTopScorer('english')}</td>
            </tr>
        `;
    }

    // Chart.js integrations (Matplotlib Equivalent)
    renderPandasCharts(
        [mathMean, sciMean, engMean],
        studentRegistry.map(s => s.name),
        mathScores,
        scienceScores,
        englishScores
    );
}

function renderPandasCharts(subjectMeans, studentNames, math, science, english) {
    // Chart 1: Subject Averages Bar Chart
    const ctx1 = document.getElementById("chart-subject-averages");
    if (!ctx1) return;

    if (subjectAveragesChart) {
        subjectAveragesChart.destroy();
    }

    subjectAveragesChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Mathematics', 'Science', 'English'],
            datasets: [{
                label: 'Mean Grade Score',
                data: subjectMeans,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.65)',
                    'rgba(16, 185, 129, 0.65)',
                    'rgba(245, 158, 11, 0.65)'
                ],
                borderColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b'
                ],
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // Chart 2: Grouped Comparison Chart
    const ctx2 = document.getElementById("chart-student-performance");
    if (!ctx2) return;

    if (studentPerformanceChart) {
        studentPerformanceChart.destroy();
    }

    studentPerformanceChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: studentNames,
            datasets: [
                {
                    label: 'Math',
                    data: math,
                    backgroundColor: 'rgba(59, 130, 246, 0.65)',
                    borderColor: '#3b82f6',
                    borderWidth: 1.5,
                    borderRadius: 4
                },
                {
                    label: 'Science',
                    data: science,
                    backgroundColor: 'rgba(16, 185, 129, 0.65)',
                    borderColor: '#10b981',
                    borderWidth: 1.5,
                    borderRadius: 4
                },
                {
                    label: 'English',
                    data: english,
                    backgroundColor: 'rgba(245, 158, 11, 0.65)',
                    borderColor: '#f59e0b',
                    borderWidth: 1.5,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    labels: { color: '#f8fafc', font: { family: 'var(--font-sans)', size: 10 } }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// Run initializer on complete parse load
window.addEventListener("DOMContentLoaded", () => {
    initApp();
});
