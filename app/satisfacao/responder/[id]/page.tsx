'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

type Metrica = 'NPS' | 'CSAT' | 'CES'

type Pesquisa = {
  id: string
  nome: string
  pergunta: string
  metrica: Metrica
  canal: 'Link' | 'WhatsApp' | 'Email'
  status: 'Ativa' | 'Pausada'
}

type Resposta = {
  id: string
  pesquisaId: string
  nota: number
  comentario?: string
  createdAt: string
}

const STORAGE_KEY = 'crmplus.satisfacao.pesquisas'
const RESPONSE_KEY = 'crmplus.satisfacao.respostas'
const CASE_KEY = 'crmplus.satisfacao.tratativas'
const AUTOMATION_KEY = 'crmplus.satisfacao.automacao'

function shouldOpenLoop(metrica: Metrica, nota: number) {
  return metrica === 'NPS' && nota <= 6
}

function scaleFor(metrica: Metrica) {
  if (metrica === 'NPS') return Array.from({ length: 11 }, (_, index) => index)
  if (metrica === 'CSAT') return [1, 2, 3, 4, 5]
  return [1, 2, 3, 4, 5, 6, 7]
}

export default function ResponderPage() {
  const params = useParams<{ id: string }>()
  const id = String(params.id)
  const [pesquisa, setPesquisa] = useState<Pesquisa | null>(null)
  const [nota, setNota] = useState<number | null>(null)
  const [enviada, setEnviada] = useState(false)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Pesquisa[]
    setPesquisa(parsed.find((item) => item.id === id) || null)
  }, [id])

  const scale = useMemo(() => pesquisa ? scaleFor(pesquisa.metrica) : [], [pesquisa])

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pesquisa || nota === null || pesquisa.status !== 'Ativa') return

    const form = new FormData(event.currentTarget)
    const resposta: Resposta = {
      id: crypto.randomUUID(),
      pesquisaId: pesquisa.id,
      nota,
      comentario: String(form.get('comentario') || ''),
      createdAt: new Date().toISOString()
    }

    const raw = window.localStorage.getItem(RESPONSE_KEY)
    const respostas = raw ? JSON.parse(raw) : []
    window.localStorage.setItem(RESPONSE_KEY, JSON.stringify([resposta, ...respostas]))

    const automation = window.localStorage.getItem(AUTOMATION_KEY) !== 'false'
    if (automation && shouldOpenLoop(pesquisa.metrica, nota)) {
      const caseRaw = window.localStorage.getItem(CASE_KEY)
      const cases = caseRaw ? JSON.parse(caseRaw) : []
      cases.unshift({
        id: crypto.randomUUID(),
        pesquisaId: pesquisa.id,
        respostaId: resposta.id,
        status: 'Novo',
        createdAt: new Date().toISOString()
      })
      window.localStorage.setItem(CASE_KEY, JSON.stringify(cases))
    }

    setEnviada(true)
  }

  if (!pesquisa) {
    return <main className="survey-screen"><div className="survey-card"><strong>Pesquisa indisponível</strong></div></main>
  }

  if (enviada) {
    return (
      <main className="survey-screen">
        <div className="survey-card survey-done">
          <strong>Resposta enviada</strong>
          <Link href="/satisfacao" className="button secondary">Voltar</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="survey-screen">
      <form className="survey-card" onSubmit={enviar}>
        <div className="survey-brand">{pesquisa.nome}</div>
        <h1 className="survey-question">{pesquisa.pergunta}</h1>
        <div className="score-grid">
          {scale.map((value) => (
            <button key={value} type="button" className={`score-button ${nota === value ? 'selected' : ''}`} onClick={() => setNota(value)}>{value}</button>
          ))}
        </div>
        <div className="field"><label>Comentário</label><textarea name="comentario" /></div>
        <button className="button" type="submit" disabled={nota === null || pesquisa.status !== 'Ativa'}>Enviar</button>
      </form>
    </main>
  )
}
