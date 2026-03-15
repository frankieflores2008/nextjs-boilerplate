import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { system, messages } = body;

    const filtered = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.content),
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: String(system),
        messages: filtered,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Claude API error:", JSON.stringify(data));
      return NextResponse.json(
        { error: data.error?.message || "Claude API error" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json(
      { error: "Server error: " + String(err) },
      { status: 500 }
    );
  }
}
