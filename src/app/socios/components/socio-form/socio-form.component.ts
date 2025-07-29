import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SocioService } from '../../services/socio.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-socio-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './socio-form.component.html',
  styleUrl: './socio-form.component.css'
})
export class SocioFormComponent {
  loading = false;
  errorMsg = '';
  successMsg = '';

  socioForm = this.fb.group({
    nombres: ['', [Validators.required, Validators.minLength(3)]],
    cedula: ['', [Validators.required, Validators.minLength(5)]],
    telefono: [''],
    direccion: [''],
    roles: ['socio'],
    acepto_reglamento: [true, Validators.requiredTrue],

    // Datos usuario
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', [Validators.required]]
  });

  constructor(private fb: FormBuilder, private socioService: SocioService) { }

  passwordsMatch(): boolean {
    return this.socioForm.get('password')!.value === this.socioForm.get('confirmarPassword')!.value;
  }

  onSubmit() {
    this.errorMsg = '';
    this.successMsg = '';

    if (this.socioForm.invalid) {
      this.errorMsg = 'Por favor complete todos los campos obligatorios correctamente.';
      return;
    }
    if (!this.passwordsMatch()) {
      this.errorMsg = 'Las contraseñas no coinciden.';
      return;
    }

    const socioData = {
      nombres: this.socioForm.value.nombres!,
      cedula: this.socioForm.value.cedula!,
      telefono: this.socioForm.value.telefono || '',
      direccion: this.socioForm.value.direccion || '',
      roles: this.socioForm.value.roles ? [this.socioForm.value.roles] : ['socio'],
      acepto_reglamento: !!this.socioForm.value.acepto_reglamento,
    };

    const usuarioData = {
      email: this.socioForm.value.email!,
      password: this.socioForm.value.password!,
    };

    this.loading = true;

    this.socioService.createSocioConUsuario({ socioData, usuarioData }).subscribe({
      next: (res) => {
        this.successMsg = 'Socio y usuario creados correctamente.';
        this.socioForm.reset();
        // Restaurar valores iniciales
        this.socioForm.patchValue({
          roles: 'socio',
          acepto_reglamento: true
        });
        this.loading = false;

        // Mostrar alerta éxito
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: this.successMsg,
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false
        });
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Error creando socio y usuario.';
        this.loading = false;

        // Mostrar alerta error
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMsg,
          confirmButtonText: 'Aceptar'
        });
      }
    });

  }
}
