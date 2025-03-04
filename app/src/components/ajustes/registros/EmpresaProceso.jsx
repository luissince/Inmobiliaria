import React from "react";
import axios from "axios";
import {
  convertNullText,
  ModalAlertDialog,
  ModalAlertInfo,
  ModalAlertSuccess,
  ModalAlertWarning,
  spinnerLoading,
  keyNumberInteger,
  imageBase64,
  readDataURL,
} from "../../../helper/Tools";
import { connect } from "react-redux";
import sunat from "../../../recursos/images/sunat.png";
import noImage from "../../../recursos/images/noimage.jpg";

class EmpresaProceso extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      idEmpresa: "",
      documento: "",
      razonSocial: "",
      nombreEmpresa: "",
      telefono: "",
      celular: "",
      email: "",
      web: "",
      direccion: "",
      useSol: "",
      claveSol: "",
      usuarioEmail: "",
      claveEmail: "",
      logo: noImage,
      image: noImage,

      lookPasswordEmail: false,
      lookPasswordSol: false,

      loading: true,
      messageWarning: "",
      msgLoading: "Cargando datos...",
    };

    this.refDocumento = React.createRef();
    this.refRazonSocial = React.createRef();

    this.refDireccion = React.createRef();
    this.refUbigeo = React.createRef();

    this.refPasswordEmail = React.createRef();
    this.refPasswordSol = React.createRef();

    this.refFileLogo = React.createRef();
    this.refFileImagen = React.createRef();
    this.abortControllerModal = new AbortController();
  }

  setStateAsync(state) {
    return new Promise((resolve) => {
      this.setState(state, resolve);
    });
  }

  componentDidMount() {
    const url = this.props.location.search;
    const idEmpresa = new URLSearchParams(url).get("idEmpresa");
    if (idEmpresa !== null) {
      this.loadDataId(idEmpresa);
    } else {
      this.props.history.goBack();
    }

    this.refDocumento.current.focus();

    this.refFileLogo.current.addEventListener("change", this.onEventFileLogo);
    this.refFileImagen.current.addEventListener(
      "change",
      this.onEventFileImage
    );
  }

  componentWillUnmount() {
    this.abortControllerModal.abort();

    this.refFileLogo.current.removeEventListener(
      "change",
      this.onEventFileLogo
    );
    this.refFileImagen.current.removeEventListener(
      "change",
      this.onEventFileImage
    );
  }

  onEventFileLogo = async (event) => {
    console.log(event.target.files);
    if (event.target.files.length !== 0) {
      await this.setStateAsync({
        logo: URL.createObjectURL(event.target.files[0]),
      });
    } else {
      await this.setStateAsync({
        logo: noImage,
      });
      this.refFileLogo.current.value = "";
    }
  };

  onEventFileImage = async (event) => {
    if (event.target.files.length !== 0) {
      await this.setStateAsync({
        image: URL.createObjectURL(event.target.files[0]),
      });
    } else {
      await this.setStateAsync({
        image: noImage,
      });
      this.refFileImagen.current.value = "";
    }
  };

  async clearLogo() {
    await this.setStateAsync({
      logo: noImage,
    });
    this.refFileLogo.current.value = "";
  }

  async clearImage() {
    await this.setStateAsync({
      image: noImage,
    });
    this.refFileImagen.current.value = "";
  }

  loadDataId = async (id) => {
    try {
      const result = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/empresa/id", {
        signal: this.abortControllerModal.signal,
        params: {
          idEmpresa: id,
        },
      });

      const data = result.data;

      await this.setStateAsync({
        idEmpresa: data.idEmpresa,

        documento: data.documento,
        razonSocial: data.razonSocial,
        nombreEmpresa: data.nombreEmpresa,
        direccion: data.direccion,

        useSol: data.useSol,
        claveSol: data.claveSol,

        usuarioEmail: data.usuarioEmail,
        claveEmail: data.claveEmail,

        logo: data.rutaLogo !== "" ? "/" + data.rutaLogo : noImage,
        image: data.rutaImage !== "" ? "/" + data.rutaImage : noImage,

        loading: false,
      });
    } catch (error) {
      if (error.message !== "canceled") {
        await this.setStateAsync({
          msgModal: "Se produjo un error interno, intente nuevamente",
        });
      }
    }
  };

  async onEventGetApiSunat() {
    if (this.state.documento === "") {
      this.refDocumento.current.focus();
      return;
    }

    if (this.state.documento.length !== 11) {
      this.refDocumento.current.focus();
      return;
    }

    try {
      await this.setStateAsync({
        loading: true,
        msgLoading: "Consultando número de RUC...",
      });

      let result = await axios.get(
        "https://dniruc.apisperu.com/api/v1/ruc/" +
          this.state.documento +
          "?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFsZXhhbmRlcl9keF8xMEBob3RtYWlsLmNvbSJ9.6TLycBwcRyW1d-f_hhCoWK1yOWG_HJvXo8b-EoS5MhE",
        {
          timeout: 5000,
        }
      );
      await this.setStateAsync({
        documento: convertNullText(result.data.ruc),
        razonSocial: convertNullText(result.data.razonSocial),
        direccion: convertNullText(result.data.direccion),
        loading: false,
      });
    } catch (error) {
      await this.setStateAsync({
        loading: false,
      });
    }
  }

  async onEventGuardar() {
    if (this.state.documento === "") {
      this.refDocumento.current.focus();
      return;
    }

    if (this.state.razonSocial === "") {
      this.refRazonSocial.current.focus();
      return;
    }
    ModalAlertDialog("Empresa", "¿Está seguro de continuar?", async () => {
      try {
        ModalAlertInfo("Empresa", "Procesando información...");

        let logoSend = await imageBase64(this.refFileLogo);
        let baseLogo = logoSend ? logoSend.base64String : "";
        let extLogo = logoSend ? logoSend.extension : "";

        let imageSend = await imageBase64(this.refFileImagen);
        let baseImage = imageSend ? imageSend.base64String : "";
        let extImage = imageSend ? imageSend.extension : "";

        let result = await axios.post(import.meta.env.VITE_APP_END_POINT+"/api/empresa/update", {
          documento: this.state.documento.trim(),
          razonSocial: this.state.razonSocial.trim().toUpperCase(),
          nombreEmpresa: this.state.nombreEmpresa.trim().toUpperCase(),
          direccion: this.state.direccion.trim().toUpperCase(),

          useSol: this.state.useSol.trim(),
          claveSol: this.state.claveSol.trim(),

          usuarioEmail: this.state.usuarioEmail.trim(),
          claveEmail: this.state.claveEmail.trim(),

          logo: baseLogo,
          image: baseImage,
          extlogo: extLogo,
          extimage: extImage,

          idEmpresa: this.state.idEmpresa,
        });

        ModalAlertSuccess("Empresa", result.data, () => {
          this.props.history.goBack();
        });
      } catch (error) {
        if (error.response) {
          ModalAlertWarning("Empresa", error.response.data);
        } else {
          ModalAlertWarning(
            "Empresa",
            "Se produjo un error un interno, intente nuevamente."
          );
        }
      }
    });
  }

  handleLookPasswordEmail = () => {
    this.setState({
      lookPasswordEmail: !this.state.lookPasswordEmail,
    });
    this.refPasswordEmail.current.focus();
  };

  handleLookPasswordSol = () => {
    this.setState({
      lookPasswordSol: !this.state.lookPasswordSol,
    });
    this.refPasswordSol.current.focus();
  };

  render() {
    return (
      <>
        {this.state.loading ? (
          <div className="clearfix absolute-all bg-white">
            {spinnerLoading(this.state.msgLoading)}
          </div>
        ) : null}

        <div className="row">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <section className="content-header">
              <h5>
                <span role="button" onClick={() => this.props.history.goBack()}>
                  <i className="bi bi-arrow-left-short"></i>
                </span>{" "}
                Editar Empresa
              </h5>
            </section>
          </div>
        </div>

        {this.state.loadModal ? (
          <div className="clearfix absolute-all bg-white">
            {spinnerLoading(this.state.msgModal)}
          </div>
        ) : null}

        <div className="form-row">
          <div className="form-group col-md-6">
            <label>
              Ruc: <i className="fa fa-asterisk text-danger small"></i>
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                onKeyPress={keyNumberInteger}
                ref={this.refDocumento}
                value={this.state.documento}
                onChange={(event) =>
                  this.setState({ documento: event.target.value })
                }
                placeholder="-----------"
              />
              <div className="input-group-append">
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  title="Sunat"
                  onClick={() => this.onEventGetApiSunat()}
                >
                  <img src={sunat} alt="Sunat" width="12" />
                </button>
              </div>
            </div>
          </div>

          <div className="form-group col-md-6">
            <label>
              Razón Social: <i className="fa fa-asterisk text-danger small"></i>
            </label>
            <input
              type="text"
              className="form-control"
              ref={this.refRazonSocial}
              value={this.state.razonSocial}
              onChange={(event) =>
                this.setState({ razonSocial: event.target.value })
              }
              placeholder="Ingrese la razón social"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group col-md-6">
            <label>Nombre Comercial: </label>
            <input
              type="text"
              className="form-control"
              value={this.state.nombreEmpresa}
              onChange={(event) =>
                this.setState({ nombreEmpresa: event.target.value })
              }
              placeholder="Ingrese el nombre comercial"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group col-md-12">
            <label>Dirección Fiscal: </label>
            <input
              type="text"
              className="form-control"
              value={this.state.direccion}
              onChange={(event) =>
                this.setState({ direccion: event.target.value })
              }
              placeholder="Ingrese el nombre comercial"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group col-md-6">
            <label>
              Usuario Email (<small>Para el envío del correo</small>):{" "}
            </label>
            <input
              type="text"
              className="form-control"
              value={this.state.usuarioEmail}
              onChange={(event) =>
                this.setState({ usuarioEmail: event.target.value })
              }
              placeholder="Email de Envío"
            />
          </div>

          <div className="form-group col-md-6">
            <label>
              Contraseña Email (<small>Para el envío del correo</small>):{" "}
            </label>
            <div class="input-group">
              <input
                ref={this.refPasswordEmail}
                type={this.state.lookPasswordEmail ? "text" : "password"}
                className="form-control"
                value={this.state.claveEmail}
                onChange={(event) =>
                  this.setState({ claveEmail: event.target.value })
                }
                placeholder="********"
              />
              <div class="input-group-append">
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                  title="Email"
                  onClick={this.handleLookPasswordEmail}
                >
                  <i
                    className={
                      this.state.lookPasswordEmail
                        ? "fa fa-eye"
                        : "fa fa-eye-slash"
                    }
                  ></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group col-md-6">
            <label>
              Usuario Sol(<small>Para el envío a Sunat</small>):{" "}
            </label>
            <input
              type="text"
              className="form-control"
              value={this.state.useSol}
              onChange={(event) =>
                this.setState({ useSol: event.target.value })
              }
              placeholder="usuario"
            />
          </div>

          <div className="form-group col-md-6">
            <label>
              Clave Sol(<small>Para el envío a Sunat</small>):{" "}
            </label>
            <div class="input-group">
              <input
                ref={this.refPasswordSol}
                type={this.state.lookPasswordSol ? "text" : "password"}
                className="form-control"
                value={this.state.claveSol}
                onChange={(event) =>
                  this.setState({ claveSol: event.target.value })
                }
                placeholder="********"
              />
              <div class="input-group-append">
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                  title="Sunat"
                  onClick={this.handleLookPasswordSol}
                >
                  <i
                    className={
                      this.state.lookPasswordSol
                        ? "fa fa-eye"
                        : "fa fa-eye-slash"
                    }
                  ></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group col-md-6 text-center">
            <label>Logo</label>
            <br />
            <small>Usuado para los reportes</small>
            <div className="text-center mb-2 ">
              <img
                src={this.state.logo}
                alt=""
                className="img-fluid border border-primary rounded"
                width={250}
              />
            </div>
            <input
              type="file"
              id="fileLogo"
              accept="image/png, image/jpeg, image/gif, image/svg"
              className="display-none"
              ref={this.refFileLogo}
            />
            <label htmlFor="fileLogo" className="btn btn-outline-secondary m-0">
              <div className="content-button">
                <i className="bi bi-image"></i>
                <span></span>
              </div>
            </label>{" "}
            <button
              className="btn btn-outline-secondary"
              onClick={() => this.clearLogo()}
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>

          <div className="form-group col-md-6 text-center">
            <label>Imagen</label>
            <br />
            <small>Usuado para mostrar el logo en sistema</small>
            <div className="text-center mb-2 ">
              <img
                src={this.state.image}
                alt=""
                className="img-fluid border border-primary rounded"
                width={250}
              />
            </div>
            <input
              type="file"
              id="fileImage"
              accept="image/png, image/jpeg, image/gif, image/svg"
              className="display-none"
              ref={this.refFileImagen}
            />
            <label
              htmlFor="fileImage"
              className="btn btn-outline-secondary m-0"
            >
              <div className="content-button">
                <i className="bi bi-image"></i>
                <span></span>
              </div>
            </label>{" "}
            <button
              className="btn btn-outline-secondary"
              onClick={() => this.clearImage()}
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => this.onEventGuardar()}
            >
              Guardar
            </button>{" "}
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => this.props.history.goBack()}
            >
              Cerrar
            </button>
          </div>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    token: state.principal,
  };
};

export default connect(mapStateToProps, null)(EmpresaProceso);
