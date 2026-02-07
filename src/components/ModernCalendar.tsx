// ModernCalendar.tsx
// Calendario personalizado moderno para selección de fechas

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ModernCalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
}

export const ModernCalendar = ({ selectedDate, onSelectDate, minDate }: ModernCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Ajustar el primer día (lunes = 0)
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6;
    
    const daysInMonth = lastDay.getDate();
    const days: (Date | null)[] = [];
    
    // Días del mes anterior
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const days = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isPast = (date: Date | null) => {
    if (!date) return false;
    const min = minDate || new Date();
    min.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < min;
  };

  const handleDateClick = (date: Date | null) => {
    if (!date || isPast(date)) return;
    onSelectDate(date);
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-3">
      {/* Header con mes y año */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={previousMonth}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        
        <div className="text-center">
          <div className="font-bold text-gray-900 text-base">
            {monthNames[currentMonth.getMonth()]}
          </div>
          <div className="text-xs text-gray-500">
            {currentMonth.getFullYear()}
          </div>
        </div>
        
        <button
          onClick={nextMonth}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Nombres de días */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((day, idx) => (
          <div
            key={idx}
            className="text-center text-xs font-semibold text-gray-600 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const past = isPast(day);
          const today = isToday(day);
          const selected = isSelected(day);

          return (
            <button
              key={idx}
              onClick={() => handleDateClick(day)}
              disabled={!day || past}
              className={`
                aspect-square rounded-lg text-xs font-medium transition-all
                ${!day ? 'invisible' : ''}
                ${past ? 'text-gray-300 cursor-not-allowed' : ''}
                ${!past && !selected && day ? 'hover:bg-blue-50 text-gray-700' : ''}
                ${today && !selected ? 'border-2 border-blue-400' : ''}
                ${selected ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105' : ''}
              `}
            >
              {day?.getDate()}
            </button>
          );
        })}
      </div>

      {/* Leyenda compacta */}
      <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2.5 h-2.5 border-2 border-blue-400 rounded"></div>
          <span className="text-gray-600">Hoy</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded"></div>
          <span className="text-gray-600">Elegido</span>
        </div>
      </div>
    </div>
  );
};