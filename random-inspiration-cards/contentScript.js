let dismissTimer = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "WORD_SPARK_SHOW_CARD") {
    showWordCard(message.words || []);
  }
});

function showWordCard(words) {
  if (!Array.isArray(words) || words.length === 0) return;

  document.querySelector(".wsc-shell")?.remove();

  const shell = document.createElement("aside");
  shell.className = "wsc-shell";
  shell.setAttribute("role", "dialog");
  shell.setAttribute("aria-label", "Word reminder");

  shell.innerHTML = `
    <div class="wsc-card">
      <div class="wsc-header">
        <div>
          <p class="wsc-kicker">Word Spark</p>
          <h2>5 words for this moment</h2>
        </div>
        <button class="wsc-close" type="button" title="Close" aria-label="Close"></button>
      </div>
      <div class="wsc-grid"></div>
      <div class="wsc-actions">
        <button class="wsc-copy" type="button">Copy words</button>
        <button class="wsc-later" type="button">Later</button>
      </div>
    </div>
  `;

  const grid = shell.querySelector(".wsc-grid");

  words.forEach((item) => {
    const row = document.createElement("article");
    row.className = "wsc-word";

    const word = document.createElement("strong");
    const meaning = document.createElement("span");
    const example = document.createElement("p");

    word.textContent = item.word;
    meaning.textContent = item.meaning;
    example.textContent = item.example;

    row.append(word, meaning, example);
    grid.append(row);
  });

  shell.querySelector(".wsc-close").addEventListener("click", () => dismiss(shell));
  shell.querySelector(".wsc-later").addEventListener("click", () => dismiss(shell));
  shell.querySelector(".wsc-copy").addEventListener("click", async (event) => {
    await navigator.clipboard.writeText(words.map((item) => `${item.word} - ${item.meaning}`).join("\n"));
    event.currentTarget.textContent = "Copied";
    setTimeout(() => {
      event.currentTarget.textContent = "Copy words";
    }, 1000);
  });

  document.body.append(shell);

  requestAnimationFrame(() => {
    shell.classList.add("is-visible");
  });

  clearTimeout(dismissTimer);
  dismissTimer = setTimeout(() => dismiss(shell), 45000);
}

function dismiss(shell) {
  clearTimeout(dismissTimer);
  shell.classList.remove("is-visible");
  setTimeout(() => shell.remove(), 180);
}
