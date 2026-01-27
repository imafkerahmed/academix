import React from "react";
import styled from "styled-components";

type NotificationButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: string;
};

const NotificationButton: React.FC<NotificationButtonProps> = ({
  onClick,
  className,
  color = "black",
  ...props
}) => {
  return (
    <StyledWrapper color={color}>
      <button onClick={onClick} className={className} {...props}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={24}
          height={24}
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            fill="currentColor"
            d="M20 17h2v2H2v-2h2v-7a8 8 0 1 1 16 0v7zm-2 0v-7a6 6 0 1 0-12 0v7h12zm-9 4h6v2H9v-2z"
          />
        </svg>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div<{ color: string }>`
  button {
    background: none;
    border: none;
    padding: 15px 15px;
    border-radius: 10px;
    cursor: pointer;
  }

  button:hover {
    background: rgba(170, 170, 170, 0.062);
    transition: 0.5s;
  }

  button svg {
    color: ${({ color }) => color};
  }
`;

export default NotificationButton;
