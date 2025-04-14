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
      
      // Extract owners data using the enhanced function
      const ownersData = extractOwnersInOrder(searchText);
      
      // Assign the extracted owner data to pdfData
      pdfData.emso = ownersData.emso;
      pdfData.maticna = ownersData.maticna;
      pdfData.priimek_ime = ownersData.priimek_ime;
      pdfData.naslov = ownersData.naslov;
      pdfData.posta = ownersData.posta;
      
      // Extract delež (ownership share)
      const delezRegex = /delež:\s*([\d\/]+)\s*imetnik:/gi;
      const delezMatches = [...searchText.matchAll(delezRegex)];
      if (delezMatches && delezMatches.length > 0) {
        // Use the first share for all owners
        const shareValue = delezMatches[0][1].trim();
        pdfData.delez = new Array(ownersData.emso.length).fill(shareValue);
      } else {
        pdfData.delez = new Array(ownersData.emso.length).fill("");
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

  // Extract owners in order by section with support for multiple owners per ID
  function extractOwnersInOrder(searchText) {
    const ownersData = {
      emso: [],
      maticna: [],
      priimek_ime: [],
      naslov: [],
      posta: []
    };
    
    // First identify all ID osnovnega položaja sections
    const sectionPattern = /ID osnovnega položaja:\s*(\d+).*?(?=ID osnovnega položaja:|Podrobni podatki|$)/gs;
    let sectionMatch;
    
    while ((sectionMatch = sectionPattern.exec(searchText)) !== null) {
      const section = sectionMatch[0];
      const idOsnovnegaPolozaja = sectionMatch[1];
      
      // Look for numbered owners within this section (e.g., "1.", "2.", etc.)
      const ownersPattern = /(\d+\.)\s+((?:EMŠO|Emšo|matična številka):[^]*?(?=\d+\.|ID osnovnega položaja:|Podrobni podatki|omejitve:|$))/gs;
      let ownerMatch;
      
      if (ownersPattern.test(section)) {
        // Reset to search from beginning of section
        ownersPattern.lastIndex = 0;
        
        // Extract each numbered owner
        while ((ownerMatch = ownersPattern.exec(section)) !== null) {
          const ownerNumber = ownerMatch[1];
          const ownerDetails = ownerMatch[2];
          
          // Extract EMŠO/matična številka
          const emsoMatch = ownerDetails.match(/(Emšo|EMŠO):\s*((?:\d+\*+)|(?:podatek\s+ni\s+vpisan)|(?:\d+))/i);
          const maticnaMatch = ownerDetails.match(/matična številka:\s*([\d\*]+)/i);
          
          if (emsoMatch) {
            ownersData.emso.push(emsoMatch[2].trim());
            ownersData.maticna.push(""); // Empty for individuals
          } else if (maticnaMatch) {
            ownersData.maticna.push(maticnaMatch[1].trim());
            ownersData.emso.push(""); // Empty for companies
          } else {
            // If neither is found, add placeholders
            ownersData.emso.push("ni identifikacijske številke");
            ownersData.maticna.push("");
          }
          
          // Extract name (osebno ime or firma/naziv)
          const imeMatch = ownerDetails.match(/osebno ime:\s*([^]*?)(?=\s*naslov:|$)/i);
          const firmaMatch = ownerDetails.match(/firma\s*\/\s*naziv:\s*([^]*?)(?=\s*naslov:|$)/i);
          
          if (imeMatch) {
            ownersData.priimek_ime.push(imeMatch[1].trim());
          } else if (firmaMatch) {
            ownersData.priimek_ime.push(firmaMatch[1].trim());
          } else {
            ownersData.priimek_ime.push("ni imena");
          }
          
          // Extract address
          const naslovMatch = ownerDetails.match(/naslov:\s*([^]*?)(?=\s*(?:Pri imetniku|omejitve:|ID|$))/i);
          if (naslovMatch) {
            const fullAddress = naslovMatch[1].trim();
            ownersData.naslov.push(fullAddress);
            
            // Try to extract postal code
            const postalMatch = fullAddress.match(/,\s*(\d{4,5})\s+/);
            if (postalMatch) {
              ownersData.posta.push(postalMatch[1]);
            } else {
              ownersData.posta.push("ni pošte");
            }
          } else {
            ownersData.naslov.push("ni naslova");
            ownersData.posta.push("ni pošte");
          }
        }
      } else {
        // No numbered owners found, try to extract single owner
        const emsoMatch = section.match(/(Emšo|EMŠO):\s*((?:\d+\*+)|(?:podatek\s+ni\s+vpisan)|(?:\d+))/i);
        const maticnaMatch = section.match(/matična številka:\s*([\d\*]+)/i);
        
        if (emsoMatch) {
          ownersData.emso.push(emsoMatch[2].trim());
          ownersData.maticna.push("");
        } else if (maticnaMatch) {
          ownersData.maticna.push(maticnaMatch[1].trim());
          ownersData.emso.push("");
        } else {
          ownersData.emso.push("ni identifikacijske številke");
          ownersData.maticna.push("");
        }
        
        const imeMatch = section.match(/osebno ime:\s*([^]*?)(?=\s*naslov:|$)/i);
        const firmaMatch = section.match(/firma\s*\/\s*naziv:\s*([^]*?)(?=\s*naslov:|$)/i);
        
        if (imeMatch) {
          ownersData.priimek_ime.push(imeMatch[1].trim());
        } else if (firmaMatch) {
          ownersData.priimek_ime.push(firmaMatch[1].trim());
        } else {
          ownersData.priimek_ime.push("ni imena");
        }
        
        // Extract address
        const naslovMatch = section.match(/naslov:\s*([^]*?)(?=\s*(?:Pri imetniku|omejitve:|ID|$))/i);
        if (naslovMatch) {
          const fullAddress = naslovMatch[1].trim();
          ownersData.naslov.push(fullAddress);
          
          // Try to extract postal code
          const postalMatch = fullAddress.match(/,\s*(\d{4,5})\s+/);
          if (postalMatch) {
            ownersData.posta.push(postalMatch[1]);
          } else {
            ownersData.posta.push("ni pošte");
          }
        } else {
          ownersData.naslov.push("ni naslova");
          ownersData.posta.push("ni pošte");
        }
      }
    }
    
    // Make sure we have at least one entry if nothing was found
    if (ownersData.emso.length === 0) {
      ownersData.emso = ["ni identifikacijske številke"];
      ownersData.maticna = [""];
      ownersData.priimek_ime = ["ni imena"];
      ownersData.naslov = ["ni naslova"];
      ownersData.posta = ["ni pošte"];
    }
    
    return ownersData;
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
  
  function extractPlombeData(searchTextPlombe) {
    const normalizedText = searchTextPlombe.replace(/\n/g, ' ');
    const caseParts = normalizedText.split(/(?=zadeva\s+Dn)/i).filter(part => part.trim());
    const plombeData = [];
    for (const casePart of caseParts) {
      if (!casePart.trim()) continue;
      const caseData = {};
      const zadevaDnMatch = casePart.match(/zadeva\s+Dn\s+(\d+\/\d+)/i);
      if (zadevaDnMatch) {
        caseData.zadevaDn = zadevaDnMatch[1].trim();
      }
      const tipPostopkaMatch = casePart.match(/tip\s*postopka\s+(.*?)(?=stanje|začetek\s*postopka|$)/i);
      if (tipPostopkaMatch) {
        caseData.tipPostopka = tipPostopkaMatch[1].trim();
      }
      const casUcinMatch = casePart.match(/čas\s+začetka\s*učinkovanja\s*(\d{2}.\d{2}.\d{4})\s*(\d+:\d+:\d+)/i);
      if (casUcinMatch) {
        caseData.casUcinDatum = casUcinMatch[1].trim();
        caseData.casUcinCas = casUcinMatch[2].trim();
      }
      const stanjeZadeveMatch = casePart.match(/stanje\s+zadeve\s+(.*?)(?=način|$)/i);
      if (stanjeZadeveMatch) {
        caseData.stanjeZadeve = stanjeZadeveMatch[1].trim();
      }
      const nacinOdlMatch = casePart.match(/način\s+odločitve\s*o\s*vpisu:\s*(.*?)(?=\s*tip\s*pripada|$)/i);
      if (nacinOdlMatch) {
        caseData.nacinOd = nacinOdlMatch[1].trim();
      }
      if (caseData.zadevaDn) {
        plombeData.push(caseData);
      }
    } 
    return plombeData;
  }

  return (
    <></>
  );
}

export default Forms;