export default function LockIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      aria-hidden 
      focusable="false"
    >
      <g 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <rect x="4.5" y="10.5" width="15" height="9" rx="2.5" />
        <path d="M8 10.5V8.2a4 4 0 1 1 8 0v2.3" />
        <path d="M12 14.5v2.5" />
      </g>
    </svg>
  );
}
