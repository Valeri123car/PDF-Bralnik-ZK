import { createContext, useContext, useState } from 'react';

const PdfContext = createContext();

export const PdfProvider = ({ children }) => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [extractedTexts, setExtractedTexts] = useState([]);
  const [extractingData, setExtractingData] = useState(false);
  
  const [formData, setFormData] = useState([]);
  
  const updateFormData = (index, data) => {
    setFormData(prevForms => {
      const newForms = [...prevForms];
      if (!newForms[index]) {
        newForms[index] = {};
      }
      newForms[index] = {...newForms[index], ...data};
      return newForms;
    });
  };

  return (
    <PdfContext.Provider value={{
      pdfFiles, setPdfFiles,
      extractedTexts, setExtractedTexts,
      extractingData, setExtractingData,
      formData, setFormData, updateFormData
    }}>
      {children}
    </PdfContext.Provider>
  );
};

export const usePdf = () => useContext(PdfContext);