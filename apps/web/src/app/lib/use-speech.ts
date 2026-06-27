import { useEffect, useRef, useState } from 'react';

/** Minimal slice of the Web Speech API we use. */
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

const EXAMPLE = 'I need an offer for 100m² house demolition';

/**
 * Voice-to-text for the assistant. Uses the browser SpeechRecognition API when
 * available; otherwise the mic button simulates input by dropping in an example
 * prompt so the flow stays demonstrable.
 */
export function useSpeech(onText: (text: string) => void) {
  const ctor = (
    window as unknown as {
      SpeechRecognition?: RecognitionCtor;
      webkitSpeechRecognition?: RecognitionCtor;
    }
  );
  const Recognition = ctor.SpeechRecognition ?? ctor.webkitSpeechRecognition;
  const supported = !!Recognition;

  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const toggle = () => {
    if (!Recognition) {
      onText(EXAMPLE); // simulated voice
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Recognition();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      onText(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  useEffect(() => () => recRef.current?.stop(), []);

  return { supported, listening, toggle };
}
