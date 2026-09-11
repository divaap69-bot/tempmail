/**
 * Cloudflare Email Worker
 * ─────────────────────────────────────────────────────────────────────────────
 * Worker ini menerima email masuk melalui Cloudflare Email Routing,
 * mem-parse isinya, dan mengirimkan ke webhook endpoint website kamu.
 *
 * CARA SETUP:
 * 1. Install Wrangler: npm install -g wrangler
 * 2. Login: wrangler login
 * 3. Edit WEBHOOK_URL dan WEBHOOK_SECRET di wrangler.toml
 * 4. Deploy: wrangler deploy
 * 5. Di Cloudflare Dashboard → Email → Email Routing → Routing Rules
 *    Tambahkan rule: Catch-all → Send to Worker → pilih worker ini
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import PostalMime from 'postal-mime';

export default {
  /**
   * @param {ForwardableEmailMessage} message
   * @param {object} env
   */
  async email(message, env) {
    const WEBHOOK_URL = env.WEBHOOK_URL;
    const WEBHOOK_SECRET = env.WEBHOOK_SECRET;

    if (!WEBHOOK_URL || !WEBHOOK_SECRET) {
      console.error('[EmailWorker] WEBHOOK_URL or WEBHOOK_SECRET not configured');
      message.setReject('Configuration error');
      return;
    }

    try {
      // Read the raw email stream
      const rawEmail = await streamToArrayBuffer(message.raw, message.rawSize);

      // Parse email
      const parser = new PostalMime();
      const parsed = await parser.parse(rawEmail);

      // Build payload
      const payload = {
        from: message.from,
        to: message.to,
        subject: parsed.subject || '(Tanpa Subjek)',
        html: parsed.html || null,
        text: parsed.text || null,
        messageId: parsed.messageId || null,
        date: parsed.date || new Date().toISOString(),
        size: message.rawSize,
      };

      // Send to webhook
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${WEBHOOK_SECRET}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error(`[EmailWorker] Webhook error ${res.status}:`, body);
      } else {
        console.log(`[EmailWorker] Email delivered: from=${message.from} to=${message.to}`);
      }
    } catch (err) {
      console.error('[EmailWorker] Error processing email:', err);
      // Don't reject — just log, so the email isn't bounced back
    }
  },
};

/**
 * Convert a ReadableStream to ArrayBuffer
 * @param {ReadableStream} stream
 * @param {number} streamSize
 * @returns {Promise<ArrayBuffer>}
 */
async function streamToArrayBuffer(stream, streamSize) {
  const result = new Uint8Array(streamSize);
  let bytesRead = 0;
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result.set(value, bytesRead);
    bytesRead += value.length;
  }
  return result.buffer;
}
