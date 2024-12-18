import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import adRoutes from './routes/adRoutes.js';
import competitorRoutes from './routes/competitorRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/ads', adRoutes);
app.use('/api/competitor', competitorRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
