import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CocktailService } from '../../core/services/cocktail.service';
import { Cocktail } from '../../core/models/cocktail.model';

@Component({
  selector: 'app-cocktail-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cocktail-detail.component.html',
  styleUrls: ['./cocktail-detail.component.scss'],
})
export class CocktailDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cocktailService = inject(CocktailService);

  readonly cocktail = signal<Cocktail | null>(null);
  readonly loading = signal(true);
  private readonly favorites = toSignal(this.cocktailService.favorites$, { initialValue: [] });
  readonly isFavorite = computed(() => {
    const current = this.cocktail();
    return current ? this.favorites().includes(current.idDrink) : false;
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const found = id ? this.cocktailService.searchLocal(id, 'id') : [];
    this.cocktail.set(found[0] ?? null);
    this.loading.set(false);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleFavorite(): void {
    const current = this.cocktail();
    if (current) {
      this.cocktailService.toggleFavorite(current.idDrink);
    }
  }
}
