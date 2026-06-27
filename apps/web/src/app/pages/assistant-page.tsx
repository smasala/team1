import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AiDraftResponse } from 'shared-types';
import { api } from '../api/endpoints';
import { IconAI, IconMic, IconSend } from '../components/icons';
import { Money, Spinner } from '../components/ui';
import { formatMoney, formatPercent } from '../lib/format';
import { useSpeech } from '../lib/use-speech';

interface Message {
  role: 'user' | 'assistant';
  text?: string;
  draft?: AiDraftResponse;
}

const SUGGESTIONS = [
  'Offer for 100m² house demolition',
  '50 m² plaster and 20 m² tiling',
  '8 hours excavation and disposal',
];

export function AssistantPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const speech = useSpeech(setInput);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending]);

  const send = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || pending) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: prompt }]);
    setPending(true);
    try {
      const draft = await api.ai.draftOffer({ prompt });
      setMessages((m) => [...m, { role: 'assistant', draft }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: e instanceof Error ? e.message : 'Something went wrong.',
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  const saveAsOffer = async (draft: AiDraftResponse, idx: number) => {
    setSavingIdx(idx);
    try {
      const offer = await api.offers.create({
        title: draft.title,
        taxRate: draft.taxRate,
        currency: draft.currency,
        items: draft.lines.map((l) => ({
          itemId: l.itemId ?? undefined,
          description: l.description,
          unit: l.unit ?? undefined,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      navigate(`/offers/${offer.id}`);
    } catch {
      setSavingIdx(null);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100dvh - var(--topbar-h) - 80px)' }}>
      {messages.length === 0 && (
        <div style={{ padding: '8px 2px 18px' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Core feature
          </div>
          <h1 style={{ fontSize: 28 }}>Describe the job.</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Tell me the work and the quantities — I’ll match catalogue items and
            draft a priced offer.
          </p>
          <div className="flex-wrap" style={{ marginTop: 16 }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="btn ghost sm"
                onClick={() => send(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="stack" style={{ paddingBottom: 8 }}>
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div
              key={i}
              className="card"
              style={{
                marginLeft: 'auto',
                maxWidth: '85%',
                background: 'var(--surface-2)',
                borderColor: 'var(--line-strong)',
              }}
            >
              {m.text}
            </div>
          ) : m.draft ? (
            <DraftCard
              key={i}
              draft={m.draft}
              saving={savingIdx === i}
              onSave={() => saveAsOffer(m.draft!, i)}
            />
          ) : (
            <div key={i} className="banner-error" style={{ maxWidth: '85%' }}>
              {m.text}
            </div>
          ),
        )}
        {pending && (
          <div className="card row" style={{ maxWidth: '60%', gap: 10 }}>
            <Spinner /> <span className="muted small">Drafting…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer pinned above the tab bar */}
      <div
        style={{
          position: 'sticky',
          bottom: 'calc(var(--tabbar-h) + var(--safe-bottom) + 8px)',
          paddingTop: 8,
          background:
            'linear-gradient(transparent, var(--ink) 22%, var(--ink))',
        }}
      >
        <div className="row" style={{ gap: 8 }}>
          <button
            className={`btn ${speech.listening ? 'primary' : 'ghost'}`}
            onClick={speech.toggle}
            aria-label={speech.supported ? 'Voice input' : 'Insert example'}
            title={speech.supported ? 'Voice input' : 'Voice not supported — inserts an example'}
          >
            <IconMic />
          </button>
          <input
            className="input grow"
            placeholder={speech.listening ? 'Listening…' : 'Describe the work…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
          />
          <button
            className="btn primary"
            onClick={() => send(input)}
            disabled={pending || !input.trim()}
            aria-label="Send"
          >
            <IconSend />
          </button>
        </div>
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  saving,
  onSave,
}: {
  draft: AiDraftResponse;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="card stack" style={{ maxWidth: '92%' }}>
      <div className="row" style={{ gap: 8 }}>
        <span style={{ color: 'var(--hi)' }}>
          <IconAI />
        </span>
        <strong className="truncate">{draft.title}</strong>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 4 }}>
        {draft.lines.map((l, i) => (
          <div className="list-row" key={i}>
            <div className="grow">
              <div className="small truncate">{l.description}</div>
              <div className="tiny faint readout">
                {l.quantity}
                {l.unit ? ` ${l.unit}` : ''} ×{' '}
                {formatMoney(l.unitPrice, draft.currency)}
                {l.matchScore === 0 ? ' · no match' : ''}
              </div>
            </div>
            <span className="money">
              {formatMoney(l.lineTotal, draft.currency)}
            </span>
          </div>
        ))}
        <div className="totals">
          <div className="line">
            <span>Subtotal</span>
            <span className="money">
              {formatMoney(draft.subtotal, draft.currency)}
            </span>
          </div>
          <div className="line">
            <span>VAT {formatPercent(draft.taxRate)}</span>
            <span className="money">
              {formatMoney(draft.taxAmount, draft.currency)}
            </span>
          </div>
          <div className="line grand">
            <span>Total</span>
            <Money value={draft.total} currency={draft.currency} hi />
          </div>
        </div>
      </div>

      <button className="btn primary block" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save as offer'}
      </button>
    </div>
  );
}
