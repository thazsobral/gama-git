import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Repositories from "./pages/repositories/Repositories";
import Home from "./pages/home/Home";

export default function Routes() {
    return(
        <BrowserRouter>
            <Switch>
                <Route path="/" exact component={Home} />
                <Route path="/repositories" component={Repositories} />
            </Switch>
        </BrowserRouter>
    );
}
