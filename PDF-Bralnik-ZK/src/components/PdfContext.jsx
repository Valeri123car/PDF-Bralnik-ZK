import { createContext, useContext, useState, useEffect } from 'react';

const PdfContext = createContext();

export const PdfProvider = ({ children }) => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [extractedTexts, setExtractedTexts] = useState([]);
  const [extractingData, setExtractingData] = useState(false);
  const [formData, setFormData] = useState([]);
  const [extractedDataByPdf, setExtractedDataByPdf] = useState([]);
  const [currentPdfIndex, setCurrentPdfIndex] = useState(0);

  const [lastnikState, setLastnikState] = useState({
    sifra: "",
    parcela: "",
    emso: "",
    priimek_ime: "",
    naslov: "",
    pošta: "",
    delez: "",
  });

  const [sluznostiState, setSluznostiState] = useState({
    sifra: "",
    parcela: "",
    id_pravice: "",
    vrsta_pravice: "",
    ucin_datum: "",
    ucin_ura: "",
    imetnik_naziv: "",
    imetnik_naslov: "",
    imetnik_posta: "",
    opis: "",
  });

  const [plombe, setPlombeState] = useState({
    sifra: "",
    parcela: "",
    zadeva_dn: "",
    tip: "",
    ucin_datum: "",
    ucin_ura: "",
    stanje: "",
    nacin: "",
  });

  const [allEmso, setAllEmso] = useState([]);
  const [maticna, setMaticna] = useState([]);
  const [allPriimek_ime, setPriimekIme] = useState([]);
  const [naslov, setNaslov] = useState([]);
  const [posta, setPosta] = useState([]);
  const [delez, setDelez] = useState([]);

  const [zadevaDn, setZadevaDn] = useState([]);
  const [tipPostopka, setTipPostopka] = useState([]);
  const [casUcinDatum, setCasUcinDatum] = useState([]);
  const [casUcinCas, setCasUcinCas] = useState([]);
  const [stanjeZadeve, setStanjeZadeve] = useState([]);
  const [nacinOd, setNacinOd] = useState([]);

  const [idPravice, setIdPravice] = useState([]);
  const [vrstaPravice, setVrstaPravice] = useState([]);
  const [ucinDatum, setUcinDatum] = useState([]);
  const [ucinUra, setUcinUra] = useState([]);
  const [imetnikNaziv, setImetnikNaziv] = useState([]);
  const [imetnikNaslov, setImetnikNaslov] = useState([]);
  const [imetnikPosta, setImetnikPosta] = useState([]);
  const [opis, setOpis] = useState([]);
  const string = "hello world"
  // Log the states whenever they change
  useEffect(() => {
    console.log({
      extractedDataByPdf
    });
  }, [
    extractedDataByPdf
  ]);

  const updateFormData = (index, data) => {
    setFormData((prevForms) => {
      const newForms = [...prevForms];
      newForms[index] = { ...newForms[index], ...data }; // Prevent overwriting existing data
      return newForms;
    });
  };

  const updateExtractedDataForPdf = (pdfIndex, data) => {
    setExtractedDataByPdf((prevData) => {
      const newData = [...prevData];
      newData[pdfIndex] = { ...newData[pdfIndex], ...data }; // Prevent overwriting existing data
      return newData;
    });
  };

  return (
    <PdfContext.Provider
      value={{
        pdfFiles,
        setPdfFiles,
        extractedTexts,
        setExtractedTexts,
        extractingData,
        setExtractingData,
        formData,
        setFormData,
        updateFormData,
        extractedDataByPdf,
        setExtractedDataByPdf,
        updateExtractedDataForPdf,
        currentPdfIndex,
        setCurrentPdfIndex,
        lastnikState,
        setLastnikState,
        sluznostiState,
        setSluznostiState,
        plombe,
        setPlombeState,
        allEmso,
        setAllEmso,
        maticna,
        setMaticna,
        allPriimek_ime,
        setPriimekIme,
        naslov,
        setNaslov,
        posta,
        setPosta,
        delez,
        setDelez,
        zadevaDn,
        setZadevaDn,
        tipPostopka,
        setTipPostopka,
        casUcinDatum,
        setCasUcinDatum,
        casUcinCas,
        setCasUcinCas,
        stanjeZadeve,
        setStanjeZadeve,
        nacinOd,
        setNacinOd,
        idPravice,
        setIdPravice,
        vrstaPravice,
        setVrstaPravice,
        ucinDatum,
        setUcinDatum,
        ucinUra,
        setUcinUra,
        imetnikNaziv,
        setImetnikNaziv,
        imetnikNaslov,
        setImetnikNaslov,
        imetnikPosta,
        setImetnikPosta,
        opis,
        setOpis,
      }}
    >
      {children}
    </PdfContext.Provider>
  );
};

export const usePdf = () => useContext(PdfContext);
