import { AVATAR_CHARACTERS, type AvatarAccessory } from "@/lib/avatar-characters";

function Accessory({ type }: { type: AvatarAccessory }) {
  switch (type) {
    case "leaf":
      return (
        <path
          d="M50 8 C40 2 30 6 32 16 C42 18 50 16 50 8 Z"
          fill="#4b8a3f"
          stroke="#3a6e30"
          strokeWidth="1.5"
        />
      );
    case "chefHat":
      return (
        <path
          d="M28 20 C24 6 44 0 50 10 C56 0 76 6 72 20 L72 24 L28 24 Z"
          fill="white"
          stroke="#d8d8d8"
          strokeWidth="1.5"
        />
      );
    case "steam":
      return (
        <g stroke="#c9c9c9" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M40 6 C38 12 44 14 42 20" />
          <path d="M55 6 C53 12 59 14 57 20" />
        </g>
      );
    case "cap":
      return <path d="M14 42 C14 22 86 22 86 42 Z" fill="#e8e8e8" stroke="#cfcfcf" strokeWidth="1.5" />;
    default:
      return null;
  }
}

/** Renders a stored avatar value: a character id (cartoon mascot), an emoji, or null. */
export function AvatarGlyph({ value, className }: { value: string; className?: string }) {
  const character = AVATAR_CHARACTERS.find((c) => c.id === value);
  if (!character) {
    return <span className={className}>{value}</span>;
  }

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={character.label}>
      <circle cx="50" cy="54" r="38" fill={character.bodyColor} />
      <Accessory type={character.accessory} />
      <circle cx="38" cy="50" r="5" fill="#2b2b2b" />
      <circle cx="62" cy="50" r="5" fill="#2b2b2b" />
      <circle cx="30" cy="62" r="6" fill="#000" opacity="0.12" />
      <circle cx="70" cy="62" r="6" fill="#000" opacity="0.12" />
      <path
        d="M38 66 Q50 76 62 66"
        fill="none"
        stroke="#2b2b2b"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
