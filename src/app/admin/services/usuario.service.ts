import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { direccionApi } from '../../shared/link';

export interface Usuario {
  usu_id: number;
  usu_soc_id: number;
  usu_email: string;
  Socio: {
    soc_id: number;
    soc_nombres: string;
    soc_apellidos: string;
    soc_cedula: string;
    soc_telefono: string;
    soc_direccion: string;
    soc_fecha_ingreso: string; // tipo ISO string, como '2023-07-26'
    soc_estado: string;
    soc_aporte_inicial: number;
    soc_acumulado_aportes: number;
    soc_acepto_reglamento: boolean;
    soc_tiempo_como_socio: number;
    soc_roles: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = direccionApi + '/api/auth/usuarios'; // Ajusta si usas otro prefijo

  constructor(private http: HttpClient) { }

  getUsuarios(): Observable<{ usuarios: Usuario[] }> {
    return this.http.get<{ usuarios: Usuario[] }>(this.apiUrl);
  }
}