import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RoutePlan, RouteStop, NavigationState } from '../types';
import { Navigation, CheckSquare, ArrowLeft, ArrowRight, CornerUpRight, CornerUpLeft, MapPin, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { fetchDirections } from '../services/googleMapsService';

interface ActiveRouteProps {
  route: RoutePlan;
  onExit: () => void;
}

// TTS Helper
const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.2; 
    window.speechSynthesis.speak(utterance);
  }
};

// Fixed coordinate system for the demo "World"
// In a real Google Maps implementation, these would be Lat/Lng
const generateGeoLocations = (count: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    x: 50 + (Math.random() - 0.5) * 60, // Random spread X
    y: 10 + (i * 25) + (Math.random() * 10) // Progression Y
  }));
};

const ActiveRoute: React.FC<ActiveRouteProps> = ({ route, onExit }) => {
  const [stops, setStops] = useState<RouteStop[]>(route.stops);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Navigation State (from API)
  const [navState, setNavState] = useState<NavigationState | null>(null);
  const [isLoadingNav, setIsLoadingNav] = useState(true);

  // Locations Map (Simulating Geocoded Addresses)
  const stopLocations = useMemo(() => generateGeoLocations(stops.length), [stops.length]);

  // Derived State
  const currentStop = stops[activeIndex];
  const isFinished = activeIndex >= stops.length;
  const progress = Math.round((activeIndex / stops.length) * 100);

  // --- API INTEGRATION: RECALCULATE ROUTE ---
  useEffect(() => {
    if (isFinished) {
        if (!isMuted) speak("Você chegou ao destino final.");
        return;
    }

    const updateNavigation = async () => {
        setIsLoadingNav(true);
        
        // Origin: "Driver's Current Location" (Simulated as previous stop or a virtual start)
        const origin = activeIndex === 0 
            ? { x: 50, y: 0 } 
            : stopLocations[activeIndex - 1];
            
        // Destination: Next Student
        const destination = stopLocations[activeIndex];

        // CALL GOOGLE MAPS API (Simulated)
        const directions = await fetchDirections(origin, destination);
        
        setNavState(directions);
        setIsLoadingNav(false);

        // TRIGGER VOICE INSTRUCTION
        if (!isMuted) {
            const context = currentStop.isSchool ? "Destino" : "Parada";
            speak(`${directions.nextManeuver} ${directions.nextStreet}. Em ${directions.stepDistance}, ${context}: ${currentStop.name}.`);
        }
    };

    updateNavigation();
  }, [activeIndex, isFinished]);


  // --- USER ACTIONS ---

  const handleConfirmStop = () => {
    // Optimistic UI Update
    const newStops = [...stops];
    newStops[activeIndex].status = 'COMPLETED';
    setStops(newStops);
    
    // Advance Queue
    if (activeIndex < stops.length) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handleSkipStop = () => {
    const newStops = [...stops];
    newStops[activeIndex].status = 'SKIPPED';
    setStops(newStops);
    if (!isMuted) speak("Recalculando rota.");
    if (activeIndex < stops.length) {
      setActiveIndex(prev => prev + 1);
    }
  };


  // --- RENDER HELPERS ---

  // Camera Logic: Center the view on the midpoint of the current leg
  const cameraTransform = useMemo(() => {
    if (isFinished || !navState || navState.currentPolyline.length === 0) return {};
    
    // Focus on the end of the current polyline (The Target)
    const target = stopLocations[activeIndex];
    
    return {
        transform: `translate(calc(50vw - ${target.x}%), calc(60vh - ${target.y}%))`,
        transition: 'transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1)'
    };
  }, [activeIndex, navState, isFinished, stopLocations]);


  if (isFinished) {
      return (
        <div className="h-full bg-gray-900 text-white flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/50">
                <CheckSquare size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Rota Concluída!</h1>
            <p className="text-gray-400 mb-8">Todos os alunos foram entregues com segurança.</p>
            <button onClick={onExit} className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-gray-200">
                Voltar ao Menu
            </button>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 relative overflow-hidden font-sans">
        
        {/* =================================================================================
            1. THE MAP LAYER (Google Maps SDK Container)
        ================================================================================= */}
        <div className="absolute inset-0 z-0 bg-[#e5e7eb] pointer-events-none">
            
            {/* Background Texture (Map Tiles Simulation) */}
            <div className="absolute inset-0 opacity-10" style={{ 
                backgroundImage: 'linear-gradient(#9ca3af 1px, transparent 1px), linear-gradient(90deg, #9ca3af 1px, transparent 1px)', 
                backgroundSize: '40px 40px' 
            }}></div>

            {/* The "Camera" Container */}
            <div className="w-full h-full relative will-change-transform origin-center" style={{ ...cameraTransform }}>
                <svg className="absolute overflow-visible top-0 left-0 w-full h-full">
                    
                    {/* A. COMPLETED PATH (Gray) */}
                    <polyline 
                        points={stopLocations.slice(0, activeIndex).map(p => `${p.x}%,${p.y}%`).join(' ')}
                        fill="none"
                        stroke="#9ca3af"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* B. FUTURE STOPS (Straight Lines / As the crow flies) */}
                    <polyline 
                        points={stopLocations.slice(activeIndex).map(p => `${p.x}%,${p.y}%`).join(' ')}
                        fill="none"
                        stroke="#d1d5db"
                        strokeWidth="4"
                        strokeDasharray="8,8"
                        className="opacity-50"
                    />

                    {/* C. ACTIVE API POLYLINE (Blue) - This is the "Directions API" result */}
                    {navState && (
                        <>
                            {/* Outer Glow */}
                            <polyline 
                                points={navState.currentPolyline.map(p => `${p.x}%,${p.y}%`).join(' ')}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="14"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="opacity-30 blur-sm"
                            />
                            {/* Main Path */}
                            <polyline 
                                points={navState.currentPolyline.map(p => `${p.x}%,${p.y}%`).join(' ')}
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </>
                    )}
                </svg>

                {/* D. MARKERS */}
                {stops.map((stop, i) => {
                    const loc = stopLocations[i];
                    const isActive = i === activeIndex;
                    const isPast = i < activeIndex;

                    return (
                        <div 
                            key={stop.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                        >
                            <div className={`
                                relative flex items-center justify-center rounded-full shadow-md
                                ${isActive ? 'w-14 h-14 bg-gray-900 text-white z-30 ring-4 ring-white scale-110' : 
                                  isPast ? 'w-8 h-8 bg-gray-400 text-white z-10' : 
                                  'w-10 h-10 bg-white text-gray-500 border-2 border-gray-300 z-20'}
                            `}>
                                {stop.isSchool ? <MapPin size={isActive ? 20 : 14} /> : <span className="font-bold text-xs">{i + 1}</span>}
                                
                                {isActive && (
                                    <span className="absolute w-full h-full bg-blue-500 rounded-full opacity-20 animate-ping"></span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* E. DRIVER ICON (Fixed at viewport center) */}
            {/* Note: In a real SDK, the camera moves, so the "My Location" dot stays centered. */}
            <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-16 h-16 bg-blue-600 rounded-full border-[5px] border-white shadow-xl flex items-center justify-center">
                    <Navigation size={28} className="text-white fill-current" />
                </div>
            </div>
        </div>

        {/* =================================================================================
            2. TOP PANEL: TURN-BY-TURN INSTRUCTIONS
        ================================================================================= */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-6 bg-gradient-to-b from-black/60 to-transparent">
            <div className="bg-[#1a1a1a] text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-down border border-gray-700">
                
                {/* Maneuver Icon */}
                <div className="bg-gray-700 p-3 rounded-xl shrink-0">
                    {navState?.nextManeuver.includes("direita") ? <CornerUpRight size={32} /> : 
                     navState?.nextManeuver.includes("esquerda") ? <CornerUpLeft size={32} /> :
                     <ArrowRight size={32} />}
                </div>

                {/* Text Instruction */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold bg-blue-600 px-1.5 py-0.5 rounded text-white tracking-wide uppercase">
                             {isLoadingNav ? 'GPS...' : navState?.stepDistance || '0m'}
                        </span>
                    </div>
                    <h2 className="text-lg font-bold leading-tight truncate">
                        {isLoadingNav ? 'Recalculando...' : navState?.nextManeuver}
                    </h2>
                    <p className="text-gray-400 text-sm truncate">
                        {isLoadingNav ? 'Buscando satélites' : navState?.nextStreet}
                    </p>
                </div>

                {/* ETA Stats */}
                <div className="text-right pl-2 border-l border-gray-700">
                    <p className="text-lg font-bold text-green-400 whitespace-nowrap">{navState?.distance || '--'}</p>
                    <p className="text-xs text-gray-500">{navState?.duration || '--'}</p>
                </div>
            </div>

            {/* Top Bar Buttons */}
            <div className="flex justify-between mt-4">
                <button onClick={onExit} className="bg-white/90 backdrop-blur p-2.5 rounded-full shadow-lg text-gray-700 hover:bg-white transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <button onClick={() => setIsMuted(!isMuted)} className={`bg-white/90 backdrop-blur p-2.5 rounded-full shadow-lg transition-colors ${isMuted ? 'text-gray-400' : 'text-blue-600'}`}>
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
            </div>
        </div>

        {/* =================================================================================
            3. BOTTOM SHEET: FLOATING ACTION CARD
        ================================================================================= */}
        <div className="absolute bottom-0 left-0 right-0 z-40 p-4 pb-6 bg-gradient-to-t from-white via-white/80 to-transparent">
            
            {/* Skip Button */}
            {!currentStop.isSchool && (
                <div className="flex justify-end mb-3 mr-2">
                    <button onClick={handleSkipStop} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-full text-xs font-bold border border-red-100 shadow-sm hover:bg-red-100">
                        <AlertTriangle size={12} /> Pular
                    </button>
                </div>
            )}

            {/* The "Card" */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-5 border border-gray-100">
                <div className="flex items-center gap-4 mb-5">
                    
                    {/* Avatar */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                        currentStop.isSchool ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                        {currentStop.isSchool ? <MapPin size={28} /> : <span className="text-2xl font-bold">{currentStop.name.charAt(0)}</span>}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                                {currentStop.isSchool ? 'Destino Final' : `Parada ${activeIndex + 1}`}
                            </span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900 truncate">{currentStop.name.split(' ')[0]}</h3>
                        <p className="text-sm text-gray-500 truncate">{currentStop.address}</p>
                    </div>
                </div>

                {/* Primary Action Button */}
                <button
                    onClick={handleConfirmStop}
                    className={`
                        w-full py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-white
                        ${currentStop.isSchool ? 'bg-gray-900 shadow-gray-900/20' : 'bg-green-600 shadow-green-600/30'}
                    `}
                >
                    <CheckSquare size={24} className="opacity-80" />
                    {currentStop.isSchool ? 'FINALIZAR VIAGEM' : 'CONFIRMAR EMBARQUE'}
                </button>
            </div>
        </div>

    </div>
  );
};

export default ActiveRoute;
