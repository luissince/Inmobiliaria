import React from 'react';
import Loader from './view/loader/Loader';
import Configurar from './view/empresa/Configurar';
import Login from './view/login/Login';
import Inicio from './components/inicio/Inicio';
import Principal from './components/principal/Principal';
import NotFound from './components/error/NotFound';
import { connect } from 'react-redux';
import { config, restoreToken } from './redux/actions';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';


class App extends React.Component {

    constructor(props) {
        super(props);
        this.menuRef = React.createRef();
    }
 
    async componentDidMount() {
      
    }

    render() {
        return (
            <>
                {
                    this.props.token.isLoading ? (
                        <Loader />
                    ) :
                        this.props.token.isConfig ?
                            (
                                <Configurar />
                            )
                            :
                            (
                                <BrowserRouter>
                                    <Switch>

                                        <Route
                                            path="/"
                                            exact={true}>
                                            <Redirect to={"/login"} />
                                        </Route>

                                        <Route
                                            path="/login"
                                            exact={true}
                                            render={(props) => <Login {...props} />}
                                        />

                                        <Route
                                            path="/principal"
                                            exact={true}
                                            render={(props) => <Principal {...props} />}
                                        />

                                        <Route
                                            path="/inicio"
                                            render={(props) => <Inicio {...props} />}
                                        />

                                        <Route component={NotFound} />
                                    </Switch>

                                </BrowserRouter>
                            )
                }
            </>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        config: () => dispatch(config()),
        restore: (user) => dispatch(restoreToken(user))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);