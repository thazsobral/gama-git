import React, { useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import * as S from "./styled";

export default function Home () {
    const history = useHistory();
    const [user, setUser] = useState("");
    const [errorSearch, setErrorSearch] = useState(false);

    function handleSearch() {
        axios.get(`https://api.github.com/users/${user}/repos`)
            .then((response => {
                let respositoriesName = [];

                response.data.map( repository => respositoriesName.push(repository.name));

                localStorage.setItem("repositoriesName", JSON.stringify(respositoriesName));
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
                <S.Input className="input-user" placeholder="Username" value={user} onChange={event => setUser(event.target.value)} />
                <S.Button type="button" onClick={handleSearch}>Go!</S.Button>
            </S.Container>
            { errorSearch ?  <S.ErrorMsg>An error has occurred, please try again.</S.ErrorMsg> : "" }
        </S.HomeContainer>
    );
}