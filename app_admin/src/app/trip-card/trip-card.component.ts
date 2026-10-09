import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Trip } from '../models/trip';

// Renders ONE trip as a Bootstrap card. The listing component passes the trip in
// and is told (via the `deleteRequested` event) when the admin clicks Delete.
@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-card.component.html',
  styleUrl: './trip-card.component.css'
})
export class TripCardComponent {
  @Input('trip') trip!: Trip;
  @Output() deleteRequested = new EventEmitter<Trip>();

  constructor(private router: Router) {}

  // Works whether the stored value is "reef1.jpg" or "images/reef1.jpg"
  get imageSrc(): string {
    return 'assets/images/' + this.trip.image.replace(/^images\//, '');
  }

  editTrip(trip: Trip): void {
    this.router.navigate(['edit-trip', trip.code]);
  }

  deleteTrip(trip: Trip): void {
    this.deleteRequested.emit(trip);
  }
}
