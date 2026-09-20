import { useState, useEffect, useCallback, useRef } from 'react';
import { consultarGemini, generarRespuestaLocal, obtenerContextoEnVivo } from '../services/geminiService';

export function useChatbot() {
  const [isOpen, setIsOpen] = useState(() => {
    return sessionStorage.getItem('me_chatbot_open') === 'true';
  });

  const [isLoading, setIsLoading] = useState(false);

  // Higiene de seguridad: purgar activamente cualquier clave residual en localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('me_gemini_api_key');
    } catch {
      // Ignorar entornos restringidos
    }
  }, []);

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('me_chatbot_messages_array');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignorar lectura corrupta
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        text: 'Hola María. Soy tu asistente virtual de ME Variedades. ¿En qué te puedo orientar hoy con respecto a tus clientes, inventario, pagos o préstamos?',
        timestamp: 'Ahora'
      }
    ];
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem('me_chatbot_history_json');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignorar historial corrupto
    }
    return [];
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
    sessionStorage.setItem('me_chatbot_open', isOpen ? 'true' : 'false');
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    try {
      sessionStorage.setItem('me_chatbot_messages_array', JSON.stringify(messages));
      sessionStorage.setItem('me_chatbot_history_json', JSON.stringify(history));
    } catch {
      // Ignorar fallos de almacenamiento
    }
    scrollToBottom();
  }, [messages, history, scrollToBottom]);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearChat = useCallback(() => {
    const initial = [
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        text: 'Hola María. Soy tu asistente virtual de ME Variedades. ¿En qué te puedo orientar hoy con respecto a tus clientes, inventario, pagos o préstamos?',
        timestamp: 'Ahora'
      }
    ];
    setMessages(initial);
    setHistory([]);
    sessionStorage.removeItem('me_chatbot_messages_array');
    sessionStorage.removeItem('me_chatbot_history_json');
  }, []);

  const sendMessage = useCallback(async (userText) => {
    const textTrimmed = (userText || '').trim();
    if (!textTrimmed || isLoading) return;

    const ahora = new Date();
    const timeStr = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: textTrimmed,
      timestamp: timeStr
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const liveContext = obtenerContextoEnVivo();

    try {
      // Llamada segura al endpoint intermediario /api/chatbot (o fallback local automático)
      const botResponse = await consultarGemini(textTrimmed, history, liveContext);

      const botMessage = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);

      const newHistory = [
        ...history,
        { role: 'user', parts: [{ text: textTrimmed }] },
        { role: 'model', parts: [{ text: botResponse }] }
      ].slice(-12);

      setHistory(newHistory);
    } catch (err) {
      const errorMsg = `Hubo un inconveniente al procesar tu consulta (${err.message}). Por favor intenta nuevamente.`;
      const botErrorMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        text: errorMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [history, isLoading]);

  return {
    isOpen,
    isLoading,
    messages,
    messagesEndRef,
    toggleChat,
    openChat,
    closeChat,
    clearChat,
    sendMessage
  };
}
