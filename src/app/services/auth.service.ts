import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'   // macht ihn global verfügbar
})
export class AuthService {
  private loggedIn = false;

  login(username: string, password: string): boolean {
    // hier würdest du normalerweise einen Backend-Call machen
    if (username === 'admin' && password === 'admin') {
      this.loggedIn = true;
      return true;
    }
    return false;
  }

  logout(): void {
    this.loggedIn = false;
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }
}
