import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { direccionApi } from '../../shared/link';

export interface Pago {
  pag_id?: number;
  pag_cre_id: number;
  pag_monto: number;
  pag_fecha: string; // Formato YYYY-MM-DD
  pag_interes?: number;
  pag_abono_capital?: number;
  Credito?: {
    cre_id: number;
    cre_soc_id: number;
    Socio?: {
      soc_id: number;
      soc_nombres: string;
      soc_cedula: string;
    }
  };
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {

  private apiUrl = direccionApi + '/api/pagos'; // Ajusta según tu ruta base

  constructor(private http: HttpClient) { }

  /**
   * Crea un nuevo pago
   */
  crearPago(pago: Pago): Observable<Pago> {
    return this.http.post<Pago>(`${this.apiUrl}`, pago);
  }

  /**
   * Obtiene los pagos realizados para un crédito específico
   */
  obtenerPagosPorCredito(idCredito: number): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/credito/${idCredito}`);
  }

  /**
   * Obtiene todos los pagos dependiendo del rol (admin: todos, socio: solo sus pagos)
   */
  obtenerTodosLosPagos(): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}`);
  }
}
