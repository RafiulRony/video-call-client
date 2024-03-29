import './App.scss';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CallPage from './components/CallPage/CallPage';
import HomePage from './components/HomePage/HomePage';
import NoMatch from './components/NoMatch/NoMatch';

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/:id" element={<CallPage/>} />
      <Route path="/" element={<HomePage/>} />
      <Route path="*" element={<NoMatch/>} />
    </Routes>    
    </BrowserRouter>
  );
}

export default App;
