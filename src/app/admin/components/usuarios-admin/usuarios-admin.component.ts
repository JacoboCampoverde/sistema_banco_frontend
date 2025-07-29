import { Component } from '@angular/core';
import { Usuario, UsuarioService } from '../../services/usuario.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-admin.component.html',
  styleUrl: './usuarios-admin.component.css'
})
export class UsuariosAdminComponent {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  errorMsg = '';

  rolesDisponibles = ['admin', 'comite', 'socio', 'soporte'];
  estadosDisponibles = ['Activo', 'Inactivo', 'Suspendido', 'Moroso'];

  filtroRol = '';
  filtroEstado = '';
  busquedaNombre = '';

  constructor(private usuarioService: UsuarioService) { }

  ngOnInit(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (res) => {
        this.usuarios = res.usuarios;
        this.usuariosFiltrados = [...this.usuarios];
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar usuarios';
        console.error(err);
      },
    });
  }

  filtrar(): void {
    this.usuariosFiltrados = this.usuarios.filter((u) => {
      const coincideRol =
        this.filtroRol === '' || u.Socio.soc_roles.includes(this.filtroRol);
      const coincideEstado =
        this.filtroEstado === '' || u.Socio.soc_estado === this.filtroEstado;
      const coincideNombre =
        this.busquedaNombre === '' ||
        u.Socio.soc_nombres.toLowerCase().includes(this.busquedaNombre.toLowerCase());

      return coincideRol && coincideEstado && coincideNombre;
    });
  }

  filtrarPorRol(event: Event): void {
    this.filtroRol = (event.target as HTMLSelectElement).value;
    this.filtrar();
  }

  filtrarPorEstado(event: Event): void {
    this.filtroEstado = (event.target as HTMLSelectElement).value;
    this.filtrar();
  }

  filtrarPorNombre(): void {
    this.filtrar();
  }

}
