import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ArrowUp, BookOpen, Check, Code2, LoaderCircle, RotateCcw, Sparkles, UserRound } from 'lucide-react'

const examples = ['Python decorators', 'REST APIs', 'JavaScript promises']
const levels = ['Beginner', 'Intermediate', 'Advanced']
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [message, setMessage] = useState('')
  const [level, setLevel] = useState('Beginner')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendMessage(nextMessage = message) {
    const cleanMessage = nextMessage.trim()
    if (!cleanMessage || loading) return

    const userMessage = { role: 'user', content: cleanMessage }
    const history = messages.map(({ role, content }) => ({ role, content }))
    setMessage('')
    setMessages((current) => [...current, userMessage])
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cleanMessage, level, history }),
      })
      const data = await response.json()
      if (!response.ok) {
        const detail = Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join(', ') : data.detail
        throw new Error(detail || 'The tutor could not answer right now.')
      }
      setMessages((current) => [...current, { role: 'assistant', content: data.answer }])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage()
  }

  function resetChat() {
    setMessages([])
    setError('')
    setMessage('')
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <a className="brand" href="/" aria-label="Codewise home">
          <span className="brand-mark"><Code2 size={19} strokeWidth={2.5} /></span>
          <span>codewise</span>
        </a>
        <div className="topbar-actions">
          {messages.length > 0 && <button className="reset-button" type="button" onClick={resetChat}><RotateCcw size={13} /> New chat</button>}
          <div className="status"><span className="status-dot" /> GROQ-powered tutor</div>
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={15} /> LEARN THE WHY, THEN WRITE THE CODE</div>
        <h1>Make complex code<br /><em>click.</em></h1>
        <p className="hero-copy">Ask a question, try the challenge, and keep the conversation going until it clicks.</p>
      </section>

      <section className="workspace" aria-label="Codewise tutor">
        {messages.length === 0 && (
          <div className="starter-card">
            <div className="starter-icon"><BookOpen size={18} /></div>
            <div><strong>Start a learning thread</strong><span>Every topic comes with an explanation, example, challenge, and theory check.</span></div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="conversation" aria-live="polite">
            {messages.map((item, index) => (
              <div className={`message-row ${item.role}`} key={`${item.role}-${index}`}>
                <div className="message-avatar">{item.role === 'assistant' ? <Code2 size={15} /> : <UserRound size={15} />}</div>
                <article className="message-bubble">
                  <div className="message-label">{item.role === 'assistant' ? 'CODEWISE TUTOR' : 'YOU'}</div>
                  {item.role === 'assistant' ? <ReactMarkdown>{item.content}</ReactMarkdown> : <p>{item.content}</p>}
                </article>
              </div>
            ))}
            {loading && <div className="typing"><LoaderCircle className="spin" size={16} /> Codewise is thinking...</div>}
          </div>
        )}

        <form className="prompt-card chat-composer" onSubmit={handleSubmit}>
          <div className="prompt-heading">
            <div><span className="step-number">{messages.length ? '02' : '01'}</span><span>{messages.length ? 'Keep the conversation going' : 'What are you curious about?'}</span></div>
            <span className="required">{messages.length ? 'FOLLOW-UP READY' : 'REQUIRED'}</span>
          </div>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={messages.length ? 'Ask a follow-up, answer a theory question, or try the challenge...' : 'e.g. Explain Python list comprehensions...'} aria-label="Your coding question" maxLength={2000} rows={3} />
          <div className="prompt-footer">
            <div className="examples">{messages.length === 0 && examples.map((example) => <button type="button" key={example} onClick={() => sendMessage(example)}>{example}</button>)}</div>
            <button className="submit-button" type="submit" disabled={!message.trim() || loading} aria-label="Send message">{loading ? <LoaderCircle className="spin" size={18} /> : <ArrowUp size={19} />}</button>
          </div>
        </form>

        <div className="level-row">
          <div className="level-label"><BookOpen size={16} /> <span>Set your level</span></div>
          <div className="level-picker" role="group" aria-label="Learning level">{levels.map((option) => <button type="button" className={level === option ? 'active' : ''} onClick={() => setLevel(option)} key={option}><span>{level === option && <Check size={13} />}</span>{option}</button>)}</div>
        </div>
        {error && <div className="error-message">{error}</div>}
      </section>

      <footer><span>Built for curious developers</span><span>•</span><span>Keep asking until it clicks.</span></footer>
    </main>
  )
}

export default App
