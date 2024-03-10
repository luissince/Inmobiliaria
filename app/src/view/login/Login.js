import React from "react";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { signIn } from "../../redux/actions";
import noimage from "../../recursos/images/noimage.jpg";
import "./Login.css";
import { loginApi } from "../../network/rest/principal.network";
import SuccessReponse from "../../model/class/response";
import ErrorResponse from "../../model/class/error";

class Login extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      usuario: "",
      password: "",
      message: "",
      lookPassword: false,
      loading: false,
    };

    this.usuarioInput = React.createRef();
    this.passwordInput = React.createRef();
  }

  setStateAsync(state) {
    return new Promise((resolve) => {
      this.setState(state, resolve);
    });
  }

  componentDidMount() {
    if (this.usuarioInput.current !== null) {
      this.usuarioInput.current.focus();
    }
    window.addEventListener("focus", this.onEventFocused);
  }

  componentWillUnmount() {
    window.removeEventListener("focus", this.onEventFocused);
  }

  onEventFocused = (event) => {
    let userToken = window.localStorage.getItem("login");
    if (userToken !== null) {
      let projectToken = window.localStorage.getItem("project");
      if (projectToken !== null) {
        this.props.restore(JSON.parse(userToken), JSON.parse(projectToken));
      } else {
        this.props.restore(JSON.parse(userToken));
        this.props.history.push("principal");
      }
    }
  };

  onEventForm = async () => {
    if (this.state.loading) return;

    if (this.state.usuario === "") {
      this.usuarioInput.current.focus();
      await this.setStateAsync({
        message: "Ingrese su usuario para iniciar sesión.",
      });
      return;
    }

    if (this.state.password === "") {
      this.passwordInput.current.focus();
      await this.setStateAsync({
        message: "Ingrese su contraseña para iniciar sesión.",
      });
      return;
    }

    document.activeElement.blur();

    await this.setStateAsync({ loading: true });

    const data = {
      usuario: this.state.usuario,
      password: this.state.password,
    };

    const response = await loginApi(data);

    if (response instanceof SuccessReponse) {
      const menus = response.data.menu.map((item, index) => {
        let submenu = [];
        for (let value of response.data.submenu) {
          let privilegio = [];
          if (item.idMenu === value.idMenu) {
            for (let content of response.data.privilegio) {
              if (
                content.idSubMenu === value.idSubMenu &&
                item.idMenu === content.idMenu
              ) {
                privilegio.push({
                  estado: content.estado,
                  idMenu: content.idMenu,
                  idPrivilegio: content.idPrivilegio,
                  idSubMenu: content.idSubMenu,
                  nombre: content.nombre,
                });
              }
            }

            submenu.push({
              estado: value.estado,
              idMenu: value.idMenu,
              idSubMenu: value.idSubMenu,
              nombre: value.nombre,
              ruta: value.ruta,
              privilegio: privilegio,
            });
          }
        }

        return {
          ...item,
          submenu,
        };
      });

      let user = {
        apellidos: response.data.apellidos,
        estado: response.data.estado,
        idUsuario: response.data.idUsuario,
        nombres: response.data.nombres,
        rol: response.data.rol,
        token: response.data.token,
        menus,
      };

      window.localStorage.setItem("login", JSON.stringify(user));
      this.props.restore(JSON.parse(window.localStorage.getItem("login")));
      this.props.history.push("principal");
    }

    if (response instanceof ErrorResponse) {
      await this.setStateAsync({
        loading: false,
        message: response.getMessage(),
      });

      this.usuarioInput.current.focus();
    }
  };

  onEventRecuperar = () => {
    window.open("/api/login/report", "_blank");
  };

  handleChangeUsuario = (event) => {
    if (event.target.value.length > 0) {
      this.setState({
        usuario: event.target.value,
        message: "",
      });
    } else {
      this.setState({
        usuario: event.target.value,
        message: "Ingrese su usuario para iniciar sesión.",
      });
    }
  };

  handleChangePassword = (event) => {
    if (event.target.value.length > 0) {
      this.setState({
        password: event.target.value,
        message: "",
      });
    } else {
      this.setState({
        password: event.target.value,
        message: "Ingrese su contraseña para iniciar sesión.",
      });
    }
  };

  handleViewPassword = () => {
    this.setState({
      lookPassword: !this.state.lookPassword,
    });
    this.passwordInput.current.focus();
  };

  render() {
    const { usuario, password, message } = this.state;
    if (this.props.token.userToken != null) {
      return <Redirect to="/principal" />;
    }

    const { rutaImage } = this.props.token.empresa;

    return (
      <>
        <style>{"html,body,#root{height:100%;}"}</style>

        <div className="form-content text-center bg-white">
          <form className="form-signin">
            <img
              className="mb-4"
              src={`${rutaImage !== "" ? "/" + rutaImage : noimage}`}
              alt="Logo"
              width="150"
            />
            <h5 className="mb-3 font-weight-normal">Ingrese los datos</h5>
            {message !== "" ? (
              <div
                className="alert alert-warning d-flex align-items-center"
                role="alert"
              >
                <i className="bi bi-exclamation-diamond-fill m-1"></i>
                <div className=" m-1">{message}</div>
              </div>
            ) : null}

            {this.state.loading ? (
              <div className="m-3">
                <div
                  className="spinner-border text-success"
                  role="status"
                ></div>
              </div>
            ) : null}

            <label htmlFor="inputUsuario" className="sr-only">
              Usuario
            </label>
            <div className="form-group mb-3">
              <input
                ref={this.usuarioInput}
                onChange={this.handleChangeUsuario}
                value={usuario}
                type="text"
                id="inputUsuario"
                className="form-control"
                placeholder="Ingrese su usuario"
                required=""
                autoFocus=""
                onKeyUp={(event) => {
                  if (event.key === "Enter") {
                    this.onEventForm();
                    event.preventDefault();
                  }
                }}
              />
            </div>

            <label htmlFor="inputPassword" className="sr-only">
              Password
            </label>

            <div className="form-group">
              <div className="input-group">
                <input
                  ref={this.passwordInput}
                  onChange={this.handleChangePassword}
                  value={password}
                  required=""
                  id="inputPassword"
                  type={this.state.lookPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Ingrese su contraseña"
                  onKeyUp={(event) => {
                    if (event.key === "Enter") {
                      this.onEventForm();
                      event.preventDefault();
                    }
                  }}
                />
                <div className="input-group-append">
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    title="Mostrar"
                    onClick={this.handleViewPassword}
                  >
                    <i
                      className={
                        this.state.lookPassword
                          ? "fa fa-eye"
                          : "fa fa-eye-slash"
                      }
                    ></i>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={this.onEventForm}
              type="button"
              className="btn btn-primary btn-block"
            >
              Ingresar <i className="fa fa-arrow-right"></i>
            </button>

            {/* <button onClick={this.onEventRecuperar} type="button" className="btn btn-lg btn-outline-primary btn-block">Recuperar</button> */}
            <p className="mt-5 mb-3 text-muted">
              SysSoft Integra © {new Date().getFullYear()}
            </p>
          </form>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    token: state.reducer,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    restore: (user, project = null) => dispatch(signIn(user, project)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);
