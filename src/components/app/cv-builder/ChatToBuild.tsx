import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Eye, EyeOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import CVPreview from "./CVPreview";
import type { CVData, ChatMessage } from "./types";
import { defaultCV, uid } from "./types";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cv-chat`;

const INITIAL_MSG: ChatMessage = {
  id: "init",
  role: "assistant",
  content:
    "Hey! I'm going to help you build an amazing CV. Let's start simple — what's your name and what kind of role are you looking for?",
};

function extractCvData(text: string): CVData | null {
  const match = text.match(/```cv-data\s*\n([\s\S]*?)```/);
  if (!match) return null;
  try {
    const raw = JSON.parse(match[1]);
    return {
      personal: { ...defaultCV.personal, ...raw.personal },
      experience: (raw.experience || []).map((e: any, i: number) => ({
        id: `exp-${i}`, company: e.company || "", role: e.role || "",
        startDate: e.startDate || "", endDate: e.endDate || "Present", description: e.description || "",
      })),
      education: (raw.education || []).map((e: any, i: number) => ({
        id: `edu-${i}`, school: e.school || "", degree: e.degree || "",
        startDate: e.startDate || "", endDate: e.endDate || "",
      })),
      skills: raw.skills || [],
      projects: (raw.projects || []).map((p: any, i: number) => ({
        id: `proj-${i}`, name: p.name || "", description: p.description || "",
        techStack: p.techStack || [], link: p.link || "",
      })),
      certifications: (raw.certifications || []).map((c: any, i: number) => ({
        id: `cert-${i}`, name: c.name || "", issuer: c.issuer || "", date: c.date || "",
      })),
      extracurriculars: raw.extracurriculars || [],
    };
  } catch { return null; }
}

function stripCvDataBlock(text: string): string {
  return text.replace(/```cv-data\s*\n[\s\S]*?```/g, "").trim();
}

const ChatToBuild = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MSG]);
  const [input, setInput] = useState("");
  const [cvData, setCvData] = useState<CVData>(defaultCV);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const apiMessages = updatedMessages
      .filter((m) => m.id !== "init" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: m.role === "assistant" ? stripCvDataBlock(m.content) : m.content,
      }));

    if (updatedMessages.length === 2) {
      apiMessages.unshift({ role: "assistant", content: INITIAL_MSG.content });
    }

    let assistantContent = "";
    const assistantId = uid();

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${resp.status})`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id === assistantId) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { id: assistantId, role: "assistant", content: assistantContent }];
              });

              const extracted = extractCvData(assistantContent);
              if (extracted) setCvData(extracted);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) assistantContent += content;
          } catch {}
        }
      }

      const finalData = extractCvData(assistantContent);
      if (finalData) setCvData(finalData);

      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: assistantContent } : m)
      );
    } catch (err: any) {
      console.error("Chat error:", err);
      toast.error(err.message || "Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleSave = () => {
    const saved = JSON.parse(localStorage.getItem("craftcv-list") || "[]");
    saved.push({
      id: uid(),
      name: cvData.personal.name || "Untitled CV",
      data: cvData,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("craftcv-list", JSON.stringify(saved));
    toast.success("CV saved successfully!");
  };

  const displayContent = (msg: ChatMessage) => stripCvDataBlock(msg.content);

  return (
    <div className="relative">
      {/* Mobile preview toggle */}
      {isMobile && (
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="mb-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium transition-all hover:bg-primary/20"
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? "Hide Preview" : "Show CV Preview"}
        </button>
      )}

      {/* Mobile preview overlay */}
      {isMobile && showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="mb-4"
        >
          <CVPreview data={cvData} onSave={handleSave} showSave />
        </motion.div>
      )}

      <div className="grid lg:grid-cols-[3fr_2fr] gap-6 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Chat panel */}
        <div className="flex flex-col bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const content = displayContent(msg);
                if (!content) return null;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md"
                      }`}
                    >
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-1">{children}</ol>,
                          li: ({ children }) => <li className="mb-0.5">{children}</li>,
                          code: ({ children }) => <code className="bg-black/10 rounded px-1 text-xs">{children}</code>,
                        }}
                      >
                        {content}
                      </ReactMarkdown>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-secondary text-secondary-foreground rounded-bl-md">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type your response..."
                disabled={isLoading}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:brightness-110 active:scale-[0.97] disabled:opacity-40"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop CV Preview */}
        <div className="hidden lg:flex flex-col min-h-0">
          <CVPreview data={cvData} onSave={handleSave} showSave showDownload />
        </div>
      </div>
    </div>
  );
};

export default ChatToBuild;
