const numberFormatter = new Intl.NumberFormat("en-US");
const compactFormatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const shortDateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const labels = {
  combined: "Combined",
  peaksecurity: "Peak Security",
  personal: "Personal",
};

const state = { data: null, account: "combined" };

function formatBillions(value) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  return compactFormatter.format(value);
}

function tokenActivity(day, account) {
  return account === "combined" ? day.combined : day.accounts[account];
}

function tokenTotal(day, account) {
  return tokenActivity(day, account) || 0;
}

function percentile(sortedValues, fraction) {
  if (!sortedValues.length) return 0;
  return sortedValues[Math.min(sortedValues.length - 1, Math.floor(sortedValues.length * fraction))];
}

function activityLevel(value, thresholds) {
  if (!value) return 0;
  if (value <= thresholds[0]) return 1;
  if (value <= thresholds[1]) return 2;
  if (value <= thresholds[2]) return 3;
  return 4;
}

function localDate(value) {
  return new Date(`${value}T12:00:00Z`);
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function renderHeadline() {
  const totals = state.account === "combined" ? state.data.totals.combined : state.data.totals.accounts[state.account];
  const days = state.data.calendar;
  const peak = days.reduce((best, day) => tokenTotal(day, state.account) > tokenTotal(best, state.account) ? day : best, days[0]);
  setText("hero-total", formatBillions(totals.text_total_tokens));
  setText("hero-context", state.account === "combined" ? "Combining two Codex accounts over 180 days" : `${labels[state.account]} account over 180 days`);
  setText("turn-total", numberFormatter.format(totals.turns));
  setText("thread-total", numberFormatter.format(totals.threads));
  setText("peak-total", formatBillions(tokenTotal(peak, state.account)));
}

function renderAccounts() {
  const combined = state.data.totals.combined.text_total_tokens;
  const peak = state.data.totals.accounts.peaksecurity.text_total_tokens;
  const personal = state.data.totals.accounts.personal.text_total_tokens;
  const peakShare = peak / combined * 100;
  const personalShare = personal / combined * 100;
  document.getElementById("peak-bar").style.width = `${peakShare}%`;
  document.getElementById("personal-bar").style.width = `${personalShare}%`;
  setText("peak-account-total", formatBillions(peak));
  setText("personal-account-total", formatBillions(personal));
  setText("peak-account-share", `${peakShare.toFixed(1)}% of combined`);
  setText("personal-account-share", `${personalShare.toFixed(1)}% of combined`);
}

function showTooltip(event, text) {
  const tooltip = document.getElementById("tooltip");
  const rect = event.currentTarget.getBoundingClientRect();
  tooltip.textContent = text;
  tooltip.style.left = `${Math.min(window.innerWidth - 120, Math.max(120, rect.left + rect.width / 2))}px`;
  tooltip.style.top = `${Math.max(42, rect.top)}px`;
  tooltip.classList.add("visible");
}

function hideTooltip() {
  document.getElementById("tooltip").classList.remove("visible");
}

function renderCalendar() {
  const heatmap = document.getElementById("heatmap");
  const monthLabels = document.getElementById("month-labels");
  const days = state.data.calendar;
  const activeValues = days.map(day => tokenTotal(day, state.account)).filter(Boolean).sort((a, b) => a - b);
  const thresholds = [percentile(activeValues, 0.25), percentile(activeValues, 0.5), percentile(activeValues, 0.75)];
  const sundayOffset = localDate(days[0].date).getUTCDay();
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < sundayOffset; i += 1) {
    const blank = document.createElement("span");
    blank.className = "day-cell blank";
    fragment.appendChild(blank);
  }

  days.forEach(day => {
    const value = tokenTotal(day, state.account);
    const label = `${formatBillions(value)} tokens on ${dateFormatter.format(localDate(day.date))}`;
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day-cell";
    cell.dataset.level = activityLevel(value, thresholds);
    cell.setAttribute("aria-label", label);
    cell.addEventListener("pointerenter", event => showTooltip(event, label));
    cell.addEventListener("pointerleave", hideTooltip);
    cell.addEventListener("focus", event => showTooltip(event, label));
    cell.addEventListener("blur", hideTooltip);
    fragment.appendChild(cell);
  });

  heatmap.replaceChildren(fragment);
  monthLabels.replaceChildren();
  let lastMonth = -1;
  days.forEach((day, index) => {
    const date = localDate(day.date);
    const month = date.getUTCMonth();
    if (month !== lastMonth) {
      const label = document.createElement("span");
      label.textContent = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
      label.style.gridColumn = `${2 + Math.floor((sundayOffset + index) / 7)}`;
      monthLabels.appendChild(label);
      lastMonth = month;
    }
  });

  const activeDays = activeValues.length;
  const total = state.account === "combined" ? state.data.totals.combined.text_total_tokens : state.data.totals.accounts[state.account].text_total_tokens;
  setText("calendar-summary", `${labels[state.account]} · ${activeDays} token-reporting days · ${formatBillions(total)} tokens`);
}

