import React, { useState } from "react";

function PopUpSearch({ text, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedText, setHighlightedText] = useState([]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const highlightText = (text, search) => {
    const regex = new RegExp(`(${search})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? <span key={index} style={{ backgroundColor: "yellow" }}>{part}</span> : part
    );
  };

  React.useEffect(() => {
    if (searchTerm) {
      const highlighted = highlightText(text, searchTerm);
      setHighlightedText(highlighted);
    } else {
      setHighlightedText(text);
    }
  }, [searchTerm, text]);

  return (
    <div className="popUpOkno">
      <div className="popUpTextPolje">
        <button className="popUpClose" onClick={onClose}>X</button>
        <div className="popUpSearch">
          <input
            type="text"
            value={searchTerm}
            placeholder="Search..."
            onChange={handleSearchChange}
          />
        </div>
        <div className="popUpText">
          <p>{highlightedText.length ? highlightedText : text}</p>
        </div>
      </div>
    </div>
  );
}

export default PopUpSearch;
