function PopUp({ text, onClose }) {
  return (
    <div className="popUpOkno">
      <div className="popUpTextPolje">
        <button className="popUpClose" onClick={onClose}>X</button>
        <div className="popUpText">
          <p>{text || "No data found."}</p>
        </div>
      </div>
    </div>
  );
}

export default PopUp;