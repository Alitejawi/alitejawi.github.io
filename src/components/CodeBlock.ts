for (const pre of document.querySelectorAll<HTMLPreElement>('.article-body pre')) {
  const code = pre.querySelector('code');
  if (!code || pre.closest('.code-block')) continue;

  const language = pre.dataset.language ?? 'text';
  const label = language === 'sh' || language === 'bash' ? 'Shell' : language;
  const block = document.createElement('div');
  block.className = 'code-block';
  const bar = document.createElement('div');
  bar.className = 'code-bar';
  const title = document.createElement('span');
  title.textContent = label;
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.textContent = 'Copy';
  copy.setAttribute('aria-label', `Copy ${label} code`);
  const status = document.createElement('span');
  status.className = 'code-status';
  status.setAttribute('role', 'status');

  let reset: ReturnType<typeof setTimeout> | undefined;
  copy.addEventListener('click', async () => {
    clearTimeout(reset);
    try {
      await navigator.clipboard.writeText(code.textContent ?? '');
      copy.textContent = 'Copied';
      status.textContent = 'Code copied to clipboard';
    } catch {
      copy.textContent = 'Try again';
      status.textContent = 'Could not copy. Select the code to copy it manually.';
    }
    reset = setTimeout(() => {
      copy.textContent = 'Copy';
      status.textContent = '';
    }, 3000);
  });

  bar.append(title, copy, status);
  pre.before(block);
  block.append(bar, pre);
  pre.tabIndex = 0;
  pre.setAttribute('aria-label', `${label} code`);
}
