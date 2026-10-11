import express from "express";
import 'dotenv/config';
import oppRoutes from './routes/opportunities.js';

const PORT = process.env.PORT;
const app = express();
app.use(express.json());

app.use('/api/opportunities', oppRoutes);

app.listen(PORT, () => console.log(`server running on port ${PORT}`));