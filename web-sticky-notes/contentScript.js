const STORAGE_PREFIX = "webStickyNotes:";
const COLORS = ["sun", "mint", "sky", "rose"];

let notes = [];
let armed = false;
let saveTimer = null;
let toastTimer = null;

const pageKey = `${STORAGE_PREFIX}${location.origin}${location.pathname}`;

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "WEB_STICKY_NOTES_ARM") {
    setArmed(!armed);
  }
});

init();

async function init() {
  notes = await loadNotes();
  notes.forEach(renderNote);
}

async function loadNotes() {
  const stored = await chrome.storage.local.get(pageKey);
  return Array.isArray(stored[pageKey]) ? stored[pageKey] : [];
}

function setArmed(nextValue) {
  armed = nextValue;
  document.documentElement.classList.toggle("wsn-armed", armed);

  if (armed) {
    document.addEventListener("click", handleCreateClick, true);
    showToast("Click anywhere to place a note");
  } else {
    document.removeEventListener("click", handleCreateClick, true);
    showToast("Sticky note mode off");
  }
}

function handleCreateClick(event) {
  if (event.target.closest?.(".wsn-note")) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const note = {
    id: crypto.randomUUID(),
    x: Math.max(12, event.clientX + scrollX - 120),
    y: Math.max(12, event.clientY + scrollY - 28),
    w: 240,
    h: 180,
    color: COLORS[notes.length % COLORS.length],
    text: ""
  };

  notes.push(note);
  renderNote(note, true);
  scheduleSave();
  setArmed(false);
}

function renderNote(note, focusText = false) {
  const root = document.createElement("section");
  root.className = `wsn-note wsn-${note.color}`;
  root.dataset.id = note.id;
  root.style.left = `${note.x}px`;
  root.style.top = `${note.y}px`;
  root.style.width = `${note.w}px`;
  root.style.height = `${note.h}px`;

  root.innerHTML = `
    <div class="wsn-bar">
      <button class="wsn-drag" type="button" title="Drag note" aria-label="Drag note"></button>
      <div class="wsn-swatches" aria-label="Note color"></div>
      <button class="wsn-delete" type="button" title="Delete note" aria-label="Delete note"></button>
    </div>
    <textarea class="wsn-text" spellcheck="false" placeholder="Write a note..."></textarea>
    <span class="wsn-resize" aria-hidden="true"></span>
  `;

  const textarea = root.querySelector(".wsn-text");
  const swatches = root.querySelector(".wsn-swatches");
  textarea.value = note.text;

  COLORS.forEach((color) => {
    const button = document.createElement("button");
    button.className = `wsn-swatch wsn-swatch-${color}`;
    button.type = "button";
    button.title = color;
    button.ariaLabel = `Use ${color} note color`;
    button.dataset.color = color;
    button.classList.toggle("is-active", color === note.color);
    swatches.append(button);
  });

  textarea.addEventListener("input", () => {
    note.text = textarea.value;
    scheduleSave();
  });

  swatches.addEventListener("click", (event) => {
    const button = event.target.closest(".wsn-swatch");
    if (!button) return;

    note.color = button.dataset.color;
    root.className = `wsn-note wsn-${note.color}`;
    swatches.querySelectorAll(".wsn-swatch").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.color === note.color);
    });
    scheduleSave();
  });

  root.querySelector(".wsn-delete").addEventListener("click", () => {
    notes = notes.filter((item) => item.id !== note.id);
    root.remove();
    scheduleSave();
  });

  makeDraggable(root, note);
  makeResizable(root, note);
  document.body.append(root);

  if (focusText) {
    requestAnimationFrame(() => textarea.focus());
  }
}

function makeDraggable(root, note) {
  const handle = root.querySelector(".wsn-drag");
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;

  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    root.setPointerCapture(event.pointerId);
    root.classList.add("is-moving");
    startX = event.clientX;
    startY = event.clientY;
    originX = note.x;
    originY = note.y;
  });

  root.addEventListener("pointermove", (event) => {
    if (!root.classList.contains("is-moving")) return;

    note.x = Math.max(8, originX + event.clientX - startX);
    note.y = Math.max(8, originY + event.clientY - startY);
    root.style.left = `${note.x}px`;
    root.style.top = `${note.y}px`;
  });

  root.addEventListener("pointerup", (event) => {
    if (!root.classList.contains("is-moving")) return;
    root.releasePointerCapture(event.pointerId);
    root.classList.remove("is-moving");
    scheduleSave();
  });
}

function makeResizable(root, note) {
  const handle = root.querySelector(".wsn-resize");
  let startX = 0;
  let startY = 0;
  let startW = 0;
  let startH = 0;

  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    root.setPointerCapture(event.pointerId);
    root.classList.add("is-resizing");
    startX = event.clientX;
    startY = event.clientY;
    startW = note.w;
    startH = note.h;
  });

  root.addEventListener("pointermove", (event) => {
    if (!root.classList.contains("is-resizing")) return;

    note.w = Math.max(180, startW + event.clientX - startX);
    note.h = Math.max(130, startH + event.clientY - startY);
    root.style.width = `${note.w}px`;
    root.style.height = `${note.h}px`;
  });

  root.addEventListener("pointerup", (event) => {
    if (!root.classList.contains("is-resizing")) return;
    root.releasePointerCapture(event.pointerId);
    root.classList.remove("is-resizing");
    scheduleSave();
  });
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    chrome.storage.local.set({ [pageKey]: notes });
  }, 180);
}

function showToast(text) {
  let toast = document.querySelector(".wsn-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "wsn-toast";
    document.body.append(toast);
  }

  toast.textContent = text;
  toast.classList.add("is-visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1400);
}
