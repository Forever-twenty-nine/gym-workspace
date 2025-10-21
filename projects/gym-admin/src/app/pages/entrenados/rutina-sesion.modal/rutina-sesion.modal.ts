import { Component, ChangeDetectionStrategy, inject, signal, Input, Output, EventEmitter, OnInit, OnDestroy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SesionRutinaService } from 'gym-library';
import { SesionRutina } from 'gym-library';

@Component({
  selector: 'app-rutina-sesion-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rutina-sesion.modal.html',
  changeDetection: ChangeDetectionStrategy.Default
})
export class RutinaSesionModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) rutinaId!: string;
  @Input({ required: true }) entrenadoId!: string;
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  
  private readonly sesionRutinaService = inject(SesionRutinaService);
  
  // Obtener todas las sesiones de la rutina
  private readonly sesionesRutina = this.sesionRutinaService.getSesionesPorRutina(this.rutinaId);
  
  // Filtrar sesiones por entrenado
  readonly sesiones = computed(() => 
    this.sesionesRutina().filter(s => s.entrenadoId === this.entrenadoId)
  );

  ngOnInit() {
    // El servicio maneja automáticamente la suscripción
  }

  ngOnDestroy() {
    // No hay unsubscribe manual necesario con signals
  }

  closeModal() {
    this.openChange.emit(false);
  }
}
