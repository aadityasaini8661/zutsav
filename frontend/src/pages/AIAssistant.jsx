import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const SUGGESTIONS = [
  'Which pooja should I do for prosperity?',
  'What is the significance of Ekadashi?',
  'When is the best time to perform Griha Pravesh?',
  'What pooja helps remove Kaal Sarp Dosh?',
  'Explain the benefits of Satyanarayan Katha',
];

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? 'bg-saffron-500' : 'bg-maroon-600'}`}>
        {isUser ? <User size={15} className="text-white" /> : <Bot size={15} className="text-white" />}
      </div>
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-saffron-500 text-white rounded-tr-sm'
          : 'bg-white border border-saffron-100 text-gray-800 rounded-tl-sm shadow-sm'
      }`}>
        {msg.text}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Namaste! 🙏 I am your spiritual guide on Zutsav. I can help you with pooja recommendations, festival timings, astrology guidance, and Hindu ritual FAQs. How may I assist you today?' },
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.map((m) => ({ role: m.role, text: m.text }));
      const { data } = await API.post('/ai/chat', { history });
      setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI is temporarily unavailable');
      setMessages((prev) => prev.slice(0, -1)); // remove user msg on fail
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const reset = () => {
    setMessages([{ role: 'model', text: 'Namaste! 🙏 I am your spiritual guide on Zutsav. How may I assist you today?' }]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-spiritual-light py-6">
      <div className="max-w-2xl mx-auto px-4 flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-saffron-100 shadow-sm px-5 py-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-maroon-600 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-gold-400" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Zutsav AI Assistant</h1>
              <p className="text-xs text-gray-500">Spiritual guidance powered by Gemini</p>
            </div>
          </div>
          <button onClick={reset} className="text-gray-400 hover:text-saffron-600 transition-colors" title="New conversation">
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-white rounded-2xl border border-saffron-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-maroon-600 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={15} className="text-white" />
                </div>
                <div className="bg-white border border-saffron-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0,1,2].map((i) => (
                      <div key={i} className="w-2 h-2 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only show at start) */}
          {messages.length === 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 bg-saffron-50 border border-saffron-200 text-saffron-700 rounded-full hover:bg-saffron-100 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-saffron-50">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                className="flex-1 input resize-none text-sm py-2.5 min-h-[42px] max-h-28"
                placeholder="Ask about poojas, festivals, astrology..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="btn-primary px-4 py-2.5 disabled:opacity-50 shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">For medical/legal advice, please consult qualified professionals.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
