const courseOptions = {
  'Year 1': ["SUS 1010", "PHY 1331", "ENV 2001", "ENT 1010", "HAN 1321", "CHE 1305", "FIL 1010", "BCM 1341", "PHY 1332", "NSC 2215", "CHE 1306", "CHE 2305", "HAN 1322", "PHY 1333", "HAN 1323", "CHE 2307", "CHE 2306", "BCM 1342", "MTH 1109"],
  'Year 2': ["PHM 3401", "BCM 1343", "PHY 2334", "MIC 2365", "BCM 2345", "HSC 2391", "ENG 1106", "SOC 1101", "PAT 3371", "ENG 2206", "PHY 2335", "BCM 2344", "MIC 2362", "MIC 2366", "GRM 2000", "IST 1010", "CHE 2304", "PHY 2336", "BCM 2346", "MIC 2367"],
  'Year 3': ["BCM 3347", "BOT 3352", "CHE 2308", "HSC 3492", "PHM 3402", "PHM 3481", "PHM 3471", "PHM 3411", "BOT 3353", "PAT 3372", "PHM 3451", "PHM 3412", "PHM 3404", "PHM 3485", "PHM 3472", "PHM 3483", "PAT 3373", "PHM 3473", "PHM 3405", "PHM 3413", "PHM 3487"],
  'Year 4': ["PHM 4492", "PHM 4484", "PHM 4474", "PHM 4405", "PHM 4414", "PHM 4451", "HSC 4493", "PHM 4487", "PHM 4475", "PHM 4452", "PHM 4425", "PHM 4415", "PHM 4406", "PHM 4481", "PHM 4493", "PHM 4488", "PHM 4476", "PHM 4426", "PHM 4416", "PHM 4482"],
  'Year 5': ["PHM 5497", "PHM 5492", "PHM 5493", "SEN 4800", "PHM 5407", "PHM 5490", "PHM 5477", "PHM 5417", "PHM 4483", "PHM 5498", "CMS 3700", "PHM 5496", "PHM 5491", "PHM 5478", "PHM 5418", "PHM 5494"]
};

const sanitizeId = str => str.toLowerCase().replace(/\s+/g, '-');

function renderLogin(container) {
  container.innerHTML = `
    <div class="center">
      <img src="logo.jpg" class="logo" alt="USIU Logo">
      <h1>Welcome to UPSA Portal</h1>
      <p>Select your year of study to continue</p>
      <div id="year-buttons"></div>
    </div>
  `;
  const buttons = document.getElementById("year-buttons");
  Object.keys(courseOptions).forEach(year => {
    const btn = document.createElement("button");
    btn.textContent = year;
    btn.className = "button";
    btn.onclick = () => renderPortal(container, year);
    buttons.appendChild(btn);
  });
}

function renderPortal(container, year) {
  container.innerHTML = `
    <header>
      <img src="logo.jpg" class="logo" alt="USIU Logo">
      <h1>UPSA Pharmacy Students Portal</h1>
      <p>Logged in as: <strong>${year}</strong></p>
      <button class="button" id="back-to-login">← Back to Year Selection</button>
    </header>
    <div class="tabs">
      <button class="button active" onclick="showTab('pastpapers', this)">Past Papers</button>
      <button class="button" onclick="showTab('assignments', this)">Assignments</button>
      <button class="button" onclick="showTab('labreports', this)">Lab Reports</button>
    </div>
    <section id="tab-pastpapers" class="tab-content active"></section>
    <section id="tab-assignments" class="tab-content"></section>
    <section id="tab-labreports" class="tab-content"></section>
  `;
  document.getElementById("back-to-login").onclick = () => renderLogin(container);
  renderUploadSection("tab-pastpapers", "Upload Past Paper", courseOptions[year]);
  renderDownloadSection("tab-pastpapers", "Past Papers", courseOptions[year]);
  renderUploadSection("tab-assignments", "Upload Assignment", courseOptions[year]);
  renderDownloadSection("tab-assignments", "Assignments", courseOptions[year]);
  renderUploadSection("tab-labreports", "Upload Lab Report", courseOptions[year]);
  renderDownloadSection("tab-labreports", "Lab Reports", courseOptions[year]);
}

