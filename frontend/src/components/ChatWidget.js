import React, { useState, useRef, useEffect } from 'react';
import { chatApi } from '../services/api';
import Icon from './Icon';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [convId, setConvId] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, typing]);
  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const escape = e => { if (e.key === 'Escape') { setIsOpen(false); requestAnimationFrame(() => triggerRef.current?.focus()); } };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [isOpen]);
  const send = async (text = input) => {
    text = text.trim();
    if (!text || text.length > 2000 || typing) return;
    setMessages(p => [...p, { role: 'user', content: text }]);
    setInput(''); setTyping(true);
    try {
      const d = await chatApi.send(text, convId);
      if (d.conversation_id) setConvId(d.conversation_id);
      setMessages(p => [...p, { role: 'assistant', content: d.response }]);
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'Şu an yanıt veremiyorum. Lütfen daha sonra deneyin.' }]);
    } finally { setTyping(false); }
  };
  return <>
    {!isOpen && <button ref={triggerRef} className="chat-trigger" onClick={() => setIsOpen(true)} aria-label="Rehber AI sohbetini aç">💬</button>}
    {isOpen && <section className="chat-panel" aria-label="Rehber AI sohbeti">
      <div className="chat-header"><div><strong>Rehber AI</strong><small>Trafik işlemleri hakkında sorun</small></div><button aria-label="Sohbeti kapat" onClick={() => { setIsOpen(false); requestAnimationFrame(() => triggerRef.current?.focus()); }}><Icon name="close" /></button></div>
      <div className="chat-messages" ref={listRef} role="log" aria-live="polite" aria-relevant="additions text">
        {!messages.length && <div><p>Merhaba! Hangi konuda yardımcı olabilirim?</p>{['Trafik cezasına nasıl itiraz ederim?', 'Sigorta işlemlerine nereden başlarım?', 'Ehliyet puanımı nasıl sorgularım?'].map(p => <button className="chat-prompt" key={p} onClick={() => send(p)}>{p}</button>)}</div>}
        {messages.map((m, i) => <div key={i} className={`chat-message ${m.role === 'user' ? 'from-user' : ''}`}><span className="sr-only">{m.role === 'user' ? 'Siz: ' : 'Rehber AI: '}</span>{m.content}</div>)}
        {typing && <p role="status">Yanıt hazırlanıyor…</p>}
      </div>
      <p className="chat-note">Yanıtlar genel bilgi amaçlıdır. Kişisel bilgilerinizi paylaşmayın.</p>
      <form className="chat-input" onSubmit={e => { e.preventDefault(); send(); }}><input ref={inputRef} aria-label="Mesajınız" value={input} maxLength={2000} onChange={e => setInput(e.target.value)} placeholder="Sorunuzu yazın…" onKeyDown={e => { if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault(); }} /><button aria-label="Mesajı gönder" disabled={!input.trim() || typing}><Icon name="arrow" /></button></form>
    </section>}
  </>;
}
