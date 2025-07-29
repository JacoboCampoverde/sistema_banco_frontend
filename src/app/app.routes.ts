import { Routes } from '@angular/router';
import { LoginComponent } from './auth/components/login/login.component';
import { PerfilUsuarioComponent } from './auth/components/perfil-usuario/perfil-usuario.component';
import { DashboardComponent } from './reportes/components/dashboard/dashboard.component';
import { roleGuard } from './shared/guards/role.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },

    // Perfil: todos los roles pueden acceder a su perfil (incluido socio)
    {
        path: 'perfil',
        component: PerfilUsuarioComponent,
        canActivate: [roleGuard],
        data: { roles: ['socio', 'presidente', 'secretario', 'auxiliar', 'admin'] }
    },

    // Dashboard: accesible para todos roles
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [roleGuard],
        data: { roles: ['socio', 'presidente', 'secretario', 'auxiliar', 'admin'] }
    },

    // Socios: roles que manejan datos de socios
    {
        path: 'socios',
        canActivate: [roleGuard],
        data: { roles: ['presidente', 'secretario', 'admin'] }, // Auxiliar y socio NO pueden aquí
        children: [
            {
                path: '',
                loadComponent: () => import('./socios/components/socios-list/socios-list.component')
                    .then(m => m.SociosListComponent)
            },
            {
                path: 'nuevo',
                loadComponent: () => import('./socios/components/socio-form/socio-form.component')
                    .then(m => m.SocioFormComponent),
                canActivate: [roleGuard],
                data: { roles: ['secretario', 'admin'] } // Solo secretario y admin pueden crear
            },
            {
                path: ':id',
                loadComponent: () => import('./socios/components/socio-detail/socio-detail.component')
                    .then(m => m.SocioDetailComponent),
                canActivate: [roleGuard],
                data: { roles: ['socio', 'presidente', 'secretario', 'admin'] } // socio puede ver su detalle
            }
        ]
    },

    // Aportes: socios y roles administrativos pueden ver y agregar aportes
    {
        path: 'aportes',
        canActivate: [roleGuard],
        data: { roles: ['socio', 'presidente', 'secretario', 'admin'] },
        children: [
            {
                path: '',
                loadComponent: () => import('./aportes/components/aportes-list/aportes-list.component')
                    .then(m => m.AportesListComponent)
            },
            {
                path: 'nuevo',
                loadComponent: () => import('./aportes/components/aporte-form/aporte-form.component')
                    .then(m => m.AporteFormComponent),
                canActivate: [roleGuard],
                data: { roles: ['socio', 'secretario', 'admin'] }
            }
        ]
    },

    // Préstamos: comité de crédito (auxiliar), socios, secretaria y admin
    {
        path: 'prestamos',
        canActivate: [roleGuard],
        data: { roles: ['socio', 'auxiliar', 'secretario', 'admin'] },
        children: [
            {
                path: '',
                loadComponent: () => import('./prestamos/components/prestamos-list/prestamos-list.component')
                    .then(m => m.PrestamosListComponent)
            },
            {
                path: 'nuevo',
                loadComponent: () => import('./prestamos/components/prestamo-form/prestamo-form.component')
                    .then(m => m.PrestamoFormComponent),
                canActivate: [roleGuard],
                data: { roles: ['secretario', 'admin'] }
            },
            {
                path: ':id',
                loadComponent: () => import('./prestamos/components/prestamo-detail/prestamo-detail.component')
                    .then(m => m.PrestamoDetailComponent)
            }
        ]
    },

    // Pagos: secretario, socios y admin pueden gestionar
    {
        path: 'pagos',
        canActivate: [roleGuard],
        data: { roles: ['socio', 'secretario', 'admin'] },
        children: [
            {
                path: '',
                loadComponent: () => import('./pagos/components/pagos-list/pagos-list.component')
                    .then(m => m.PagosListComponent)
            },
            {
                path: 'nuevo',
                loadComponent: () => import('./pagos/components/pago-form/pago-form.component')
                    .then(m => m.PagoFormComponent),
                canActivate: [roleGuard],
                data: { roles: ['socio', 'secretario', 'admin'] }
            }
        ]
    },

    // Reportes: presidente, secretario y admin (roles administrativos)
    {
        path: 'reportes',
        canActivate: [roleGuard],
        data: { roles: ['presidente', 'secretario', 'admin'] },
        loadComponent: () => import('./reportes/components/reportes/reportes.component')
            .then(m => m.ReportesComponent)
    },

    // Multas: pueden registrar y consultar socios, secretario y admin
    {
        path: 'multas',
        canActivate: [roleGuard],
        data: { roles: ['socio', 'secretario', 'admin'] },
        children: [
            {
                path: '',
                loadComponent: () => import('./multas/components/multas-list/multas-list.component')
                    .then(m => m.MultasListComponent)
            },
            {
                path: 'nuevo',
                loadComponent: () => import('./multas/components/multas-form/multas-form.component')
                    .then(m => m.MultasFormComponent),
                canActivate: [roleGuard],
                data: { roles: ['secretario', 'admin'] } // solo roles administrativos registran
            }
        ]
    },

    {
        path: 'prorrogas',
        canActivate: [roleGuard],
        data: { roles: ['socio', 'secretario', 'admin'] },
        children: [
            {
                path: '',
                loadComponent: () => import('./prorrogas/components/prorrogas-list/prorrogas-list.component')
                    .then(m => m.ProrrogasListComponent)
            },
            {
                path: 'nuevo',
                loadComponent: () => import('./prorrogas/components/prorrogas-form/prorrogas-form.component')
                    .then(m => m.ProrrogasFormComponent),
                canActivate: [roleGuard],
                data: { roles: ['socio', 'secretario', 'admin'] }
            }
        ]
    },

    // Admin: solo admin
    {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        children: [
            {
                path: 'usuarios',
                loadComponent: () => import('./admin/components/usuarios-admin/usuarios-admin.component')
                    .then(m => m.UsuariosAdminComponent)
            },
            {
                path: 'ajustes',
                loadComponent: () => import('./admin/components/ajustes/ajustes.component')
                    .then(m => m.AjustesComponent)
            }
        ]
    },

    { path: '**', redirectTo: 'dashboard' }
];
