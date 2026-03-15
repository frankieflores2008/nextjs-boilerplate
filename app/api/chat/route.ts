import { NextRequest, NextResponse } from "next/server";
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { system, messages } = body;

    const geminiMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: String(m.content) }],
    }));

    for (const model of MODELS) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents: geminiMessages,
          }),
        }
      );

      if (response.status === 429 || response.status === 503 || response.status === 500) {
        console.log(`Model ${model} failed with ${response.status}, trying next...`);
        continue;
      }

      const data = await response.json();

      if (!response.ok) {
        console.error(`Error on ${model}:`, JSON.stringify(data));
        continue;
      }

      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text
        || "Something went wrong, please try again.";
      return NextResponse.json({
        content: [{ text: replyText }],
        model_used: model,
      });
    }

    return NextResponse.json(
      { error: "All models are rate limited. Please wait a moment and try again." },
      { status: 429 }
    );
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json(
      { error: "Server error: " + String(err) },
      { status: 500 }
    );
  }
}
