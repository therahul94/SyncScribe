
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import TextEditor from './TextEditor'
import { v4 as uuidv4 } from 'uuid';

function App() {
  return <div>
    <BrowserRouter>
      <Routes> 
        <Route  path='/' element={<Navigate replace to={`/document/${uuidv4()}`}/>} />
        <Route path='/document/:id' element={<TextEditor />} />
      </Routes>
    </BrowserRouter>
  </div>

}

export default App
