import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { summarizeRouter } from './routes/summarize';

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('WARNING: ANTHROPIC_API_KEY is not set. API calls will fail.');
}

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use('/api', summarizeRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
