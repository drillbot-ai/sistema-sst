import { PrismaClient } from '@prisma/client';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();

export async function renderPdf(submissionId: string): Promise<Buffer> {
  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { formVersion: { include: { form: true } } }
  });
  if (!sub) throw new Error('Submission not found');

  // Seleccionar plantilla por código del formulario
  const code = sub.formVersion.form.code;
  const tplFile = path.join(__dirname, '..', 'templates', `${code.toLowerCase()}.hbs`);
  if (!fs.existsSync(tplFile)) throw new Error(`No template for code ${code}`);
  const tpl = fs.readFileSync(tplFile, 'utf8');
  const html = Handlebars.compile(tpl)({
    code,
    version: sub.formVersion.version,
    data: sub.data,
    dateNow: dayjs().format('YYYY-MM-DD HH:mm')
  });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '12mm', right: '12mm', bottom: '16mm', left: '12mm' } });
  await browser.close();
  return pdf;
}

export async function renderXlsx(submissionId: string): Promise<Buffer> {
  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { formVersion: { include: { form: true } } }
  });
  if (!sub) throw new Error('Submission not found');
  const code = sub.formVersion.form.code;

  const wb = XLSX.utils.book_new();

  // Hoja 1: encabezado plano
  const hdrRows = Object.entries((sub.data as any).hdr ?? {}).map(([k,v]) => ({ campo: k, valor: v as any }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hdrRows), 'Encabezado');

  // Por código, mapeos específicos
  if (code === 'GO-FO-09') {
    const trips = (sub.data as any).trips || [];
    const sheet = XLSX.utils.json_to_sheet(trips);
    XLSX.utils.book_append_sheet(wb, sheet, 'Recorridos');
  } else if (code === 'GO-FO-08' || code === 'GO-FO-07') {
    const ck = (sub.data as any).checklist || {};
    const rows = Object.keys(ck).map(id => ({ item: id, estado: ck[id]?.status ?? '', observacion: ck[id]?.note ?? '' }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Checklist');
  } else if (code === 'GO-FO-10') {
    const schedule = (sub.data as any).schedule || [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(schedule), 'Programación');
  } else if (code === 'GO-FO-12') {
    const info = (sub.data as any).info || {};
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([info]), 'Comparendo');
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return buf;
}
