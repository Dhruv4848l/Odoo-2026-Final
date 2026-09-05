import React, { useState } from 'react';
import { useRoutes } from 'react-router-dom';
import { Navbar } from './layouts/Navbar';
import { AttendanceWidget } from './features/attendance-timeoff/components/AttendanceWidget';
import { routes } from './routes.config';

export const App: React.FC = () => {
  const element = useRoutes(routes);
  const [isAttendanceWidgetOpen, setIsAttendanceWidgetOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#F6F6FB] text-[#1A1A2E] flex flex-col">
      {/* Top Navbar */}
      <Navbar onToggleAttendanceWidget={() => setIsAttendanceWidgetOpen(!isAttendanceWidgetOpen)} />

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {element}
      </main>

      {/* Floating Attendance Popup Widget */}
      <AttendanceWidget
        isOpen={isAttendanceWidgetOpen}
        onClose={() => setIsAttendanceWidgetOpen(false)}
      />
    </div>
  );
};

export default App;
