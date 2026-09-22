import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchType } from '@core/models/search-type.model';

@Component({
  selector: 'app-cocktail-search',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cocktail-search.component.html',
  styleUrls: ['./cocktail-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CocktailSearchComponent {
  @Input() searchType: SearchType = 'name';
  @Input() searchTerm = '';
  @Input() showOnlyFavorites = false;

  @Output() searchTypeChange = new EventEmitter<SearchType>();
  @Output() searchInput = new EventEmitter<string>();
  @Output() clearSearch = new EventEmitter<void>();
  @Output() toggleFavorites = new EventEmitter<void>();

  onSearchTypeSelect(type: SearchType): void {
    this.searchTypeChange.emit(type);
  }

  onInput(value: string): void {
    this.searchInput.emit(value);
  }

  onClear(): void {
    this.clearSearch.emit();
  }

  onToggleFavorites(): void {
    this.toggleFavorites.emit();
  }

  getPlaceholder(): string {
    if (this.searchType === 'name') return 'Buscar por nombre (máx. 50 letras)...';
    if (this.searchType === 'ingredient') return 'Buscar por ingrediente (solo letras)...';
    return 'Buscar por ID (solo números)...';
  }
}
