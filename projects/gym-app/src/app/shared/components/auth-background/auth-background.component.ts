import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-auth-background',
  templateUrl: './auth-background.component.html',
  standalone: true
})
export class AuthBackgroundComponent {
  @Input() opacityClass: string = 'to-white dark:to-black';
  @Input() showBlur: boolean = true;
}
