import React, { useState } from 'react';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes, routes } from './routes.config';
import { AttendanceWidget } from './features/attendance-timeoff/components/AttendanceWidget';

export const AppContent: React.FC = () => {
  const element = useRoutes(routes);
  const [isAttendanceWidgetOpen, setIsAttendanceWidgetOpen] = useState<boolean>(false);

  return (
    <>
      <AppRoutes />
      <AttendanceWidget
        isOpen={isAttendanceWidgetOpen}
        onClose={() => setIsAttendanceWidgetOpen(false)}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
