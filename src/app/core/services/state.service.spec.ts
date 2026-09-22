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
  });

  it('debería guardar y recuperar el estado correctamente', () => {
    service.saveState('margarita', 'ingredient', true);

    const state = service.getState();
    expect(state.term).toBe('margarita');
    expect(state.type).toBe('ingredient');
    expect(state.onlyFavorites).toBe(true);
  });
});
