import { Bus, Route, Schedule, Inventory, Booking, User, BusType } from './types';

const STORAGE_KEY = 'ASAP_TRAVELS_DB_V3';

// --- UTILS FOR DYNAMIC DATES ---
const todayStr = new Date().toISOString().split('T')[0];
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

// --- INITIAL MOCK DATA ---
const defaultData = {
  users: [
    { id: 'u1', name: 'Admin User', email: 'admin@asap.com', password: 'password123', role: 'ADMIN' },
    { id: 'u2', name: 'Staff Member', email: 'staff@asap.com', password: 'password123', role: 'OPERATOR' },
    { id: 'u3', name: 'John Doe', email: 'customer@test.com', password: 'password123', role: 'CUSTOMER' }
  ] as User[],
  busTypes: [
    { id: '1', name: 'Scania AC Multi-Axle', seats: 40, features: ['AC', 'WiFi', 'Charging', 'Water', 'CCTV'] },
    { id: '2', name: 'Non-AC Regular Seater', seats: 36, features: ['Emergency Exit', 'Overhead Rack'] },
    { id: '3', name: 'Volvo Luxury AC Sleeper', seats: 30, features: ['AC', 'WiFi', 'Blanket', 'Pillow', 'Individual TV'] }
  ] as BusType[],
  buses: [
    { id: 'b1', plateNumber: 'TS-09-AP-1234', typeId: '1', operatorId: 'u1', status: 'ACTIVE' },
    { id: 'b2', plateNumber: 'KA-01-BT-5678', typeId: '3', operatorId: 'u1', status: 'ACTIVE' },
    { id: 'b3', plateNumber: 'TS-07-UC-9012', typeId: '2', operatorId: 'u2', status: 'ACTIVE' }
  ] as Bus[],
  routes: [
    { id: 'r1', source: 'Hyderabad', destination: 'Banglore', distance: 575, duration: '9h 15m' },
    { id: 'r2', source: 'Banglore', destination: 'Hyderabad', distance: 575, duration: '9h 30m' }
  ] as Route[],
  schedules: [
    { id: 's1', busId: 'b1', routeId: 'r1', departureTime: `${todayStr}T21:00:00`, arrivalTime: `${tomorrowStr}T06:15:00`, fare: 1250 },
    { id: 's2', busId: 'b2', routeId: 'r1', departureTime: `${todayStr}T22:30:00`, arrivalTime: `${tomorrowStr}T07:45:00`, fare: 1850 },
    { id: 's3', busId: 'b3', routeId: 'r2', departureTime: `${todayStr}T20:30:00`, arrivalTime: `${tomorrowStr}T06:00:00`, fare: 850 },
    { id: 's4', busId: 'b1', routeId: 'r2', departureTime: `${tomorrowStr}T21:15:00`, arrivalTime: `${tomorrowStr}T06:30:00`, fare: 1300 }
  ] as Schedule[],
  inventory: [] as Inventory[],
  bookings: [] as Booking[]
};

// --- DATABASE STATE ---
let db = (() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved DB, resetting to defaults.");
    }
  }
  return JSON.parse(JSON.stringify(defaultData));
})();

const saveToStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

const generateInventoryForSchedule = (s: Schedule) => {
  const bus = db.buses.find((b: Bus) => b.id === s.busId);
  const type = db.busTypes.find((t: BusType) => t.id === bus?.typeId);
  if (type) {
    if (db.inventory.some((i: Inventory) => i.scheduleId === s.id)) return;
    for (let i = 1; i <= type.seats; i++) {
      db.inventory.push({
        id: `i-${s.id}-${i}`,
        scheduleId: s.id,
        seatNumber: i,
        status: 'AVAILABLE'
      });
    }
  }
};

db.schedules.forEach(generateInventoryForSchedule);
saveToStorage();

