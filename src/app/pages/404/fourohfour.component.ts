import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpStatusService } from '../../services/http-status.service';
import { SeoDirective } from '../../directives/seo.directive';

@Component({
  selector: 'app-fourohfour',
  imports: [CommonModule, RouterModule, SeoDirective],
  templateUrl: './fourohfour.component.html',
  styleUrl: './fourohfour.component.scss',
})
export class FourohfourComponent implements OnInit {
  private httpStatusService = inject(HttpStatusService);

  constructor() {
    // Set HTTP status code to 404 for this component
    this.httpStatusService.set404Status();
  }

  ngOnInit(): void {
    console.log('FourohfourComponent ngOnInit called');
    
  }

  goBack(): void {
    window.history.back();
  }
}
