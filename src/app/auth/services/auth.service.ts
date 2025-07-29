import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StorageService } from '../../shared/services/storage.service';
import { Socio } from '../../socios/services/socio.service';
import { direccionApi } from '../../shared/link';

interface LoginResponse {
  message: string;
  token: string;
}

export interface TokenPayload {
  usu_id: number;
  soc_id: number;
  roles: string[];
  iat: number;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = direccionApi + '/api/auth';

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService  // Usar StorageService para almacenar tokens
  ) { }

  async login(credentials: { usu_email: string; usu_password: string }) {
    const response = await firstValueFrom(
      this.http.post<LoginResponse & { role: string }>(`${this.apiUrl}/login`, credentials)
    );
    console.log('Login response:', response);
    localStorage.setItem('token', response.token);
    localStorage.setItem('role', response.role); // <- asegurarse que backend envía el rol
    this.router.navigate(['/dashboard']).then(() => {
      window.location.reload();
    });
  }

  logout() {
    this.storage.remove('token');
    this.router.navigate(['/login'], { replaceUrl: true });
    window.location.reload();
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  getUserRole(): string {
    const token = this.getToken();
    if (!token) return '';

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // payload.roles viene como array, por ejemplo ["admin"]
      if (Array.isArray(payload.roles) && payload.roles.length > 0) {
        return payload.roles[0]; // o como necesites manejar múltiples roles
      }
      return '';
    } catch {
      return '';
    }
  }

  getRoles(): string[] {
    const payload = this.getTokenPayload();
    return payload?.roles || [];
  }

  isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    return !!this.getToken();
  }

  getTokenPayload(): TokenPayload | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const base64Payload = token.split('.')[1];
      const jsonPayload = atob(base64Payload);
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding token manually', e);
      return null;
    }
  }

  getSocioId(): number | null {
    const payload = this.getTokenPayload();
    return payload ? payload.soc_id : null;
  }

  getSocioAutenticado() {
    const soc_id = this.getSocioId();
    if (!soc_id) throw new Error('No hay socio autenticado');

    return this.http.get<Socio>(`${direccionApi}/api/socios/${soc_id}`);
  }
}