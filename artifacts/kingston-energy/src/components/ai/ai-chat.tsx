import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User as UserIcon } from 'lucide-react';
import { useUiStore } from '@/store/ui-store';
import { Button, Input } from '../ui/all';
import { cn } from '@/lib/utils';

type Message = { id: string; text: string; sender: 'user' | 'ai'; time: Date };

export function AiChatWidget() {
  const { isChatOpen, toggleChat, closeChat } = useUiStore();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! I am the Kingston Energy AI assistant. Ask me about truck statuses, routes, or energy output calculations.', sender: 'ai', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const newMsg: Message = { id: Date.now().toString(), text: input, sender: 'user', time: new Date() };
    setMessages(p => [...p, newMsg]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const query = newMsg.text.toLowerCase();
      let response = "I don't have realtime data for that specific query. Try asking about 'trucks', 'energy', or 'routes'.";
      
      if (query.includes('truck')) {
        response = "Currently 3 trucks are active. KGN-1234 is collecting in Half Way Tree, KGN-5678 is en route to Naggo Head, and KGN-9012 is returning.";
      } else if (query.includes('energy') || query.includes('power')) {
        response = "Today we've processed 24,500 kg of waste generating approximately 85,750 kWh of chemical energy via incineration and anaerobic digestion.";
      } else if (query.includes('route')) {
        response = "Traffic is heavy on Spanish Town Road. I've re-routed KGN-9012 via Washington Boulevard to save 12 minutes.";
      }

      setMessages(p => [...p, { id: Date.now().toString(), text: response, sender: 'ai', time: new Date() }]);
    }, 1000);
  };

  return (
    <>
      <AnimatePresence>
        {!isChatOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={toggleChat}
            className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform z-40 border-2 border-primary-foreground/20"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shadow-md z-10 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 pointer-events-none" />
              <div className="flex items-center gap-2 relative z-10">
                <Bot className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm leading-none">KE Assistant</h3>
                  <span className="text-[10px] opacity-80 uppercase tracking-widest">Online</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={closeChat} className="h-8 w-8 text-primary-foreground hover:bg-black/20 relative z-10">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
              {messages.map(m => (
                <div key={m.id} className={cn("flex gap-2 max-w-[85%]", m.sender === 'user' ? "ml-auto flex-row-reverse" : "")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border", m.sender === 'user' ? "bg-secondary border-border" : "bg-primary/20 border-primary/50 text-primary")}>
                    {m.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn("p-3 rounded-2xl text-sm", m.sender === 'user' ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm" : "bg-card border border-border rounded-tl-none shadow-sm")}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex gap-2">
              <Input 
                value={input} 
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about operations..." 
                className="flex-1 bg-background"
              />
              <Button type="submit" size="icon" className="shrink-0" disabled={!input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
