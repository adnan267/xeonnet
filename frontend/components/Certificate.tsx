import { longDate } from "@/lib/format";

export type CertData = {
  code: string; holder_name: string; doc_type: string; title: string; duration: string;
  start_date: string | null; end_date: string | null; period: string; issued_on: string;
  ceo_signature?: string; hr_signature?: string;
  qr_off?: boolean;   // preview only: QR is made when the certificate is saved
};

/** Xeon Net certificate, A4 landscape. Styles live in app/certificate.css. */
export default function Certificate({ c }: { c: CertData }) {
  const intern = c.doc_type.startsWith("Internship");
  const start = longDate(c.start_date), end = longDate(c.end_date);
  return (
    <div className="xc-page">
      <svg className="xc-geo" viewBox="0 0 297 210" preserveAspectRatio="none" aria-hidden="true">
        <polygon points="227,0 230,0 297,67 297,70" fill="#d4d6da" />
        <polygon points="236,0 247,0 297,50 297,61" fill="#E5701A" />
        <polygon points="254,0 297,0 297,43" fill="#141414" />
        <polygon points="0,140 70,210 67,210 0,143" fill="#d4d6da" />
        <polygon points="0,149 61,210 50,210 0,160" fill="#E5701A" />
        <polygon points="0,167 43,210 0,210" fill="#141414" />
      </svg>
      <div className="xc-meta">
        <div><small>Certificate No.</small><b>{c.code}</b></div>
        <div><small>Issue Date</small><b>{longDate(c.issued_on)}</b></div>
      </div>
      <div className="xc-main">
        <img className="xc-logo" src="/img/logo-full-light.png" alt="Xeon Net — Full Stack Development & Digital Solution" />
        <p className="xc-title">{intern ? "INTERNSHIP" : c.doc_type.toUpperCase()}</p>
        <p className="xc-sub">{intern ? "COMPLETION CERTIFICATE" : "XEON NET"}</p>
        <p className="xc-lead">This certificate is proudly presented to</p>
        <p className="xc-name">{c.holder_name}</p>
        <div className="xc-orn"><i /><b /><i /></div>
        {intern ? (
          <>
            <p className="xc-body">In recognition of the successful completion of an internship with Xeon Net, with a focus on</p>
            <p className="xc-focus">{c.title}{c.title && c.duration && <em>•</em>}{c.duration}</p>
            <p className="xc-period">{(start || end) ? <><span>Internship Period</span>{start} – {end}</> : c.period}</p>
            <p className="xc-close">Throughout the program, the intern demonstrated commitment, professionalism and a strong willingness to learn.<br />We wish them continued success in their professional journey.</p>
          </>
        ) : (
          <>
            <p className="xc-body">Issued by Xeon Net{c.title ? " for" : "."}</p>
            <p className="xc-focus">{c.title}{c.title && c.duration && <em>•</em>}{c.duration}</p>
            <p className="xc-period">{(start || end) ? <><span>Period</span>{start} – {end}</> : c.period}</p>
            <p className="xc-close">We wish them continued success in their professional journey.</p>
          </>
        )}
      </div>
      <div className="xc-sign-row">
        <div className="xc-sign"><div className="xc-sig">{c.ceo_signature && <img src={c.ceo_signature} alt="" />}</div><hr /><b>Muhammad Adnan</b><small>CEO · Xeon Net</small></div>
        <img className="xc-seal" src="/img/cert-seal.svg" alt="Xeon Net seal" />
        <div className="xc-sign"><div className="xc-sig">{c.hr_signature && <img src={c.hr_signature} alt="" />}</div><hr /><b>HR Department</b><small>Xeon Net</small></div>
      </div>
      <div className="xc-qr"><div className="xc-qr-box">{c.code && !c.qr_off ? <img src={`/api/public/qr/${c.code}.svg`} alt={`QR code to verify ${c.code}`} /> : null}</div><small>Scan to verify</small></div>
      <div className="xc-foot"><span>www.xeonnet.site</span><i /><span>info@xeonnet.site</span><i /><span>0300 6666 190</span><i /><span>Business Hub Workspace, Faisalabad</span></div>
    </div>
  );
}
