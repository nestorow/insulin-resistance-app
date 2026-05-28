// Logo mark: декрещящи инсулинови пикове, успокояващи се до равна линия —
// визуалната метафора на 90-дневния протокол. Цветовете идват от теал палитрата,
// формата работи и при favicon размер. Може да се ползва вградено в JSX.

export default function Logo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Инсулинова резистентност"
      className={className}
    >
      <rect width="32" height="32" rx="7" fill="#1B7A6E" />
      <path
        d="M 4 16 Q 7 5 10 16 Q 13 27 16 16 Q 18.5 9 21 16 L 28 16"
        stroke="#F0FAF6"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
