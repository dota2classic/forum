import { HttpException, HttpStatus } from '@nestjs/common';

export class UserMutedException extends HttpException {
  constructor(public readonly mutedUntil: Date) {
    super(
      {
        message: `User is muted until`,
        mutedUntil: mutedUntil.toISOString(),
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
