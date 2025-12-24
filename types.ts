
export type Role = 'ADMIN' | 'OPERATOR' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string; // In a real app, this wouldn't be sent to the frontend
}

export interface BusType {
  id: string;
  name: string;
  seats: number;
  features: string[];
}

export interface Bus {
  id: string;
  plateNumber: string;
  typeId: string;
  operatorId: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

export interface Route {
  id: string;
  source: string;
  destination: string;
  distance: number;
  duration: string;
}

export interface Schedule {
  id: string;
  busId: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
}

export interface Inventory {
  id: string;
  scheduleId: string;
  seatNumber: number;
  status: 'AVAILABLE' | 'BOOKED' | 'HELD';
  bookingId?: string;
}

export interface Booking {
  id: string;
  scheduleId: string;
  customerName: string;
  customerPhone: string;
  seats: number[];
  totalAmount: number;
  bookedAt: string;
  status: 'CONFIRMED' | 'CANCELLED';
}

export interface AppState {
  view: 'CUSTOMER' | 'ADMIN' | 'AUTH';
  currentUser: User | null;
}
