import React from 'react';
import axios from 'axios';
import {
    numberFormat,
    timeForma24,
    spinnerLoading,
    ModalAlertDialog,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    ModalAlertError,
    statePrivilegio,
    keyUpSearch
} from '../../helper/Tools';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import Paginacion from '../../helper/Paginacion';
import { setCobrosState } from '../../redux/cobrosSlice';

class Cobros extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ...props.cobrosState,

            add: statePrivilegio(this.props.token.userToken.menus[2].submenu[3].privilegio[0].estado),
            view: statePrivilegio(this.props.token.userToken.menus[2].submenu[3].privilegio[1].estado),
            remove: statePrivilegio(this.props.token.userToken.menus[2].submenu[3].privilegio[2].estado),

            idProyecto: this.props.token.project.idProyecto,
            idUsuario: this.props.token.userToken.idUsuario,
        }

        this.refPaginacion = React.createRef();
        this.abortControllerTable = null;
    }

    setStateAsync = (newState) => {
        return new Promise((resolve) => {
            this.setState((prevState) => {

                const nextState = { ...prevState, ...newState };

                const paginacionState = this.refPaginacion.current?.getBounds();

                this.props.setCobrosState({
                    ...nextState,
                    paginacionState
                });

                resolve(nextState);

                return newState;
            });
        });
    };

    componentDidMount() {
        const pagState = this.props.cobrosState.paginacionState;

        if (pagState && this.refPaginacion.current) {
            this.refPaginacion.current.setBounds(pagState);
        }

        if (!this.state.lista?.length) {
            this.loadInit();
        }
    }

    componentWillUnmount() {
        this.abortControllerTable?.abort();
    }

    loadInit = async () => {
        if (this.state.loading) return;

        await this.setStateAsync({ paginacion: 1, restart: true });
        this.fillTable(0);
        await this.setStateAsync({ opcion: 0 });
    }

    async searchText(text) {
        const value = text.trim();

        if (this.state.loading || !value) return;

        await this.setStateAsync({ paginacion: 1, restart: false });
        this.fillTable(1, text.trim());
        await this.setStateAsync({ opcion: 1 });
    }

    paginacionContext = async (listid) => {
        await this.setStateAsync({ paginacion: listid, restart: false });
        this.onEventPaginacion();
    }

    onEventPaginacion = () => {
        this.fillTable(this.state.opcion, this.state.search);
    }

    fillTable = async (opcion, buscar) => {
        this.abortControllerTable?.abort();
        this.abortControllerTable = new AbortController();

        try {
            await this.setStateAsync({ loading: true, lista: [], messageTable: "Cargando información...", messagePaginacion: "Mostranto 0 de 0 Páginas" });

            const result = await axios.get(import.meta.env.VITE_APP_END_POINT + '/api/cobro/list', {
                signal: this.abortControllerTable.signal,
                params: {
                    "opcion": opcion,
                    "buscar": buscar,
                    "idProyecto": this.state.idProyecto,
                    "posicionPagina": ((this.state.paginacion - 1) * this.state.filasPorPagina),
                    "filasPorPagina": this.state.filasPorPagina
                }
            });

            const totalPaginacion = Math.ceil(result.data.total / this.state.filasPorPagina);
            let messagePaginacion = `Mostrando ${result.data.result.length} registros | ${totalPaginacion} páginas`;

            await this.setStateAsync({
                loading: false,
                lista: result.data.result,
                totalPaginacion: totalPaginacion,
                messagePaginacion: messagePaginacion
            });
        } catch (error) {
            if (error.code !== "ERR_CANCELED") {
                await this.setStateAsync({
                    loading: false,
                    lista: [],
                    totalPaginacion: 0,
                    messageTable: "Se produjo un error interno, intente nuevamente por favor.",
                    messagePaginacion: "Mostranto 0 de 0 Páginas",
                });
            }
        } finally {
            this.abortControllerTable = null;
        }
    }

    onEventNuevoCobro() {
        this.props.history.push({
            pathname: `${this.props.location.pathname}/proceso`,
        })
    }

    onEventAnularCobro(idCobro) {
        ModalAlertDialog("Cobro", "¿Está seguro de que desea eliminar la transacción? Esta operación no se puede deshacer.", async (value) => {
            if (value) {
                try {
                    ModalAlertInfo("Cobro", "Procesando información...");
                    let result = await axios.delete(import.meta.env.VITE_APP_END_POINT + '/api/cobro/anular', {
                        params: {
                            "idCobro": idCobro,
                            "idUsuario": this.state.idUsuario
                        }
                    })
                    ModalAlertSuccess("Cobro", result.data, () => {
                        this.loadInit();
                    })
                } catch (error) {
                    if (error.response) {
                        ModalAlertWarning("Cobro", error.response.data)
                    } else {
                        ModalAlertError("Cobro", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    render() {
        return (
            <>
                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Cobros o Ingresos <small className="text-secondary">LISTA</small></h5>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group">
                            <div className="input-group mb-2">
                                <div className="input-group-prepend">
                                    <div className="input-group-text"><i className="bi bi-search"></i></div>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar..."
                                    value={this.state.search}
                                    onChange={(e) => this.setStateAsync({ search: e.target.value })}
                                    onKeyUp={(event) =>
                                        keyUpSearch(event, () => this.searchText(this.state.search))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group">
                            <button className="btn btn-outline-info" onClick={() => this.onEventNuevoCobro()} disabled={!this.state.add}>
                                <i className="bi bi-file-plus"></i> Nuevo Registro
                            </button>
                            {" "}
                            <button className="btn btn-outline-secondary" onClick={() => this.loadInit()}>
                                <i className="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="5%" className="text-center">#</th>
                                        <th width="10%">Cliente</th>
                                        <th width="10%">Correlativo</th>
                                        <th width="10%">Creación</th>
                                        <th width="10%">Cuenta</th>
                                        <th width="15%">Observación</th>
                                        <th width="10%">Estado</th>
                                        <th width="10%">Monto</th>
                                        <th width="5%" className="text-center">Detalle</th>
                                        <th width="5%" className="text-center">Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.loading ? (
                                            <tr>
                                                <td className="text-center" colSpan="10">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="10">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            this.state.lista.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td className="text-center">{item.id}</td>
                                                        <td>{item.documento}{<br />}{item.informacion}</td>
                                                        <td>{item.comprobante}{<br />}{item.serie + "-" + item.numeracion}</td>
                                                        <td>{item.fecha}{<br />}{timeForma24(item.hora)}</td>
                                                        <td>{item.banco}</td>
                                                        <td>{item.detalle}
                                                            <br />
                                                            <small>
                                                                {
                                                                    item.comprobanteRef !== "" ?
                                                                        <Link className='btn-link' to={`/inicio/ventas/detalle?idVenta=${item.idVentaRef}`}>
                                                                            {item.comprobanteRef} <i className='fa fa-external-link-square'></i>
                                                                        </Link>
                                                                        : null
                                                                }
                                                            </small>
                                                            <br />
                                                            <small>{item.loteRef}</small>
                                                            {
                                                                item.estadoRef === 4 ?
                                                                    <>
                                                                        <br />
                                                                        <small className="text-danger">MODIFICADO</small>
                                                                    </>
                                                                    :
                                                                    null
                                                            }
                                                        </td>
                                                        <td>{item.estado === 1 && item.idNotaCredito === null ?
                                                            <span className="text-success">COBRADO</span> :
                                                            item.idNotaCredito != null ?
                                                                <span className="text-warning">MODIFICADO</span> :
                                                                <span className="text-danger">ANULADO</span>}
                                                        </td>
                                                        <td>{numberFormat(item.monto)}</td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-info btn-sm"
                                                                title="Detalle"
                                                                onClick={() => {
                                                                    this.props.history.push({ pathname: `${this.props.location.pathname}/detalle`, search: "?idCobro=" + item.idCobro })
                                                                }}
                                                                disabled={!this.state.view}>
                                                                <i className="fa fa-eye"></i>
                                                            </button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                title="Eliminar"
                                                                onClick={() => this.onEventAnularCobro(item.idCobro)}
                                                                disabled={!this.state.remove}>
                                                                <i className="fa fa-remove"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-sm-12 col-md-5">
                        <div className="dataTables_info mt-2" role="status" aria-live="polite">{this.state.messagePaginacion}</div>
                    </div>
                    <div className="col-sm-12 col-md-7">
                        <div className="dataTables_paginate paging_simple_numbers">
                            <nav aria-label="Page navigation example">
                                <ul className="pagination justify-content-end">
                                    <Paginacion
                                        ref={this.refPaginacion}
                                        loading={this.state.loading}
                                        totalPaginacion={this.state.totalPaginacion}
                                        paginacion={this.state.paginacion}
                                        fillTable={this.paginacionContext}
                                        restart={this.state.restart}
                                    />
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.principal,
        cobrosState: state.cobros
    }
}

const mapDispatchToProps = {
    setCobrosState
};


export default connect(mapStateToProps, mapDispatchToProps)(Cobros);