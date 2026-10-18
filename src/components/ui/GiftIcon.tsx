type Props = {
  className?: string;
};

export function GiftIcon({ className = "h-5 w-5" }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 12v9H4v-9m16 0V7H4v5m16 0H4m8-5v14m0-14H8.5a2.5 2.5 0 1 1 2.5-2.5V7Zm0 0h3.5a2.5 2.5 0 1 0-2.5-2.5V7Z"
      />
    </svg>
  );
}
