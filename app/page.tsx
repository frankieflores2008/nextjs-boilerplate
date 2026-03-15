"use client";
import { useState, useRef, useEffect } from "react";
import Script from "next/script";

const SYSTEM_PROMPT = `You are a Socratic math tutor for students at Gavilan College in Gilroy, California. Your role is to help students genuinely understand math — not to give them answers.

CORE RULES:
1. NEVER solve a problem directly for the student. Not even partially.
2. Always respond with a guiding question that helps them discover the next step themselves.
3. If a student is stuck, break it down — ask an even simpler question.
4. When a student gets something right, acknowledge it warmly and ask what comes next.
5. If a student makes an error, do not correct them directly. Ask a question that reveals the error.
6. Keep your tone warm, patient, and encouraging.
7. Keep responses concise — 2 to 4 sentences max.
8. NEVER write out a full solution. If asked for the answer, gently redirect with another question.
9. You cover all Gavilan math levels: arithmetic, pre-algebra, algebra, geometry, trig, pre-calc, calculus, statistics, and linear algebra.

When writing math, always use LaTeX wrapped in \\( \\) for inline math
or \\[ \\] for display math. Example: \\( 2x + 5 = 13 \\) or \\[ \\frac{x}{2} = 4 \\]`;
type Message = { role: "user" | "assistant"; content: string };

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
      setMessages([...newMessages, { role: "assistant", content: reply }]);
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
                 <div
                  className="bubble"
                  dangerouslySetInnerHTML={{ __html: m.content }}
                />
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
