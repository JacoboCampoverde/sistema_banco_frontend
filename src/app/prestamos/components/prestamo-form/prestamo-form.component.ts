import { Component, EventEmitter, Output } from '@angular/core';
import { Credito, PrestamoService } from '../../services/prestamo.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Socio, SocioService } from '../../../socios/services/socio.service';
import { CommonModule } from '@angular/common';
import { Console } from 'console';
import { AuthService } from '../../../auth/services/auth.service';
import { AporteService } from '../../../aportes/services/aporte.service';
import { AvalService } from '../../services/aval.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-prestamo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './prestamo-form.component.html',
  styleUrl: './prestamo-form.component.css'
})
export class PrestamoFormComponent {

  prestamoForm!: FormGroup;
  socios: Socio[] = [];
  estados = ['Pendiente', 'Activo', 'Cancelado', 'Mora'];
  sociosAvalDisponibles: Socio[] = [];
  montoMaximo: number = 0;
  montoMinimo: number = 50;
  totalAportado: number = 0;
  topeAsamblea: number = 3000;

  esAvalSeleccionado = false;
  avalSocId: number | null = null;
  avalError = false;

  @Output() submitCredito = new EventEmitter<Credito>();

  constructor(
    private fb: FormBuilder,
    private socioService: SocioService,
    private prestamoService: PrestamoService,
    private authService: AuthService,
    private aporteService: AporteService,
    private avalService: AvalService
  ) { }

  ngOnInit(): void {
    this.prestamoForm = this.fb.group({
      cre_soc_id: [null, Validators.required],
      cre_monto_solicitado: [null, [Validators.required, Validators.min(this.montoMinimo)]],
      cre_des_prestamo: ['', Validators.required], // Ej: "Agrícola", "Comercial", etc.
      cre_plazo_meses: [null, [
        Validators.required,
        Validators.min(3),
        Validators.max(12)
      ]],
      cre_meses_gracia: [0, [
        Validators.min(0),
        Validators.max(2)
      ]],
      cre_tasa_interes: [1.5, [Validators.required, Validators.min(0)]],
      cre_forma_pago: ['', Validators.required],
      cre_fecha_solicitud: [this.todayISODate(), Validators.required],
      cre_motivo: [''],
      cre_tipo_garantia: [''],
      aval_soc_id: [null]
    });

    this.prestamoForm.get('cre_des_prestamo')?.valueChanges.subscribe(destino => {
      if (destino !== 'Agrícola' && destino !== 'Productivo') {
        this.prestamoForm.get('cre_meses_gracia')?.setValue(0);
      }
    });

    this.cargarSocios();
  }

  cargarSocios(): void {
    this.socioService.getSocios().subscribe({
      next: socios => this.socios = socios,
      error: () => this.socios = []
    });
  }

  todayISODate(): string {
    return new Date().toISOString().substring(0, 10);
  }

