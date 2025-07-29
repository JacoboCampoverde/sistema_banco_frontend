import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Aporte, AporteService } from '../../services/aporte.service';
import { CommonModule } from '@angular/common';
import { Socio, SocioService } from '../../../socios/services/socio.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-aporte-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './aporte-form.component.html',
  styleUrl: './aporte-form.component.css'
})
export class AporteFormComponent implements OnInit {
  @Input() socioId!: number;
  socios: Socio[] = [];

  aporteForm!: FormGroup;
  successMessage = '';
  errorMessage = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private aporteService: AporteService,
    private socioService: SocioService
  ) { }

  ngOnInit(): void {
    this.aporteForm = this.fb.group({
      apo_soc_id: [this.socioId ?? '', Validators.required],
      apo_monto: ['', [Validators.required, Validators.pattern(/^-?\d+(\.\d{1,2})?$/)]],
      apo_fecha: [this.hoy(), Validators.required],
      apo_tipo: ['Mensual', Validators.required],
    });
    this.cargarSocios();
  }

  cargarSocios(): void {
    this.socioService.getSocios().subscribe({
      next: (socios) => this.socios = socios,
      error: (err) => console.error('Error al cargar socios:', err)
    });
  }

  hoy(): string {
    return new Date().toISOString().split('T')[0];
  }


  onSubmit(): void {
    const monto = Number(this.aporteForm.value.apo_monto);
    const tipo = this.aporteForm.value.apo_tipo;

    if (tipo === 'Mensual' && monto < 0) {
      this.errorMessage = 'Los aportes mensuales no pueden tener valores negativos.';
      return;
    }

    if (tipo === 'Retiro' && monto > 0) {
      this.aporteForm.patchValue({ apo_monto: -Math.abs(monto) });
    }

    if (!this.aporteForm.valid) {
      this.aporteForm.markAllAsTouched();
      return;
    }

    this.aporteService.crearAporte(this.aporteForm.value).subscribe({
      next: (data) => {
        console.log('Aporte registrado:', data);
        this.aporteForm.reset();
        this.successMessage = 'Aporte registrado correctamente.';
        this.errorMessage = '';

        // Alerta éxito
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: this.successMessage,
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Error al registrar aporte:', err);
        this.errorMessage = 'No se pudo registrar el aporte.';

        // Alerta error
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMessage,
          confirmButtonText: 'Aceptar'
        });
      }
    });

  }
}
