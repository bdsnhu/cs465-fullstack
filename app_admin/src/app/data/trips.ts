import { Trip } from '../models/trip';

// Sample data in the same shape the API returns. Used by the unit tests as mock data.
export const trips: Trip[] = [
  {
    "code": "GALR261114",
    "name": "Gale Reef",
    "length": "4 nights / 5 days",
    "start": "2026-11-14T08:00:00Z",
    "resort": "Emerald Bay, 3 stars",
    "perPerson": "799.00",
    "image": "images/reef1.jpg",
    "description": "<p>Gale Reef: Sed et augue lorem. In sit amet placerat arcu. Mauris volutpat ipsum ac justo mollis vel vestibulum orci gravida. Vestibulum sit amet porttitor odio. Nulla facilisi. Fusce at pretium felis.</p><p>Gale Reef: Sed consequat libero ut turpis venenatis ut aliquam risus semper. Etiam convallis mi vel risus pretium sodales. Etiam nunc lorem ullamcorper vitae laoreet.</p>"
  },
  {
    "code": "DAWR261215",
    "name": "Dawson's Reef",
    "length": "4 nights / 5 days",
    "start": "2026-12-15T08:00:00Z",
    "resort": "Blue Lagoon, 4 stars",
    "perPerson": "1199.00",
    "image": "images/reef2.jpg",
    "description": "<p>Dawson's Reef: Integer magna leo, posuere et dignissim vitae, porttitor at odio. Pellentesque a metus nec magna placerat volutpat. Nunc nisi mi, elementum sit amet aliquet quis, tristique quis nisl. Curabitur odio lacus, blandit ut hendrerit</p><p>Dawson's Reef: vulputate, vulputate at est. Morbi aliquet viverra metus eu consectetur. In lorem dui, elementum sit amet convallis ac, tincidunt vel sapien.</p>"
  },
  {
    "code": "CLAR270121",
    "name": "Claire's Reef",
    "length": "4 nights / 5 days",
    "start": "2027-01-21T08:00:00Z",
    "resort": "Coral Sands, 5 stars",
    "perPerson": "1999.00",
    "image": "images/reef3.jpg",
    "description": "<p>Claire's Reef: Donec sed felis risus. Nulla facilisi. Donec a orci tellus, et auctor odio. Fusce ac orci nibh, quis semper arcu. Cras orci neque, euismod et accumsan ac, sagittis molestie lorem. Proin odio sapien, elementum at tempor non.</p><p>Claire's Reef: Vulputate eget libero. In hac habitasse platea dictumst. Integer purus justo, egestas eu consectetur eu, cursus in tortor. Quisque nec nunc ac mi ultrices iaculis.</p>"
  }
];
