import { useState } from 'react';
import DragAndDrop from './components/DragAndDrop';
import './App.css';
import Forms from './components/Forms';
import Export from './components/Export';
import Header from './components/Header';
import { PdfProvider } from "./components/PdfContext";

function App() {
  const [numForms, setNumForms] = useState(1);

  return (
    <>
      <Header />
      <PdfProvider>
        <DragAndDrop setNumForms={setNumForms} /> 
        {[...Array(numForms)].map((_, index) => (
          <Forms key={index} index={index} />
        ))}
        <Export/>
      </PdfProvider>
    </>
  );
}

export default App;