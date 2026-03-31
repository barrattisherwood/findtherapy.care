import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionFormats } from '@findlocal/shared';

@Component({
  selector: 'app-session-formats-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-formats-input.html',
})
export class SessionFormatsInput {
  @Input() value: SessionFormats = { inPerson: false, online: false };
  @Input() error: string = '';
  @Output() valueChange = new EventEmitter<SessionFormats>();

  toggle(field: 'inPerson' | 'online', checked: boolean) {
    this.value = { ...this.value, [field]: checked };
    this.valueChange.emit(this.value);
  }
}
