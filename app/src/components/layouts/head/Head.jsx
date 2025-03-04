import React from "react";
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { signOut, closeProject } from '../../../redux/principal';
import { addNotification } from '../../../redux/notifications';
import usuario from '../../../recursos/images/usuario.png';

class Menu extends React.Component {

    constructor(props) {
        super(props);
        this.state = {

        }
    }

    onEventSignIn = async (event) => {
        try {
            window.localStorage.removeItem('login');
            window.localStorage.removeItem('project');
            this.props.signOut();
            this.props.history.push("login");
        } catch (e) {
            this.props.signOut();
            this.props.history.push("login");
        }
    }

    onEventCloseProject() {
        window.localStorage.removeItem('project');
        this.props.closeProject();
    }

    componentDidMount() {
        // this.intervalId = setInterval(() => {
        //     this.props.addNotification({ "id": "100" });
        // }, 5000);
    }

    componentWillUnmount() {
        // clearInterval(this.intervalId);
    }

    render() {
        return (
            <header className="app-header">
                <span className="app-sidebar__toggle" onClick={this.props.openAndClose}>
                </span>

                <ul className="app-nav">
                    <div className="dropdown">
                        <a className="app-nav__item"
                            href=""
                            data-bs-toggle="dropdown"
                            aria-label="Abrir Notificaciones"
                            aria-expanded="false">
                            <i className="fa fa-bell-o fa-sm  fa-sm"></i>
                            {/* <span className="pl-1 pr-1 badge-warning rounded h7 icon-absolute ">{22}</span> */}
                            <span className="pl-1 pr-1 badge-warning rounded h7 icon-absolute ">{this.props.notificaciones.length}</span>
                        </a>
                        <ul className="app-notification dropdown-menu dropdown-menu-right">
                            <div className="app-notification__content">
                                {
                                    this.props.notificaciones.length != 0 ?
                                        this.props.notificaciones.map((item, index) => (
                                            <li key={index}>
                                                <a className="app-notification__item">
                                                    <span className="app-notification__icon">
                                                        <span className="fa-stack fa-lg">
                                                            <i className="fa fa-circle fa-stack-2x text-primary"></i>
                                                            <i className="fa fa-warning fa-stack-1x fa-inverse"></i>
                                                        </span>
                                                    </span>
                                                    <div>
                                                        <p className="app-notification__message">{item.cantidad} {item.nombre}</p>
                                                        <p className="app-notification__meta">{item.estado}</p>
                                                    </div>
                                                </a>
                                            </li>
                                        ))

                                        : null
                                }
                            </div>
                            {
                                this.props.notificaciones.length == 0 ?
                                    <li className="app-notification__footer">No hay notificaciones para mostrar.</li>
                                    :
                                    <li className="app-notification__footer"><Link to="notifications"> Mostrar mas a detalle</Link></li>
                            }
                        </ul>
                    </div>
                    <div className="dropdown">
                        <a className="app-nav__item"
                            href=""
                            data-bs-toggle="dropdown"
                            aria-label="Abrir Perfil"
                            aria-expanded="false">
                            <img src={usuario} className="user-image" alt="Usuario" />
                        </a>
                        <ul className="dropdown-menu settings-menu dropdown-menu-right">
                            <li className="user-header">
                                <img src={usuario} className="img-circle" alt="Usuario" />
                                <p>
                                    <span>{this.props.token.userToken.nombres + " " + this.props.token.userToken.apellidos}</span>
                                    <small> <i>{this.props.token.userToken.rol}</i> </small>
                                </p>
                            </li>
                            <li className="user-footer">
                                <button className="btn btn-secondary" onClick={() => this.onEventCloseProject()}>
                                    <i className="fa fa-sign-out fa-sm" ></i> Cerrar Módulo
                                </button>

                                <button className="btn btn-secondary" onClick={() => this.onEventSignIn()}>
                                    <i className="fa fa-window-close fa-sm"></i> Cerrar Sesión
                                </button>
                            </li>
                        </ul>
                    </div>
                </ul>
            </header>
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
  
  const mapDispatchToProps = { signOut, closeProject, addNotification }
  
  /**
   *
   * Método encargado de conectar con redux y exportar la clase
   */
  const ConnectedMenu = connect(mapStateToProps, mapDispatchToProps)(Menu);
  
  export default ConnectedMenu;