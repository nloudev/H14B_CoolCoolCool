import 'dotenv/config';
import express from 'express';
import orderRoutes from './routes/orders.js';
import healthRoutes from './routes/health.js';
import docsRoutes from './routes/docs.js';

const app = express();
const port = process.env.PORT || 3000;


app.use(express.json());
app.use('/orders', orderRoutes);
app.use('/health', healthRoutes);
app.use('/api-docs', docsRoutes);


app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Bad JSON' });
  }
  next();
});

// stop hanging
// if (require.main === module) {
//     app.listen(port, () => {
//         console.log(`Server running at http://localhost:${port}`);
//     });
// }

export default app;