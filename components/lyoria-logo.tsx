import Image from "next/image";

type LyoriaLogoProps = {
  className?: string;
  priority?: boolean;
};

export function LyoriaLogo({ className, priority = false }: LyoriaLogoProps) {
  return (
    <Image
      src="/lyoria-logo.png"
      alt="Lyoria"
      width={834}
      height={330}
      className={className}
      priority={priority}
    />
  );
}
