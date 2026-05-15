import express, { Express } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error.handler';
import { requestLogger } from './middleware/request.logger';
import routes from './routes/index.route';

const createApp = (): Express => {
  const app = express();

  app.use(cors());
  app.options('*', cors());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(requestLogger);

  app.use('/api', routes);

  app.use(errorHandler);

  return app;
};

export default createApp;
