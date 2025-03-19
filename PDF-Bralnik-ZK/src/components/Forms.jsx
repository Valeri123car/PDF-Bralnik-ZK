import { useEffect, useState } from "react";
import { usePdf } from "./PdfContext";
import PopUp from "./Popout";

function Forms({ index = 0 }) {
  const { extractedTexts, extractingData, pdfFiles, formData, updateFormData } = usePdf();
  
  const [isPopUpVisible, setIsPopUpVisible] = useState(false);
  const [popUpText, setPopUpText] = useState("");
  
  const [formState, setFormState] = useState({
    geoPisarna: '',
    stevilka: '',
    ko: '',
    stevilkaElaborata: '',
    stTehPos: '',
    pi: '',
    dopolnitiDo: '',
    vodjaPostopka: '',
    ugotovitevUprave: ''
  });

  useEffect(() => {
    if (formData && formData[index]) {
      setFormState(formData[index]);
    }
  }, [formData, index]);

  useEffect(() => {
    if (extractedTexts && extractedTexts.length > index && extractingData) {
      const currentPdfText = extractedTexts[index].text;
      
      const geoPisarnaMatch = 
        currentPdfText.match(/Geodetska\s*pisarna\s*([\p{L}\s-]+?)(?=\s{2,}|$)/u) || 
        currentPdfText.match(/Območna\s*geodetska\s*uprava\s*([A-Za-zÀ-ž\s]+?)(?=\s{2,}|$|\s+T:)/u);
      
      let newFormState = {...formState};
      
      if (geoPisarnaMatch) newFormState.geoPisarna = geoPisarnaMatch[1].trim();
  
      const stevilkaMatch = currentPdfText.match(/Številka:\s*([\d\-\/]+)/);
      if (stevilkaMatch) newFormState.stevilka = stevilkaMatch[1];

      const koMatch = currentPdfText.match(/Katastrska\s*občina:\s*((\d+\s*[A-Za-zÀ-ž\s-]+)(?:\s*,\s*\d+\s*[A-Za-zÀ-ž\s-]+|\s+\d+\s*[A-Za-zÀ-ž\s-]+)*)(?=\s*Datum|$)/);
      if (koMatch) {
        newFormState.ko = koMatch[1].trim();
        console.log("Extracted K.O:", newFormState.ko);
      }
      
      const elaboratMatch = currentPdfText.match(/elaborat\s*številka\s*(\d+)/i);
      if (elaboratMatch) newFormState.stevilkaElaborata = elaboratMatch[1];
  
      const tehPosMatch = currentPdfText.match(/tehničnem\s*postopku\s*številka\s*(\d+)/i);
      if (tehPosMatch) newFormState.stTehPos = tehPosMatch[1];
      
      let piMatch = currentPdfText.match(/pooblaščen[ai]\s*geodet(?:inja)?\s*([a-zA-ZÀ-ž\s,\.]+?\([\w\d]+\))/i);
      if (!piMatch) {
        piMatch = currentPdfText.match(/pooblaščen\s*a?\s*geodet(?:inja)?\s*([a-zA-ZÀ-ž\s,\.]+?\([\w\d]+\))/i);
      }
      if (piMatch) newFormState.pi = piMatch[1];
      
      const documentDateMatch = currentPdfText.match(/Datum:\s*(\d{2}\.\d{2}\.\d{4})/);
      let baseDate = new Date(); 

      if (documentDateMatch) {
        const [day, month, year] = documentDateMatch[1].split('.').map(part => parseInt(part, 10));
        baseDate = new Date(year, month - 1, day); 
      }
      let dopolnitiDoMatch = currentPdfText.match(/najkasneje\s*do\s*(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4})/i);

      if (!dopolnitiDoMatch) {
        dopolnitiDoMatch = currentPdfText.match(/najkasneje\s*v\s*(\d+)(?:ih)?\s*dneh\s*od\s*prejema/i);
      }

      if (!dopolnitiDoMatch) {
        dopolnitiDoMatch = currentPdfText.match(/(?:dopolni|najkasneje)(?:.*?)(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4})/i);
      }

      if (dopolnitiDoMatch) {
        if (dopolnitiDoMatch[1] && /\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4}/.test(dopolnitiDoMatch[1])) {
          let dateParts = dopolnitiDoMatch[1].split(/[\.\-\/]/);
        if (dateParts.length === 3) {
          newFormState.dopolnitiDo = `${dateParts[0]}.${dateParts[1]}.${dateParts[2]}`;
        } else {
          newFormState.dopolnitiDo = dopolnitiDoMatch[1];
        }
        } else if (dopolnitiDoMatch[1]) {
          const days = parseInt(dopolnitiDoMatch[1], 10);
          const targetDate = new Date(baseDate);
          targetDate.setDate(baseDate.getDate() + days);
    
          const formattedDate = `${String(targetDate.getDate()).padStart(2, '0')}.${String(targetDate.getMonth() + 1).padStart(2, '0')}.${targetDate.getFullYear()}`;
          newFormState.dopolnitiDo = formattedDate;
        }
      }
      const vodjaMatch = currentPdfText.match(/(?:[Pp]ostopek|ostopek)\s*vodi:?\s*([a-zA-ZÀ-ž\s\.]+?)(?=\s+(?:univ|višj|svetoval|Višj|Elektronski|Vročiti:|$))/i);
      if (vodjaMatch) {
        newFormState.vodjaPostopka = vodjaMatch[1].trim();
      }
      
      const ugotovitevUpraveMatch = 
        currentPdfText.match(/Geodetska\s*uprava\s*je\s*pri\s*preizkusu\s*elaborata\s*ugotovila[,:]\s*([\s\S]+?)(?=Odprava\s*zgoraj|$)/i);

      if (ugotovitevUpraveMatch) {
        const cleanedUgotovitevUprave = ugotovitevUpraveMatch[1].trim();
        newFormState.ugotovitevUprave = cleanedUgotovitevUprave;
      }
      setFormState(newFormState);
      updateFormData(index, newFormState);
    }
  }, [extractedTexts, extractingData, index]);
  
  const handleInputChange = (field) => (event) => {
    const updatedValue = event.target.value;
    
    if (field === 'ko') {
      const formattedKo = updatedValue.split(',').map(item => item.trim()).join(', ');
      console.log("Updated K.O value:", formattedKo);
      setFormState(prev => {
      const updated = {...prev, ko: koMatch[1].trim()};
      updateFormData(index, {ko: koMatch[1].trim()});
      return updated;
  });

    } else {
      setFormState(prev => {
        const updated = {...prev, [field]: updatedValue};
        updateFormData(index, {[field]: updatedValue});
        return updated;
      });
    }
  };

  const togglePopUp = () => {
    setIsPopUpVisible(!isPopUpVisible);
    if (!isPopUpVisible) {
      setPopUpText(formState.ugotovitevUprave || "No data found.");
    }
  };

  const handleDeleteForm = () => {
    setFormState({
      geoPisarna: '',
      stevilka: '',
      ko: '',
      stevilkaElaborata: '',
      stTehPos: '',
      pi: '',
      dopolnitiDo: '',
      vodjaPostopka: '',
      ugotovitevUprave: ''
    });

    updateFormData(index, {
      geoPisarna: '',
      stevilka: '',
      ko: '',
      stevilkaElaborata: '',
      stTehPos: '',
      pi: '',
      dopolnitiDo: '',
      vodjaPostopka: '',
      ugotovitevUprave: ''
    });
  };


  return (
    <div className="forms">
      <div className="forms-header">
        <h3>PDF Form {index + 1}</h3>
        <p>{pdfFiles && pdfFiles.length > index ? pdfFiles[index].name : "Ni datotek"}</p>
      </div>
      <div className="forms-box">
        <label>Geodetska pisarna:</label>
        <input
          type="text"
          value={formState.geoPisarna}
          placeholder="Geodetska pisarna"
          onChange={handleInputChange('geoPisarna')}
        />
      </div>
      <div className="forms-box">
        <label>Številka:</label>
        <input
          type="text"
          value={formState.stevilka}
          placeholder="Številka"
          onChange={handleInputChange('stevilka')}
        />
        <label>K.O:</label>
        <input
          type="text"
          value={formState.ko}
          placeholder="K.O"
          onChange={handleInputChange('ko')}
        />
      </div>
      <div className="forms-box">
        <label>Številka elaborata:</label>
        <input
          type="text"
          value={formState.stevilkaElaborata}
          placeholder="Elaborat"
          onChange={handleInputChange('stevilkaElaborata')}
        />
        <label>Št. tehničnega postopka:</label>
        <input
          type="text"
          value={formState.stTehPos}
          placeholder="Tehnični postopek"
          onChange={handleInputChange('stTehPos')}
        />
      </div>
      <div className="forms-box">
        <label>Pooblaščeni geodet:</label>
        <input
          type="text"
          value={formState.pi}
          placeholder="Pooblaščeni geodet"
          onChange={handleInputChange('pi')}
        />
        <label>Dopolniti do:</label>
        <input
          type="text"
          value={formState.dopolnitiDo}
          placeholder="Dopolniti do"
          onChange={handleInputChange('dopolnitiDo')}
        />
      </div>
      <div className="forms-box">
        <label>Vodja postopka:</label>
        <input
          type="text"
          value={formState.vodjaPostopka}
          placeholder="Vodja postopka"
          onChange={handleInputChange('vodjaPostopka')}
        />
        <label>Ugotovitev uprave:</label>
        <button onClick={togglePopUp} className="prikazi-ugotovitve button">Prikaži ugotovitve</button>
      </div>

      {isPopUpVisible && <PopUp text={popUpText} onClose={togglePopUp} />}
      <div><button onClick={handleDeleteForm}>Izbriši forme</button></div>
    </div>
  );
}

export default Forms;
