import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = authService.isLoggedIn();

  if (!isLoggedIn) {
    if (state.url !== '/login') {
      setTimeout(() => router.navigate(['/login']), 0);
    }
    return false;
  }

  const userRole = authService.getUserRole();
  const allowedRoles = route.data?.['roles'] as string[] | undefined;

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  if (allowedRoles.includes(userRole)) {
    return true;
  }

  // Evitar redirigir a /dashboard si ya estás ahí para romper ciclo
  if (state.url !== '/dashboard') {
    setTimeout(() => router.navigate(['/dashboard']), 0);
  }
  return false;
};
