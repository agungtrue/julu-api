// common/utils/subdomain.util.ts

export function extractSubdomain(req: any): string | null {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const origin = req.headers?.['origin'] || req.headers?.['referer'];
  console.log({ origin });
  if (origin) {
    try {
      const url = new URL(origin);
      const host = url.hostname; // "julu-pos.julucoffee.com" atau "julu-pos.localhost"

      if (host.endsWith('julucoffee.com')) {
        return host.replace('.julucoffee.com', '');
      }
      if (host.endsWith('.localhost')) {
        return host.replace('.localhost', '');
      }
    } catch (e) {
      // ignore invalid URL
    }
  }

  // Fallback: Custom Header dari Axios/Next.js jika ada
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (req.headers?.['x-tenant-subdomain']) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return req.headers['x-tenant-subdomain'] as string;
  }

  // Fallback: Host Header asli (jika diproxy Nginx)
  const hostHeader = req.headers?.['x-forwarded-host'] || req.headers?.host;
  if (hostHeader) {
    const cleanHost = hostHeader.split(':')[0].toLowerCase();
    if (cleanHost.endsWith('.localhost')) {
      return cleanHost.replace('.localhost', '');
    }
  }

  return null;
}
