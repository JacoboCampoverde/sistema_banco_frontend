import { Component } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { Socio } from '../../../socios/services/socio.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  userRole: string;

  constructor(private authService: AuthService) {
    this.userRole = this.authService.getUserRole();
  }

  hasRole(allowedRoles: string[]): boolean {
    return allowedRoles.includes(this.userRole);
  }

  toggleSubmenu(event: Event) {
    const element = (event.currentTarget as HTMLElement).parentElement;
    if (element) {
      element.classList.toggle('open');
    }
  }

  logout() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción cerrará tu sesión actual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }
}