import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { direccionApi } from '../../shared/link';

export interface Socio {
  soc_id: number;
  soc_nombres: string;
  soc_cedula: string;
  soc_telefono?: string;
  soc_direccion?: string;
  soc_fecha_ingreso: string; // ISO date string
  soc_estado: 'Activo' | 'Suspendido' | 'Expulsado';
  soc_aporte_inicial: number;
  soc_acumulado_aportes: number;
  soc_acepto_reglamento: boolean;
  soc_tiempo_como_socio: number;
  soc_roles: string[]; // ej: ["socio", "presidente"]
}

interface UsuarioData {
  email: string;
  password: string;
}

export interface SocioCreateData {
  socioData: {
    nombres: string;
    cedula: string;
    telefono?: string;
    direccion?: string;
    roles?: string[];
    acepto_reglamento?: boolean;
  };
  usuarioData: {
    email: string;
    password: string;
  };
}


@Injectable({
  providedIn: 'root'
})
export class SocioService {
  private apiUrl1 = direccionApi + '/api/socios';
  private apiUrl2 = direccionApi + '/api/socio-usuario';

  constructor(private http: HttpClient) { }

  // Obtener todos los socios
  getSocios(): Observable<Socio[]> {
    return this.http.get<Socio[]>(this.apiUrl1);
  }

  // Obtener un socio por ID
  getSocioById(id: number): Observable<Socio> {
    return this.http.get<Socio>(`${this.apiUrl1}/${id}`);
  }

  // Crear un nuevo socio
  createSocio(socio: Omit<Socio, 'soc_id'>): Observable<Socio> {
    return this.http.post<Socio>(this.apiUrl1, socio);
  }

  // Actualizar un socio existente
  updateSocio(id: number, socio: Partial<Socio>): Observable<Socio> {
    return this.http.put<Socio>(`${this.apiUrl1}/${id}`, socio);
  }

  // Eliminar un socio
  deleteSocio(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl1}/${id}`);
  }

  createSocioConUsuario(data: SocioCreateData): Observable<{ message: string; socio: Socio; usuario: { usu_email: string } }> {
    return this.http.post<{ message: string; socio: Socio; usuario: { usu_email: string } }>(
      `${this.apiUrl2}/crear`,
      data
    );
  }

  // Obtener un socio por cédula
  getSocioByCedula(cedula: string): Observable<Socio> {
    return this.http.get<Socio>(`${this.apiUrl1}/cedula/${cedula}`);
  }

}
