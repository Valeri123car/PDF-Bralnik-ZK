import { useEffect, useState } from "react";
import { usePdf } from "./PdfContext";

function Forms({ index = 0 }) {
  const { 
    extractedTexts, 
    extractingData, 
    pdfFiles, 
    formData, 
    extractedDataByPdf, setExtractedDataByPdf,
    currentPdfIndex, setCurrentPdfIndex
  } = usePdf();

  const updateExtractedDataForPdf = (pdfIndex, data) => {
    setExtractedDataByPdf(prevData => {
      const newData = [...prevData];
      if (!newData[pdfIndex]) {
        newData[pdfIndex] = {};
      }
      newData[pdfIndex] = {...newData[pdfIndex], ...data};
      return newData;
    });
  };

  useEffect(() => {
    if (formData && formData[index]) {
      setFormState(formData[index]);
    }
  }, [formData, index]);

  useEffect(() => {
    if (extractedTexts && extractedTexts.length > index && extractingData) {
      const currentPdfText = extractedTexts[index]?.text || "";
      setCurrentPdfIndex(index);

      const pdfData = {
        sifra: "",
        parcela: "",
        emso: [],
        maticna: [],
        priimek_ime: [],
        naslov: [],
        posta: [],
        delez: [],
        zadevaDn: [],
        tipPostopka: [],
        casUcinDatum: [],
        casUcinCas: [],
        stanjeZadeve: [],
        nacinOd: [],
        idPravice: [],
        vrstaPravice: [],
        ucinDatum: [],
        ucinUra: [],
        imetnikNaziv: [],
        imetnikNaslov: [],
        imetnikPosta: [],
        opis: []
      };

      const sifraMatch = currentPdfText.match(/katastrska\s*občina\s*(\d+)/); //zamenjaj na katastrask občina d+
      if (sifraMatch) {
        const sifraValue = sifraMatch[1];
        pdfData.sifra = sifraValue;
      }

      const parcelaMatch = currentPdfText.match(/parcela\s*([\d\/]+)(?=\s*\(ID)/i);
      if (parcelaMatch) {
        const parcelaValue = parcelaMatch[1];  
        pdfData.parcela = parcelaValue;
      }
      
      //REGEX ZA LASTNIKE
      const osnovniPosition = currentPdfText.indexOf("Osnovni pravni položaj nepremičnine:");
      const podatkiIndex = currentPdfText.indexOf("Podrobni podatki o izvedenih pravicah in zaznambah:");
      let searchText = currentPdfText;
      if (osnovniPosition !== -1 && podatkiIndex !== -1 && osnovniPosition < podatkiIndex) {
        searchText = currentPdfText.substring(osnovniPosition, podatkiIndex);
      }
      // Extract owners in order by section
function extractOwnersInOrder(searchText) {
  const ownersData = [];
  
  // First identify all ID osnovnega položaja sections
  const sectionPattern = /ID osnovnega položaja:\s*(\d+).*?(?=ID osnovnega položaja:|Podrobni podatki|$)/gs;
  let sectionMatch;
  
  while ((sectionMatch = sectionPattern.exec(searchText)) !== null) {
    const section = sectionMatch[0];
    const position = sectionMatch.index;
    const id = sectionMatch[1];
    
    // Extract identifier (EMŠO or matična)
    let identifier = null;
    const emsoMatch = section.match(/(Emšo|EMŠO):\s*((?:\d+\*+)|(?:podatek\s+ni\s+vpisan)|(?:\d+))/i);
    const maticnaMatch = section.match(/matična številka:\s*([\d\*]+)/i);
    
    if (emsoMatch) {
      identifier = emsoMatch[2].trim();
    } else if (maticnaMatch) {
      identifier = maticnaMatch[1].trim();
    }
    
    // Extract name (osebno ime or firma/naziv)
    let name = null;
    const imeMatch = section.match(/osebno ime:\s*([\s\S]+?)(?=\s*naslov:|\d+\/\d+)/i);
    const firmaMatch = section.match(/firma\s*\/\s*naziv:\s*(.+?)(?=\s*naslov:|$)/i);
    
    if (imeMatch) {
      name = imeMatch[1].trim();
    } else if (firmaMatch) {
      name = firmaMatch[1].trim();
    }
    
    // Store with original position for sorting
    ownersData.push({
      position: position,
      identifier: identifier,
      name: name
    });
  }
  
  // Sort by position to maintain order
  ownersData.sort((a, b) => a.position - b.position);
  
  // Extract to arrays
  const emsoArray = [];
  const nameArray = [];
  
  for (const owner of ownersData) {
    if (owner.identifier) {
      emsoArray.push(owner.identifier);
    }
    if (owner.name) {
      nameArray.push(owner.name);
    }
  }
  
  return { 
    emso: emsoArray.length > 0 ? emsoArray : ["ni identifikacijske številke"],
    priimek_ime: nameArray.length > 0 ? nameArray : ["ni imena"]
  };
}

// Use the function
const extractedData = extractOwnersInOrder(searchText);
pdfData.emso = extractedData.emso;
pdfData.priimek_ime = extractedData.priimek_ime;

      //NASLOV
      const naslovRegex = /naslov:\s*([^]*?)(?=\s+(?:\d+\/\d+|omejitve:|zveza|ID|$)|\n)/gi;
      let naslovMatch;
      while ((naslovMatch = naslovRegex.exec(searchText)) !== null) {
        if (naslovRegex.lastIndex <= naslovMatch.index) {
          naslovRegex.lastIndex = naslovMatch.index + 1;
          continue;
        }
        const address = naslovMatch[1].trim();
        if (!address) {
          pdfData.naslov.push("ni naslova");
        } else if (address.length > 100) {
          pdfData.naslov.push("ni naslova");
        } else {
          pdfData.naslov.push(address);
        }
      }
      
      //POSTA
      function extractPostalCodesInOrder(searchText) {
        const addresses = [];
        
        // First identify all naslov sections
        const naslovPattern = /naslov:\s*([^]*?)(?=\s*omejitve:|ID osnovnega položaja:|$)/gi;
        let naslovMatch;
        
        while ((naslovMatch = naslovPattern.exec(searchText)) !== null) {
          const addressText = naslovMatch[1].trim();
          const position = naslovMatch.index;
          let postalCode = null;
          
          // Try different postal code patterns
          
          // Standard Slovenian/Croatian format: City, 1000 Ljubljana
          const standardMatch = addressText.match(/,\s*(\d{4,5})\s+[^,]+/);
          
          // International format with postal before city: 1061 Budapest
          const internationalMatch = addressText.match(/\b(\d{4,5})\s+[A-Za-z]/);
          
          // Format with postal after city: Rimini 47037
          const reverseMatch = addressText.match(/[A-Za-z]+\s+(\d{4,5})\b/);
          
          // House number confusion prevention - look for postal codes specifically 4-5 digits
          if (standardMatch) {
            postalCode = standardMatch[1];
          } else if (internationalMatch) {
            postalCode = internationalMatch[1];
          } else if (reverseMatch) {
            postalCode = reverseMatch[1];
          }
          
          // Store with original position for sorting
          addresses.push({
            position: position,
            fullAddress: addressText,
            postalCode: postalCode || "ni pošte"
          });
        }
        
        // Sort by position to maintain order
        addresses.sort((a, b) => a.position - b.position);
        
        // Extract just the postal codes
        return addresses.map(a => a.postalCode);
      }
      
      // Use the function
      pdfData.posta = extractPostalCodesInOrder(searchText);
      
      // Make sure we have at least one entry if nothing was found
      if (pdfData.posta.length === 0) {
        pdfData.posta = ["ni pošte"];
      }
      
      //DELEŽ
      const delezRegex = /delež:\s*(.*?)\s*(imetnik|\d+\/\d+)/gi;
      const delezMatches = [...searchText.matchAll(delezRegex)];
      if (delezMatches && delezMatches.length > 0) {
        pdfData.delez = delezMatches.map(match => match[2].trim());
      }
      
      // REGEX ZA PLOMBE - NEW IMPLEMENTATION
      const osnovniPositionPlombe = currentPdfText.indexOf("Plombe:");
      const podatkiIndexPlombe = currentPdfText.indexOf("Osnovni pravni položaj nepremičnine:");
      
      if (osnovniPositionPlombe !== -1 && podatkiIndexPlombe !== -1 && osnovniPositionPlombe < podatkiIndexPlombe) {
        const searchTextPlombe = currentPdfText.substring(osnovniPositionPlombe, podatkiIndexPlombe);
        
        // Extract plombe data by case
        const plombeData = extractPlombeData(searchTextPlombe);
        
        // Fill pdfData with extracted plombe info
        if (plombeData.length > 0) {
          pdfData.zadevaDn = plombeData.map(p => p.zadevaDn);
          pdfData.tipPostopka = plombeData.map(p => p.tipPostopka);
          pdfData.casUcinDatum = plombeData.map(p => p.casUcinDatum);
          pdfData.casUcinCas = plombeData.map(p => p.casUcinCas);
          pdfData.stanjeZadeve = plombeData.map(p => p.stanjeZadeve);
          pdfData.nacinOd = plombeData.map(p => p.nacinOd);
        }
      }
      
      //REGEX ZA SLUŽNOSTI
      let stringOut = "";
      const prvaPozicija = "Podrobni podatki o izvedenih pravicah in zaznambah:"; 
      const searchIndex = currentPdfText.indexOf(prvaPozicija); 
      if (searchIndex !== -1) {
        stringOut = currentPdfText.slice(searchIndex + prvaPozicija.length).trim();
      }
      
      //id pravice
      const idPraviceRegex = /ID\s*pravice\s*\/\s*zaznambe\s*(\d+)/gi;
      const idPraviceMatches = [...stringOut.matchAll(idPraviceRegex)];
      if (idPraviceMatches && idPraviceMatches.length > 0){
        pdfData.idPravice = idPraviceMatches.map(match => match[1].trim());
      }
      
      //vrsta pravice
      const vrstaPraviceRe = /vrsta\s*pravice\s*\/\s*zaznambe\s+(\d+\s*-\s*[^\n\r]+?)(?=\s*glavna|podatki|\s*\d+\/\d+)/gi;
      const vrstaPraviceMatches = [...stringOut.matchAll(vrstaPraviceRe)];
      if(vrstaPraviceMatches && vrstaPraviceMatches.length > 0){
        pdfData.vrstaPravice = vrstaPraviceMatches.map(match => match[1].trim());
      }
      
      //ucin datum in ura
      const datumUraRegex = /čas\s*začetka\s*učinkovanja\s*(\d{2}.\d{2}.\d{4})\s*(\d*:\d*:\d*)/gi;
      const datumUraMatches = [...stringOut.matchAll(datumUraRegex)];
      if (datumUraMatches && datumUraMatches.length > 0){
        pdfData.ucinDatum = datumUraMatches.map(match => match[1].trim());
        pdfData.ucinUra = datumUraMatches.map(match => match[2].trim());
      }

      // Extract imetnik data
      const imetniki = extractImetnikData(stringOut);
      pdfData.imetnikNaziv = imetniki.map(im => im.firmaNaziv || im.osebnoIme.join(', ') || '');
      pdfData.imetnikNaslov = imetniki.map(im => im.naslov || []);
      pdfData.imetnikPosta = imetniki.map(im => im.posta || []);
      
      //opis
      const opisRegex = /dodatni opis:\s*([\s\S]*?)\s*imetnik:/g;
      const opisMatches = [...stringOut.matchAll(opisRegex)];
      if (opisMatches && opisMatches.length > 0){
        pdfData.opis = opisMatches.map(match => match[1].trim());
      }
      updateExtractedDataForPdf(index, pdfData);
    }
  }, [extractedTexts, extractingData, index]);

  // New function to extract plombe data by case
  function extractPlombeData(searchTextPlombe) {
    // Split text by "zadeva Dn" to separate individual cases
    // First replace all newlines with spaces to handle multi-line entries
    const normalizedText = searchTextPlombe.replace(/\n/g, ' ');
    
    // Split by "zadeva Dn" but keep the delimiter with the following part
    const caseParts = normalizedText.split(/(?=zadeva\s+Dn)/i).filter(part => part.trim());
    
    // Process each case separately
    const plombeData = [];
    
    for (const casePart of caseParts) {
      if (!casePart.trim()) continue;
      
      const caseData = {};
      
      // Extract zadeva Dn
      const zadevaDnMatch = casePart.match(/zadeva\s+Dn\s+(\d+\/\d+)/i);
      if (zadevaDnMatch) {
        caseData.zadevaDn = zadevaDnMatch[1].trim();
      }
      
      // Extract tip postopka
      const tipPostopkaMatch = casePart.match(/tip\s*postopka\s+(.*?)(?=stanje|začetek\s*postopka|$)/i);
      if (tipPostopkaMatch) {
        caseData.tipPostopka = tipPostopkaMatch[1].trim();
      }
      
      // Extract čas učinkovanja
      const casUcinMatch = casePart.match(/čas\s+začetka\s*učinkovanja\s*(\d{2}.\d{2}.\d{4})\s*(\d+:\d+:\d+)/i);
      if (casUcinMatch) {
        caseData.casUcinDatum = casUcinMatch[1].trim();
        caseData.casUcinCas = casUcinMatch[2].trim();
      }
      
      // Extract stanje zadeve
      const stanjeZadeveMatch = casePart.match(/stanje\s+zadeve\s+(.*?)(?=način|$)/i);
      if (stanjeZadeveMatch) {
        caseData.stanjeZadeve = stanjeZadeveMatch[1].trim();
      }
      
      // Extract način odločitve
      const nacinOdlMatch = casePart.match(/način\s+odločitve\s*o\s*vpisu:\s*(.*?)(?=\s*tip\s*pripada|$)/i);
      if (nacinOdlMatch) {
        caseData.nacinOd = nacinOdlMatch[1].trim();
      }
      
      // Only add if we have a valid zadeva Dn reference
      if (caseData.zadevaDn) {
        plombeData.push(caseData);
      }
    }
    
    return plombeData;
  }

  function extractImetnikData(stringOut) {
    const imetnikRegex = /imetnik:\s*(\d+\.)\s*(.*?)(?=imetnik:\s*\d+\.|$)/gs;
    
    const imetniki = [];
    let match;
    
    while ((match = imetnikRegex.exec(stringOut)) !== null) {
      const imetnikSection = match[2];
      const imetnikData = {
        redSt: match[1].replace('.', ''),
        maticnaStevilka: null,
        firmaNaziv: null,
        emso: [],
        osebnoIme: [],
        naslov: [],
        posta: [],
      };
  
      const maticnaStevilkaRegex = /matična\s*številka:\s*(\d+)/;
      const firmaRegex = /firma\s*\/\s*naziv:\s*(.+?)(?=\s*naslov:|$)/;
      const emsoRegex = /EMŠO:\s*(\d+[^\s]*)/g;  
      const osebnoImeRegex = /osebno\s*ime:\s*(.+?)(?=\s*naslov:|$)/g;  
      const naslovRegex = /naslov:\s*([^,]+),\s*(\d+)\s*(.*?)(?=\s*$|\n|EMŠO:|osebno\s*ime:|\d+\.)/s;

      const maticnaMatch = imetnikSection.match(maticnaStevilkaRegex);
      if (maticnaMatch) imetnikData.maticnaStevilka = maticnaMatch[1];
      
      const firmaMatch = imetnikSection.match(firmaRegex);
      if (firmaMatch) imetnikData.firmaNaziv = firmaMatch[1].trim();
      
      let emsoMatch;
      while ((emsoMatch = emsoRegex.exec(imetnikSection)) !== null) {
        imetnikData.emso.push(emsoMatch[1].trim());
      }
      
      let osebnoImeMatch;
      while ((osebnoImeMatch = osebnoImeRegex.exec(imetnikSection)) !== null) {
        imetnikData.osebnoIme.push(osebnoImeMatch[1].trim());
      }
      const naslovMatch = imetnikSection.match(naslovRegex);
      if (naslovMatch) {
        const naslov = naslovMatch[1].trim();
        const postalCode = parseInt(naslovMatch[2], 10);
        
        if (imetnikData.osebnoIme.length > 0) {
          imetnikData.naslov = new Array(imetnikData.osebnoIme.length).fill(naslov);
          imetnikData.posta = new Array(imetnikData.osebnoIme.length).fill(postalCode);
        } else {
          imetnikData.naslov.push(naslov);
          imetnikData.posta.push(postalCode);
        }
      }

      Object.keys(imetnikData).forEach(key => {
        if (typeof imetnikData[key] === 'string') {
          imetnikData[key] = imetnikData[key].replace(/\s+/g, ' ').trim();
        }
      });
      imetniki.push(imetnikData);
    }
  
    return imetniki;
  }
  const currentPdfData = extractedDataByPdf[index] || {};

  return (
    <></>
  );
}

export default Forms;