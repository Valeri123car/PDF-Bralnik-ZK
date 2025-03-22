import { useEffect, useState } from "react";
import { usePdf } from "./PdfContext";
import PopUp from "./Popout";

function Forms({ index = 0 }) {
  const { extractedTexts, extractingData, pdfFiles, formData, updateFormData } = usePdf();
  
  const [isPopUpVisible, setIsPopUpVisible] = useState(false);
  const [popUpText, setPopUpText] = useState("");
  
  const [lastnikState, setLastnikState] = useState({
    sifra:"",
    parcela:"",
    emso:"",
    priimek_ime:"",
    naslov:"",
    pošta:"",
    delez:""
  });

  const [sluznostiState, setSluznostiState] = useState({
    sifra:"",
    parcela:"",
    id_pravice:"",
    vrsta_pravice:"",
    ucin_datum:"",
    ucin_ura:"",
    imetnik_naziv: "",
    imetnik_naslov: "",
    imetnik_posta: "",
    opis: ""
  });

  const [plombe, setPlombeState] = useState({
    sifra:"",
    parcela:"",
    zadeva_dn:"",
    tip:"",
    ucin_datum:"",
    ucin_ura:"",
    stanje:"",
    nacin:""
  });

  const [allEmso, setAllEmso] = useState([]); 
  const [maticna, setMaticna] = useState([]);
  const [allPriimek_ime, setPriimekIme] = useState([])
  const [naslov, setNaslov] = useState([])
  const [delez, setDelez] = useState([])

  useEffect(() => {
    if (formData && formData[index]) {
      setFormState(formData[index]);
    }
  }, [formData, index]);

  useEffect(() => {
    if (extractedTexts && extractedTexts.length > index && extractingData) {
      const currentPdfText = extractedTexts[index]?.text || "";

      const sifraMatch = currentPdfText.match(/\(ID\s*(\d+)\)/);
      if (sifraMatch) {
        const sifraValue = sifraMatch[1];

        setLastnikState(prevState => ({
          ...prevState,
          sifra: sifraValue
        }));

        setSluznostiState(prevState => ({
          ...prevState,
          sifra: sifraValue
        }));

        setPlombeState(prevState => ({
          ...prevState,
          sifra: sifraValue
        }));
      }

      const parcelaMatch = currentPdfText.match(/parcela\s*([\d\/]+)(?=\s*\(ID)/i);
      if (parcelaMatch) {
        const parcelaValue = parcelaMatch[1];  
        setLastnikState(prevState => ({
          ...prevState,
          parcela: parcelaValue
        }));
      }

      //REGEX ZA PRVI EXCEL ZVEZEK
      let searchText = currentPdfText;
      const podatkiIndex = currentPdfText.indexOf("Podrobni podatki o izvedenih pravicah in zaznambah:");
      if (podatkiIndex !== -1) {
        searchText = currentPdfText.substring(0, podatkiIndex);
      }
      //EMŠO IN MATIČNA (MATIC?)
      const emsoRegex = /Emšo:\s*(.*?)\s*osebno/gi;
      const emsoMatches = [...searchText.matchAll(emsoRegex)];
      //console.log("EMSO matches:", emsoMatches); 
      let emsoValues = [];
      if (emsoMatches.length === 0) {
        emsoValues.push("ni emša");
      } else {
        emsoValues = emsoMatches.map(match => match[1].trim());
      }
      const maticnaRegex = /matična številka:\s*(.*?)\s*firma/gi;
      const maticnaMatches = [...searchText.matchAll(maticnaRegex)];
      let maticnaValues = [1];
      if (maticnaMatches.length === 0) {
        console.log("ni matišne številke");
      } else {
        maticnaValues = maticnaMatches.map(match => match[1].trim());
      }
      let matcInEmsoValues = [...emsoValues, ...maticnaValues];
      setAllEmso(matcInEmsoValues);
      //IME
      const priimekImeRegex = /osebno ime:\s*([\s\S]+?)(?=\s*naslov:)/gi;
      const priimekImeMatch = [...searchText.match(priimekImeRegex)];
      if (priimekImeMatch && priimekImeMatch.length > 0) {
        const priimekImeMatchValues = priimekImeMatch.map(match => match.replace('osebno ime:', '').trim());
        setPriimekIme(priimekImeMatchValues);
      } else {
        console.log("No priimek/ime match found.");
      }
      //NASLOV
      const naslovMatches = [];
      const naslovRegex = /naslov:\s*([^]*?)(?=\s+(?:\d+\/\d+|omejitve:|zveza|ID|$)|\n)/gi;
      let naslovMatch;
      while ((naslovMatch = naslovRegex.exec(searchText)) !== null) {
        if (naslovRegex.lastIndex <= naslovMatch.index) {
          naslovRegex.lastIndex = naslovMatch.index + 1;
          continue;
        }
        const address = naslovMatch[1].trim();
        if (!address) {
          naslovMatches.push("ni naslova");
        } else if (address.length > 100) {
          naslovMatches.push("ni naslova");
        } else {
          naslovMatches.push(address);
        }
      }
      console.log("Extracted addresses:", naslovMatches);
      setNaslov(naslovMatches);
      //DELEŽ
      const delezRegex = /delež:\s*(.*?)\s*imetnik/gi;
      const delezMatch = [...searchText.match(delezRegex)];
      if (delezMatch && delezMatch.length > 0) {
        const delezValues = delezMatch.map(match => match.replace('delež:', '').trim());
        setDelez(delezValues);
      } else {
        console.log("ni deleža");
      }
    }
  }, [extractedTexts, extractingData, index]);

  return (
    <div className="forms">
      <div>Extracted Number: {lastnikState.sifra ? lastnikState.sifra : "/"}</div>
      <div>parcela: {lastnikState.parcela ? lastnikState.parcela : "/"}</div>
      <ul>
        {allEmso.length > 0 ? allEmso.map((emso, idx) => (
          <li key={idx}>{emso}</li>
        )) : <li>ni nobenga emša</li>}
      </ul>
      <ul>
        {allPriimek_ime.length > 0 ? allPriimek_ime.map((ime, idx) => (
          <li key={idx}>{ime}</li>
        )) : <li>ni nobenga imena</li>}
      </ul>
      <ul>
        {naslov.length > 0 ? naslov.map((ime, idx) => (
          <li key={idx}>{ime}</li>
        )) : <li>ni nobenga naslova</li>}
      </ul>
      
      <ul>
        {delez.length > 0 ? delez.map((ime, idx) => (
          <li key={idx}>{ime}</li>
        )) : <li>ni nobenga naslova</li>}
      </ul>
      </div>
  );
}

export default Forms;
