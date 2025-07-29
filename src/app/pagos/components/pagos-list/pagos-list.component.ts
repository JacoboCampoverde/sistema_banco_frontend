import { Component, OnInit } from '@angular/core';
import { Pago, PagoService } from '../../services/pago.service';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { Credito, PrestamoService } from '../../../prestamos/services/prestamo.service';
import { CommonModule } from '@angular/common';
import { map, Observable, of } from 'rxjs';

@Component({
  selector: 'app-pagos-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos-list.component.html',
  styleUrl: './pagos-list.component.css'
})
export class PagosListComponent implements OnInit {
  pagos: Pago[] = [];
  filtrados: Pago[] = [];

  searchTerm: string = '';
  isAdmin: boolean = false;
  loading: boolean = true;
  pagosFiltrados$: Observable<Pago[]> = of([]);
  filtroFechaInicio?: Date;
  filtroFechaFin?: Date;
  filtroSocioId?: number;
  filtroEstado?: string;

  constructor(
    private pagoService: PagoService,
    private creditoService: PrestamoService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    this.isAdmin = this.authService.getRoles().some(rol => ['admin', 'presidente', 'secretario'].includes(rol));
    console.log('Usuario autenticado:', this.authService.getSocioAutenticado());
    console.log('Roles del usuario:', this.authService.getRoles());
    console.log('Es admin:', this.isAdmin);
    if (this.isAdmin) {
      // Admin: puede ver todos los pagos
      this.pagoService.obtenerTodosLosPagos().subscribe({
        next: (data) => {
          this.pagos = data;
          console.log('Pagos obtenidos para admin:', this.pagos);
          this.filtrados = data;
          this.loading = false;
          this.actualizarFiltro();
        },
        error: (err) => {
          console.error('Error cargando pagos:', err);
          this.loading = false;
        }
      });
    } else {
      // Socio: obtener su ID y filtrar sus créditos
      const soc_id = this.authService.getSocioId();
      if (!soc_id) return;

      this.creditoService.obtenerCreditosPorSocio(soc_id).subscribe({
        next: (creditos: Credito[]) => {
          const creditosIds = creditos
            .map(c => c.cre_id)
            .filter((id): id is number => typeof id === 'number');

          const pagosPorCredito: Pago[] = [];

          let completados = 0;
          creditosIds.forEach((id) => {
            this.pagoService.obtenerPagosPorCredito(id).subscribe(pagos => {
              pagosPorCredito.push(...pagos);
              completados++;
              if (completados === creditosIds.length) {
                this.pagos = pagosPorCredito;
                this.filtrados = pagosPorCredito;
                this.loading = false;
                this.actualizarFiltro();
              }
            });
          });
        },
        error: (err) => {
          console.error('Error obteniendo créditos del socio:', err);
          this.loading = false;
        }
      });

    }
  }

  // Métodos para manejar filtros:
  setFiltroFechaInicio(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filtroFechaInicio = input.value ? new Date(input.value) : undefined;
    this.actualizarFiltro();
  }

  setFiltroFechaFin(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filtroFechaFin = input.value ? new Date(input.value) : undefined;
    this.actualizarFiltro();
  }

  setFiltroSocioId(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    this.filtroSocioId = value ? +value : undefined;
    this.actualizarFiltro();
  }

  actualizarFiltro(): void {
    const pagosFiltrados = this.filtrarPagos(this.pagos);
    this.pagosFiltrados$ = of(pagosFiltrados);
    this.filtrados = pagosFiltrados;
  }

  filtrarPagos(pagos: Pago[]): Pago[] {
    return pagos.filter(pago => {
      const fechaPago = new Date(pago.pag_fecha);
      fechaPago.setHours(0, 0, 0, 0); // 🔍 Normaliza hora

      if (this.filtroFechaInicio) {
        const inicio = new Date(this.filtroFechaInicio);
        inicio.setHours(0, 0, 0, 0);
        if (fechaPago < inicio) return false;
      }

      if (this.filtroFechaFin) {
        const fin = new Date(this.filtroFechaFin);
        fin.setHours(0, 0, 0, 0);
        if (fechaPago > fin) return false;
      }

      if (this.isAdmin && this.filtroSocioId) {
        if (pago.pag_id !== this.filtroSocioId) return false;
      }

      return true;
    });
  }

}
