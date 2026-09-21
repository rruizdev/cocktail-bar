import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CocktailCardComponent } from './cocktail-card.component';
import { Cocktail } from '../../../core/models/cocktail.model';

describe('CocktailCardComponent', () => {
  let component: CocktailCardComponent;
  let fixture: ComponentFixture<CocktailCardComponent>;

  const mockCocktail: Cocktail = {
    idDrink: '11007',
    strDrink: 'Margarita',
    strCategory: 'Ordinary Drink',
    strAlcoholic: 'Alcoholic',
    strGlass: 'Cocktail glass',
    strInstructions: 'Rub the rim of the glass with the lime slice to wet it.',
    strDrinkThumb: 'https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg',
    ingredients: [
      { name: 'Tequila', measure: '1 1/2 oz' },
      { name: 'Triple sec', measure: '1/2 oz' }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CocktailCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CocktailCardComponent);
    component = fixture.componentInstance;
    component.cocktail = mockCocktail;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar los datos del cóctel', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.card-title')?.textContent).toContain('Margarita');
    expect(compiled.querySelector('.card-text')?.textContent).toContain('Categoría: Ordinary Drink');
    const img = compiled.querySelector('img') as HTMLImageElement;
    expect(img.src).toContain('5noda61589575158.jpg');
  });

  it('debería emitir viewDetail al hacer click en la tarjeta', () => {
    vi.spyOn(component.viewDetail, 'emit');
    const cardEl = fixture.nativeElement.querySelector('.cocktail-card') as HTMLElement;
    cardEl.click();
    expect(component.viewDetail.emit).toHaveBeenCalledWith('11007');
  });

  it('debería emitir toggleFavorite y detener la propagación del evento', () => {
    vi.spyOn(component.toggleFavorite, 'emit');
    const eventMock = new Event('click');
    vi.spyOn(eventMock, 'stopPropagation');

    component.onToggleFavorite(eventMock);

    expect(eventMock.stopPropagation).toHaveBeenCalled();
    expect(component.toggleFavorite.emit).toHaveBeenCalledWith('11007');
  });

  it('debería emitir toggleMenu y detener la propagación del evento', () => {
    vi.spyOn(component.toggleMenu, 'emit');
    const eventMock = new Event('click');
    vi.spyOn(eventMock, 'stopPropagation');

    component.onToggleMenu(eventMock);

    expect(eventMock.stopPropagation).toHaveBeenCalled();
    expect(component.toggleMenu.emit).toHaveBeenCalledWith('11007');
  });

  it('debería mostrar el overlay de carga cuando isNavigating sea true', () => {
    fixture.componentRef.setInput('isNavigating', true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.card-loading-overlay')).toBeTruthy();
  });

  it('debería mostrar el menú desplegable cuando isMenuOpen sea true', () => {
    fixture.componentRef.setInput('isMenuOpen', true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.context-menu-dropdown')).toBeTruthy();
  });

  it('debería mostrar "♥ Favorito" cuando isFavorite sea true', () => {
    fixture.componentRef.setInput('isFavorite', true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const btnText = compiled.querySelector('.btn-danger')?.textContent ?? '';
    expect(btnText).toContain('♥ Favorito');
  });
});

