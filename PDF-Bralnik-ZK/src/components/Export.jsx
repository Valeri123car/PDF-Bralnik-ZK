import * as XLSX from 'xlsx';
import { usePdf } from './PdfContext';
import { useState } from 'react';
import { saveAs } from 'file-saver';

function ExportToExcel() {
  const { extractedDataByPdf, pdfFiles } = usePdf();

  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  console.log("Current extractedDataByPdf:", extractedDataByPdf);

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
      
      // Set to keep track of unique entries to prevent duplicates
      const uniqueLastnikEntries = new Set();
      const uniqueSluznostiEntries = new Set();
      const uniquePlombeEntries = new Set();

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
          
          // Extract existing data to prevent duplicates
          if (lastnikSheet) {
            const lastnikData = XLSX.utils.sheet_to_json(lastnikSheet);
            lastnikData.forEach(row => {
              // Create a unique key for each entry
              const key = `${row.Šifra}|${row.Parcela}|${row.EMŠO}|${row.Priimek_Ime}`;
              uniqueLastnikEntries.add(key);
            });
          }
          
          if (sluznostiSheet) {
            const sluznostiData = XLSX.utils.sheet_to_json(sluznostiSheet);
            sluznostiData.forEach(row => {
              const key = `${row.Šifra}|${row.Parcela}|${row.ID_pravice}|${row.Vrsta_pravice}`;
              uniqueSluznostiEntries.add(key);
            });
          }
          
          if (plombeSheet) {
            const plombeData = XLSX.utils.sheet_to_json(plombeSheet);
            plombeData.forEach(row => {
              const key = `${row.Šifra}|${row.Parcela}|${row['Zadeva DN']}|${row.Tip}`;
              uniquePlombeEntries.add(key);
            });
          }
        } else {
          throw new Error("File not found, creating new file");
        }
      } catch (err) {
        console.log("Creating new workbook:", err.message);
        // Create a new workbook if file doesn't exist or can't be read
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
        
        // Add sheets to workbook
        XLSX.utils.book_append_sheet(workbook, lastnikSheet, 'Lastnik');
        XLSX.utils.book_append_sheet(workbook, sluznostiSheet, 'Služnosti');
        XLSX.utils.book_append_sheet(workbook, plombeSheet, 'Plombe');
      }

      // Process each PDF's data
      extractedDataByPdf.forEach((pdfData, index) => {
        if (!pdfData) return;
        
        // Add data to Lastnik sheet
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
            const sifra = pdfData.sifra || '';
            const parcela = pdfData.parcela || '';
            const emso = pdfData.emso?.[i] || '';
            const priimekIme = pdfData.priimek_ime?.[i] || '';
            
            // Create a unique key for this entry
            const key = `${sifra}|${parcela}|${emso}|${priimekIme}`;
            
            // Only add if it's not a duplicate
            if (!uniqueLastnikEntries.has(key)) {
              lastnikRows.push([
                sifra,
                parcela,
                emso,
                priimekIme,
                pdfData.naslov?.[i] || '',
                pdfData.posta?.[i] || '',
                pdfData.delez?.[i] || ''
              ]);
              uniqueLastnikEntries.add(key);
            }
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
            const sifra = pdfData.sifra || '';
            const parcela = pdfData.parcela || '';
            const idPravice = pdfData.idPravice?.[i] || '';
            const vrstaPravice = pdfData.vrstaPravice?.[i] || '';
            
            // Create a unique key for this entry
            const key = `${sifra}|${parcela}|${idPravice}|${vrstaPravice}`;
            
            // Only add if it's not a duplicate
            if (!uniqueSluznostiEntries.has(key)) {
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
                sifra,
                parcela,
                idPravice,
                vrstaPravice,
                pdfData.ucinDatum?.[i] || '',
                pdfData.ucinUra?.[i] || '',
                pdfData.imetnikNaziv?.[i] || '',
                imetnikNaslovValue,
                imetnikPostaValue,
                pdfData.opis?.[i] || ''
              ]);
              uniqueSluznostiEntries.add(key);
            }
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
            const sifra = pdfData.sifra || '';
            const parcela = pdfData.parcela || '';
            const zadevaDn = pdfData.zadevaDn?.[i] || '';
            const tipPostopka = pdfData.tipPostopka?.[i] || '';
            
            // Create a unique key for this entry
            const key = `${sifra}|${parcela}|${zadevaDn}|${tipPostopka}`;
            
            // Only add if it's not a duplicate
            if (!uniquePlombeEntries.has(key)) {
              plombeRows.push([
                sifra,
                parcela,
                zadevaDn,
                tipPostopka,
                pdfData.casUcinDatum?.[i] || '',
                pdfData.casUcinCas?.[i] || '',
                pdfData.stanjeZadeve?.[i] || '',
                pdfData.nacinOd?.[i] || ''
              ]);
              uniquePlombeEntries.add(key);
            }
          }
          
          if (plombeRows.length > 0) {
            XLSX.utils.sheet_add_aoa(plombeSheet, plombeRows, { origin: -1 });
          }
        }
      });

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