import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, MessageSquare, X, Send, Trash2, ChevronRight, 
  HelpCircle, ShieldAlert, CheckCircle2, HeartPulse, Users, 
  Watch, CircleDot, FileText, BellRing, ExternalLink, Bot
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  links?: { label: string; path: string }[];
  timestamp: string;
}

const INITIAL_WELCOME: ChatMessage = {
  id: 'welcome',
  sender: 'assistant',
  text: "Hello! I am your PulseBridge Assistant. I can help guide you through account registration, switching between Patient and Caregiver roles, invitation codes, device preview, medical reports, and personalized alert rules.",
  links: [
    { label: "Family Care Hub", path: "/family" },
    { label: "Device Preview", path: "/devices" },
    { label: "Medical Reports", path: "/reports" }
  ],
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

const SUGGESTED_QUERIES = [
  "How does AFib analysis work?",
  "What is the AFib overview?",
  "What are the 11 AFib symptoms?",
  "How do invitation codes work?",
  "What are the 7 permissions?",
  "How to configure alert rules?"
];

// Knowledge base for structured product assistance
const KNOWLEDGE_RESPONSES: { keywords: string[]; answer: string; links?: { label: string; path: string }[] }[] = [
  {
    keywords: ["afib", "atrial fibrillation", "arrhythmia", "palpitations", "flutter", "irregular heartbeat", "irregular pulse"],
    answer: "The AFib Overview page provides comprehensive clinical information on Atrial Fibrillation (AFib), including its electrophysiological mechanisms, 4 clinical types (Paroxysmal, Persistent, Long-standing Persistent, Permanent), 11 recognized symptoms with 'Irregular heartbeat rhythm' as primary, verified global statistics (37.5-50M prevalence, 20-30% ischemic strokes), and dynamic integration with your patient's records.",
    links: [
      { label: "Open AFib Overview", path: "/afib" },
      { label: "Run AFib Patient Analysis", path: "/disease-analysis" }
    ]
  },
  {
    keywords: ["disease analysis", "analysis", "compare", "evaluate", "diagnose", "symptom comparison", "afib analysis"],
    answer: "Patient-Based AFib Analysis evaluates the patient's reported symptoms, uploaded ECG/Holter reports, cardiovascular history, and vital signs strictly and exclusively for Atrial Fibrillation (AFib). It provides transparent clinical reasoning, 5 standardized result labels (including 'ECG confirmation documented in uploaded records'), missing diagnostic flags, and urgent medical warning guidance.",
    links: [
      { label: "Open AFib Analysis", path: "/disease-analysis" },
      { label: "View AFib Overview", path: "/afib" }
    ]
  },
  {
    keywords: ["invitation", "code", "connect", "invite", "add patient", "pbd-"],
    answer: "Every Patient account generates a secure single-use invitation code (e.g. PBD-KU7W-M1P4) with 48-hour expiration. A Caregiver can redeem this code in the Family Care Hub to request access. The Patient then reviews the request and configures granular permissions before access is granted.",
    links: [
      { label: "Open Family Care Hub", path: "/family" },
      { label: "Sign In / Switch Account", path: "/login" }
    ]
  },
  {
    keywords: ["switch", "logout", "log out", "another account", "account switching"],
    answer: "To switch accounts, click the Logout icon in the top header. You will be redirected to the sign-in page where you or another evaluator can log in with a different email address or register a brand-new Patient or Caregiver account.",
    links: [
      { label: "Go to Login", path: "/login" },
      { label: "Register New Account", path: "/register" }
    ]
  },
  {
    keywords: ["device", "preview", "pairing", "ring", "watch", "bluetooth", "hardware"],
    answer: "PulseBridge Duo offers interactive 3D Device Previews for the PulseBridge Smart Ring, Smartwatch, and Dual-Wearable modes. Actual physical Bluetooth is not required in this evaluation version: select a wearable profile to initiate an interactive preview and stream illustrative telemetry.",
    links: [
      { label: "Explore Devices", path: "/devices" },
      { label: "3D Ring Explorer", path: "/devices/ring" },
      { label: "3D Watch Explorer", path: "/devices/watch" }
    ]
  },
  {
    keywords: ["permission", "permissions", "granular", "access", "seven"],
    answer: "PulseBridge Duo enforces 7 independent backend permissions: 1) View live readings, 2) View historical readings, 3) View medical reports, 4) View health trends, 5) Manage alert rules, 6) Acknowledge alerts, and 7) View device status. Patients can modify or revoke permissions at any time.",
    links: [
      { label: "Manage Permissions in Family Hub", path: "/family" }
    ]
  },
  {
    keywords: ["alert", "rules", "threshold", "critical", "notification"],
    answer: "Authorized caregivers can configure patient-specific alert rules for Heart Rate, SpO2, Blood Pressure, Glucose, and Temperature. Each rule supports threshold conditions (> or <), persistence duration, and duplicate-prevention cooldowns. Alerts trigger real-time in-app notifications and recovery tracking.",
    links: [
      { label: "Family Care & Alerts", path: "/family" },
      { label: "Live Monitoring Dashboard", path: "/monitor" }
    ]
  },
  {
    keywords: ["report", "reports", "medical", "upload", "records", "pdf"],
    answer: "Patients can securely upload clinical reports (PDF, images) in the Medical Reports Vault. Diagnostic parameters are summarized with clinical findings. Caregivers can only access reports if the patient explicitly grants the 'View Medical Reports' permission.",
    links: [
      { label: "Open Medical Reports", path: "/reports" }
    ]
  },
  {
    keywords: ["required", "physical", "without device", "no wearable"],
    answer: "No physical wearable is required! The entire platform—including Patient profiles, Caregiver networks, invitation codes, permissions, medical reports, alert management, and notifications—is fully usable without connecting any hardware.",
    links: [
      { label: "Patient Care Dashboard", path: "/family" },
      { label: "Live Monitoring", path: "/monitor" }
    ]
  },
  {
    keywords: ["telemetry", "vitals", "reading", "sensor"],
    answer: "Continuous telemetry captures Heart Rate, Oxygen Saturation (SpO₂), and physiological observations. Live feeds update automatically and can be monitored in real time.",
    links: [
      { label: "Live Monitoring", path: "/monitor" },
      { label: "AFib Overview", path: "/afib" }
    ]
  }
];

export const PulseBridgeAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (queryText?: string) => {
    const text = (queryText || inputValue).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let matched = KNOWLEDGE_RESPONSES.find(item => 
        item.keywords.some(kw => lower.includes(kw))
      );

      let responseText = matched?.answer;
      let responseLinks = matched?.links;

      if (!responseText) {
        responseText = "I'm here to assist with PulseBridge Duo features. You can ask about account registration, switching between Patient and Caregiver logins, generating invitation codes, setting personalized alert rules, or previewing the 3D smart ring and watch.";
        responseLinks = [
          { label: "Family Care Hub", path: "/family" },
          { label: "Device Preview", path: "/devices" },
          { label: "About Platform", path: "/about" }
        ];
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        links: responseLinks,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 400);
  };

  const handleClearChat = () => {
    setMessages([INITIAL_WELCOME]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-semibold text-xs rounded-full shadow-xl shadow-teal-600/30 hover:scale-105 transition-all duration-200"
          title="Open PulseBridge Assistant"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <Bot className="w-4 h-4 text-white" />
          <span className="hidden sm:inline">PulseBridge Assistant</span>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[560px] max-h-[85vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">PulseBridge Assistant</h3>
                <p className="text-[10px] text-teal-300 font-mono">Platform Workflow & Support</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition"
                title="Reset Conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clinical Non-Diagnosis Transparency Notice */}
          <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-200/80 text-[10px] text-amber-900 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Provides application guidance only. Not intended for clinical diagnosis.</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60 text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Context Links */}
                  {msg.links && msg.links.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.links.map((link, idx) => (
                        <Link
                          key={idx}
                          to={link.path}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold hover:bg-teal-100 transition"
                        >
                          <span>{link.label}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-slate-400 p-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Queries Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {SUGGESTED_QUERIES.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 text-slate-600 border border-slate-200 text-[11px] font-medium transition shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about accounts, invites, devices..."
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition cursor-pointer disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
