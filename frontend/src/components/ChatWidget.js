import React, { useState, useRef, useEffect } from 'react';
import { chatApi } from '../services/api';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [convId, setConvId] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text = input) => {
    if (!text.trim() || typing) return;
    setMessages(p => [...p, { role: 'user', content: text }]);
    setInput('');
    setTyping(true);
    try {
      const d = await chatApi.send(text, convId);
      if (d.conversation_id) { setConvId(d.conversation_id); localStorage.setItem('tr_conv', d.conversation_id); }
      setMessages(p => [...p, { role: 'assistant', content: d.response }]);
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'Şu an yanıt veremiyorum. Lütfen daha sonra deneyin.' }]);
    }
    setTyping(false);
  };

  const PROMPTS = ['Trafik cezasına nasıl itiraz ederim?', 'Zorunlu sigorta ne kadar?', 'Ehliyet puanımı nasıl sorgulamam?'];

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} style={{
          position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
          borderRadius: '50%', background: '#1a3a6b', color: '#fff',
          border: 'none', fontSize: 24, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          transition: 'transform 0.2s'
        }} title="Rehber AI ile Sohbet Et">💬</button>
      )}

      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, width: 360, height: 500,
          background: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', zIndex: 100, overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}>
          {/* Header */}
          <div style={{ background: '#1a3a6b', color: '#fff', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>⚖️ Rehber AI</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Trafik hukuku asistanı</div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div>
                <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>Merhaba! Trafik hukuku konularında yardımcı olabilirim.</p>
                {PROMPTS.map(p => (
                  <button key={p} onClick={() => send(p)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: 8, background: '#f4f7fc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#1a3a6b' }}>{p}</button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.6, background: m.role === 'user' ? '#1a3a6b' : '#f4f7fc', color: m.role === 'user' ? '#fff' : '#333' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: '#f4f7fc', borderRadius: 12, width: 'fit-content' }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, background: '#1a3a6b', borderRadius: '50%', animation: 'bounce 1s infinite', animationDelay: `${i*0.2}s`, display: 'block' }} />)}
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()} placeholder="Sorunuzu yazın..." style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} disabled={typing} />
            <button onClick={() => send()} disabled={!input.trim() || typing} style={{ padding: '10px 16px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>→</button>
          </div>
        </div>
      )}

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </>
  );
}
