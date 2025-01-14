import React from "react";
import { Message } from "ai";

interface BubbleProps {
  message: Message;
}

const Bubble: React.FC<BubbleProps> = ({ message }) => {
  return <div className={`${message.role} bubble`}>{message.content}</div>;
};

export default Bubble;
