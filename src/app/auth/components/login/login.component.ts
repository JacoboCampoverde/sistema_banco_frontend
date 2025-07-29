import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      usu_email: [{ value: '', disabled: this.loading }, [Validators.required, Validators.email]],
      usu_password: [{ value: '', disabled: this.loading }, Validators.required],
    });
  }

  async login() {
    if (this.form.invalid) return;
    this.loading = true;
    this.form.disable();
    this.error = '';

    try {
      await this.authService.login(this.form.value);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.error = 'Error de autenticación.';
      Swal.fire({
        icon: 'error',
        title: 'Login fallido',
        text: this.error,
        confirmButtonText: 'OK'
      });
    } finally {
      this.loading = false;
      this.form.enable();
    }
  }
}
