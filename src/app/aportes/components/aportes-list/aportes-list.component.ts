import { Component } from '@angular/core';
import { Aporte, AporteService } from '../../services/aporte.service';
import { UsuarioService } from '../../../admin/services/usuario.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Socio, SocioService } from '../../../socios/services/socio.service';

@Component({
  selector: 'app-aportes-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './aportes-list.component.html',
  styleUrl: './aportes-list.component.css'
})
export class AportesListComponent {
  aportes: Aporte[] = [];
  errorMsg = '';

  filtroFechaInicio?: Date;
  filtroFechaFin?: Date;
  filtroSocioId?: number;       // Para admin
  filtroTipo?: string;          // Para admin y socio

  aportesFiltrados$: Observable<any[]> = of([]);
  rol: string = '';
  socioId: number | null = null;
  socios: Socio[] = [];

  totalDepositos = 0;
  totalRetiros = 0;
  saldoAportes = 0;

  constructor(
    private aporteService: AporteService,
    private authService: AuthService,
    private socioService: SocioService
  ) { }

  ngOnInit(): void {
    this.rol = this.authService.getUserRole();
    this.socioId = this.authService.getSocioId();

    if (['admin', 'secretario', 'presidente'].includes(this.rol)) {
      this.socioService.getSocios().subscribe({
        next: socios => this.socios = socios,
        error: err => console.error('Error al cargar socios', err)
      });
    }

    this.cargarAportes();
  }


  cargarAportes(): void {
    if (['admin', 'secretario', 'presidente'].includes(this.rol)) {
      this.aporteService.getAportes().pipe(
        switchMap(aportes => {
          // Obtener nombres socios igual que antes (omito aquí para no repetir)
          // Supón que tienes método que devuelve aportes con socioNombre
          return this.agregarNombreSocios(aportes);
        })
      ).subscribe(aportesConNombres => {
        this.aportes = aportesConNombres;
        this.actualizarFiltro();
      });
    } else if (this.rol === 'socio' && this.socioId) {
      this.aporteService.obtenerAportesPorSocio(this.socioId).pipe(
        switchMap(aportes => {
          return this.socioService.getSocioById(this.socioId!).pipe(
            map(socio => aportes.map(aporte => ({
              ...aporte,
              socioNombre: socio.soc_nombres
            })))
          );
        })
      ).subscribe(aportesConNombre => {
        this.aportes = aportesConNombre;
        this.actualizarFiltro();
        this.calcularResumen();
      });
    } else {
      this.aportes = [];
    }
  }

  private calcularResumen(): void {
    const positivos = this.aportes.filter(a => Number(a.apo_monto) > 0);
    const negativos = this.aportes.filter(a => Number(a.apo_monto) < 0);

    this.totalDepositos = positivos.reduce((acc, a) => acc + Number(a.apo_monto), 0);
    this.totalRetiros = negativos.reduce((acc, a) => acc + Number(a.apo_monto), 0);
    this.saldoAportes = this.totalDepositos + this.totalRetiros;
  }

  verDetalle(id: number): void {
    // Aquí puedes navegar o mostrar detalles
    console.log('Ver detalle aporte:', id);
  }

  editarAporte(aporte: Aporte, event: Event): void {
    event.stopPropagation();
    // Lógica para editar aporte
    console.log('Editar aporte:', aporte);
  }

  eliminarAporte(id: number, event: Event): void {
    event.stopPropagation();
    console.log('Eliminar aporte:', id);
  }

  agregarNombreSocios(aportes: any[]): Observable<any[]> {
    if (aportes.length === 0) return of([]);

    const socios$ = aportes.map(aporte =>
      this.socioService.getSocioById(aporte.apo_soc_id).pipe(
        catchError(() => of({ soc_nombres: 'Desconocido' }))
      )
    );

    return forkJoin(socios$).pipe(
      map(socios => aportes.map((aporte, i) => ({
        ...aporte,
        socioNombre: socios[i].soc_nombres
      })))
    );
  }

  // Actualiza la lista filtrada según filtros aplicados
  actualizarFiltro() {
    this.aportesFiltrados$ = of(this.aportes).pipe(
      map(aportes => this.filtrarAportes(aportes))
    );
  }

  // Método que filtra según filtros
  filtrarAportes(aportes: any[]): any[] {
    return aportes.filter(aporte => {
      // Filtrar por fecha (si aplica)
      if (this.filtroFechaInicio && new Date(aporte.apo_fecha) < this.filtroFechaInicio) {
        return false;
      }
      if (this.filtroFechaFin && new Date(aporte.apo_fecha) > this.filtroFechaFin) {
        return false;
      }

      // Filtrar por socio solo para admin/soporte
      if ((this.rol === 'admin' || this.rol === 'soporte') && this.filtroSocioId) {
        if (aporte.apo_soc_id !== this.filtroSocioId) return false;
      }

      // Filtrar por tipo para todos
      if (this.filtroTipo && aporte.apo_tipo.toLowerCase() !== this.filtroTipo.toLowerCase()) {
        return false;
      }

      return true;
    });
  }

  // Métodos para cambiar filtros, que luego llamarán a actualizarFiltro()
  setFiltroFechaInicio(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const valor = input?.value || '';
    this.filtroFechaInicio = valor ? new Date(valor) : undefined;
    this.actualizarFiltro();
  }


  setFiltroFechaFin(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const valor = input?.value || '';
    this.filtroFechaFin = valor ? new Date(valor) : undefined;
    this.actualizarFiltro();
  }


  setFiltroSocioId(event: Event) {
    const select = event.target as HTMLSelectElement | null;
    const value = select?.value || '';
    this.filtroSocioId = value ? +value : undefined;
    this.actualizarFiltro();
  }

  setFiltroTipo(event: Event) {
    const value = (event.target as HTMLSelectElement)?.value || '';
    this.filtroTipo = value || undefined;
    this.actualizarFiltro();
  }

  limpiarFiltros(): void {
    this.filtroFechaInicio = undefined;
    this.filtroFechaFin = undefined;
    this.filtroTipo = undefined;
    this.filtroSocioId = undefined;
    this.actualizarFiltro();
  }

}
