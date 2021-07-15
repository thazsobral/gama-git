import styled from "styled-components";
import { Link } from "react-router-dom";
import iconFolder from "../../images/folder.svg";

const colorWhite = "#f9f9f9";
const colorBlack = "#000";

export const Container = styled.div`
    width: 100vw;
    max-width: 900px;
    margin: 0 auto;
`;

export const Title = styled.h1`
    text-align: center;
    font-size: 2rem;
    font-family: sans-serif;
    color: ${colorWhite};
`;

export const List = styled.ul`
    list-style: none;
    padding: 0;
    font-family: sans-serif;
    display: flex;
    flex-flow: row wrap;
    justify-content: space-around;
`;

export const ImageFolder = styled.div`
    background: url(${iconFolder});
    background-size: cover;
    width: 11rem;
    height: 11rem;
    display: flex;
    align-items: flex-end;
    padding-bottom: .5rem;
    filter: inert();
`;

export const ListItem = styled.li`
    margin: .5rem .5rem;
    color: ${colorWhite};
    padding: .5rem;
    text-align: center;
    flex: 1;
`;

export const LinkHome = styled(Link)`
    display: block;
    width: 4rem;
    text-align:center;
    margin: 2rem auto;
    background: #000;
    padding: .5rem 0;
    color: ${colorWhite};
    text-decoration: none;
    border-radius: .25rem;
    font-weight: bold;

    &:active {
        background: ${colorWhite};
        color: ${colorBlack};
    }
`;
