function emailBodyFragment(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.innerHTML.trim();
}

function copyRenderedSelection(html) {
  const holder = document.createElement('div');
  holder.setAttribute('contenteditable', 'true');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    'width:700px',
    'background:#F2EEE8',
    'pointer-events:none',
    'z-index:-1',
  ].join(';');
  holder.innerHTML = html;
  document.body.appendChild(holder);

  const selection = window.getSelection();
  const range = document.createRange();

  try {
    holder.focus();
    range.selectNodeContents(holder);
    selection.removeAllRanges();
    selection.addRange(range);

    if (!document.execCommand('copy')) {
      throw new Error("La copie de l'e-mail a échoué.");
    }
  } finally {
    selection.removeAllRanges();
    holder.remove();
  }
}

export async function copyRichEmail(html, plainText = '') {
  const fragment = emailBodyFragment(html);

  try {
    // Outlook conserve beaucoup mieux la mise en forme lorsque le presse-papiers
    // provient d'une sélection réellement rendue par le navigateur.
    copyRenderedSelection(fragment);
    return;
  } catch (selectionError) {
    if (!navigator.clipboard?.write || !window.ClipboardItem) {
      throw selectionError;
    }
  }

  // Repli pour les navigateurs qui refusent execCommand('copy').
  await navigator.clipboard.write([
    new window.ClipboardItem({
      'text/html': new Blob([fragment], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' }),
    }),
  ]);
}
