require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`,
});
const express = require('express');
const movieRouter = require('./routes/movie.router');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('./utils/swagger');
const morgan = require('./utils/morgan');
const { logger } = require('./utils/logger');
const limiter = require('./utils/rateLimit');

const app = express();
const port = process.env.PORT || 3000;
app.use(helmet()); // add more security headers
app.use(cors()); // enable CORS
app.use(express.json());
app.use(limiter);

app.use(morgan);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsDoc));

app.use('/v1/movies', movieRouter);

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
