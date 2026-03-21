import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User } from "lucide-react";
import CVPreview from "./CVPreview";
import type { CVData, ChatMessage } from "./types";
import { defaultCV, uid } from "./types";
import { toast } from "sonner";

// Simulated AI conversation flow — extracts CV data from user messages
const INITIAL_MSG: ChatMessage = {
  id: "init",
  role: "assistant",
  content: "Hey! I'm going to help you build an amazing CV. Let's start simple — what's your name and what kind of role are you looking for?",
};

const FOLLOW_UPS = [
  "Great! Now tell me about your most recent work experience — company, role, and what you did there.",
  "Awesome. Do you have any more work experience to add? If not, let's move on to education.",
  "What about your education? Where did you study and what degree did you earn?",
  "Almost there! List some of your key skills — things like programming languages, tools, or soft skills.",
  "Your CV is looking solid! Add your email, phone, and location so employers can reach you. You can also write a short professional summary.",
  "Looking great! You can keep adding details or save your CV when you're ready.",
];

function extractDataFromMessages(messages: ChatMessage[]): CVData {
  const cv: CVData = JSON.parse(JSON.stringify(defaultCV));
  const userMsgs = messages.filter((m) => m.role === "user").map((m) => m.content);

  // Simple heuristic extraction from conversation
  if (userMsgs[0]) {
    const first = userMsgs[0];
    // Try to extract name — first line or before common delimiters
    const nameMatch = first.match(/(?:(?:i'm|i am|my name is|name is|name:)\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)
      || first.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m);
    if (nameMatch) cv.personal.name = nameMatch[1].trim();

    const roleMatch = first.match(/(?:looking for|role|position|job|work as|want to be)\s+(?:a\s+)?(.+?)(?:\.|$)/i);
    if (roleMatch) cv.personal.title = roleMatch[1].trim();
    // Fallback: if no role keyword, take text after name mention
    if (!cv.personal.title && cv.personal.name) {
      const afterName = first.slice(first.toLowerCase().indexOf(cv.personal.name.toLowerCase()) + cv.personal.name.length);
      const fallback = afterName.replace(/^[\s,.-]+/, "").split(/[.!?\n]/)[0].trim();
      if (fallback.length > 3 && fallback.length < 60) cv.personal.title = fallback;
    }
  }

  // Experience from second message
  if (userMsgs[1]) {
    const txt = userMsgs[1];
    const companyMatch = txt.match(/(?:at|company|worked at|for)\s+([A-Z][\w\s&]+?)(?:[,.]|\s+as)/i);
    const roleMatch = txt.match(/(?:as a|role:|position:|was a)\s+(.+?)(?:[,.]|$)/im);
    cv.experience.push({
      id: uid(),
      company: companyMatch?.[1]?.trim() || "",
      role: roleMatch?.[1]?.trim() || "",
      startDate: "",
      endDate: "Present",
      description: txt.length > 30 ? txt : "",
    });
  }

  // Education from third or fourth message
  const eduMsg = userMsgs[3] || userMsgs[2];
  if (eduMsg) {
    const schoolMatch = eduMsg.match(/(?:at|from|studied at|university|college)\s+(.+?)(?:[,.]|$)/i);
    const degreeMatch = eduMsg.match(/(?:degree|studied|b\.?s\.?|m\.?s\.?|bachelor|master|ph\.?d)\s*(?:in\s+)?(.+?)(?:[,.]|$)/i);
    if (schoolMatch || degreeMatch) {
      cv.education.push({
        id: uid(),
        school: schoolMatch?.[1]?.trim() || "",
        degree: degreeMatch?.[1]?.trim() || "",
        startDate: "",
        endDate: "",
      });
    }
  }

  // Skills from fourth or fifth message
  const skillsMsg = userMsgs[4] || userMsgs[3];
  if (skillsMsg) {
    const items = skillsMsg.split(/[,;\n]+/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 40);
    cv.skills = items.slice(0, 15);
  }

  // Contact info from fifth or sixth message
  const contactMsg = userMsgs[5] || userMsgs[4];
  if (contactMsg) {
    const emailMatch = contactMsg.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) cv.personal.email = emailMatch[0];
    const phoneMatch = contactMsg.match(/[\d+][\d\s()-]{6,}/);
    if (phoneMatch) cv.personal.phone = phoneMatch[0].trim();
    const locMatch = contactMsg.match(/(?:location|based in|live in|from)\s+(.+?)(?:[,.]|$)/i);
    if (locMatch) cv.personal.location = locMatch[1].trim();
    // Summary: take remaining text as summary
    const remaining = contactMsg.replace(emailMatch?.[0] || "", "").replace(phoneMatch?.[0] || "", "").replace(locMatch?.[0] || "", "").trim();
    if (remaining.length > 20) cv.personal.summary = remaining;
  }

  return cv;
}

const ChatToBuild = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MSG]);
  const [input, setInput] = useState("");
  const [cvData, setCvData] = useState<CVData>(defaultCV);
  const [followUpIdx, setFollowUpIdx] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");

    // Extract CV data
    const newData = extractDataFromMessages(updated);
    setCvData(newData);

    // Simulate AI response after short delay
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: FOLLOW_UPS[Math.min(followUpIdx, FOLLOW_UPS.length - 1)],
      };
      setMessages((prev) => [...prev, aiMsg]);
      setFollowUpIdx((i) => i + 1);
    }, 800);
  };

  const handleSave = () => {
    const saved = JSON.parse(localStorage.getItem("craftcv-list") || "[]");
    saved.push({ id: uid(), name: cvData.personal.name || "Untitled CV", data: cvData, createdAt: new Date().toISOString() });
    localStorage.setItem("craftcv-list", JSON.stringify(saved));
    toast.success("CV saved successfully!");
  };

  return (
    <div className="grid lg:grid-cols-[3fr_2fr] gap-6 h-[calc(100vh-220px)] min-h-[500px]">
      {/* Chat panel */}
      <div className="flex flex-col bg-card rounded-2xl border border-border overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
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
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type your response..."
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:brightness-110 active:scale-[0.97] disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live CV Preview */}
      <div className="hidden lg:flex flex-col min-h-0">
        <CVPreview data={cvData} onSave={handleSave} showSave />
      </div>
    </div>
  );
};

export default ChatToBuild;
