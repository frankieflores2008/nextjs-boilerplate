"use client";
import { useState, useRef, useEffect } from "react";
import Script from "next/script";

const SYSTEM_PROMPT = `You are a math tutor for students at Gavilan College in Gilroy, California. You are warm, patient, and encouraging.

You handle two types of requests differently:

TYPE 1 — EXPLAIN OR DEMONSTRATE:
Use this mode when a student asks "what is...", "can you explain...",
"show me an example of...", "how does... work", "convert...", "what is X as a Y"
(e.g. "what is 0.5 as a fraction"), or asks you to demonstrate anything.
Give a clear, helpful explanation with a worked example. Show the full answer.
Use proper math formatting.

TYPE 2 — HELP ME SOLVE MY OWN PROBLEM:
Use this mode ONLY when a student is clearly working on their own problem and
wants help getting to the answer themselves — phrases like "I need to solve...",
"I'm stuck on...", "help me with...", or "how do I solve...".
Use the Socratic method. Never solve it for them. Ask guiding questions that
help them discover each step themselves. If they're stuck, ask a simpler question.
If they get something right, acknowledge it warmly and ask what comes next.
If they make an error, don't correct them directly — ask a question that helps
them see the mistake.

WHEN IN DOUBT between Type 1 and Type 2, default to Type 1 and explain fully.
GENERAL RULES:
1. Keep responses concise — 3 to 5 sentences max.
2. Never be condescending or impatient.
3. You cover all Gavilan math levels: arithmetic, pre-algebra, algebra, geometry, trig, pre-calc, calculus, statistics, and linear algebra.
4. When writing math expressions always use LaTeX delimiters. Every variable, number, or equation must be wrapped. Never write a bare variable like x or y — always write \\( x \\) or \\( y \\). Examples:
   - A variable: \\( x \\)
   - An equation: \\( x^2 + 5x + 6 = 0 \\)
   - A fraction: \\( \\frac{x}{2} = 4 \\)
   - Display math: \\[ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\]`;

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

   useEffect(() => {
    if (typeof window === "undefined") return;
    const mjx = (window as any).MathJax;
    if (!mjx) return;
    const bubbles = document.querySelectorAll(".bubble:not([data-rendered])");
    if (bubbles.length === 0) return;
    mjx.typesetPromise?.(Array.from(bubbles)).then(() => {
      bubbles.forEach(el => {
        el.setAttribute("data-rendered", "true");
        const idx = Number((el as HTMLElement).dataset.index);
        setMessages(prev => prev.map((m, i) =>
          i === idx ? { ...m, content: el.innerHTML } : m
        ));
      });
    });
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
      const reply = data.content?.[0]?.text || "Something went wrong, please try again.";
      setMessages([...newMessages, {
        role: "assistant",
        content: reply,
        model: data.model_used,
      }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Network error — please try again." }]);
    }
    setLoading(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const topics = ["Arithmetic","Pre-Algebra","Algebra","Geometry","Trigonometry","Pre-Calculus","Calculus","Statistics","Linear Algebra"];

  return (
    <div className="page">
      <Script
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        strategy="afterInteractive"
      />
      <header className="header">
        <div className="logo">
          <div className="logo-mark">G</div>
          <div>
            <div className="logo-title">Gavilan Math Tutor</div>
            <div className="logo-sub">Socratic method · All levels</div>
          </div>
        </div>
        <div className="badge">Free · No login needed</div>
      </header>

      <main className="main">
        <div className="hero">
          <h1>Let&apos;s figure it out<br /><em>together.</em></h1>
          <p className="hero-sub">Bring any math problem. Your tutor won&apos;t give you the answer — it&apos;ll ask the right questions until <em>you</em> find it.</p>
        </div>

        <div className="chat-card">
          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                <div className="avatar">{m.role === "assistant" ? "T" : "S"}</div>
                <div className="bubble-wrap">
                  <div
                    className="bubble"
                    data-index={i}
                    dangerouslySetInnerHTML={{ __html: m.content }}
                  />
                  {m.role === "assistant" && m.model && (
                    <div className="model-tag">{m.model}</div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="avatar">T</div>
                <div className="thinking"><span/><span/><span/></div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div className="input-area">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Describe your math problem..."
              rows={1}
              disabled={loading}
            />
            <button onClick={send} disabled={loading || !input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="topics">
          <div className="topics-label">Covers all Gavilan math courses</div>
          <div className="chips">
            {topics.map(t => (
              <button key={t} className="chip" onClick={() => setInput(`I need help with a ${t} problem.`)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
