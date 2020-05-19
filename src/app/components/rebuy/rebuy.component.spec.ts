import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RebuyComponent } from './rebuy.component';

describe('RebuyComponent', () => {
  let component: RebuyComponent;
  let fixture: ComponentFixture<RebuyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RebuyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RebuyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
