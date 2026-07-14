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
  // A dedicated route is more reliable from Outlook than a homepage query
  // string: redirects, tracking filters and cached homepages can drop it.
  const inscriptionUrl = `${baseUrl}/inscription/${r.id}`;
  const logoUrl = `${baseUrl}/assets/logo.jpg`;
  const subject = `Invitation — ${r.titre} · ${dateStr}`;

  const infoLines = [
    `<strong style="color:#1B1B1B;">${esc(dateStr.charAt(0).toUpperCase() + dateStr.slice(1))}</strong>`,
    [r.heure && esc(r.heure), esc(r.lieu)].filter(Boolean).join(' &mdash; '),
    restantes > 0
      ? `${restantes} place${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}`
      : 'Complet &mdash; liste d&rsquo;attente',
    r.participants_par_compte
      ? `${r.participants_par_compte} participant${r.participants_par_compte > 1 ? 's' : ''} maximum par compte membre`
      : '',
  ].filter(Boolean);

  // Spacing belongs on table cells: Outlook's Word renderer commonly drops
  // padding and margins applied to div/p elements when HTML is pasted.
  const para = (text, extra = '') =>
    text
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:25px;mso-line-height-rule:exactly;color:#5A544E;${extra}">${escML(text)}</td></tr></table>`
      : '';

  // A table-backed CTA survives rich-text paste into Outlook. In particular,
  // the visible label remains a normal <a href>, whereas VML hyperlinks are
  // commonly stripped when Outlook receives them through the clipboard.
  const ctaButton = (url, label) => `
        <table role="presentation" width="300" cellpadding="0" cellspacing="0" border="0" style="width:300px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
          <tr>
            <td width="300" height="48" align="center" valign="middle" bgcolor="#C1272D" style="width:300px;height:48px;background-color:#C1272D;text-align:center;">
              <p align="center" style="margin:0;text-align:center;line-height:48px;mso-line-height-rule:exactly;">
                <a href="${esc(url)}" target="_blank" title="Ouvrir l'inscription" style="display:inline-block;width:300px;line-height:48px;color:#FFFFFF !important;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-align:center;text-decoration:none !important;-webkit-text-size-adjust:none;"><span style="color:#FFFFFF !important;text-decoration:none !important;"><font face="Arial, Helvetica, sans-serif" color="#FFFFFF">${label}</font></span></a>
              </p>
            </td>
          </tr>
        </table>`;

  const html = `<!doctype html>
<html lang="fr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(subject)}</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<style>table { border-collapse:collapse; } td { font-family:Arial,Helvetica,sans-serif; }</style>
<![endif]-->
</head>
<body bgcolor="#F2EEE8" style="margin:0;padding:0;background-color:#F2EEE8;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table id="sbc-email-root" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F2EEE8" style="width:100%;background-color:#F2EEE8;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
<tr><td align="center" valign="top" style="padding:36px 14px;">

<!--[if mso]><table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="width:100%;max-width:620px;background-color:#FFFFFF;border:1px solid #E7E2DB;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">

  <tr><td bgcolor="#161514" style="background-color:#161514;padding:26px 40px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr>
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td style="padding-bottom:18px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:14px;letter-spacing:2.5px;text-transform:uppercase;color:#C1272D;font-weight:bold;">Invitation &middot; Rencontre</td></tr></table>
    ${t.greeting ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td style="padding-bottom:14px;font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:23px;color:#1B1B1B;">${escML(t.greeting)}</td></tr></table>` : ''}
    ${para(t.intro, 'padding-bottom:26px;')}
  </td></tr>

  <tr><td style="padding:0 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FAF8F5" style="width:100%;background-color:#FAF8F5;border:1px solid #E7E2DB;border-left:3px solid #C1272D;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
      <tr><td bgcolor="#FAF8F5" style="padding:26px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td style="padding-bottom:12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:29px;color:#1B1B1B;">${esc(r.titre)}</td></tr></table>
        ${r.description ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td style="padding-bottom:16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:23px;mso-line-height-rule:exactly;color:#5A544E;">${esc(r.description)}</td></tr></table>` : ''}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr>
          <td style="border-top:1px solid #E7E2DB;padding-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5A544E;line-height:1.9;">
            ${infoLines.join('<br>')}
          </td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:6px 40px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr>
      <td align="center" style="padding:28px 0 0;">
        ${ctaButton(inscriptionUrl, "Je m'inscris &agrave; la rencontre")}
      </td>
    </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td align="center" style="padding-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#9A938B;">R&eacute;serv&eacute; aux membres &agrave; jour de leur adh&eacute;sion pour la saison en cours.</td></tr></table>
  </td></tr>

  <tr><td style="padding:28px 40px 38px;">
    ${para(t.outro, t.signature ? 'padding-bottom:24px;' : '')}
    ${t.signature ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:26px;color:#1B1B1B;">${escML(t.signature)}</td></tr></table>` : ''}
  </td></tr>

  <tr><td bgcolor="#0F0E0D" style="background-color:#0F0E0D;padding:24px 40px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#B7AFA6;line-height:22px;">
    Business Club SLUC Nancy &middot; Palais des Sports Jean Weille, Nancy<br>
    <a href="mailto:contact@sluc-businessclub.fr" style="color:#E0777A;text-decoration:none;">contact@sluc-businessclub.fr</a>
  </td></tr>

</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td style="padding-top:18px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:17px;color:#9A938B;">
  Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br>
  <a href="${esc(inscriptionUrl)}" style="color:#C1272D;text-decoration:underline;word-break:break-all;">${esc(inscriptionUrl)}</a>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->

</td></tr>
</table>
</body>
</html>`;

  return { subject, html, inscriptionUrl, texts: t };
}
