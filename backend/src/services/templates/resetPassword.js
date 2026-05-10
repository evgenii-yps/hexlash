/**
 * Reset password template — HTML with inline CSS + plain text fallback.
 *
 * Same design constraints as verifyEmail.js: max-width 600px centered,
 * inline CSS only, no logo/brand. Adds explicit footer about ignoring
 * unrequested email (security best practice — attacker triggering
 * reset on victim's email should not cause victim's password loss).
 *
 * Email Auth Phase 2.
 */

function resetPasswordTemplate({ url }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your Hexlash password</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;padding:40px;">
          <tr>
            <td>
              <h1 style="margin:0 0 24px 0;color:#1a1a1a;font-size:24px;font-weight:600;line-height:1.3;">Reset your password</h1>
              <p style="margin:0 0 24px 0;color:#4a4a4a;font-size:16px;line-height:1.5;">
                We received a request to reset the password for your Hexlash account. Click the button below to choose a new password.
              </p>
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
                <tr>
                  <td style="border-radius:6px;background-color:#0066cc;">
                    <a href="${url}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:500;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;color:#888888;font-size:14px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px 0;color:#0066cc;font-size:14px;word-break:break-all;">
                ${url}
              </p>
              <p style="margin:0 0 8px 0;color:#888888;font-size:13px;border-top:1px solid #eee;padding-top:24px;line-height:1.5;">
                This link expires in 1 hour.
              </p>
              <p style="margin:0;color:#888888;font-size:13px;line-height:1.5;">
                If you didn't request this, ignore this email — your password will not be changed.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { resetPasswordTemplate };
