import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './routes.config';
import { AttendanceWidget } from './features/attendance-timeoff/components/AttendanceWidget';

export const AppContent: React.FC = () => {
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
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
