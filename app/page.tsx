"use client";
import Image from "next/image";
import logo from "./assets/logo.png";
import { useChat } from "ai/react";
// import { Message } from "ai";
import Bubble from "./components/Bubble";
import LoadingBubble from "./components/LoadingBubble";
// import PromptSuggestionRow from "./components/PromptSuggestionRow";

export default function Home() {
  const {
    messages,
    input,
    handleSubmit,
    handleInputChange,
    isLoading,
    // append,
  } = useChat();

  const noMessages = !messages || messages.length === 0;

  // const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  //   const promptText = event.currentTarget.textContent || "";
  //   const msg: Message = {
  //     id: crypto.randomUUID(),
  //     content: promptText,
  //     role: "user",
  //   };
  //   append(msg);
  // };

  return (
    <main>
      <Image src={logo} alt="logo" width={150} height={150} />
      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <>
            <p className="starter-text">
              ¡El sitio definitivo para los amantes del fútbol colombiano!
              Pregúntale a Fútbol GPT lo que quieras sobre el mejor deporte del
              mundo, y te responderá con la información más actualizada posible.
              ¡Disfrútalo!
            </p>
            <br />
            {/* <PromptSuggestionRow
              handleClick={handleClick}
            ></PromptSuggestionRow> */}
          </>
        ) : (
          <>
            {messages.map((message, index) => (
              <Bubble message={message} key={index} />
            ))}
            {isLoading && <LoadingBubble></LoadingBubble>}
          </>
        )}
      </section>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          placeholder="Preguntale a Futbol GPT..."
          onChange={handleInputChange}
          disabled={isLoading}
          className="question-box"
        />
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}
