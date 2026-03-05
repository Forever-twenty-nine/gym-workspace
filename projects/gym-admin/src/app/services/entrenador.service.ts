import { Injectable, signal, computed, inject, Injector, runInInjectionContext, Signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { Entrenador } from 'gym-library';
import { RutinaService } from './rutina.service';
import { EjercicioService } from './ejercicio.service';
import { EntrenadoService } from './entrenado.service';
import { UserService } from './user.service';
import { NotificacionService } from './notificacion.service';
import { MensajeService } from './mensaje.service';
import { InvitacionService } from './invitacion.service';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from './firebase.tokens';

// Clase de error personalizada para límites
export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanLimitError';
  }
}

/**
 * 🏋️‍♂️ Servicio de gestión de Entrenadores
 * Maneja la lógica de negocio y el estado de los entrenadores usando signals de Angular
 */
@Injectable({
  providedIn: 'root'
})
export class EntrenadorService {
  private readonly firestore = inject(FIRESTORE);
  private readonly injector = inject(Injector);
  private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
  private readonly collectionName = 'entrenadores';

  private rutinaService = inject(RutinaService);
  private ejercicioService = inject(EjercicioService);
  private entrenadoService = inject(EntrenadoService);
  private userService = inject(UserService);
  private notificacionService = inject(NotificacionService);
  private mensajeService = inject(MensajeService);
  private invitacionService = inject(InvitacionService);

  // 📊 Signals para el estado de los entrenadores
  private readonly _entrenadores = signal<Entrenador[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  /**
   * 📊 Signal readonly con todos los entrenadores
   */
  get entrenadoresSignal(): Signal<Entrenador[]> {
    if (!this.isListenerInitialized) {
      this.initializeListener();
    }
    return this._entrenadores.asReadonly();
  }

  // Alias para mantener compatibilidad con código existente
  get entrenadores(): Signal<Entrenador[]> {
    return this.entrenadoresSignal;
  }

  readonly loadingSignal = this._loading.asReadonly();
  readonly errorSignal = this._error.asReadonly();

  private unsubscribe: (() => void) | null = null;
  private isListenerInitialized = false;

  // Cache para límites por entrenador (evita búsquedas repetidas)
  private limitsCache = new Map<string, { maxClients: number; maxRoutines: number; maxExercises: number }>();

  constructor() { }

  /**
   * Ejecuta el callback en el contexto correcto (zona o inyección)
   */
  private runInZone<T>(callback: () => T | Promise<T>): T | Promise<T> {
    if (this.zoneRunner) {
      return this.zoneRunner.run(callback);
    }
    return runInInjectionContext(this.injector, callback as any);
  }

  // Métodos para límites de plan
  getLimits(entrenadorId: string) {
    if (this.limitsCache.has(entrenadorId)) {
      return this.limitsCache.get(entrenadorId)!;
    }
    const user = this.userService.users().find(u => u.uid === entrenadorId);
    const isFree = user?.plan === 'free';
    const limits = {
      maxClients: isFree ? 3 : Infinity,
      maxRoutines: isFree ? 3 : Infinity,
      maxExercises: isFree ? 10 : Infinity,
    };
    this.limitsCache.set(entrenadorId, limits);
    return limits;
  }

  private validateLimit(entrenadorId: string, currentCount: number, max: number, item: string): void {
    if (currentCount >= max) {
      throw new PlanLimitError(`Límite alcanzado: ${currentCount}/${max} ${item} en plan free.`);
    }
  }

  private async addItemWithLimit(
    entrenadorId: string,
    itemId: string,
    arrayKey: keyof Entrenador,
    maxKey: keyof ReturnType<typeof this.getLimits>,
    itemName: string
  ): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (!entrenador) return;

    const limits = this.getLimits(entrenadorId);
    const currentArray = (entrenador[arrayKey] as string[]) || [];
    this.validateLimit(entrenadorId, currentArray.length, limits[maxKey], itemName);

    if (!currentArray.includes(itemId)) {
      const updatedArray = [...currentArray, itemId];
      await this.update(entrenadorId, { [arrayKey]: updatedArray });
    }
  }

