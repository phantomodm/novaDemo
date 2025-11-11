import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionPlan } from './action-plan';

describe('ActionPlan', () => {
  let component: ActionPlan;
  let fixture: ComponentFixture<ActionPlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionPlan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionPlan);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
