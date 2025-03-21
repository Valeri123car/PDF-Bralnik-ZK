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
      //maticno stevilka tudi
      const emsoMatches = [...currentPdfText.matchAll(/Emšo:\s*([\d\*]+)(?=\s*\osebno)/gi)];
      const emsoValues = emsoMatches.map(match => match[1]);
      setAllEmso(emsoValues);
      
      const priimekImeMatch = [...currentPdfText.match(/osebno ime:\s*([\s\S]+?)(?=\s*naslov:)/gi)];
      if (priimekImeMatch) {
        const priimekImeMatchValues = priimekImeMatch.map(match => match.replace('osebno ime:', '').trim());
        setPriimekIme(priimekImeMatchValues);
      } else {
        console.log("No match found.");
      }

      const naslovMatch = [...currentPdfText.match(/naslov:\s*([\s\S]*\s*(?:\d+\/\d+|omejitve)[^,]*)/i)];
      console.log("Raw match:", naslovMatch);  // Check what match is returned

      // Extract the value from the match
      const naslovValue = naslovMatch.map(match => match[1]);
      console.log("Naslov extracted:", naslovValue);

      // Ensure the state is updated correctly
      setNaslov(naslovValue);

      const maticnaMatches = [...currentPdfText.matchAll()]
      

    }
  }, [extractedTexts, extractingData, index]);

  return (
    <div className="forms">
      <div>Extracted Number: {lastnikState.sifra ? lastnikState.sifra : "/"}</div>
      <div>parcela: {lastnikState.parcela ? lastnikState.parcela : "/"}</div>
      <div>All EMŠO Values:</div>
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
      </div>
  );
}

export default Forms;
