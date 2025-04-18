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
      
      // IMPROVED EXTRACTION FOR EACH SECTION
      
      // Clear the opis array to avoid duplicates
      pdfData.opis = [];
      
      // Extract sections by ID pravice
      const sectionRegex = /ID\s+pravice\s*\/\s*zaznambe\s+(\d+).*?(?=ID\s+pravice\s*\/\s*zaznambe|$)/gis;
      const sections = [...stringOut.matchAll(sectionRegex)];
      
      // Process each section to extract fields
      for (let i = 0; i < sections.length; i++) {
        const sectionText = sections[i][0];
        const idPravice = sections[i][1];
        
        // 1. Extract organ (authority) - will be used as imetnikNaziv
        const organMatch = sectionText.match(/organ\s*,?\s*ki\s*vodi\s*postopek\s*([^(\n]*?)(?=opr\.|$)/i);
        const organ = organMatch ? organMatch[1].trim() : "";
        
        // 2. Extract procedure reference number - will be used as part of imetnikNaslov
        const refMatch = sectionText.match(/opr\.?\s*št\.?\s*postopka\s*([^(\n]*?)(?=dodatni|$)/i);
        const oprSt = refMatch ? refMatch[1].trim() : "";
        
        // 3. Extract additional description with improved regex
        const opisMatch = sectionText.match(/dodatni\s*opis:\s*(.*?)(?=(?:zaznamba\s+je\s+vpisan\s+pri\s+imetniku:|imetnik:|zveza|pravice\s*\/\s*zaznambe\s+pri|$))/is);
        const opis = opisMatch ? opisMatch[1].trim() : "";
        
        // Make sure we're not overwriting existing entries with actual imetnik data
        // Only add our custom entries if there are no real imetnik entries for this section
        if (i >= pdfData.imetnikNaziv.length) {
          // Add organ as imetnikNaziv
          if (organ) {
            pdfData.imetnikNaziv.push(organ);
            
            // Add oprSt as imetnikNaslov (if empty, use blank)
            pdfData.imetnikNaslov.push(oprSt || "");
            
            // Add empty postal code
            pdfData.imetnikPosta.push("");
          }
        }
        
        // Add description to opis array
        if (opis) {
          pdfData.opis.push(opis);
        }
      }
      
      // If no opis entries were found with improved regex, try the old one as fallback
      if (pdfData.opis.length === 0) {
        const opisRegex = /dodatni opis:\s*([\s\S]*?)\s*imetnik:/g;
        const opisMatches = [...stringOut.matchAll(opisRegex)];
        if (opisMatches && opisMatches.length > 0){
          pdfData.opis = opisMatches.map(match => match[1].trim());
        }
      }
      
      updateExtractedDataForPdf(index, pdfData);
    }
  }, [extractedTexts, extractingData, index]);

  // Extract owners in order by section with grouping by ID
  function extractOwnersInOrder(searchText) {
    // This will store owners grouped by ID
    const ownersByID = {};
    
    // First identify all ID osnovnega položaja sections
    const sectionPattern = /ID osnovnega položaja:\s*(\d+).*?(?=ID osnovnega položaja:|Podrobni podatki|$)/gs;
    let sectionMatch;
    
    console.log("Starting to extract owners from text length:", searchText.length);
    
    // Function to extract postal code from addresses
    function extractPostalCode(address) {
      // Several patterns to match various postal code formats
      
      // Standard Slovenian format: ", 2324 "
      const slovenianPattern = /,\s*(\d{4,5})\s+/;
      
      // International format with country code: ", De 75217 "
      const internationalPattern = /,\s*(?:[A-Za-z]{2}\s+)?(\d{4,5})\s+/;
      
      // General pattern to find any 4-5 digit number in the address
      const generalPattern = /\b(\d{4,5})\b/;
      
      // Try each pattern in order of specificity
      let match = address.match(slovenianPattern);
      if (match) return match[1];
      
      match = address.match(internationalPattern);
      if (match) return match[1];
      
      match = address.match(generalPattern);
      if (match) return match[1];
      
      return "ni pošte";
    }
    
    while ((sectionMatch = sectionPattern.exec(searchText)) !== null) {
      const section = sectionMatch[0];
      const idOsnovnegaPolozaja = sectionMatch[1];
      
      console.log("Found ID osnovnega položaja:", idOsnovnegaPolozaja);
      
      // Initialize this ID if not exists
      if (!ownersByID[idOsnovnegaPolozaja]) {
        ownersByID[idOsnovnegaPolozaja] = {
          emso: [],
          maticna: [],
          priimek_ime: [],
          naslov: [],
          posta: []
        };
      }
      
      // Direct check for matična številka in this section
      const maticnaRegex = /matična\s+številka:\s*(\d+)/gi;
      const maticnaMatches = [...section.matchAll(maticnaRegex)];
      
      console.log(`DEBUG [${idOsnovnegaPolozaja}] - maticnaMatches:`, maticnaMatches.map(m => m[1]));
      
      if (maticnaMatches && maticnaMatches.length > 0) {
        // Found matična številka(s) in this section
        for (const match of maticnaMatches) {
          const maticnaValue = match[1];
          console.log(`DEBUG [${idOsnovnegaPolozaja}] - Found matična številka:`, maticnaValue);
          
          // Look for corresponding firma
          const firmaRegex = /firma\s*\/\s*naziv:\s*(.+?)(?=\s*naslov:|$)/i;
          const firmaMatch = section.match(firmaRegex);
          let firmaNaziv = "ni imena";
          
          if (firmaMatch) {
            firmaNaziv = firmaMatch[1].trim();
            console.log(`DEBUG [${idOsnovnegaPolozaja}] - Found firma:`, firmaNaziv);
          }
          
          // Add to the data - put matična številka in the EMŠO field
          ownersByID[idOsnovnegaPolozaja].emso.push(maticnaValue);
          ownersByID[idOsnovnegaPolozaja].maticna.push(""); // Leave empty as we're using EMŠO field
          ownersByID[idOsnovnegaPolozaja].priimek_ime.push(firmaNaziv);
          
          // Extract address
          const naslovRegex = /naslov:\s*(.+?)(?=\s*(?:Pri imetniku|omejitve:|ID|$))/i;
          const naslovMatch = section.match(naslovRegex);
          let fullAddress = "ni naslova";
          
          if (naslovMatch) {
            fullAddress = naslovMatch[1].trim();
            ownersByID[idOsnovnegaPolozaja].naslov.push(fullAddress);
            
            // Use improved postal code extraction
            const postalCode = extractPostalCode(fullAddress);
            ownersByID[idOsnovnegaPolozaja].posta.push(postalCode);
          } else {
            ownersByID[idOsnovnegaPolozaja].naslov.push("ni naslova");
            ownersByID[idOsnovnegaPolozaja].posta.push("ni pošte");
          }
        }
      } else {
        // No matična številka found, look for EMŠO
        const emsoRegex = /(Emšo|EMŠO):\s*((?:\d+\*+)|(?:podatek\s+ni\s+vpisan)|(?:\d+))/gi;
        const emsoMatches = [...section.matchAll(emsoRegex)];
        
        console.log(`DEBUG [${idOsnovnegaPolozaja}] - emsoMatches:`, emsoMatches.map(m => m[2]));
        
        if (emsoMatches && emsoMatches.length > 0) {
          // Try to extract the owners with EMŠO
          // Check if this is numbered (1., 2., etc.) or a single entry
          const ownersPattern = /(\d+\.)\s+((?:EMŠO|Emšo):[^]*?(?=\d+\.|ID osnovnega položaja:|Podrobni podatki|omejitve:|$))/gs;
          let ownersMatch = [...section.matchAll(ownersPattern)];
          
          if (ownersMatch && ownersMatch.length > 0) {
            console.log(`DEBUG [${idOsnovnegaPolozaja}] - Found numbered owners:`, ownersMatch.length);
            
            // Process each numbered owner
            for (const match of ownersMatch) {
              const ownerNumber = match[1];
              const ownerDetails = match[2];
              
              // Extract EMŠO
              const emsoMatch = ownerDetails.match(/(Emšo|EMŠO):\s*((?:\d+\*+)|(?:podatek\s+ni\s+vpisan)|(?:\d+))/i);
              if (emsoMatch) {
                const emsoValue = emsoMatch[2].trim();
                console.log(`DEBUG [${idOsnovnegaPolozaja}] - Found EMŠO:`, emsoValue);
                
                ownersByID[idOsnovnegaPolozaja].emso.push(emsoValue);
                ownersByID[idOsnovnegaPolozaja].maticna.push(""); // Empty for individuals
                
                // Extract name
                let imePriimek = "ni imena";
                const imeMatch = ownerDetails.match(/osebno ime:\s*(.+?)(?=\s*naslov:|$)/i);
                if (imeMatch) {
                  imePriimek = imeMatch[1].trim();
                  console.log(`DEBUG [${idOsnovnegaPolozaja}] - Found ime:`, imePriimek);
                }
                ownersByID[idOsnovnegaPolozaja].priimek_ime.push(imePriimek);
                
                // Extract address
                const naslovMatch = ownerDetails.match(/naslov:\s*(.+?)(?=\s*(?:Pri imetniku|omejitve:|ID|$))/i);
                if (naslovMatch) {
                  const fullAddress = naslovMatch[1].trim();
                  ownersByID[idOsnovnegaPolozaja].naslov.push(fullAddress);
                  
                  // Use improved postal code extraction
                  const postalCode = extractPostalCode(fullAddress);
                  ownersByID[idOsnovnegaPolozaja].posta.push(postalCode);
                } else {
                  ownersByID[idOsnovnegaPolozaja].naslov.push("ni naslova");
                  ownersByID[idOsnovnegaPolozaja].posta.push("ni pošte");
                }
              }
            }
          } else {
            // Single EMŠO individual
            console.log(`DEBUG [${idOsnovnegaPolozaja}] - Found single EMŠO owner`);
            
            for (const match of emsoMatches) {
              const emsoValue = match[2].trim();
              ownersByID[idOsnovnegaPolozaja].emso.push(emsoValue);
              ownersByID[idOsnovnegaPolozaja].maticna.push("");
              
              // Extract name
              let imePriimek = "ni imena";
              const imeMatch = section.match(/osebno ime:\s*(.+?)(?=\s*naslov:|$)/i);
              if (imeMatch) {
                imePriimek = imeMatch[1].trim();
              }
              ownersByID[idOsnovnegaPolozaja].priimek_ime.push(imePriimek);
              
              // Extract address
              const naslovMatch = section.match(/naslov:\s*(.+?)(?=\s*(?:Pri imetniku|omejitve:|ID|$))/i);
              if (naslovMatch) {
                const fullAddress = naslovMatch[1].trim();
                ownersByID[idOsnovnegaPolozaja].naslov.push(fullAddress);
                
                // Use improved postal code extraction
                const postalCode = extractPostalCode(fullAddress);
                ownersByID[idOsnovnegaPolozaja].posta.push(postalCode);
              } else {
                ownersByID[idOsnovnegaPolozaja].naslov.push("ni naslova");
                ownersByID[idOsnovnegaPolozaja].posta.push("ni pošte");
              }
            }
          }
        } else {
          // No EMŠO found either, add placeholder
          console.log(`DEBUG [${idOsnovnegaPolozaja}] - No identifiers found`);
          
          ownersByID[idOsnovnegaPolozaja].emso.push("ni identifikacijske številke");
          ownersByID[idOsnovnegaPolozaja].maticna.push("");
          ownersByID[idOsnovnegaPolozaja].priimek_ime.push("ni imena");
          ownersByID[idOsnovnegaPolozaja].naslov.push("ni naslova");
          ownersByID[idOsnovnegaPolozaja].posta.push("ni pošte");
        }
      }
      
      // Debug output of ownersByID for this ID
      console.log(`DEBUG [${idOsnovnegaPolozaja}] - Final data for this ID:`, JSON.stringify({
        emso: ownersByID[idOsnovnegaPolozaja].emso,
        maticna: ownersByID[idOsnovnegaPolozaja].maticna,
        priimek_ime: ownersByID[idOsnovnegaPolozaja].priimek_ime,
        naslov: ownersByID[idOsnovnegaPolozaja].naslov,
        posta: ownersByID[idOsnovnegaPolozaja].posta
      }));
    }
    
    // Now convert ownersByID to a flat structure
    const flatOwnersData = {
      emso: [],
      maticna: [],
      priimek_ime: [],
      naslov: [],
      posta: []
    };
    
    // For each ID, join the multiple entries
    for (const id of Object.keys(ownersByID)) {
      const ownersForId = ownersByID[id];
      
      // Filter out empty values before joining for emso and maticna
      flatOwnersData.emso.push(ownersForId.emso.filter(val => val).join(', ') || "");
      flatOwnersData.maticna.push(ownersForId.maticna.filter(val => val).join(', ') || "");
      flatOwnersData.priimek_ime.push(ownersForId.priimek_ime.join(', '));
      flatOwnersData.naslov.push(ownersForId.naslov.join('; '));
      flatOwnersData.posta.push(ownersForId.posta.join(', '));
    }
    
    console.log("FINAL DEBUG - flatOwnersData:", JSON.stringify(flatOwnersData));
    
    // If nothing was found, add placeholders
    if (flatOwnersData.emso.length === 0) {
      flatOwnersData.emso = ["ni identifikacijske številke"];
      flatOwnersData.maticna = [""];
      flatOwnersData.priimek_ime = ["ni imena"];
      flatOwnersData.naslov = ["ni naslova"];
      flatOwnersData.posta = ["ni pošte"];
    }
    
    return flatOwnersData;
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