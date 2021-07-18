import React, { useEffect, useState } from "react";
import * as S from "./styled";
import { useHistory } from "react-router-dom";

export default function Repositories() {
    const history = useHistory();
    const [repositories, setRepositories] = useState([]);

    useEffect(() => {
        let repositories = localStorage.getItem("repositories");

        if (repositories != null) {
            repositories = JSON.parse(repositories);
            setRepositories(repositories);
            localStorage.clear();
        } else {
            history.push("/");
        }
    }, [history]);

    return (
        <S.Container>
            <S.Title>Repositories</S.Title>
            <S.List>
                {repositories.map((repository, key) => {
                    return (
                        // eslint-disable-next-line
                        <S.LinkRepository key={key} href={repository.url} target="_blank">
                            <S.ImageFolder key={key}>
                                <S.ListItem key={key}> {repository.name} </S.ListItem>
                            </S.ImageFolder>
                        </S.LinkRepository>
                    );
                })}
            </S.List>
            <S.LinkHome to="/">Back</S.LinkHome>
        </S.Container>
    );
}
