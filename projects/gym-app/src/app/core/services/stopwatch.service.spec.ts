/**
 * Tests para StopwatchService
 * 
 * Usa vi.useFakeTimers() para controlar setInterval sin esperas reales.
 */
import { StopwatchService } from './stopwatch.service';

describe('StopwatchService', () => {
  let service: StopwatchService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new StopwatchService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ──────────────────────────────────────────────────────────────
  // Estado inicial
  // ──────────────────────────────────────────────────────────────
  describe('estado inicial', () => {
    it('seconds = 0', () => expect(service.seconds()).toBe(0));
    it('isActive = false', () => expect(service.isActive()).toBe(false));
    it('isPaused = false', () => expect(service.isPaused()).toBe(false));
    it('formattedTime = "00:00"', () => expect(service.formattedTime()).toBe('00:00'));
  });

  // ──────────────────────────────────────────────────────────────
  // start()
  // ──────────────────────────────────────────────────────────────
  describe('start()', () => {
    it('activa el cronómetro', () => {
      service.start();
      expect(service.isActive()).toBe(true);
    });

    it('no está pausado al iniciar', () => {
      service.start();
      expect(service.isPaused()).toBe(false);
    });

    it('incrementa segundos tras 1 segundo', () => {
      service.start();
      vi.advanceTimersByTime(1000);
      expect(service.seconds()).toBe(1);
    });

    it('incrementa segundos tras 3 segundos', () => {
      service.start();
      vi.advanceTimersByTime(3000);
      expect(service.seconds()).toBe(3);
    });

    it('ignora llamadas repetidas (idempotente)', () => {
      service.start();
      service.start();
      vi.advanceTimersByTime(1000);
      // Solo debe tener 1 segundo, no 2 (no se duplica el interval)
      expect(service.seconds()).toBe(1);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // pause()
  // ──────────────────────────────────────────────────────────────
  describe('pause()', () => {
    it('detiene el conteo sin resetear', () => {
      service.start();
      vi.advanceTimersByTime(3000);
      service.pause();
      vi.advanceTimersByTime(5000); // 5 segundos más no deberían contar
      expect(service.seconds()).toBe(3);
    });

    it('marca isPaused = true', () => {
      service.start();
      service.pause();
      expect(service.isPaused()).toBe(true);
    });

    it('no hace nada si el cronómetro no está activo', () => {
      service.pause(); // Sin haber llamado start()
      expect(service.isPaused()).toBe(false);
    });

    it('no hace nada si ya estaba pausado', () => {
      service.start();
      service.pause();
      service.pause(); // Segunda llamada
      expect(service.isPaused()).toBe(true);
      expect(service.seconds()).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // resume()
  // ──────────────────────────────────────────────────────────────
  describe('resume()', () => {
    it('reanuda el conteo después de pausa', () => {
      service.start();
      vi.advanceTimersByTime(2000);
      service.pause();
      service.resume();
      vi.advanceTimersByTime(3000);
      expect(service.seconds()).toBe(5);
    });

    it('marca isPaused = false', () => {
      service.start();
      service.pause();
      service.resume();
      expect(service.isPaused()).toBe(false);
    });

    it('no hace nada si no está activo', () => {
      service.resume(); // Sin start()
      vi.advanceTimersByTime(1000);
      expect(service.seconds()).toBe(0);
    });

    it('no hace nada si no está pausado', () => {
      service.start();
      service.resume(); // Sin pausa previa — no debe duplicar interval
      vi.advanceTimersByTime(1000);
      expect(service.seconds()).toBe(1);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // stop()
  // ──────────────────────────────────────────────────────────────
  describe('stop()', () => {
    it('devuelve los segundos transcurridos', () => {
      service.start();
      vi.advanceTimersByTime(5000);
      const total = service.stop();
      expect(total).toBe(5);
    });

    it('detiene el conteo', () => {
      service.start();
      vi.advanceTimersByTime(2000);
      service.stop();
      vi.advanceTimersByTime(3000);
      expect(service.seconds()).toBe(2); // Sigue en 2, no avanza
    });

    it('isActive = false después de stop()', () => {
      service.start();
      service.stop();
      expect(service.isActive()).toBe(false);
    });

    it('isPaused = false después de stop()', () => {
      service.start();
      service.pause();
      service.stop();
      expect(service.isPaused()).toBe(false);
    });

    it('devuelve 0 si nunca fue iniciado', () => {
      const total = service.stop();
      expect(total).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // reset()
  // ──────────────────────────────────────────────────────────────
  describe('reset()', () => {
    it('vuelve los segundos a 0', () => {
      service.start();
      vi.advanceTimersByTime(10000);
      service.reset();
      expect(service.seconds()).toBe(0);
    });

    it('isActive = false después de reset()', () => {
      service.start();
      service.reset();
      expect(service.isActive()).toBe(false);
    });

    it('no sigue contando después de reset()', () => {
      service.start();
      service.reset();
      vi.advanceTimersByTime(3000);
      expect(service.seconds()).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // formattedTime (computed)
  // ──────────────────────────────────────────────────────────────
  describe('formattedTime', () => {
    it('"00:00" en estado inicial', () => {
      expect(service.formattedTime()).toBe('00:00');
    });

    it('"00:05" después de 5 segundos', () => {
      service.start();
      vi.advanceTimersByTime(5000);
      expect(service.formattedTime()).toBe('00:05');
    });

    it('"01:00" después de 60 segundos', () => {
      service.start();
      vi.advanceTimersByTime(60000);
      expect(service.formattedTime()).toBe('01:00');
    });

    it('"01:30" después de 90 segundos', () => {
      service.start();
      vi.advanceTimersByTime(90000);
      expect(service.formattedTime()).toBe('01:30');
    });

    it('"10:00" después de 600 segundos', () => {
      service.start();
      vi.advanceTimersByTime(600000);
      expect(service.formattedTime()).toBe('10:00');
    });

    it('usa padding de dos dígitos (ej: "02:05" no "2:5")', () => {
      service.start();
      vi.advanceTimersByTime(125000); // 2 min 5 seg
      expect(service.formattedTime()).toBe('02:05');
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Flujo completo: start → pause → resume → stop
  // ──────────────────────────────────────────────────────────────
  describe('flujo completo', () => {
    it('start → pause → resume → stop retorna el total correcto', () => {
      service.start();
      vi.advanceTimersByTime(3000); // 3 seg
      service.pause();
      vi.advanceTimersByTime(2000); // 2 seg pausa (no cuenta)
      service.resume();
      vi.advanceTimersByTime(2000); // 2 seg más
      const total = service.stop();
      expect(total).toBe(5); // 3 + 2
    });

    it('reset permite iniciar un nuevo ciclo', () => {
      service.start();
      vi.advanceTimersByTime(5000);
      service.reset();
      service.start();
      vi.advanceTimersByTime(2000);
      expect(service.seconds()).toBe(2);
    });
  });
});
