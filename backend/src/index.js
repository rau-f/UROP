import express, { json } from "express"
import 'dotenv/config'

const app = express();

app.use(express.json());
app.use('/api/opportunities', require('./routes/opportunities'));

app.listen(process.env.PORT, () => console.log("running"));