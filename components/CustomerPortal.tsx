
import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, Zap, ShieldCheck, Ticket, Bot, Star, User as UserIcon, Clock, ArrowRight } from 'lucide-react';
import { APIService } from '../backend-simulation';
import { GoogleGenAI } from '@google/genai';
import { User, Booking } from '../types';

interface CustomerPortalProps {
  user: User | null;
  onLoginRequired: () => void;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ user, onLoginRequired }) => {
  const [view, setView] = useState<'SEARCH' | 'BOOKINGS'>('SEARCH');
  const [source, setSource] = useState('New York');
  const [destination, setDestination] = useState('Boston');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [results, setResults] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [sourceSuggestions, setSourceSuggestions] = useState<string[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [bookingStep, setBookingStep] = useState(0); 
  const [aiMessage, setAiMessage] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  
  const dateInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    APIService.getAvailableLocations().then(setAllLocations);
  }, []);

  useEffect(() => {
    if (user && view === 'BOOKINGS') {
      APIService.getAllBookings().then(all => {
        setMyBookings(all.filter(b => b.customerName === user.name));
      });
    }
  }, [user, view]);

  const handleSourceChange = (val: string) => {
    setSource(val);
    if (val.trim()) {
      setSourceSuggestions(allLocations.filter(loc => loc.toLowerCase().includes(val.toLowerCase())));
    } else {
      setSourceSuggestions(allLocations);
    }
  };

  const handleDestChange = (val: string) => {
    setDestination(val);
    if (val.trim()) {
      setDestSuggestions(allLocations.filter(loc => loc.toLowerCase().includes(val.toLowerCase())));
    } else {
      setDestSuggestions(allLocations);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasSearched(true);
    setSourceSuggestions([]);
    setDestSuggestions([]);
    
    const data = await APIService.searchBuses(source.trim(), destination.trim(), date);
    setResults(data);
    setBookingStep(0);
    
    if (data.length > 0) {
      setIsAiLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const resp = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Quick travel tip for ${source} to ${destination} for ${date}. 15 words max.`,
        });
        setAiMessage(resp.text || "Safe travels!");
      } catch {
        setAiMessage("Safe journey!");
      } finally {
        setIsAiLoading(false);
      }
    }
  };

  const toggleSeat = (seat: number) => {
    setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
  };

  const handleBook = async () => {
    if (!user || selectedSeats.length === 0) return;
    try {
      await APIService.createBooking({
        scheduleId: selectedSchedule.id,
        customerName: user.name,
        customerPhone: '555-0199',
        seats: selectedSeats,
        totalAmount: selectedSchedule.fare * selectedSeats.length
      });
      setBookingStep(2);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openCalendar = () => {
    if (dateInputRef.current && 'showPicker' in dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-indigo-900 text-white pt-10 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex bg-white/10 w-fit p-1 rounded-xl mb-12">
            <button onClick={() => setView('SEARCH')} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${view === 'SEARCH' ? 'bg-white text-indigo-900' : 'text-indigo-200'}`}>BUS SEARCH</button>
            <button onClick={() => setView('BOOKINGS')} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${view === 'BOOKINGS' ? 'bg-white text-indigo-900' : 'text-indigo-200'}`}>MY BOOKINGS</button>
          </div>

          {view === 'SEARCH' && (
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-black mb-4">Journey Fast. Journey <span className="text-orange-400">ASAP.</span></h1>
              <p className="text-indigo-100 mb-10 max-w-xl mx-auto font-medium">Book tickets for your next adventure with zero hassle.</p>

              <form onSubmit={handleSearch} className="max-w-5xl mx-auto bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 relative z-[50]">
                {/* FROM FIELD */}
                <div className="flex-1 relative group">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus-within:border-indigo-400 focus-within:bg-white transition-all">
                    <MapPin className="text-slate-400 w-5 h-5" />
                    <div className="text-left flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">From</label>
                      <input 
                        value={source} 
                        onChange={e => handleSourceChange(e.target.value)} 
                        onFocus={() => handleSourceChange(source)}
                        className="w-full bg-transparent border-none focus:outline-none text-slate-900 font-bold" 
                        placeholder="Departure City"
                      />
                    </div>
                  </div>
                  {sourceSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border rounded-xl shadow-2xl z-[60] overflow-hidden">
                      {sourceSuggestions.map(loc => (
                        <button key={loc} type="button" onClick={() => {setSource(loc); setSourceSuggestions([]);}} className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 border-b last:border-0 font-bold text-slate-700">{loc}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* TO FIELD */}
                <div className="flex-1 relative group">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus-within:border-indigo-400 focus-within:bg-white transition-all">
                    <MapPin className="text-slate-400 w-5 h-5" />
                    <div className="text-left flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">To</label>
                      <input 
                        value={destination} 
                        onChange={e => handleDestChange(e.target.value)} 
                        onFocus={() => handleDestChange(destination)}
                        className="w-full bg-transparent border-none focus:outline-none text-slate-900 font-bold" 
                        placeholder="Destination"
                      />
                    </div>
                  </div>
                  {destSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border rounded-xl shadow-2xl z-[60] overflow-hidden">
                      {destSuggestions.map(loc => (
                        <button key={loc} type="button" onClick={() => {setDestination(loc); setDestSuggestions([]);}} className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 border-b last:border-0 font-bold text-slate-700">{loc}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* DATE FIELD - ENHANCED CALENDAR UI */}
                <div 
                  onClick={openCalendar}
                  className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-transparent hover:border-indigo-400 focus-within:border-indigo-400 focus-within:bg-white transition-all cursor-pointer group"
                >
                  <Calendar className="text-slate-400 w-5 h-5 group-hover:text-indigo-600 transition-colors" />
                  <div className="text-left flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                    <input 
                      ref={dateInputRef}
                      type="date" 
                      min={today}
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                      className="w-full bg-transparent border-none focus:outline-none text-slate-900 font-bold cursor-pointer block" 
                    />
                  </div>
                </div>

                <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-black px-10 py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 active:scale-95">
                  <Search className="w-5 h-5" /> Search
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12 pb-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {view === 'SEARCH' ? (
            <>
              {!hasSearched ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[ { icon: ShieldCheck, title: "Secure Booking" }, { icon: Zap, title: "Direct Routes" }, { icon: Star, title: "Premium Seats" } ].map((item, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2rem] border shadow-sm text-center hover:scale-105 transition-all">
                      <div className="bg-indigo-50 w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-indigo-600"><item.icon className="w-8 h-8" /></div>
                      <h3 className="font-black text-slate-900">{item.title}</h3>
                    </div>
                  ))}
                </div>
              ) : bookingStep === 0 ? (
                <>
                  <div className="flex justify-between items-center mb-6 px-2">
                    <h2 className="text-2xl font-black text-slate-900">Available Journeys</h2>
                    <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-3 py-1 rounded-full uppercase tracking-widest">{results.length} Services Found</span>
                  </div>
                  {results.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2rem] border text-center shadow-sm animate-fade-in">
                       <Search className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                       <p className="text-slate-400 font-bold">No buses found for this selection.</p>
                    </div>
                  ) : results.map(service => (
                    <div key={service.id} className="bg-white p-8 rounded-[2rem] border shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row justify-between items-center gap-8 group animate-fade-in">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-100">{service.type.name}</span>
                           <span className="text-xs text-slate-300 font-bold"># {service.bus.plateNumber}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors capitalize">
                          {service.route.source} <ArrowRight className="inline-block w-5 h-5 mx-1 text-slate-300" /> {service.route.destination}
                        </h3>
                        <div className="flex items-center gap-8 mt-6 text-sm font-black">
                          <div><div className="text-[10px] text-slate-400 uppercase mb-1 font-bold">Departure</div>{new Date(service.departureTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                          <div className="flex-1 h-[1px] bg-slate-100 relative min-w-[80px]"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[9px] text-slate-300 italic border rounded-full font-bold">{service.route.duration}</div></div>
                          <div className="text-right"><div className="text-[10px] text-slate-400 uppercase mb-1 font-bold">Arrival</div>{new Date(service.arrivalTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        </div>
                      </div>
                      <div className="text-center md:text-right border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-10 border-slate-100 w-full md:w-52">
                        <p className="text-4xl font-black text-indigo-600">${service.fare}</p>
                        <button onClick={() => {setSelectedSchedule(service); setBookingStep(1);}} className="w-full mt-4 bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-200">Select Seats</button>
                        <p className="text-[10px] font-black text-orange-500 mt-3 uppercase tracking-widest">{service.availableSeats} Available</p>
                      </div>
                    </div>
                  ))}
                </>
              ) : bookingStep === 1 ? (
                <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm animate-fade-in">
                  <button onClick={() => setBookingStep(0)} className="text-indigo-600 font-black text-xs uppercase tracking-widest mb-8 flex items-center gap-2">← Back to Results</button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="flex flex-col items-center bg-slate-50 p-10 rounded-[3.5rem] border-4 border-slate-100">
                       <div className="grid grid-cols-4 gap-4">
                        {Array.from({length: selectedSchedule.type.seats}).map((_, i) => (
                          <button key={i} onClick={() => toggleSeat(i+1)} className={`w-12 h-12 rounded-xl text-xs font-black transition-all ${selectedSeats.includes(i+1) ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white border text-slate-600 hover:border-indigo-300'}`}>{i+1}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-8">
                      <div className="bg-slate-50 p-8 rounded-3xl border">
                        <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2"><UserIcon className="w-4 h-4 text-indigo-600" /> Traveler Info</h4>
                        {user ? (
                           <div className="p-4 bg-white rounded-2xl border border-indigo-100">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Signed in as</p>
                             <p className="font-black text-indigo-900">{user.name}</p>
                           </div>
                        ) : (
                          <button onClick={onLoginRequired} className="w-full bg-indigo-50 text-indigo-600 font-black py-4 rounded-2xl border-2 border-dashed border-indigo-200 hover:bg-indigo-100">Login to Continue</button>
                        )}
                      </div>
                      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl">
                        <div className="flex justify-between font-bold text-slate-400 mb-2 uppercase text-[10px]"><span>Seats:</span><span>{selectedSeats.length} Selected</span></div>
                        <div className="flex flex-wrap gap-2 mb-6">{selectedSeats.map(s => <span key={s} className="bg-white/10 px-3 py-1 rounded-lg text-xs font-black">{s}</span>)}</div>
                        <div className="flex justify-between items-end text-3xl font-black border-t border-white/10 pt-6"><span>Total:</span><span className="text-orange-400">${selectedSeats.length * selectedSchedule.fare}</span></div>
                        <button onClick={() => user ? handleBook() : onLoginRequired()} disabled={selectedSeats.length === 0} className="w-full mt-8 bg-orange-500 py-5 rounded-2xl font-black text-white hover:bg-orange-600 transition-all shadow-xl disabled:bg-slate-700 uppercase tracking-widest">Pay & Book Now</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-20 rounded-[3rem] border text-center animate-fade-in shadow-2xl">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8"><ShieldCheck className="w-12 h-12" /></div>
                  <h2 className="text-4xl font-black text-slate-900 mb-3">Booking Success!</h2>
                  <p className="text-slate-500 mb-10">Ticket for #{selectedSeats.join(', ')} is confirmed.</p>
                  <button onClick={() => {setHasSearched(false); setBookingStep(0); setSelectedSeats([]);}} className="bg-indigo-600 text-white font-black px-12 py-4 rounded-2xl">Book Another Trip</button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {myBookings.length === 0 ? (
                 <div className="bg-white p-12 rounded-[2rem] border text-center text-slate-400 italic">No bookings found.</div>
              ) : myBookings.map((bk: any) => (
                <div key={bk.id} className="bg-white p-6 rounded-2xl border shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-all animate-fade-in">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors"><Ticket className="w-6 h-6" /></div>
                    <div>
                      <h4 className="font-black text-slate-900 capitalize">{bk.routeName}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(bk.bookedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">${bk.totalAmount}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{bk.seats.length} Seats</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm sticky top-24">
            <h3 className="font-black flex items-center gap-2 mb-6 text-indigo-600 uppercase text-[10px] tracking-widest"><Bot className="w-5 h-5" /> Travel Assistant</h3>
            <div className="text-sm text-slate-600 leading-relaxed font-medium min-h-[60px]">
              {isAiLoading ? (
                 <div className="flex items-center gap-2 text-slate-300"><div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" /> Analyzing route...</div>
              ) : (
                aiMessage ? (
                  <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 relative animate-fade-in">
                    <div className="absolute -top-2 left-6 w-4 h-4 bg-indigo-50 border-t border-l border-indigo-100 rotate-45" />
                    {aiMessage}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Search for a bus to see AI tips!</p>
                )
              )}
            </div>
            <div className="mt-10 pt-10 border-t border-slate-50 space-y-5">
               <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all"><Zap className="w-5 h-5" /></div>
                  <div><p className="text-xs font-black text-slate-900">Live Track</p><p className="text-[10px] text-slate-400 font-bold uppercase">GPS Ready</p></div>
               </div>
               <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all"><ShieldCheck className="w-5 h-5" /></div>
                  <div><p className="text-xs font-black text-slate-900">Verified</p><p className="text-[10px] text-slate-400 font-bold uppercase">Safe Journey</p></div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;
