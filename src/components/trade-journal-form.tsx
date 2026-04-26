'use client'

import { useMemo, useState } from 'react'

const mistakeOptions = [
  'Overtrading',
  'Revenge Trading',
  'Risked Too Much',
  'Exit Early',
  'Exit Too Late',
  'FOMO Entry',
  'No Clear Plan',
  'Ignored SL',
  'No Mistakes',
]

const emotionalOptions = [
  'Calm',
  'Frustrated',
  'Over Confidence',
  'Anxious',
  'Impatient',
]

function todayDate() {
  return new Date().toISOString().split('T')[0]
}

export default function TradeJournalForm() {
  const defaultDate = useMemo(() => todayDate(), [])
  const [date, setDate] = useState(defaultDate)
  const [tradeType, setTradeType] = useState('Call')
  const [entryTime, setEntryTime] = useState('')
  const [exitTime, setExitTime] = useState('')
  const [exitReason, setExitReason] = useState('Target')
  const [quantity, setQuantity] = useState('')
  const [result, setResult] = useState('')
  const [mistakes, setMistakes] = useState<string[]>([])
  const [emotionalState, setEmotionalState] = useState<string[]>([])
  const [learnedLessons, setLearnedLessons] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const toggleValue = (
    value: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (value === 'No Mistakes') {
      setter(list.includes('No Mistakes') ? [] : ['No Mistakes'])
      return
    }

    const withoutNoMistakes = list.filter((item) => item !== 'No Mistakes')

    if (withoutNoMistakes.includes(value)) {
      setter(withoutNoMistakes.filter((item) => item !== value))
    } else {
      setter([...withoutNoMistakes, value])
    }
  }

  const toggleEmotion = (value: string) => {
    setEmotionalState((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    )
  }

  const resetForm = () => {
    setDate(todayDate())
    setTradeType('Call')
    setEntryTime('')
    setExitTime('')
    setExitReason('Target')
    setQuantity('')
    setResult('')
    setMistakes([])
    setEmotionalState([])
    setLearnedLessons('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    const response = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        tradeType,
        entryTime,
        exitTime,
        exitReason,
        quantity: Number(quantity),
        result: Number(result),
        mistakes,
        emotionalState,
        learnedLessons,
      }),
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setStatus(data.error || 'Failed to save trade.')
      return
    }

    setStatus('Trade saved successfully.')
    resetForm()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur md:p-8"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-2 text-sm text-slate-200">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
            required
          />
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          Trade Type
          <select
            value={tradeType}
            onChange={(e) => setTradeType(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
          >
            <option>Call</option>
            <option>Put</option>
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          Quantity
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
            required
          />
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          Trade Enter Time
          <input
            type="time"
            value={entryTime}
            onChange={(e) => setEntryTime(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
            required
          />
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          Trade Exit Time
          <input
            type="time"
            value={exitTime}
            onChange={(e) => setExitTime(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
            required
          />
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          Exit Reason
          <select
            value={exitReason}
            onChange={(e) => setExitReason(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
          >
            <option>Target</option>
            <option>SL</option>
            <option>Other</option>
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          Result
          <input
            type="number"
            step="0.01"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
            required
          />
        </label>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <h2 className="text-base font-semibold text-white">Mistakes</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {mistakeOptions.map((item) => (
            <label key={item} className="flex items-center gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={mistakes.includes(item)}
                onChange={() => toggleValue(item, mistakes, setMistakes)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <h2 className="text-base font-semibold text-white">Emotional State</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {emotionalOptions.map((item) => (
            <label key={item} className="flex items-center gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={emotionalState.includes(item)}
                onChange={() => toggleEmotion(item)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="block space-y-2 text-sm text-slate-200">
        Learned Lessons
        <textarea
          value={learnedLessons}
          onChange={(e) => setLearnedLessons(e.target.value)}
          rows={5}
          required
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
          placeholder="Write what you learned from this trade..."
        />
      </label>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-70"
        >
          {loading ? 'Saving...' : 'Save Trade'}
        </button>

        {status ? <p className="text-sm text-slate-300">{status}</p> : null}
      </div>
    </form>
  )
}