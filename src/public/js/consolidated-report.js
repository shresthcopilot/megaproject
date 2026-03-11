const API_BASE = "/api";

let allData = {};
let filteredData = {};
let activeFilters = {};

// Central configuration for all form types
const FORM_CONFIG = [
    { key: "vac", label: "VAC" },
    { key: "library", label: "Library" },
    { key: "econtent", label: "E-Content" },
    { key: "capacity", label: "Capacity" },
    { key: "teaching", label: "Teaching & Learning" },
    { key: "experiential", label: "Experiential" },
    { key: "learnerSupport", label: "Learner Support" },
    { key: "pc", label: "PC" }
];

// Cache DOM elements
const DOM = {
    loading: () => document.getElementById("loading"),
    content: () => document.getElementById("content-section"),
    empty: () => document.getElementById("empty-state"),
    summary: () => document.getElementById("summary-text"),
    forms: () => document.getElementById("forms-container"),
    message: () => document.getElementById("message-container"),
    activeFilters: () => document.getElementById("activeFilters")
};

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    loadData();
});

/* ================= AUTH ================= */

function checkAuth() {
    if (!localStorage.getItem("token")) {
        window.location.href = "/api/auth/login";
    }
}

/* ================= LOAD DATA ================= */

async function loadData() {
    try {
        DOM.loading().style.display = "block";
        DOM.content().style.display = "none";
        DOM.empty().style.display = "none";

        const response = await fetch(`${API_BASE}/consolidated-report/all`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) throw new Error("Failed to fetch data");

        allData = await response.json();
        DOM.loading().style.display = "none";

        if (allData.summary.grandTotal === 0) {
            DOM.empty().style.display = "block";
            return;
        }

        renderSummary(allData.summary);
        renderForms(allData);
        DOM.content().style.display = "block";

    } catch (error) {
        console.error(error);
        showMessage("Error loading data: " + error.message, "error");
        DOM.loading().style.display = "none";
    }
}

/* ================= SUMMARY ================= */

function renderSummary(summary) {
    let text = `Total Submissions: <strong>${summary.grandTotal}</strong> | `;

    FORM_CONFIG.forEach(type => {
        const keyName = "total" + type.key.charAt(0).toUpperCase() + type.key.slice(1);
        text += `${type.label}: ${summary[keyName] || 0} | `;
    });

    DOM.summary().innerHTML = text.slice(0, -2);
}

/* ================= RENDER FORMS ================= */

function renderForms(data) {
    let html = "";
    let hasData = false;

    FORM_CONFIG.forEach(type => {
        if (data[type.key] && data[type.key].length > 0) {
            html += renderFormSection(`${type.label} Forms`, data[type.key], type.key);
            hasData = true;
        }
    });

    if (!hasData) {
        html = `
            <div style="text-align:center;padding:40px;color:#999;">
                <div style="font-size:2rem;margin-bottom:10px;">🔍</div>
                <p>No forms match the selected filters.</p>
            </div>`;
    }

    DOM.forms().innerHTML = html;
}

function renderFormSection(title, forms, formType) {
    let html = `<div class="form-section">`;

    forms.forEach((form, index) => {
        html += `
            <div class="form-header">
                <span class="form-title">${title} #${index + 1}</span>
                <span class="form-badge">${formType.toUpperCase()}</span>
            </div>
            <div class="form-fields">
                ${renderFormFields(form)}
            </div>
        `;

        if (index < forms.length - 1) {
            html += `<hr style="margin:20px 0;border-top:1px solid #eee;">`;
        }
    });

    html += `</div>`;
    return html;
}

/* ================= FORM FIELD RENDERING ================= */

function renderFormFields(form) {
    let html = "";

    // Special VAC rendering
    if ((form.formType && form.formType.toUpperCase() === "VAC") && Array.isArray(form.courses)) {

        if (form.program_Id) {
            html += fieldBlock("Program Id", form.program_Id);
        }

        form.courses.forEach((course, idx) => {
            html += `
                <div style="margin:8px 0 18px;padding:12px;border-radius:6px;background:#fbfbfd;border:1px solid #eee;">
                    <div style="font-weight:700;margin-bottom:8px;">Course ${idx + 1}</div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
                        ${smallField("Course Name", course.courseName)}
                        ${smallField("Course Code", course.courseCode)}
                        ${smallField("Duration (Hours)", course.duration)}
                        ${smallField("Times Offered", course.timesOffered)}
                        ${smallField("Students Enrolled", course.studentsEnrolled)}
                        ${smallField("Students Completed", course.studentsCompleted)}
                        ${smallField("Brochure/Link", course.brochureLink)}
                        ${smallField("Coordinator", course.coordinator)}
                    </div>
                </div>`;
        });

        if (form.uploadedFile) html += fieldBlock("Uploaded File", form.uploadedFile);
        if (form.createdAt) html += fieldBlock("Created At", new Date(form.createdAt).toLocaleString());

        return html;
    }

    // Generic rendering
    Object.keys(form)
        .filter(k => !["_id", "__v", "id", "formType"].includes(k))
        .sort()
        .forEach(key => {
            const value = formatFieldValue(form[key]);
            const isEmpty = !value;
            html += `
                <div class="field">
                    <label class="field-label">${formatFieldName(key)}</label>
                    <div class="field-value ${isEmpty ? "empty" : ""}">
                        ${isEmpty ? "------" : escapeHtml(value)}
                    </div>
                </div>`;
        });

    return html;
}

