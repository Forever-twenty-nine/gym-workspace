import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RutinasSemanal } from './rutinas-semanal';

describe('RutinasSemanal', () => {
  let component: RutinasSemanal;
  let fixture: ComponentFixture<RutinasSemanal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RutinasSemanal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RutinasSemanal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
