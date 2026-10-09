import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TripDataService } from '../services/trip-data.service';
import { Trip } from '../models/trip';

@Component({
  selector: 'app-edit-trip',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-trip.component.html',
  styleUrl: './edit-trip.component.css'
})
export class EditTripComponent implements OnInit {
  public editForm!: FormGroup;
  trip!: Trip;
  submitted = false;
  message = '';
  errorMessage = '';
  private tripCode = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private tripDataService: TripDataService
  ) {}

  ngOnInit(): void {
    // The trip code comes from the URL: /edit-trip/:code
    this.tripCode = this.route.snapshot.paramMap.get('code') ?? '';
    if (!this.tripCode) {
      this.router.navigate(['']);
      return;
    }

    this.editForm = this.formBuilder.group({
      _id: [],
      code: [this.tripCode, Validators.required],
      name: ['', Validators.required],
      length: ['', Validators.required],
      start: ['', Validators.required],
      resort: ['', Validators.required],
      perPerson: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      image: ['', Validators.required],
      description: ['', Validators.required]
    });

    this.tripDataService.getTrip(this.tripCode).subscribe({
      next: (value: Trip[]) => {
        if (!value || value.length === 0) {
          this.message = 'No Trip Retrieved!';
          return;
        }
        this.trip = value[0];
        // <input type="date"> needs yyyy-MM-dd, but the API sends a full ISO timestamp
        this.editForm.patchValue({ ...this.trip, start: this.toDateInput(this.trip.start) });
        this.message = 'Trip: ' + this.tripCode + ' retrieved';
      },
      error: (error: any) => {
        this.errorMessage = error.status === 404
          ? `Trip ${this.tripCode} was not found.`
          : 'Could not load the trip from the API.';
        console.log('Error: ' + error.message);
      }
    });
  }

  public onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    if (this.editForm.valid) {
      const { _id, ...trip } = this.editForm.value;
      this.tripDataService.updateTrip(trip, this.tripCode).subscribe({
        next: (value: any) => {
          console.log(value);
          this.router.navigate(['']);
        },
        error: (error: any) => {
          this.errorMessage = error?.error?.message ?? 'The trip could not be updated.';
          console.log('Error: ' + error.message);
        }
      });
    }
  }

  public cancel(): void {
    this.router.navigate(['']);
  }

  // ISO timestamp -> yyyy-MM-dd (UTC, so the date never shifts with the viewer's time zone)
  private toDateInput(iso: string): string {
    return iso ? new Date(iso).toISOString().substring(0, 10) : '';
  }

  // short name to access the form controls from the template
  get f() { return this.editForm.controls; }
}
