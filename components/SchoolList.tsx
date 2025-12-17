import React, { useState } from 'react';
import { School } from '../types';
import { School as SchoolIcon, Plus, MapPin, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { validateAddress } from '../services/geminiService';

interface SchoolListProps {
  schools: School[];
  onSelectSchool: (school: School) => void;
  onAddSchool: (school: School) => void;
  onDeleteSchool: (id: string) => void;
}

const SchoolList: React.FC<SchoolListProps> = ({ schools, onSelectSchool, onAddSchool, onDeleteSchool }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [newSchool, setNewSchool] = useState<Partial<School>>({
    name: '',
    address: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name || !newSchool.address) return;

    setIsValidating(true);
    const validation = await validateAddress(newSchool.address);
    setIsValidating(false);

    if (validation.isValid) {
      const school: School = {
        id: Date.now().toString(),
        name: newSchool.name || '',
        address: validation.suggestions || newSchool.address || '',
        phone: newSchool.phone || ''
      };
      onAddSchool(school);
      setNewSchool({ name: '', address: '', phone: '' });
      setIsAdding(false);
    } else {
      alert("Endereço da escola não encontrado. Verifique e tente novamente.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-6 bg-school-yellow text-school-dark rounded-b-3xl shadow-lg mb-4">
        <h1 className="text-2xl font-extrabold">Minhas Escolas</h1>
        <p className="opacity-80 text-sm font-medium">Selecione uma instituição para iniciar</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4">
        {isAdding ? (
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-md border-2 border-school-yellow animate-fade-in">
            <h3 className="font-bold mb-3 text-gray-700">Nova Escola Parceira</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome da Escola"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-school-yellow outline-none"
                value={newSchool.name}
                onChange={e => setNewSchool({ ...newSchool, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Endereço Completo"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-school-yellow outline-none"
                value={newSchool.address}
                onChange={e => setNewSchool({ ...newSchool, address: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder="Telefone / Contato"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-school-yellow outline-none"
                value={newSchool.phone}
                onChange={e => setNewSchool({ ...newSchool, phone: e.target.value })}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isValidating}
                  className="flex-1 bg-school-dark text-white font-bold py-3 rounded-lg flex justify-center items-center"
                >
                  {isValidating ? <Loader2 className="animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full bg-white border-2 border-dashed border-gray-300 p-4 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:border-school-yellow hover:text-school-yellow transition-all"
          >
            <Plus size={20} /> Adicionar Nova Escola
          </button>
        )}

        {schools.map(school => (
          <div 
            key={school.id} 
            className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden cursor-pointer"
            onClick={() => onSelectSchool(school)}
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-school-dark group-hover:bg-school-yellow transition-colors"></div>
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <SchoolIcon size={18} className="text-gray-600" />
                  {school.name}
                </h3>
                <div className="flex items-start gap-2 mt-2 text-gray-500 text-sm">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  <span>{school.address}</span>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-300 group-hover:text-school-dark" />
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onDeleteSchool(school.id); }}
                className="absolute top-2 right-2 p-2 text-gray-200 hover:text-red-500 transition-colors"
            >
                <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchoolList;
