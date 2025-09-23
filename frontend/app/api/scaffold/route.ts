import { NextResponse } from 'next/server';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

type Payload = { route: string; title?: string };

function safeSegments(route: string): string[] {
  const clean = route.trim();
  const parts = clean.split('/').filter(Boolean);
  // allow only simple segment chars a-z0-9- to avoid unsafe paths
  return parts.map((seg) => seg.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/^-+|-+$/g, ''));
}

function pageTemplate(title: string) {
  return `export default function Page() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">${title}</h1>
      <p className="text-sm text-gray-500">Página inicial generada automáticamente. Configúrala desde Ajustes &gt; Módulos.</p>
    </div>
  );
}
`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    if (!body?.route || typeof body.route !== 'string') {
      return NextResponse.json({ error: 'route is required' }, { status: 400 });
    }
    const segments = safeSegments(body.route);
    if (segments.length === 0) {
      return NextResponse.json({ error: 'invalid route' }, { status: 400 });
    }
    const appDir = path.join(process.cwd(), 'app');
    let currentDir = appDir;
    for (const seg of segments) {
      currentDir = path.join(currentDir, seg);
      if (!fs.existsSync(currentDir)) {
        await fsp.mkdir(currentDir, { recursive: true });
      }
    }
    const pagePath = path.join(currentDir, 'page.tsx');
    if (!fs.existsSync(pagePath)) {
      const title = body.title || segments[segments.length - 1];
      await fsp.writeFile(pagePath, pageTemplate(title), 'utf8');
    }
    return NextResponse.json({ ok: true, route: '/' + segments.join('/') });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
