import Image from "next/image";

/** Logo con versión clara y oscura (se elige según el tema del dispositivo). */
export function Logo({ name, priority = false }: { name: string; priority?: boolean }) {
  return (
    <>
      <Image className="logo-img l" src="/logo-light.png" alt={name} width={480} height={262} priority={priority} />
      <Image className="logo-img d" src="/logo-dark.png" alt="" aria-hidden width={480} height={262} priority={priority} />
    </>
  );
}
