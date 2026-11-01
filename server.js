import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(",") : true }));
app.use(express.json({ limit: "40kb" }));
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/", (_req, res) => res.json({ service: "BTD Global API", status: "online" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  try {
    if (!API_KEY) return res.status(503).json({ error: "AI service is not configured. Add OPENAI_API_KEY to the server environment." });

    const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const messages = incoming
      .filter(m => ["user", "assistant"].includes(m?.role) && typeof m?.content === "string")
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content.slice(0, 3000) }));

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return res.status(400).json({ error: "Send a user message to start the conversation." });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: "You are BTD AI, the helpful assistant for BTD Global — Build The Destiny, an India-born innovation initiative. Be clear, encouraging, honest and practical. Help with AI, science, inventions, robotics, education, agriculture, environmental ideas and everyday problem solving. Do not claim BTD has launched products or achieved results unless the user provides evidence. Explain risks and encourage safe, supervised experiments. Keep answers suitable for a broad audience.",
        input: messages,
        max_output_tokens: 900
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI API error:", data?.error?.message || response.status);
      return res.status(response.status === 429 ? 429 : 502).json({
        error: data?.error?.message || "The AI provider could not complete the request."
      });
    }

    const answer = (data.output || [])
      .filter(item => item.type === "message")
      .flatMap(item => item.content || [])
      .filter(part => part.type === "output_text")
      .map(part => part.text)
      .join("\n")
      .trim();

    return res.json({ answer: answer || "I couldn't create a reply. Please try again." });
  } catch (error) {
    console.error("Chat route error:", error.message);
    return res.status(500).json({ error: "Something went wrong on the BTD AI server." });
  }
});

app.listen(PORT, () => console.log(`BTD Global API listening on ${PORT}`));
