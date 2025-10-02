import { Component } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, CdkDropListGroup, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { AppointmentDialogComponent } from '../appointment-dialog/appointment-dialog.component';
import { CommonModule, NgIf, NgFor, NgStyle, DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';

interface Resource {
  id: string;
  name: string;
  color: string;
  capacity?: number;
}

interface Appointment {
  uuid?: string;
  date: Date;
  title: string;
  startTime: string;
  endTime: string;
  color?: string;
  resourceId?: string;
}

export enum CalendarView {
  Month = 'month',
  Week = 'week',
  Day = 'day',
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  standalone: true,
  imports: [
    CdkDropListGroup,
    NgIf,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatIconButton,
    MatIcon,
    MatButton,
    NgFor,
    CdkDropList,
    NgStyle,
    CdkDrag,
    CdkDragHandle,
    DatePipe,
  ],
})
export class CalendarComponent {
  viewDate: Date = new Date();
  selectedDate: Date | null = null;
  selectedStartTime: string | undefined;
  selectedResource: Resource | null = null;
  weekDays: string[] = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  monthDays: Date[] = [];

  // Ressourcen/Räume definieren
  resources: Resource[] = [
    { id: 'room-1', name: 'Besprechungsraum A', color: '#e3f2fd', capacity: 10 },
    { id: 'room-2', name: 'Besprechungsraum B', color: '#f3e5f5', capacity: 8 },
    { id: 'room-3', name: 'Konferenzsaal', color: '#e8f5e9', capacity: 50 },
    { id: 'room-4', name: 'Kleines Büro', color: '#fff3e0', capacity: 4 },
  ];

  // Tracking welche Räume sichtbar sind
  visibleResources: Set<string> = new Set();

