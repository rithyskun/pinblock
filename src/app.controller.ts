import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/encrypt')
  encryptCode(@Body() body) {
    return this.appService.encryptPinBlock(body);
  }

  @Post('/decrypt')
  decryptCode(@Body() body) {
    return this.appService.decryptPinBlock(body);
  }

  @Post('/decryptDes')
  decryptDes(@Body() body) {
    return this.appService.decryptDes(body);
  }

  @Post('/encryptDes')
  encryptDes(@Body() body) {
    return this.appService.encryptDes(body);
  }
}
