import { Controller, Get, Res } from '@nestjs/common';

@Controller('pages')
export class PagesController {
  @Get('signin-basic')
  signinBasic(@Res() res) {
    return res.render('auth-signin-basic', {
            title: 'Signin Basic',
            page_title: 'Signin Basic',
            folder: 'Authentication',
            data: {
              hello: 'world'
            }
        });
  }
}
