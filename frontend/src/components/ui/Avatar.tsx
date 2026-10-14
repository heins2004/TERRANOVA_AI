import Image from "next/image";

const VALID_AVATAR_REGEX = /^avatar-(0[1-9]|1[0-9]|20)$/;

type AvatarProps = {
  avatarKey?: string | null;
  size?: number;
  className?: string;
  alt?: string;
};

export function Avatar({
  avatarKey,
  size = 36,
  className = "",
  alt = "User avatar",
}: AvatarProps) {
  const resolvedKey =
    avatarKey && VALID_AVATAR_REGEX.test(avatarKey) ? avatarKey : "avatar-01";

  return (
    <Image
      src={`/avatars/${resolvedKey}.svg`}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full shrink-0 select-none object-cover ${className}`}
      unoptimized
    />
  );
}
