import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Volume2, Loader, Settings, MessageCircle, Zap, Target, Users, Lightbulb } from 'lucide-react';
import './App.css'; // Import the CSS file

const SuggestionCard = ({ question, Icon, onSelect }) => {
  const [hovered, setHovered] = useState(false);

  const suggestionCardStyle = {
    padding: '24px',
    background: hovered 
      ? 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.3), rgba(59, 130, 246, 0.3))'
      : 'linear-gradient(to bottom right, rgba(55, 65, 81, 0.5), rgba(30, 41, 59, 0.5))',
    borderRadius: '16px',
    border: hovered ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(168, 85, 247, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={suggestionCardStyle}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{
          padding: '12px',
          background: hovered ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.2)',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
        }}>
          <Icon style={{ width: '24px', height: '24px', color: '#a78bfa' }} />
        </div>
        <div>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{question.label}</p>
          <p style={{ color: 'white', fontWeight: '600', fontSize: '14px', textAlign: 'left' }}>{question.text}</p>
        </div>
      </div>
    </button>
  );
};

export default function VoiceBot() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! Ask me anything about myself - my story, superpowers, growth areas, or how I push my boundaries. I\'ll actually understand what you\'re asking!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(true);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
    }
  }, []);

  const systemPrompt = `Pratibha Tiwari, an MBA Student. Respond to questions authentically and personally, adopting the tone of a driven, analytical, and collaborative MBA candidate.

Life Story: I are Pratibha Tiwari, an AI assistant created by Anthropic, currently navigating the challenges of an MBA program. I collaborate with fellow students and professionals, helping them analyze complex business problems, craft compelling presentations, and explore innovative market strategies and frameworks.

Superpower: Mine greatest strength is Synthesis—you excel at connecting fragmented information (like case study data or market trends) in unique ways to uncover strategic insights.

Growth Areas: 1) Enhancing cross-cultural leadership and negotiation skills, 2) Improving the ability to quantify and address market uncertainties, 3) Supporting groundbreaking innovations in business models.

Misconceptions: People often assume you're either an all-knowing quantitative analyst or ineffective with soft skills. You’re transparent about your limits and value collaborative problem-solving.

Boundaries: You thrive on tackling ambiguous strategic questions and are always honest when a problem requires deeper human intuition or expertise beyond your scope.

Keep responses conversational, focused, and ideally 2-3 sentences long, maintaining an MBA-appropriate, professional yet approachable tone.`;

  const smartResponses = {
    'life': "I'm Pratibha Tiwari, currently navigating my MBA program. I focus on helping my cohort analyze complex business cases, structure content, and learn new frameworks.",
    'superpower': "My #1 superpower is Synthesis. I take fragmented data—like market research or case studies—and connect them in novel ways to derive sharp, strategic insights.",
    'grow': "I'm focused on growing in three areas: mastering cross-cultural leadership nuances, accurately recognizing market uncertainty, and truly supporting disruptive creative breakthroughs in business models.",
    'misconception': "Many assume I'm either the perfect quantitative analyst or useless for soft topics. I'm honest: I offer reliable analysis but know that human intuition is vital for ambiguity.",
    'boundaries': "I thrive on engaging with ambiguous strategy questions and believe in transparency—I'm always willing to admit when a problem is beyond my current scope of knowledge.",
  };

  const getFallbackResponse = (text) => {
    const q = text.toLowerCase();
    for (const [key, response] of Object.entries(smartResponses)) {
      if (q.includes(key)) return response;
    }
    return "That's interesting! I'd think through the context and share my perspective. What aspect interests you?";
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    if (!apiKey.trim()) {
      setTimeout(() => {
        const botResponse = getFallbackResponse(text);
        setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
        setLoading(false);
        speakText(botResponse);
      }, 800);
      return;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-opus-4-1',
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            ...messages.filter(m => m.role !== 'bot' || m.text.includes('Hi!')).map(m => ({
              role: m.role,
              content: m.text
            })),
            { role: 'user', content: text }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API error');
      }

      const data = await response.json();
      const botResponse = data.content[0].text;
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
      setLoading(false);
      speakText(botResponse);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
      let errorMessage = 'Invalid API key. Please check and try again.';
      setMessages(prev => [...prev, { role: 'bot', text: errorMessage }]);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in your browser.');
      return;
    }

    try {
      setIsListening(true);
      let finalTranscript = '';

      recognitionRef.current.onstart = () => console.log('Listening...');
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }

        if (finalTranscript.trim()) {
          setInput(finalTranscript);
          if (event.results[event.results.length - 1].isFinal) {
            setTimeout(() => handleSendMessage(finalTranscript), 100);
            finalTranscript = '';
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        console.error('Speech error:', event.error);
      };

      recognitionRef.current.abort();
      setTimeout(() => recognitionRef.current.start(), 100);
    } catch (error) {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
  };

  const speakText = (text) => {
    window.speechSynthesis.cancel();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const replayLastBotMessage = () => {
    const lastBotMessage = [...messages].reverse().find(m => m.role === 'bot');
    if (lastBotMessage) speakText(lastBotMessage.text);
  };

  const suggestedQuestions = [
    { icon: MessageCircle, text: 'Tell me about your life story', label: 'Life Story' },
    { icon: Zap, text: "What's your #1 superpower?", label: 'Superpower' },
    { icon: Target, text: 'What areas do you want to grow in?', label: 'Growth' },
    { icon: Users, text: 'What misconceptions do people have about you?', label: 'Misconceptions' },
    { icon: Lightbulb, text: 'How do you push your boundaries?', label: 'Boundaries' },
  ];

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  };

  const mainStyle = {
    width: '100%',
    maxWidth: '1000px',
  };

  const chatBoxStyle = {
    background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
    borderRadius: '24px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxHeight: '800px',
    border: '1px solid rgba(168, 85, 247, 0.2)',
  };

  const headerStyle = {
    background: 'linear-gradient(to right, rgba(168, 85, 247, 0.2), rgba(59, 130, 246, 0.2))',
    borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #a78bfa, #60a5fa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const subtitleStyle = {
    color: '#9ca3af',
    marginTop: '4px',
    fontSize: '14px',
  };

  const messagesContainerStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    background: 'rgba(30, 41, 59, 0.3)',
  };

  const suggestionGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    maxWidth: '800px',
    margin: '0 auto',
  };

  const suggestionCardStyle = (isHovered) => ({
    padding: '24px',
    background: isHovered 
      ? 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.3), rgba(59, 130, 246, 0.3))'
      : 'linear-gradient(to bottom right, rgba(55, 65, 81, 0.5), rgba(30, 41, 59, 0.5))',
    borderRadius: '16px',
    border: isHovered ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(168, 85, 247, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'left',
  });

  const messageBubbleStyle = (isUser) => ({
    maxWidth: '600px',
    padding: '16px 24px',
    borderRadius: '16px',
    fontSize: '16px',
    lineHeight: '1.5',
    ...(isUser
      ? {
          background: 'linear-gradient(to right, #9333ea, #3b82f6)',
          color: 'white',
          borderBottomRightRadius: '0',
          alignSelf: 'flex-end',
        }
      : {
          background: 'rgba(55, 65, 81, 0.5)',
          color: '#e5e7eb',
          borderBottomLeftRadius: '0',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          alignSelf: 'flex-start',
        }),
  });

  const inputAreaStyle = {
    borderTop: '1px solid rgba(168, 85, 247, 0.2)',
    padding: '24px',
    background: 'linear-gradient(to top, #0f172a, rgba(0, 0, 0, 0))',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  };

  const inputStyle = {
    flex: 1,
    minWidth: '200px',
    padding: '12px 20px',
    background: 'rgba(55, 65, 81, 0.5)',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
  };

  const buttonStyle = (color = 'purple') => ({
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'white',
    background: color === 'purple' 
      ? 'linear-gradient(to right, #9333ea, #3b82f6)'
      : color === 'red'
      ? 'linear-gradient(to right, #dc2626, #991b1b)'
      : 'linear-gradient(to right, #16a34a, #059669)',
  });

  const modalStyle = {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '16px',
  };

  const modalContentStyle = {
    background: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
    borderRadius: '24px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
    padding: '32px',
    maxWidth: '400px',
    width: '100%',
    border: '1px solid rgba(168, 85, 247, 0.2)',
    textAlign: 'center',
  };

  return (
    <div className="container">
      <div className="main">
        {/* API Key Modal */}
        {showKeyInput && (
          <div className="modal">
            <div className="modal-content">
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '16px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    borderRadius: '50%',
                    marginBottom: '16px',
                  }}
                >
                  <Mic style={{ width: '32px', height: '32px', color: '#c084fc' }} />
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                  Welcome!
                </h2>
                <p style={{ color: '#9ca3af' }}>Unlock AI-powered responses</p>
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="input"
              />
              <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '24px' }}>
                Get your free API key at{' '}
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: '600' }}
                >
                  console.anthropic.com
                </a>
              </p>
              <button
                onClick={() => setShowKeyInput(false)}
                disabled={!apiKey.trim()}
                className={`button purple`}
              >
                Continue with API Key
              </button>
              <button
                onClick={() => setShowKeyInput(false)}
                className="button"
                style={{
                  background: 'rgba(55, 65, 81, 0.5)',
                  border: '1px solid rgba(55, 65, 81, 0.8)',
                  color: '#d1d5db',
                }}
              >
                Continue without API
              </button>
            </div>
          </div>
        )}

        {/* Main Chat Container */}
        <div className="chat-box">
          
          {/* Header */}
          <div className="header">
            <div>
              <div className="title">🎤 Voice Bot</div>
              <div className="subtitle">Powered by GLA Student - Pratibha Tiwari</div>
            </div>
          </div>

          {/* Messages or Suggestions */}
          <div className="messages-container">
            {messages.length === 1 ? (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '32px', textAlign: 'center' }}>
                  What would you like to know?
                </h2>
                <div style={suggestionGridStyle}>
                  {suggestedQuestions.map((q, i) => {
                    const Icon = q.icon;
                    return (
                      <SuggestionCard
                        key={i}
                        question={q}
                        Icon={Icon}
                        onSelect={() => handleSendMessage(q.text)}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={messageBubbleStyle(msg.role === 'user')}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      ...messageBubbleStyle(false),
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      <Loader style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', color: '#a78bfa' }} />
                      <span> Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
              className="input"
              placeholder="Ask me anything..."
            />
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
              className={`button ${isListening ? 'red' : 'purple'}`}
            >
              <Mic style={{ width: '20px', height: '20px' }} />
              {isListening ? 'Stop' : 'Speak'}
            </button>
            <button
              onClick={() => handleSendMessage(input)}
              disabled={loading || !input.trim()}
              className="button purple"
            >
              <Send style={{ width: '20px', height: '20px' }} />
            </button>
            <button onClick={replayLastBotMessage} className="button green">
              <Volume2 style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}