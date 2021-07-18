import React, { useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import * as S from "./styled";

export default function Home() {
    const history = useHistory();
    const [user, setUser] = useState("");
    const [errorSearch, setErrorSearch] = useState(false);

    function handleSearch() {
        axios.get(`https://api.github.com/users/${user}/repos`)
            .then((response => {
                let respositories = [];

                response.data.map(repository => respositories.push({ name: repository.name, url: repository.html_url }));

                localStorage.setItem("repositories", JSON.stringify(respositories));
                setErrorSearch(false);
                history.push("/repositories");
            }))
            .catch(() => {
                setErrorSearch(true);
            });
    }

    return (
        <S.HomeContainer>
            <S.TextMsg>Search here your friends' repositories simply and quickly.</S.TextMsg>
            <S.Container>
                <S.Input className="input-user" placeholder="Username" value={user} onChange={event => setUser(event.target.value)} onKeyDown={event => event.key === "Enter" ? handleSearch() : event.preventDefault} />
                <S.Button type="button" onClick={handleSearch}>Go!</S.Button>
            </S.Container>
            {errorSearch ? <S.ErrorMsg>An error has occurred, please try again.</S.ErrorMsg> : ""}
        </S.HomeContainer>
    );
}