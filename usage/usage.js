const numbers = new Intl.NumberFormat("en-US");
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const date = value => new Date(`${value}T12:00:00Z`);
const compact = value => value >= 1e9 ? `${(value / 1e9).toFixed(1)}B` : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const percentile = (values, fraction) => values[Math.min(values.length - 1, Math.floor(values.length * fraction))] || 0;

function showTooltip(event, text) {
  const tooltip = document.getElementById("tooltip");
  const box = event.currentTarget.getBoundingClientRect();
  tooltip.textContent = text;
  tooltip.style.left = `${Math.min(innerWidth - 115, Math.max(115, box.left + box.width / 2))}px`;
  tooltip.style.top = `${Math.max(38, box.top)}px`;
  tooltip.classList.add("visible");
}

function hideTooltip() {
  document.getElementById("tooltip").classList.remove("visible");
}

function render(data) {
  const total = data.totals.combined;
  const days = data.calendar;
  const peak = Math.max(...days.map(day => day.tokens));
  const active = days.map(day => day.tokens).filter(Boolean).sort((a, b) => a - b);
  const levels = [percentile(active, 0.25), percentile(active, 0.5), percentile(active, 0.75)];

  document.getElementById("token-total").textContent = compact(total.text_total_tokens);
  document.getElementById("turn-total").textContent = numbers.format(total.turns);
  document.getElementById("thread-total").textContent = numbers.format(total.threads);
  document.getElementById("peak-total").textContent = compact(peak);
  document.getElementById("date-range").textContent = `${shortDate.format(date(data.date_range.start))} to ${fullDate.format(date(data.date_range.end))}`;

  const heatmap = document.getElementById("heatmap");
  const startOffset = date(days[0].date).getUTCDay();
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) {
    const blank = document.createElement("span");
    blank.className = "day blank";
    cells.push(blank);
  }
  days.forEach(day => {
    const level = day.tokens === 0 ? 0 : day.tokens <= levels[0] ? 1 : day.tokens <= levels[1] ? 2 : day.tokens <= levels[2] ? 3 : 4;
    const label = `${numbers.format(day.tokens)} tokens on ${fullDate.format(date(day.date))}`;
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day";
    cell.dataset.level = level;
    cell.setAttribute("aria-label", label);
    cell.addEventListener("pointerenter", event => showTooltip(event, label));
    cell.addEventListener("pointerleave", hideTooltip);
    cell.addEventListener("focus", event => showTooltip(event, label));
    cell.addEventListener("blur", hideTooltip);
    cells.push(cell);
  });
  heatmap.replaceChildren(...cells);

  const months = document.getElementById("months");
  let previousMonth = -1;
  days.forEach((day, index) => {
    const current = date(day.date);
    if (current.getUTCMonth() !== previousMonth) {
      const label = document.createElement("span");
      label.textContent = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(current);
      label.style.gridColumn = `${2 + Math.floor((startOffset + index) / 7)}`;
      months.appendChild(label);
      previousMonth = current.getUTCMonth();
    }
  });

  const models = Object.entries(data.totals.model_activity)
    .filter(([name]) => name !== "other")
    .sort(([, a], [, b]) => b.turns - a.turns)
    .slice(0, 5);
  document.getElementById("model-table").replaceChildren(...models.map(([name, usage]) => {
    const row = document.createElement("tr");
    const model = document.createElement("td");
    const turns = document.createElement("td");
    model.textContent = name;
    turns.textContent = numbers.format(usage.turns);
    row.append(model, turns);
    return row;
  }));

  const breakdown = [
    ["Cached input", total.cached_text_input_tokens],
    ["Uncached input", total.uncached_text_input_tokens],
    ["Output", total.text_output_tokens],
  ];
  document.getElementById("breakdown-table").replaceChildren(...breakdown.map(([label, value]) => {
    const row = document.createElement("tr");
    [label, numbers.format(value), `${(value / total.text_total_tokens * 100).toFixed(1)}%`].forEach(text => {
      const cell = document.createElement("td");
      cell.textContent = text;
      row.appendChild(cell);
    });
    return row;
  }));

  const coverage = data.coverage;
  document.getElementById("coverage-note").textContent = `Token totals begin on ${fullDate.format(date(coverage.first_day_with_reported_tokens))}. The endpoint recorded ${numbers.format(coverage.turns_on_days_without_token_totals)} earlier turns without token totals, so the combined total is a lower bound.`;
}

fetch("data.json")
  .then(response => {
    if (!response.ok) throw new Error();
    return response.json();
  })
  .then(render)
  .catch(() => {
    document.getElementById("token-total").textContent = "Unavailable";
    document.getElementById("coverage-note").textContent = "The usage data could not be loaded. Refresh the page to try again.";
  });
