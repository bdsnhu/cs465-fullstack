// The user as the SPA sees them (the password hash and salt never leave the API)
export class User {
  email: string;
  name: string;

  constructor() {
    this.email = '';
    this.name = '';
  }
}
