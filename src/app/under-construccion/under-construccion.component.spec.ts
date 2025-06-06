import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnderConstruccionComponent } from './under-construccion.component';

describe('UnderConstruccionComponent', () => {
  let component: UnderConstruccionComponent;
  let fixture: ComponentFixture<UnderConstruccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnderConstruccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnderConstruccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
