import { useState } from "react";
import { usePdf } from "./PdfContext";
import * as pdfjs from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

function DragAndDrop({ setNumForms }) {
  const { pdfFiles, setPdfFiles, setExtractedTexts, setExtractingData } = usePdf();  const [fileNames, setFileNames] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [folderPath, setFolderPath] = useState("Select a folder");

  const handleSelectFolder = async () => {
    try {
      // Use the browser's directory picker API
      const dirHandle = await window.showDirectoryPicker({
        mode: "read"
      });
      
      // Get folder path info
      const folderName = dirHandle.name;
      setFolderPath(folderName);
      
      // Get all files in the directory
      const files = [];
      for await (const entry of dirHandle.values()) {
        if (entry.kind === "file" && entry.name.toLowerCase().endsWith(".pdf")) {
          files.push(entry);
        }
      }
      
      // Process PDF files
      const pdfFileEntries = [];
      const pdfFileNames = [];
      
      for (const fileEntry of files) {
        if (fileEntry.name.toLowerCase().endsWith(".pdf")) {
          pdfFileEntries.push(fileEntry);
          pdfFileNames.push(fileEntry.name);
        }
      }
      
      setFileNames(pdfFileNames);
      setPdfFiles(pdfFileEntries.map(fileEntry => ({ handle: fileEntry, name: fileEntry.name })));
      setNumForms(pdfFileEntries.length);
    } catch (error) {
      console.error("Error accessing folder:", error);
      if (error.name !== "AbortError") {
        alert(`Error accessing folder: ${error.message}`);
      }
    }
  };

  const extractTextFromPDF = async (fileHandle) => {
    try {
      const file = await fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF using PDF.js
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(" ") + "\n";
      }
      
      return { fileName: fileHandle.name, text: text || "No text found in the PDF." };
    } catch (error) {
      console.error("Error reading the PDF file:", error);
      return { fileName: fileHandle.name, text: `Error processing ${fileHandle.name}: ${error.message}` };
    }
  };

  const handleProcessData = async () => {
    setProcessing(true);
    setExtractingData(true);
  
    try {
      const extractedResults = [];
      
      for (const pdfFile of pdfFiles) {
        const extractedData = await extractTextFromPDF(pdfFile.handle);
        extractedResults.push(extractedData);
      }
      
      // Update state with the extracted results
      setExtractedTexts(extractedResults);
      
      // You might want to add a callback to ensure the UI updates
      console.log("Processing complete:", extractedResults.length, "files processed");
      
    } catch (error) {
      console.error("Error processing PDF files:", error);
      alert(`Error processing PDF files: ${error.message}`);
    } finally {
      setProcessing(false);
      setExtractingData(false);
    }
  };

  const removeFiles = () => {
    setFileNames([]);
    setPdfFiles([]);
    setExtractedTexts([]);
    setExtractingData(false);
    setProcessing(false);
  };

  return (
    <div className="dragAndDrop">
      <div className="folder-path-section">
        <div className="folder-path-container">
          <div className="folder-path-display">
            <span title={folderPath}>{folderPath}</span>
          </div>
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