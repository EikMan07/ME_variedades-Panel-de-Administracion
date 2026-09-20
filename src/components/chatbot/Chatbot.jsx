import { useState } from 'react';
import { useChatbot } from '../../hooks/useChatbot';

// Función para renderizar markdown estructurado de forma segura
function renderFormattedMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let listType = null; // 'ul' | 'ol'

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} style={{ margin: '0.3rem 0 0.5rem 1.2rem', padding: 0 }}>
            {currentList.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '0.25rem' }}>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        );
      } else if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} style={{ margin: '0.3rem 0 0.5rem 1.2rem', padding: 0 }}>
            {currentList.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '0.25rem' }}>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  const formatInline = (str) => {
    let formatted = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Negrita
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Cursiva
    formatted = formatted.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    // Código en línea
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.12); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>');

    return formatted;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={index} style={{ margin: '0.8rem 0 0.3rem', color: 'var(--color-rosa-suave)', fontWeight: 600, fontSize: '1.02rem' }}>
          {trimmed.substring(4)}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={index} style={{ margin: '0.9rem 0 0.4rem', color: 'var(--color-rosa-suave)', fontWeight: 700, fontSize: '1.1rem' }}>
          {trimmed.substring(3)}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={index} style={{ margin: '1rem 0 0.5rem', color: 'var(--color-dorado)', fontWeight: 700, fontSize: '1.2rem' }}>
          {trimmed.substring(2)}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      currentList.push(formatInline(trimmed.substring(2)));
      return;
    }

    const matchNum = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (matchNum) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      currentList.push(formatInline(matchNum[2]));
      return;
    }

    flushList();

    if (trimmed === '') {
      elements.push(<div key={index} style={{ height: '0.35rem' }} />);
    } else {
      elements.push(
        <p key={index} style={{ margin: '0 0 0.4rem 0', lineHeight: 1.45 }}>
          <span dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        </p>
      );
    }
  });

  flushList();
  return elements;
}

export default function Chatbot() {
  const {
    isOpen,
    isLoading,
    messages,
    messagesEndRef,
    toggleChat,
    closeChat,
    clearChat,
    sendMessage
  } = useChatbot();

  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    sendMessage(inputVal);
    setInputVal('');
  };

  const handleQuickPrompt = (promptText) => {
    sendMessage(promptText);
  };

  return (
    <div className="chatbot-floating-wrapper" id="chatbot-wrapper">
      {/* Ventana de Chat */}
      <div className={`chatbot-window ${isOpen ? 'active' : ''}`} aria-hidden={!isOpen}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-bot-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
              </svg>
            </div>
            <div>
              <h4 className="chat-bot-name">Asistente ME Variedades</h4>
              <span className="chat-bot-status">
                <span className="dot-online" />
                <span id="chat-bot-status-text">
                  Asistente Inteligente • En Línea
                </span>
              </span>
            </div>
          </div>

          <div className="chat-header-actions">
            <button
              type="button"
              className="btn-chat-action"
              title="Limpiar conversación"
              onClick={clearChat}
              aria-label="Limpiar conversación"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
            <button
              type="button"
              className="btn-chat-close"
              onClick={closeChat}
              aria-label="Cerrar Asistente"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Mensajes */}
        <div className="chat-messages-container" id="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-msg msg-${msg.role}`}>
              <div className="msg-bubble">
                {msg.role === 'assistant' ? renderFormattedMarkdown(msg.text) : msg.text}
              </div>
              <span className="msg-timestamp">{msg.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div className="chat-msg msg-assistant">
              <div className="msg-bubble" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div
                  className="spinner"
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderTopColor: 'var(--color-rosa-empolvado)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
                <span>Consultando datos y pensando respuesta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias Rápidas */}
        <div className="chat-quick-prompts">
          <button
            type="button"
            className="btn-quick-prompt"
            onClick={() => handleQuickPrompt('¿Cómo registro un nuevo producto?')}
          >
            Registrar producto
          </button>
          <button
            type="button"
            className="btn-quick-prompt"
            onClick={() => handleQuickPrompt('¿Quién cumple años este mes?')}
          >
            Cumpleaños
          </button>
          <button
            type="button"
            className="btn-quick-prompt"
            onClick={() => handleQuickPrompt('¿Qué productos tienen stock bajo?')}
          >
            Stock bajo
          </button>
          <button
            type="button"
            className="btn-quick-prompt"
            onClick={() => handleQuickPrompt('¿Cómo registro un nuevo cliente?')}
          >
            Registrar cliente
          </button>
        </div>

        {/* Formulario de Entrada */}
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Escribe tu consulta aquí..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
            required
          />
          <button
            type="submit"
            className="btn-chat-send"
            aria-label="Enviar mensaje"
            disabled={isLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>

      {/* Botón Disparador Flotante */}
      <button
        className="btn-chatbot-trigger"
        onClick={toggleChat}
        aria-label="Abrir Asistente Virtual"
        title="Abrir Asistente con Inteligencia Artificial"
      >
        <div className="trigger-glow" />
        <svg className="trigger-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span className="trigger-badge">IA</span>
      </button>
    </div>
  );
}
