// Invitation email for a rencontre, generated on demand from the admin
// backend. Email-client constraints apply: table layout, inline styles,
// web-safe font stacks, absolute URLs. The palette mirrors the site theme
// (see web/src/styles.css) with Georgia standing in for Newsreader.
function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildInvitationEmail({ rencontre, baseUrl }) {
  const r = rencontre;
  const dateStr = new Date(r.date_renc).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const restantes = Math.max(0, r.places - (r.inscrits ?? 0));
  const inscriptionUrl = `${baseUrl}/?inscription=${r.id}`;
  const logoUrl = `${baseUrl}/assets/logo.jpg`;
  const subject = `Invitation — ${r.titre} · ${dateStr}`;

  const infoLines = [
    `<strong style="color:#1B1B1B;">${esc(dateStr.charAt(0).toUpperCase() + dateStr.slice(1))}</strong>`,
    [r.heure && esc(r.heure), esc(r.lieu)].filter(Boolean).join(' — '),
    restantes > 0 ? `${restantes} place${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}` : 'Complet — liste d’attente',
  ];

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F2EEE8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F2EEE8;">
<tr><td align="center" style="padding:36px 14px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border:1px solid #E7E2DB;border-radius:8px;overflow:hidden;">

  <tr><td style="background-color:#161514;padding:26px 36px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="52" valign="middle">
        <img src="${esc(logoUrl)}" width="52" height="52" alt="SLUC Business Club Nancy" style="display:block;border-radius:6px;background-color:#FFFFFF;">
      </td>
      <td valign="middle" style="padding-left:16px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;color:#FFFFFF;line-height:1.1;">Business Club</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#E0777A;font-weight:bold;padding-top:4px;">SLUC Nancy</div>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:40px 36px 32px;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#C1272D;font-weight:bold;padding-bottom:16px;">Invitation &middot; Rencontre</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;color:#1B1B1B;padding-bottom:18px;">${esc(r.titre)}</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#5A544E;padding-bottom:26px;">${esc(r.description)}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAF8F5;border-left:3px solid #C1272D;">
      <tr><td style="padding:18px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5A544E;line-height:1.9;">
        ${infoLines.join('<br>')}
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" style="padding:30px 0 0;">
        <a href="${esc(inscriptionUrl)}" style="display:inline-block;background-color:#C1272D;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:15px 40px;border-radius:3px;">Je m'inscris &agrave; la rencontre</a>
      </td>
    </tr></table>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9A938B;text-align:center;padding-top:16px;line-height:1.6;">R&eacute;serv&eacute; aux membres &agrave; jour de leur adh&eacute;sion pour la saison en cours.</div>
  </td></tr>

  <tr><td style="background-color:#0F0E0D;padding:24px 36px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#B7AFA6;line-height:1.8;">
    Business Club SLUC Nancy &middot; Palais des Sports Jean Weille, Nancy<br>
    <a href="mailto:contact@sluc-businessclub.fr" style="color:#E0777A;text-decoration:none;">contact@sluc-businessclub.fr</a>
  </td></tr>

</table>

<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9A938B;padding-top:18px;max-width:600px;">
  Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br>
  <a href="${esc(inscriptionUrl)}" style="color:#C1272D;text-decoration:underline;word-break:break-all;">${esc(inscriptionUrl)}</a>
</div>

</td></tr>
</table>
</body>
</html>`;

  return { subject, html, inscriptionUrl };
}