function renderUploadSection(id, title, courses) {
  const category = title.replace("Upload ", "").trim();
  const el = document.getElementById(id);
  const form = document.createElement("form");
  form.className = "card";
  form.enctype = "multipart/form-data";
  const typeOptions = ["Quiz 1", "Midsem", "Quiz 2", "End Sem"];
  const isPastPaper = category === "Past Paper";
  form.innerHTML = `
    <h2>${title}</h2>
    <input type="hidden" name="category" value="${category}">
    ${isPastPaper ? `
      <select name="title" required>
        <option value="">Select Type</option>
        ${typeOptions.map(t => `<option value="${t}">${t}</option>`).join('')}
      </select>
    ` : `
      <input type="text" name="title" placeholder="Enter document title" required>
    `}
    <select name="course" required>
      <option value="">Select Course</option>
      ${courses.map(c => `<option value="${c}">${c}</option>`).join('')}
    </select>
    <input type="file" name="file" required>
    <button class="button" type="submit">Upload</button>
    <div id="upload-status"></div>
  `;
  form.onsubmit = async e => {
    e.preventDefault();
    const status = form.querySelector("#upload-status");
    const formData = new FormData(form);
    try {
      const res = await fetch("http://localhost:3000/upload", { method: "POST", body: formData });
      const data = await res.json();
      status.innerHTML = `<p style="color:green;">${data.message}</p>`;
    } catch {
      status.innerHTML = `<p style="color:red;">Upload failed</p>`;
    }
    form.reset();
  };
  el.appendChild(form);
}

function renderDownloadSection(id, category, courses) {
  const el = document.getElementById(id);
  const card = document.createElement("div");
  card.className = "card";
  const safeId = sanitizeId(category);
  const typeOptions = ["Quiz 1", "Midsem", "Quiz 2", "End Sem"];
  const isPastPaper = category === "Past Papers";
  let passwordAccepted = false;
  card.innerHTML = `
    <h2>${category}</h2>
    <p>Enter club member password:</p>
    <input type="password" id="pw-${safeId}" placeholder="Enter password" />
    <button class="button" id="unlock-btn-${safeId}">Unlock Downloads</button>
    <div id="download-controls-${safeId}" style="display:none; margin-top:1rem;">
      <label for="select-course-${safeId}">Select Course:</label>
      <select id="select-course-${safeId}">
        <option value="">-- Select Course --</option>
        ${courses.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
      ${isPastPaper ? `
        <label for="select-type-${safeId}">Select Type:</label>
        <select id="select-type-${safeId}">
          <option value="">-- Select Type --</option>
          ${typeOptions.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      ` : ''}
      <ul id="list-${safeId}" class="file-list"></ul>
    </div>
  `;
  el.appendChild(card);
  const unlockBtn = card.querySelector(`#unlock-btn-${safeId}`);
  const pwInput = card.querySelector(`#pw-${safeId}`);
  const downloadControls = card.querySelector(`#download-controls-${safeId}`);
  const courseSelect = card.querySelector(`#select-course-${safeId}`);
  const typeSelect = isPastPaper ? card.querySelector(`#select-type-${safeId}`) : null;
  const fileList = card.querySelector(`#list-${safeId}`);

  unlockBtn.addEventListener("click", () => {
    if (pwInput.value.trim().toUpperCase() === "UPSA123") {
      passwordAccepted = true;
      downloadControls.style.display = "block";
      pwInput.disabled = true;
      unlockBtn.disabled = true;
    } else {
      alert("Incorrect password.");
    }
  });

  [courseSelect, typeSelect].forEach(sel => sel && sel.addEventListener("change", updateFileList));

  async function updateFileList() {
    if (!passwordAccepted) return;
    const course = courseSelect.value;
    const type = isPastPaper ? typeSelect.value : "";
    if (!course || (isPastPaper && !type)) {
      fileList.innerHTML = "<li>Please select all required options.</li>";
      return;
    }
    const params = new URLSearchParams({ category, course, ...(isPastPaper ? { title: type } : {}) });
    try {
      const response = await fetch(`http://localhost:3000/list-files?${params}`);
      const files = await response.json();
      fileList.innerHTML = files.length ?
        files.map(file => `<li><a href="${file}" target="_blank">${decodeURIComponent(file.split("/").pop())}</a></li>`).join('') :
        "<li>No files found in this folder.</li>";
    } catch {
      fileList.innerHTML = "<li>Error loading files.</li>";
    }
  }
}

function showTab(tab, button) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tabs .button").forEach(btn => btn.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  button.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => renderLogin(document.getElementById("app")));
