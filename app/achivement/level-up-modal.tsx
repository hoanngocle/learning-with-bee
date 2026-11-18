"use client";

import { useCallback, useEffect, useId, useImperativeHandle, useRef, useState, type Ref } from "react";
import { createCelebrationEffects } from "./celebration-effects";
import styles from "./achievements.module.css";

import type { RewardDto } from "../learning/types";

export type LevelUpHandle = { open: (button: HTMLButtonElement) => void };

export function LevelUpModal({ ref, onDismiss, reward, busy, onClaim, onAcknowledge }: {
  ref: Ref<LevelUpHandle>; onDismiss: () => void; reward: RewardDto | null; busy: boolean;
  onClaim: () => Promise<boolean>; onAcknowledge: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const effects = useRef<ReturnType<typeof createCelebrationEffects> | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const acknowledge = useRef(onAcknowledge);
  useEffect(() => { acknowledge.current = onAcknowledge; }, [onAcknowledge]);
  const [replay, setReplay] = useState(0);
  const [closing, setClosing] = useState(false);
  const gradientId = useId();
  const previousOverflow = useRef<string | null>(null);
  const lockScroll = useCallback(() => {
    previousOverflow.current ??= document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }, []);
  const restoreScroll = useCallback(() => {
    if (previousOverflow.current === null) return;
    document.body.style.overflow = previousOverflow.current;
    previousOverflow.current = null;
  }, []);

  useImperativeHandle(ref, () => ({
    open(button) {
      if (!reward) return;
      acknowledge.current();
      if (closeTimer.current) clearTimeout(closeTimer.current);
      closeTimer.current = null;
      trigger.current = button;
      setClosing(false);
      dialog.current?.showModal();
      lockScroll();
      setReplay((value) => value + 1);
      effects.current?.play(true);
    },
  }), [lockScroll, reward]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const celebration = createCelebrationEffects(element);
    effects.current = celebration;
    return () => {

      if (closeTimer.current) clearTimeout(closeTimer.current);
      celebration.dispose();
      restoreScroll();
      effects.current = null;
    };
  }, [lockScroll, restoreScroll]);

  useEffect(() => {
    if (!reward || reward.celebrationSeen) return;
    const timer = setTimeout(() => {
      if (dialog.current?.open) return;
      trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.current?.showModal(); lockScroll(); effects.current?.play(false);
      acknowledge.current();
    }, 0);
    return () => clearTimeout(timer);
  }, [reward, lockScroll]);

  function close() {
    if (closeTimer.current) return;
    setClosing(true);
    effects.current?.stop();
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300;
    closeTimer.current = setTimeout(() => {
      dialog.current?.close();
      closeTimer.current = null;
    }, duration);
  }

  return (
    <dialog ref={dialog} className={styles.modal} data-closing={closing} aria-labelledby="celebration-title" aria-describedby="celebration-description"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClose={() => { effects.current?.stop(); restoreScroll(); trigger.current?.focus(); onDismiss(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <canvas ref={canvas} className={styles.confetti} aria-hidden="true" />
      <div className={styles.modalContent}>
        <div className={styles.sunburst} aria-hidden="true"><svg viewBox="0 0 200 200"><path d="M100 0 112 85 180 30 125 95 200 100 125 105 180 170 112 115 100 200 88 115 20 170 75 105 0 100 75 95 20 30 88 85Z" /></svg></div>
        <div className={styles.sparkles} aria-hidden="true"><span>✨</span><span>🌟</span><span>💫</span><span>⭐</span><span>✨</span></div>
        <button autoFocus type="button" className={styles.closeButton} aria-label="Đóng thông báo" onClick={close}>×</button>
        <p className={styles.modalEyebrow}>🐝 BẠN ONG VÀNG &amp; KUROMI CHÚC MỪNG! 🖤</p>
        <h2 id="celebration-title">CHÚC MỪNG BÉ! <span>🎊</span></h2>
        <p className={styles.modalSubtitle}>Bé đã chính thức bước sang chặng đường kỳ thú mới</p>
        <div className={styles.celebrationBadge}>
          <div className={styles.badgeAura} aria-hidden="true" />
          <div className={styles.royalBadge} key={replay} role="img" aria-label={`Lên cấp độ ${reward?.level ?? 1}`}>
            <span className={styles.crown}>👑</span>
            <svg className={styles.wings} viewBox="0 0 200 120"><g fill="#FFF4D8" stroke="#F19B33" strokeWidth="2.5"><path d="M40 70C10 60 0 35 15 15 30 25 35 45 45 60Z" /><path d="M45 75C20 75 10 50 25 35 38 45 42 60 50 70Z" /><path d="M160 70C190 60 200 35 185 15 170 25 165 45 155 60Z" /><path d="M155 75C180 75 190 50 175 35 162 45 158 60 150 70Z" /></g></svg>
            <div className={styles.royalShield}>
              <svg viewBox="0 0 100 120"><defs>
                <linearGradient id={`${gradientId}-gold`} x1="0%" x2="100%" y1="0%" y2="100%"><stop offset="0%" stopColor="#FFF9E6" /><stop offset="50%" stopColor="#FFE082" /><stop offset="100%" stopColor="#FFA000" /></linearGradient>
                <linearGradient id={`${gradientId}-inner`} x1="0%" x2="0%" y1="0%" y2="100%"><stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#FFF4D8" /></linearGradient>
              </defs><path d="m50 5 40 15v50c0 25-40 48-40 48S10 95 10 70V20Z" fill={`url(#${gradientId}-gold)`} stroke="#E56D27" strokeWidth="3.5" /><path d="m50 13 32 12v41c0 20-32 40-32 40S18 86 18 66V25Z" fill={`url(#${gradientId}-inner)`} /><circle cx="50" cy="50" r="23" fill="#244F97" /><circle cx="50" cy="50" r="20" fill="white" /><text x="50" y="58" textAnchor="middle" fill="#244F97" fontSize="24" fontWeight="900">{reward?.level ?? 1}</text></svg>
              <span className={styles.ribbonEar}>🎀</span><span className={styles.rabbitEar}>🐰</span>
            </div>
            <b className={styles.levelRibbon}>⚡ LEVEL UP! CẤP ĐỘ {reward?.level ?? 1} ⚡</b>
          </div>
        </div>
        <div className={styles.honor}><small>DANH HIỆU MỚI ĐƯỢC TRAO THƯỞNG:</small><h3>🌟 Cấp tài khoản {reward?.level ?? 1} 🌟</h3><p id="celebration-description">Bé đã tích lũy đủ EXP cho một cột mốc mới. Phần thưởng vẫn chờ bé nếu đóng hộp này.</p></div>
        <div className={styles.reward}><span className={styles.rewardIcon} aria-hidden="true">⭐</span><div><small>PHẦN THƯỞNG LÊN CẤP</small><strong>Cấp {reward?.level ?? 1}</strong><p>Nhận một lần cho mỗi cấp tài khoản.</p></div><div className={styles.rewardPills}><b>+{reward?.stars ?? 0} ⭐</b></div></div>
        <p className={styles.previewNote}>{reward?.status === "claimed" ? "✓ Đã nhận thưởng" : "Bấm nhận thưởng để cộng sao vào tài khoản."}</p>
        <div className={styles.modalActions}><button type="button" onClick={() => { setReplay((value) => value + 1); effects.current?.play(true); }}>↻ Xem lại hiệu ứng 🔁</button><button type="button" className={styles.primaryButton} disabled={busy || !reward || reward.status === "claimed"} onClick={async () => { if (await onClaim()) close(); }}>{busy ? "Đang lưu…" : reward?.status === "claimed" ? "Đã nhận thưởng" : "Bé nhận thưởng ngay! 🎁"} <span aria-hidden="true">☆</span></button></div>
      </div>
    </dialog>
  );
}
