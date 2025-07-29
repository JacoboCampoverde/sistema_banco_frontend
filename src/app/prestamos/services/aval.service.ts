import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { direccionApi } from '../../shared/link';

export interface Aval {
  ava_cre_id: number;
  ava_soc_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class AvalService {

  private readonly apiUrl = direccionApi + '/api/avales';

  constructor(private http: HttpClient) { }

  crearAval(aval: Aval): Observable<Aval> {
    return this.http.post<Aval>(this.apiUrl, aval);
  }
}