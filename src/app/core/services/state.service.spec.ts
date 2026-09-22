import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateService } from './state.service';

describe('StateService', () => {
  let service: StateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StateService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debería devolver el estado inicial por defecto', () => {
    const state = service.getState();
    expect(state.term).toBe('');
    expect(state.type).toBe('name');
    expect(state.onlyFavorites).toBe(false);
    expect(state.scrollPosition).toEqual([0, 0]);
  });

  it('debería guardar y recuperar el estado correctamente', () => {
    // Simulamos un scroll previo al guardado
    vi.spyOn(window, 'scrollX', 'get').mockReturnValue(100);
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(500);

    service.saveState('margarita', 'ingredient', true);
    
    const state = service.getState();
    expect(state.term).toBe('margarita');
    expect(state.type).toBe('ingredient');
    expect(state.onlyFavorites).toBe(true);
    expect(state.scrollPosition).toEqual([100, 500]);
  });
});

