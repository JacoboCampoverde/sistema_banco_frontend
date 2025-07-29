import { Component } from '@angular/core';
import { Pago, PagoService } from '../../services/pago.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Credito, PrestamoService } from '../../../prestamos/services/prestamo.service';
import { AuthService } from '../../../auth/services/auth.service';
import { MultasService } from '../../../multas/services/multas.service';
import { Aporte, AporteService } from '../../../aportes/services/aporte.service';
import { catchError, EMPTY, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { Prorroga, ProrrogaService } from '../../../prorrogas/services/prorroga.service';

@Component({
  selector: 'app-pago-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './pago-form.component.html',
  styleUrl: './pago-form.component.css'
})
export class PagoFormComponent {
  prestamos: Credito[] = [];
  prestamoSeleccionado: Credito | null = null;
  pagoForm: FormGroup;
  enviado = false;
  errorMsg = '';
  infoPrestamo: {
    cuotasPagadas: number;
    totalCuotas: number;
    saldoRestante: number;
    fechaProximoPago?: string;
    montoAPagar?: number;
    mensajeComite?: string | null;
    tieneProrroga?: boolean;
    prorroga?: Prorroga | null;
  } | null = null;

  multaPendiente: {
    mul_soc_id: number;
    mul_monto: number;
    mul_motivo: string;
    mul_fecha: string;
    mul_estado: 'Pendiente' | 'Activa' | 'Pagada' | 'Cancelada';
  } | null = null;

  cedula: string = '';

  constructor(
    private fb: FormBuilder,
    private pagoService: PagoService,
    private prestamoService: PrestamoService,
    private authService: AuthService,
    private multaService: MultasService,
    private aporteService: AporteService,
    private router: Router,
    private prorrogaService: ProrrogaService
  ) {
    this.pagoForm = this.fb.group({
      pag_monto: ['', [Validators.required, Validators.min(0.01)]],
      pag_fecha: ['', Validators.required],
      pag_interes: [''],
      pag_abono_capital: [''],
    });
  }

  ngOnInit() {
    this.cargarPrestamos();
  }

  cargarPrestamos() {
    const rol = this.getRole();

    if (rol === 'socio' || rol === 'secretario') {
      // solo sus préstamos
      this.authService.getSocioAutenticado().subscribe({
        next: (socio) => {
          const cedula = socio?.soc_cedula;
          if (cedula) {
            this.prestamoService.obtenerCreditosPorCedula(cedula).subscribe({
              next: (data) => this.prestamos = data,
              error: (err) => {
                this.errorMsg = 'Error cargando préstamos del socio.';
                console.error(err);
              }
            });
          } else {
            this.errorMsg = 'No se pudo obtener la cédula del socio autenticado.';
          }
        },
        error: (err) => {
          this.errorMsg = 'Error obteniendo el socio autenticado.';
          console.error(err);
        }
      });

    } else if (['presidente', 'secretario', 'admin'].includes(rol)) {
      // puede ver todos los préstamos aprobados
      this.prestamoService.obtenerCreditosAprobados().subscribe({
        next: (data) => this.prestamos = data,
        error: (err) => {
          this.errorMsg = 'Error cargando préstamos aprobados.';
          console.error(err);
        }
      });
    } else {
      this.errorMsg = 'No tienes permisos para acceder a los préstamos.';
      this.prestamos = [];
    }
  }

  onPrestamoChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const id = +selectElement.value;
    this.prestamoSeleccionado = this.prestamos.find(p => p.cre_id === id) ?? null;

    if (this.prestamoSeleccionado) {
      this.cargarInfoPrestamo(this.prestamoSeleccionado);
      this.errorMsg = '';
    } else {
      this.infoPrestamo = null;
    }
  }

  cargarInfoPrestamo(prestamo: Credito) {
    this.pagoService.obtenerPagosPorCredito(prestamo.cre_id!).subscribe({
      next: pagos => {
        // cálculo actual
        const totalPagos = pagos.length;
        const monto = prestamo.cre_monto_aprobado ?? 0;
        const interesAnual = prestamo.cre_tasa_interes ? prestamo.cre_tasa_interes / 100 : 0;
        const plazoMeses = prestamo.cre_plazo_meses || 12;
        const formaPago = prestamo.cre_forma_pago?.toLowerCase() || 'mensual';
        const mesesGracia = Math.max(0, Math.min(prestamo.cre_meses_gracia ?? 0, 12));

        const sumaAbonos = pagos.reduce((acc, pago) => acc + Number(pago.pag_abono_capital || 0), 0);
        const saldoRestante = monto - sumaAbonos;

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
          const fechaPago = this.sumarMeses(fechaBase, incrementoMeses * totalPagos);
          fechaProximoPago = fechaPago.toISOString().slice(0, 10);
        }

        const hoy = new Date();
        let interesMora = 0;
        let mensajeComite: string | null = null;

        if (fechaProximoPago) {
          const fechaProx = new Date(fechaProximoPago);
          const diasRetraso = Math.max(0, Math.floor((hoy.getTime() - fechaProx.getTime()) / (1000 * 60 * 60 * 24)));

          let porcentajeMora = 0;

          if (diasRetraso >= 1 && diasRetraso <= 7) {
            porcentajeMora = 0.01;
          } else if (diasRetraso >= 8 && diasRetraso <= 15) {
            porcentajeMora = 0.02;
          } else if (diasRetraso >= 16 && diasRetraso <= 30) {
            porcentajeMora = 0.03;
          } else if (diasRetraso > 30) {
            porcentajeMora = 0.05;
            mensajeComite = 'Retraso superior a 30 días. El socio podría enfrentar suspensión de servicios.';
          }

          interesMora = porcentajeMora * montoAPagar;

          this.multaPendiente = interesMora > 0 ? {
            mul_soc_id: prestamo.cre_soc_id!,
            mul_monto: parseFloat(interesMora.toFixed(2)),
            mul_motivo: `Retraso de pago (${diasRetraso} días)`,
            mul_fecha: hoy.toISOString().split('T')[0],
            mul_estado: 'Cancelada'
          } : null;
        }

        // Ahora, verificamos si hay prórrogas para este crédito:
        this.prorrogaService.getProrrogas().subscribe({
          next: prorrogas => {
            // Filtrar las prórrogas de este crédito y estado relevante
            const prorrogasCredito = prorrogas.filter(p => p.pro_cre_id === prestamo.cre_id);
            const prorrogaActiva = prorrogasCredito.find(p => p.pro_estado === 'Pendiente' || p.pro_estado === 'Aprobada');

            this.pagoForm.patchValue({
              pag_monto: parseFloat((montoAPagar + interesMora).toFixed(2)),
              pag_interes: parseFloat(interesMora.toFixed(2)),
              pag_abono_capital: parseFloat(montoAPagar.toFixed(2)),
              pag_fecha: hoy.toISOString().split('T')[0]
            });

            this.infoPrestamo = {
              cuotasPagadas: totalPagos,
              totalCuotas: cuotas,
              saldoRestante,
              montoAPagar: parseFloat(montoAPagar.toFixed(2)),
              fechaProximoPago,
              mensajeComite,
              tieneProrroga: !!prorrogaActiva,
              prorroga: prorrogaActiva || null
            };
          },
          error: err => {
            console.error('Error al cargar prórrogas', err);
            this.infoPrestamo = {
              cuotasPagadas: totalPagos,
              totalCuotas: cuotas,
              saldoRestante,
              montoAPagar: parseFloat(montoAPagar.toFixed(2)),
              fechaProximoPago,
              mensajeComite,
              tieneProrroga: false,
              prorroga: null
            };
          }
        });
      },
      error: err => {
        console.error('Error al cargar pagos del préstamo', err);
        this.infoPrestamo = null;
      }
    });
  }



  sumarMeses(fecha: Date, meses: number): Date {
    const nuevaFecha = new Date(fecha);
    const dia = nuevaFecha.getDate();
    nuevaFecha.setDate(1); // evitar overflow al cambiar mes
    nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);
    const maxDias = new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth() + 1, 0).getDate();
    nuevaFecha.setDate(Math.min(dia, maxDias));
    return nuevaFecha;
  }

  enviarPago() {
    this.enviado = true;
    this.errorMsg = '';

    const prestamo = this.prestamoSeleccionado;
    const form = this.pagoForm;

    if (!prestamo) {
      this.errorMsg = 'Debe seleccionar un préstamo.';
      return;
    }

    if (prestamo.cre_estado === 'Cancelado') {
      Swal.fire({
        icon: 'info',
        title: 'Préstamo cancelado',
        text: 'Este préstamo ya ha sido cancelado. No se pueden registrar más pagos.',
        confirmButtonText: 'Aceptar'
      });
      this.enviado = false;
      return;
    }

    if (form.invalid) {
      return;
    }

    const montoPago = Number(form.value.pag_monto);
    if (montoPago <= 0) {
      this.errorMsg = 'El monto del pago debe ser mayor a cero.';
      return;
    }

    this.aporteService.obtenerAportesPorSocio(prestamo.cre_soc_id!).pipe(
      switchMap((aportes) => {
        const saldoAportes = aportes.reduce((acc, a) => acc + Number(a.apo_monto), 0);

        const saldoPostPago = saldoAportes - montoPago;
        if (saldoAportes <= 0) {
          this.errorMsg = 'El socio no tiene saldo suficiente para realizar el pago.';
          return EMPTY;
        }
        if (saldoPostPago < 0) {
          this.errorMsg = `El pago excede el saldo disponible. Saldo actual: $${saldoAportes.toFixed(2)}, intento de retiro: $${montoPago.toFixed(2)}.`;
          return EMPTY;
        }

        return this.multaPendiente
          ? this.multaService.crearMulta(this.multaPendiente)
          : of(null);
      }),
      switchMap(() => {
        const aporteNegativo: Aporte = {
          apo_soc_id: prestamo.cre_soc_id!,
          apo_monto: -Math.abs(montoPago),
          apo_fecha: new Date().toISOString().split('T')[0],
          apo_tipo: 'Pago de préstamo',
        };

        return this.aporteService.crearAporte(aporteNegativo);
      }),
      switchMap(() => {
        const nuevoPago: Pago = {
          pag_cre_id: prestamo.cre_id!,
          pag_monto: montoPago,
          pag_fecha: form.value.pag_fecha,
          pag_interes: form.value.pag_interes || 0,
          pag_abono_capital: form.value.pag_abono_capital || 0,
        };

        return this.pagoService.crearPago(nuevoPago);
      }),
      switchMap(() => {
        return this.pagoService.obtenerPagosPorCredito(prestamo.cre_id!).pipe(
          switchMap(pagos => {
            const plazoMeses = prestamo.cre_plazo_meses || 12;
            const formaPago = prestamo.cre_forma_pago?.toLowerCase() || 'mensual';
            let cuotas = 0;
            switch (formaPago) {
              case 'mensual': cuotas = plazoMeses; break;
              case 'bimestral': cuotas = Math.ceil(plazoMeses / 2); break;
              default: cuotas = plazoMeses;
            }

            if (pagos.length >= cuotas && prestamo.cre_estado !== 'Cancelado') {
              const datosActualizados = { cre_estado: 'Cancelado' as 'Cancelado' };
              return this.prestamoService.actualizarCredito(prestamo.cre_id!, datosActualizados).pipe(
                catchError(err => {
                  console.error('Error al actualizar estado a Cancelado:', err);
                  return of(null);
                })
              );
            }
            return of(null);
          })
        );
      }),
      catchError((err) => {
        this.errorMsg = err.message || 'Error inesperado durante el proceso de pago.';
        console.error('Error en flujo de pago:', err);
        return of(null);
      })
    ).subscribe((resultadoFinal) => {
      if (resultadoFinal !== null) {
        Swal.fire({
          icon: 'success',
          title: 'Pago registrado exitosamente y préstamo cancelado.',
          showConfirmButton: false,
          timer: 2500
        });
        // Redirigir a lista de préstamos
        this.router.navigate(['/prestamos']);
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Pago registrado exitosamente',
          showConfirmButton: false,
          timer: 2000
        });
        this.pagoForm.reset();
        this.enviado = false;
        this.cargarInfoPrestamo(prestamo);
      }
    });
  }



  buscarPorCedula(): void {
    if (!this.cedula || this.cedula.trim().length < 10) {
      this.errorMsg = 'Ingrese una cédula válida.';
      this.prestamos = [];
      this.prestamoSeleccionado = null;
      return;
    }

    this.prestamoService.obtenerCreditosPorCedula(this.cedula.trim()).subscribe({
      next: (creditos) => {
        if (creditos.length > 0) {
          this.prestamos = creditos;
          this.errorMsg = '';
        } else {
          this.prestamos = [];
          this.prestamoSeleccionado = null;
          this.errorMsg = 'No se encontraron préstamos para esta cédula.';
        }
      },
      error: (err) => {
        console.error('Error al buscar préstamos:', err);
        this.errorMsg = 'Hubo un error al buscar los préstamos.';
        this.prestamos = [];
        this.prestamoSeleccionado = null;
      }
    });
  }

  getRole(): string {
    return this.authService.getUserRole();
  }
}
