// What /api/login and /api/register return: just the JSON Web Token
export class AuthResponse {
  token: string;

  constructor() {
    this.token = '';
  }
}
