import { Component } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { AporteService } from '../../../aportes/services/aporte.service';
import { PrestamoService } from '../../../prestamos/services/prestamo.service';
import { PagoService } from '../../../pagos/services/pago.service';
import { UsuarioService } from '../../../admin/services/usuario.service';
import { SocioService } from '../../../socios/services/socio.service';
import { forkJoin } from 'rxjs';
import { AportesListComponent } from "../../../aportes/components/aportes-list/aportes-list.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  nombre: string = '';
  saludo: string = '';
  horaActual: string = '';
  socioId: number | null = null;

  aportes: any[] = [];
  prestamos: any[] = [];
  pagos: any[] = [];

  constructor(
    private authService: AuthService,
    private aporteService: AporteService,
    private prestamoService: PrestamoService,
    private pagoService: PagoService
  ) { }

  ngOnInit(): void {
    this.socioId = this.authService.getSocioId();
    this.setSaludo();

    if (!this.socioId) return;

    // Obtener el nombre del socio
    this.authService.getSocioAutenticado().subscribe(socio => {
      this.nombre = `${socio.soc_nombres}`;
    });

    // Primero obtenemos préstamos del socio
    this.prestamoService.obtenerCreditosPorSocio(this.socioId).subscribe(prestamos => {
      this.prestamos = prestamos;

      const creditosIds = prestamos
        .map(p => p.cre_id)
        .filter((id): id is number => typeof id === 'number');

      const pagosPorCredito$ = creditosIds.map(id =>
        this.pagoService.obtenerPagosPorCredito(id)
      );

      forkJoin(pagosPorCredito$).subscribe(pagosArray => {
        this.pagos = pagosArray.flat();

        // Finalmente aportes
        this.aporteService.obtenerAportesPorSocio(this.socioId!).subscribe(aportes => {
          this.aportes = aportes;

          // Impresiones finales
          console.log('Aportes:', this.aportes);
          console.log('Préstamos:', this.prestamos);
          console.log('Pagos:', this.pagos);
        });
      });
    });
  }

  setSaludo(): void {
    const hora = new Date().getHours();
    this.horaActual = new Date().toLocaleTimeString();

    if (hora >= 5 && hora < 12) {
      this.saludo = 'Buenos días';
    } else if (hora >= 12 && hora < 18) {
      this.saludo = 'Buenas tardes';
    } else {
      this.saludo = 'Buenas noches';
    }
  }

  getTotalAportes(): number {
    return this.aportes.reduce((sum, a) => {
      const monto = parseFloat(a.apo_monto);
      return sum + (isNaN(monto) ? 0 : monto);
    }, 0);
  }

  getTotalPagado(): number {
    return this.pagos.reduce((sum, p) => {
      const monto = parseFloat(p.pag_monto);
      return sum + (isNaN(monto) ? 0 : monto);
    }, 0);
  }

  getTotalMora(): number {
    return this.prestamos
      .filter(p => p.cre_estado === 'Mora')
      .reduce((sum, p) => {
        const monto = parseFloat(p.cre_monto_aprobado);
        return sum + (isNaN(monto) ? 0 : monto);
      }, 0);
  }

  get totalPrestamosActivos(): number {
    return this.prestamos.filter(p => p.cre_estado === 'Activo').length;
  }
}
