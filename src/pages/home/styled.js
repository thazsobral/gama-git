import styled from "styled-components";

const colorWhite = "#f9f9f9";
const colorBlack = "#000";
const colorGray = "#ddd";

export const HomeContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;    
    height: 100vh;
`;

export const Container = styled.div`
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const TextMsg = styled.span`
    display: block;
    text-align: center;
    font-family: sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: ${colorWhite};
    margin-bottom: 3rem;
`;

export const Input = styled.input`
    border: 1px solid ${colorGray};
    height: 2rem;
    padding: 0 .5rem;
    border-radius: .5rem 0 0 .5rem;

    &:focus, &:active{
        outline: none;
        box-shadow:none;
    }
`;

export const Button = styled.button`
    height: 2.25rem;
    padding: 0 2rem;
    border: 1px solid ${colorBlack};
    background: ${colorBlack};
    color: ${colorWhite};
    border-radius: 0 .5rem .5rem 0;
    font-weight: bold;

    &:focus, &:active {
        outline: none;
        box-shadow: none;
    }

    &:active {
        background: ${colorWhite};
        color: ${colorBlack};
    }
`;

export const ErrorMsg = styled.span`
    display: block;
    font-size: 1.3rem;
    color: red;
    font-weight: 600;
    margin-top: 1rem;
`;
