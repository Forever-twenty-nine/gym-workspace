import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchAdminService } from '../../services/match-admin.service';
import { DesafioAdminService } from '../../services/desafio-admin.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DataComponent } from '../../components/shared/data/data.component';
import { SchemaService } from '../../core/schema.service';
import { MatchInteraction, Desafio, Mensaje } from 'gym-library';
import { MensajeService } from '../../services/mensaje.service';
import { TabsComponent, TabItem } from '../../components/shared/tabs/tabs.component';

@Component({
    selector: 'app-social-page',
    standalone: true,
    imports: [CommonModule, DataComponent, TabsComponent],
    templateUrl: './social.page.html'
})
export class SocialPage {
    private readonly matchAdminService = inject(MatchAdminService);
    private readonly desafioAdminService = inject(DesafioAdminService);
    private readonly userService = inject(UserService);
    private readonly toastService = inject(ToastService);
    private readonly pageTitleService = inject(PageTitleService);
    private readonly schemaService = inject(SchemaService);
    private readonly mensajeService = inject(MensajeService);

    // Pestaña activa: 'matches' | 'desafios' | 'mensajes'
    activeTab = signal<'matches' | 'desafios' | 'mensajes'>('matches');

    // Matches cargados
    rawMatches = this.matchAdminService.matches;

    // Desafíos cargados
    desafios = this.desafioAdminService.desafios;

    // Matches con nombres y datos de usuario mapeados (sin filtros custom)
    mappedMatches = computed(() => {
        const matches = this.rawMatches();
        const users = this.userService.users();

        return matches.map(m => {
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
    });

    matchColumns = this.schemaService.getColumns('match');
    desafioColumns = this.schemaService.getColumns('desafio');
    matchFields = this.schemaService.getFields('match');
    desafioFields = computed(() => {
      const base = this.schemaService.getFields('desafio');
      const users = this.userService.users();
      const userOptions = users.map(u => ({ value: u.uid, label: u.nombre || u.email || u.uid }));
      return base.map(field => {
        if (field.name === 'creadorId') {
          return { ...field, type: 'select' as const, options: userOptions, label: 'Creador' };
        }
        return field;
      });
    });

    // Mensajes personales (enriquecidos con nombres)
    mensajes = this.mensajeService.mensajes;

    mensajesEnriquecidos = computed(() => {
      const list = this.mensajes();
      const users = this.userService.users();
      const matches = this.rawMatches();

      // Solo mensajes entre usuarios que tienen match mutuo
      const matchedPairs = new Set(
        matches
          .filter(m => m.mutuo)
          .map(m => {
            const ids = [m.usuarioOrigenId, m.usuarioDestinoId].sort();
            return ids.join('-');
          })
      );

      return list
        .filter((m: Mensaje) => {
          const ids = [m.remitenteId, m.destinatarioId].sort();
          return matchedPairs.has(ids.join('-'));
        })
        .map((m: Mensaje) => {
          const remitente = users.find(u => u.uid === m.remitenteId);
          const destinatario = users.find(u => u.uid === m.destinatarioId);
          return {
            ...m,
            remitenteNombre: remitente?.nombre || remitente?.email || m.remitenteId,
            destinatarioNombre: destinatario?.nombre || destinatario?.email || m.destinatarioId,
          };
        });
    });

    mensajeColumns = this.schemaService.getColumns('mensaje');
    mensajeFields = this.schemaService.getFields('mensaje');

    // Tabs definition for unified compact tabs component (live counts)
    tabs = computed<TabItem[]>(() => [
      { id: 'matches', label: 'Matches & Conexiones', count: this.mappedMatches().length, accent: 'blue' },
      { id: 'desafios', label: 'Desafíos Comunitarios', count: this.desafios().length, accent: 'amber' },
      { id: 'mensajes', label: 'Mensajes Personales', count: this.mensajesEnriquecidos().length, accent: 'purple' }
    ]);

    constructor() {
        this.updatePageTitle();
        // Inicializar listeners
        const u = this.userService.users();
        this.mensajeService.mensajes; // init listener for personal messages
    }

    setTab(tab: string) {
        this.activeTab.set(tab as 'matches' | 'desafios' | 'mensajes');
        this.updatePageTitle();
    }

    private updatePageTitle() {
        const tab = this.activeTab();
        let title = 'Social & Matching';
        if (tab === 'matches') {
            title = 'Matches & Conexiones';
        } else if (tab === 'desafios') {
            title = 'Desafíos Comunitarios';
        } else if (tab === 'mensajes') {
            title = 'Mensajes Personales';
        }
        this.pageTitleService.setTitle(title);
    }

    async onSaveDesafio(data: any) {
        try {
            if (!data.id) {
                // Defaults para creación desde admin
                data.fechaCreacion = new Date();
                // Si no se especifica creador, dejar que el form lo ponga o default
                if (!data.creadorId) {
                    data.creadorId = '';
                    data.creadorNombre = 'Admin';
                }
            }
            await this.desafioAdminService.save(data);
            this.toastService.show('Desafío guardado', 'success');
        } catch (e) {
            console.error(e);
            this.toastService.show('Error al guardar desafío', 'error');
        }
    }

    async eliminarDesafio(event: string | Desafio) {
        const id = typeof event === 'string' ? event : event.id;
        const d = this.desafios().find(x => x.id === id);
        if (d) {
            if (confirm(`¿Estás seguro de eliminar de forma permanente el desafío "${d.titulo}"?`)) {
                try {
                    await this.desafioAdminService.eliminarDesafio(id);
                    this.toastService.show('Desafío eliminado correctamente.', 'success');
                } catch (error) {
                    console.error(error);
                    this.toastService.show('Error al eliminar el desafío.', 'error');
                }
            }
        }
    }
}
