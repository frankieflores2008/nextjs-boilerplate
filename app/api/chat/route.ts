import { NextRequest, NextResponse } from "next/server";

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

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: geminiMessages,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", JSON.stringify(data));
      return NextResponse.json(
        { error: data.error?.message || "Gemini API error" },
        { status: response.status }
      );
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Something went wrong, please try again.";

    return NextResponse.json({
      content: [{ text: replyText }]
    });

  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json(
      { error: "Server error: " + String(err) },
      { status: 500 }
    );
  }
}
