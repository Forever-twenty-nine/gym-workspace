import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GymLibrary } from './gym-library';

describe('GymLibrary', () => {
  let component: GymLibrary;
  let fixture: ComponentFixture<GymLibrary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GymLibrary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GymLibrary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
