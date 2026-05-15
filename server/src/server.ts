import dotenv from 'dotenv';
import createApp from './app';
import { initializeDataSource } from './config/db';

dotenv.config();

const port = process.env.PORT || 3000;
const app = createApp();

const startServer = async () => {
  try {
    await initializeDataSource();
    console.log('Connected to PostgreSQL Database');
  } catch (error) {
    console.error(
      'Cảnh báo: Không thể kết nối đến cơ sở dữ liệu PostgreSQL.',
      error
    );
  }

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();
