import { useState } from "react";
import { usePdf } from "./PdfContext";
import * as pdfjs from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

function DragAndDrop({ setNumForms }) {
  const { setPdfFiles, setExtractedTexts, setExtractingData } = usePdf();
  const [fileNames, setFileNames] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [folderPath, setFolderPath] = useState("C:/Users/valer/OneDrive - Univerza v Mariboru/Namizje/GZ-Celje/BranjeLK/PDF-bralnik/BranjeLK/pdf-doc");
  const [isEditing, setIsEditing] = useState(false);

  const handleSelectFolder = async () => {
    const fs = window.require("fs");
    const path = window.require("path");

    try {
      const files = fs.readdirSync(folderPath);
      const pdfFiles = files.filter(file => path.extname(file) === ".pdf");

      setFileNames(pdfFiles);
      setPdfFiles(pdfFiles.map(file => ({ path: path.join(folderPath, file), name: file })));
      setNumForms(pdfFiles.length);
    } catch (error) {
      console.error("Prišlo je do napake pri dostopanju datoteke:", error);
      alert(`Napaka pri dostopu do mape: ${error.message}`);
    }
  };

  const extractTextFromPDF = async (filePath) => {
    const fs = window.require("fs");

    try {
      const pdfData = fs.readFileSync(filePath);
      const pdf = await pdfjs.getDocument({ data: pdfData }).promise;

      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(" ") + "\n";
      }

      console.log(`Extracted text from ${filePath}:\n${text}`);
      return { filePath, text: text || "No text found in the PDF." };
    } catch (error) {
      console.error("Error reading the PDF file:", error);
      return { filePath, text: `Error processing ${filePath}: Error reading the PDF file.` };
    }
  };

  const handleProcessData = async () => {
    setProcessing(true);
    setExtractingData(true);
    console.log("Successfully processing data for:", fileNames);

    let extractedTexts = [];

    for (const fileName of fileNames) {
      const filePath = `${folderPath}/${fileName}`;
      const extractedData = await extractTextFromPDF(filePath);
      extractedTexts.push(extractedData); 
    }

    setExtractedTexts(extractedTexts); 
    setProcessing(false);
  };

  const removeFiles = () => {
    setFileNames([]);
    setExtractedTexts([]); 
    setExtractingData(false);
    setProcessing(false);
  };

  const toggleEditPath = () => {
    setIsEditing(!isEditing);
  };

  const handlePathChange = (e) => {
    setFolderPath(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  return (
    <div className="dragAndDrop">
      <div className="folder-path-section">
        <div className="folder-path-container">
          {isEditing ? (
            <input 
              type="text" 
              value={folderPath} 
              onChange={handlePathChange} 
              onBlur={() => setIsEditing(false)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="folder-path-input"
            />
          ) : (
            <div className="folder-path-display" onClick={toggleEditPath}>
              <span title={folderPath}>{folderPath}</span>
              <button className="edit-path-button" onClick={toggleEditPath}>
                Uredi
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="select-folder-button">
        <button className="select-folder" onClick={handleSelectFolder}>Izberi mapo</button>
        {fileNames.length > 0 && (
          <div className="selected-files">
            <p>Izbrane datoteke ({fileNames.length}):</p>
            <div className="files-list">
              {fileNames.map((name, index) => (
                <p key={index}>{name}</p>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="drag-and-drop-buttons">
        <button 
          onClick={handleProcessData} 
          className="process-data-button" 
          disabled={processing || fileNames.length === 0}
        >
          {processing ? "Processing..." : "Process Data"}
        </button>
        <button 
          onClick={removeFiles} 
          className="remove-file-button"
          disabled={fileNames.length === 0}
        >
          Izbriši datoteke
        </button>
      </div>
    </div>
  );
}

export default DragAndDrop;