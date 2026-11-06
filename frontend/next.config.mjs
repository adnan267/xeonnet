/** Xeon Net website. API_URL = address of the Django backend (e.g. https://api.xeonnet.site). */
const API_URL = (process.env.API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const nextConfig = {
  poweredByHeader: false,
  async rewrites() {
    // Browser talks to /api on the same domain; Next.js forwards it to Django.
    // Same domain = login cookies just work.
    return [
      { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
      { source: "/django-admin/:path*", destination: `${API_URL}/django-admin/:path*` },
      { source: "/django-static/:path*", destination: `${API_URL}/django-static/:path*` },
    ];
  },
  async redirects() {
    return [
      { source: "/admin", destination: "/staff", permanent: false },
      { source: "/contact_page", destination: "/contact", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ] }];
  },
};
export default nextConfig;
