"use client"; // tracks mouse position to drive the 3D hover-tilt transform

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";

const REST_TRANSFORM = "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)";

export function TiltLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [transform, setTransform] = useState(REST_TRANSFORM);

  const style: CSSProperties = { transform, transition: "transform 150ms ease-out" };

  return (
    <Link
      ref={ref}
      href={href}
      className={className}
      style={style}
      onMouseMove={(event) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        setTransform(
          `perspective(700px) rotateX(${y * -12}deg) rotateY(${x * 12}deg) scale(1.04)`,
        );
      }}
      onMouseLeave={() => setTransform(REST_TRANSFORM)}
    >
      {children}
    </Link>
  );
}