// Draft settings stay separate from a running round until explicitly applied.
export function sessionSettings(details: HTMLDetailsElement, describe: () => string, apply: () => void) {
  const controls = Array.from(details.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select'));
  const read = () => controls.map(control => ({ value: control.value, disabled: control.disabled, checked: control instanceof HTMLInputElement ? control.checked : false }));
  let saved = read();
  const restore = () => controls.forEach((control, i) => {
    control.value = saved[i]!.value;
    control.disabled = saved[i]!.disabled;
    if (control instanceof HTMLInputElement) control.checked = saved[i]!.checked;
  });
  const refresh = () => {
    saved = read();
    details.querySelector<HTMLElement>('[data-settings-summary]')!.textContent = describe();
  };
  details.querySelector('[data-settings-apply]')!.addEventListener('click', () => {
    apply(); refresh(); details.open = false;
    details.querySelector('summary')!.focus({ preventScroll: true });
  });
  details.querySelector('[data-settings-cancel]')!.addEventListener('click', () => {
    restore(); details.open = false; details.querySelector('summary')!.focus({ preventScroll: true });
  });
  details.addEventListener('toggle', () => { if (!details.open) restore(); });
  refresh();
  return refresh;
}

export function questionEntrance(element: HTMLElement) {
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.animate([{ opacity: .65, transform: 'translateY(4px)', filter: 'blur(1px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }], { duration: 200, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
}

export function practiceKeyboard(root: HTMLElement, pick: (index: number) => void, next: () => void) {
  root.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const target = event.target as HTMLElement;
    if (target.closest('select, input, textarea, details.session-settings[open]')) return;
    if (/^[1-9]$/.test(event.key)) { event.preventDefault(); pick(Number(event.key) - 1); }
    else if (event.key === 'Enter' && !target.closest('button, summary, a')) { event.preventDefault(); next(); }
  });
}
