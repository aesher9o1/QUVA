import { MongooseModule } from '@nestjs/mongoose';

export const MongooseHandlerModule = MongooseModule.forRoot(
  'mongodb://localhost/qcine',
  {
    useNewUrlParser: true,
    keepAlive: true,
    autoIndex: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  },
);
