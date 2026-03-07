import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActionSheetController, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, IonBackButton, IonFooter } from '@ionic/angular/standalone';
import { RutinaProgresoHeaderComponent } from './components/rutina-progreso-header/rutina-progreso-header.component';
import { RutinaEjercicioItemComponent } from './components/rutina-ejercicio-item/rutina-ejercicio-item.component';
import { RutinaOverlayComponent } from './components/rutina-overlay/rutina-overlay.component';
import { RutinaEjercicioDetalleModalComponent } from './components/rutina-ejercicio-detalle-modal/rutina-ejercicio-detalle-modal.component';
import { addIcons } from 'ionicons';
import { arrowBackOutline, timerOutline, playOutline, checkmarkCircleOutline, closeCircleOutline, refreshOutline, fitnessOutline, timeOutline, flameOutline, calendarOutline, checkmarkCircle, close, pauseCircleOutline, repeatOutline, warningOutline, ellipseOutline, chevronForwardOutline, informationCircleOutline, barbellOutline, play, pause } from 'ionicons/icons';
import { Ejercicio, SesionRutinaStatus } from 'gym-library';
import { RutinaService } from '../../core/services/rutina.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
import { AuthService } from '../../core/services/auth.service';
import { SesionRutinaService } from '../../core/services/sesion-rutina.service';
import { StopwatchService } from '../../core/services/stopwatch.service';

