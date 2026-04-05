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

function getCurrentFilters() {
    return {
        formType: document.getElementById("filterFormType")?.value || "",
        semester: document.getElementById("filterSemester")?.value || "",
        department: document.getElementById("filterDepartment")?.value || "",
        programId: (document.getElementById("filterProgramId")?.value || "").trim()
    };
}

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
// - can be extended to handle csv download as well for testing purposes - can be removed later
// function to handle pdf download 
async function downloadPDF() {
  try {
    // Always read latest UI selections, even if user didn't click Apply Filters.
    const currentFilters = getCurrentFilters();
    const params = new URLSearchParams();

    if (currentFilters.formType) params.append("formType", currentFilters.formType);
    if (currentFilters.semester) params.append("semester", currentFilters.semester);
    if (currentFilters.department) params.append("department", currentFilters.department);
    if (currentFilters.programId) params.append("programId", currentFilters.programId);

    const query = params.toString();
    const downloadUrl = query
      ? `/api/consolidated-report/download-pdf?${query}`
      : "/api/consolidated-report/download-pdf";

    const response = await fetch(downloadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/pdf"
      }
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("application/pdf")) {
      let message = "Failed to download PDF";
      try {
        const data = await response.clone().json();
        if (data?.message) message = data.message;
        if (data?.error) message = data.error;
      } catch {
        // Keep generic message when response is not JSON.
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "consolidated-report.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(blobUrl);

  } catch (err) {
    console.error("PDF download failed:", err);
    alert("PDF download failed");
  }
}

// async function downloadPDF() {
//     try {
//         const content = document.getElementById("content-section");

//         // Clone content to safely remove unwanted elements
//         const clone = content.cloneNode(true);

//         // Remove non-essential elements
//         clone.querySelectorAll(".filters-section, .action-buttons, #activeFilters, #message-container, .filter-input, .filter-select, .filter-buttons").forEach(el => el.remove());

//         // Append clone temporarily to body for rendering
//         clone.style.width = "800px"; // fixed width for PDF
//         clone.style.background = "#fff";
//         clone.style.padding = "20px";
//         clone.style.boxSizing = "border-box";
//         clone.style.position = "absolute";
//         clone.style.left = "-9999px";
//         document.body.appendChild(clone);

//         // Render clone to canvas
//         const canvas = await html2canvas(clone, { scale: 2, useCORS: true, logging: false });
//         const imgData = canvas.toDataURL("image/png",0.7);

//         const pdf = new jspdf.jsPDF("p", "pt", "a4");
//         const pdfWidth = pdf.internal.pageSize.getWidth();
//         const pdfHeight = pdf.internal.pageSize.getHeight();

//         const imgWidth = pdfWidth;
//         const imgHeight = (canvas.height * pdfWidth) / canvas.width;
//         let heightLeft = imgHeight;
//         let position = 0;

//         // Add first page
//         pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
//         heightLeft -= pdfHeight;

//         // Add extra pages if content is long
//         while (heightLeft > 0) {
//             position = heightLeft - imgHeight;
//             pdf.addPage();
//             pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
//             heightLeft -= pdfHeight;
//         }

//         pdf.save(`consolidated-forms-${new Date().toISOString().split("T")[0]}.pdf`);

//         // Remove temporary clone
//         document.body.removeChild(clone);

//     } catch (err) {
//         console.error("PDF download failed:", err);
//         alert("PDF download failed: " + err.message);
//     }
// }
// function to handle excel download
async function downloadExcel() {
  try {
    // Always read latest UI selections, even if user didn't click Apply Filters.
    const currentFilters = getCurrentFilters();
    const params = new URLSearchParams();
    if (currentFilters.formType) params.append("formType", currentFilters.formType);
    if (currentFilters.semester) params.append("semester", currentFilters.semester);
    if (currentFilters.department) params.append("department", currentFilters.department);
    if (currentFilters.programId) params.append("programId", currentFilters.programId);

    const query = params.toString();
    const downloadUrl = query
      ? `/api/consolidated-report/download-excel?${query}`
      : "/api/consolidated-report/download-excel";

    const response = await fetch(downloadUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("spreadsheetml")) {
      let message = "Failed to download Excel";
      try {
        const data = await response.clone().json();
        if (data?.message) message = data.message;
      } catch {
        // Keep generic fallback message
      }
      throw new Error(message);
    }

    const blob = await response.blob();

    // Create download link
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = blobUrl;
    a.download = `Annexure_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(blobUrl);

  } catch (error) {
    console.error("Error downloading excel:", error);
    alert(error.message || "Excel download failed");
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

        if (form.uploadedFile) html += `
                <div class="field">
                    <label class="field-label">Uploaded File</label>
                    <div class="field-value">
                        <img src="./uploads/vac-broucher/${escapeHtml(form.uploadedFile)}" alt="Uploaded File" style="max-width:300px;height:auto;border:1px solid #ccc;border-radius:5px;">
                    </div>
                </div>`;
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
    activeFilters = getCurrentFilters();

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
