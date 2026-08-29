'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type RegistroExecucao = {
  id: string
  texto: string
  createdAt: string
}

type ItemChecklist = {
  id: string
  texto: string
  concluido: boolean
}

type Ordem = {
  id: string
  cliente: string
  veiculo: string
  servico: string
  tecnico?: string
  scheduledAt?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  registros: RegistroExecucao[]
  checklist: ItemChecklist[]
}

type Evento = {
  id: string
  ordemId: string
  type: string
  createdAt: string
  queued?: boolean
}

const STORAGE_KEY = 'crmplus.oficina.ordens'
const AUTOMATION_KEY = 'crmplus.oficina.automacao'
const EVENT_KEY = 'crmplus.oficina.eventos'

function osNumber(id: string) {
  return `OS ${id.slice(0, 6).toUpperCase()}`
}

function formatDate(value?: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  }).format(new Date(value))
}

function statusOf(ordem: Ordem) {
  if (ordem.completedAt) return 'Concluído'
  if (ordem.startedAt) return 'Em atendimento'
  if (ordem.scheduledAt) return 'Programado'
  return 'Aberto'
}

export default function OficinaPage() {
  const [ordens, setOrdens] = useState<Ordem[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [automacao, setAutomacao] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Ordem>[]
      const normalized: Ordem[] = parsed.map((item) => ({
        id: String(item.id),
        cliente: String(item.cliente || ''),
        veiculo: String(item.veiculo || ''),
        servico: String(item.servico || ''),
        tecnico: item.tecnico ? String(item.tecnico) : '',
        scheduledAt: item.scheduledAt,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
        createdAt: String(item.createdAt || new Date().toISOString()),
        registros: Array.isArray(item.registros) ? item.registros : [],
        checklist: Array.isArray(item.checklist) ? item.checklist : []
      }))
      setOrdens(normalized)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      if (normalized.length) setSelectedId(normalized[0].id)
    }

    const history = window.localStorage.getItem(EVENT_KEY)
    if (history) setEventos(JSON.parse(history))
    const automation = window.localStorage.getItem(AUTOMATION_KEY)
    if (automation !== null) setAutomacao(automation === 'true')
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return ordens
    return ordens.filter((ordem) => [ordem.cliente, ordem.veiculo, ordem.servico, ordem.tecnico, statusOf(ordem)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term)))
  }, [ordens, query])

  const selected = ordens.find((ordem) => ordem.id === selectedId) || null
  const selectedHistory = useMemo(() => selected ? eventos.filter((evento) => evento.ordemId === selected.id) : [], [eventos, selected])

  function persist(next: Ordem[]) {
    setOrdens(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function updateSelected(patch: Partial<Ordem>) {
    if (!selected) return
    persist(ordens.map((item) => item.id === selected.id ? { ...item, ...patch } : item))
  }

  function toggleAutomacao() {
    const next = !automacao
    setAutomacao(next)
    window.localStorage.setItem(AUTOMATION_KEY, String(next))
  }

  function recordEvent(ordemId: string, type: string) {
    const event: Evento = {
      id: crypto.randomUUID(), ordemId, type, createdAt: new Date().toISOString(), queued: automacao
    }
    const next = [event, ...eventos].slice(0, 200)
    setEventos(next)
    window.localStorage.setItem(EVENT_KEY, JSON.stringify(next))
  }

  function criarOrdem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const ordem: Ordem = {
      id: crypto.randomUUID(),
      cliente: String(form.get('cliente') || ''),
      veiculo: String(form.get('veiculo') || ''),
      servico: String(form.get('servico') || ''),
      tecnico: String(form.get('tecnico') || ''),
      createdAt: new Date().toISOString(),
      registros: [],
      checklist: []
    }
    persist([ordem, ...ordens])
    recordEvent(ordem.id, 'OS criada')
    setSelectedId(ordem.id)
    event.currentTarget.reset()
    setShowForm(false)
  }

  function salvarProgramacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    const form = new FormData(event.currentTarget)
    const scheduledAt = String(form.get('scheduledAt') || '')
    const tecnico = String(form.get('tecnico') || '')
    updateSelected({ scheduledAt: scheduledAt || undefined, tecnico })
    recordEvent(selected.id, scheduledAt ? 'Atendimento programado' : 'Programação removida')
    setShowSchedule(false)
  }

  function iniciarAtendimento() {
    if (!selected || selected.startedAt || selected.completedAt) return
    const startedAt = new Date().toISOString()
    updateSelected({ startedAt })
    recordEvent(selected.id, 'Atendimento iniciado')
  }

  function adicionarRegistro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !selected.startedAt || selected.completedAt) return
    const form = new FormData(event.currentTarget)
    const texto = String(form.get('registro') || '').trim()
    if (!texto) return
    const registro: RegistroExecucao = { id: crypto.randomUUID(), texto, createdAt: new Date().toISOString() }
    updateSelected({ registros: [registro, ...selected.registros] })
    recordEvent(selected.id, 'Execução registrada')
    event.currentTarget.reset()
  }

  function adicionarChecklist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || selected.completedAt) return
    const form = new FormData(event.currentTarget)
    const texto = String(form.get('check') || '').trim()
    if (!texto) return
    updateSelected({ checklist: [...selected.checklist, { id: crypto.randomUUID(), texto, concluido: false }] })
    event.currentTarget.reset()
  }

  function alternarChecklist(id: string) {
    if (!selected || selected.completedAt) return
    updateSelected({ checklist: selected.checklist.map((item) => item.id === id ? { ...item, concluido: !item.concluido } : item) })
  }

  const pendencias = selected ? selected.checklist.filter((item) => !item.concluido).length : 0
  const podeConcluir = Boolean(selected?.startedAt && selected.registros.length > 0 && pendencias === 0 && !selected.completedAt)

  function concluirAtendimento() {
    if (!selected || !podeConcluir) return
    updateSelected({ completedAt: new Date().toISOString() })
    recordEvent(selected.id, 'Atendimento concluído')
  }

  return (
    <main className="service-app">
      <aside className="service-sidebar">
        <Link href="/" className="service-back">← Apps</Link>
        <div className="service-brand">Oficina</div>
        <nav className="service-nav"><div className="service-nav-item active">Atendimentos</div></nav>
        <div className="service-automation"><span>Automação</span><button onClick={toggleAutomacao}>{automacao ? 'Ativa' : 'Pausada'}</button></div>
      </aside>

      <section className="service-list">
        <header className="service-list-head"><strong>Atendimentos</strong><button className="service-new" onClick={() => setShowForm(true)}>Nova OS</button></header>
        <div className="service-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" /></div>
        <div className="service-records">
          {filtered.length === 0 ? <div className="service-list-empty">Nenhuma OS</div> : filtered.map((ordem) => (
            <button key={ordem.id} className={`service-record ${selectedId === ordem.id ? 'active' : ''}`} onClick={() => { setSelectedId(ordem.id); setShowForm(false); setShowSchedule(false) }}>
              <div className="service-record-line"><span>{osNumber(ordem.id)}</span><span>{statusOf(ordem)}</span></div>
              <strong>{ordem.veiculo}</strong><span>{ordem.cliente}</span>{ordem.tecnico && <small>{ordem.tecnico}</small>}
            </button>
          ))}
        </div>
      </section>

      <section className="service-workspace">
        {showForm ? (
          <div className="service-create">
            <header className="service-record-head"><div><span className="service-kicker">Nova OS</span><h1>Atendimento</h1></div><button className="service-quiet" onClick={() => setShowForm(false)}>Cancelar</button></header>
            <form className="service-form" onSubmit={criarOrdem}>
              <label>Cliente<input name="cliente" required autoFocus /></label>
              <label>Veículo<input name="veiculo" required /></label>
              <label>Técnico<input name="tecnico" /></label>
              <label>Serviço<textarea name="servico" required /></label>
              <div><button className="service-primary" type="submit">Criar OS</button></div>
            </form>
          </div>
        ) : selected ? (
          <>
            <header className="service-record-head">
              <div><div className="service-record-titleline"><span className="service-kicker">{osNumber(selected.id)}</span><span className="service-status">{statusOf(selected)}</span></div><h1>{selected.veiculo}</h1><p>{selected.cliente}</p></div>
              <div className="row-actions">
                {!selected.completedAt && <button className="service-quiet" onClick={() => setShowSchedule((value) => !value)}>{selected.scheduledAt ? 'Reprogramar' : 'Programar'}</button>}
                {!selected.startedAt && !selected.completedAt && <button className="service-primary" onClick={iniciarAtendimento}>Iniciar atendimento</button>}
                {selected.startedAt && !selected.completedAt && <button className="service-primary" disabled={!podeConcluir} onClick={concluirAtendimento}>Concluir atendimento</button>}
              </div>
            </header>

            {showSchedule && (
              <form className="service-inline-form" onSubmit={salvarProgramacao}>
                <label>Data e hora<input type="datetime-local" name="scheduledAt" defaultValue={selected.scheduledAt?.slice(0, 16)} /></label>
                <label>Técnico<input name="tecnico" defaultValue={selected.tecnico} /></label>
                <button className="service-primary" type="submit">Salvar</button>
              </form>
            )}

            <div className="service-detail-grid">
              <div className="service-detail-main">
                <section className="service-section"><header>Serviço</header><div className="service-service-text">{selected.servico}</div></section>

                <section className="service-section">
                  <header>Execução</header>
                  {selected.startedAt && !selected.completedAt && (
                    <form className="service-inline-form" onSubmit={adicionarRegistro}><input name="registro" placeholder="Registrar trabalho realizado" /><button className="service-primary" type="submit">Registrar</button></form>
                  )}
                  <div className="service-timeline">
                    {selected.registros.length === 0 ? <div className="service-list-empty">Nenhum registro</div> : selected.registros.map((registro) => (
                      <div className="service-timeline-row" key={registro.id}><span className="service-timeline-dot" /><div><strong>{registro.texto}</strong><span>{formatDate(registro.createdAt)}</span></div></div>
                    ))}
                  </div>
                </section>

                <section className="service-section">
                  <header>Checklist {pendencias > 0 ? `· ${pendencias} pendente${pendencias > 1 ? 's' : ''}` : ''}</header>
                  {!selected.completedAt && (
                    <form className="service-inline-form" onSubmit={adicionarChecklist}><input name="check" placeholder="Adicionar requisito" /><button className="service-quiet" type="submit">Adicionar</button></form>
                  )}
                  <div className="service-checklist">
                    {selected.checklist.length === 0 ? <div className="service-list-empty">Sem requisitos</div> : selected.checklist.map((item) => (
                      <label key={item.id} className="service-check-item"><input type="checkbox" checked={item.concluido} disabled={Boolean(selected.completedAt)} onChange={() => alternarChecklist(item.id)} /><span>{item.texto}</span></label>
                    ))}
                  </div>
                </section>

                <section className="service-section"><header>Atividade</header><div className="service-timeline">
                  {selectedHistory.length === 0 ? <div className="service-list-empty">Nenhuma atividade</div> : selectedHistory.map((evento) => (
                    <div className="service-timeline-row" key={evento.id}><span className="service-timeline-dot" /><div><strong>{evento.type}</strong><span>{formatDate(evento.createdAt)}</span></div></div>
                  ))}
                </div></section>
              </div>

              <aside className="service-detail-side">
                <div><span>Cliente</span><strong>{selected.cliente}</strong></div>
                <div><span>Veículo</span><strong>{selected.veiculo}</strong></div>
                <div><span>Técnico</span><strong>{selected.tecnico || '—'}</strong></div>
                <div><span>Programado</span><strong>{formatDate(selected.scheduledAt)}</strong></div>
                <div><span>Iniciado</span><strong>{formatDate(selected.startedAt)}</strong></div>
                <div><span>Concluído</span><strong>{formatDate(selected.completedAt)}</strong></div>
              </aside>
            </div>
          </>
        ) : <div className="service-workspace-empty">Nenhum atendimento</div>}
      </section>
    </main>
  )
}
