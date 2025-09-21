import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'SST API (minimal) running' });
});

app.get('/api/metrics', (_req: Request, res: Response) => {
  res.json({ accidents: 0, inspections: 0, polizas: 0, vehicles: 0, accidentFrequency: 0 });
});

app.get('/api/polizas', (_req: Request, res: Response) => {
  res.json([]);
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`SST backend (minimal) listening on port ${port}`);
});

export default app;