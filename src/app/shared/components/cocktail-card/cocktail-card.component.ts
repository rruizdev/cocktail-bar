import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Cocktail } from '@core/models/cocktail.model';

@Component({
  selector: 'app-cocktail-card',
  standalone: true,
  imports: [],
  templateUrl: './cocktail-card.component.html',
  styleUrls: ['./cocktail-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CocktailCardComponent {
  @Input({ required: true }) cocktail!: Cocktail;
  @Input() isFavorite = false;
  @Input() isNavigating = false;
  @Input() isMenuOpen = false;

  @Output() viewDetail = new EventEmitter<string>();
  @Output() toggleFavorite = new EventEmitter<string>();
  @Output() toggleMenu = new EventEmitter<string>();

  onCardClick(): void {
    this.viewDetail.emit(this.cocktail.idDrink);
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    this.toggleFavorite.emit(this.cocktail.idDrink);
  }

  onToggleMenu(event: Event): void {
    event.stopPropagation();
    this.toggleMenu.emit(this.cocktail.idDrink);
  }
}
