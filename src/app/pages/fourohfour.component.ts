import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpStatusService } from '../services/http-status.service';

@Component({
  selector: 'app-fourohfour',
  imports: [CommonModule, RouterModule],
  templateUrl: './fourohfour.component.html',
  styleUrl: './fourohfour.component.scss',
})
export class FourohfourComponent {
  private router = inject(Router);
  private httpStatusService = inject(HttpStatusService);

  constructor() {
    // Set HTTP status code to 404 for this component
    this.httpStatusService.set404Status();
  }

  goBack(): void {
    window.history.back();
  }
}
