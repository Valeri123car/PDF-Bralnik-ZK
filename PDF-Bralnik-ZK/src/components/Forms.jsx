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
  const [allPriimek_ime, setPriimekIme] = useState([]);
  const [naslov, setNaslov] = useState([]);
  const [posta, setPosta] = useState([]);
  const [delez, setDelez] = useState([]);

  const [zadevaDn,setZadevaDn] = useState([]);
  const [tipPostopka, setTipPostopka] = useState([]);
  const [casUcinDatum,setCasUcinDatum] = useState([]);
  const [casUcinCas, setCasUcinCas] = useState([]);
  const [stanjeZadeve, setStanjeZadeve] = useState([]);
  const [nacinOd, setNacinOd] = useState([]);

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
      //REGEX ZA LASTNIKE
      const osnovniPosition = currentPdfText.indexOf("Osnovni pravni položaj nepremičnine:");
      const podatkiIndex = currentPdfText.indexOf("Podrobni podatki o izvedenih pravicah in zaznambah:");
      let searchText = currentPdfText;
      if (osnovniPosition !== -1 && podatkiIndex !== -1 && osnovniPosition < podatkiIndex) {
        searchText = currentPdfText.substring(osnovniPosition, podatkiIndex);
        console.log("Limited search text to the relevant section");
      } else {
        console.log("Could not find both section markers, using full text");
      }
      //EMŠO IN MATIČNA (MATIC?)
      const emsoRegex = /(Emšo|EMŠO):\s*(\d+\*+)/gi;
      const emsoMatches = [...searchText.matchAll(emsoRegex)];
      //console.log("EMSO matches:", emsoMatches); 
      let emsoValues = [];
      if (emsoMatches.length === 0) {
        emsoValues.push("ni emša");
      } else {
        emsoValues = emsoMatches.map(match => match[2].trim());
      }
      const maticnaRegex = /matična številka:\s*(.*?)\s*firma/gi;
      const maticnaMatches = [...searchText.matchAll(maticnaRegex)];
      let maticnaValues = [];
      if (maticnaMatches.length === 0) {
        console.log("ni matišne številke");
      } else {
        maticnaValues = maticnaMatches.map(match => match[1].trim());
      }
      
      let matcInEmsoValues = [...emsoValues, ...maticnaValues];
      setAllEmso(matcInEmsoValues);
      //IME
      const priimekImeRegex = /osebno ime:\s*([\s\S]+?)(?=\s*naslov:|\d+\/\d+)/gi;
      const priimekImeMatches = [...searchText.matchAll(priimekImeRegex)];
      if (priimekImeMatches && priimekImeMatches.length > 0) {
        const priimekImeMatchValues = priimekImeMatches.map(match => match[1].trim());
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
      //POSTA
      const postaMatches = [];
      const postaRegex = /naslov:\s*(.*?,\s*)(\d+)(?=omejitve:|\d+\/\d+|(.*))/gi;
      let postaMatch;
      while ((postaMatch = postaRegex.exec(searchText)) !== null) {
        if (postaRegex.lastIndex <= postaMatch.index) {
          postaRegex.lastIndex = postaMatch.index + 1;
          continue;
        }
        const posta = postaMatch[2].trim();
        if (!posta) {
          postaMatches.push("ni pošte");
        } else if (posta.length > 100) {
          postaMatches.push("ni pošte");
        } else {
          postaMatches.push(posta);
        }
      }
      console.log("vse poste:", postaMatches);
      setPosta(postaMatches);
      //DELEŽ
      const delezRegex = /delež:\s*(.*?)\s*(imetnik|\d+\/\d+)/gi;
      const delezMatches = [...searchText.matchAll(delezRegex)];
      if (delezMatches && delezMatches.length > 0) {
        const delezValues = delezMatches.map(match => match[2].trim());
        setDelez(delezValues);
        console.log(delezValues)
        console.log(delezMatches)
      } else {
        console.log("ni deleža");
      }
      //REGEX ZA PLOMBE
      //ZADEVA_DN
      const osnovniPositionPlombe = currentPdfText.indexOf("Plombe:");
      const podatkiIndexPlombe = currentPdfText.indexOf("Osnovni pravni položaj nepremičnine:");
      let searchTextPlombe = currentPdfText;
      if (osnovniPositionPlombe !== -1 && podatkiIndexPlombe !== -1 && osnovniPositionPlombe < podatkiIndexPlombe) {
        searchTextPlombe = currentPdfText.substring(osnovniPositionPlombe, podatkiIndexPlombe);
        console.log("smo najdl");
      } else {
        console.log("nismo najdl");
      }
      //zadeva Dn 
      const zadevaDnRegex = /zadeva\s+Dn\s+(\d+\/\d+)/gi;
      const zadevaDnMatches = [...searchTextPlombe.matchAll(zadevaDnRegex)];
      if (zadevaDnMatches && zadevaDnMatches.length > 0) {
        const zadevaDnValues = zadevaDnMatches.map(match => match[1].trim());
        setZadevaDn(zadevaDnValues);
      } else {
        console.log("ni zadeve");
      }
      //tip postopka
      const tipPostopkaRegex = /tip\s*postopka\s+(.*)(?=stanje|(\d+\/\d+))/gi;
      const tipPostopaMatches = [...searchTextPlombe.matchAll(tipPostopkaRegex)];
      if (tipPostopaMatches && tipPostopaMatches.length > 0){
        const tipPostopkaValues = zadevaDnMatches.map(match => match[1].trim());
        setTipPostopka(tipPostopkaValues);
      } else {
        console.log("ni tip postpka")
      }
      //čas učinkovanja
      const casUcinRegex = /čas\s+začetka\s*učinkovanja\s*(\d{2}.\d{2}.\d{4})\s*(\d+:\d+:\d+)/gi;
      const casUcinMatches = [...searchTextPlombe.matchAll(casUcinRegex)];
      if (casUcinMatches && casUcinMatches.length>0){
        const casUcinDatum = casUcinMatches.map(match => match[1].trim());
        const casUcinCas = casUcinMatches.map(match => match[2].trim()); 
        setCasUcinDatum(casUcinDatum);
        setCasUcinCas(casUcinCas)
      } else {
        console.log("ni datuma al casa")
      }
      //stanje zadeve
      const stanjeZadeveRegex = /stanje\s+zadeve\s+(.*?)\s+(način|\d+\/\d+)/gi;
      const stanjeZadeveMatches = [...searchTextPlombe.matchAll(stanjeZadeveRegex)];
      if (stanjeZadeveMatches && stanjeZadeveMatches.length>0){
        const stanjeZadeveValues = stanjeZadeveMatches.map(match => match[1].trim());
        setStanjeZadeve(stanjeZadeveValues)
        console.log(stanjeZadeveValues)
      } else {
        console.log("nismo našl stanje zadeve");
      };
      //način odločitve
      const nacinOdlReg = /način\s+odločitve\s*o\s*vpisu:\s*(.*?)(?=\s*tip\s*pripada|\s*\d+\/\d+)/gi;
      const nacinOdMatches = [...searchTextPlombe.matchAll(nacinOdlReg)];
      if (nacinOdMatches && nacinOdMatches.length>0){
        const nacinOdValues = nacinOdMatches.map(match=>match[1].trim());
        setNacinOd(nacinOdValues);
      } else {
        console.log("ni odločitve");
      }
    }
  }, [extractedTexts, extractingData, index]);

  return (
    <div className="forms">
      <div>ID: {lastnikState.sifra ? lastnikState.sifra : "/"}</div>
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
        {posta.length > 0 ? posta.map((ime, idx) => (
          <li key={idx}>{ime}</li>
        )) : <li>ni nobene poste</li>}
      </ul>
      <ul>
        {delez.length > 0 ? delez.map((ime, idx) => (
          <li key={idx}>{ime}</li>
        )) : <li>ni nobenga deleza</li>}
      </ul>
      <ul>
        {zadevaDn.length > 0 ? zadevaDn.map((ime, idx) => (
          <li key={idx}>{ime}</li>
        )) : <li>ni nobene zadeve</li>}
      </ul>
      <ul>
        {tipPostopka.length > 0 ? tipPostopka.map((ime, idx) => (
          <li key={idx}>{ime}</li>
        )) : <li>ni nobenga postopa</li>}
      </ul>
      <ul>
        {casUcinDatum.length > 0 ? casUcinDatum.map((ime, idx) => (
          <li key={idx}>{ime}</li>
        )) : <li>ni nobenga datuma</li>}
      </ul>
      <ul>
        {casUcinCas.length > 0 ? casUcinCas.map((ime, idx) => (
          <li key={idx}>{ime}</li>
        )) : <li>ni nobenga casa</li>}
      </ul>
      <ul>
        {stanjeZadeve.length > 0 ? stanjeZadeve.map((ime, idx) => (
          <li key={idx}>{ime}</li>
        )) : <li>ni nobene zadeve</li>}
      </ul>
      <ul>
        {nacinOd.length > 0 ? nacinOd.map((ime, idx) => (
          <li key={idx}>{ime}</li>
        )) : <li>ni nobene odl</li>}
      </ul>
      </div>
  );
}

export default Forms;