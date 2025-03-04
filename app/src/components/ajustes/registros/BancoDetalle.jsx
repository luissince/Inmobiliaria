import React from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import {
    formatMoney,
    numberFormat,
    spinnerLoading,
} from '../../../helper/Tools';
import Paginacion from '../../../helper/Paginacion';

class BancoDetalle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            idBanco: '',
            nombre: '',
            tipoCuenta: '',
            numCuenta: '',
            moneda: '',
            saldo: '',
            codiso: '',

            initial: true,

            loading: false,
            lista: [],
            restart: false,

            opcion: 0,
            paginacion: 0,
            totalPaginacion: 0,
            filasPorPagina: 10,
            messageTable: 'Cargando información...',
            messagePaginacion: 'Mostranto 0 de 0 Páginas',
            messageLoading: 'Cargando datos...',
        }
        this.abortControllerView = new AbortController();
        this.abortControllerTable = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        const url = this.props.location.search;
        const idResult = new URLSearchParams(url).get("idBanco");
        if (idResult !== null) {
            this.loadDataId(idResult);
        } else {
            this.props.history.goBack();
        }
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
        this.abortControllerTable.abort();
    }

    async loadDataId(id) {
        try {

            const detalle = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/banco/iddetalle", {
                signal: this.abortControllerView.signal,
                params: {
                    "idBanco": id,
                    // "posicionPagina": ((this.state.paginacion - 1) * this.state.filasPorPagina),
                    // "filasPorPagina": this.state.filasPorPagina
                }
            });

            const cabecera = detalle.data.cabecera;

            await this.setStateAsync({
                idBanco: cabecera.idBanco,
                nombre: cabecera.nombre,
                tipoCuenta: cabecera.tipoCuenta,
                numCuenta: cabecera.numCuenta,
                moneda: cabecera.moneda,
                saldo: cabecera.saldo,
                codiso: cabecera.codiso,

                // lista : detalle.data.lista,
                initial: false
            });

            this.loadInit();
        } catch (error) {
            if (error.message !== "canceled") {
                this.props.history.goBack();
            }
        }
    }

    loadInit = async () => {
        if (this.state.loading) return;

        await this.setStateAsync({ paginacion: 1, restart: true });
        this.fillTable();
        await this.setStateAsync({ opcion: 0 });
    }

    paginacionContext = async (listid) => {
        await this.setStateAsync({ paginacion: listid, restart: false });
        this.onEventPaginacion();
    }

    onEventPaginacion = () => {
        this.fillTable();
    }

    fillTable = async () => {
        try {
            await this.setStateAsync({ loading: true, lista: [], messageTable: "Cargando información...", messagePaginacion: "Mostranto 0 de 0 Páginas" });

            const result = await axios.get(import.meta.env.VITE_APP_END_POINT+'/api/banco/detalle', {
                signal: this.abortControllerTable.signal,
                params: {
                    "idBanco": this.state.idBanco,
                    "posicionPagina": ((this.state.paginacion - 1) * this.state.filasPorPagina),
                    "filasPorPagina": this.state.filasPorPagina
                }
            });

            let totalPaginacion = parseInt(Math.ceil((parseFloat(result.data.total) / this.state.filasPorPagina)));
            let messagePaginacion = `Mostrando ${result.data.lista.length} de ${totalPaginacion} Páginas`;

            await this.setStateAsync({
                loading: false,
                lista: result.data.lista,
                totalPaginacion: totalPaginacion,
                messagePaginacion: messagePaginacion
            });
        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    loading: false,
                    lista: [],
                    totalPaginacion: 0,
                    messageTable: "Se produjo un error interno, intente nuevamente por favor.",
                    messagePaginacion: "Mostranto 0 de 0 Páginas",
                });
            }
        }
    }

    async onEventImprimir() {
        const data = {
            "idBanco": this.state.idBanco,
            "idSede": "SD0001"
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open(import.meta.env.VITE_APP_END_POINT+"/api/banco/repdetallebanco?" + params, "_blank");

    }

    render() {
        return (
            <>
                {
                    this.state.initial ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.messageLoading)}
                        </div> :
                        <>
                            <div className='row'>
                                <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                                    <div className="form-group">
                                        <h5>
                                            <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Banco
                                            <small className="text-secondary"> detalle</small>
                                        </h5>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                                    <div className="form-group">
                                        <button type="button" className="btn btn-light" onClick={() => this.onEventImprimir()}><i className="fa fa-print"></i> Imprimir</button>
                                        {" "}
                                        <button type="button" className="btn btn-light"><i className="fa fa-plus"></i> Agregar dinero</button>
                                        {" "}
                                        <button type="button" className="btn btn-light"><i className="fa fa-minus"></i> Disminuir dinero</button>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                                    <div className="form-group">
                                        <div className="table-responsive">
                                            <table width="100%">
                                                <thead>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal "><span>Caja / Banco</span></th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.nombre}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal "><span>Tipo de cuenta</span></th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.tipoCuenta}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal "><span>Número de cuenta</span></th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.numCuenta}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal "><span>Moneda</span></th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.moneda}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal "><span>Saldo</span></th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal"><strong className={this.state.saldo <= 0 ? 'text-danger' : 'text-success'}>{numberFormat(this.state.saldo, this.state.codiso)}</strong></th>
                                                    </tr>
                                                </thead>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                                    <div className="form-group">
                                        <div className="table-responsive">
                                            <table className="table table-light table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Fecha</th>
                                                        <th>Proveedor</th>
                                                        <th>Concepto</th>
                                                        <th>Salidas</th>
                                                        <th>Entradas</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        this.state.loading ?
                                                            (
                                                                <tr>
                                                                    <td className="text-center" colSpan="6">
                                                                        {spinnerLoading()}
                                                                    </td>
                                                                </tr>
                                                            )
                                                            :
                                                            this.state.lista.length === 0 ?
                                                                (
                                                                    <tr className="text-center">
                                                                        <td colSpan="6">¡No hay datos registrados!</td>
                                                                    </tr>
                                                                )
                                                                :
                                                                this.state.lista.map((item, index) => (
                                                                    <tr key={index}>
                                                                        <td>{++index}</td>
                                                                        <td>{item.fecha}</td>
                                                                        <td>{item.proveedor}</td>
                                                                        <td className="text-left">{item.cuenta}</td>
                                                                        <td className="text-left text-danger">{item.salida <= 0 ? '' : `- ${formatMoney(item.salida)}`}</td>
                                                                        <td className="text-right text-success">{item.ingreso <= 0 ? '' : `+ ${formatMoney(item.ingreso)}`}</td>
                                                                    </tr>
                                                                ))
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
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

                }
            </>
        )
    }
}

export default BancoDetalle