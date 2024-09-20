import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDbConfig } from './typeorm-config';

@Module({
  imports: [
    TypeOrmModule.forRoot(testDbConfig),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
