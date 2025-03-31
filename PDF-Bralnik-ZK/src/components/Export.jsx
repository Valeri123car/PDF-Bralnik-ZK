import * as XLSX from 'xlsx';
import { usePdf } from './PdfContext';
import { useState } from 'react';

function ExportToExcel() {
  const { 
    pdfFiles, 
    extractedTexts, 
    extractingData, 
    formData,
    
    // Accessing all the state values directly from context
    lastnikState,
    sluznostiState,
    plombe,
    
    allEmso,
    maticna,
    allPriimek_ime,
    naslov,
    posta,
    delez,
    
    zadevaDn,
    tipPostopka,
    casUcinDatum,
    casUcinCas,
    stanjeZadeve,
    nacinOd,
    
    idPravice,
    vrstaPravice,
    ucinDatum,
    ucinUra,
    imetnikNaziv,
    imetnikNaslov,
    imetnikPosta,
    opis
  } = usePdf();
  
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Main export function
  const exportToExcel = () => {
    setIsExporting(true);
    setError(null);
    setSuccessMessage("");

    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Extract data from the context
      const sifra = lastnikState.sifra || '';
      const parcela = lastnikState.parcela || '';
      
      // Add data to the respective sheets
      addToLastnikSheet(workbook, sifra, parcela, allEmso, allPriimek_ime, naslov, posta, delez);
      addToSluznostiSheet(workbook, sifra, parcela, idPravice, vrstaPravice, ucinDatum, ucinUra, imetnikNaziv, imetnikNaslov, imetnikPosta, opis);
      addToPlombeSheet(workbook, sifra, parcela, zadevaDn, tipPostopka, casUcinDatum, casUcinCas, stanjeZadeve, nacinOd);
      
      // Export the workbook to a file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      saveAsExcelFile(excelBuffer, 'zemljiska_knjiga_izvoz.xlsx');
      
      setSuccessMessage("Podatki so bili uspešno izvoženi.");
    } catch (err) {
      console.error("Napaka pri izvozu:", err);
      setError(`Napaka pri izvozu: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Function to add data to the Lastnik sheet
  const addToLastnikSheet = (workbook, sifra, parcela, emsos, priimekImes, naslovs, postas, delezs) => {
    // Create or get the Lastnik sheet
    let lastnikSheet;
    if (workbook.SheetNames.includes('Lastnik')) {
      lastnikSheet = workbook.Sheets['Lastnik'];
    } else {
      lastnikSheet = XLSX.utils.aoa_to_sheet([  // Adds the header as the first row
        ['Šifra', 'Parcela', 'EMŠO', 'Priimek_Ime', 'Naslov', 'Pošta', 'Delež']
      ]);
      XLSX.utils.book_append_sheet(workbook, lastnikSheet, 'Lastnik');
    }
  
    // Get the maximum length of arrays to ensure we have enough rows
    const maxLength = Math.max(
      emsos.length,
      priimekImes.length,
      naslovs.length,
      postas.length,
      delezs.length,
      1  // Ensure at least one row is created even if all arrays are empty
    );
  
    // Create rows
    const rows = [];
    for (let i = 0; i < maxLength; i++) {
      rows.push([
        sifra,
        parcela,
        emsos[i] || '',
        priimekImes[i] || '',
        naslovs[i] || '',
        postas[i] || '',
        delezs[i] || ''
      ]);
    }
  
    // Add rows to the sheet, ensuring headers are present
    if (rows.length > 0) {
      // The header row is already added, so we start from the second row (origin: 1)
      XLSX.utils.sheet_add_aoa(lastnikSheet, rows, { origin: -1 });
    }
  };
  
  // Function to add data to the Služnosti sheet
  const addToSluznostiSheet = (workbook, sifra, parcela, idPravices, vrstaPravices, ucinDatums, ucinUras, imetnikNazivs, imetnikNaslovs, imetnikPostas, opiss) => {
    // Create or get the Služnosti sheet
    let sluznostiSheet;
    if (workbook.SheetNames.includes('Služnosti')) {
      sluznostiSheet = workbook.Sheets['Služnosti'];
    } else {
      sluznostiSheet = XLSX.utils.aoa_to_sheet([  // Adds the header as the first row
        ['Šifra', 'Parcela', 'ID_pravice', 'Vrsta_pravice', 'Učin_datum', 'Učin_ura', 'Imetnik_naziv', 'Imetnik_naslov', 'Imetnik_pošta', 'Opis']
      ]);
      XLSX.utils.book_append_sheet(workbook, sluznostiSheet, 'Služnosti');
    }
  
    // Get the maximum length of arrays for this sheet
    const maxLength = Math.max(
      idPravices.length,
      vrstaPravices.length,
      ucinDatums.length,
      ucinUras.length,
      imetnikNazivs.length,
      imetnikNaslovs.length,
      imetnikPostas.length,
      opiss.length,
      1  // Ensure at least one row is created
    );
  
    // Create rows
    const rows = [];
    for (let i = 0; i < maxLength; i++) {
      rows.push([
        sifra,
        parcela,
        idPravices[i] || '',
        vrstaPravices[i] || '',
        ucinDatums[i] || '',
        ucinUras[i] || '',
        imetnikNazivs[i] || '',
        imetnikNaslovs[i] || '',
        imetnikPostas[i] || '',
        opiss[i] || ''
      ]);
    }
  
    // Add rows to the sheet, ensuring headers are present
    if (rows.length > 0) {
      XLSX.utils.sheet_add_aoa(sluznostiSheet, rows, { origin: -1 });
    }
  };
  
  // Function to add data to the Plombe sheet
  const addToPlombeSheet = (workbook, sifra, parcela, zadevaDns, tips, casUcinDatums, casUcinCass, stanjeZadeves, nacins) => {
    // Create or get the Plombe sheet
    let plombeSheet;
    if (workbook.SheetNames.includes('Plombe')) {
      plombeSheet = workbook.Sheets['Plombe'];
    } else {
      plombeSheet = XLSX.utils.aoa_to_sheet([  // Adds the header as the first row
        ['Šifra', 'Parcela', 'Zadeva DN', 'Tip', 'Učin Datum', 'Učin Ura', 'Stanje', 'Način']
      ]);
      XLSX.utils.book_append_sheet(workbook, plombeSheet, 'Plombe');
    }
  
    // Get the maximum length of arrays for this sheet
    const maxLength = Math.max(
      zadevaDns.length,
      tips.length,
      casUcinDatums.length,
      casUcinCass.length,
      stanjeZadeves.length,
      nacins.length,
      1  // Ensure at least one row is created
    );
  
    // Create rows
    const rows = [];
    for (let i = 0; i < maxLength; i++) {
      rows.push([
        sifra,
        parcela,
        zadevaDns[i] || '',
        tips[i] || '',
        casUcinDatums[i] || '',
        casUcinCass[i] || '',
        stanjeZadeves[i] || '',
        nacins[i] || ''
      ]);
    }
  
    // Add rows to the sheet, ensuring headers are present
    if (rows.length > 0) {
      XLSX.utils.sheet_add_aoa(plombeSheet, rows, { origin: -1 });
    }
  };
  
  // Helper function to save the Excel file
  const saveAsExcelFile = (buffer, fileName) => {
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="export">
      <div className="export-polje">
        <div>Število zaznanih obrazcev: {pdfFiles.length}</div>
        <button
          className="export-button"
          onClick={exportToExcel}
          disabled={isExporting || pdfFiles.length === 0}
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