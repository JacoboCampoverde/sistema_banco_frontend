import { Component, OnInit } from '@angular/core';
import { Prorroga, ProrrogaService } from '../../services/prorroga.service';
import { CommonModule, formatDate } from '@angular/common';
import Swal from 'sweetalert2';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-prorrogas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './prorrogas-list.component.html',
  styleUrl: './prorrogas-list.component.css'
})
export class ProrrogasListComponent implements OnInit {
  prorrogas: Prorroga[] = [];
  filteredProrrogas: Prorroga[] = [];
  filtroEstado: '' | 'Pendiente' | 'Aprobada' | 'Rechazada' = '';
  isLoading = false;

  constructor(private prorrogaService: ProrrogaService) { }

  ngOnInit(): void {
    this.cargarProrrogas();
  }

  cargarProrrogas() {
    this.isLoading = true;
    this.prorrogaService.getProrrogas().subscribe({
      next: (data) => {
        this.prorrogas = data;
        this.aplicarFiltro();
        this.isLoading = false;
      },
      error: () => {
        Swal.fire('Error', 'Error al cargar las prórrogas.', 'error');
        this.isLoading = false;
      }
    });
  }

  aplicarFiltro() {
    if (this.filtroEstado) {
      this.filteredProrrogas = this.prorrogas.filter(p => p.pro_estado === this.filtroEstado);
    } else {
      this.filteredProrrogas = [...this.prorrogas];
    }
  }

  async aceptarProrroga(prorroga: Prorroga) {
    const result = await Swal.fire({
      title: '¿Confirmar aprobación?',
      text: `¿Desea aprobar la prórroga #${prorroga.pro_id}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      const hoy = formatDate(new Date(), 'yyyy-MM-dd', 'en');
      const updateData: Partial<Prorroga> = {
        pro_estado: 'Aprobada',
        pro_fecha_aprobacion: hoy,
        pro_dias_concedidos: 30
      };
      this.prorrogaService.updateEstadoProrroga(prorroga.pro_id!, updateData).subscribe({
        next: () => {
          Swal.fire('Aprobada', 'Prórroga aprobada correctamente.', 'success');
          this.cargarProrrogas();
        },
        error: () => {
          Swal.fire('Error', 'Error al aprobar la prórroga.', 'error');
        }
      });
    }
  }

  async rechazarProrroga(prorroga: Prorroga) {
    const result = await Swal.fire({
      title: '¿Confirmar rechazo?',
      text: `¿Desea rechazar la prórroga #${prorroga.pro_id}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      const updateData: Partial<Prorroga> = {
        pro_estado: 'Rechazada',
        pro_fecha_aprobacion: undefined,
        pro_dias_concedidos: 0
      };
      this.prorrogaService.updateEstadoProrroga(prorroga.pro_id!, updateData).subscribe({
        next: () => {
          Swal.fire('Rechazada', 'Prórroga rechazada correctamente.', 'success');
          this.cargarProrrogas();
        },
        error: () => {
          Swal.fire('Error', 'Error al rechazar la prórroga.', 'error');
        }
      });
    }
  }

  puedeMostrarAcciones(prorroga: Prorroga): boolean {
    return prorroga.pro_estado === 'Pendiente';
  }
}
