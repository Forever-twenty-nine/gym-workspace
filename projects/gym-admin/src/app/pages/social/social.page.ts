import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchAdminService } from '../../services/match-admin.service';
import { DesafioAdminService } from '../../services/desafio-admin.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { MatchInteraction, Desafio } from 'gym-library';

@Component({
    selector: 'app-social-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './social.page.html'
})
export class SocialPage {
    private readonly matchAdminService = inject(MatchAdminService);
    private readonly desafioAdminService = inject(DesafioAdminService);
    private readonly userService = inject(UserService);
    private readonly toastService = inject(ToastService);
    private readonly pageTitleService = inject(PageTitleService);

    // Pestaña activa: 'matches' | 'desafios'
    activeTab = signal<'matches' | 'desafios'>('matches');

    // Filtros de matches
    filtroMatch = signal<'todos' | 'mutuo' | 'pendiente'>('todos');
    filtroTipo = signal<'todos' | 'horario' | 'desafio' | 'afinidad'>('todos');

    // Matches cargados
    rawMatches = this.matchAdminService.matches;

    // Desafíos cargados
    desafios = this.desafioAdminService.desafios;

    // Matches con nombres y datos de usuario mapeados
    mappedMatches = computed(() => {
        const matches = this.rawMatches();
        const users = this.userService.users();
        const fMatch = this.filtroMatch();
        const fTipo = this.filtroTipo();

        let result = matches.map(m => {
            const userOrig = users.find(u => u.uid === m.usuarioOrigenId);
            const userDest = users.find(u => u.uid === m.usuarioDestinoId);
            return {
                ...m,
                origNombre: userOrig?.nombre || userOrig?.email || m.usuarioOrigenId,
                origEmail: userOrig?.email || '',
                destNombre: userDest?.nombre || userDest?.email || m.usuarioDestinoId,
                destEmail: userDest?.email || ''
            };
        });

        // Filtrar por estado mutuo
        if (fMatch === 'mutuo') {
            result = result.filter(m => m.mutuo);
        } else if (fMatch === 'pendiente') {
            result = result.filter(m => !m.mutuo);
        }

        // Filtrar por tipo
        if (fTipo !== 'todos') {
            result = result.filter(m => m.tipo === fTipo);
        }

        return result;
    });

    constructor() {
        this.pageTitleService.setTitle('Social & Matching');
        // Inicializar listeners de usuarios
        const u = this.userService.users();
    }

    setTab(tab: 'matches' | 'desafios') {
        this.activeTab.set(tab);
    }

    setFiltroMatch(filtro: 'todos' | 'mutuo' | 'pendiente') {
        this.filtroMatch.set(filtro);
    }

    setFiltroTipo(tipo: 'todos' | 'horario' | 'desafio' | 'afinidad') {
        this.filtroTipo.set(tipo);
    }

    async toggleDesafioActivo(desafio: Desafio) {
        try {
            await this.desafioAdminService.toggleActivo(desafio.id, desafio.activo);
            this.toastService.show(
                `Desafío ${desafio.activo ? 'desactivado' : 'activado'} con éxito.`,
                'success'
            );
        } catch (error) {
            console.error(error);
            this.toastService.show('Error al cambiar el estado del desafío.', 'error');
        }
    }

    async eliminarDesafio(desafio: Desafio) {
        if (confirm(`¿Estás seguro de eliminar de forma permanente el desafío "${desafio.titulo}"?`)) {
            try {
                await this.desafioAdminService.eliminarDesafio(desafio.id);
                this.toastService.show('Desafío eliminado correctamente.', 'success');
            } catch (error) {
                console.error(error);
                this.toastService.show('Error al eliminar el desafío.', 'error');
            }
        }
    }
}
