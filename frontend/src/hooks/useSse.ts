import { useEffect, useRef } from 'react';

const SSE_URL = `${import.meta.env.VITE_API_URL ?? ''}/sse`;

type Handler = (data: unknown) => void;

/**
 * Abre uma conexão SSE com o backend e chama handlers por evento nomeado.
 * Reconexão automática via EventSource nativo do browser.
 * handlers deve ser estável (definido fora do render ou via useMemo/useCallback)
 * para evitar re-subscribes desnecessários.
 */
export function useSse(handlers: Record<string, Handler>): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let es: EventSource | null = null;

    try {
      es = new EventSource(SSE_URL, { withCredentials: false });
    } catch {
      return;
    }

    const attached: [string, EventListener][] = [];

    for (const event of Object.keys(handlersRef.current)) {
      const listener = (e: Event) => {
        try {
          handlersRef.current[event]?.(JSON.parse((e as MessageEvent).data));
        } catch { /* ignore parse errors */ }
      };
      es.addEventListener(event, listener as EventListener);
      attached.push([event, listener as EventListener]);
    }

    return () => {
      for (const [event, listener] of attached) {
        es?.removeEventListener(event, listener);
      }
      es?.close();
    };
  // Abre a conexão uma única vez — handlers ficam estáveis via ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
