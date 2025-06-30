import { TestBed } from '@angular/core/testing';

import { GifRouteService } from './gif-route.service';

describe('GifRouteServiceService', () => {
  let service: GifRouteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GifRouteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
