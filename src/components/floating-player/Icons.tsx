export function PlayPauseIcon({ isPlaying }: { isPlaying: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      {isPlaying
        ? <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>
        : <path d="M8 5v14l11-7z" />
      }
    </svg>
  );
}

export function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  );
}
