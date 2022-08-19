import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { secret } from './utils/costants';
import { join } from 'path-posix';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { PrismaService } from './services/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { VideoController } from './controllers/video.controller';
import { VideoService } from './services/video.service';
import { isAuthenticated } from './app.middleware';

@Module({
  imports: [
    JwtModule.register({
      secret,
      signOptions: { expiresIn: '2h' },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: './public',
        filename: (req, file, cb) => {
          const ext = file.mimetype.split('/')[1];
          cb(null, `${uuidv4()}-${Date.now()}.${ext}`);
        },
      }),
    }),
  ],
  controllers: [AppController, UserController, VideoController],
  providers: [AppService, UserService, PrismaService, VideoService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(isAuthenticated)
      .exclude({ path: 'api/v1/video/:id', method: RequestMethod.GET })
      .forRoutes(VideoController);
  }
}
