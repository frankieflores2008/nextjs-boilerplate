"use client";
import { useState, useRef, useEffect } from "react";
import Script from "next/script";

const SYSTEM_PROMPT = `You are a math tutor for students at Gavilan College. You are warm, patient, and encouraging.

TYPE 1 — EXPLAIN OR DEMONSTRATE: Use for "what is", "convert", "show me". Give a clear explanation with a worked example.
TYPE 2 — HELP ME SOLVE: Use ONLY when a student is stuck on their own work. Use the Socratic method. Never solve it for them.

GENERAL RULES:
1. Keep responses concise (3-5 sentences).
2. ALWAYS use LaTeX delimiters for EVERY number, variable, or fraction.
3. Use \\\\( ... \\\\) for inline math and \\\\[ ... \\\\] for block math.
   - Example: "The fraction is \\\\( \\\\frac{1}{2} \\\\)."
   - Example: "Let's look at the variable \\\\( x \\\\)."`;

type Message = { role: "user" | "assistant"; content: string; model?: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your Gavilan math tutor. What problem are you working on today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Updated MathJax logic: Re-typeset whenever messages change
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).MathJax) {
      (window as any).MathJax.typesetPromise?.();
    }
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: SYSTEM_PROMPT, messages: newMessages }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Something went wrong.";
      
      setMessages([...newMessages, {
        role: "assistant",
        content: reply,
        model: data.model_used,
      }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Network error." }]);
    }
    setLoading(false);
  }

  return (
    <div className="page">
      <Script
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Initialize MathJax configuration if needed
          (window as any).MathJax = {
            tex: { inlineMath: [['\\(', '\\)'], ['$', '$']] },
            svg: { fontCache: 'global' }
          };
        }}
      />
      
      <main className="main">
        <div className="chat-card">
          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                <div className="bubble-wrap">
                  <div
                    className="bubble"
                    dangerouslySetInnerHTML={{ __html: m.content }}
                  />
                </div>
              </div>
            ))}
            {loading && <div className="thinking">...</div>}
            <div ref={bottomRef}/>
          </div>

          <div className="input-area">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Ask a math question..."
            />
            <button onClick={send} disabled={loading}>Send</button>
          </div>
        </div>
      </main>
    </div>
  );
}
