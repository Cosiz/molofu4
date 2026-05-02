import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoleSelect } from './screens/RoleSelect';
import { CommanderDashboard } from './screens/CommanderDashboard';
import { HelperDashboard } from './screens/HelperDashboard';
import { ObserverDashboard } from './screens/ObserverDashboard';
import { TaskDetail } from './screens/TaskDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/commander" element={<CommanderDashboard />} />
        <Route path="/helper" element={<HelperDashboard />} />
        <Route path="/observer" element={<ObserverDashboard />} />
        <Route path="/task/:id" element={<TaskDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
