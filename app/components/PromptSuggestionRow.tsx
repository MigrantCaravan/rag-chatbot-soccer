const PromptSuggestionRow = ({
  handleClick,
}: {
  handleClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) => {
  const prompts = [
    "Quien es el ûltimo campeôn del futbol Colombiano?",
    "Qué equipo fue subcampeon en el 2024?",
  ];

  return (
    <div className="prompt">
      {prompts.map((prompt, index) => (
        <button onClick={handleClick} key={index}>
          {prompt}
        </button>
      ))}
    </div>
  );
};

export default PromptSuggestionRow;
