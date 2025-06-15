import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    h1 {
      text-align: center;
      margin-bottom: 2rem;
      color: #333;
    }
  `]
})
export class AppComponent {
  title = 'dancer';
}
