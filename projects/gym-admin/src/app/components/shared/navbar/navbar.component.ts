import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { SidebarService } from '../../../services/sidebar.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  private sidebarService = inject(SidebarService);
  isCollapsed = this.sidebarService.isCollapsed;

  toggleSidebar() {
    this.sidebarService.toggle();
  }
}
