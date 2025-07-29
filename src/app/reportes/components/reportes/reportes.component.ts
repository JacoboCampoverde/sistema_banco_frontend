import { Component, OnInit } from '@angular/core';
import { ReporteService } from '../../services/reporte.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { Credito } from '../../../prestamos/services/prestamo.service';
import { Pago, PagoService } from '../../../pagos/services/pago.service';
import { EMPTY, forkJoin, from, map, switchMap } from 'rxjs';
import { AporteService } from '../../../aportes/services/aporte.service';
import { MultasService } from '../../../multas/services/multas.service';
import Swal from 'sweetalert2';

interface MorosidadInfo {
  fechaProximoPago?: string;
  diasRetraso: number;
  interesMora: number;
  mensajeComite?: string | null;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})


export class ReportesComponent implements OnInit {
  rol: string = '';
  socioId: number | null = null;

  aportes: any[] = [];
  totalAportes = 0;
  creditos: Credito[] = [];
  multas: any[] = [];
  morosos: (Credito & { morosidad?: MorosidadInfo })[] = []; // Extiende con morosidad
  cartera: any[] = [];
  avales: any[] = [];
  multasGlobales: any[] = [];

  isLoading = false;
  errorMsg = '';
  seccionActiva: string = 'cartera';

  constructor(
    private reporteService: ReporteService,
    private authService: AuthService,
    private pagoService: PagoService,
    private aporteService: AporteService,
    private multasService: MultasService
  ) { }

  ngOnInit(): void {
    const roles = this.authService.getRoles();
    if (roles.includes('admin')) {
      this.rol = 'admin';
    } else if (roles.includes('presidente')) {
      this.rol = 'presidente';
    } else if (roles.includes('secretario')) {
      this.rol = 'secretario';
    } else {
      this.rol = this.authService.getUserRole();
    }
    this.socioId = this.authService.getSocioId();
    this.cargarReportes();
  }

  cargarReportes(): void {
    this.isLoading = true;
    this.errorMsg = '';

    if (this.rol === 'socio' && this.socioId) {
      // igual que antes
      this.reporteService.obtenerAportesPorSocio(this.socioId).subscribe({
        next: ({ total, aportes }) => {
          this.totalAportes = total;
          this.aportes = aportes;
        },
        error: err => this.errorMsg = err.message
      });

      this.reporteService.obtenerCreditosPorSocio(this.socioId).subscribe({
        next: data => this.creditos = data,
        error: err => this.errorMsg = err.message
      });

      this.reporteService.obtenerMultasPorSocio(this.socioId).subscribe({
        next: data => this.multas = data,
        error: err => this.errorMsg = err.message
      });

    } else if (['admin', 'secretario', 'presidente'].includes(this.rol)) {
      this.reporteService.obtenerResumenCartera().subscribe({
        next: data => this.cartera = data,
        error: err => this.errorMsg = err.message
      });

      this.reporteService.obtenerAvalesGlobal().subscribe({
        next: data => this.avales = data,
        error: err => this.errorMsg = err.message
      });

      // Aquí mejoramos la obtención de morosos con cálculo de morosidad
      this.reporteService.obtenerSociosEnMora().pipe(
        switchMap(morosos => {
          if (morosos.length === 0) return [morosos]; // Devuelve un array vacío

          const observablesPagos = morosos.map((c: Credito) =>
            this.pagoService.obtenerPagosPorCredito(c.cre_id!).pipe(
              map(pagos => {
                const morosidad = this.calcularMorosidad(c, pagos);
                return { ...c, morosidad };
              })
            )
          );

          return forkJoin(observablesPagos);
        })
      ).subscribe({
        next: (morososConMorosidad) => {
          this.morosos = morososConMorosidad;
          this.isLoading = false;
        },
        error: err => {
          this.errorMsg = err.message;
          this.isLoading = false;
        }
      });

      this.reporteService.obtenerTodasLasMultas().subscribe({
        next: data => {
          this.multasGlobales = data;
          // console.log('Multas globales:', data);
        },
        error: err => this.errorMsg = err.message
      });
    }
  }

