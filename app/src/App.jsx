import React from 'react';
import Loader from './view/loader/Loader';
import Configurar from './view/empresa/Configurar';
import Login from './view/login/Login';
import Inicio from './components/inicio/Inicio';
import Principal from './components/principal/Principal';
import NotFound from './components/error/NotFound';
import { connect } from 'react-redux';
import { config, restoreToken } from './redux/principal';
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

/**
 *
 * Método encargado de traer la información de redux
 */
const mapStateToProps = (state) => {
    return {
      token: state.principal,
    };
  };
  
  const mapDispatchToProps = { config, restoreToken }
  
  /**
   *
   * Método encargado de conectar con redux y exportar la clase
   */
  const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App);
  
  export default ConnectedApp;