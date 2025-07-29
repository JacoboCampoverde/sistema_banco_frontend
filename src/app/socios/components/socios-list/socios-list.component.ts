import { Component, OnInit } from '@angular/core';
import { Socio, SocioService } from '../../services/socio.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-socios-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './socios-list.component.html',
  styleUrl: './socios-list.component.css'
})
export class SociosListComponent implements OnInit {
  socios: Socio[] = [];
  loading = true;
  error: string | null = null;

  constructor(private socioService: SocioService, private router: Router) { }

  ngOnInit(): void {
    this.cargarSocios();
  }

  cargarSocios(): void {
    this.loading = true;
    this.socioService.getSocios().subscribe({
      next: (data) => {
        this.socios = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los socios';
        this.loading = false;
        console.error(err);
      }
    });
  }

  verDetalle(socio: Socio): void {
    this.router.navigate(['/socios', socio.soc_id]);
  }
}
