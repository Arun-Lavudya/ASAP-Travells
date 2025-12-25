
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Route as RouteIcon, Bus as BusIcon, Users, TrendingUp, Plus, X, Trash2, Calendar, Edit, Save, Settings, ChevronDown, User as UserIcon, Phone, ArrowRight, ExternalLink, Ticket } from 'lucide-react';
import { User, Bus, Route, Schedule, BusType } from '../types';
import { APIService } from '../backend-simulation';

const AdminPanel: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'FLEET' | 'ROUTES' | 'SCHEDULES' | 'BOOKINGS'>('DASHBOARD');
  const [data, setData] = useState({ stats: { activeBuses: 0, totalRoutes: 0, totalBookings: 0, revenue: 0 }, buses: [], routes: [], schedules: [], bookings: [], busTypes: [] });
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddBusOpen, setIsAddBusOpen] = useState(false);
  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [managingSeats, setManagingSeats] = useState<any>(null);
  const [seatMap, setSeatMap] = useState<any[]>([]);

  // Forms
  // Added operatorId to fix type error when calling APIService.addBus
  const [newBus, setNewBus] = useState({ plateNumber: '', typeId: '1', status: 'ACTIVE' as any, operatorId: user.id });
  const [newRoute, setNewRoute] = useState({ source: '', destination: '', distance: 0, duration: '4h 00m' });
  const [newSchedule, setNewSchedule] = useState({ busId: '', routeId: '', departureTime: '', arrivalTime: '', fare: 0 });
  const [manualBooking, setManualBooking] = useState({ scheduleId: '', customerName: '', customerPhone: '', selectedSeats: [] as number[] });

  const fetchData = async () => {
    setLoading(true);
    const [stats, buses, routes, schedules, bookings, busTypes] = await Promise.all([
      APIService.getDashboardStats(), APIService.getBuses(), APIService.getRoutes(), APIService.getSchedules(), APIService.getAllBookings(), APIService.getBusTypes()
    ]);
    setData({ stats, buses, routes, schedules, bookings, busTypes });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleAction = async (fn: () => Promise<any>) => {
    try {
      await fn();
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleManageSeats = async (schedule: any) => {
    setManagingSeats(schedule);
    const seats = await APIService.getSeatMap(schedule.id);
    setSeatMap(seats);
  };

  const toggleSeat = async (num: number) => {
    await APIService.toggleSeatStatus(managingSeats.id, num);
    const seats = await APIService.getSeatMap(managingSeats.id);
    setSeatMap(seats);
  };

  const handleManualSeatClick = (num: number, status: string) => {
    if (status === 'BOOKED') return;
    setManualBooking(prev => ({
      ...prev,
      selectedSeats: prev.selectedSeats.includes(num) ? prev.selectedSeats.filter(s => s !== num) : [...prev.selectedSeats, num]
    }));
  };

  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trip = data.schedules.find((s: any) => s.id === manualBooking.scheduleId);
    if (!trip) return;

    await handleAction(() => APIService.createBooking({
      scheduleId: manualBooking.scheduleId,
      customerName: manualBooking.customerName,
      customerPhone: manualBooking.customerPhone,
      seats: manualBooking.selectedSeats,
      totalAmount: trip.fare * manualBooking.selectedSeats.length
    }));
    setIsManualBookingOpen(false);
    setManualBooking({ scheduleId: '', customerName: '', customerPhone: '', selectedSeats: [] });
  };

  const currentAddBtn = (() => {
    switch (activeTab) {
      case 'FLEET': return { label: 'Add Bus', onClick: () => setIsAddBusOpen(true) };
      case 'ROUTES': return { label: 'Add Route', onClick: () => setIsAddRouteOpen(true) };
      case 'SCHEDULES': return { label: 'Schedule Trip', onClick: () => setIsAddScheduleOpen(true) };
      default: return { label: 'Manual Booking', onClick: () => setIsManualBookingOpen(true) };
    }
  })();

  const recentBookings = [...data.bookings].sort((a: any, b: any) => b.id.localeCompare(a.id)).slice(0, 5);

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col p-6">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Operations</p>
        <nav className="space-y-1">
          {[{ id: 'DASHBOARD', icon: LayoutDashboard, label: 'Dashboard' }, { id: 'FLEET', icon: BusIcon, label: 'Fleet' }, { id: 'ROUTES', icon: RouteIcon, label: 'Routes' }, { id: 'SCHEDULES', icon: Calendar, label: 'Trips' }, { id: 'BOOKINGS', icon: Users, label: 'Bookings' }].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{activeTab === 'DASHBOARD' ? 'Operations Overview' : activeTab}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">ASAP Travels Management Suite</p>
          </div>
          <button onClick={currentAddBtn.onClick} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> {currentAddBtn.label}
          </button>
        </header>

        {loading ? <div className="flex flex-col items-center justify-center h-64 gap-4"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /> <p className="text-sm font-bold text-slate-400">Syncing with server...</p></div> : (
          <div className="space-y-8 animate-fade-in">
            {activeTab === 'DASHBOARD' && (
              <div className="space-y-8">
                {/* Linked Stat Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl border shadow-sm flex justify-between group cursor-default">
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Revenue</p><p className="text-2xl font-black text-slate-900">₹{data.stats.revenue}</p></div>
                    <div className="text-green-600 p-3 bg-green-50 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
                  </div>

                  <button onClick={() => setActiveTab('FLEET')} className="bg-white p-6 rounded-2xl border shadow-sm flex justify-between group hover:shadow-md hover:border-indigo-200 transition-all text-left">
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Fleet Size</p><p className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{data.stats.activeBuses}</p></div>
                    <div className="text-indigo-600 p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors"><BusIcon className="w-6 h-6" /></div>
                  </button>

                  <button onClick={() => setActiveTab('ROUTES')} className="bg-white p-6 rounded-2xl border shadow-sm flex justify-between group hover:shadow-md hover:border-orange-200 transition-all text-left">
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Active Routes</p><p className="text-2xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">{data.stats.totalRoutes}</p></div>
                    <div className="text-orange-600 p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors"><RouteIcon className="w-6 h-6" /></div>
                  </button>

                  <button onClick={() => setActiveTab('BOOKINGS')} className="bg-white p-6 rounded-2xl border shadow-sm flex justify-between group hover:shadow-md hover:border-blue-200 transition-all text-left">
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Bookings</p><p className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{data.stats.totalBookings}</p></div>
                    <div className="text-blue-600 p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors"><Users className="w-6 h-6" /></div>
                  </button>
                </div>

                {/* Recent Bookings Widget */}
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h3 className="font-black text-slate-900 flex items-center gap-2"><Ticket className="w-5 h-5 text-indigo-600" /> Recent Bookings</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Live transaction feed</p>
                    </div>
                    <button onClick={() => setActiveTab('BOOKINGS')} className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline">
                      View All Bookings <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="divide-y">
                    {recentBookings.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 italic">No bookings recorded yet.</div>
                    ) : (
                      recentBookings.map((bk: any) => (
                        <div key={bk.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                              <UserIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{bk.customerName}</p>
                              <p className="text-[10px] text-slate-400 font-medium uppercase">{bk.routeName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900">₹{bk.totalAmount}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{bk.seats.length} Seats</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {recentBookings.length > 0 && (
                    <div className="p-4 bg-slate-50 border-t text-center">
                      <p className="text-[10px] text-slate-400 font-bold">Showing latest 5 bookings. Switch to Bookings tab for full history.</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions / Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200">
                    <h4 className="font-black text-lg mb-2">Fleet Performance</h4>
                    <p className="text-indigo-200 text-sm mb-6">Manage your resources and ensure high availability across all routes.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setIsAddBusOpen(true)} className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left transition-colors">
                        <BusIcon className="w-5 h-5 mb-2 text-indigo-300" />
                        <p className="text-xs font-bold">New Fleet</p>
                      </button>
                      <button onClick={() => setIsAddScheduleOpen(true)} className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left transition-colors">
                        <Calendar className="w-5 h-5 mb-2 text-indigo-300" />
                        <p className="text-xs font-bold">Schedule Trip</p>
                      </button>
                    </div>
                  </div>
                  <div className="bg-orange-500 rounded-2xl p-6 text-white shadow-xl shadow-orange-100">
                    <h4 className="font-black text-lg mb-2">Expansion Goals</h4>
                    <p className="text-orange-100 text-sm mb-6">Currently covering {data.stats.totalRoutes} unique paths. Expand your network to grow revenue.</p>
                    <button onClick={() => setIsAddRouteOpen(true)} className="w-full bg-white text-orange-600 font-bold py-3 rounded-xl shadow-md hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
                      <RouteIcon className="w-4 h-4" /> Add New Territory
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'FLEET' && (
              <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 uppercase text-[10px] font-black tracking-widest text-slate-500 border-b">
                    <tr><th className="p-4">Plate</th><th className="p-4">Type</th><th className="p-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.buses.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-slate-400 italic">No buses in fleet.</td></tr> : data.buses.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold">{b.plateNumber}</td><td className="p-4 text-slate-500 font-medium">{b.typeName}</td>
                        <td className="p-4 text-right"><button onClick={() => handleAction(() => APIService.deleteBus(b.id))} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'ROUTES' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.routes.length === 0 ? <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 text-slate-400 italic">No routes defined.</div> : data.routes.map((r: any) => (
                  <div key={r.id} className="bg-white p-6 rounded-2xl border shadow-sm relative group hover:shadow-md transition-all">
                    <button onClick={() => handleAction(() => APIService.deleteRoute(r.id))} className="absolute top-4 right-4 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    <div className="font-black text-slate-900 mb-1">{r.source} → {r.destination}</div>
                    <div className="text-xs text-slate-400 font-bold tracking-widest uppercase">{r.distance} KM | {r.duration}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'SCHEDULES' && (
              <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 uppercase text-[10px] font-black tracking-widest text-slate-500 border-b">
                    <tr><th className="p-4">Route</th><th className="p-4">Timing</th><th className="p-4">Fare</th><th className="p-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.schedules.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No trips scheduled.</td></tr> : data.schedules.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold">{s.routeName}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-700">{new Date(s.departureTime).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(s.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="p-4 font-black text-indigo-600">₹{s.fare}</td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button onClick={() => handleManageSeats(s)} className="p-2 text-slate-400 hover:text-orange-500 transition-colors" title="Manage Seats"><Users className="w-4 h-4" /></button>
                          <button onClick={() => setEditingTrip(s)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit Trip"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleAction(() => APIService.deleteSchedule(s.id))} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Cancel Trip"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'BOOKINGS' && (
              <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 uppercase text-[10px] font-black tracking-widest text-slate-500 border-b">
                    <tr><th className="p-4">Booking ID</th><th className="p-4">Customer</th><th className="p-4">Trip</th><th className="p-4">Seats</th><th className="p-4">Total</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.bookings.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No bookings found.</td></tr> : data.bookings.map((bk: any) => (
                      <tr key={bk.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono text-[10px] font-bold text-indigo-600">{bk.id}</td>
                        <td className="p-4">
                          <div className="font-bold">{bk.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{bk.customerPhone}</div>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-600">{bk.routeName}</td>
                        <td className="p-4"><div className="flex gap-1">{bk.seats.map((s: number) => <span key={s} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-black">{s}</span>)}</div></td>
                        <td className="p-4 font-black text-slate-900">₹{bk.totalAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {isAddBusOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-fade-in">
            <h3 className="text-xl font-black mb-6">Add New Bus</h3>
            <form onSubmit={e => { e.preventDefault(); handleAction(() => APIService.addBus(newBus)).then(() => setIsAddBusOpen(false)); }} className="space-y-4">
              <input required value={newBus.plateNumber} onChange={e => setNewBus({ ...newBus, plateNumber: e.target.value })} className="w-full border p-4 rounded-xl text-sm" placeholder="Plate Number (e.g., ASAP-101)" />
              <select className="w-full border p-4 rounded-xl text-sm bg-slate-50 font-bold" value={newBus.typeId} onChange={e => setNewBus({ ...newBus, typeId: e.target.value })}>
                {data.busTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.seats} Seats)</option>)}
              </select>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Confirm Add to Fleet</button>
              <button type="button" onClick={() => setIsAddBusOpen(false)} className="w-full text-slate-400 font-bold py-2">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {isAddRouteOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-fade-in">
            <h3 className="text-xl font-black mb-6">Create New Route</h3>
            <form onSubmit={e => { e.preventDefault(); handleAction(() => APIService.addRoute(newRoute)).then(() => setIsAddRouteOpen(false)); }} className="space-y-4">
              <input required value={newRoute.source} onChange={e => setNewRoute({ ...newRoute, source: e.target.value })} className="w-full border p-4 rounded-xl text-sm" placeholder="Pickup City" />
              <input required value={newRoute.destination} onChange={e => setNewRoute({ ...newRoute, destination: e.target.value })} className="w-full border p-4 rounded-xl text-sm" placeholder="Drop City" />
              <input required type="number" onChange={e => setNewRoute({ ...newRoute, distance: parseInt(e.target.value) })} className="w-full border p-4 rounded-xl text-sm" placeholder="Distance KM" />
              <button type="submit" className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-orange-600 transition-all">Confirm Route</button>
              <button type="button" onClick={() => setIsAddRouteOpen(false)} className="w-full text-slate-400 font-bold py-2">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {isAddScheduleOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-fade-in">
            <h3 className="text-xl font-black mb-6">Schedule Trip</h3>
            <form onSubmit={e => { e.preventDefault(); handleAction(() => APIService.addSchedule(newSchedule)).then(() => setIsAddScheduleOpen(false)); }} className="space-y-4">
              <select required className="w-full border p-3 rounded-xl text-sm font-bold bg-slate-50" onChange={e => setNewSchedule({ ...newSchedule, busId: e.target.value })}><option value="">Select Assigned Bus</option>{data.buses.map((b: any) => <option key={b.id} value={b.id}>{b.plateNumber} ({b.typeName})</option>)}</select>
              <select required className="w-full border p-3 rounded-xl text-sm font-bold bg-slate-50" onChange={e => setNewSchedule({ ...newSchedule, routeId: e.target.value })}><option value="">Select Route</option>{data.routes.map((r: any) => <option key={r.id} value={r.id}>{r.source} → {r.destination}</option>)}</select>
              <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Departure</label><input type="datetime-local" required className="w-full border p-3 rounded-xl text-sm" onChange={e => setNewSchedule({ ...newSchedule, departureTime: e.target.value })} /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Arrival</label><input type="datetime-local" required className="w-full border p-3 rounded-xl text-sm" onChange={e => setNewSchedule({ ...newSchedule, arrivalTime: e.target.value })} /></div>
              <input type="number" required className="w-full border p-3 rounded-xl text-sm" placeholder="Fare Per Ticket (₹)" onChange={e => setNewSchedule({ ...newSchedule, fare: parseFloat(e.target.value) })} />
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Create Trip Instance</button>
              <button type="button" onClick={() => setIsAddScheduleOpen(false)} className="w-full text-slate-400 font-bold py-2">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {isManualBookingOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] p-8 animate-fade-in flex flex-col max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div><h3 className="text-2xl font-black">Agent Manual Booking</h3><p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Entry for offline customers</p></div>
              <button onClick={() => setIsManualBookingOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleManualBookingSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12 overflow-y-auto pr-4">
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border">
                  <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Trip Details</h4>
                  <select required className="w-full border p-4 rounded-xl text-sm font-bold mb-4" value={manualBooking.scheduleId} onChange={async (e) => {
                    const sid = e.target.value;
                    setManualBooking({ ...manualBooking, scheduleId: sid, selectedSeats: [] });
                    if (sid) { const sm = await APIService.getSeatMap(sid); setSeatMap(sm); }
                  }}>
                    <option value="">-- Choose a Scheduled Trip --</option>
                    {data.schedules.map((s: any) => <option key={s.id} value={s.id}>{s.routeName} ({new Date(s.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</option>)}
                  </select>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border">
                  <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2"><UserIcon className="w-4 h-4" /> Customer Info</h4>
                  <div className="space-y-3">
                    <input required className="w-full border p-4 rounded-xl text-sm" placeholder="Full Name" value={manualBooking.customerName} onChange={e => setManualBooking({ ...manualBooking, customerName: e.target.value })} />
                    <input required className="w-full border p-4 rounded-xl text-sm" placeholder="Phone Number" value={manualBooking.customerPhone} onChange={e => setManualBooking({ ...manualBooking, customerPhone: e.target.value })} />
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-2xl">
                  <div className="flex justify-between font-bold mb-1"><span>Selected Seats:</span> <span className="text-orange-400">{manualBooking.selectedSeats.join(', ') || 'None'}</span></div>
                  <div className="flex justify-between items-end border-t border-slate-700 mt-4 pt-4">
                    <span className="text-slate-400 text-sm font-bold uppercase">Total Fare</span>
                    <span className="text-3xl font-black">₹{manualBooking.scheduleId ? (data.schedules.find((s: any) => s.id === manualBooking.scheduleId)?.fare || 0) * manualBooking.selectedSeats.length : 0}</span>
                  </div>
                  <button type="submit" disabled={!manualBooking.scheduleId || manualBooking.selectedSeats.length === 0} className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl mt-6 transition-all shadow-lg shadow-orange-900/20">Confirm Manual Booking</button>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <h4 className="font-black text-slate-400 mb-6 uppercase tracking-widest text-[10px]">Seat Selection</h4>
                {manualBooking.scheduleId ? (
                  <div className="bg-slate-50 p-8 rounded-[3.5rem] border-4 border-slate-100 grid grid-cols-4 gap-4 w-full max-w-sm">
                    {seatMap.map(s => (
                      <button type="button" key={s.id} disabled={s.status === 'BOOKED'} onClick={() => handleManualSeatClick(s.seatNumber, s.status)} className={`w-12 h-12 rounded-xl text-xs font-black transition-all transform active:scale-95 ${s.status === 'BOOKED' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : manualBooking.selectedSeats.includes(s.seatNumber) ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'bg-white border hover:border-indigo-300 text-slate-600'}`}>
                        {s.seatNumber}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 italic border-2 border-dashed border-slate-100 w-full rounded-[3.5rem] p-12 text-center">
                    <Calendar className="w-12 h-12 mb-4 opacity-10" />
                    Select a trip to see seat availability
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTrip && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-fade-in shadow-2xl">
            <h3 className="text-xl font-black mb-6">Edit Trip Data</h3>
            <div className="space-y-4">
              <div><label className="text-[10px] font-black text-slate-400 uppercase">Departure</label><input type="datetime-local" value={editingTrip.departureTime} onChange={e => setEditingTrip({ ...editingTrip, departureTime: e.target.value })} className="w-full border p-3 rounded-xl text-sm" /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase">Arrival</label><input type="datetime-local" value={editingTrip.arrivalTime} onChange={e => setEditingTrip({ ...editingTrip, arrivalTime: e.target.value })} className="w-full border p-3 rounded-xl text-sm" /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase">Fare (₹)</label><input type="number" value={editingTrip.fare} onChange={e => setEditingTrip({ ...editingTrip, fare: parseFloat(e.target.value) })} className="w-full border p-3 rounded-xl text-sm" /></div>
              <button onClick={() => handleAction(() => APIService.updateSchedule(editingTrip.id, editingTrip)).then(() => setEditingTrip(null))} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg">Save Updated Details</button>
              <button onClick={() => setEditingTrip(null)} className="w-full text-slate-400 font-bold py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {managingSeats && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 animate-fade-in flex flex-col max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black">Seat Lockdown Manager</h3><button onClick={() => setManagingSeats(null)} className="p-2 bg-slate-100 rounded-full"><X className="w-6 h-6" /></button></div>
            <p className="text-xs text-slate-500 mb-8 font-black uppercase tracking-widest text-center bg-indigo-50 p-3 rounded-xl text-indigo-700">Manually Block seats for {managingSeats.routeName}</p>
            <div className="flex-1 overflow-y-auto bg-slate-50 p-10 rounded-[3.5rem] border-4 border-slate-100 grid grid-cols-4 md:grid-cols-6 gap-4">
              {seatMap.map(s => (
                <button key={s.id} onClick={() => toggleSeat(s.seatNumber)} className={`w-14 h-14 rounded-2xl text-[10px] font-black shadow-sm transition-all transform active:scale-95 ${s.status === 'AVAILABLE' ? 'bg-white text-slate-600 border hover:border-indigo-400' : s.bookingId ? 'bg-indigo-600 text-white' : 'bg-red-500 text-white'}`}>
                  {s.seatNumber}<br />{s.bookingId ? 'BOOKED' : s.status === 'AVAILABLE' ? 'AVAIL' : 'BLOCKED'}
                </button>
              ))}
            </div>
            <button onClick={() => setManagingSeats(null)} className="mt-8 bg-slate-900 text-white py-5 rounded-[1.5rem] font-black hover:bg-slate-800 transition-all">Exit Management Console</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