  invalidateLimitsCache(entrenadorId: string): void {
    this.limitsCache.delete(entrenadorId);
  }

  /**
   * Inicializa el listener de entrenadores (llamar manualmente cuando sea necesario)
   */
  initializeListener(): void {
    if (!this.isListenerInitialized) {
      this.loadEntrenadores();
      this.isListenerInitialized = true;
    }
  }

  /**
   * Carga inicial de entrenadores con listener en tiempo real
   */
  private loadEntrenadores(): void {
    this._loading.set(true);
    this._error.set(null);

    try {
      const entrenadoresCollection = collection(this.firestore, this.collectionName);
      const entrenadoresQuery = query(entrenadoresCollection, orderBy('fechaRegistro', 'desc'));

      this.unsubscribe = onSnapshot(
        entrenadoresQuery,
        (snapshot) => {
          this.runInZone(() => {
            const entrenadores: Entrenador[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              const entrenador: Entrenador = {
                id: doc.id,
                fechaRegistro: data['fechaRegistro']?.toDate?.() || data['fechaRegistro'] || new Date(),
                ejerciciosCreadasIds: data['ejerciciosCreadasIds'] || [],
                entrenadosAsignadosIds: data['entrenadosAsignadosIds'] || [],
                rutinasCreadasIds: data['rutinasCreadasIds'] || []
              };
              entrenadores.push(entrenador);
            });
            this._entrenadores.set(entrenadores);
            this._loading.set(false);
          });
        },
        (error) => {
          this.runInZone(() => {
            console.error('❌ EntrenadorService: Error al obtener entrenadores:', error);
            this._error.set('Error al cargar entrenadores');
            this._loading.set(false);
          });
        }
      );
    } catch (error) {
      console.error('❌ Error al cargar entrenadores:', error);
      this._error.set('Error al cargar entrenadores');
      this._loading.set(false);
    }
  }

  /**
   * Crea un nuevo entrenador
   */
  async create(entrenadorData: Omit<Entrenador, 'id'>): Promise<string> {
    this._loading.set(true);
    this._error.set(null);

    try {
      return await this.runInZone(async () => {
        const entrenadoresCollection = collection(this.firestore, this.collectionName);
        const docRef = await addDoc(entrenadoresCollection, {
          fechaRegistro: entrenadorData.fechaRegistro ? Timestamp.fromDate(entrenadorData.fechaRegistro) : Timestamp.now(),
          ejerciciosCreadasIds: entrenadorData.ejerciciosCreadasIds || [],
          entrenadosAsignadosIds: entrenadorData.entrenadosAsignadosIds || [],
          rutinasCreadasIds: entrenadorData.rutinasCreadasIds || []
        });
        return docRef.id;
      }) as string;
    } catch (error) {
      console.error('❌ Error al crear entrenador:', error);
      this._error.set('Error al crear entrenador');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Crea un nuevo entrenador con ID específico
   */
  async createWithId(id: string, entrenadorData: Omit<Entrenador, 'id'>): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.runInZone(async () => {
        const entrenadorDoc = doc(this.firestore, this.collectionName, id);
        await setDoc(entrenadorDoc, {
          fechaRegistro: entrenadorData.fechaRegistro ? Timestamp.fromDate(entrenadorData.fechaRegistro) : Timestamp.now(),
          ejerciciosCreadasIds: entrenadorData.ejerciciosCreadasIds || [],
          entrenadosAsignadosIds: entrenadorData.entrenadosAsignadosIds || [],
          rutinasCreadasIds: entrenadorData.rutinasCreadasIds || []
        });
      });
    } catch (error) {
      this._error.set('Error al crear entrenador');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Actualiza un entrenador existente
   */
  async update(id: string, entrenadorData: Partial<Entrenador>): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.runInZone(async () => {
        const entrenadorDoc = doc(this.firestore, this.collectionName, id);
        const data: any = { ...entrenadorData };
        if (entrenadorData.fechaRegistro) {
          data.fechaRegistro = Timestamp.fromDate(entrenadorData.fechaRegistro);
        }
        await updateDoc(entrenadorDoc, data);
      });
    } catch (error) {
      console.error('❌ Error al actualizar entrenador:', error);
      this._error.set('Error al actualizar entrenador');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Elimina un entrenador
   */
  async delete(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.runInZone(async () => {
        const entrenadorDoc = doc(this.firestore, this.collectionName, id);
        await deleteDoc(entrenadorDoc);
      });
      console.log('✅ Entrenador eliminado:', id);
    } catch (error) {
      console.error('❌ Error al eliminar entrenador:', error);
      this._error.set('Error al eliminar entrenador');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Busca un entrenador por ID
   */
  getEntrenadorById(id: string) {
    return computed(() =>
      this._entrenadores().find(entrenador => entrenador.id === id)
    );
  }

  /**
   * Obtiene las rutinas de un entrenador específico
   */
  getRutinasByEntrenador(entrenadorId: string) {
    return computed(() => {
      const entrenador = this._entrenadores().find(e => e.id === entrenadorId);
      if (!entrenador || !entrenador.rutinasCreadasIds) {
        return [];
      }
      return this.rutinaService.rutinas().filter(rutina =>
        entrenador.rutinasCreadasIds.includes(rutina.id)
      );
    });
  }

  /**
   * Obtiene los ejercicios de un entrenador específico
   */
  getEjerciciosByEntrenador(entrenadorId: string) {
    return computed(() => {
      const entrenador = this._entrenadores().find(e => e.id === entrenadorId);
      if (!entrenador || !entrenador.ejerciciosCreadasIds) {
        return [];
      }
      return this.ejercicioService.ejercicios().filter(ejercicio =>
        entrenador.ejerciciosCreadasIds.includes(ejercicio.id)
      );
    });
  }

  /**
   * Obtiene las invitaciones de un entrenador específico
   */
  getInvitacionesByEntrenador(entrenadorId: string) {
    return this.invitacionService.getInvitacionesPorEntrenador(entrenadorId);
  }

  /**
   * Obtiene los mensajes de un entrenador específico
   */
  getMensajesByEntrenador(entrenadorId: string) {
    return this.mensajeService.getMensajesByEntrenador(entrenadorId);
  }

  /**
   * Obtiene el conteo de entrenados asignados a un entrenador
   */
  getEntrenadosCount(entrenadorId: string) {
    return computed(() => {
      const entrenador = this.getEntrenadorById(entrenadorId)();
      return entrenador?.entrenadosAsignadosIds?.length || 0;
    });
  }

  /**
   * Desvincula un entrenado de un entrenador
   */
  async desvincularEntrenado(entrenadorId: string, entrenadoId: string): Promise<void> {
    const entrenado = this.entrenadoService.getEntrenadoById(entrenadoId)();
    if (entrenado) {
      const entrenadoresId = (entrenado.entrenadoresId || []).filter((id: string) => id !== entrenadorId);
      await this.entrenadoService.save({ ...entrenado, entrenadoresId });
    }

    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (entrenador) {
      const entrenadosAsignadosIds = (entrenador.entrenadosAsignadosIds || []).filter((id: string) => id !== entrenadoId);
      await this.update(entrenadorId, { entrenadosAsignadosIds });
    }
  }

  /**
   * Obtiene los entrenadores con información de usuario combinada
   */
  getEntrenadoresWithUserInfo() {
    return computed(() => {
      return this._entrenadores().map(entrenador => {
        const usuario = this.userService.users().find(u => u.uid === entrenador.id);
        return {
          ...entrenador,
          displayName: usuario?.nombre || usuario?.email || `Usuario ${entrenador.id}`,
          email: usuario?.email || '',
          plan: usuario?.plan || 'free'
        };
      });
    });
  }

  /**
   * ➕ Agrega un ejercicio a la lista de ejercicios creados de un entrenador
   */
  async addEjercicioCreado(entrenadorId: string, ejercicioId: string): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (!entrenador) return;

    // Validación de plan: free no puede crear ejercicios con campos premium
    const limits = this.getLimits(entrenadorId);
    if (limits.maxExercises === 3) { // Plan free
      const ejercicio = this.ejercicioService.getEjercicio(ejercicioId)();
      if (ejercicio && (ejercicio.descansoSegundos !== undefined || ejercicio.serieSegundos !== undefined)) {
        throw new PlanLimitError('En el plan free no se pueden configurar tiempos de descanso o serie. Actualiza a premium.');
      }
    }

    const limitsGeneral = this.getLimits(entrenadorId);
    const currentCount = entrenador.ejerciciosCreadasIds?.length || 0;
    this.validateLimit(entrenadorId, currentCount, limitsGeneral.maxExercises, 'ejercicios');

    const ejerciciosCreadasIds = [...(entrenador.ejerciciosCreadasIds || [])];
    if (!ejerciciosCreadasIds.includes(ejercicioId)) {
      ejerciciosCreadasIds.push(ejercicioId);
      await this.update(entrenadorId, { ejerciciosCreadasIds });
    }
  }

  /**
   * ➖ Quita un ejercicio de la lista de ejercicios creados de un entrenador
   */
  async removeEjercicioCreado(entrenadorId: string, ejercicioId: string): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (entrenador) {
      const ejerciciosCreadasIds = (entrenador.ejerciciosCreadasIds || []).filter((id: string) => id !== ejercicioId);
      await this.update(entrenadorId, { ejerciciosCreadasIds });
    }
  }

  /**
   * Elimina un ejercicio creado por un entrenador y actualiza su lista
   */
  async deleteEjercicioCreado(entrenadorId: string, ejercicioId: string): Promise<void> {
    await this.ejercicioService.delete(ejercicioId);
    await this.removeEjercicioCreado(entrenadorId, ejercicioId);
  }

  /**
   * Agrega una rutina a la lista de rutinas creadas de un entrenador
   */
  async addRutinaCreada(entrenadorId: string, rutinaId: string): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (!entrenador) return;

    // Validación de plan: free no puede crear rutinas con campos premium
    const limits = this.getLimits(entrenadorId);
    if (limits.maxRoutines === 5) { // Plan free
      const rutina = this.rutinaService.getRutina(rutinaId)();
      if (rutina && rutina.duracion !== undefined) {
        throw new PlanLimitError('En el plan free no se pueden configurar duración. Actualiza a premium.');
      }
    }

    await this.addItemWithLimit(entrenadorId, rutinaId, 'rutinasCreadasIds', 'maxRoutines', 'rutinas');
  }

  /**
   * ➖ Quita una rutina de la lista de rutinas creadas de un entrenador
   */
  async removeRutinaCreada(entrenadorId: string, rutinaId: string): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (entrenador) {
      const rutinasCreadasIds = (entrenador.rutinasCreadasIds || []).filter((id: string) => id !== rutinaId);
      await this.update(entrenadorId, { rutinasCreadasIds });
    }
  }

  /**
   * ➕ Asigna un entrenado a un entrenador con validación de límites
   */
  async asignarEntrenado(entrenadorId: string, entrenadoId: string): Promise<void> {
    await this.addItemWithLimit(entrenadorId, entrenadoId, 'entrenadosAsignadosIds', 'maxClients', 'clientes activos');

    // Actualizar entrenado (solo después de validar límite)
    const entrenado = this.entrenadoService.getEntrenadoById(entrenadoId)();
    if (entrenado) {
      const entrenadoresId = [...(entrenado.entrenadoresId || []), entrenadorId];
      await this.entrenadoService.save({ ...entrenado, entrenadoresId });
    }
  }
}
