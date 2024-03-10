import React from 'react';
import axios from 'axios';
import {
    convertNullText,
    imageBase64,
    keyNumberInteger,
    keyNumberPhone,
    spinnerLoading,
    ModalAlertDialog,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
} from '../../helper/Tools';
import { connect } from 'react-redux';
import { configSave } from '../../redux/actions';
import sunat from '../../recursos/images/sunat.png';
import noImage from '../../recursos/images/noimage.jpg'

class Configurar extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            documento: '',
            razonSocial: '',
            nombreEmpresa: '',
            telefono: '',
            celular: '',
            email: '',
            web: '',
            direccion: '',
            logo: noImage,
            image: noImage,

            loading: false,
            messageWarning: '',
            msgLoading: 'Cargando datos...',
        }

        this.refDocumento = React.createRef();
        this.refRazonSocial = React.createRef();
        this.refNombreComercial = React.createRef();
        this.refDireccion = React.createRef();

        this.refFileLogo = React.createRef();
        this.refFileImagen = React.createRef();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {
        this.refDocumento.current.focus();

        this.refFileLogo.current.addEventListener("change", this.onEventFileLogo);
        this.refFileImagen.current.addEventListener("change", this.onEventFileImage);
    }
    componentWillUnmount() {
        this.refFileLogo.current.removeEventListener("change", this.onEventFileLogo);
        this.refFileImagen.current.removeEventListener("change", this.onEventFileImage);
    }

    onEventFileLogo = async (event) => {
        if (event.target.files.length !== 0) {
            await this.setStateAsync({
                logo: URL.createObjectURL(event.target.files[0])
            });
        } else {
            await this.setStateAsync({
                logo: noImage
            });
            this.refFileLogo.current.value = "";
        }
    }

    onEventFileImage = async (event) => {
        if (event.target.files.length !== 0) {
            await this.setStateAsync({
                image: URL.createObjectURL(event.target.files[0])
            });
        } else {
            await this.setStateAsync({
                image: noImage
            });
            this.refFileImagen.current.value = "";
        }
    }

    async clearLogo() {
        await this.setStateAsync({
            logo: noImage
        })
        this.refFileLogo.current.value = "";
    }

    async clearImage() {
        await this.setStateAsync({
            image: noImage
        })
        this.refFileImagen.current.value = "";
    }

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
                msgLoading: 'Consultando número de RUC...',
            });

            let result = await axios.get("https://dniruc.apisperu.com/api/v1/ruc/" + this.state.documento + "?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFsZXhhbmRlcl9keF8xMEBob3RtYWlsLmNvbSJ9.6TLycBwcRyW1d-f_hhCoWK1yOWG_HJvXo8b-EoS5MhE", {
                timeout: 5000,
            });
            await this.setStateAsync({
                documento: convertNullText(result.data.ruc),
                razonSocial: convertNullText(result.data.razonSocial),
                direccion: convertNullText(result.data.direccion),
                loading: false,
            });
        } catch (error) {
            await this.setStateAsync({
                loading: false,
            })
        }
    }

    onEventSave() {
        if (this.state.documento === "") {
            this.refDocumento.current.focus();
            return;
        }

        if (this.state.razonSocial === "") {
            this.refDocumento.current.focus();
            return;
        }


        ModalAlertDialog("Mi Empresa", "¿Está seguro de continuar?", async (event) => {
            if (event) {
                try {
                    let logoSend = await imageBase64(this.refFileLogo);
                    let baseLogo = logoSend ? logoSend.base64String : "";
                    let extLogo = logoSend ? logoSend.extension : "";

                    let imageSend = await imageBase64(this.refFileImagen);
                    let baseImage = imageSend ? imageSend.base64String : "";
                    let extImage = imageSend ? imageSend.extension : "";

                    ModalAlertInfo("Mi Empresa", "Procesando información...");

                    let result = await axios.post('/api/empresa/save', {
                        documento: this.state.documento.trim(),
                        razonSocial: this.state.razonSocial.trim(),
                        nombreEmpresa: this.state.nombreEmpresa.trim(),
                        telefono: this.state.telefono.trim(),
                        celular: this.state.celular.trim(),
                        email: this.state.email.trim(),
                        web: this.state.web.trim(),
                        direccion: this.state.direccion.trim(),
                        logo: baseLogo,
                        image: baseImage,
                        extlogo: extLogo,
                        extimage: extImage
                    });

                    ModalAlertSuccess("Mi Empresa", result.data, () => {
                        this.props.configSave();
                        window.location.href = "/";
                    });
                } catch (error) {
                    if (error.response) {
                        ModalAlertWarning("Mi Empresa", error.response.data);
                    } else {
                        ModalAlertWarning("Mi Empresa", "Se produjo un error un interno, intente nuevamente.");
                    }
                }
            }
        });
    }

    render() {
        return (
            <div className='container'>

                {
                    this.state.messageWarning === '' ? null :
                        <div className="alert alert-warning" role="alert">
                            <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                        </div>
                }

                {
                    this.state.loading ?
                        <div className="clearfix fixed-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div>
                        : null
                }


                <div className="py-5 text-center">
                    <h3>Configuración Básica</h3>
                    <p className="lead">Rellene los datos requeridos <i className="fa fa-asterisk text-danger small"></i></p>
                </div>


                <div className="row">
                    <div className="col-md-12">
                        <h5 className="mb-3">Información de tu Empresa</h5>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="lblNDocumento">N° de Documento <i className="fa fa-asterisk text-danger small"></i></label>
                                <div className="input-group">
                                    <input
                                        ref={this.refDocumento}
                                        type="text"
                                        className="form-control"
                                        id="lblNDocumento"
                                        placeholder="-----------"
                                        onKeyPress={keyNumberInteger}
                                        value={this.state.documento}
                                        onChange={(event) => this.setState({ documento: event.target.value })}
                                    />
                                    <div className="input-group-append">
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            title="Sunat"
                                            onClick={() => this.onEventGetApiSunat()}>
                                            <img src={sunat} alt="Sunat" width="12" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="lblRazonSocial">Razón Social <i className="fa fa-asterisk text-danger small"></i></label>
                                <input
                                    ref={this.refRazonSocial}
                                    type="text"
                                    className="form-control"
                                    id="lblRazonSocial"
                                    placeholder="Mi razón social"
                                    value={this.state.razonSocial}
                                    onChange={(event) => this.setState({ razonSocial: event.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="lblNombreComercial">Nombre Comercial</label>
                                <input
                                    ref={this.refNombreComercial}
                                    type="text"
                                    className="form-control"
                                    id="lblNombreComercial"
                                    placeholder="Mi empresa"
                                    value={this.state.nombreEmpresa}
                                    onChange={(event) => this.setState({ nombreEmpresa: event.target.value })} />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="lblNTelefono">N° Teléfono </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="lblNTelefono"
                                    placeholder="064 78456123"
                                    onKeyPress={keyNumberPhone}
                                    value={this.state.telefono}
                                    onChange={(event) => this.setState({ telefono: event.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="lblNCelular">N° Celular </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="lblNCelular"
                                    placeholder="999999999"
                                    onKeyPress={keyNumberPhone}
                                    value={this.state.celular}
                                    onChange={(event) => this.setState({ celular: event.target.value })} />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="lblCorreoElectronico">Correo Electrónico </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="lblCorreoElectronico"
                                    placeholder="empresa@mail.com"
                                    value={this.state.email}
                                    onChange={(event) => this.setState({ email: event.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="lblPaginaWeb">Página web</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="lblPaginaWeb"
                                    placeholder="www.dominio.com"
                                    value={this.state.web}
                                    onChange={(event) => this.setState({ web: event.target.value })} />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-12 mb-3">
                                <label htmlFor="lblDireccion">Dirección </label>
                                <input
                                    ref={this.refDireccion}
                                    type="text"
                                    className="form-control"
                                    id="lblDireccion"
                                    placeholder="av, calle etc."
                                    value={this.state.direccion}
                                    onChange={(event) => this.setState({ direccion: event.target.value })} />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3 text-center">
                                <label>Logo</label>
                                <br />
                                <small>Usuado para los reportes</small>
                                <div className="text-center mb-2 ">
                                    <img src={this.state.logo} alt="" className="img-fluid border border-primary rounded" width={250} />
                                </div>
                                <input type="file" id="fileLogo" accept="image/png, image/jpeg, image/gif, image/svg" className="display-none" ref={this.refFileLogo} />
                                <label htmlFor="fileLogo" className="btn btn-outline-secondary m-0">
                                    <div className="content-button">
                                        <i className="bi bi-image"></i>
                                        <span></span>
                                    </div>
                                </label>
                                {" "}
                                <button className="btn btn-outline-secondary" onClick={() => this.clearLogo()}>
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>

                            <div className="col-md-6 mb-3 text-center">
                                <label>Imagen</label>
                                <br />
                                <small>Usuado para mostrar el logo en sistema</small>
                                <div className="text-center mb-2 ">
                                    <img src={this.state.image} alt="" className="img-fluid border border-primary rounded" width={250} />
                                </div>
                                <input type="file" id="fileImage" accept="image/png, image/jpeg, image/gif, image/svg" className="display-none" ref={this.refFileImagen} />
                                <label htmlFor="fileImage" className="btn btn-outline-secondary m-0">
                                    <div className="content-button">
                                        <i className="bi bi-image"></i>
                                        <span></span>
                                    </div>
                                </label>
                                {" "}
                                <button className="btn btn-outline-secondary" onClick={() => this.clearImage()}>
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary btn-lg btn-block"
                            type="button"
                            onClick={() => this.onEventSave()}>
                            <i className="fa fa-save"></i> Guardar Información
                        </button>
                    </div>
                </div>


                <footer className="my-5 pt-5 text-muted text-center text-small">
                    <p>&copy; {new Date().getFullYear()} Distribuido por SysSoftIntegra &middot;</p>
                </footer>
            </div>
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
        configSave: () => dispatch(configSave())
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Configurar);
