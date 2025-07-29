import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { direccionApi } from '../../shared/link';

export interface Credito {
  cre_id?: number;
  cre_soc_id: number;
  cre_monto_solicitado: number;
  cre_monto_aprobado?: number;
  cre_plazo_meses?: number;
  cre_tasa_interes?: number;
  cre_forma_pago?: string;
  cre_estado?: 'Pendiente' | 'Activo' | 'Cancelado' | 'Mora' | 'Rechazado';
  cre_fecha_solicitud: string; // formato YYYY-MM-DD
  cre_fecha_aprobacion?: string;
  cre_motivo?: string;
  cre_tipo_garantia?: string;
  cre_des_prestamo?: string; // Descripción del préstamo
  cre_meses_gracia?: number; // Meses de gracia para el pago
  socioNombre?: string; // opcional, para mostrar en UI
}

@Injectable({
  providedIn: 'root'
})
export class PrestamoService {

  private baseUrl = direccionApi + '/api/creditos'; // ajustar si usas proxy o variable de entorno

  constructor(private http: HttpClient) { }

  // Crear un crédito
  crearCredito(credito: Credito): Observable<Credito> {
    return this.http.post<Credito>(this.baseUrl, credito);
  }

  // Obtener todos los créditos
  obtenerCreditos(): Observable<Credito[]> {
    return this.http.get<Credito[]>(this.baseUrl);
  }

  // Obtener créditos por socio
  obtenerCreditosPorSocio(idSocio: number): Observable<Credito[]> {
    return this.http.get<Credito[]>(`${this.baseUrl}/socio/${idSocio}`);
  }

  // Actualizar solo estado del crédito
  actualizarEstado(idCredito: number, nuevoEstado: 'Pendiente' | 'Activo' | 'Cancelado' | 'Mora'): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${idCredito}`, { cre_estado: nuevoEstado });
  }

  // Actualizar crédito con datos arbitrarios (estado, monto aprobado, fecha aprobación, etc)
  actualizarCredito(idCredito: number, datos: Partial<Credito>): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${idCredito}`, datos);
  }

  // En tu servicio PrestamoService:
  obtenerCreditoPorId(idCredito: number): Observable<Credito> {
    return this.http.get<Credito>(`${this.baseUrl}/${idCredito}`);
  }

  // Obtener créditos aprobados
  obtenerCreditosAprobados(): Observable<Credito[]> {
    return this.http.get<Credito[]>(`${this.baseUrl}/aprobados`);
  }

  // Obtener créditos por cédula
  obtenerCreditosPorCedula(cedula: string): Observable<Credito[]> {
    return this.http.get<Credito[]>(`${this.baseUrl}/cedula/${cedula}`);
  }


}
