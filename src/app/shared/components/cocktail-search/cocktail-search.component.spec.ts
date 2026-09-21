import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CocktailSearchComponent } from './cocktail-search.component';
import { FormsModule } from '@angular/forms';

describe('CocktailSearchComponent', () => {
  let component: CocktailSearchComponent;
  let fixture: ComponentFixture<CocktailSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CocktailSearchComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CocktailSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería retornar los placeholders correctos según searchType', () => {
    component.searchType = 'name';
    expect(component.getPlaceholder()).toBe('Buscar por nombre (máx. 50 letras)...');

    component.searchType = 'ingredient';
    expect(component.getPlaceholder()).toBe('Buscar por ingrediente (solo letras)...');

    component.searchType = 'id';
    expect(component.getPlaceholder()).toBe('Buscar por ID (solo números)...');
  });

  it('debería emitir searchTypeChange al seleccionar un tipo de búsqueda', () => {
    vi.spyOn(component.searchTypeChange, 'emit');
    component.onSearchTypeSelect('ingredient');
    expect(component.searchTypeChange.emit).toHaveBeenCalledWith('ingredient');
  });

  it('debería emitir searchInput al escribir en el campo de búsqueda', () => {
    vi.spyOn(component.searchInput, 'emit');
    component.onInput('Mojito');
    expect(component.searchInput.emit).toHaveBeenCalledWith('Mojito');
  });

  it('debería emitir clearSearch al hacer click en el botón limpiar', () => {
    vi.spyOn(component.clearSearch, 'emit');
    component.searchTerm = 'Mojito';
    fixture.detectChanges();

    const clearButton = fixture.nativeElement.querySelector('button[aria-label="Limpiar búsqueda"]') as HTMLButtonElement;
    expect(clearButton).toBeTruthy();
    clearButton.click();

    expect(component.clearSearch.emit).toHaveBeenCalled();
  });

  it('debería emitir toggleFavorites al pulsar el botón de favoritos', () => {
    vi.spyOn(component.toggleFavorites, 'emit');
    const favButton = fixture.nativeElement.querySelector('button[aria-label="Filtrar solo cócteles favoritos"]') as HTMLButtonElement;
    favButton.click();

    expect(component.toggleFavorites.emit).toHaveBeenCalled();
  });

  it('debería cambiar el estilo del botón si showOnlyFavorites es true', () => {
    component.showOnlyFavorites = true;
    fixture.detectChanges();

    const favButton = fixture.nativeElement.querySelector('button[aria-label="Filtrar solo cócteles favoritos"]') as HTMLButtonElement;
    expect(favButton.classList.contains('btn-warning')).toBe(true);
  });
});

