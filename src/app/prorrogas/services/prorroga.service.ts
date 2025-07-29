import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { direccionApi } from '../../shared/link';

export interface Prorroga {
  pro_id?: number;
  pro_cre_id: number;
  pro_fecha_solicitud: string;
  pro_motivo: string;
  pro_documento_url?: string;
  pro_estado?: 'Pendiente' | 'Aprobada' | 'Rechazada';
  pro_fecha_aprobacion?: string;
  pro_dias_concedidos?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProrrogaService {
  private apiUrl = direccionApi + '/api/prorrogas';

  constructor(private http: HttpClient) { }

  // Crear una nueva prórroga
  createProrroga(prorroga: Prorroga): Observable<Prorroga> {
    return this.http.post<Prorroga>(this.apiUrl, prorroga);
  }

  // Obtener todas las prórrogas
  getProrrogas(): Observable<Prorroga[]> {
    return this.http.get<Prorroga[]>(this.apiUrl);
  }

  // Obtener una prórroga por ID
  getProrrogaById(id: number): Observable<Prorroga> {
    return this.http.get<Prorroga>(`${this.apiUrl}/${id}`);
  }

  // Actualizar estado, fecha y días concedidos
  updateEstadoProrroga(id: number, data: Partial<Prorroga>): Observable<Prorroga> {
    return this.http.put<Prorroga>(`${this.apiUrl}/${id}`, data);
  }

  // Eliminar una prórroga
  deleteProrroga(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
