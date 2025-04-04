import * as XLSX from 'xlsx';
import { usePdf } from './PdfContext';
import { useState } from 'react';
import { saveAs } from 'file-saver';

function ExportToExcel() {
  const { extractedDataByPdf, pdfFiles } = usePdf();

  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const exportToExcel = async () => {
    setIsExporting(true);
    setError(null);
    setSuccessMessage("");

    try {
      if (!extractedDataByPdf || extractedDataByPdf.length === 0) {
        throw new Error("Ni podatkov za izvoz");
      }

      const fileName = 'zemljiska_knjiga_izvoz.xlsx';
      let workbook;
      let lastnikSheet;
      let sluznostiSheet;
      let plombeSheet;
      
      // Set to track processed PDF files by their content hash or unique identifier
      const processedPdfIdentifiers = new Set();
      
      // Instead of tracking individual entries, track entire PDFs that were already processed
      try {
        // Try to read the existing file
        const response = await fetch(fileName);
        if (response.ok) {
          const fileData = await response.arrayBuffer();
          workbook = XLSX.read(fileData, { type: 'array' });
          
          // Get existing sheets if they exist
          lastnikSheet = workbook.Sheets['Lastnik'];
          sluznostiSheet = workbook.Sheets['Služnosti'];
          plombeSheet = workbook.Sheets['Plombe'];
          
          // Extract identifiers of already processed PDFs
          // This is a custom sheet we'll add to track processed files
          const processedFilesSheet = workbook.Sheets['ProcessedFiles'];
          if (processedFilesSheet) {
            const processedFiles = XLSX.utils.sheet_to_json(processedFilesSheet);
            processedFiles.forEach(row => {
              if (row.PdfIdentifier) {
                processedPdfIdentifiers.add(row.PdfIdentifier);
              }
            });
          }
        } else {
          throw new Error("File not found, creating new file");
        }
      } catch (err) {
        workbook = XLSX.utils.book_new();
        
        // Create sheets with headers
        lastnikSheet = XLSX.utils.aoa_to_sheet([
          ['Šifra', 'Parcela', 'EMŠO', 'Priimek_Ime', 'Naslov', 'Pošta', 'Delež']
        ]);
        
        sluznostiSheet = XLSX.utils.aoa_to_sheet([
          ['Šifra', 'Parcela', 'ID_pravice', 'Vrsta_pravice', 'Učin_datum', 'Učin_ura', 'Imetnik_naziv', 'Imetnik_naslov', 'Imetnik_pošta', 'Opis']
        ]);
        
        plombeSheet = XLSX.utils.aoa_to_sheet([
          ['Šifra', 'Parcela', 'Zadeva DN', 'Tip', 'Učin Datum', 'Učin Ura', 'Stanje', 'Način']
        ]);
        
        // Create a sheet to track processed PDFs
        const processedFilesSheet = XLSX.utils.aoa_to_sheet([
          ['PdfIdentifier', 'ProcessedDate']
        ]);
        
        // Add sheets to workbook
        XLSX.utils.book_append_sheet(workbook, lastnikSheet, 'Lastnik');
        XLSX.utils.book_append_sheet(workbook, sluznostiSheet, 'Služnosti');
        XLSX.utils.book_append_sheet(workbook, plombeSheet, 'Plombe');
        XLSX.utils.book_append_sheet(workbook, processedFilesSheet, 'ProcessedFiles');
      }

      // Process each PDF's data
      const newlyProcessedPdfs = [];
      
      extractedDataByPdf.forEach((pdfData, index) => {
        if (!pdfData) return;
        
        // Create a unique identifier for this PDF based on its content
        // Here we use a combination of sifra, parcela and perhaps a file name or content hash
        const pdfIdentifier = `${pdfData.sifra || ''}-${pdfData.parcela || ''}-${pdfFiles[index]?.name || ''}`;
        
        // Skip if this PDF was already processed
        if (processedPdfIdentifiers.has(pdfIdentifier)) {
          return;
        }
        
        // Track that we're processing this PDF
        newlyProcessedPdfs.push([pdfIdentifier, new Date().toISOString()]);
        processedPdfIdentifiers.add(pdfIdentifier);
        
        // Add data to Lastnik sheet - now we keep all entries from within the same PDF
        if (pdfData.emso && pdfData.emso.length > 0) {
          const lastnikRows = [];
          const maxLastnikLength = Math.max(
            pdfData.emso?.length || 0,
            pdfData.priimek_ime?.length || 0,
            pdfData.naslov?.length || 0,
            pdfData.posta?.length || 0,
            pdfData.delez?.length || 0
          );
          
          for (let i = 0; i < maxLastnikLength; i++) {
            lastnikRows.push([
              pdfData.sifra || '',
              pdfData.parcela || '',
              pdfData.emso?.[i] || '',
              pdfData.priimek_ime?.[i] || '',
              pdfData.naslov?.[i] || '',
              pdfData.posta?.[i] || '',
              pdfData.delez?.[i] || ''
            ]);
          }
          
          if (lastnikRows.length > 0) {
            XLSX.utils.sheet_add_aoa(lastnikSheet, lastnikRows, { origin: -1 });
          }
        }
        
        // Add data to Služnosti sheet
        if (pdfData.idPravice && pdfData.idPravice.length > 0) {
          const sluznostiRows = [];
          const maxSluznostiLength = Math.max(
            pdfData.idPravice?.length || 0,
            pdfData.vrstaPravice?.length || 0,
            pdfData.ucinDatum?.length || 0,
            pdfData.ucinUra?.length || 0,
            pdfData.imetnikNaziv?.length || 0,
            pdfData.opis?.length || 0
          );
          
          for (let i = 0; i < maxSluznostiLength; i++) {
            // Handle nested arrays for imetnikNaslov and imetnikPosta
            let imetnikNaslovValue = '';
            if (pdfData.imetnikNaslov && pdfData.imetnikNaslov[i]) {
              if (Array.isArray(pdfData.imetnikNaslov[i])) {
                imetnikNaslovValue = pdfData.imetnikNaslov[i].join(', ');
              } else {
                imetnikNaslovValue = pdfData.imetnikNaslov[i];
              }
            }
            
            let imetnikPostaValue = '';
            if (pdfData.imetnikPosta && pdfData.imetnikPosta[i]) {
              if (Array.isArray(pdfData.imetnikPosta[i])) {
                imetnikPostaValue = pdfData.imetnikPosta[i].join(', ');
              } else {
                imetnikPostaValue = pdfData.imetnikPosta[i];
              }
            }
            
            sluznostiRows.push([
              pdfData.sifra || '',
              pdfData.parcela || '',
              pdfData.idPravice?.[i] || '',
              pdfData.vrstaPravice?.[i] || '',
              pdfData.ucinDatum?.[i] || '',
              pdfData.ucinUra?.[i] || '',
              pdfData.imetnikNaziv?.[i] || '',
              imetnikNaslovValue,
              imetnikPostaValue,
              pdfData.opis?.[i] || ''
            ]);
          }
          
          if (sluznostiRows.length > 0) {
            XLSX.utils.sheet_add_aoa(sluznostiSheet, sluznostiRows, { origin: -1 });
          }
        }
        
        // Add data to Plombe sheet
        if (pdfData.zadevaDn && pdfData.zadevaDn.length > 0) {
          const plombeRows = [];
          const maxPlombeLength = Math.max(
            pdfData.zadevaDn?.length || 0,
            pdfData.tipPostopka?.length || 0,
            pdfData.casUcinDatum?.length || 0,
            pdfData.casUcinCas?.length || 0,
            pdfData.stanjeZadeve?.length || 0,
            pdfData.nacinOd?.length || 0
          );
          
          for (let i = 0; i < maxPlombeLength; i++) {
            plombeRows.push([
              pdfData.sifra || '',
              pdfData.parcela || '',
              pdfData.zadevaDn?.[i] || '',
              pdfData.tipPostopka?.[i] || '',
              pdfData.casUcinDatum?.[i] || '',
              pdfData.casUcinCas?.[i] || '',
              pdfData.stanjeZadeve?.[i] || '',
              pdfData.nacinOd?.[i] || ''
            ]);
          }
          
          if (plombeRows.length > 0) {
            XLSX.utils.sheet_add_aoa(plombeSheet, plombeRows, { origin: -1 });
          }
        }
      });
      
      // Update the ProcessedFiles sheet with newly processed PDFs
      if (newlyProcessedPdfs.length > 0) {
        const processedFilesSheet = workbook.Sheets['ProcessedFiles'];
        XLSX.utils.sheet_add_aoa(processedFilesSheet, newlyProcessedPdfs, { origin: -1 });
      }

      // Export file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      saveAsExcelFile(excelBuffer, fileName);

      setSuccessMessage("Podatki so bili uspešno izvoženi.");
    } catch (err) {
      console.error("Napaka pri izvozu:", err);
      setError(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const saveAsExcelFile = (buffer, fileName) => {
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  };

  return (
    <div className="export">
      <div className="export-polje">
        <div>Število zaznanih obrazcev: {pdfFiles.length}</div>
        <button
          className="export-button"
          onClick={exportToExcel}
          disabled={isExporting || !extractedDataByPdf || extractedDataByPdf.length === 0}
        >
          {isExporting ? "Izvažanje..." : "Izvozi podatke"}
        </button>
        {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
        {successMessage && <div style={{ color: 'green', marginTop: '10px' }}>{successMessage}</div>}
      </div>
    </div>
  );
}

export default ExportToExcel;