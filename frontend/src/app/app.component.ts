import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateComponent } from './translate/translate.component';
import { SettingsComponent } from './settings/settings.component';

type View = 'translate' | 'settings';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TranslateComponent, SettingsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  view = signal<View>('translate');

  setView(view: View): void {
    this.view.set(view);
  }
}
