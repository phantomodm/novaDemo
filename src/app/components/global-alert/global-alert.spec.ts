import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalAlert } from './global-alert';

describe('GlobalAlert', () => {
  let component: GlobalAlert;
  let fixture: ComponentFixture<GlobalAlert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalAlert]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GlobalAlert);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
