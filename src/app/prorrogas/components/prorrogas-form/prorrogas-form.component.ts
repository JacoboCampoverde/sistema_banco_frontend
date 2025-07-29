import { Component, OnInit } from '@angular/core';
import { Prorroga, ProrrogaService } from '../../services/prorroga.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Credito, PrestamoService } from '../../../prestamos/services/prestamo.service';
import { AuthService } from '../../../auth/services/auth.service';
import { SocioService } from '../../../socios/services/socio.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-prorrogas-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './prorrogas-form.component.html',
  styleUrl: './prorrogas-form.component.css'
})
export class ProrrogasFormComponent implements OnInit {
  form: FormGroup;
  creditos: Credito[] = [];
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private prorrogaService: ProrrogaService,
    private prestamoService: PrestamoService,
    private socioService: SocioService
  ) {
    this.form = this.fb.group({
      cedula: ['', [Validators.required]],
      pro_cre_id: ['', Validators.required],
      pro_fecha_solicitud: ['', Validators.required],
      pro_motivo: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void { }

  buscarCreditosPorCedula() {
    const cedula = this.form.get('cedula')?.value;
    if (!cedula) {
      this.errorMessage = 'Debe ingresar una cédula válida.';
      this.creditos = [];
      return;
    }

    this.errorMessage = '';
    // Buscar socio por cédula
    this.socioService.getSocioByCedula(cedula).subscribe({
      next: (socio) => {
        if (!socio) {
          this.errorMessage = 'No se encontró socio con esa cédula.';
          this.creditos = [];
          return;
        }

        // Si socio existe, cargar créditos por su ID
        this.prestamoService.obtenerCreditosPorSocio(socio.soc_id).subscribe({
          next: (creditos) => {
            this.creditos = creditos;
            if (creditos.length === 0) {
              this.errorMessage = 'El socio no tiene créditos activos.';
            }
          },
          error: (err) => {
            this.errorMessage = 'Error al obtener créditos: ' + err.message;
            this.creditos = [];
          }
        });
      },
      error: (err) => {
        this.errorMessage = 'Error al buscar socio: ' + err.message;
        this.creditos = [];
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const nuevaProrroga: Prorroga = {
      pro_cre_id: this.form.value.pro_cre_id,
      pro_fecha_solicitud: this.form.value.pro_fecha_solicitud,
      pro_motivo: this.form.value.pro_motivo,
      pro_documento_url: undefined,
      pro_estado: 'Pendiente',
      pro_dias_concedidos: 0
    };

    this.prorrogaService.createProrroga(nuevaProrroga).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Solicitud de prórroga enviada correctamente.'
        });
        this.form.reset();
        this.creditos = [];
        this.isSubmitting = false;
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al enviar la solicitud: ' + err.message
        });
        this.isSubmitting = false;
      }
    });
  }
}
