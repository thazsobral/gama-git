import React, { useState } from "react";
import axios from "axios";

function Home() {
  const [user, setUser] = useState("");
  const handleSearch = () => {
    axios.get(`https://api.github.com/users/${user}/repos`).then(response => console.log(response.data));
  }
  
  return (
    <>
      <input type="text" className="input-user" placeholder="user" value={user} onChange={event => setUser(event.target.value)} />
      <button type="button" onClick={handleSearch} >Pesquisar</button>
      {user}
    </>
  );
}

export default Home;
