import Link from "next/link";

/** Header mark + wordmark. Both logo files are in the page; CSS shows the one for the current theme. */
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="Xeon Net home">
      <img src="/img/logo-mark.png" alt="" className="logo-dark" width={44} height={28} />
      <img src="/img/logo-mark-light.png" alt="" className="logo-light" width={44} height={28} />
      <span className="brand-word">XEON <em>NET</em></span>
    </Link>
  );
}

export function FullLogo({ width = 180 }: { width?: number }) {
  return (
    <>
      <img src="/img/logo-full.png" alt="Xeon Net — Full Stack Development & Digital Solution" className="logo-dark" style={{ width, height: "auto" }} />
      <img src="/img/logo-full-light.png" alt="Xeon Net — Full Stack Development & Digital Solution" className="logo-light" style={{ width, height: "auto" }} />
    </>
  );
}
