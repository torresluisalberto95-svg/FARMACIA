import { useEffect, useRef, useState, useCallback } from "react";

const WARN_AFTER_MS  = 4.5 * 60 * 1000; // 4 min 30 s → mostrar aviso
const LOGOUT_AFTER_MS = 30 * 1000;       // 30 s después → cerrar sesión

const ACTIVITY_EVENTS = [
  "mousemove", "mousedown", "keydown",
  "touchstart", "scroll", "click",
] as const;

export function useInactivityTimer(onLogout: () => void) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown]     = useState(30);

  const warnTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer   = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = useCallback(() => {
    if (warnTimer.current)   clearTimeout(warnTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (tickTimer.current)   clearInterval(tickTimer.current);
  }, []);

  const startWarnTimer = useCallback(() => {
    clearAll();
    warnTimer.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(30);

      // Tick cada segundo para el contador regresivo
      tickTimer.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(tickTimer.current!);
            return 0;
          }
          return c - 1;
        });
      }, 1000);

      // Cierre automático al llegar a 0
      logoutTimer.current = setTimeout(() => {
        setShowWarning(false);
        onLogout();
      }, LOGOUT_AFTER_MS);
    }, WARN_AFTER_MS);
  }, [clearAll, onLogout]);

  // Reinicia el timer ante cualquier actividad del usuario
  const resetTimer = useCallback(() => {
    setShowWarning(false);
    startWarnTimer();
  }, [startWarnTimer]);

  useEffect(() => {
    startWarnTimer();
    ACTIVITY_EVENTS.forEach(ev =>
      window.addEventListener(ev, resetTimer, { passive: true })
    );
    return () => {
      clearAll();
      ACTIVITY_EVENTS.forEach(ev =>
        window.removeEventListener(ev, resetTimer)
      );
    };
  }, [startWarnTimer, resetTimer, clearAll]);

  // "Continuar trabajando" → reinicia contador
  const continuar = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // "Cerrar sesión ahora" → cierre inmediato
  const cerrarAhora = useCallback(() => {
    clearAll();
    setShowWarning(false);
    onLogout();
  }, [clearAll, onLogout]);

  return { showWarning, countdown, continuar, cerrarAhora };
}
