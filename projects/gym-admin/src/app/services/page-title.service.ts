import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PageTitleService {
  private titleSignal = signal<string>('');

  get title() {
    return this.titleSignal.asReadonly();
  }

  setTitle(title: string) {
    this.titleSignal.set(title);
  }
}