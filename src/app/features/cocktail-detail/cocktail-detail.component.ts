import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CocktailService } from '../../core/services/cocktail.service';
import { Cocktail } from '../../core/models/cocktail.model';

@Component({
  selector: 'app-cocktail-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cocktail-detail.component.html',
  styleUrls: ['./cocktail-detail.component.scss']
})
export class CocktailDetailComponent implements OnInit {
  cocktail: Cocktail | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cocktailService: CocktailService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cocktailService.searchLocal(id, 'id').subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this.cocktail = data[0];
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al obtener el detalle:', err);
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleFavorite(): void {
    if (this.cocktail) {
      this.cocktailService.toggleFavorite(this.cocktail.idDrink);
    }
  }

  isFavorite(): boolean {
    return this.cocktail ? this.cocktailService.isFavorite(this.cocktail.idDrink) : false;
  }
}