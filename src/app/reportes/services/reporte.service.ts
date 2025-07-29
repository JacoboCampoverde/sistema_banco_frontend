import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { direccionApi } from '../../shared/link';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly apiUrl = direccionApi + '/api/reportes';

  constructor(private http: HttpClient) { }

  // 🔹 Aportes por socio
  obtenerAportesPorSocio(idSocio: number): Observable<{ total: number; aportes: any[] }> {
    return this.http.get<{ total: number; aportes: any[] }>(`${this.apiUrl}/aportes/${idSocio}`);
  }

  // 🔹 Créditos y saldos pendientes por socio
  obtenerCreditosPorSocio(idSocio: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/creditos/${idSocio}`);
  }

  // 🔹 Socios en mora
  obtenerSociosEnMora(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/moras`);
  }

  // 🔹 Multas por socio
  obtenerMultasPorSocio(idSocio: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/multas/${idSocio}`);
  }

  // 🔹 Cartera general agrupada por estado
  obtenerResumenCartera(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cartera`);
  }

  // 🔹 Multas globales (administrador / analista)
  obtenerTodasLasMultas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/multas/global`);
  }

  // 🔹 Créditos donde el socio es aval (filtrado por socio)
  obtenerAvalesPorSocio(idSocio: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/avales/${idSocio}`);
  }

  // 🔹 Créditos donde cualquier socio figura como aval (reporte global)
  obtenerAvalesGlobal(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/avales/global`);
  }
}