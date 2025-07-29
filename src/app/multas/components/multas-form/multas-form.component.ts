import { Component } from '@angular/core';
import { Multa, MultasService } from '../../services/multas.service';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Socio, SocioService } from '../../../socios/services/socio.service';
import Swal from 'sweetalert2';
import { Aporte, AporteService } from '../../../aportes/services/aporte.service';

@Component({
  selector: 'app-multas-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './multas-form.component.html',
  styleUrl: './multas-form.component.css'
})
export class MultasFormComponent {
  multa: Multa = {
    mul_soc_id: 0,
    mul_motivo: '',
    mul_monto: 0,
    mul_fecha: formatDate(new Date(), 'yyyy-MM-dd', 'en')
  };

  socios: Socio[] = [];
  cedula = '';
  socioSeleccionado?: Socio;
  mensaje = '';
  error = '';
  ultimoAporte = 0;


  porcentajeSeleccionado = 5; // variable local para porcentaje

  constructor(
    private multasService: MultasService,
    private socioService: SocioService,
    private aporteService: AporteService
  ) { }

  ngOnInit(): void {
    this.socioService.getSocios().subscribe({
      next: socios => this.socios = socios,
      error: () => this.error = 'Error al cargar socios.'
    });
  }
  onSeleccionarSocio(id: number) {
    const socio = this.socios.find(s => s.soc_id === +id);
    if (socio) {
      this.socioSeleccionado = socio;
      this.multa.mul_soc_id = socio.soc_id;
      this.cedula = socio.soc_cedula;
      this.cargarUltimoAporte(socio.soc_id);
    } else {
      this.limpiarDatosSocio();
    }
  }

  buscarPorCedula() {
    const socio = this.socios.find(s => s.soc_cedula === this.cedula);
    if (socio) {
      this.socioSeleccionado = socio;
      this.multa.mul_soc_id = socio.soc_id;
      this.cargarUltimoAporte(socio.soc_id);
    } else {
      this.error = 'No se encontró un socio con esa cédula.';
      this.limpiarDatosSocio();
    }
  }

  cargarUltimoAporte(idSocio: number) {
    this.aporteService.obtenerAportesPorSocio(idSocio).subscribe({
      next: (aportes: Aporte[]) => {
        const aportesPositivos = aportes.filter(a => a.apo_monto > 0)
          .sort((a, b) => b.apo_fecha.localeCompare(a.apo_fecha));
          console.log(aportesPositivos);
        if (aportesPositivos.length > 0) {
          this.ultimoAporte = aportesPositivos[0].apo_monto;
          this.calcularMonto();
        } else {
          this.ultimoAporte = 0;
          this.multa.mul_monto = 0;
        }
      },
      error: () => {
        this.error = 'No se pudo obtener el último aporte del socio.';
        this.ultimoAporte = 0;
        this.multa.mul_monto = 0;
      }
    });
  }

  calcularMonto() {
    if (this.ultimoAporte > 0 && this.porcentajeSeleccionado) {
      this.multa.mul_monto = (this.ultimoAporte * this.porcentajeSeleccionado) / 100;
    } else {
      this.multa.mul_monto = 0;
    }
  }

  onCambiarPorcentaje(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.porcentajeSeleccionado = Number(selectElement.value);
    this.calcularMonto();
  }

  crearMulta() {
    this.error = '';
    this.mensaje = '';

    if (!this.multa.mul_soc_id || !this.multa.mul_motivo || !this.multa.mul_fecha) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Todos los campos obligatorios deben estar completos.',
        confirmButtonColor: '#004481'
      });
      return;
    }

    this.multasService.crearMulta(this.multa).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Multa registrada correctamente.',
          confirmButtonColor: '#004481'
        });
        this.limpiarFormulario();
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al registrar la multa.',
          confirmButtonColor: '#d32f2f'
        });
      }
    });
  }

  limpiarFormulario() {
    this.multa = {
      mul_soc_id: 0,
      mul_motivo: '',
      mul_monto: 0,
      mul_fecha: formatDate(new Date(), 'yyyy-MM-dd', 'en')
    };
    this.porcentajeSeleccionado = 5;
    this.cedula = '';
    this.socioSeleccionado = undefined;
    this.ultimoAporte = 0;
    this.mensaje = '';
    this.error = '';
  }

  limpiarDatosSocio() {
    this.socioSeleccionado = undefined;
    this.multa.mul_soc_id = 0;
    this.cedula = '';
    this.ultimoAporte = 0;
    this.multa.mul_monto = 0;
  }
}
