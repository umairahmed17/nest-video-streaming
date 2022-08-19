import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Controller('/api/v1/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}
  @Post('/signup')
  async Signup(@Res() response, @Body() user: User) {
    const newUser = await this.userService.createUser(user);
    return response.status(HttpStatus.CREATED).json({
      newUser,
    });
  }
  @Post('/signin')
  async SignIn(@Res() response, @Body() user: User) {
    if (
      !Object.keys(user).includes('email') &&
      !Object.keys(user).includes('password') &&
      Object.keys(user).length !== 2
    )
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'Please provide email and password' });
    const token = await this.userService.signIn(user, this.jwtService);
    return response.status(HttpStatus.OK).json(token);
  }
}
