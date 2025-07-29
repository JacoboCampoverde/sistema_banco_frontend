import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Socio, SocioService } from '../../../socios/services/socio.service';

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil-usuario.component.html',
  styleUrl: './perfil-usuario.component.css'
})
export class PerfilUsuarioComponent implements OnInit {
  socio: Socio | null = null;
  error: string | null = null;

  constructor(
    private socioService: SocioService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const socId = this.authService.getSocioId();
    if (socId) {
      this.socioService.getSocioById(socId).subscribe({
        next: (data) => {
          this.socio = data;
          this.error = null;
        },
        error: (err) => {
          this.error = 'Error al cargar datos del usuario.';
          console.error(err);
        }
      });
    } else {
      this.error = 'No se encontró el ID del socio en el token.';
    }
  }
}
