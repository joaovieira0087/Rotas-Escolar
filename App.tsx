import React, { useState } from 'react';
import { Student, School, ViewState, RoutePlan } from './types';
import SchoolList from './components/SchoolList';
import StudentList from './components/StudentList';
import RoutePlanner from './components/RoutePlanner';
import ActiveRoute from './components/ActiveRoute';
import { Bus, Users, Map as MapIcon, ArrowLeft } from 'lucide-react';

const MOCK_SCHOOLS: School[] = [
  { id: 'school-1', name: 'Escola Municipal Alegria', address: 'R. da Felicidade, 100 - Centro', phone: '11 3333-4444' },
  { id: 'school-2', name: 'Colégio Futuro', address: 'Av. do Saber, 500 - Jd Escola', phone: '11 5555-6666' },
];

const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'Ana Silva', address: 'Rua das Flores, 123, Centro', schoolId: 'school-1', guardianContact: '1199999999' },
  { id: '2', name: 'Bruno Costa', address: 'Av. Paulista, 1000, Bela Vista', schoolId: 'school-1', guardianContact: '1188888888' },
  { id: '3', name: 'Carlos Souza', address: 'Rua Augusta, 500, Consolação', schoolId: 'school-2', guardianContact: '1177777777' },
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.SCHOOL_LIST);
  
  // Data State
  const [schools, setSchools] = useState<School[]>(MOCK_SCHOOLS);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  
  // Navigation Context State
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [activeRoute, setActiveRoute] = useState<RoutePlan | null>(null);

  // --- Actions ---

  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school);
    setView(ViewState.SCHOOL_DASHBOARD);
  };

  const handleAddSchool = (school: School) => {
    setSchools([...schools, school]);
  };

  const handleDeleteSchool = (id: string) => {
    if(window.confirm("Excluir escola e todos os alunos vinculados?")) {
        setSchools(schools.filter(s => s.id !== id));
        setStudents(students.filter(s => s.schoolId !== id));
    }
  };

  const handleAddStudent = (student: Student) => {
    setStudents([...students, student]);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const handleStartRoute = (route: RoutePlan) => {
    setActiveRoute(route);
    setView(ViewState.ACTIVE_ROUTE);
  };

  const handleExitRoute = () => {
    setActiveRoute(null);
    setView(ViewState.SCHOOL_DASHBOARD); // Return to dashboard
  };

  // --- Render Helpers ---

  // Navigation Logic
  if (view === ViewState.ACTIVE_ROUTE && activeRoute) {
    return <ActiveRoute route={activeRoute} onExit={handleExitRoute} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-200">
      
      {/* Global Header */}
      <header className="bg-school-yellow text-school-dark p-4 pt-8 pb-4 shadow-md z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
            {view !== ViewState.SCHOOL_LIST ? (
                <button 
                    onClick={() => {
                        if (view === ViewState.SCHOOL_DASHBOARD) {
                            setSelectedSchool(null);
                            setView(ViewState.SCHOOL_LIST);
                        } else {
                            setView(ViewState.SCHOOL_DASHBOARD);
                        }
                    }} 
                    className="p-1 rounded-full hover:bg-black/10 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
            ) : (
                <div className="w-10 h-10 bg-school-dark rounded-full flex items-center justify-center text-white">
                    <Bus size={20} />
                </div>
            )}
            
            <div className="leading-tight">
                <h1 className="font-extrabold text-lg">
                    {selectedSchool ? selectedSchool.name : 'Rota Escolar'}
                </h1>
                <p className="text-xs font-semibold opacity-80">
                    {selectedSchool ? 'Painel de Gestão' : 'Selecione a Escola'}
                </p>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        
        {/* LEVEL 1: SCHOOL LIST */}
        {view === ViewState.SCHOOL_LIST && (
          <SchoolList 
            schools={schools}
            onSelectSchool={handleSelectSchool}
            onAddSchool={handleAddSchool}
            onDeleteSchool={handleDeleteSchool}
          />
        )}

        {/* LEVEL 2: SCHOOL DASHBOARD */}
        {view === ViewState.SCHOOL_DASHBOARD && selectedSchool && (
            <div className="p-6 grid grid-cols-1 gap-4 h-full content-start bg-gray-50">
                <button 
                    onClick={() => setView(ViewState.ROUTES)}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center gap-3 hover:shadow-md transition-all active:scale-95"
                >
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <MapIcon size={32} />
                    </div>
                    <span className="font-bold text-lg text-gray-800">Iniciar Rota</span>
                    <span className="text-xs text-gray-500 text-center">Selecionar alunos e traçar caminho até {selectedSchool.name}</span>
                </button>

                <button 
                    onClick={() => setView(ViewState.STUDENTS)}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center gap-3 hover:shadow-md transition-all active:scale-95"
                >
                    <div className="w-16 h-16 bg-school-yellow text-school-dark rounded-full flex items-center justify-center">
                        <Users size={32} />
                    </div>
                    <span className="font-bold text-lg text-gray-800">Gerenciar Alunos</span>
                    <span className="text-xs text-gray-500 text-center">Cadastrar ou editar alunos desta escola</span>
                </button>

                <div className="mt-4 p-4 bg-gray-100 rounded-xl">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Informações</h3>
                    <p className="text-sm text-gray-700 mb-1">📍 {selectedSchool.address}</p>
                    <p className="text-sm text-gray-700">📞 {selectedSchool.phone}</p>
                </div>
            </div>
        )}

        {/* LEVEL 3: STUDENTS MANAGEMENT */}
        {view === ViewState.STUDENTS && selectedSchool && (
          <StudentList 
            students={students} 
            currentSchool={selectedSchool}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
            onBack={() => setView(ViewState.SCHOOL_DASHBOARD)}
          />
        )}

        {/* LEVEL 3: ROUTE PLANNER */}
        {view === ViewState.ROUTES && selectedSchool && (
          <RoutePlanner 
            students={students}
            currentSchool={selectedSchool}
            onRouteStart={handleStartRoute}
            onBack={() => setView(ViewState.SCHOOL_DASHBOARD)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
