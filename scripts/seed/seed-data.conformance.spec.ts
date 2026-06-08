/**
 * Conformance tests between seed data builders and gym-library models.
 *
 * Goal: If a model in projects/gym-library/src/lib/models changes
 * (new required field, renamed field, type change, field moved between User vs role doc, etc.),
 * this test (and/or the TypeScript compile of the builders) will fail,
 * forcing the seed script to be updated so it doesn't insert outdated/stale data shapes.
 */

import { describe, it, expect, expectTypeOf } from "vitest";
import type { User } from "../../projects/gym-library/src/lib/models/user.model";
import type { Entrenador } from "../../projects/gym-library/src/lib/models/entrenador.model";
import type { Entrenado } from "../../projects/gym-library/src/lib/models/entrenado.model";
import type { Gimnasio } from "../../projects/gym-library/src/lib/models/gimnasio.model";
import type { Ejercicio } from "../../projects/gym-library/src/lib/models/ejercicio.model";
import type { Rutina } from "../../projects/gym-library/src/lib/models/rutina.model";
import type { RutinaAsignada } from "../../projects/gym-library/src/lib/models/rutina-asignada.model";
import type { SesionRutina } from "../../projects/gym-library/src/lib/models/sesion-rutina.model";
import type { Desafio } from "../../projects/gym-library/src/lib/models/desafio.model";
import type { Convocatoria } from "../../projects/gym-library/src/lib/models/convocatoria.model";
import type { MatchInteraction } from "../../projects/gym-library/src/lib/models/match-interaction.model";
import type { Mensaje } from "../../projects/gym-library/src/lib/models/mensaje.model";
import { Objetivo } from "../../projects/gym-library/src/lib/enums/objetivo.enum";
import { Plan } from "../../projects/gym-library/src/lib/enums/plan.enum";
import { NivelEntrenamiento } from "../../projects/gym-library/src/lib/enums/nivel-entrenamiento.enum";
import {
  buildTrainerUser,
  buildEntrenadorDoc,
  buildTraineeUser,
  buildEntrenadoDoc,
  buildGymDoc,
  buildGymUser,
  buildEjercicio,
  buildRutina,
  buildRutinaAsignada,
  buildSesionRutinaMock,
  buildDesafio,
  buildConvocatoria,
  buildMatch,
  buildMensaje,
} from "./builders";

