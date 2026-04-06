import "dotenv/config";
import express from "express";
import cors from "cors";
import { Resend } from "resend";
import twilio from "twilio";
import { AccessToken } from "livekit-server-sdk";

const app = express();
const port = process.env.PORT || 4000;

const publicAppUrl = process.env.PUBLIC_APP_URL || "http://localhost:8081";

app.use(cors({ origin: "*", credentials: false }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/invite/send", async (req, res) => {
  const { method, to, serverId, serverName, inviteCode } = req.body || {};
  if (!method || !to || !serverId || !serverName || !inviteCode) {
    return res.status(400).send("Missing required fields");
  }

  const inviteLink = `${publicAppUrl}/#/auth?invite=${inviteCode}`;
  const message = `You're invited to join "${serverName}" on N8. Join here: ${inviteLink}`;

  try {
    if (method === "email") {
      const resendKey = process.env.RESEND_API_KEY;
      const from = process.env.INVITE_FROM_EMAIL;
      if (!resendKey || !from) {
        return res.status(400).send("Resend email is not configured");
      }
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from,
        to,
        subject: `Invite to join ${serverName}`,
        text: message,
      });
      return res.json({ ok: true });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      return res.status(400).send("Twilio is not configured");
    }
    const client = twilio(accountSid, authToken);

    if (method === "sms") {
      const from = process.env.TWILIO_FROM_NUMBER;
      if (!from) return res.status(400).send("Twilio SMS sender is not configured");
      await client.messages.create({
        from,
        to,
        body: message,
      });
      return res.json({ ok: true });
    }

    if (method === "whatsapp") {
      const from = process.env.TWILIO_WHATSAPP_FROM;
      if (!from) return res.status(400).send("Twilio WhatsApp sender is not configured");
      await client.messages.create({
        from: `whatsapp:${from}`,
        to: `whatsapp:${to}`,
        body: message,
      });
      return res.json({ ok: true });
    }

    return res.status(400).send("Unsupported invite method");
  } catch (err) {
    const messageText = err instanceof Error ? err.message : "Invite failed";
    return res.status(500).send(messageText);
  }
});

app.get("/livekit/token", async (req, res) => {
  const { room, identity, name } = req.query;
  if (!room || !identity || !name) {
    return res.status(400).send("Missing room, identity, or name");
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !url) {
    return res.status(400).send("LiveKit is not configured");
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, { identity, name });
    at.addGrant({ roomJoin: true, room });
    const token = await at.toJwt();
    return res.json({ token, url });
  } catch (err) {
    const messageText = err instanceof Error ? err.message : "Failed to create token";
    return res.status(500).send(messageText);
  }
});

app.listen(port, () => {
  console.log(`N8 backend running on port ${port}`);
});
