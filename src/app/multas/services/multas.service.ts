import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { direccionApi } from '../../shared/link';

const BASE_URL = direccionApi + '/api/multas';

export interface Multa {
  mul_id?: number;
  mul_soc_id: number;
  mul_motivo: string;
  mul_monto?: number;
  mul_fecha: string;
  mul_estado?: 'Pendiente' | 'Activa' | 'Pagada' | 'Cancelada';
}

@Injectable({
  providedIn: 'root'
})
export class MultasService {

  constructor(private http: HttpClient) { }

  crearMulta(multa: Multa): Observable<Multa> {
    return this.http.post<Multa>(`${BASE_URL}`, multa);
  }

  obtenerMultasPorSocio(idSocio: number): Observable<Multa[]> {
    return this.http.get<Multa[]>(`${BASE_URL}/socio/${idSocio}`);
  }

  actualizarEstadoMulta(idMulta: number, nuevoEstado: 'Pendiente' | 'Activa' | 'Pagada' | 'Cancelada'): Observable<any> {
    return this.http.patch(`${BASE_URL}/${idMulta}/estado`, { estado: nuevoEstado });
  }
}