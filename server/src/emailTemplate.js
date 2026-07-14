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

// Multi-line text zones (intro, outro, signature) keep their line breaks.
function escML(v) {
  return esc(v).replace(/\r?\n/g, '<br>');
}

// Default wording of each editable zone. The admin can rewrite any of
// them in the composer; clearing a field removes the block entirely.
export function defaultEmailTexts() {
  return {
    greeting: 'Chère membre, cher membre,',
    intro:
      "Nous avons le plaisir de vous convier à notre prochaine rencontre du Business Club. "
      + "Networking, échanges et convivialité : nous vous attendons nombreux, dans l'esprit "
      + "d'équipe qui fait la force du Club.",
    outro:
      "Les places sont limitées — pensez à vous inscrire dès maintenant. N'hésitez pas à "
      + "transférer cette invitation à un dirigeant de votre réseau qui souhaiterait découvrir le Club.",
    signature: "À très bientôt,\nL'équipe du Business Club SLUC Nancy",
  };
}

export function buildInvitationEmail({ rencontre, baseUrl, texts = {} }) {
  const r = rencontre;
  const defaults = defaultEmailTexts();
  // undefined -> default wording; '' (cleared by the admin) -> block hidden
  const t = {
    greeting: texts.greeting ?? defaults.greeting,
    intro: texts.intro ?? defaults.intro,
    outro: texts.outro ?? defaults.outro,
    signature: texts.signature ?? defaults.signature,
  };

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
    [r.heure && esc(r.heure), esc(r.lieu)].filter(Boolean).join(' &mdash; '),
    restantes > 0
      ? `${restantes} place${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}`
      : 'Complet &mdash; liste d&rsquo;attente',
  ].filter(Boolean);

  const para = (text, extra = '') =>
    text
      ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#5A544E;${extra}">${escML(text)}</div>`
      : '';

  // "Bulletproof" CTA button. Outlook (Word engine) ignores padding and
  // display:inline-block on <a>, collapsing the button to a plain link, so
  // it needs a VML roundrect. Other clients get the styled <a>, sized with
  // a fixed width + line-height (not padding) so both paths match. The
  // conditional comments are inert HTML comments in normal renderers.
  const ctaButton = (url, label) => `
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(url)}" style="height:48px;v-text-anchor:middle;width:300px;" arcsize="7%" fillcolor="#C1272D" strokecolor="#C1272D">
          <w:anchorlock/>
          <center style="color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">${label}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${esc(url)}" target="_blank" style="display:inline-block;width:300px;line-height:48px;background-color:#C1272D;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-align:center;text-decoration:none;border-radius:3px;-webkit-text-size-adjust:none;mso-hide:all;">${label}</a>
        <!--<![endif]-->`;

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

<table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;background-color:#FFFFFF;border:1px solid #E7E2DB;border-radius:8px;overflow:hidden;">

  <tr><td style="background-color:#161514;padding:26px 40px;">
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

  <tr><td style="padding:40px 40px 12px;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#C1272D;font-weight:bold;padding-bottom:18px;">Invitation &middot; Rencontre</div>
    ${t.greeting ? `<div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;color:#1B1B1B;padding-bottom:14px;">${escML(t.greeting)}</div>` : ''}
    ${para(t.intro, 'padding-bottom:26px;')}
  </td></tr>

  <tr><td style="padding:0 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAF8F5;border:1px solid #E7E2DB;border-left:3px solid #C1272D;border-radius:4px;">
      <tr><td style="padding:26px 28px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.2;color:#1B1B1B;padding-bottom:12px;">${esc(r.titre)}</div>
        ${r.description ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14.5px;line-height:1.65;color:#5A544E;padding-bottom:16px;">${esc(r.description)}</div>` : ''}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="border-top:1px solid #E7E2DB;padding-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5A544E;line-height:1.9;">
            ${infoLines.join('<br>')}
          </td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:6px 40px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" style="padding:28px 0 0;">
        ${ctaButton(inscriptionUrl, "Je m'inscris &agrave; la rencontre")}
      </td>
    </tr></table>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9A938B;text-align:center;padding-top:14px;line-height:1.6;">R&eacute;serv&eacute; aux membres &agrave; jour de leur adh&eacute;sion pour la saison en cours.</div>
  </td></tr>

  <tr><td style="padding:28px 40px 38px;">
    ${para(t.outro, t.signature ? 'padding-bottom:24px;' : '')}
    ${t.signature ? `<div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;color:#1B1B1B;">${escML(t.signature)}</div>` : ''}
  </td></tr>

  <tr><td style="background-color:#0F0E0D;padding:24px 40px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#B7AFA6;line-height:1.8;">
    Business Club SLUC Nancy &middot; Palais des Sports Jean Weille, Nancy<br>
    <a href="mailto:contact@sluc-businessclub.fr" style="color:#E0777A;text-decoration:none;">contact@sluc-businessclub.fr</a>
  </td></tr>

</table>

<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9A938B;padding-top:18px;max-width:620px;">
  Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br>
  <a href="${esc(inscriptionUrl)}" style="color:#C1272D;text-decoration:underline;word-break:break-all;">${esc(inscriptionUrl)}</a>
</div>

</td></tr>
</table>
</body>
</html>`;

  return { subject, html, inscriptionUrl, texts: t };
}
