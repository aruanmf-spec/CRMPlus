'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type Metrica = 'NPS' | 'CSAT' | 'CES'
type View = 'Pesquisa' | 'Feedbacks' | 'Loops'

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

type Loop = {
  id: string
  pesquisaId: string
  respostaId: string
  status: 'Novo' | 'Em tratamento' | 'Resolvido'
  responsavel?: string
  proximaAcao?: string
  resolucao?: string
  createdAt: string
  updatedAt?: string
}

const STORAGE_KEY = 'crmplus.satisfacao.pesquisas'
const RESPONSE_KEY = 'crmplus.satisfacao.respostas'
const CASE_KEY = 'crmplus.satisfacao.tratativas'
const AUTOMATION_KEY = 'crmplus.satisfacao.automacao'

function npsClass(nota: number) {
  return nota <= 6 ? 'Detrator' : nota <= 8 ? 'Neutro' : 'Promotor'
}

function formatDate(value?: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export default function SatisfacaoPage() {
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([])
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [loops, setLoops] = useState<Loop[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loopFormId, setLoopFormId] = useState<string | null>(null)
  const [resolveId, setResolveId] = useState<string | null>(null)
  const [automacao, setAutomacao] = useState(true)
  const [view, setView] = useState<View>('Pesquisa')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Pesquisa>[]
      const normalized = parsed.map((item) => ({
        id: String(item.id), nome: String(item.nome || ''), pergunta: String(item.pergunta || ''),
        metrica: (item.metrica || 'NPS') as Metrica, canal: (item.canal || 'Link') as Pesquisa['canal'],
        status: (item.status || 'Ativa') as Pesquisa['status'], createdAt: String(item.createdAt || new Date().toISOString())
      }))
      setPesquisas(normalized)
      if (normalized.length) setSelectedId(normalized[0].id)
    }
    const responses = window.localStorage.getItem(RESPONSE_KEY)
    if (responses) setRespostas(JSON.parse(responses))
    const cases = window.localStorage.getItem(CASE_KEY)
    if (cases) {
      const parsed = JSON.parse(cases) as Array<Partial<Loop> & { status?: string }>
      setLoops(parsed.map((item) => ({
        id: String(item.id), pesquisaId: String(item.pesquisaId), respostaId: String(item.respostaId),
        status: item.status === 'Resolvida' || item.status === 'Resolvido' ? 'Resolvido' : item.status === 'Em tratamento' ? 'Em tratamento' : 'Novo',
        responsavel: item.responsavel, proximaAcao: item.proximaAcao, resolucao: item.resolucao,
        createdAt: String(item.createdAt || new Date().toISOString()), updatedAt: item.updatedAt
      })))
    }
    const automation = window.localStorage.getItem(AUTOMATION_KEY)
    if (automation !== null) setAutomacao(automation === 'true')
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return pesquisas
    return pesquisas.filter((pesquisa) => [pesquisa.nome, pesquisa.pergunta, pesquisa.metrica, pesquisa.canal, pesquisa.status].some((value) => value.toLowerCase().includes(term)))
  }, [pesquisas, query])

  const selected = pesquisas.find((pesquisa) => pesquisa.id === selectedId) || null
  const selectedFeedbacks = useMemo(() => selected ? respostas.filter((resposta) => resposta.pesquisaId === selected.id) : [], [respostas, selected])
  const selectedLoops = useMemo(() => selected ? loops.filter((item) => item.pesquisaId === selected.id) : [], [loops, selected])

  function persist(next: Pesquisa[]) { setPesquisas(next); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) }
  function persistLoops(next: Loop[]) { setLoops(next); window.localStorage.setItem(CASE_KEY, JSON.stringify(next)) }

  function toggleAutomacao() {
    const next = !automacao
    setAutomacao(next)
    window.localStorage.setItem(AUTOMATION_KEY, String(next))
  }

  function criarPesquisa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const pesquisa: Pesquisa = {
      id: crypto.randomUUID(), nome: String(form.get('nome') || ''), pergunta: String(form.get('pergunta') || ''),
      metrica: String(form.get('metrica') || 'NPS') as Metrica, canal: String(form.get('canal') || 'Link') as Pesquisa['canal'],
      status: 'Ativa', createdAt: new Date().toISOString()
    }
    persist([pesquisa, ...pesquisas])
    setSelectedId(pesquisa.id)
    setView('Pesquisa')
    event.currentTarget.reset()
    setShowForm(false)
  }

  function togglePesquisa(id: string) {
    persist(pesquisas.map((item) => item.id === id ? { ...item, status: item.status === 'Ativa' ? 'Pausada' : 'Ativa' } : item))
  }

  function planejarLoop(event: FormEvent<HTMLFormElement>, respostaId: string) {
    event.preventDefault()
    if (!selected) return
    const form = new FormData(event.currentTarget)
    const responsavel = String(form.get('responsavel') || '').trim()
    const proximaAcao = String(form.get('proximaAcao') || '').trim()
    if (!responsavel || !proximaAcao) return
    const existing = loops.find((item) => item.respostaId === respostaId)
    if (existing) {
      persistLoops(loops.map((item) => item.id === existing.id ? { ...item, responsavel, proximaAcao, status: 'Em tratamento', updatedAt: new Date().toISOString() } : item))
    } else {
      persistLoops([{ id: crypto.randomUUID(), pesquisaId: selected.id, respostaId, status: 'Em tratamento', responsavel, proximaAcao, createdAt: new Date().toISOString() }, ...loops])
    }
    setLoopFormId(null)
    setView('Loops')
  }

  function resolverLoop(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const resolucao = String(form.get('resolucao') || '').trim()
    if (!resolucao) return
    persistLoops(loops.map((item) => item.id === id ? { ...item, status: 'Resolvido', resolucao, updatedAt: new Date().toISOString() } : item))
    setResolveId(null)
  }

  return (
    <main className="service-app">
      <aside className="service-sidebar">
        <Link href="/" className="service-back">← Apps</Link>
        <div className="service-brand">Satisfação</div>
        <nav className="service-nav">
          {(['Pesquisa', 'Feedbacks', 'Loops'] as View[]).map((item) => (
            <button key={item} className={`service-nav-item ${view === item ? 'active' : ''}`} onClick={() => { setView(item); setShowForm(false) }}>{item}</button>
          ))}
        </nav>
        <div className="service-automation"><span>Automação NPS</span><button onClick={toggleAutomacao}>{automacao ? 'Ativa' : 'Pausada'}</button></div>
      </aside>

      <section className="service-list">
        <header className="service-list-head"><strong>Pesquisas</strong><button className="service-new" onClick={() => setShowForm(true)}>Nova</button></header>
        <div className="service-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" /></div>
        <div className="service-records">
          {filtered.length === 0 ? <div className="service-list-empty">Nenhuma pesquisa</div> : filtered.map((pesquisa) => (
            <button key={pesquisa.id} className={`service-record ${selectedId === pesquisa.id ? 'active' : ''}`} onClick={() => { setSelectedId(pesquisa.id); setShowForm(false) }}>
              <div className="service-record-line"><span>{pesquisa.metrica}</span><span>{pesquisa.status}</span></div><strong>{pesquisa.nome}</strong><span>{pesquisa.canal}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="service-workspace">
        {showForm ? (
          <div className="service-create">
            <header className="service-record-head"><div><span className="service-kicker">Nova pesquisa</span><h1>Pesquisa</h1></div><button className="service-quiet" onClick={() => setShowForm(false)}>Cancelar</button></header>
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
              <div><div className="service-record-titleline"><span className="service-kicker">{selected.metrica}</span><span className="service-status">{selected.status}</span></div><h1>{selected.nome}</h1><p>{selected.pergunta}</p></div>
              {view === 'Pesquisa' && <div className="row-actions"><Link className="service-quiet" href={`/satisfacao/responder/${selected.id}`}>Abrir</Link><button className="service-quiet" onClick={() => navigator.clipboard?.writeText(`${location.origin}/satisfacao/responder/${selected.id}`)}>Copiar link</button><button className="service-primary" onClick={() => togglePesquisa(selected.id)}>{selected.status === 'Ativa' ? 'Pausar' : 'Ativar'}</button></div>}
            </header>

            {view === 'Pesquisa' && (
              <div className="service-detail-grid"><div className="service-detail-main"><section className="service-section"><header>Pergunta</header><div className="service-service-text">{selected.pergunta}</div></section></div><aside className="service-detail-side"><div><span>Métrica</span><strong>{selected.metrica}</strong></div><div><span>Canal</span><strong>{selected.canal}</strong></div><div><span>Status</span><strong>{selected.status}</strong></div><div><span>Criada</span><strong>{formatDate(selected.createdAt)}</strong></div></aside></div>
            )}

            {view === 'Feedbacks' && (
              <div className="service-detail-grid"><div className="service-detail-main"><section className="service-section"><header>Feedbacks</header><div className="board">
                {selectedFeedbacks.length === 0 ? <div className="service-list-empty">Nenhum feedback</div> : selectedFeedbacks.map((resposta) => {
                  const loop = loops.find((item) => item.respostaId === resposta.id)
                  return <article className="row" key={resposta.id}>
                    <div className="row-top"><div><div className="row-title">{selected.metrica} {resposta.nota}</div><div className="row-meta">{resposta.comentario || 'Sem comentário'}</div></div><div className="status-group">{selected.metrica === 'NPS' && <span className="status">{npsClass(resposta.nota)}</span>}{loop && <span className="status">{loop.status}</span>}</div></div>
                    <div className="row-actions"><span className="row-meta">{formatDate(resposta.createdAt)}</span>{(!loop || loop.status === 'Novo') && <button className="button secondary" onClick={() => setLoopFormId(resposta.id)}>{loop ? 'Planejar loop' : 'Abrir loop'}</button>}</div>
                    {loopFormId === resposta.id && <form className="service-inline-form stacked" onSubmit={(event) => planejarLoop(event, resposta.id)}><input name="responsavel" placeholder="Responsável" required /><input name="proximaAcao" placeholder="Próxima ação" required /><button className="service-primary" type="submit">Iniciar tratamento</button></form>}
                  </article>
                })}
              </div></section></div></div>
            )}

            {view === 'Loops' && (
              <div className="service-detail-grid"><div className="service-detail-main"><section className="service-section"><header>Loops</header><div className="board">
                {selectedLoops.length === 0 ? <div className="service-list-empty">Nenhum loop</div> : selectedLoops.map((item) => {
                  const resposta = respostas.find((feedback) => feedback.id === item.respostaId)
                  if (!resposta) return null
                  return <article className="row" key={item.id}>
                    <div className="row-top"><div><div className="row-title">{selected.metrica} {resposta.nota}</div><div className="row-meta">{resposta.comentario || 'Sem comentário'}</div></div><span className="status">{item.status}</span></div>
                    {item.status === 'Novo' ? <button className="button secondary" onClick={() => { setView('Feedbacks'); setLoopFormId(item.respostaId) }}>Planejar tratamento</button> : <div className="service-case-data"><div><span>Responsável</span><strong>{item.responsavel || '—'}</strong></div><div><span>Próxima ação</span><strong>{item.proximaAcao || '—'}</strong></div>{item.resolucao && <div><span>Desfecho</span><strong>{item.resolucao}</strong></div>}</div>}
                    {item.status === 'Em tratamento' && <div>{resolveId === item.id ? <form className="service-inline-form" onSubmit={(event) => resolverLoop(event, item.id)}><input name="resolucao" placeholder="Desfecho do contato" required autoFocus /><button className="service-primary" type="submit">Encerrar loop</button></form> : <button className="button secondary" onClick={() => setResolveId(item.id)}>Registrar desfecho</button>}</div>}
                  </article>
                })}
              </div></section></div></div>
            )}
          </>
        ) : <div className="service-workspace-empty">Nenhuma pesquisa</div>}
      </section>
    </main>
  )
}
