import { Component } from '@angular/core';
import { Credito, PrestamoService } from '../../services/prestamo.service';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Socio, SocioService } from '../../../socios/services/socio.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-prestamos-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './prestamos-list.component.html',
  styleUrl: './prestamos-list.component.css'
})
export class PrestamosListComponent {
  prestamos: Credito[] = [];
  prestamosFiltrados$: Observable<Credito[]> = of([]);
  socios: Socio[] = [];
  rol: string = '';
  socioId: number | null = null;

  filtroFechaInicio?: Date;
  filtroFechaFin?: Date;
  filtroSocioId?: number;
  filtroEstado?: string;

  errorMsg: string = '';

  mostrarModal = false;
  idPrestamoSeleccionado: number | null = null;
  montoAprobado: number = 0;
  fechaAprobacion: string = '';

  constructor(
    private prestamoService: PrestamoService,
    private authService: AuthService,
    private socioService: SocioService,
    private router: Router

  ) { }

  ngOnInit(): void {
    this.rol = this.authService.getUserRole();
    this.socioId = this.authService.getSocioId();

    if (['admin', 'soporte', 'presidente', 'secretario'].includes(this.rol)) {
      this.cargarSocios();
      this.cargarPrestamosAdmin();
    } else if ((this.rol === 'socio' || this.rol === 'auxiliar') && this.socioId) {
      this.cargarPrestamosSocio(this.socioId);
    } else {
      this.errorMsg = 'No tiene permisos para ver préstamos.';
    }
  }

  cargarSocios(): void {
    this.socioService.getSocios().subscribe({
      next: socios => this.socios = socios,
      error: () => this.socios = []
    });
  }

  cargarPrestamosAdmin(): void {
    this.prestamoService.obtenerCreditos().pipe( // suponer backend devuelve todos si idSocio=0, o crear endpoint general
      switchMap(prestamos => this.agregarNombreSocios(prestamos))
    ).subscribe({
      next: prestamos => {
        this.prestamos = prestamos;
        this.actualizarFiltro();
      },
      error: () => this.errorMsg = 'Error al cargar préstamos.'
    });
  }

  cargarPrestamosSocio(idSocio: number): void {
    this.prestamoService.obtenerCreditosPorSocio(idSocio).pipe(
      switchMap(prestamos =>
        this.socioService.getSocioById(idSocio).pipe(
          map(socio =>
            prestamos.map(prestamo => ({ ...prestamo, socioNombre: socio.soc_nombres }))
          )
        )
      )
    ).subscribe({
      next: prestamos => {
        this.prestamos = prestamos;
        this.actualizarFiltro();
      },
      error: () => this.errorMsg = 'Error al cargar préstamos.'
    });
  }

  agregarNombreSocios(prestamos: Credito[]): Observable<Credito[]> {
    if (prestamos.length === 0) return of([]);

    const socios$ = prestamos.map(prestamo =>
      this.socioService.getSocioById(prestamo.cre_soc_id).pipe(
        map(socio => socio),
        // Si error, nombre 'Desconocido'
        catchError(() => of({ soc_nombres: 'Desconocido' } as Socio))
      )
    );

    return forkJoin(socios$).pipe(
      map(socios => prestamos.map((prestamo, i) => ({
        ...prestamo,
        socioNombre: socios[i].soc_nombres
      })))
    );
  }

  actualizarFiltro(): void {
    this.prestamosFiltrados$ = of(this.prestamos).pipe(
      map(prestamos => this.filtrarPrestamos(prestamos))
    );
  }

  filtrarPrestamos(prestamos: Credito[]): Credito[] {
    return prestamos.filter(prestamo => {
      if (this.filtroFechaInicio && new Date(prestamo.cre_fecha_solicitud) < this.filtroFechaInicio) {
        return false;
      }
      if (this.filtroFechaFin && new Date(prestamo.cre_fecha_solicitud) > this.filtroFechaFin) {
        return false;
      }
      if ((this.rol === 'admin' || this.rol === 'soporte') && this.filtroSocioId) {
        if (prestamo.cre_soc_id !== this.filtroSocioId) return false;
      }
      if (this.filtroEstado && prestamo.cre_estado !== this.filtroEstado) {
        return false;
      }
      return true;
    });
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

  setFiltroEstado(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    this.filtroEstado = value ? value : undefined;
    this.actualizarFiltro();
  }

  verDetalle(id: number): void {
    // Navega a la ruta /prestamos/:id donde mostrarás el detalle
    this.router.navigate(['/prestamos', id]);
  }
  editarPrestamo(prestamo: Credito, event: Event): void {
    event.stopPropagation();
    console.log('Editar préstamo', prestamo);
  }

  eliminarPrestamo(id: number, event: Event): void {
    event.stopPropagation();
    console.log('Eliminar préstamo', id);
  }

  rechazarPrestamo(id: number): void {
    if (!(this.rol === 'admin' || this.rol === 'secretario')) {
      Swal.fire('Acceso denegado', 'No tiene permisos para rechazar préstamos.', 'error');
      return;
    }

    Swal.fire({
      title: '¿Está seguro de rechazar este préstamo?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const datosActualizados = { cre_estado: 'Rechazado' as 'Rechazado' };
        this.prestamoService.actualizarCredito(id, datosActualizados).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Préstamo rechazado correctamente.',
              timer: 2000,
              showConfirmButton: false
            });
            this.recargarPrestamos();
          },
          error: err => {
            Swal.fire({
              icon: 'error',
              title: 'Error al rechazar el préstamo.',
              text: err?.message || 'Intenta nuevamente.',
              confirmButtonText: 'Aceptar'
            });
            console.error(err);
          }
        });
      }
    });
  }


  private recargarPrestamos(): void {
    if (this.rol === 'admin' || this.rol === 'soporte') {
      this.cargarPrestamosAdmin();
    } else {
      if (this.socioId !== null) {
        this.cargarPrestamosSocio(this.socioId);
      }
    }
  }

  abrirModal(id: number): void {
    if (!(this.rol === 'admin' || this.rol === 'secretario')) {
      Swal.fire('Acceso denegado', 'No tiene permisos para aprobar préstamos.', 'error');
      return;
    }
    this.idPrestamoSeleccionado = id;
    this.montoAprobado = 0;
    this.fechaAprobacion = new Date().toISOString().split('T')[0];
    this.mostrarModal = true;
  }

  cerrarModal(event?: Event): void {
    this.mostrarModal = false;
    this.idPrestamoSeleccionado = null;
  }

  cancelarModal(): void {
    this.mostrarModal = false;
  }

  confirmarAprobacion(): void {
    if (!this.idPrestamoSeleccionado) return;

    if (!this.montoAprobado || this.montoAprobado <= 0) {
      alert('Debe ingresar un monto aprobado válido.');
      return;
    }
    if (!this.fechaAprobacion) {
      alert('Debe ingresar la fecha de aprobación.');
      return;
    }

    const datosActualizados = {
      cre_estado: 'Activo',
      cre_monto_aprobado: this.montoAprobado,
      cre_fecha_aprobacion: this.fechaAprobacion
    } as Partial<Credito>;

    this.prestamoService.actualizarCredito(this.idPrestamoSeleccionado, datosActualizados).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Préstamo aprobado con éxito.',
          timer: 2000,
          showConfirmButton: false
        });
        this.mostrarModal = false;
        this.recargarPrestamos();
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error al aprobar el préstamo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }


}