/* ================= SMALL HELPERS ================= */

function smallField(label, value) {
    const v = value ? escapeHtml(String(value)) : "------";
    return `
        <div>
            <div class="field-label" style="font-size:12px;margin-bottom:6px;">${label}</div>
            <div class="field-value ${v === "------" ? "empty" : ""}" style="padding:8px;">${v}</div>
        </div>`;
}

function fieldBlock(label, value) {
    return `
        <div class="field">
            <label class="field-label">${label}</label>
            <div class="field-value">${escapeHtml(value)}</div>
        </div>`;
}

function escapeHtml(input) {
    if (!input) return "";
    return String(input)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatFieldName(name) {
    return name
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^./, s => s.toUpperCase())
        .trim();
}

function formatFieldValue(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value).trim();
}

/* ================= FILTERING ================= */

function applyFilters() {
    activeFilters = {
        formType: document.getElementById("filterFormType").value,
        semester: document.getElementById("filterSemester").value,
        department: document.getElementById("filterDepartment").value,
        programId: document.getElementById("filterProgramId").value.trim()
    };

    filteredData = filterData(allData, activeFilters);
    renderSummary(getSummaryFromFiltered(filteredData));
    renderForms(filteredData);
    renderActiveFilters();
}

function filterData(data, filters) {
    const result = {};

    const filterArray = (arr = []) => arr.filter(item => {
        if (filters.formType && item.formType !== filters.formType) return false;
        if (filters.semester && String(item.semester || "") !== filters.semester) return false;
        if (filters.department && String(item.department || "") !== filters.department) return false;
        if (filters.programId) {
            const prog = (item.program_Id || item.programId || "").toLowerCase();
            if (!prog.includes(filters.programId.toLowerCase())) return false;
        }
        return true;
    });

    FORM_CONFIG.forEach(type => {
        result[type.key] =
            !filters.formType || filters.formType === type.label
                ? filterArray(data[type.key])
                : [];
    });

    return result;
}

function getSummaryFromFiltered(data) {
    const summary = { grandTotal: 0 };

    FORM_CONFIG.forEach(type => {
        const count = data[type.key]?.length || 0;
        summary["total" + type.key.charAt(0).toUpperCase() + type.key.slice(1)] = count;
        summary.grandTotal += count;
    });

    return summary;
}

/* ================= UI HELPERS ================= */

function showMessage(message, type) {
    const className = type === "error" ? "error-message" : "success-message";
    DOM.message().innerHTML = `<div class="${className}">${message}</div>`;
    setTimeout(() => DOM.message().innerHTML = "", 5000);
}

function clearFilters() {
    document.getElementById("filterFormType").value = "";
    document.getElementById("filterSemester").value = "";
    document.getElementById("filterDepartment").value = "";
    document.getElementById("filterProgramId").value = "";

    activeFilters = {};
    renderSummary(allData.summary);
    renderForms(allData);
    renderActiveFilters();
}

function renderActiveFilters() {
    const container = DOM.activeFilters();
    const filters = [];

    if (activeFilters.formType) filters.push({ label: "Form Type", value: activeFilters.formType });
    if (activeFilters.semester) filters.push({ label: "Semester", value: activeFilters.semester });
    if (activeFilters.department) filters.push({ label: "Department", value: activeFilters.department });
    if (activeFilters.programId) filters.push({ label: "Program ID", value: activeFilters.programId });

    if (!filters.length) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <strong style="display:block;margin-bottom:10px;">Active Filters:</strong>
        ${filters.map(f => `
            <div class="filter-tag">
                <span><strong>${f.label}:</strong> ${f.value}</span>
                <span class="filter-tag-close" onclick="removeFilter('${f.label}')">×</span>
            </div>
        `).join("")}
    `;
}

function removeFilter(name) {
    const map = {
        "Form Type": "filterFormType",
        "Semester": "filterSemester",
        "Department": "filterDepartment",
        "Program ID": "filterProgramId"
    };

    document.getElementById(map[name]).value = "";
    applyFilters();
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/api/auth/login";
}