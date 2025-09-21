import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { renderPdf, renderXlsx } from './exporter';

// Router for dynamic form operations. This router exposes endpoints to
// list available forms, fetch a single form and its active schema,
// submit data for a form, and export submissions as PDF or Excel.

const prisma = new PrismaClient();
const router = Router();

// GET /api/forms - return all forms with their code and name
router.get('/forms', async (_req: Request, res: Response) => {
  const forms = await prisma.form.findMany({ select: { code: true, name: true } });
  res.json(forms);
});

// GET /api/forms/:code - return the active version of a form and its schema
router.get('/forms/:code', async (req: Request, res: Response) => {
  const { code } = req.params;
  const fv = await prisma.formVersion.findFirst({ where: { form: { code }, active: true }, include: { form: true } });
  if (!fv) return res.status(404).json({ error: 'Form not found' });
  res.json({ code: fv.form.code, name: fv.form.name, version: fv.version, schema: fv.schema });
});

// GET /api/forms/:code/submissions - list submissions for a given form code
router.get('/forms/:code/submissions', async (req: Request, res: Response) => {
  const { code } = req.params;
  const page = req.query.page ? parseInt(String(req.query.page)) : 1;
  const take = 20;
  const fv = await prisma.formVersion.findFirst({ where: { form: { code }, active: true } });
  if (!fv) return res.status(404).json({ error: 'Form not found' });
  const submissions = await prisma.submission.findMany({
    where: { formVersionId: fv.id },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * take,
    take,
  });
  res.json(submissions);
});

// POST /api/forms/:code/submissions - create a new submission (draft)
router.post('/forms/:code/submissions', async (req: Request, res: Response) => {
  const { code } = req.params;
  const fv = await prisma.formVersion.findFirst({ where: { form: { code }, active: true } });
  if (!fv) return res.status(404).json({ error: 'Form not found' });
  const submission = await prisma.submission.create({ data: { formVersionId: fv.id, data: req.body?.data ?? {} } });
  res.status(201).json(submission);
});

// PUT /api/submissions/:id - update submission data (draft editing)
router.put('/submissions/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const sub = await prisma.submission.update({ where: { id }, data: { data: req.body?.data ?? {} } });
    res.json(sub);
  } catch (err) {
    res.status(400).json({ error: 'Error updating submission', details: err });
  }
});

// POST /api/submissions/:id/submit - mark a submission as submitted
router.post('/submissions/:id/submit', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const sub = await prisma.submission.update({ where: { id }, data: { status: 'SUBMITTED', submittedAt: new Date() } });
    res.json(sub);
  } catch (err) {
    res.status(400).json({ error: 'Error submitting form', details: err });
  }
});

// GET /api/submissions/:id/pdf - export a submission as PDF
router.get('/submissions/:id/pdf', async (req: Request, res: Response) => {
  try {
    const pdf = await renderPdf(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${req.params.id}.pdf"`);
    res.send(pdf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/submissions/:id/xlsx - export a submission as Excel
router.get('/submissions/:id/xlsx', async (req: Request, res: Response) => {
  try {
    const xlsx = await renderXlsx(req.params.id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}.xlsx"`);
    res.send(xlsx);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;