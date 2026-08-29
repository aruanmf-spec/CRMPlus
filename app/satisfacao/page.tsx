'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

type Pesquisa = {
  id: string
  nome: string
  pergunta: string
  canal: 'Link' | 'WhatsApp' | 'Email'
  createdAt: string
}

const STORAGE_KEY = 'crmplus.satisfacao.pesquisas'
const AUTOMATION_KEY = 'crmplus.satisfacao.automacao'

export default function SatisfacaoPage() {
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([])
  const [showForm, setShowForm] = useState(false)
  const [automacao, setAutomacao] = useState(true)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) setPesquisas(JSON.parse(raw))
    const automation = window.localStorage.getItem(AUTOMATION_KEY)
    if (automation !== null) setAutomacao(automation === 'true')
  }, [])

  function persist(next: Pesquisa[]) {
    setPesquisas(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function toggleAutomacao() {
    const next = !automacao
    setAutomacao(next)
    window.localStorage.setItem(AUTOMATION_KEY, String(next))
  }

  function criarPesquisa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const pesquisa: Pesquisa = {
      id: crypto.randomUUID(),
      nome: String(form.get('nome') || ''),
      pergunta: String(form.get('pergunta') || ''),
      canal: String(form.get('canal') || 'Link') as Pesquisa['canal'],
      createdAt: new Date().toISOString()
    }
    persist([pesquisa, ...pesquisas])
    event.currentTarget.reset()
    setShowForm(false)
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="back">← Apps</Link>
        <div className="module-name">Satisfação</div>
        <nav className="nav">
          <div className="nav-item active">Pesquisas</div>
        </nav>
        <div className="sidebar-foot">
          <div className="row-top">
            <span>Automação</span>
            <button className="button secondary" onClick={toggleAutomacao}>{automacao ? 'Ativa' : 'Pausada'}</button>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="page-head">
          <h2>Pesquisas</h2>
          <button className="button" onClick={() => setShowForm((value) => !value)}>Nova pesquisa</button>
        </header>

        {showForm && (
          <form className="form" onSubmit={criarPesquisa}>
            <div className="form-grid">
              <div className="field"><label>Nome</label><input name="nome" required autoFocus /></div>
              <div className="field"><label>Canal</label><select name="canal"><option>Link</option><option>WhatsApp</option><option>Email</option></select></div>
            </div>
            <div className="field"><label>Pergunta</label><textarea name="pergunta" required /></div>
            <div><button className="button" type="submit">Criar</button></div>
          </form>
        )}

        <div className="board">
          {pesquisas.length === 0 ? (
            <div className="empty"><strong>Nenhuma pesquisa</strong></div>
          ) : pesquisas.map((pesquisa) => (
            <article className="row" key={pesquisa.id}>
              <div className="row-top">
                <div>
                  <div className="row-title">{pesquisa.nome}</div>
                  <div className="row-meta">{pesquisa.pergunta}</div>
                </div>
                <span className="status">{pesquisa.canal}</span>
              </div>
              <div>
                <button className="button secondary" onClick={() => navigator.clipboard?.writeText(`${location.origin}/satisfacao/responder/${pesquisa.id}`)}>Copiar link</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
