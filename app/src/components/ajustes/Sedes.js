import React from 'react';
import axios from 'axios';
import loading from '../../recursos/images/loading.gif'
import { showModal, hideModal } from '../tools/Tools'

class Sedes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idSede: '',
            txtNombreEmpresa: '',
            txtNombreSede: '',
            txtTelefono: '',
            txtCelular: '',
            txtEmail: '',
            txtWeb: '',
            txtDireccion: '',
            txtPais: '',
            txtRegion: '',
            txtProvincia: '',
            txtDistrito: '',
            loading: true,
            lista: [],
            paginacion: 0,
            totalPaginacion: 0,
            filasPorPagina: 10,
            messagePaginacion: ''

        }

        this.refTxtNombreEmpresa = React.createRef();
        this.refTxtNombreSede = React.createRef();
        this.refTxtTelefono = React.createRef();
        this.refTxtCelular = React.createRef();
        this.refTxtEmail = React.createRef();
        this.refTxtDireccion = React.createRef();
        this.refTxtPais = React.createRef();
        this.refTxtRegion = React.createRef();
        this.refTxtProvincia = React.createRef();
        this.refTxtDistrito = React.createRef();

        // this.refTxtMoneda = React.createRef();
        // this.refTxtNumCuenta = React.createRef();
        // this.refTxtCci = React.createRef();
        // this.refTxtRepresentante = React.createRef();
    }

    openModal(id) {
        if (id === '') {
            showModal('modalSede')
            this.refTxtNombre.current.focus();
            // console.log('nuevo')
        }
        else {
            this.setState({ idSede: id });
            showModal('modalSede')
            this.loadDataId(id)
            // console.log('editar')
        }
    }

    render(){
        return (
            <>

                {/* Inicio modal */}
                <div className="modal fade" id="modalSede" data-backdrop="static">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title"><i className="bi bi-currency-exchange"></i>{this.state.idSede === '' ? " Registrar Sede" : " Editar Sede"}</h5>
                                <button type="button" className="close" data-dismiss="modal" onClick={() => this.closeModal()}>
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Nombre Banco:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtNombre}
                                            value={this.state.txtNombre}
                                            onChange={(event) => this.setState({ txtNombre: event.target.value })}
                                            placeholder="BCP, BBVA, etc" />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Tipo de Cuenta:</label>
                                        <div className="input-group">
                                            <select
                                                className="form-control"
                                                ref={this.refCbxTipoCuenta}
                                                value={this.state.CbxTipoCuenta}
                                                onChange={(event) => this.setState({ CbxTipoCuenta: event.target.value })} >
                                                <option value="CUENTA CORRIENTE">Cuenta Corriente</option>
                                                <option value="CUENTA RECAUDADORA">Cuenta Recaudadora</option>
                                                <option value="CUENTA DE AHORROS">Cuenta de Ahorros</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Moneda:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtMoneda}
                                            value={this.state.txtMoneda}
                                            onChange={(event) => this.setState({ txtMoneda: event.target.value })}
                                            placeholder="Soles, Dolares, etc" />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Número de cuenta:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtNumCuenta}
                                            value={this.state.txtNumCuenta}
                                            onChange={(event) => this.setState({ txtNumCuenta: event.target.value })}
                                            placeholder="##############" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>CCI:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtCci}
                                            value={this.state.txtCci}
                                            onChange={(event) => this.setState({ txtCci: event.target.value })}
                                            placeholder="####################" />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Representante:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtRepresentante}
                                            value={this.state.txtRepresentante}
                                            onChange={(event) => this.setState({ txtRepresentante: event.target.value })}
                                            placeholder="Datos del representante" />
                                    </div>
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={() => this.save()}>Guardar</button>
                                <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={() => this.closeModal()}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* fin modal */}

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Sedes <small className="text-secondary">LISTA</small></h5>
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
                                <input type="search" className="form-control" placeholder="Buscar..." onKeyUp={(event) => console.log(event.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group">
                            {/* <button className="btn btn-outline-info" onClick={() => this.openModal(this.state.idSede)}>
                                <i className="bi bi-file-plus"></i> Nuevo Registro
                            </button>
                            {" "} */}
                            <button className="btn btn-outline-secondary" onClick={() => this.fillTable(0, 1, "")}>
                                <i className="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped" style={{ borderWidth: '1px', borderStyle: 'inset', borderColor: '#CFA7C9' }}>
                                <thead>
                                    <tr>
                                        <th width="5%">#</th>
                                        <th width="10%">Banco</th>
                                        <th width="15%">Tipo Cuenta</th>
                                        <th width="10%">Moneda</th>
                                        <th width="20%">Número Cuenta</th>
                                        <th width="15%">Representante</th>
                                        <th width="15%">Opciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        // this.state.loading ? (
                                        //     <tr>
                                        //         <td className="text-center" colSpan="7">
                                        //             <img
                                        //                 src={loading}
                                        //                 id="imgLoad"
                                        //                 width="34"
                                        //                 height="34"
                                        //             />
                                        //             <p>Cargando información...</p>
                                        //         </td>
                                        //     </tr>
                                        // ) : this.state.lista.length === 0 ? (
                                        //     <tr className="text-center">
                                        //         <td colSpan="7">¡No hay datos registrados!</td>
                                        //     </tr>
                                        // ) : (
                                        //     this.state.lista.map((item, index) => {
                                        //         return (
                                        //             <tr key={index}>
                                        //                 <td>{item.id}</td>
                                        //                 <td>{item.nombre}</td>
                                        //                 <td>{item.tipocuenta}</td>
                                        //                 <td>{item.moneda}</td>
                                        //                 <td>{item.numcuenta}</td>
                                        //                 <td>{item.representante}</td>
                                        //                 <td>
                                        //                     <button className="btn btn-outline-dark btn-sm" title="Editar" onClick={ () => this.openModal(item.idbanco) }><i className="bi bi-pencil"></i></button>
                                        //                 </td>
                                        //             </tr>
                                        //         )
                                        //     })
                                        // )
                                    }
                                </tbody>

                            </table>
                        </div>
                        <div className="col-md-12 text-center">
                            <nav aria-label="...">
                                <ul className="pagination justify-content-end">
                                    <li className="page-item disabled">
                                        <button className="page-link">Previous</button>
                                    </li>
                                    <li className="page-item"><button className="page-link">1</button></li>
                                    <li className="page-item active" aria-current="page">
                                        <button className="page-link" href="#">2</button>
                                    </li>
                                    <li className="page-item"><button className="page-link" >3</button></li>
                                    <li className="page-item">
                                        <button className="page-link">Next</button>
                                    </li>
                                </ul>
                            </nav>
                        </div>

                    </div>
                </div>
            </>
        )
    }

}

export default Sedes