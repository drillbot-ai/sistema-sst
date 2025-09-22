import { PrismaClient } from '@prisma/client';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';

// Export helper functions for generating PDF and Excel representations of a submission.

const prisma = new PrismaClient();

/**
 * Render a submission into a PDF buffer using Handlebars and Puppeteer.
 * Looks up the submission and its associated form code, loads the corresponding
 * Handlebars template from templates/, and injects the submission data.
 */
export async function renderPdf(submissionId: string): Promise<Buffer> {
  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { formVersion: { include: { form: true } } },
  });
  if (!sub) throw new Error('Submission not found');
  const code = sub.formVersion.form.code;
  const templatePath = path.join(__dirname, '..', 'templates', `${code.toLowerCase()}.hbs`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found for code ${code}`);
  }
  const templateString = fs.readFileSync(templatePath, 'utf8');
  const template = Handlebars.compile(templateString);
  const html = template({ code, version: sub.formVersion.version, data: sub.data, dateNow: dayjs().format('YYYY-MM-DD HH:mm') });
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '12mm', right: '12mm', bottom: '16mm', left: '12mm' } });
  await browser.close();
  return pdf;
}

/**
 * Render a submission into an Excel workbook buffer using xlsx. Creates a workbook
 * with a header sheet and additional sheets based on the form code.
 */
export async function renderXlsx(submissionId: string): Promise<Buffer> {
  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { formVersion: { include: { form: true } } },
  });
  if (!sub) throw new Error('Submission not found');
  const code = sub.formVersion.form.code;
  const data: any = sub.data;
  const wb = XLSX.utils.book_new();
  // Add generic header sheet
  const headerData = Object.entries(data).filter(([key]) => typeof data[key] !== 'object').map(([k, v]) => ({ campo: k, valor: v as any }));
  if (headerData.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(headerData), 'Resumen');
  }
  // Switch on code for specific sheets
  if (code === 'GO-FO-09') {
    const trips = data.trips || [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trips), 'Recorridos');
  } else if (code === 'GO-FO-08' || code === 'GO-FO-07') {
    const ck = data.checklist || {};
    const rows = Object.keys(ck).map(id => ({ item: id, estado: ck[id]?.status ?? '', observacion: ck[id]?.note ?? '' }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Checklist');
  } else if (code === 'GO-FO-10') {
    const schedule = data.schedule || [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(schedule), 'Programación');
  } else if (code === 'GO-FO-12') {
    const info = data.info || {};
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([info]), 'Comparendo');
  } else if (code === 'GO-FO-15') {
    // For GO-FO-15, export each checklist separately
    const sections = ['luces','cabina','mecanico'];
    sections.forEach(sec => {
      const ckSec = data[sec] || {};
      const rows = Object.keys(ckSec).map(id => ({ item: id, estado: ckSec[id]?.status ?? '', observacion: ckSec[id]?.note ?? '' }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sec);
    });
    const docs = data.docs ? [data.docs] : [];
    if (docs.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(docs), 'Documentos');
  }
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return buffer;
}