function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function lines(value) {
  return esc(value).replace(/\r?\n/g, '<br>');
}

function paragraphBlocks(value) {
  return String(value ?? '')
    .split(/\r?\n\s*\r?\n/)
    .filter(Boolean)
    .map((paragraph, index, all) => `
      <tr><td style="padding-bottom:${index === all.length - 1 ? 0 : 18}px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:25px;mso-line-height-rule:exactly;color:#5A544E;">
        ${lines(paragraph)}
      </td></tr>`)
    .join('');
}

function ctaButton(url, label) {
  if (!url || !label) return '';
  return `
    <table role="presentation" width="300" cellpadding="0" cellspacing="0" border="0" style="width:300px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
      <tr><td width="300" height="48" align="center" valign="middle" bgcolor="#C1272D" style="width:300px;height:48px;background-color:#C1272D;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;">
        <center style="width:100%;text-align:center;line-height:48px;mso-line-height-rule:exactly;color:#FFFFFF;text-decoration:none;">
          <a class="sbc-cta" href="${esc(url)}" target="_blank" style="display:inline-block;color:#FFFFFF !important;mso-themecolor:background1;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;line-height:48px;text-align:center;text-decoration:none !important;text-underline:none;mso-style-priority:99;mso-style-textfill-type:solid;mso-style-textfill-fill-color:#FFFFFF;mso-style-textfill-fill-alpha:100%;"><span style="color:#FFFFFF !important;mso-themecolor:background1;text-decoration:none !important;text-underline:none;mso-style-textfill-type:solid;mso-style-textfill-fill-color:#FFFFFF;mso-style-textfill-fill-alpha:100%;"><font face="Arial, Helvetica, sans-serif" color="#FFFFFF" style="color:#FFFFFF !important;font-size:15px;text-decoration:none !important;text-underline:none;"><b>${esc(label)}</b></font></span></a>
        </center>
      </td></tr>
    </table>`;
}

export function buildCustomEmail({ content, baseUrl }) {
  const logoUrl = `${baseUrl}/assets/logo.jpg`;
  const button = ctaButton(content.buttonUrl, content.buttonLabel);
  const html = `<!doctype html>
<html lang="fr" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(content.subject)}</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<style>table { border-collapse:collapse; } td { font-family:Arial,Helvetica,sans-serif; }</style>
<![endif]-->
</head>
<body bgcolor="#F2EEE8" style="margin:0;padding:0;background-color:#F2EEE8;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<style type="text/css">a.sbc-cta,a.sbc-cta:link,a.sbc-cta:visited,a.sbc-cta:hover,a.sbc-cta:active{color:#FFFFFF!important;text-decoration:none!important;}a.sbc-cta span,a.sbc-cta font{color:#FFFFFF!important;text-decoration:none!important;}</style>
<table id="sbc-email-root" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F2EEE8" style="width:100%;background-color:#F2EEE8;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
<tr><td align="center" valign="top" style="padding:36px 14px;">
<!--[if mso]><table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="width:100%;max-width:620px;background-color:#FFFFFF;border:1px solid #E7E2DB;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
  <tr><td bgcolor="#161514" style="background-color:#161514;padding:26px 40px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr>
      <td width="52" valign="middle"><img src="${esc(logoUrl)}" width="52" height="52" alt="SLUC Business Club Nancy" style="display:block;background-color:#FFFFFF;"></td>
      <td valign="middle" style="padding-left:16px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;color:#FFFFFF;line-height:22px;">Business Club</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#E0777A;font-weight:bold;line-height:16px;">SLUC Nancy</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:40px 40px 16px;">
    ${content.kicker ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-bottom:16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:14px;letter-spacing:2.5px;text-transform:uppercase;color:#C1272D;font-weight:bold;">${esc(content.kicker)}</td></tr></table>` : ''}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-bottom:22px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:34px;color:#1B1B1B;">${esc(content.title)}</td></tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">${paragraphBlocks(content.body)}</table>
  </td></tr>
  ${button ? `<tr><td align="center" style="padding:18px 40px 12px;">${button}</td></tr>` : ''}
  ${content.signature ? `<tr><td style="padding:24px 40px 38px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:26px;color:#1B1B1B;">${lines(content.signature)}</td></tr>` : '<tr><td height="26" style="height:26px;line-height:26px;">&nbsp;</td></tr>'}
  <tr><td bgcolor="#0F0E0D" style="background-color:#0F0E0D;padding:24px 40px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#B7AFA6;line-height:22px;">
    Business Club SLUC Nancy &middot; Palais des Sports Jean Weille, Nancy<br>
    <a href="mailto:contact@sluc-businessclub.fr" style="color:#E0777A;text-decoration:none;">contact@sluc-businessclub.fr</a>
  </td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>`;

  return { subject: content.subject, html };
}