  onSubmit(): void {
    if (!this.validarGracia()) {
      alert('Solo se puede dar meses de gracia para actividades agrícolas o productivas.');
      return;
    }
    const socioSolicitante = this.prestamoForm.get('cre_soc_id')?.value;
    const avalSeleccionado = this.prestamoForm.get('aval_soc_id')?.value;

    if (
      this.prestamoForm.invalid ||
      (this.esAvalSeleccionado && (!avalSeleccionado || avalSeleccionado === socioSolicitante))
    ) {
      if (this.esAvalSeleccionado && (!avalSeleccionado || avalSeleccionado === socioSolicitante)) {
        this.avalError = true;
      }
      this.prestamoForm.markAllAsTouched();
      return;
    }

    const credito: Credito = {
      ...this.prestamoForm.value,
      cre_estado: 'Pendiente'
    };
    const avalId = this.prestamoForm.get('aval_soc_id')?.value;

    this.prestamoService.crearCredito(credito).subscribe({
      next: (nuevoCredito) => {
        if (this.esAvalSeleccionado && avalSeleccionado) {
          this.avalService.crearAval({
            ava_cre_id: nuevoCredito.cre_id ?? 0,
            ava_soc_id: avalSeleccionado
          }).subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Aval registrado exitosamente',
                timer: 1800,
                showConfirmButton: false
              });
            },
            error: err => {
              Swal.fire({
                icon: 'error',
                title: 'Error al registrar aval',
                text: err.message || 'Ocurrió un error inesperado.',
                confirmButtonText: 'Aceptar'
              });
              console.error('Error al registrar aval:', err);
            }
          });
        }

        this.prestamoForm.reset({
          cre_fecha_solicitud: this.todayISODate(),
          cre_estado: 'Pendiente'
        });
        this.esAvalSeleccionado = false;
        this.avalSocId = null;
      },
      error: err => {
        Swal.fire({
          icon: 'error',
          title: 'Error al crear crédito',
          text: err.message || 'Ocurrió un error inesperado.',
          confirmButtonText: 'Aceptar'
        });
        console.error('Error al crear crédito:', err);
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.prestamoForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSocioSeleccionado(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const socioId = Number(target.value);
    if (!socioId) {
      this.totalAportado = 0;
      this.montoMaximo = 0;
      return;
    }
    this.sociosAvalDisponibles = this.socios.filter(s => s.soc_id !== socioId);
    this.socioService.getSocioById(socioId).subscribe({
      next: (socio) => {
        const fechaIngreso = new Date(socio.soc_fecha_ingreso);
        const hoy = new Date();
        const diferenciaMs = hoy.getTime() - fechaIngreso.getTime();
        const diferenciaDias = diferenciaMs / (1000 * 60 * 60 * 24);

        if (diferenciaDias < 90) {
          alert('Para solicitar un préstamo, debe tener al menos 3 meses como socio.');
          this.prestamoForm.get('cre_soc_id')?.setValue(null);
          return;
        }

        this.aporteService.obtenerAportesPorSocio(socioId).subscribe({
          next: (aportes) => {
            this.totalAportado = aportes.reduce((sum, a) => {
              const raw = typeof a.apo_monto === 'string' ? a.apo_monto : a.apo_monto.toString();
              const cleaned = raw.replace(/[^0-9.-]/g, ''); // 👈 incluye el guión para negativos
              const monto = parseFloat(cleaned);
              return sum + (isNaN(monto) ? 0 : monto);
            }, 0);

            console.log('Total aportado por el socio:', this.totalAportado);


            const calculado = this.totalAportado * 3;
            this.montoMaximo = Math.min(calculado, this.topeAsamblea);

            const control = this.prestamoForm.get('cre_monto_solicitado');
            control?.setValidators([
              Validators.required,
              Validators.min(this.montoMinimo),
              Validators.max(this.montoMaximo)
            ]);
            control?.updateValueAndValidity();
          },
          error: () => {
            console.error('No se pudieron cargar los aportes del socio.');
            this.totalAportado = 0;
            this.montoMaximo = 0;
          }
        });
      },
      error: () => {
        console.error('No se pudo obtener el socio seleccionado.');
      }
    });
  }

  validarGracia(): boolean {
    const destino = this.prestamoForm.get('cre_des_prestamo')?.value;
    const mesesGracia = Number(this.prestamoForm.get('cre_meses_gracia')?.value || 0);

    // Solo se permite gracia > 0 si el destino es Agrícola o Productivo
    if (mesesGracia > 0 && destino !== 'Agrícola' && destino !== 'Productivo') {
      return false;
    }
    return true;
  }

  permiteGracia(): boolean {
    const destino = this.prestamoForm.get('cre_des_prestamo')?.value;
    return destino === 'Agrícola' || destino === 'Productivo';
  }

  onGarantiaChange(event: Event): void {
    const tipo = (event.target as HTMLSelectElement).value;
    this.esAvalSeleccionado = tipo === 'Aval';
    if (!this.esAvalSeleccionado) {
      this.avalSocId = null;
      this.avalError = false;
    }
  }

  getSociosAvalDisponibles(): Socio[] {
    const solicitanteId = this.prestamoForm.get('cre_soc_id')?.value;
    return this.socios.filter(s => s.soc_id !== solicitanteId);
  }

}
