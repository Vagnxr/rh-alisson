import { useEffect, useState } from 'react';

const PHRASES = [
  { static: 'Acompanhe seu ', text: 'fluxo de caixa' },
  { static: 'Gerencie suas ', text: 'vendas com precisão' },
  { static: 'Tome decisões com ', text: 'dados inteligentes' },
  { static: 'Controle todas as suas ', text: 'despesas' },
  { static: 'Controle de cartões em ', text: 'tempo real' },
] as const;

export function useTypewriter() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [staticText, setStaticText] = useState<string>(PHRASES[0].static);

  const phrase = PHRASES[phraseIndex];
  const dynamicText = phrase.text.slice(0, charIndex);

  useEffect(() => {
    const phrase = PHRASES[phraseIndex];
    let delay = deleting ? 30 : 55;

    if (!deleting && charIndex === 0) {
      setStaticText(phrase.static);
    }

    if (!deleting && charIndex < phrase.text.length) {
      const t = window.setTimeout(() => setCharIndex((c) => c + 1), delay);
      return () => window.clearTimeout(t);
    }

    if (!deleting && charIndex === phrase.text.length) {
      const t = window.setTimeout(() => setDeleting(true), 2200);
      return () => window.clearTimeout(t);
    }

    if (deleting && charIndex > 0) {
      const t = window.setTimeout(() => setCharIndex((c) => c - 1), delay);
      return () => window.clearTimeout(t);
    }

    if (deleting && charIndex === 0) {
      const t = window.setTimeout(() => {
        setDeleting(false);
        setPhraseIndex((i) => (i + 1) % PHRASES.length);
      }, 300);
      return () => window.clearTimeout(t);
    }
  }, [phraseIndex, charIndex, deleting]);

  return { staticText, dynamicText };
}
