export function formatClock(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

if (typeof document !== 'undefined') {
  const clocks = document.querySelectorAll<HTMLElement>('[data-clock]');
  const update = () => {
    const now = new Date();
    clocks.forEach((clock) => {
      const timeZone = clock.dataset.timeZone;
      if (timeZone) clock.textContent = formatClock(now, timeZone);
    });
  };

  if (clocks.length) {
    update();
    window.setInterval(update, 30_000);
  }
}
