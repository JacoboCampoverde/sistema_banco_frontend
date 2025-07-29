import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { direccionApi } from '../../shared/link';

export interface Aporte {
  apo_id?: number;
  apo_soc_id: number;
  apo_monto: number;
  apo_fecha: string; // formato 'YYYY-MM-DD'
  apo_tipo?: string; // por defecto 'Mensual'
  socioNombre?: string; // nombre del socio, opcional
}

@Injectable({
  providedIn: 'root'
})
export class AporteService {
  private readonly baseUrl = direccionApi + '/api/aportes'; // Ajusta si cambia el backend

  constructor(private http: HttpClient) { }

  // Registrar un nuevo aporte
  crearAporte(aporte: Aporte): Observable<Aporte> {
    return this.http.post<Aporte>(`${this.baseUrl}`, aporte);
  }

  getAportes(): Observable<Aporte[]> {
    return this.http.get<Aporte[]>(`${this.baseUrl}`);
  }


  // Obtener aportes de un socio específico
  obtenerAportesPorSocio(idSocio: number): Observable<Aporte[]> {
    return this.http.get<Aporte[]>(`${this.baseUrl}/socio/${idSocio}`);
  }
}
