import React, { useState } from 'react';
import { Student, School } from '../types';
import { UserPlus, MapPin, School as SchoolIcon, Phone, Trash2, ArrowLeft } from 'lucide-react';
import { validateAddress } from '../services/geminiService';

interface StudentListProps {
  students: Student[];
  currentSchool: School;
  onAddStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onBack: () => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, currentSchool, onAddStudent, onDeleteStudent, onBack }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '',
    address: '',
    guardianContact: '',
  });

  // Filter students for the current school
  const schoolStudents = students.filter(s => s.schoolId === currentSchool.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.address) return;

    setIsValidating(true);
    const validation = await validateAddress(newStudent.address);
    setIsValidating(false);

    if (validation.isValid) {
        const student: Student = {
          id: Date.now().toString(),
          name: newStudent.name || '',
          address: validation.suggestions || newStudent.address || '',
          schoolId: currentSchool.id, // Automatically link to current school
          guardianContact: newStudent.guardianContact || '',
        };
        onAddStudent(student);
        setNewStudent({ name: '', address: '', guardianContact: '' });
        setIsAdding(false);
    } else {
        alert("O endereço parece inválido. Por favor, verifique.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4 bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-4">
             <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                 <ArrowLeft size={20} />
             </button>
             <div>
                <h2 className="text-xl font-bold text-gray-800">Alunos</h2>
                <p className="text-xs text-gray-500">Vinculados a {currentSchool.name}</p>
             </div>
        </div>
        
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-full bg-school-dark text-white px-4 py-3 rounded-lg flex justify-center items-center gap-2 text-sm font-bold active:scale-95 transition-transform"
        >
          {isAdding ? 'Cancelar Cadastro' : <><UserPlus size={18} /> Cadastrar Novo Aluno</>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        {isAdding && (
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-md border-2 border-school-yellow animate-fade-in">
            <h3 className="font-bold mb-3 text-gray-700">Novo Aluno em {currentSchool.name}</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome do Aluno"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-school-yellow outline-none"
                value={newStudent.name}
                onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Endereço da Casa"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-school-yellow outline-none"
                value={newStudent.address}
                onChange={e => setNewStudent({ ...newStudent, address: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder="WhatsApp do Responsável"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-school-yellow outline-none"
                value={newStudent.guardianContact}
                onChange={e => setNewStudent({ ...newStudent, guardianContact: e.target.value })}
              />
              <button
                type="submit"
                disabled={isValidating}
                className="w-full bg-school-yellow text-school-dark font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors"
              >
                {isValidating ? 'Validando Endereço...' : 'Salvar Aluno'}
              </button>
            </div>
          </form>
        )}

        {schoolStudents.length === 0 && !isAdding && (
            <div className="text-center text-gray-400 mt-10">
                <UserPlus size={48} className="mx-auto mb-2 opacity-30" />
                <p>Nenhum aluno cadastrado nesta escola.</p>
            </div>
        )}

        {schoolStudents.map(student => (
            <div key={student.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-school-yellow flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{student.name}</h3>
                <div className="flex items-start gap-2 mt-1 text-gray-600 text-sm">
                  <MapPin size={14} className="mt-1 shrink-0" />
                  <span className="line-clamp-2">{student.address}</span>
                </div>
                {student.guardianContact && (
                   <div className="flex items-center gap-2 mt-2 text-green-600 text-sm font-medium">
                     <Phone size={14} />
                     <span>{student.guardianContact}</span>
                   </div>
                )}
              </div>
              <button
                onClick={() => onDeleteStudent(student.id)}
                className="text-gray-300 hover:text-red-500 p-2 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
        ))}
      </div>
    </div>
  );
};

export default StudentList;
