// Shape of one trip as sent to and received from the Express API (/api/trips)
export interface Trip {
  _id?: string;          // assigned by MongoDB
  code: string;          // unique trip code, e.g. GALR261114 (used in the API URL)
  name: string;
  length: string;        // e.g. "4 nights / 5 days"
  start: string;         // ISO 8601 date string
  resort: string;
  perPerson: string;     // price, stored as a string in the database
  image: string;         // image file name under assets/images
  description: string;   // HTML
}
