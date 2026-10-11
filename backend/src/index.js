import express from "express";
import 'dotenv/config';
import oppRoutes from './routes/opportunities.js';

const PORT = process.env.PORT;
const app = express();
app.use(express.json());

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../../frontend')));

app.use('/api/opportunities', oppRoutes);

app.listen(PORT, () => console.log(`server running on port ${PORT}`));