import { TestBed } from '@angular/core/testing';

import { GenerateGifService } from './generate-gif.service';

describe('GenerateGifService', () => {
  let service: GenerateGifService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GenerateGifService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
