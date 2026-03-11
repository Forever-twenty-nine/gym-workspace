import { TestBed } from '@angular/core/testing';

import { MensajesGlobales } from './mensajes-globales';

describe('MensajesGlobales', () => {
  let service: MensajesGlobales;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MensajesGlobales);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