  appointments: Appointment[] = [
    {
      uuid: '00000000-0000-0000-0000-000000000001',
      date: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate()
      ),
      title: 'Meeting mit Bob',
      startTime: '09:00',
      endTime: '10:00',
      resourceId: 'room-1',
    },
    {
      uuid: '00000000-0000-0000-0000-000000000002',
      date: new Date(new Date().getFullYear(), new Date().getMonth(), 2),
      title: 'Mittagessen mit Alice',
      startTime: '12:00',
      endTime: '13:00',
      resourceId: 'room-2',
    },
    {
      uuid: '00000000-0000-0000-0000-000000000003',
      date: new Date(new Date().getFullYear(), new Date().getMonth(), 3),
      title: 'Projekt Deadline',
      startTime: '15:00',
      endTime: '16:00',
      resourceId: 'room-3',
    },
    {
      uuid: '00000000-0000-0000-0000-000000000004',
      date: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate()
      ),
      title: 'Arzttermin',
      startTime: '10:00',
      endTime: '11:00',
      resourceId: 'room-1',
    },
    {
      uuid: '00000000-0000-0000-0000-000000000005',
      date: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate() + 1
      ),
      title: 'Team Meeting',
      startTime: '14:00',
      endTime: '15:00',
      resourceId: 'room-2',
    },
  ];

  currentView: CalendarView = CalendarView.Month;
  timeSlots: string[] = [];
  weeks: Date[][] = [];

  // Slot-Selection für Drag
  isSelecting: boolean = false;
  selectionStart: { date: Date; slot: string; resource?: Resource } | null = null;
  selectionEnd: { date: Date; slot: string; resource?: Resource } | null = null;
  selectedSlots: Set<string> = new Set();

  public CalendarView = CalendarView;

  constructor(public dialog: MatDialog) {
    this.appointments.forEach((appointment) => {
      const resource = this.resources.find(r => r.id === appointment.resourceId);
      if (resource) {
        appointment.color = resource.color;
      } else if (!appointment.color) {
        appointment.color = this.getRandomColor();
      }
    });
    // Alle Ressourcen initial sichtbar machen
    this.resources.forEach(resource => {
      this.visibleResources.add(resource.id);
    });
    this.generateView(this.currentView, this.viewDate);
    this.generateTimeSlots();
  }

  generateView(view: CalendarView, date: Date) {
    switch (view) {
      case CalendarView.Month:
        this.generateMonthView(date);
        break;
      case CalendarView.Week:
        this.generateWeekView(date);
        break;
      case CalendarView.Day:
        this.generateResourceDayView(date);
        break;
      default:
        this.generateMonthView(date);
    }
  }

  generateMonthView(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.weeks = [];
    this.monthDays = [];
    let week: Date[] = [];

    for (let day = start.getDay(); day > 0; day--) {
      const prevDate = new Date(start);
      prevDate.setDate(start.getDate() - day);
      week.push(prevDate);
      this.monthDays.push(prevDate);
    }

    for (let day = 1; day <= end.getDate(); day++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
      this.monthDays.push(currentDate);
      week.push(currentDate);
      if (week.length === 7) {
        this.weeks.push(week);
        week = [];
      }
    }

    for (let day = 1; this.monthDays.length % 7 !== 0; day++) {
      const nextDate = new Date(end);
      nextDate.setDate(end.getDate() + day);
      this.monthDays.push(nextDate);
    }

    for (let day = 1; week.length < 7; day++) {
      const nextDate = new Date(end);
      nextDate.setDate(end.getDate() + day);
      week.push(nextDate);
    }

    if (week.length > 0) {
      this.weeks.push(week);
    }
  }

  generateWeekView(date: Date) {
    const startOfWeek = this.startOfWeek(date);
    this.monthDays = [];

    for (let day = 0; day < 7; day++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + day);
      this.monthDays.push(weekDate);
    }
  }

  generateDayView(date: Date) {
    this.monthDays = [date];
  }

  generateResourceDayView(date: Date) {
    this.monthDays = [date];
  }

  generateTimeSlots() {
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const h = hour < 10 ? `0${hour}` : `${hour}`;
        const m = minute < 10 ? `0${minute}` : `${minute}`;
        this.timeSlots.push(`${h}:${m}`);
      }
    }
    this.timeSlots.push('24:00');
  }

  switchToView(view: CalendarView) {
    this.currentView = view;
    this.generateView(this.currentView, this.viewDate);
  }

  startOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(start.setDate(diff));
  }

  previous() {
    if (this.currentView === 'month') {
      this.viewDate = new Date(
        this.viewDate.setMonth(this.viewDate.getMonth() - 1)
      );
      this.generateMonthView(this.viewDate);
    } else if (this.currentView === 'week') {
      this.viewDate = new Date(
        this.viewDate.setDate(this.viewDate.getDate() - 7)
      );
      this.generateWeekView(this.viewDate);
    } else {
      this.viewDate = new Date(
        this.viewDate.setDate(this.viewDate.getDate() - 1)
      );
      this.generateResourceDayView(this.viewDate);
    }
  }

  next() {
    if (this.currentView === 'month') {
      this.viewDate = new Date(
        this.viewDate.setMonth(this.viewDate.getMonth() + 1)
      );
      this.generateMonthView(this.viewDate);
    } else if (this.currentView === 'week') {
      this.viewDate = new Date(
        this.viewDate.setDate(this.viewDate.getDate() + 7)
      );
      this.generateWeekView(this.viewDate);
    } else {
      this.viewDate = new Date(
        this.viewDate.setDate(this.viewDate.getDate() + 1)
      );
      this.generateResourceDayView(this.viewDate);
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  isSelected(date: Date): boolean {
    if (!this.selectedDate) {
      return false;
    }
    return (
      date.getDate() === this.selectedDate.getDate() &&
      date.getMonth() === this.selectedDate.getMonth() &&
      date.getFullYear() === this.selectedDate.getFullYear()
    );
  }

  isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  selectDate(date?: Date, startTime?: string, resource?: Resource) {
    if (date) {
      this.selectedDate = date;
    } else {
      this.selectedDate = new Date();
    }
    this.selectedStartTime = startTime;
    this.selectedResource = resource || null;

    // Wenn Slots ausgewählt wurden, berechne Start und Endzeit
    if (this.selectionStart && this.selectionEnd) {
      const startSlotIndex = this.timeSlots.indexOf(this.selectionStart.slot);
      const endSlotIndex = this.timeSlots.indexOf(this.selectionEnd.slot);

      if (startSlotIndex !== -1 && endSlotIndex !== -1) {
        const minIndex = Math.min(startSlotIndex, endSlotIndex);
        const maxIndex = Math.max(startSlotIndex, endSlotIndex);

        const calculatedStartTime = this.timeSlots[minIndex];
        const calculatedEndTime = this.timeSlots[maxIndex + 1] || this.timeSlots[maxIndex];
        this.openDialog(calculatedStartTime, calculatedEndTime);
        return;
      }
    }

    this.openDialog();
  }

  generateUUID(): string {
    let d = new Date().getTime();
    let d2 =
      (typeof performance !== 'undefined' &&
        performance.now &&
        performance.now() * 1000) ||
      0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        let r = Math.random() * 16;
        if (d > 0) {
          r = (d + r) % 16 | 0;
          d = Math.floor(d / 16);
        } else {
          r = (d2 + r) % 16 | 0;
          d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
  }

  addAppointment(
    date: Date,
    title: string,
    startTime: string,
    endTime: string,
    resourceId?: string
  ) {
    const resource = this.resources.find(r => r.id === resourceId);
    this.appointments.push({
      uuid: this.generateUUID(),
      date,
      title,
      startTime,
      endTime,
      color: resource ? resource.color : this.getRandomColor(),
      resourceId: resourceId,
    });
  }

  deleteAppointment(appointment: Appointment, event: Event) {
    event.stopPropagation();
    const index = this.appointments.indexOf(appointment);
    if (index > -1) {
      this.appointments.splice(index, 1);
    }
  }

  openDialog(startTimeOverride?: string, endTimeOverride?: string): void {
    const hour = new Date().getHours();
    const minutes = new Date().getMinutes();
    const h = hour < 10 ? `0${hour}` : hour;
    const m = minutes < 10 ? `0${minutes}` : minutes;

    const startTime = startTimeOverride || this.selectedStartTime || `${h}:${m}`;
    const endTime = endTimeOverride || this.selectedStartTime || `${h}:${m}`;

    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      width: '500px',
      panelClass: 'dialog-container',
      data: {
        date: this.selectedDate,
        title: '',
        startTime: startTime,
        endTime: endTime,
        resourceId: this.selectedResource?.id || null,
        resources: this.resources,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addAppointment(
          result.date,
          result.title,
          result.startTime,
          result.endTime,
          result.resourceId
        );
      }
      this.clearSelection();
    });
  }

  getAppointmentsForDate(day: Date, timeSlots: string[]) {
    return this.appointments
      .filter((appointment) => {
        return this.isSameDate(appointment.date, day);
      })
      .map((appointment) => {
        const startTimeIndex = timeSlots.indexOf(appointment.startTime);
        const endTimeIndex = timeSlots.indexOf(appointment.endTime);
        return { ...appointment, startTimeIndex, endTimeIndex };
      });
  }

  drop(event: CdkDragDrop<Appointment[]>, date: Date, slot?: string, resource?: Resource) {
    const movedAppointment = event.item.data;
    movedAppointment.date = date;
    if (slot) {
      movedAppointment.startTime = slot;
      movedAppointment.endTime = slot;
    }
    if (resource) {
      movedAppointment.resourceId = resource.id;
    }
  }

  viewToday(): void {
    this.viewDate = new Date();
    this.generateView(this.currentView, this.viewDate);
  }

  isCurrentMonth(date: Date): boolean {
    return (
      date.getMonth() === this.viewDate.getMonth() &&
      date.getFullYear() === this.viewDate.getFullYear()
    );
  }

  getAppointmentsForDateTime(date: Date, timeSlot: string, resourceId?: string): Appointment[] {
    let appointmentsForDateTime: Appointment[] = this.appointments.filter(
      (appointment) =>
        this.isSameDate(appointment.date, date) &&
        appointment.startTime <= timeSlot &&
        appointment.endTime >= timeSlot
    );

    if (resourceId) {
      appointmentsForDateTime = appointmentsForDateTime.filter(
        (appointment) => appointment.resourceId === resourceId
      );
    }

    return appointmentsForDateTime;
  }

  getRandomColor(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const a = 0.4;
    return `rgba(${r},${g},${b},${a})`;
  }

  editAppointment(appointment: Appointment, event: Event) {
    event.preventDefault();
    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      width: '500px',
      panelClass: 'dialog-container',
      data: {
        ...appointment,
        resources: this.resources,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const index = this.appointments.findIndex(
          (appointment) => appointment.uuid === result.uuid
        );
        if (result.remove) {
          this.appointments.splice(index, 1);
        } else {
          this.appointments[index] = result;
        }
      }
    });
  }

  getResourceName(resourceId?: string): string {
    if (!resourceId) return 'Kein Raum';
    const resource = this.resources.find(r => r.id === resourceId);
    return resource ? resource.name : 'Unbekannter Raum';
  }

  toggleResourceVisibility(resourceId: string): void {
    if (this.visibleResources.has(resourceId)) {
      this.visibleResources.delete(resourceId);
    } else {
      this.visibleResources.add(resourceId);
    }
  }

  isResourceVisible(resourceId: string): boolean {
    return this.visibleResources.has(resourceId);
  }

  getVisibleResources(): Resource[] {
    return this.resources.filter(resource => this.visibleResources.has(resource.id));
  }

  onSlotMouseDown(date: Date, slot: string, resource?: Resource, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
    }
    this.isSelecting = true;
    this.selectionStart = { date, slot, resource };
    this.selectionEnd = { date, slot, resource };
    this.updateSelectedSlots();
  }

  onSlotMouseEnter(date: Date, slot: string, resource?: Resource): void {
    if (this.isSelecting && this.selectionStart) {
      if (!resource || !this.selectionStart.resource || resource.id === this.selectionStart.resource.id) {
        this.selectionEnd = { date, slot, resource: resource || this.selectionStart.resource };
        this.updateSelectedSlots();
      }
    }
  }

  onSlotMouseUp(date: Date, slot: string, resource?: Resource): void {
    if (this.isSelecting) {
      this.isSelecting = false;
      this.selectionEnd = { date, slot, resource: resource || this.selectionStart?.resource };

      if (this.selectionStart && this.selectionEnd) {
        this.selectedDate = this.selectionStart.date;
        this.selectedResource = this.selectionStart.resource || null;
        this.selectDate(this.selectionStart.date, undefined, this.selectionStart.resource);
      }
    }
  }

  updateSelectedSlots(): void {
    this.selectedSlots.clear();

    if (!this.selectionStart || !this.selectionEnd) {
      return;
    }

    const startIndex = this.timeSlots.indexOf(this.selectionStart.slot);
    const endIndex = this.timeSlots.indexOf(this.selectionEnd.slot);

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    for (let i = minIndex; i <= maxIndex; i++) {
      const key = this.getSlotKey(this.selectionStart.date, this.timeSlots[i], this.selectionStart.resource);
      this.selectedSlots.add(key);
    }
  }

  getSlotKey(date: Date, slot: string, resource?: Resource): string {
    const dateStr = date.toISOString().split('T')[0];
    const resourceId = resource?.id || 'none';
    return `${dateStr}-${slot}-${resourceId}`;
  }

  isSlotSelected(date: Date, slot: string, resource?: Resource): boolean {
    const key = this.getSlotKey(date, slot, resource);
    return this.selectedSlots.has(key);
  }

  clearSelection(): void {
    this.isSelecting = false;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.selectedSlots.clear();
  }
}