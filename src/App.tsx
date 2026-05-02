import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoleSelect } from './screens/RoleSelect';
import { CommanderDashboard } from './screens/CommanderDashboard';
import { HelperDashboard } from './screens/HelperDashboard';
import { ObserverDashboard } from './screens/ObserverDashboard';
import { TaskDetail } from './screens/TaskDetail';
import { NavBar } from './components/NavBar';
import { useStore } from './store';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <NavBar />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/commander" element={<Layout><CommanderDashboard /></Layout>} />
        <Route path="/helper" element={<Layout><HelperDashboard /></Layout>} />
        <Route path="/observer" element={<Layout><ObserverDashboard /></Layout>} />
        <Route path="/task/:id" element={<Layout><TaskDetail /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
