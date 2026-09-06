const numbers = new Intl.NumberFormat("en-US");
const fullDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const date = value => new Date(`${value}T12:00:00Z`);
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
  const days = data.calendar;
  const active = days.map(day => day.tokens).filter(Boolean).sort((a, b) => a - b);
  const levels = [percentile(active, 0.25), percentile(active, 0.5), percentile(active, 0.75)];

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

}

render(window.usageSnapshot);