  calcularMorosidad(prestamo: Credito, pagos: Pago[]): MorosidadInfo {
    const monto = prestamo.cre_monto_aprobado ?? 0;
    const interesAnual = prestamo.cre_tasa_interes ? prestamo.cre_tasa_interes / 100 : 0;
    const plazoMeses = prestamo.cre_plazo_meses || 12;
    const formaPago = prestamo.cre_forma_pago?.toLowerCase() || 'mensual';
    const mesesGracia = Math.max(0, Math.min(prestamo.cre_meses_gracia ?? 0, 12));
    const sumaAbonos = pagos.reduce((acc, pago) => acc + Number(pago.pag_abono_capital || 0), 0);

    let cuotas = 0;
    let interesPorPeriodo = 0;

    switch (formaPago) {
      case 'mensual':
        cuotas = plazoMeses;
        interesPorPeriodo = interesAnual / 12;
        break;
      case 'bimestral':
        cuotas = Math.ceil(plazoMeses / 2);
        interesPorPeriodo = interesAnual / 6;
        break;
      default:
        cuotas = plazoMeses;
        interesPorPeriodo = interesAnual / 12;
    }

    const cuotaFija = monto * interesPorPeriodo / (1 - Math.pow(1 + interesPorPeriodo, -cuotas));
    const montoAPagar = cuotaFija || 0;

    const incrementoMeses = formaPago === 'bimestral' ? 2 : 1;
    const fechaInicio = new Date(prestamo.cre_fecha_aprobacion || new Date());
    const fechaBase = this.sumarMeses(fechaInicio, incrementoMeses + mesesGracia);

    let fechaProximoPago: string | undefined;
    if (fechaBase) {
      const fechaPago = this.sumarMeses(fechaBase, incrementoMeses * pagos.length);
      fechaProximoPago = fechaPago.toISOString().slice(0, 10);
    }

    const hoy = new Date();
    let diasRetraso = 0;
    let porcentajeMora = 0;
    let mensajeComite: string | null = null;
    let interesMora = 0;

    if (fechaProximoPago) {
      const fechaProx = new Date(fechaProximoPago);
      diasRetraso = Math.max(0, Math.floor((hoy.getTime() - fechaProx.getTime()) / (1000 * 60 * 60 * 24)));

      if (diasRetraso >= 1 && diasRetraso <= 7) {
        porcentajeMora = 0.01;
        mensajeComite = 'Retraso leve. Se recomienda recordar al socio su obligación de pago.';
      } else if (diasRetraso >= 8 && diasRetraso <= 15) {
        porcentajeMora = 0.02;
        mensajeComite = 'Retraso moderado. El comité puede enviar una notificación formal.';
      } else if (diasRetraso >= 16 && diasRetraso <= 30) {
        porcentajeMora = 0.03;
        mensajeComite = 'Retraso importante. Evaluar medidas de advertencia.';
      } else if (diasRetraso > 30) {
        porcentajeMora = 0.05;
        mensajeComite = 'Retraso superior a 30 días. El socio podría enfrentar suspensión de servicios.';
      }


      interesMora = porcentajeMora * montoAPagar;
    }

    return {
      fechaProximoPago,
      diasRetraso,
      interesMora,
      mensajeComite
    };
  }

  sumarMeses(fecha: Date, meses: number): Date {
    const nuevaFecha = new Date(fecha);
    const dia = nuevaFecha.getDate();
    nuevaFecha.setDate(1);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);
    const maxDias = new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth() + 1, 0).getDate();
    nuevaFecha.setDate(Math.min(dia, maxDias));
    return nuevaFecha;
  }

  pagarMulta(multa: any) {
    const monto = Number(multa.mul_monto);
    const montoTexto = isNaN(monto) ? multa.mul_monto : monto.toFixed(2);

    // Primero obtener aportes para validar saldo
    this.aporteService.obtenerAportesPorSocio(multa.soc_id).pipe(
      switchMap(aportes => {
        // Calcular saldo neto (sumar positivos y negativos)
        const saldo = aportes.reduce((acc, a) => acc + Number(a.apo_monto), 0);

        if (saldo < monto) {
          Swal.fire({
            icon: 'error',
            title: 'Saldo insuficiente',
            text: `El socio no tiene saldo suficiente para pagar la multa de ${montoTexto}. Saldo actual: ${saldo.toFixed(2)}`,
          });
          return EMPTY; // Cancela la cadena observable
        }

        // Si saldo es suficiente, preguntar confirmación
        return from(Swal.fire({
          title: '¿Está seguro?',
          text: `Va a pagar la multa por ${montoTexto}. Esta acción no se puede revertir.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, pagar',
          cancelButtonText: 'Cancelar'
        })).pipe(
          switchMap(result => {
            if (!result.isConfirmed) return EMPTY;

            const aporteNegativo = {
              apo_soc_id: multa.soc_id,
              apo_monto: -Math.abs(monto || 0),
              apo_fecha: new Date().toISOString().split('T')[0],
              apo_tipo: 'Pago de multa'
            };

            return this.aporteService.crearAporte(aporteNegativo).pipe(
              switchMap(() => this.multasService.actualizarEstadoMulta(multa.mul_id, 'Cancelada'))
            );
          })
        );
      })
    ).subscribe({
      next: () => {
        multa.mul_estado = 'Cancelada';
        Swal.fire({
          icon: 'success',
          title: 'Multa pagada',
          text: 'La multa ha sido pagada y cancelada exitosamente.',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: err => {
        console.error('Error al pagar multa:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al procesar el pago de la multa.',
        });
      }
    });
  }



}