function renderModels() {
  const models = Object.entries(state.data.totals.model_activity)
    .filter(([name]) => name !== "other")
    .sort(([, a], [, b]) => b.turns - a.turns)
    .slice(0, 5);
  const max = models[0]?.[1].turns || 1;
  const list = document.getElementById("model-list");
  list.replaceChildren(...models.map(([name, activity]) => {
    const row = document.createElement("div");
    row.className = "model-row";
    const modelName = document.createElement("span");
    const track = document.createElement("span");
    const fill = document.createElement("span");
    const value = document.createElement("span");
    modelName.className = "model-name";
    modelName.title = name;
    modelName.textContent = name;
    track.className = "model-track";
    track.setAttribute("aria-hidden", "true");
    fill.style.width = `${activity.turns / max * 100}%`;
    track.appendChild(fill);
    value.className = "model-value";
    value.textContent = `${compactFormatter.format(activity.turns)} turns`;
    row.append(modelName, track, value);
    return row;
  }));
}

function renderComposition() {
  const totals = state.data.totals.combined;
  setText("cached-total", `${formatBillions(totals.cached_text_input_tokens)} · ${(totals.cached_text_input_tokens / totals.text_total_tokens * 100).toFixed(1)}%`);
  setText("input-total", `${formatBillions(totals.uncached_text_input_tokens)} · ${(totals.uncached_text_input_tokens / totals.text_total_tokens * 100).toFixed(1)}%`);
  setText("output-total", `${formatBillions(totals.text_output_tokens)} · ${(totals.text_output_tokens / totals.text_total_tokens * 100).toFixed(1)}%`);
}

function renderMetadata() {
  const { date_range: range, coverage } = state.data;
  setText("date-range", `${shortDateFormatter.format(localDate(range.start))} to ${dateFormatter.format(localDate(range.end))}`);
  setText("coverage-note", `This is the exact total reported by the Codex usage endpoints for both accounts. Token fields begin on ${dateFormatter.format(localDate(coverage.first_day_with_reported_tokens))}; ${numberFormatter.format(coverage.turns_on_days_without_token_totals)} earlier turns have no token totals, so ${formatBillions(state.data.totals.combined.text_total_tokens)} is a documented lower bound.`);
  const refreshed = new Date(state.data.generated_at_utc);
  setText("refreshed-at", `Refreshed ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(refreshed)}`);
}

function renderAccountView() {
  renderHeadline();
  renderCalendar();
}

document.querySelectorAll("[data-account]").forEach(button => {
  button.addEventListener("click", () => {
    state.account = button.dataset.account;
    document.querySelectorAll("[data-account]").forEach(item => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    renderAccountView();
  });
});

document.getElementById("theme-toggle").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("usage-theme", next);
});

fetch("data.json")
  .then(response => {
    if (!response.ok) throw new Error(`Usage data request failed with ${response.status}`);
    return response.json();
  })
  .then(data => {
    state.data = data;
    renderHeadline();
    renderAccounts();
    renderCalendar();
    renderModels();
    renderComposition();
    renderMetadata();
  })
  .catch(() => {
    setText("hero-total", "Unavailable");
    setText("hero-context", "The usage snapshot could not be loaded. Please try again shortly.");
    setText("calendar-summary", "Daily activity is temporarily unavailable");
    setText("coverage-note", "The page loaded, but its data file did not. Refresh the page to retry.");
  });
