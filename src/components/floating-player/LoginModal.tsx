import { useState, useEffect, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import './LoginModal.css';

interface LoginModalProps {
  onClose: () => void;
}

type UIStatus = 'loading' | 'pending' | 'scanned' | 'error' | 'expired';

export default function LoginModal({ onClose }: LoginModalProps) {
  const [status, setStatus] = useState<UIStatus>('loading');
  const [message, setMessage] = useState('生成二维码中…');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const activeRef = useRef(true);
  const timerRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const stopPoll = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPoll = useCallback(async () => {
    const api = window.electronAPI;
    if (!api) return;
    stopPoll();
    setQrDataUrl('');

    setStatus('loading');
    setMessage('生成二维码中…');

    try {
      const init = await api.loginQrcodeStart();
      if (!activeRef.current) return;
      if (init.status === 'ERROR') {
        setStatus('error');
        setMessage(init.message);
        return;
      }
      const qrContent = init.qrUrl;
      if (qrContent) {
        try {
          const dataUrl = await QRCode.toDataURL(qrContent, { width: 256, margin: 1 });
          setQrDataUrl(dataUrl);
        } catch {
          setStatus('error');
          setMessage('二维码生成失败，请重试');
          return;
        }
      }
      setStatus('pending');
      setMessage(init.message);
    } catch {
      if (activeRef.current) { setStatus('error'); setMessage('网络异常，请重试'); }
      return;
    }

    timerRef.current = window.setInterval(async () => {
      if (!activeRef.current) { stopPoll(); return; }
      try {
        const res = await api.loginQrcodePoll();
        if (!activeRef.current) return;
        setMessage(res.message);
        switch (res.status) {
          case 'SCANNED': setStatus('scanned'); break;
          case 'PENDING': setStatus('pending'); break;
          case 'CONFIRMED': stopPoll(); onCloseRef.current(); break;
          case 'EXPIRED': stopPoll(); setStatus('expired'); break;
          case 'ERROR': stopPoll(); setStatus('error'); break;
        }
      } catch { /* 单次轮询失败不中断 */ }
    }, 2000);
  }, [stopPoll]);

  // 已登录则直接关闭
  useEffect(() => {
    const api = window.electronAPI;
    if (api) api.loginCheck().then(r => { if (r.loggedIn) onClose(); });
  }, [onClose]);

  // 启动轮询 + 卸载清理
  useEffect(() => {
    activeRef.current = true;
    startPoll();
    return () => {
      activeRef.current = false;
      stopPoll();
    };
  }, [startPoll, stopPoll]);

  // ESC 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleRefresh = useCallback(() => {
    startPoll();
  }, [startPoll]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div className="login-backdrop" onMouseDown={handleBackdropClick}>
      <div className="login-card" onMouseDown={e => e.stopPropagation()}>
        <button className="login-close" onClick={onClose} title="取消">✕</button>

        <h3 className="login-title">登录 B站</h3>

        {status === 'loading' && (
          <div className="login-qr-placeholder">
            <div className="login-spinner" />
            <span>{message}</span>
          </div>
        )}

        {(status === 'pending' || status === 'scanned') && qrDataUrl && (
          <img
            className="login-qr-img"
            src={qrDataUrl}
            alt="登录二维码"
          />
        )}

        {(status === 'pending' || status === 'scanned') && (
          <p className={`login-msg${status === 'scanned' ? ' login-msg-scanned' : ''}`}>
            {status === 'scanned' ? <span className="login-check-icon">✓</span> : null}
            {message}
          </p>
        )}

        {status === 'expired' && (
          <div className="login-state-box">
            <p className="login-msg">二维码已过期</p>
            <button className="login-action-btn" onClick={handleRefresh}>刷新二维码</button>
          </div>
        )}

        {status === 'error' && (
          <div className="login-state-box">
            <p className="login-msg">{message || '加载失败'}</p>
            <button className="login-action-btn" onClick={handleRefresh}>重试</button>
          </div>
        )}
      </div>
    </div>
  );
}
