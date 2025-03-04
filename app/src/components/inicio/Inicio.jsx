import React from 'react';
import axios from 'axios';
// import { io } from "socket.io-client";
// import { NotificationContainer, NotificationManager } from 'react-notifications';
import { Switch, Route, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { signOut, closeProject } from '../../redux/principal';
import Menu from '../layouts/menu/Menu';
import Head from '../layouts/head/Head';
import Notifications from '../layouts/head/Notifications';
import Footer from '../layouts/footer/Footer';
import Main from './Main';
import Dashboard from '../dashboard/Dashboard';
import Clientes from '../facturacion/Clientes';
import Ventas from '../facturacion/Ventas';
import Cobros from '../facturacion/Cobros';
import Creditos from '../facturacion/Creditos';
import Cotizaciones from '../facturacion/Cotizaciones';
import Reservas from '../facturacion/Reservas';
import Socios from '../facturacion/Socios';
import Monedas from '../ajustes/Monedas';
import Comprobantes from '../ajustes/Comprobantes';
import Impuestos from '../ajustes/Impuestos';
import Metodos from '../ajustes/MetodosPago';
import Bancos from '../ajustes/Bancos';
import BancoDetalle from '../ajustes/registros/BancoDetalle';
import Sedes from '../ajustes/Sedes';
import SedeProceso from '../ajustes/registros/SedeProceso';
import EmpresaProceso from '../ajustes/registros/EmpresaProceso';
import Proyectos from '../ajustes/Proyectos';
import ProcesoProyecto from '../ajustes/proyecto/ProcesoProyecto';
import Manzanas from '../logistica/Manzanas';
import Lotes from '../logistica/Lotes';
import LoteDetalle from '../logistica/registro/LoteDetalle';
import VentaProceso from '../facturacion/registros/VentaProceso';
import VentaDetalle from '../facturacion/registros/VentaDetalle';
import ClienteProceso from '../facturacion/registros/ClienteProceso';
import ClienteDetalle from '../facturacion/registros/ClienteDetalle';
import CobroProceso from '../facturacion/registros/CobroProceso';
import CobroDetalle from '../facturacion/registros/CobroDetalle';
import NotaCredito from '../facturacion/NotaCredito';
import NotaCreditoProceso from '../facturacion/registros/NotaCreditoProceso';
import NotaCreditoDetalle from '../facturacion/registros/NotaCreditoDetalle';
import GastoProceso from '../tesoreria/registros/GastoProceso';
import GastoDetalle from '../tesoreria/registros/GastoDetalle';
import CreditoProceso from '../facturacion/registros/CreditoProceso';
import Perfiles from '../seguridad/Perfiles';
import Usuarios from '../seguridad/Usuarios';
import Accesos from '../seguridad/Accesos';
import UsuarioProceso from '../seguridad/registros/UsuarioProceso';
import Conceptos from '../tesoreria/Conceptos';
import Gastos from '../tesoreria/Gastos';
import RepVentas from '../reporte/RepVentas';
import RepFinanciero from '../reporte/RepFinanciero';
import RepLotes from '../reporte/RepLotes';
import RepClientes from '../reporte/RepClientes';
import CpeConsultar from '../cpesunat/CpeConsultar';
import CpeElectronicos from '../cpesunat/CpeElectronicos';
import NotFound from '../../view/pages/NotFound';
// import mixkit from '../../recursos/sound/mixkit.wav';

class Inicio extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isModal: false,
            notificaciones: [],
        }

        // this.socket = io();
        // this.audio = new Audio(mixkit);
    }

    async componentDidMount() {
        window.addEventListener('focus', this.onEventFocused);
        window.addEventListener('resize', this.onEventResize);
        this.loadSideBar();
        this.loadNotifications();

        // this.socket.on('message', text => {
        //     NotificationManager.info(text, "Notificación");
        //     if(this.audio !== undefined) this.audio.play();
        // });
    }

    componentWillUnmount() {
        window.removeEventListener('focus', this.onEventFocused);
        window.removeEventListener('resize', this.onEventResize);

        // this.socket.disconnect();
    }

    onEventFocused = (event) => {
        let userToken = window.localStorage.getItem('login');
        if (userToken === null) {
            this.props.signOut();
            this.props.history.push("login");
        } else {
            let tokenCurrent = JSON.parse(userToken);
            let tokenOld = this.props.token.userToken;
            if (tokenCurrent.token !== tokenOld.token) {
                window.location.href = "/";
                return;
            }

            let projectToken = window.localStorage.getItem('project');

            let projectCurrent = JSON.parse(projectToken)
            let projectOld = this.props.token.project;

            if (JSON.stringify(projectCurrent) !== JSON.stringify(projectOld)) {
                window.location.href = "/";
                return;
            }

            if (projectToken === null) {
                this.props.closeProject();
            }
        }
    }

    onEventResize(event) {
        if (event.target.innerWidth <= 768 && document.getElementById("sidebar").classList.contains("active")) {
            document.getElementById("sidebar").classList.remove("active");
        }
    }

    openAndClose = () => {
        let windowWidth = window.innerWidth;
        if (windowWidth <= 768) {
            document.getElementById("sidebar").classList.add("toggled");
        } else {
            document.getElementById("sidebar").classList.toggle("active");
        }
    }

    loadSideBar() {
        const value = document.querySelectorAll('#sidebar ul li .pro-inner-item[data-bs-toggle="collapse"]');
        value.forEach(element => {
            element.parentNode.querySelector('ul').addEventListener('shown.bs.collapse', function (event) {
                value.forEach(item => {
                    if (event.target.getAttribute('id') !== item.parentNode.querySelector('ul').getAttribute('id')) {
                        item.setAttribute("aria-expanded", "false");
                        item.parentNode.querySelector('ul').classList.remove("show");
                    }
                });
            });
        });
    }

    async loadNotifications() {
        try {
            let result = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/cobro/notificaciones");
            this.setState({ notificaciones: result.data });

            // this.setState({
            //     notificaciones: [{
            //         "cantidad": 10,
            //         "nombre": "boletas",
            //         "estado": "pendiente"
            //     },
            //     {
            //         "cantidad": 10,
            //         "nombre": "boletas",
            //         "estado": "pendiente"
            //     },
            //     {
            //         "cantidad": 10,
            //         "nombre": "boletas",
            //         "estado": "pendiente"
            //     },
            //     {
            //         "cantidad": 10,
            //         "nombre": "boletas",
            //         "estado": "pendiente"
            //     },
            //     {
            //         "cantidad": 10,
            //         "nombre": "boletas",
            //         "estado": "pendiente"
            //     }]

            // })
        } catch (error) {
            this.setState({ notificaciones: [] });
        }
    }

    render() {
        if (this.props.token.userToken == null) {
            return <Redirect to="/login" />
        }

        if (this.props.token.project === null) {
            return <Redirect to="/principal" />
        }

        const { path, url } = this.props.match;

        return (

            <div className='app'>
                <Menu  {...this.props} url={url} />

                <main>
                    <Head {...this.props} openAndClose={this.openAndClose} notificaciones={this.state.notificaciones} />

                    <div className="container-fluid mt-3">
                        <div className="bg-white p-3 border border-light-purple rounded position-relative">

                            <Switch>
                                <Route
                                    path="/inicio"
                                    exact={true}>
                                    <Redirect to={`${path}/main`} />
                                </Route>
                                <Route
                                    path={`${path}/main`}
                                    render={(props) => <Main {...props} />}
                                />
                                <Route
                                    path={`${path}/dashboard`}
                                    render={(props) => <Dashboard {...props} />}
                                />
                                <Route
                                    path={`${path}/notifications`}
                                    render={(props) => <Notifications {...props} />}
                                />
                                <Route
                                    path={`${path}/perfiles`}
                                    render={(props) => <Perfiles {...props} />}
                                />
                                <Route
                                    path={`${path}/usuarios`}
                                    exact={true}
                                    render={(props) => <Usuarios {...props} />}
                                />
                                <Route
                                    path={`${path}/usuarios/proceso`}
                                    exact={true}
                                    render={(props) => <UsuarioProceso {...props} />}
                                />

                                <Route
                                    path={`${path}/accesos`}
                                    render={(props) => <Accesos {...props} />}
                                />
                                <Route
                                    path={`${path}/clientes`}
                                    exact={true}
                                    render={(props) => <Clientes {...props} />}
                                />
                                <Route
                                    path={`${path}/clientes/proceso`}
                                    exact={true}
                                    render={(props) => <ClienteProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/clientes/detalle`}
                                    exact={true}
                                    render={(props) => <ClienteDetalle {...props} />}
                                />
                                <Route
                                    path={`${path}/ventas`}
                                    exact={true}
                                    render={(props) => <Ventas {...props} />}
                                />
                                <Route
                                    path={`${path}/ventas/proceso`}
                                    exact={true}
                                    render={(props) => <VentaProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/ventas/detalle`}
                                    exact={true}
                                    render={(props) => <VentaDetalle {...props} />}
                                />
                                <Route
                                    path={`${path}/cobros`}
                                    exact={true}
                                    render={(props) => <Cobros {...props} />}
                                />
                                <Route
                                    path={`${path}/cobros/proceso`}
                                    exact={true}
                                    render={(props) => <CobroProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/cobros/detalle`}
                                    exact={true}
                                    render={(props) => <CobroDetalle {...props} />}
                                />
                                <Route
                                    path={`${path}/creditos`}
                                    exact={true}
                                    render={(props) => <Creditos {...props} />}
                                />
                                <Route
                                    path={`${path}/creditos/proceso`}
                                    exact={true}
                                    render={(props) => <CreditoProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/socios`}
                                    exact={true}
                                    render={(props) => <Socios {...props} />}
                                />
                                <Route
                                    path={`${path}/notacredito`}
                                    exact={true}
                                    render={(props) => <NotaCredito {...props} />}
                                />
                                <Route
                                    path={`${path}/notacredito/proceso`}
                                    exact={true}
                                    render={(props) => <NotaCreditoProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/notacredito/detalle`}
                                    exact={true}
                                    render={(props) => <NotaCreditoDetalle {...props} />}
                                />
                                <Route
                                    path={`${path}/cotizaciones`}
                                    render={(props) => <Cotizaciones {...props} />}
                                />
                                <Route
                                    path={`${path}/reservas`}
                                    render={(props) => <Reservas {...props} />}
                                />
                                <Route
                                    path={`${path}/monedas`}
                                    render={(props) => <Monedas {...props} />}
                                />
                                <Route
                                    path={`${path}/comprobantes`}
                                    render={(props) => <Comprobantes {...props} />}
                                />
                                <Route
                                    path={`${path}/bancos`}
                                    exact={true}
                                    render={(props) => <Bancos {...props} />}
                                />
                                <Route
                                    path={`${path}/bancos/detalle`}
                                    exact={true}
                                    render={(props) => <BancoDetalle {...props} />}
                                />
                                <Route
                                    path={`${path}/sedes`}
                                    exact={true}
                                    render={(props) => <Sedes {...props} />}
                                />
                                <Route
                                    path={`${path}/sedes/proceso`}
                                    exact={true}
                                    render={(props) => <SedeProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/sedes/empresa`}
                                    exact={true}
                                    render={(props) => <EmpresaProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/proyectos`}
                                    exact={true}
                                    render={(props) => <Proyectos {...props} />}
                                />
                                <Route
                                    path={`${path}/proyectos/proceso`}
                                    exact={true}
                                    render={(props) => <ProcesoProyecto {...props} />}
                                />
                                <Route
                                    path={`${path}/impuestos`}
                                    render={(props) => <Impuestos {...props} />}
                                />
                                <Route
                                    path={`${path}/metodos`}
                                    render={(props) => <Metodos {...props} />}
                                />
                                <Route
                                    path={`${path}/manzanas`}
                                    render={(props) => <Manzanas {...props} />}
                                />
                                <Route
                                    path={`${path}/lotes`}
                                    exact={true}
                                    render={(props) => <Lotes {...props} />}
                                />
                                <Route
                                    path={`${path}/lotes/detalle`}
                                    exact={true}
                                    render={(props) => <LoteDetalle {...props} />}
                                />
                                <Route
                                    path={`${path}/conceptos`}
                                    render={(props) => <Conceptos {...props} />}
                                />
                                <Route
                                    path={`${path}/gastos`}
                                    exact={true}
                                    render={(props) => <Gastos {...props} />}
                                />
                                <Route
                                    path={`${path}/gastos/proceso`}
                                    exact={true}
                                    render={(props) => <GastoProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/gastos/detalle`}
                                    exact={true}
                                    render={(props) => <GastoDetalle {...props} />}
                                />
                                <Route
                                    path={`${path}/repventas`}
                                    render={(props) => <RepVentas {...props} />}
                                />
                                <Route
                                    path={`${path}/repfinanciero`}
                                    render={(props) => <RepFinanciero {...props} />}
                                />
                                <Route
                                    path={`${path}/replotes`}
                                    render={(props) => <RepLotes {...props} />}
                                />
                                <Route
                                    path={`${path}/repclientes`}
                                    render={(props) => <RepClientes {...props} />}
                                />
                                <Route
                                    path={`${path}/cpeelectronicos`}
                                    render={(props) => <CpeElectronicos {...props} />}
                                />
                                <Route
                                    path={`${path}/cpeconsultar`}
                                    render={(props) => <CpeConsultar {...props} />}
                                />
                                <Route component={NotFound} />
                            </Switch>
                        </div>
                    </div>
                    <Footer />
                </main>
                {/* <NotificationContainer /> */}
            </div>
        )
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
  
  const mapDispatchToProps = { signOut, closeProject }
  
  /**
   *
   * Método encargado de conectar con redux y exportar la clase
   */
  const ConnectedInicio = connect(mapStateToProps, mapDispatchToProps)(Inicio);
  
  export default ConnectedInicio;