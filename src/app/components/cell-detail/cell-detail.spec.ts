import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CellDetail } from './cell-detail';

describe('CellDetail', () => {
  let component: CellDetail;
  let fixture: ComponentFixture<CellDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CellDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CellDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
