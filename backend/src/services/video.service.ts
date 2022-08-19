import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Video, Prisma } from '@prisma/client';
import { createReadStream, statSync } from 'fs';
import { join } from 'path-posix';
import { Request, Response } from 'express';

@Injectable()
export class VideoService {
  constructor(private prisma: PrismaService) {}

  async createVideo(data: Prisma.VideoCreateInput): Promise<Video> {
    return await this.prisma.video.create({ data });
  }

  async readVideo(id?: Prisma.VideoWhereUniqueInput): Promise<any> {
    if (id.id) {
      return this.prisma.video.findUniqueOrThrow({
        where: { id: id.id },
        include: {
          author: true,
        },
      });
    }
    return this.prisma.video.findFirst();
  }

  async streamVideo(
    id: Prisma.VideoWhereUniqueInput,
    response: Response,
    request: Request,
  ) {
    try {
      const data = await this.prisma.video.findUniqueOrThrow({
        where: id,
      });
      if (!data || data instanceof Prisma.NotFoundError) {
        throw new NotFoundException(null, 'VideoNotFound');
      }
      const { range } = request.headers;
      if (range) {
        const { video } = data;
        const videoPath = statSync(join(process.cwd(), `./public/${video}`));
        const CHUNK_SIZE = 1 * 1e6;
        const start = Number(range.replace(/\D/g, ''));
        const end = Math.min(start + CHUNK_SIZE, videoPath.size - 1);
        const videoLength = end - start + 1;
        response.status(206);
        response.header({
          'Content-Range': `bytes ${start}-${end}/${videoPath.size}`,
          'Accept-Ranges': 'bytes',
          'Content-length': videoLength,
          'Content-Type': 'video/mp4',
        });
        const videoStream = createReadStream(
          join(process.cwd(), `./public/${video}`),
          { start, end },
        );
        videoStream.pipe(response);
      } else {
        throw new NotFoundException(null, 'range not found');
      }
    } catch (e) {
      console.error(e);
      throw new ServiceUnavailableException();
    }
  }

  async update(
    id: Prisma.VideoWhereUniqueInput,
    video: Prisma.VideoUpdateInput,
  ): Promise<Video> {
    return await this.prisma.video.update({ where: id, data: video });
  }
  async delete(id: Prisma.VideoWhereUniqueInput): Promise<any> {
    return await this.prisma.video.delete({ where: id });
  }
}
