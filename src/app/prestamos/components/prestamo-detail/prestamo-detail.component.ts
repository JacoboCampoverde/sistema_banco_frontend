import { Component, Input } from '@angular/core';
import { Credito, PrestamoService } from '../../services/prestamo.service';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AmortizacionFila {
  numeroCuota: any;
  fechaPago: any;
  cuota: any;
  interes: any;
  capital: any;
  saldo: any;
  [key: string]: any;  // <-- esto permite indexación dinámica
}

@Component({
  selector: 'app-prestamo-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prestamo-detail.component.html',
  styleUrl: './prestamo-detail.component.css'
})
export class PrestamoDetailComponent {
  prestamo?: Credito;
  errorMsg = '';

  // Opción 1: recibir id como Input (si lo usas dentro de otro componente)
  @Input() idPrestamo?: number;

  amortizacion: any[] = [];
  mostrarTabla = false;

  constructor(
    private prestamoService: PrestamoService,
    private route: ActivatedRoute,
    private location: Location
  ) { }

  ngOnInit(): void {
    if (this.idPrestamo) {
      this.cargarPrestamo(this.idPrestamo);
    } else {
      // Opción 2: Obtener id desde la URL (si usas routing)
      this.route.paramMap.pipe(
        switchMap(params => {
          const id = params.get('id');
          if (!id) throw new Error('No se encontró id del préstamo');
          return this.prestamoService.obtenerCreditoPorId(+id);
        })
      ).subscribe({
        next: prestamo => this.prestamo = prestamo,
        error: () => this.errorMsg = 'Error al cargar detalle del préstamo.'
      });
    }
  }

  cargarPrestamo(id: number) {
    this.prestamoService.obtenerCreditoPorId(id).subscribe({
      next: prestamo => this.prestamo = prestamo,
      error: () => this.errorMsg = 'Error al cargar detalle del préstamo.'
    });
  }

  verTablaAmortizacion(): void {
    if (!this.prestamo) return;

    // 👉 Función para parsear diferentes formatos de fecha
    function parseFechaAprobacion(fecha: any): Date {
      if (!fecha) return new Date();
      if (fecha instanceof Date) return fecha;

      if (typeof fecha === 'string') {
        const parts = fecha.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts.map(Number);
          return new Date(year, month - 1, day);
        }
        return new Date(fecha);
      }

      if (typeof fecha === 'number') return new Date(fecha);

      if (fecha.seconds !== undefined && fecha.nanoseconds !== undefined) {
        return new Date(fecha.seconds * 1000 + fecha.nanoseconds / 1000000);
      }

      return new Date(fecha);
    }

    // 👉 Función para sumar meses a una fecha con ajuste de día
    function sumarMeses(fecha: Date, meses: number): Date {
      const año = fecha.getFullYear();
      const mes = fecha.getMonth();
      const día = fecha.getDate();

      const nuevoMesTotal = mes + meses;
      const nuevoAño = año + Math.floor(nuevoMesTotal / 12);
      const nuevoMes = nuevoMesTotal % 12;

      const fechaResultado = new Date(nuevoAño, nuevoMes, 1);
      const maxDiaMes = new Date(nuevoAño, nuevoMes + 1, 0).getDate();
      fechaResultado.setDate(Math.min(día, maxDiaMes));

      return fechaResultado;
    }

    const monto = this.prestamo.cre_monto_aprobado ?? 0;
    const interesAnual = this.prestamo.cre_tasa_interes ? this.prestamo.cre_tasa_interes / 100 : 0;
    const plazoMeses = this.prestamo.cre_plazo_meses || 12;
    const formaPago = this.prestamo.cre_forma_pago?.toLowerCase() || 'mensual';
    const mesesGracia = Math.max(0, Math.min(this.prestamo.cre_meses_gracia ?? 0, 12));
    const fechaInicio = parseFechaAprobacion(this.prestamo.cre_fecha_aprobacion);

    let cuotas = 0;
    let interesPorPeriodo = 0;

    switch (formaPago) {
      case 'mensual':
        cuotas = plazoMeses;
        interesPorPeriodo = interesAnual / 12;
        break;
      case 'bimestral':
        cuotas = Math.ceil(plazoMeses / 2);
        interesPorPeriodo = interesAnual / 6;
        break;
      default:
        cuotas = plazoMeses;
        interesPorPeriodo = interesAnual / 12;
    }

    const cuotaFija = monto * interesPorPeriodo / (1 - Math.pow(1 + interesPorPeriodo, -cuotas));

