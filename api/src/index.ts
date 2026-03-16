import express from 'express';
import drugsRoutes from './routes/drugs/index'

const port = 3000

const app = express();

app.use('/drugs', drugsRoutes)
app.listen(port, () => {
    console.log('ok it works om port ${port}')
})



