export const APIService = {
  login: async (email: string, password: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 800));
    const user = db.users.find((u: User) => u.email === email && u.password === password);
    if (!user) throw new Error("Invalid email or password");
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 800));
    const exists = db.users.some((u: User) => u.email === email);
    if (exists) throw new Error("A user with this email already exists");

    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      password,
      role: 'CUSTOMER'
    };

    db.users.push(newUser);
    saveToStorage();

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword as User;
  },

  getRoutes: async () => [...db.routes],
  getBusTypes: async () => [...db.busTypes],

  getAvailableLocations: async () => {
    const locations = new Set<string>();
    db.routes.forEach((r: Route) => {
      locations.add(r.source);
      locations.add(r.destination);
    });
    return Array.from(locations).sort();
  },

  getSchedules: async () => db.schedules.map((s: Schedule) => {
    const r = db.routes.find((rt: Route) => rt.id === s.routeId);
    const b = db.buses.find((bus: Bus) => bus.id === s.busId);
    return {
      ...s,
      routeName: r ? `${r.source} to ${r.destination}` : 'Unknown Route',
      plateNumber: b ? b.plateNumber : 'Unknown Bus'
    };
  }),

  getBuses: async () => db.buses.map((b: Bus) => ({
    ...b,
    typeName: db.busTypes.find((t: BusType) => t.id === b.typeId)?.name || 'Unknown'
  })),

  addBus: async (bus: Omit<Bus, 'id'>) => {
    const newBus = { ...bus, id: `b-${Date.now()}` } as Bus;
    db.buses.push(newBus);
    saveToStorage();
    return newBus;
  },

  deleteBus: async (id: string) => {
    const idx = db.buses.findIndex((b: Bus) => b.id === id);
    if (idx > -1) {
      const scheduleIds = db.schedules.filter((s: Schedule) => s.busId === id).map((s: Schedule) => s.id);
      db.inventory = db.inventory.filter((i: Inventory) => !scheduleIds.includes(i.scheduleId));
      db.bookings = db.bookings.filter((b: Booking) => !scheduleIds.includes(b.scheduleId));
      db.schedules = db.schedules.filter((s: Schedule) => s.busId !== id);
      db.buses.splice(idx, 1);
      saveToStorage();
      return true;
    }
    return false;
  },

  addRoute: async (route: Omit<Route, 'id'>) => {
    const newRoute = { ...route, id: `r-${Date.now()}` } as Route;
    db.routes.push(newRoute);
    saveToStorage();
    return newRoute;
  },

  deleteRoute: async (id: string) => {
    const idx = db.routes.findIndex((r: Route) => r.id === id);
    if (idx > -1) {
      const scheduleIds = db.schedules.filter((s: Schedule) => s.routeId === id).map((s: Schedule) => s.id);
      db.inventory = db.inventory.filter((i: Inventory) => !scheduleIds.includes(i.scheduleId));
      db.bookings = db.bookings.filter((b: Booking) => !scheduleIds.includes(b.scheduleId));
      db.schedules = db.schedules.filter((s: Schedule) => s.routeId !== id);
      db.routes.splice(idx, 1);
      saveToStorage();
      return true;
    }
    return false;
  },

  addSchedule: async (schedule: Omit<Schedule, 'id'>) => {
    const newSchedule = { ...schedule, id: `s-${Date.now()}` } as Schedule;
    db.schedules.push(newSchedule);
    generateInventoryForSchedule(newSchedule);
    saveToStorage();
    return newSchedule;
  },

  updateSchedule: async (id: string, updates: Partial<Schedule>) => {
    const idx = db.schedules.findIndex((s: Schedule) => s.id === id);
    if (idx > -1) {
      db.schedules[idx] = { ...db.schedules[idx], ...updates };
      saveToStorage();
      return db.schedules[idx];
    }
    throw new Error("Trip not found");
  },

  deleteSchedule: async (id: string) => {
    const idx = db.schedules.findIndex((s: Schedule) => s.id === id);
    if (idx > -1) {
      db.inventory = db.inventory.filter((i: Inventory) => i.scheduleId !== id);
      db.bookings = db.bookings.filter((b: Booking) => b.scheduleId !== id);
      db.schedules.splice(idx, 1);
      saveToStorage();
      return true;
    }
    return false;
  },

  toggleSeatStatus: async (scheduleId: string, seatNumber: number) => {
    const item = db.inventory.find((i: Inventory) => i.scheduleId === scheduleId && i.seatNumber === seatNumber);
    if (item) {
      if (item.status === 'AVAILABLE') item.status = 'BOOKED';
      else if (item.status === 'BOOKED' && !item.bookingId) item.status = 'AVAILABLE';
      saveToStorage();
      return item;
    }
    throw new Error("Seat not found");
  },

  searchBuses: async (source: string, dest: string, date: string) => {
    const sTerm = source.toLowerCase().trim();
    const dTerm = dest.toLowerCase().trim();

    // Find matching routes
    const routeIds = db.routes
      .filter((r: Route) => r.source.toLowerCase().trim() === sTerm && r.destination.toLowerCase().trim() === dTerm)
      .map((r: Route) => r.id);

    // Find schedules for those routes on that date
    const matched = db.schedules.filter((s: Schedule) => {
      const matchesRoute = routeIds.includes(s.routeId);
      const matchesDate = s.departureTime.split('T')[0] === date;
      return matchesRoute && matchesDate;
    });

    return matched.map((s: Schedule) => {
      const bus = db.buses.find((b: Bus) => b.id === s.busId);
      const type = db.busTypes.find((t: BusType) => t.id === bus?.typeId);
      const route = db.routes.find((r: Route) => r.id === s.routeId);
      const availableSeats = db.inventory.filter((i: Inventory) => i.scheduleId === s.id && i.status === 'AVAILABLE').length;
      return { ...s, bus, type, route, availableSeats };
    });
  },

  getSeatMap: async (scheduleId: string) => [...db.inventory.filter((i: Inventory) => i.scheduleId === scheduleId)],

  createBooking: async (bookingData: Omit<Booking, 'id' | 'bookedAt' | 'status'>) => {
    const available = db.inventory.filter((i: Inventory) => i.scheduleId === bookingData.scheduleId && bookingData.seats.includes(i.seatNumber) && i.status === 'AVAILABLE');
    if (available.length !== bookingData.seats.length) throw new Error("Some selected seats are no longer available.");

    const booking: Booking = { ...bookingData, id: `bk-${Date.now()}`, bookedAt: new Date().toISOString(), status: 'CONFIRMED' };
    db.inventory.forEach((i: Inventory) => {
      if (i.scheduleId === bookingData.scheduleId && bookingData.seats.includes(i.seatNumber)) {
        i.status = 'BOOKED';
        i.bookingId = booking.id;
      }
    });
    db.bookings.push(booking);
    saveToStorage();
    return booking;
  },

  getDashboardStats: async () => ({
    activeBuses: db.buses.length,
    totalRoutes: db.routes.length,
    totalBookings: db.bookings.length,
    revenue: db.bookings.reduce((sum: number, b: Booking) => sum + b.totalAmount, 0)
  }),

  getAllBookings: async () => db.bookings.map((b: Booking) => {
    const s = db.schedules.find((sc: Schedule) => sc.id === b.scheduleId);
    const r = db.routes.find((rt: Route) => rt.id === s?.routeId);
    return { ...b, routeName: r ? `${r.source} to ${r.destination}` : 'Unknown Route' };
  })
};
