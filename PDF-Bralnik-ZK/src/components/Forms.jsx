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

      const emsoMatches = [...currentPdfText.matchAll(/Emšo:\s*([\d\*]+)(?=\s*\osebno)/gi)];
      const emsoValues = emsoMatches.map(match => match[1]);
      setAllEmso(emsoValues); 
    }
  }, [extractedTexts, extractingData, index]);

  return (
    <div className="forms">
      <div>Extracted Number: {lastnikState.sifra ? lastnikState.sifra : "No match found"}</div>
      <div>parcela: {lastnikState.parcela ? lastnikState.parcela : "ni najdenega zadetka"}</div>
      <div>emso: {lastnikState.emso ? lastnikState.emso : "ni najdenega zadetka"}</div>

      <div>All EMŠO Values:</div>
      <ul>
        {allEmso.length > 0 ? allEmso.map((emso, idx) => (
          <li key={idx}>{emso}</li>
        )) : <li>No EMŠO values found</li>}
      </ul>
    </div>
  );
}

export default Forms;