    this.amortizacion = [];
    let saldo = monto;

    const incrementoMeses = formaPago === 'bimestral' ? 2 : 1;
    const fechaBase = sumarMeses(fechaInicio, incrementoMeses + mesesGracia);

    for (let i = 1; i <= cuotas; i++) {
      const fechaCuota = sumarMeses(fechaBase, incrementoMeses * (i - 1));
      const interes = saldo * interesPorPeriodo;
      const capital = cuotaFija - interes;
      saldo -= capital;

      this.amortizacion.push({
        numeroCuota: i,
        fechaPago: fechaCuota.toISOString().split('T')[0],
        cuota: cuotaFija.toFixed(2),
        interes: interes.toFixed(2),
        capital: capital.toFixed(2),
        saldo: saldo < 0 ? '0.00' : saldo.toFixed(2)
      });
    }

    this.mostrarTabla = true;
  }

  abrirModal() {
    this.mostrarTabla = true;
    this.verTablaAmortizacion();
  }

  cerrarModal() {
    this.mostrarTabla = false;
  }

  goBack() {
    this.location.back();
  }

  descargarTablaAmortizacionPDF(): void {
    if (!this.amortizacion || this.amortizacion.length === 0 || !this.prestamo) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Encabezado ---
    doc.setFontSize(20);
    doc.setTextColor('#2e3a59');
    doc.setFont('helvetica', 'bold');
    doc.text('Tabla de Amortización', pageWidth / 2, 20, { align: 'center' });

    // Línea horizontal decorativa
    doc.setDrawColor('#2e3a59');
    doc.setLineWidth(0.8);
    doc.line(15, 24, pageWidth - 15, 24);

    // --- Datos generales ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#1e293b');

    const prestamoInfo = [
      ['Monto aprobado:', `$${this.prestamo.cre_monto_aprobado ?? ''}`],
      ['Tasa de interés anual (%):', `${this.prestamo.cre_tasa_interes ?? ''}`],
      ['Plazo (meses):', `${this.prestamo.cre_plazo_meses ?? ''}`],
      ['Forma de pago:', `${this.prestamo.cre_forma_pago ?? ''}`],
      ['Meses de gracia:', `${this.prestamo.cre_meses_gracia ?? 0}`],
      ['Fecha de aprobación:', `${this.prestamo.cre_fecha_aprobacion ?? ''}`],
    ];

    let startY = 32;
    const labelX = 20;
    const valueX = 90;
    const lineHeight = 8;

    prestamoInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, labelX, startY);
      doc.setFont('helvetica', 'normal');
      doc.text(value.toString(), valueX, startY);
      startY += lineHeight;
    });

    // --- Tabla de amortización ---
    const headers = [
      { header: 'N° Cuota', dataKey: 'numeroCuota' },
      { header: 'Fecha de Pago', dataKey: 'fechaPago' },
      { header: 'Cuota ($)', dataKey: 'cuota' },
      { header: 'Interés ($)', dataKey: 'interes' },
      { header: 'Capital ($)', dataKey: 'capital' },
      { header: 'Saldo ($)', dataKey: 'saldo' },
    ];

    const body: AmortizacionFila[] = this.amortizacion.map(fila => ({
      numeroCuota: fila.numeroCuota,
      fechaPago: fila.fechaPago,
      cuota: fila.cuota,
      interes: fila.interes,
      capital: fila.capital,
      saldo: fila.saldo,
    }));


    autoTable(doc, {
      startY: startY + 6,
      head: [headers.map(h => h.header)],
      body: body.map(row => headers.map(h => row[h.dataKey])),
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 4,
        halign: 'right',
      },
      headStyles: {
        fillColor: '#2e3a59',
        textColor: '#ffffff',
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: '#f2f4f7',
      },
      columnStyles: {
        1: { halign: 'center' }, // Fecha centrada
        0: { halign: 'center' }, // Número centrado
      },
      margin: { left: 15, right: 15 },
      tableLineWidth: 0.5,
      tableLineColor: '#cccccc',
    });

    // --- Pie de página con fecha y número de página ---
    const pageCount = doc.getNumberOfPages();
    const today = new Date().toLocaleDateString();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor('#666666');
      doc.text(`Fecha de generación: ${today}`, 15, 290);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 40, 290);
    }

    // Guardar PDF
    doc.save(`amortizacion_prestamo_${this.prestamo.cre_id ?? 'desconocido'}.pdf`);
  }


}
