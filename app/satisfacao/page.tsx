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

export default function SatisfacaoPage() {
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([])
  const [showForm, setShowForm] = useState(false)
  const [automacao, setAutomacao] = useState(true)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) setPesquisas(JSON.parse(raw))
  }, [])

  function persist(next: Pesquisa[]) {
    setPesquisas(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
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
        <Link href="/" className="back">← Todos os apps</Link>
        <div className="module-name">Satisfação</div>
        <nav className="nav">
          <div className="nav-item active">Pesquisas</div>
          <div className="nav-item">Respostas</div>
          <div className="nav-item">Automação</div>
        </nav>
        <div className="sidebar-foot">Dados de teste permanecem somente neste navegador.</div>
      </aside>

      <section className="workspace">
        <header className="page-head">
          <div>
            <h2>Pesquisas</h2>
            <p>Crie a pergunta, defina o canal e acompanhe o retorno. O módulo existe para ouvir e fechar o ciclo do feedback.</p>
          </div>
          <button className="button" onClick={() => setShowForm((value) => !value)}>Nova pesquisa</button>
        </header>

        {showForm && (
          <form className="form" onSubmit={criarPesquisa}>
            <div className="form-grid">
              <div className="field"><label>Nome da pesquisa</label><input name="nome" required autoFocus /></div>
              <div className="field"><label>Canal</label><select name="canal"><option>Link</option><option>WhatsApp</option><option>Email</option></select></div>
            </div>
            <div className="field"><label>Pergunta principal</label><textarea name="pergunta" required /></div>
            <div><button className="button" type="submit">Criar pesquisa</button></div>
          </form>
        )}

        <div className="board">
          {pesquisas.length === 0 ? (
            <div className="empty"><strong>Nenhuma pesquisa criada.</strong>Crie uma pesquisa para testar a experiência localmente neste navegador.</div>
          ) : pesquisas.map((pesquisa) => (
            <article className="row" key={pesquisa.id}>
              <div className="row-top">
                <div><div className="row-title">{pesquisa.nome}</div><div className="row-meta">{pesquisa.pergunta}</div></div>
                <span className="status">{pesquisa.canal}</span>
              </div>
              <div><button className="button secondary" onClick={() => navigator.clipboard?.writeText(`${location.origin}/satisfacao/responder/${pesquisa.id}`)}>Copiar link de teste</button></div>
            </article>
          ))}
        </div>

        <section className="automation">
          <div className="automation-copy">
            <strong>Automação de retorno</strong>
            <span>Cada resposta poderá acionar regras e integrações exclusivas deste módulo.</span>
          </div>
          <button className="button secondary" onClick={() => setAutomacao((value) => !value)}>{automacao ? 'Ativa' : 'Pausada'}</button>
        </section>
        <div className="rule-list">
          <div className="rule">Resposta recebida → registrar no Supabase exclusivo de Satisfação.</div>
          <div className="rule">Feedback crítico → acionar webhook próprio para tratamento.</div>
          <div className="rule">Arquivo anexado → armazenar no R2 exclusivo de Satisfação.</div>
        </div>
      </section>
    </main>
  )
}