describe("Seed data builders conform to gym-library models", () => {
  const baseUid = "test-uid-123";
  const gymId = "gym_test_1";

  it("buildTrainerUser produces something assignable to User (plus seed extras)", () => {
    const user = buildTrainerUser(baseUid, "Test Trainer", "trainer@test.com", Plan.PREMIUM);
    // Compile-time check
    expectTypeOf(user).toBeObject();
    // Runtime sanity
    expect(user.uid).toBe(baseUid);
    expect(user.role).toBe("entrenador");
    expect(user.onboarded).toBe(true);
  });

  it("buildEntrenadorDoc satisfies Entrenador model", () => {
    const doc = buildEntrenadorDoc(baseUid, { entrenadosAsignadosIds: ["t1"] });
    expectTypeOf(doc).toMatchTypeOf<Entrenador>();
    expect(doc.id).toBe(baseUid);
    expect(Array.isArray(doc.entrenadosAsignadosIds)).toBe(true);
  });

  it("buildTraineeUser + buildEntrenadoDoc satisfy their models", () => {
    const input = {
      uid: baseUid,
      nombre: "Test Trainee",
      email: "trainee@test.com",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.INTERMEDIO,
      objetivo: Objetivo.VOLUMEN,
      bio: "Test bio",
      franjaHoraria: { inicio: "18:00", fin: "20:00" },
      trainerUid: "trainer-1",
    };

    const user = buildTraineeUser(input);
    const profile = buildEntrenadoDoc(input);

    expectTypeOf(user).toMatchTypeOf<User>();
    expectTypeOf(profile).toMatchTypeOf<Entrenado>();

    expect(profile.objetivo).toBe(Objetivo.VOLUMEN);
    expect(profile.entrenadoresId).toContain("trainer-1");
  });

  it("buildGymDoc and buildGymUser satisfy Gimnasio + User", () => {
    const gymInput = {
      id: gymId,
      nombre: "Test Gym",
      email: "gym@test.com",
      direccion: "Calle Falsa 123",
      plan: Plan.PREMIUM,
    };

    const gymDoc = buildGymDoc(gymInput, ["trainer-a"], ["trainee-x"]);
    const gymUser = buildGymUser(gymInput);

    expectTypeOf(gymDoc).toMatchTypeOf<Gimnasio>();
    expectTypeOf(gymUser).toMatchTypeOf<User>();

    expect(gymDoc.entrenadosIds).toContain("trainee-x");
  });

  it("buildEjercicio satisfies Ejercicio", () => {
    const ex = buildEjercicio("ex-1", "Sentadilla", "Bajar y subir", baseUid);
    expectTypeOf(ex).toMatchTypeOf<Ejercicio>();
    expect(ex.nombre).toBe("Sentadilla");
    expect(ex.creadorId).toBe(baseUid);
  });

  it("buildRutina satisfies Rutina", () => {
    const r = buildRutina("rut-1", "Full Body", ["ex-1", "ex-2"], baseUid, "Test Trainee", "trainer-1");
    expectTypeOf(r).toMatchTypeOf<Rutina>();
    expect(r.ejerciciosIds).toHaveLength(2);
  });

  it("buildRutinaAsignada satisfies RutinaAsignada", () => {
    const ra = buildRutinaAsignada("ra-1", "rut-1", baseUid, "trainer-1", "Lunes");
    expectTypeOf(ra).toMatchTypeOf<RutinaAsignada>();
    expect(ra.diaSemana).toBe("Lunes");
    expect(ra.activa).toBe(true);
  });

  it("buildSesionRutinaMock satisfies SesionRutina shape", () => {
    const ses = buildSesionRutinaMock("ses-1", baseUid, "Trainee", "rut-1", "Lunes");
    expectTypeOf(ses).toMatchTypeOf<SesionRutina>();
    expect(ses.completada).toBe(true);
    expect(ses.rutinaResumen.id).toBe("rut-1");
  });

  it("buildDesafio satisfies Desafio (including new required fields like gimnasioId + fechaVencimiento)", () => {
    const d = buildDesafio({
      id: "d-1",
      creadorId: baseUid,
      creadorNombre: "Trainee",
      titulo: "Reto de sentadillas",
      logroRelacionado: "100kg x 5",
      disciplina: "Powerlifting",
      activo: true,
      gimnasioId: gymId,
    });
    expectTypeOf(d).toMatchTypeOf<Desafio>();
    expect(d.gimnasioId).toBe(gymId);
    expect(d.fechaVencimiento).toBeInstanceOf(Date);
  });

  it("buildConvocatoria satisfies Convocatoria", () => {
    const c = buildConvocatoria({
      id: "conv-1",
      creadorId: baseUid,
      creadorNombre: "Trainer",
      gimnasioId: gymId,
      fechaEntrenamiento: new Date(),
      horaInicio: "19:00",
      horaFin: "20:00",
      mensaje: "Vamos?",
      interesados: [],
      activo: true,
      creadorRol: "entrenador",
      titulo: "WOD del día",
      esOficial: true,
    });
    expectTypeOf(c).toMatchTypeOf<Convocatoria>();
    expect(c.esOficial).toBe(true);
  });

  it("buildMatch satisfies MatchInteraction", () => {
    const m = buildMatch({
      id: "m-1",
      tipo: "afinidad",
      usuarioOrigenId: "u1",
      usuarioDestinoId: "u2",
      interesOrigen: true,
      interesDestino: true,
      mutuo: true,
    });
    expectTypeOf(m).toMatchTypeOf<MatchInteraction>();
    expect(m.mutuo).toBe(true);
  });

  it("buildMensaje satisfies Mensaje shape", () => {
    const msg = buildMensaje({
      id: "msg-1",
      remitenteId: "u1",
      destinatarioId: "u2",
      contenido: "Hola!",
      leido: false,
    });
    expectTypeOf(msg).toMatchTypeOf<Mensaje>();
    expect(msg.contenido).toBe("Hola!");
  });

  it("all core builders return objects with an 'id' field (common across models)", () => {
    expect(buildEntrenadorDoc(baseUid).id).toBe(baseUid);
    expect(buildEjercicio("ex-42", "Test", "d").id).toBe("ex-42");
    expect(buildDesafio({ id: "d-99", creadorId: "c", creadorNombre: "n", titulo: "t", activo: true, gimnasioId: gymId }).id).toBe("d-99");
  });
});
