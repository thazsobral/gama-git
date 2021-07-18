import React from "react";
import * as S from "./styled"
import githubIcon from "../../images/icons/github-icon.svg"
import linkedinIcon from "../../images/icons/linkedin-icon.svg"

export default function Footer() {
    return (
        <>
            <S.TextFooter>
                © 2021 Made with 🤍 by Thaz
            </S.TextFooter>
            <S.ContainerIcons>
                <S.LinkIcon href="https://github.com/thazsobral">
                    <S.ImageIcon src={githubIcon} alt="link to github" />
                </S.LinkIcon>
                <S.LinkIcon href="https://www.linkedin.com/in/thalles-sobral-414322b6/">
                    <S.ImageIcon src={linkedinIcon} alt="link to linkedin" />
                </S.LinkIcon>
            </S.ContainerIcons>
        </>
    );
}