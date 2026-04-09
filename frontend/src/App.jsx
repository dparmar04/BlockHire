import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import CreateJob from './components/CreateJob';
import JobList from './components/JobList';
import JobDetails from './components/JobDetails';
import MyJobs from './components/MyJobs';
import './index.css'
import Admin from './components/Admin';
function App() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/create" element={<CreateJob />} />
          <Route path="/my-jobs" element={<MyJobs />} />
          <Route path="/admin" element={<Admin />} /> 
        </Routes>
      </main>
    </div>
  );
}

export default App;