@Component({
  selector: 'app-rutina-progreso', standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, IonBackButton, IonFooter, RutinaProgresoHeaderComponent, RutinaEjercicioItemComponent, RutinaOverlayComponent, RutinaEjercicioDetalleModalComponent],
  templateUrl: './rutina-progreso.page.html',
  styles: [`@keyframes bounceIn { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } } .animate-bounce-in { animation: bounceIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }`]
})
export class RutinaProgresoPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute); private readonly router = inject(Router);
  private readonly rutinaService = inject(RutinaService); private readonly ejercicioService = inject(EjercicioService);
  private readonly authService = inject(AuthService); private readonly sesionRutinaService = inject(SesionRutinaService);
  protected readonly stopwatch = inject(StopwatchService);

  rutinaId = signal<string>(''); isLoading = signal(false); rutinaLocalIniciada = signal(false);
  ejerciciosCompletadosLocal = signal<string[]>([]); isCompleting = signal(false);
  ejercicioSeleccionado = signal<Ejercicio | null>(null); isModalOpen = signal(false);

  rutina = computed(() => this.rutinaService.rutinas().find(r => r.id === this.rutinaId()) || null);
  ejercicios = computed(() => (this.rutina()?.ejerciciosIds || []).map(id => this.ejercicioService.ejercicios().find(e => e.id === id)).filter((e): e is Ejercicio => !!e));
  progreso = computed(() => {
    const u = this.authService.currentUser(); const id = this.rutinaId(); if (!u || !id) return null;
    return this.sesionRutinaService.getSesionesPorEntrenado(u.uid)().filter(s => s.rutinaResumen?.id === id && s.status === SesionRutinaStatus.EN_PROGRESO).sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())[0] || null;
  });
  yaRealizadaHoy = computed(() => {
    const u = this.authService.currentUser(); const id = this.rutinaId(); if (!u || !id) return false;
    const hoy = new Date().setHours(0, 0, 0, 0);
    return this.sesionRutinaService.getSesionesPorEntrenado(u.uid)().some(s => s.rutinaResumen?.id === id && s.completada && new Date(s.fechaInicio).setHours(0, 0, 0, 0) === hoy);
  });

  rutinaIniciada = computed(() => this.rutinaLocalIniciada() || !!this.progreso()?.fechaInicio);
  rutinaCompletada = computed(() => !!this.progreso()?.completada);
  ejerciciosTotales = computed(() => this.ejercicios().length);
  ejerciciosCompletados = computed(() => this.ejerciciosCompletadosLocal().length);
  porcentajeProgreso = computed(() => this.ejerciciosTotales() > 0 ? Math.round((this.ejerciciosCompletados() / this.ejerciciosTotales()) * 100) : 0);
  mostrarCronometro = computed(() => this.stopwatch.isActive() || (this.rutinaIniciada() && !this.rutinaCompletada()));
  estado = computed(() => this.rutinaCompletada() ? 'Completada' : (this.stopwatch.isPaused() ? 'Pausada' : (this.rutinaIniciada() ? 'En progreso' : 'No iniciada')));
  colorEstado = computed(() => { const m: any = { 'Completada': 'success', 'Pausada': 'warning', 'En progreso': 'primary' }; return m[this.estado()] || 'medium'; });

  constructor() { addIcons({ arrowBackOutline, timerOutline, playOutline, checkmarkCircleOutline, closeCircleOutline, refreshOutline, fitnessOutline, timeOutline, flameOutline, calendarOutline, checkmarkCircle, close, pauseCircleOutline, repeatOutline, warningOutline, ellipseOutline, chevronForwardOutline, informationCircleOutline, barbellOutline, play, pause }); }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('rutinaId');
    if (id) { this.rutinaId.set(id); this.initLocal(); if (this.progreso()?.fechaInicio && !this.progreso()?.completada) this.stopwatch.start(); }
    else this.goBack();
  }
  ngOnDestroy() { this.stopwatch.stop(); }

  private async initLocal() {
    for (let i = 0; i < 20; i++) {
      if (this.progreso()) { if (this.progreso()?.fechaInicio && !this.progreso()?.completada) this.rutinaLocalIniciada.set(true); break; }
      await new Promise(r => setTimeout(r, 100));
    }
  }

  async iniciarRutina() {
    const u = this.authService.currentUser(); if (!u || !this.rutinaId()) return;
    try {
      this.isLoading.set(true); const s = await this.sesionRutinaService.inicializarSesionRutina(u.uid, this.rutinaId());
      await this.sesionRutinaService.crearSesion(s); this.rutinaLocalIniciada.set(true); this.stopwatch.reset(); this.stopwatch.start();
    } catch (e) { console.error(e); } finally { this.isLoading.set(false); }
  }

  pausarReanudar() { this.stopwatch.isPaused() ? this.stopwatch.resume() : this.stopwatch.pause(); }

  async completarRutina() {
    if (!this.rutinaIniciada() || this.ejerciciosCompletados() < this.ejerciciosTotales()) return;
    this.isCompleting.set(true); const s = this.progreso();
    if (s) { try { await this.sesionRutinaService.actualizarSesion({ ...s, completada: true, status: SesionRutinaStatus.COMPLETADA, fechaFin: new Date(), duracion: this.stopwatch.seconds(), porcentajeCompletado: 100 }); } catch (e) { console.error(e); } }
    this.stopwatch.reset(); this.rutinaLocalIniciada.set(false); this.ejerciciosCompletadosLocal.set([]); this.goBack(); this.isCompleting.set(false);
  }

  reiniciarRutina() { this.stopwatch.reset(); this.rutinaLocalIniciada.set(false); this.ejerciciosCompletadosLocal.set([]); }
  abrirModalFicha(e: Ejercicio) { this.ejercicioSeleccionado.set(e); this.isModalOpen.set(true); }
  cerrarModalFicha() { this.isModalOpen.set(false); setTimeout(() => this.ejercicioSeleccionado.set(null), 300); }

  async toggleEjercicio(id: string) {
    if (!this.rutinaIniciada()) return;
    const cur = this.ejerciciosCompletadosLocal(); const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    this.ejerciciosCompletadosLocal.set(next); const s = this.progreso();
    if (s) try { await this.sesionRutinaService.actualizarSesion({ ...s, porcentajeCompletado: Math.round((next.length / this.ejerciciosTotales()) * 100) }); } catch (e) { console.error(e); }
  }

  isEjercicioCompletado(id: string) { return this.ejerciciosCompletadosLocal().includes(id); }
  goBack() { (document.activeElement as HTMLElement)?.blur(); this.router.navigate(['/entrenado-tabs/rutinas']); }
}
