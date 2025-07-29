import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./shared/components/navbar/navbar.component";
import { AuthService } from './auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { FooterComponent } from "./shared/components/footer/footer.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'sistema_banco';

  constructor(private authService: AuthService) { }
  loggeado = this.authService.isLoggedIn();

  ngOnInit() {
    console.log('Estado de autenticación:', this.loggeado);
  }
}
