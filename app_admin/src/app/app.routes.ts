import { Routes } from '@angular/router';
import { AddTripComponent } from './add-trip/add-trip.component';
import { EditTripComponent } from './edit-trip/edit-trip.component';
import { TripListingComponent } from './trip-listing/trip-listing.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'add-trip', component: AddTripComponent, canActivate: [authGuard] },
  { path: 'edit-trip/:code', component: EditTripComponent, canActivate: [authGuard] },
  { path: '', component: TripListingComponent, pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
