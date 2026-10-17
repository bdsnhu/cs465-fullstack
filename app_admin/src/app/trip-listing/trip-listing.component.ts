import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Trip } from '../models/trip';
import { TripDataService } from '../services/trip-data.service';
import { AuthenticationService } from '../services/authentication.service';
import { TripCardComponent } from '../trip-card/trip-card.component';

@Component({
  selector: 'app-trip-listing',
  standalone: true,
  imports: [CommonModule, TripCardComponent],
  templateUrl: './trip-listing.component.html',
  styleUrl: './trip-listing.component.css',
  providers: [TripDataService]
})
export class TripListingComponent implements OnInit {
  trips: Trip[] = [];
  message = '';
  errorMessage = '';

  constructor(
    private tripDataService: TripDataService,
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  // The Add Trip button is only shown to a logged-in admin
  public isLoggedIn(): boolean {
    return this.authenticationService.isLoggedIn();
  }

  ngOnInit(): void {
    this.getTrips();
  }

  public addTrip(): void {
    this.router.navigate(['add-trip']);
  }

  // Called when a card's Delete button is clicked
  public onDelete(trip: Trip): void {
    if (!confirm(`Delete "${trip.name}" (${trip.code})? This cannot be undone.`)) {
      return;
    }
    this.tripDataService.deleteTrip(trip.code).subscribe({
      next: () => this.getTrips(),
      error: (error: any) => {
        this.errorMessage = error?.status === 401
          ? 'Your session has expired. Please log in again.'
          : `Could not delete ${trip.code}: ${error?.error?.message ?? error.message}`;
      }
    });
  }

  private getTrips(): void {
    this.tripDataService.getTrips().subscribe({
      next: (value: Trip[]) => {
        this.trips = value;
        this.errorMessage = '';
        this.message = value.length > 0
          ? `There are ${value.length} trips available.`
          : 'There were no trips retrieved from the database.';
      },
      error: (error: any) => {
        this.trips = [];
        this.message = '';
        this.errorMessage = 'Could not reach the Travlr API. Is the Express server running on port 3000?';
        console.log('Error: ' + error.message);
      }
    });
  }
}
