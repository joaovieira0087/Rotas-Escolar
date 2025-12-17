import React, { useState } from 'react';
import { Student, School, RoutePlan, RouteStop } from '../types';
import { Map, Navigation, CheckCircle, XCircle, Settings, PlayCircle, Loader2, ArrowLeft, LocateFixed } from 'lucide-react';
import { optimizeRouteOrder } from '../services/geminiService';

interface RoutePlannerProps {
  students: Student[];
  currentSchool: School;
  onRouteStart: (plan: RoutePlan) => void;
  onBack: () => void;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ students, currentSchool, onRouteStart, onBack }) => {
  // Only students from this school
  const schoolStudents = students.filter(s => s.schoolId === currentSchool.id);

  const [attendance, setAttendance] = useState<Record<string, boolean>>(
    schoolStudents.reduce((acc, s) => ({ ...acc, [s.id]: true }), {})
  );
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [startPoint, setStartPoint] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const toggleAttendance = (id: string) => {
    setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
        alert("Geolocalização não suportada pelo seu navegador.");
        return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            // In a real app we would reverse geocode this. 
            // Here we just pass the coords string which Gemini can understand.
            setStartPoint(`${latitude}, ${longitude}`);
            setIsGettingLocation(false);
        },
        (error) => {
            console.error(error);
            alert("Erro ao obter localização. Digite manualmente.");
            setIsGettingLocation(false);
        }
    );
  };

  const handleGenerateRoute = async () => {
    if (schoolStudents.length === 0) return;
    if (!startPoint) {
        alert("Defina o ponto de partida (Sua casa ou local atual).");
        return;
    }

    setIsOptimizing(true);
    
    // 1. Filter students who are PRESENT
    const presentStudents = schoolStudents.filter(s => attendance[s.id]);

    if (presentStudents.length === 0) {
        alert("Selecione pelo menos um aluno presente.");
        setIsOptimizing(false);
        return;
    }

    // 2. Logic: Start (Driver) -> Students -> End (School)
    const destination = currentSchool.address;
    
    // 3. Optimize Order using Gemini
    const optimizedIds = await optimizeRouteOrder(startPoint, destination, presentStudents);

    // 4. Construct the RoutePlan object
    const stops: RouteStop[] = [];

    // Add Optimized Students
    optimizedIds.forEach((id, index) => {
      const student = presentStudents.find(s => s.id === id);
      if (student) {
        stops.push({
          id: student.id,
          studentId: student.id,
          isSchool: false,
          address: student.address,
          name: student.name,
          order: index + 1,
          status: 'PENDING',
          isPresent: true
        });
      }
    });

    // Add School as final stop (Always)
    stops.push({
        id: 'school-stop',
        isSchool: true,
        address: currentSchool.address,
        name: `Destino: ${currentSchool.name}`,
        order: stops.length + 1,
        status: 'PENDING',
        isPresent: true
    });

    const newRoute: RoutePlan = {
      id: Date.now().toString(),
      type: 'MORNING_PICKUP', // Defaulting to pickup logic for this flow
      date: new Date().toISOString(),
      stops: stops,
      status: 'PLANNED'
    };

    setIsOptimizing(false);
    onRouteStart(newRoute);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header Config */}
      <div className="p-4 bg-white shadow-sm space-y-4">
        <div className="flex items-center gap-2">
             <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                 <ArrowLeft size={20} />
             </button>
             <div>
                <h2 className="text-xl font-bold text-gray-800">Rota para Escola</h2>
                <p className="text-xs text-gray-500">{currentSchool.name}</p>
             </div>
        </div>

        {/* Start Point Input */}
        <div className="bg-gray-100 p-3 rounded-xl border border-gray-200">
             <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Ponto de Partida</label>
             <div className="flex gap-2">
                <input 
                    value={startPoint}
                    onChange={(e) => setStartPoint(e.target.value)}
                    className="flex-1 bg-white p-2 rounded-lg text-sm outline-none border focus:border-school-yellow"
                    placeholder="Digite endereço ou..."
                />
                <button 
                    onClick={handleGetCurrentLocation}
                    className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 flex items-center justify-center transition-colors"
                    title="Usar minha localização atual"
                >
                    {isGettingLocation ? <Loader2 className="animate-spin" size={20}/> : <LocateFixed size={20} />}
                </button>
             </div>
             {startPoint.includes(',') && <span className="text-[10px] text-green-600 mt-1 block">✓ GPS Capturado</span>}
        </div>
        
        <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100 text-center">
            <span className="text-xs text-yellow-800 font-semibold">Destino Final: {currentSchool.name}</span>
        </div>
      </div>

      {/* Attendance Check */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600"/>
                Quem vamos buscar hoje?
            </h3>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                {Object.values(attendance).filter(Boolean).length} Alunos
            </span>
        </div>

        <div className="space-y-3">
          {schoolStudents.map(student => (
            <div 
                key={student.id} 
                onClick={() => toggleAttendance(student.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    attendance[student.id] 
                        ? 'bg-white border-gray-200 shadow-sm' 
                        : 'bg-red-50 border-red-200 opacity-60'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${attendance[student.id] ? 'bg-blue-500' : 'bg-red-400'}`}>
                    {student.name.charAt(0)}
                </div>
                <div>
                    <h4 className={`font-bold ${attendance[student.id] ? 'text-gray-800' : 'text-red-800 line-through'}`}>{student.name}</h4>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{student.address}</p>
                </div>
              </div>
              
              <div className="p-2">
                {attendance[student.id] 
                    ? <CheckCircle className="text-green-500" size={24} /> 
                    : <XCircle className="text-red-400" size={24} />
                }
              </div>
            </div>
          ))}
          {schoolStudents.length === 0 && <p className="text-center text-gray-400 mt-8">Nenhum aluno cadastrado nesta escola.</p>}
        </div>
      </div>

      {/* Floating CTA */}
      <div className="absolute bottom-6 left-4 right-4">
        <button
            onClick={handleGenerateRoute}
            disabled={isOptimizing || schoolStudents.length === 0}
            className="w-full bg-school-dark text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-70"
        >
            {isOptimizing ? (
                <>
                    <Loader2 className="animate-spin" size={24} />
                    Otimizando Rota...
                </>
            ) : (
                <>
                    <Settings className="text-school-yellow" size={24} />
                    Traçar Rota Inteligente
                </>
            )}
        </button>
      </div>
    </div>
  );
};

export default RoutePlanner;
