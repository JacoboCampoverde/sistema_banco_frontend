import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Socio, SocioService } from '../../services/socio.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-socio-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './socio-detail.component.html',
  styleUrl: './socio-detail.component.css'
})
export class SocioDetailComponent implements OnInit{
  socio?: Socio;
  loading = true;
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socioService: SocioService
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMsg = 'ID de socio inválido';
      this.loading = false;
      return;
    }

    this.socioService.getSocioById(id).subscribe({
      next: (data) => {
        this.socio = data;
        this.loading = false;
      },
      error: (error) => {
        this.errorMsg = 'Error al cargar los datos del socio.';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/socios']);
  }
}
