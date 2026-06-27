import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AiDraftResponse } from 'shared-types';
import { api } from '../api/endpoints';
import { IconAI, IconMic, IconSend } from '../components/icons';
import { Money, Spinner } from '../components/ui';
import { useI18n } from '../i18n/i18n';
import { formatMoney, formatPercent } from '../lib/format';
import { useSpeech } from '../lib/use-speech';

interface Message {
  role: 'user' | 'assistant';
  text?: string;
  draft?: AiDraftResponse;
}

export function AssistantPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const speech = useSpeech(setInput);

  const suggestions = [
    t('assistant.suggestion1'),
    t('assistant.suggestion2'),
    t('assistant.suggestion3'),
  ];

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
          text: e instanceof Error ? e.message : t('assistant.error'),
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
            {t('assistant.coreFeature')}
          </div>
          <h1 style={{ fontSize: 28 }}>{t('assistant.describeJob')}</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {t('assistant.describeHint')}
          </p>
          <div className="flex-wrap" style={{ marginTop: 16 }}>
            {suggestions.map((s) => (
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
        {messages.map((m, i) => {
          if (m.role === 'user') {
            return (
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
            );
          }
          const draft = m.draft;
          if (draft) {
            return (
              <DraftCard
                key={i}
                draft={draft}
                saving={savingIdx === i}
                onSave={() => saveAsOffer(draft, i)}
              />
            );
          }
          return (
            <div key={i} className="banner-error" style={{ maxWidth: '85%' }}>
              {m.text}
            </div>
          );
        })}
        {pending && (
          <div className="card row" style={{ maxWidth: '60%', gap: 10 }}>
            <Spinner /> <span className="muted small">{t('assistant.drafting')}</span>
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
            aria-label={
              speech.supported
                ? t('assistant.voiceInput')
                : t('assistant.insertExample')
            }
            title={
              speech.supported
                ? t('assistant.voiceInput')
                : t('assistant.voiceUnsupported')
            }
          >
            <IconMic />
          </button>
          <input
            className="input grow"
            placeholder={
              speech.listening
                ? t('assistant.listening')
                : t('assistant.placeholder')
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
          />
          <button
            className="btn primary"
            onClick={() => send(input)}
            disabled={pending || !input.trim()}
            aria-label={t('assistant.send')}
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
  const { t } = useI18n();
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
                {l.matchScore === 0 ? ` · ${t('assistant.noMatch')}` : ''}
              </div>
            </div>
            <span className="money">
              {formatMoney(l.lineTotal, draft.currency)}
            </span>
          </div>
        ))}
        <div className="totals">
          <div className="line">
            <span>{t('assistant.subtotal')}</span>
            <span className="money">
              {formatMoney(draft.subtotal, draft.currency)}
            </span>
          </div>
          <div className="line">
            <span>
              {t('assistant.vat')} {formatPercent(draft.taxRate)}
            </span>
            <span className="money">
              {formatMoney(draft.taxAmount, draft.currency)}
            </span>
          </div>
          <div className="line grand">
            <span>{t('assistant.total')}</span>
            <Money value={draft.total} currency={draft.currency} hi />
          </div>
        </div>
      </div>

      <button className="btn primary block" onClick={onSave} disabled={saving}>
        {saving ? t('assistant.saving') : t('assistant.saveAsOffer')}
      </button>
    </div>
  );
}
