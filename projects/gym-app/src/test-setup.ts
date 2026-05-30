/**
 * Setup global para tests de Angular con Vitest.
 * Inicializa el entorno de testing de Angular (equivalente a TestEnvironment).
 */
import { TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Inicializar el entorno de testing de Angular una sola vez
TestBed.initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
