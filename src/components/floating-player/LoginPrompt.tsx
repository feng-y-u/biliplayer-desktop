import './LoginPrompt.css';

interface LoginPromptProps {
  onLogin: () => void;
  onCancel: () => void;
}

export default function LoginPrompt({ onLogin, onCancel }: LoginPromptProps) {
  return (
    <div className="login-prom-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="login-prom-card" onMouseDown={e => e.stopPropagation()}>
        <p className="login-prom-text">
          播放失败，登录 B站 后可使用更高 API 访问频率，播放更稳定
        </p>
        <div className="login-prom-btns">
          <button className="login-prom-btn login-prom-btn-primary" onClick={onLogin}>去登录</button>
          <button className="login-prom-btn" onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  );
}
