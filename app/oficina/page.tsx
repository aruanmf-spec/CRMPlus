'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

type Ordem = {
  id: string
  cliente: string
  veiculo: string
  servico: string
  status: 'Entrada' | 'Diagnóstico' | 'Execução' | 'Pronto'
  createdAt: string
}

const STORAGE_KEY = 'crmplus.oficina.ordens'

export default function OficinaPage() {
  const [ordens, setOrdens] = useState<Ordem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [automacao, setAutomacao] = useState(true)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) setOrdens(JSON.parse(raw))
  }, [])

  function persist(next: Ordem[]) {
    setOrdens(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function criarOrdem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const ordem: Ordem = {
      id: crypto.randomUUID(),
      cliente: String(form.get('cliente') || ''),
      veiculo: String(form.get('veiculo') || ''),
      servico: String(form.get('servico') || ''),
      status: 'Entrada',
      createdAt: new Date().toISOString()
    }
    persist([ordem, ...ordens])
    event.currentTarget.reset()
    setShowForm(false)
  }

  function avancar(id: string) {
    const fluxo: Ordem['status'][] = ['Entrada', 'Diagnóstico', 'Execução', 'Pronto']
    persist(ordens.map((ordem) => {
      if (ordem.id !== id) return ordem
      const atual = fluxo.indexOf(ordem.status)
      return { ...ordem, status: fluxo[Math.min(atual + 1, fluxo.length - 1)] }
    }))
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="back">← Todos os apps</Link>
        <div className="module-name">Oficina</div>
        <nav className="nav">
          <div className="nav-item active">Ordens</div>
          <div className="nav-item">Fila</div>
          <div className="nav-item">Automação</div>
        </nav>
        <div className="sidebar-foot">Dados de teste permanecem somente neste navegador.</div>
      </aside>

      <section className="workspace">
        <header className="page-head">
          <div>
            <h2>Ordens de serviço</h2>
            <p>Um fluxo operacional: entrada, diagnóstico, execução e conclusão. Sem módulos paralelos que desviem da oficina.</p>
          </div>
          <button className="button" onClick={() => setShowForm((value) => !value)}>Nova ordem</button>
        </header>

        {showForm && (
          <form className="form" onSubmit={criarOrdem}>
            <div className="form-grid">
              <div className="field"><label>Cliente</label><input name="cliente" required autoFocus /></div>
              <div className="field"><label>Veículo</label><input name="veiculo" required /></div>
            </div>
            <div className="field"><label>Serviço solicitado</label><textarea name="servico" required /></div>
            <div><button className="button" type="submit">Criar ordem</button></div>
          </form>
        )}

        <div className="board">
          {ordens.length === 0 ? (
            <div className="empty"><strong>Nenhuma ordem criada.</strong>Crie uma ordem para testar o fluxo localmente neste navegador.</div>
          ) : ordens.map((ordem) => (
            <article className="row" key={ordem.id}>
              <div className="row-top">
                <div><div className="row-title">{ordem.veiculo}</div><div className="row-meta">{ordem.cliente}</div></div>
                <span className="status">{ordem.status}</span>
              </div>
              <div className="row-meta">{ordem.servico}</div>
              {ordem.status !== 'Pronto' && <div><button className="button secondary" onClick={() => avancar(ordem.id)}>Avançar etapa</button></div>}
            </article>
          ))}
        </div>

        <section className="automation">
          <div className="automation-copy">
            <strong>Automação do fluxo</strong>
            <span>Quando uma ordem muda de etapa, o módulo poderá disparar sua própria API sem depender dos outros apps.</span>
          </div>
          <button className="button secondary" onClick={() => setAutomacao((value) => !value)}>{automacao ? 'Ativa' : 'Pausada'}</button>
        </section>
        <div className="rule-list">
          <div className="rule">Entrada → preparar diagnóstico.</div>
          <div className="rule">Diagnóstico → liberar execução quando houver decisão.</div>
          <div className="rule">Pronto → acionar retorno ao cliente pelo conector exclusivo da oficina.</div>
        </div>
      </section>
    </main>
  )
}
