'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type Metrica = 'NPS' | 'CSAT' | 'CES'
type View = 'Coleta' | 'Feedbacks' | 'Fechamento de Loop'

type Pesquisa = {
  id: string
  nome: string
  pergunta: string
  metrica: Metrica
  canal: 'Link' | 'WhatsApp' | 'Email'
  status: 'Ativa' | 'Pausada'
  createdAt: string
}

type Resposta = {
  id: string
  pesquisaId: string
  nota: number
  comentario?: string
  createdAt: string
}

type Tratativa = {
  id: string
  pesquisaId: string
  respostaId: string
  status: 'Aberta' | 'Resolvida'
  createdAt: string
}

const STORAGE_KEY = 'crmplus.satisfacao.pesquisas'
const RESPONSE_KEY = 'crmplus.satisfacao.respostas'
const CASE_KEY = 'crmplus.satisfacao.tratativas'
const AUTOMATION_KEY = 'crmplus.satisfacao.automacao'

function npsClass(nota: number) {
  return nota <= 6 ? 'Detrator' : nota <= 8 ? 'Neutro' : 'Promotor'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

export default function SatisfacaoPage() {
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([])
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [tratativas, setTratativas] = useState<Tratativa[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [automacao, setAutomacao] = useState(true)
  const [view, setView] = useState<View>('Coleta')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Pesquisa>[]
      const normalized = parsed.map((item) => ({
        id: String(item.id),
        nome: String(item.nome || ''),
        pergunta: String(item.pergunta || ''),
        metrica: (item.metrica || 'NPS') as Metrica,
        canal: (item.canal || 'Link') as Pesquisa['canal'],
        status: (item.status || 'Ativa') as Pesquisa['status'],
        createdAt: String(item.createdAt || new Date().toISOString())
      }))
      setPesquisas(normalized)
      if (normalized.length) setSelectedId(normalized[0].id)
    }

    const responses = window.localStorage.getItem(RESPONSE_KEY)
    if (responses) setRespostas(JSON.parse(responses))
    const cases = window.localStorage.getItem(CASE_KEY)
    if (cases) setTratativas(JSON.parse(cases))
    const automation = window.localStorage.getItem(AUTOMATION_KEY)
    if (automation !== null) setAutomacao(automation === 'true')
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return pesquisas
    return pesquisas.filter((pesquisa) => [pesquisa.nome, pesquisa.pergunta, pesquisa.metrica, pesquisa.canal, pesquisa.status]
      .some((value) => value.toLowerCase().includes(term)))
  }, [pesquisas, query])

  const selected = pesquisas.find((pesquisa) => pesquisa.id === selectedId) || null
  const selectedFeedbacks = useMemo(
    () => selected ? respostas.filter((resposta) => resposta.pesquisaId === selected.id) : [],
    [respostas, selected]
  )
  const selectedLoops = useMemo(
    () => selected ? tratativas.filter((item) => item.pesquisaId === selected.id) : [],
    [tratativas, selected]
  )

  function persist(next: Pesquisa[]) {
    setPesquisas(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function persistLoops(next: Tratativa[]) {
    setTratativas(next)
    window.localStorage.setItem(CASE_KEY, JSON.stringify(next))
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
      metrica: String(form.get('metrica') || 'NPS') as Metrica,
      canal: String(form.get('canal') || 'Link') as Pesquisa['canal'],
      status: 'Ativa',
      createdAt: new Date().toISOString()
    }
    persist([pesquisa, ...pesquisas])
    setSelectedId(pesquisa.id)
    setView('Coleta')
    event.currentTarget.reset()
    setShowForm(false)
  }

  function togglePesquisa(id: string) {
    persist(pesquisas.map((item) => item.id === id
      ? { ...item, status: item.status === 'Ativa' ? 'Pausada' : 'Ativa' }
      : item))
  }

  function abrirLoop(respostaId: string) {
    if (!selected || tratativas.some((item) => item.respostaId === respostaId)) return
    persistLoops([{
      id: crypto.randomUUID(),
      pesquisaId: selected.id,
      respostaId,
      status: 'Aberta',
      createdAt: new Date().toISOString()
    }, ...tratativas])
  }

  function resolver(id: string) {
    persistLoops(tratativas.map((item) => item.id === id
      ? { ...item, status: 'Resolvida' as const }
      : item))
  }

  return (
    <main className="service-app">
      <aside className="service-sidebar">
        <Link href="/" className="service-back">← Apps</Link>
        <div className="service-brand">Satisfação</div>
        <nav className="service-nav">
          {(['Coleta', 'Feedbacks', 'Fechamento de Loop'] as View[]).map((item) => (
            <button
              key={item}
              className={`service-nav-item ${view === item ? 'active' : ''}`}
              style={{ border: 0, width: '100%', textAlign: 'left', cursor: 'pointer', background: view === item ? undefined : 'transparent' }}
              onClick={() => { setView(item); setShowForm(false) }}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="service-automation">
          <span>Automação</span>
          <button onClick={toggleAutomacao}>{automacao ? 'Ativa' : 'Pausada'}</button>
        </div>
      </aside>

      <section className="service-list">
        <header className="service-list-head">
          <strong>Pesquisas</strong>
          <button className="service-new" onClick={() => setShowForm(true)}>Nova</button>
        </header>
        <div className="service-search">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" />
        </div>
        <div className="service-records">
          {filtered.length === 0 ? (
            <div className="service-list-empty">Nenhuma pesquisa</div>
          ) : filtered.map((pesquisa) => (
            <button
              key={pesquisa.id}
              className={`service-record ${selectedId === pesquisa.id ? 'active' : ''}`}
              onClick={() => { setSelectedId(pesquisa.id); setShowForm(false) }}
            >
              <div className="service-record-line">
                <span>{pesquisa.metrica}</span>
                <span>{pesquisa.status}</span>
              </div>
              <strong>{pesquisa.nome}</strong>
              <span>{pesquisa.canal}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="service-workspace">
        {showForm ? (
          <div className="service-create">
            <header className="service-record-head">
              <div>
                <span className="service-kicker">Nova pesquisa</span>
                <h1>Coleta</h1>
              </div>
              <button className="service-quiet" onClick={() => setShowForm(false)}>Cancelar</button>
            </header>
            <form className="service-form" onSubmit={criarPesquisa}>
              <label>Nome<input name="nome" required autoFocus /></label>
              <label>Métrica<select name="metrica"><option>NPS</option><option>CSAT</option><option>CES</option></select></label>
              <label>Canal<select name="canal"><option>Link</option><option>WhatsApp</option><option>Email</option></select></label>
              <label>Pergunta<textarea name="pergunta" required /></label>
              <div><button className="service-primary" type="submit">Criar pesquisa</button></div>
            </form>
          </div>
        ) : selected ? (
          <>
            <header className="service-record-head">
              <div>
                <div className="service-record-titleline">
                  <span className="service-kicker">{selected.metrica}</span>
                  <span className="service-status">{selected.status}</span>
                </div>
                <h1>{selected.nome}</h1>
                <p>{selected.pergunta}</p>
              </div>
              {view === 'Coleta' && (
                <div className="row-actions">
                  <Link className="service-quiet" href={`/satisfacao/responder/${selected.id}`}>Abrir</Link>
                  <button className="service-quiet" onClick={() => navigator.clipboard?.writeText(`${location.origin}/satisfacao/responder/${selected.id}`)}>Copiar link</button>
                  <button className="service-primary" onClick={() => togglePesquisa(selected.id)}>{selected.status === 'Ativa' ? 'Pausar' : 'Ativar'}</button>
                </div>
              )}
            </header>

            {view === 'Coleta' && (
              <div className="service-detail-grid">
                <div className="service-detail-main">
                  <section className="service-section">
                    <header>Pesquisa</header>
                    <div className="service-service-text">{selected.pergunta}</div>
                  </section>
                </div>
                <aside className="service-detail-side">
                  <div><span>Métrica</span><strong>{selected.metrica}</strong></div>
                  <div><span>Canal</span><strong>{selected.canal}</strong></div>
                  <div><span>Status</span><strong>{selected.status}</strong></div>
                  <div><span>Criada</span><strong>{formatDate(selected.createdAt)}</strong></div>
                </aside>
              </div>
            )}

            {view === 'Feedbacks' && (
              <div className="service-detail-grid">
                <div className="service-detail-main">
                  <section className="service-section">
                    <header>Feedbacks</header>
                    <div className="board">
                      {selectedFeedbacks.length === 0 ? (
                        <div className="service-list-empty">Nenhum feedback</div>
                      ) : selectedFeedbacks.map((resposta) => {
                        const loop = tratativas.find((item) => item.respostaId === resposta.id)
                        return (
                          <article className="row" key={resposta.id}>
                            <div className="row-top">
                              <div>
                                <div className="row-title">{selected.metrica} {resposta.nota}</div>
                                <div className="row-meta">{resposta.comentario || 'Sem comentário'}</div>
                              </div>
                              <div className="status-group">
                                {selected.metrica === 'NPS' && <span className="status">{npsClass(resposta.nota)}</span>}
                                {loop && <span className="status">{loop.status}</span>}
                              </div>
                            </div>
                            <div className="row-actions">
                              <span className="row-meta">{formatDate(resposta.createdAt)}</span>
                              {!loop && <button className="button secondary" onClick={() => abrirLoop(resposta.id)}>Abrir loop</button>}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {view === 'Fechamento de Loop' && (
              <div className="service-detail-grid">
                <div className="service-detail-main">
                  <section className="service-section">
                    <header>Fechamento de Loop</header>
                    <div className="board">
                      {selectedLoops.length === 0 ? (
                        <div className="service-list-empty">Nenhum loop</div>
                      ) : selectedLoops.map((item) => {
                        const resposta = respostas.find((feedback) => feedback.id === item.respostaId)
                        if (!resposta) return null
                        return (
                          <article className="row" key={item.id}>
                            <div className="row-top">
                              <div>
                                <div className="row-title">{selected.metrica} {resposta.nota}</div>
                                <div className="row-meta">{resposta.comentario || 'Sem comentário'}</div>
                              </div>
                              <span className="status">{item.status}</span>
                            </div>
                            {item.status === 'Aberta' && (
                              <div><button className="button secondary" onClick={() => resolver(item.id)}>Resolver</button></div>
                            )}
                          </article>
                        )
                      })}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="service-workspace-empty">Nenhuma pesquisa</div>
        )}
      </section>
    </main>
  )
}
