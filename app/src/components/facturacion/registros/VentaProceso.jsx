import React from 'react';
import axios from 'axios';
import {
    formatMoney,
    numberFormat,
    calculateTaxBruto,
    calculateTax,
    keyNumberInteger,
    keyNumberFloat,
    getCurrentMonth,
    getCurrentYear,
    monthName,
    isNumeric,
    showModal,
    hideModal,
    viewModal,
    clearModal,
    spinnerLoading,
    ModalAlertDialog,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
} from '../../../helper/Tools';
import { connect } from 'react-redux';
import { apiComprobanteListcombo } from '../../../network/api';
import SearchBarClient from "../../../helper/SearchBarClient";
import SearchBarLote from "../../../helper/SearchBarLote";

class VentaProceso extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            idCliente: '',
            idComprobante: '',
            idUsuario: this.props.token.userToken.idUsuario,
            numCuota: '',
            estado: 1,
            idMoneda: '',
            monedas: [],
            metodosPago: [],

            lotes: [],
            lote: '',
            idLote: '',
            filterLote: false,
            manzana: '',
            precioContado: '',

            detalleVenta: [],
            comprobantes: [],
            clientes: [],
            cliente: '',
            filterCliente: false,

            idImpuesto: '',
            impuestos: [],

            idMedida: '',
            medidas: [],

            expandedOpciones: true,
            idProyecto: this.props.token.project.idProyecto,

            loading: true,
            messageWarning: '',
            msgLoading: 'Cargando datos...',

            importeTotal: 0,
            selectTipoPago: 1,

            bancos: [],
            comprobantesCobro: [],

            idComprobanteContado: '',
            idBancoContado: '',
            codigoMetodoPagoContado: '',
            montoInicialCheck: false,
            inicial: '',
            idComprobanteCredito: '',
            idBancoCredito: '',
            monthPago: getCurrentMonth(),
            yearPago: getCurrentYear(),
            codigoMetodoPagoCredito: '',
            letraMensual: '',
            frecuenciaPagoCredito: new Date().getDate() > 15 ? '30' : '15',

            inicialCreditoVariableCheck: false,
            inicialCreditoVariable: '',
            idComprobanteCreditoVariable: '',

            idBancoCreditoVariable: '',
            codigoMetodoPagoCreditoVariable: '',
            frecuenciaPago: new Date().getDate() > 15 ? '30' : '15',

            mmonth: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            year: [2015, 2016, 2017, 2018, 2019, 2020, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030],

        }

        this.refLote = React.createRef();
        this.refPrecioContado = React.createRef();
        this.refComprobante = React.createRef();
        this.refImpuesto = React.createRef();
        this.refMedida = React.createRef();
        this.refCliente = React.createRef();
        this.refMoneda = React.createRef();
        this.refCollpse = React.createRef();
        this.refCollpseContent = React.createRef();

        this.refComprobanteContado = React.createRef();
        this.refBancoContado = React.createRef();
        this.refMetodoContado = React.createRef();

        this.refMontoInicial = React.createRef();
        this.refComprobanteCredito = React.createRef();
        this.refBancoCredito = React.createRef();
        this.refMetodoCredito = React.createRef();
        this.refFechaPagoCredito = React.createRef();
        this.refNumCutoas = React.createRef();
        this.refFrecuenciaPagoCredito = React.createRef();

        this.refInicialCreditoVariable = React.createRef();
        this.refComprobanteCreditoVariable = React.createRef();
        this.refBancoCreditoVariable = React.createRef();
        this.refMetodoCreditoVariable = React.createRef();
        this.refFrecuenciaPago = React.createRef();

        this.abortControllerView = new AbortController();

        this.selectItemClient = false;
        this.selectItemLote = false;
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        this.loadData();

        viewModal("modalVentaProceso", () => {
            this.refBancoContado.current.focus();
        });

        clearModal("modalVentaProceso", async () => {
            await this.setStateAsync({
                selectTipoPago: 1,
                idBancoContado: '',
                codigoMetodoPagoContado: '',
                montoInicialCheck: false,
                inicial: '',
                idBancoCredito: '',
                codigoMetodoPagoCredito: '',
                letraMensual: '',
                frecuenciaPagoCredito: new Date().getDate() > 15 ? '30' : '15',
                numCuota: '',

                inicialCreditoVariableCheck: false,
                inicialCreditoVariable: '',
                // idComprobanteCreditoVariable: '',
                idBancoCreditoVariable: '',
                codigoMetodoPagoCreditoVariable: '',
                frecuenciaPago: new Date().getDate() > 15 ? '30' : '15',
            });
        })
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
    }


    loadData = async () => {
        try {

            const comprobanteLibre = await apiComprobanteListcombo(this.abortControllerView.signal, {
                "tipo": "2"
            });

            const facturadoCobro = await apiComprobanteListcombo(this.abortControllerView.signal, {
                "tipo": "1"
            });

            const comprobanteCobro = await apiComprobanteListcombo(this.abortControllerView.signal, {
                "tipo": "5"
            });

            let medida = await axios.get(import.meta.env.VITE_APP_END_POINT+'/api/medida/listcombo', {
                signal: this.abortControllerView.signal,
            });

            const moneda = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/moneda/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const metodoPago = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/metodopago/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const impuesto = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/impuesto/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const banco = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/banco/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const comprobanteFilter = comprobanteLibre.data.filter(item => item.preferida === 1);

            const comprobanteCobroFilter = [...facturadoCobro.data, ...comprobanteCobro.data].filter(item => item.preferida === 1);

            const monedaFilter = moneda.data.filter(item => item.predeterminado === 1);

            const impuestoFilter = impuesto.data.filter(item => item.preferida === 1);

            const medidaFilter = medida.data.filter(item => item.preferida === 1);

            await this.setStateAsync({
                comprobantes: comprobanteLibre.data,
                comprobantesCobro: [...facturadoCobro.data, ...comprobanteCobro.data],
                monedas: moneda.data,
                metodosPago: metodoPago.data,

                medidas: medida.data,
                impuestos: impuesto.data,

                idMoneda: monedaFilter.length > 0 ? monedaFilter[0].idMoneda : '',
                idMedida: medidaFilter.length > 0 ? medidaFilter[0].idMedida : '',
                idImpuesto: impuestoFilter.length > 0 ? impuestoFilter[0].idImpuesto : '',
                idComprobante: comprobanteFilter.length > 0 ? comprobanteFilter[0].idComprobante : '',
                idComprobanteContado: comprobanteCobroFilter.length > 0 ? comprobanteCobroFilter[0].idComprobante : '',
                idComprobanteCredito: comprobanteCobroFilter.length > 0 ? comprobanteCobroFilter[0].idComprobante : '',
                idComprobanteCreditoVariable: comprobanteCobroFilter.length > 0 ? comprobanteCobroFilter[0].idComprobante : '',

                bancos: banco.data,
                loading: false,
            });

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error interno, intente nuevamente."
                });
            }
        }
    }

    async addObjectTable() {
        if (this.state.idLote === '') {
            await this.setStateAsync({ messageWarning: "Seleccione un lote" })
            this.refLote.current.focus();
            return;
        }

        if (!isNumeric(this.state.precioContado)) {
            await this.setStateAsync({ messageWarning: "Ingrese el precio de venta total" })
            this.refPrecioContado.current.focus();
            return;
        }

        if (this.state.precioContado <= 0) {
            await this.setStateAsync({ messageWarning: "Ingrese un precio mayor a 0" })
            this.refPrecioContado.current.focus();
            return;
        }

        if (this.state.idImpuesto === "") {
            await this.setStateAsync({ messageWarning: "Seleccione un impuesto." });

            if (!this.refCollpseContent.current.classList.contains("show")) {
                this.refCollpse.current.classList.remove("collapsed");
                this.refCollpseContent.current.classList.add("show");
                this.refCollpse.current.attributes["aria-expanded"].value = true;
                await this.setStateAsync({
                    expandedOpciones: !(this.refCollpse.current.attributes["aria-expanded"].value.toLowerCase() === 'true')
                });
            }

            this.refImpuesto.current.focus();
            return;
        }

        if (this.state.idMedida === "") {
            await this.setStateAsync({ messageWarning: "Seleccione una unidad." })

            if (!this.refCollpseContent.current.classList.contains("show")) {
                this.refCollpse.current.classList.remove("collapsed");
                this.refCollpseContent.current.classList.add("show");
                this.refCollpse.current.attributes["aria-expanded"].value = true;
                await this.setStateAsync({
                    expandedOpciones: !(this.refCollpse.current.attributes["aria-expanded"].value.toLowerCase() === 'true')
                });
            }

            this.refMedida.current.focus();
            return;
        }

        let nombreLote = this.state.lote;
        let nombreManzana = this.state.manzana;

        if (!this.validarDuplicado(this.state.idLote)) {
            let detalle = {
                "idDetalle": this.state.idLote,
                "nombreLote": nombreLote,
                "nombreManzana": nombreManzana,
                "cantidad": 1,
                "idImpuesto": this.state.idImpuesto,
                "impuesto": this.refImpuesto.current.children[this.refImpuesto.current.selectedIndex].innerText,
                "idMedida": this.state.idMedida,
                "medida": this.refMedida.current.children[this.refMedida.current.selectedIndex].innerText,
                "precioContado": this.state.precioContado
            }

            this.state.detalleVenta.push(detalle)
        } else {
            for (let item of this.state.detalleVenta) {
                if (item.idDetalle === this.state.idLote) {
                    let currenteObject = item;
                    currenteObject.cantidad = parseFloat(currenteObject.cantidad) + 1;
                    break;
                }
            }
        }

        let newArr = [...this.state.detalleVenta];

        const impuestoFilter = this.state.impuestos.filter(item => item.preferida === 1);

        const medidaFilter = this.state.medidas.filter(item => item.preferida === 1);

        await this.setStateAsync({
            detalleVenta: newArr,
            messageWarning: '',
            precioContado: '',
            lote: '',
            idLote: '',
            manzana: '',
            idMedida: medidaFilter.length > 0 ? medidaFilter[0].idMedida : '',
            idImpuesto: impuestoFilter.length > 0 ? impuestoFilter[0].idImpuesto : '',
        });

        const { total } = this.calcularTotales();

        await this.setStateAsync({
            importeTotal: total
        });
    }

    validarDuplicado(id) {
        let value = false
        for (let item of this.state.detalleVenta) {
            if (item.idDetalle === id) {
                value = true
                break;
            }
        }
        return value
    }

    async removeObjectTable(id) {
        let newArr = [...this.state.detalleVenta];

        for (let i = 0; i < newArr.length; i++) {
            if (id === newArr[i].idDetalle) {
                newArr.splice(i, 1)
                i--;
                break;
            }
        }

        await this.setStateAsync({
            detalleVenta: newArr,
        })

        const { total } = this.calcularTotales();

        await this.setStateAsync({
            importeTotal: total
        })
    }

    async changeLote(event) {
        let precio = 0
        for (let i of this.state.lotes) {
            if (event.target.value === i.idLote) {
                precio = i.precio
                break
            }
        }
        await this.setStateAsync({
            precioContado: precio.toString()
        });

        this.refPrecioContado.current.focus();
    }

    async calcularLetraMensual() {
        if (this.state.numCuota === '') {
            return;
        }

        let saldo = this.state.importeTotal - (this.state.montoInicialCheck ? this.state.inicial : 0)
        let letra = saldo / this.state.numCuota

        await this.setStateAsync({ letraMensual: letra.toFixed(2) })
    }

    async onEventLimpiar() {
        await this.setStateAsync({
            idCliente: '',
            idComprobante: '',
            numCuota: '',
            estado: 1,
            idMoneda: '',
            monedas: [],
            metodosPago: [],

            lotes: [],
            lote: '',
            idLote: '',
            filterLote: false,
            manzana: '',
            precioContado: '',

            detalleVenta: [],
            comprobantes: [],
            clientes: [],
            cliente: '',
            filterCliente: false,

            idImpuesto: '',
            impuestos: [],

            idMedida: '',
            medidas: [],

            expandedOpciones: true,

            loading: true,
            messageWarning: '',

            importeTotal: 0,
            selectTipoPago: 1,

            bancos: [],
            comprobantesCobro: [],

            idComprobanteContado: '',
            idBancoContado: '',
            codigoMetodoPagoContado: '',
            montoInicialCheck: false,
            inicial: '',
            idComprobanteCredito: '',
            idBancoCredito: '',
            monthPago: getCurrentMonth(),
            yearPago: getCurrentYear(),
            codigoMetodoPagoCredito: '',
            letraMensual: '',
            frecuenciaPagoCredito: new Date().getDate() > 15 ? '30' : '15',

            inicialCreditoVariableCheck: false,
            inicialCreditoVariable: '',
            idComprobanteCreditoVariable: '',

            idBancoCreditoVariable: '',
            codigoMetodoPagoCreditoVariable: '',
            frecuenciaPago: new Date().getDate() > 15 ? '30' : '15',
        });

        this.loadData();
    }

    calcularTotales() {
        let subTotal = 0;
        let impuestoTotal = 0;
        let total = 0;

        for (let item of this.state.detalleVenta) {
            let cantidad = item.cantidad;
            let valor = parseFloat(item.precioContado);
            let filter = this.state.impuestos.filter(imp =>
                imp.idImpuesto === item.idImpuesto
            )
            let impuesto = filter.length > 0 ? filter[0].porcentaje : 0;

            let valorActual = cantidad * valor;
            let valorSubNeto = calculateTaxBruto(impuesto, valorActual);
            let valorImpuesto = calculateTax(impuesto, valorSubNeto);
            let valorNeto = valorSubNeto + valorImpuesto;

            subTotal += valorSubNeto;
            impuestoTotal += valorImpuesto;
            total += valorNeto;
        }
        return { subTotal, impuestoTotal, total }
    }

    renderTotal() {
        const { subTotal, impuestoTotal, total } = this.calcularTotales();
        let moneda = this.state.monedas.filter(item => item.idMoneda === this.state.idMoneda);
        let codigo = moneda.length > 0 ? moneda[0].codiso : "PEN";
        return (
            <>
                <tr>
                    <td className="text-left">Sub Total:</td>
                    <td className="text-right">{numberFormat(subTotal, codigo)}</td>
                </tr>
                <tr>
                    <td className="text-left">Impuesto:</td>
                    <td className="text-right">{numberFormat(impuestoTotal, codigo)}</td>
                </tr>
                <tr className="border-bottom">
                </tr>
                <tr>
                    <td className="text-left h4">Total:</td>
                    <td className="text-right h4">{numberFormat(total, codigo)}</td>
                </tr>
            </>
        )
    }

    async onEventOpenModal() {
        if (this.state.detalleVenta.length <= 0) {
            await this.setStateAsync({ messageWarning: "Agregar datos a la tabla." })
            this.refLote.current.focus()
            return;
        }

        if (this.state.idComprobante === '') {
            await this.setStateAsync({ messageWarning: "Seleccione el comprobante." })
            this.refComprobante.current.focus();
            return;
        }

        if (this.state.idCliente === "") {
            await this.setStateAsync({ messageWarning: "Seleccione el cliente." });
            this.refCliente.current.focus();
            return;
        }
        if (this.state.idMoneda === "") {
            await this.setStateAsync({ messageWarning: "Seleccione la moneda." });
            this.refMoneda.current.focus();
            return;
        }

        let validate = this.state.detalleVenta.reduce((acumulador, item) =>
            item.idImpuesto === "" ? acumulador + 1 : acumulador + 0
            , 0);

        if (validate > 0) {
            await this.setStateAsync({ messageWarning: "Hay detalles en la tabla sin impuesto seleccionado." });
            let count = 0;
            for (let item of this.state.detalleVenta) {
                count++;
                if (item.idImpuesto === "") {
                    document.getElementById(count + "imv").focus()
                }
            }
            return;
        } else {
            await this.setStateAsync({ messageWarning: "" });
        }

        showModal("modalVentaProceso")

    }

    onEventGuardar() {

        if (this.state.selectTipoPago === 1) {
            // Al contado
            if (this.state.idComprobanteContado === "") {
                this.refComprobanteContado.current.focus();
            } else if (this.state.idBancoContado === "") {
                this.refBancoContado.current.focus();
            } else if (this.state.codigoMetodoPagoContado === "") {
                this.refMetodoContado.current.focus();
            } else {
                this.onSave(this.state.selectTipoPago)
            }

        } else if (this.state.selectTipoPago === 2) {
            // Al credito fijo
            if (this.state.montoInicialCheck && !isNumeric(this.state.inicial)) {
                this.refMontoInicial.current.focus();
            } else if (parseFloat(this.state.inicial) <= 0) {
                this.refMontoInicial.current.focus();
            } else if (this.state.montoInicialCheck && this.state.idComprobanteCredito === "") {
                this.refComprobanteCredito.current.focus();
            } else if (this.state.montoInicialCheck && this.state.idBancoCredito === "") {
                this.refBancoCredito.current.focus();
            } else if (this.state.montoInicialCheck && this.state.codigoMetodoPagoCredito === "") {
                this.refMetodoCredito.current.focus();
            } else if (!isNumeric(this.state.numCuota)) {
                this.refNumCutoas.current.focus();
            } else if (parseInt(this.state.numCuota) <= 0) {
                this.refNumCutoas.current.focus();
                // monthPago: getCurrentMonth(),
                // yearPago: getCurrentYear(),
            }
            else if (this.state.frecuenciaPagoCredito === "") {
                this.refFrecuenciaPagoCredito.current.focus();
            } else {
                this.onSave(this.state.selectTipoPago)
            }

        } else {
            // Al credito variable
            if (this.state.inicialCreditoVariableCheck && !isNumeric(this.state.inicialCreditoVariable)) {
                this.refInicialCreditoVariable.current.focus();
            } else if (parseFloat(this.state.inicialCreditoVariable) <= 0) {
                this.refInicialCreditoVariable.current.focus();
            } else if (this.state.inicialCreditoVariableCheck && this.state.idComprobanteCreditoVariable === "") {
                this.refComprobanteCreditoVariable.current.focus();
            } else if (this.state.inicialCreditoVariableCheck && this.state.idBancoCreditoVariable === "") {
                this.refBancoCreditoVariable.current.focus();
            } else if (this.state.inicialCreditoVariableCheck && this.state.codigoMetodoPagoCreditoVariable === "") {
                this.refMetodoCreditoVariable.current.focus();
            } else if (this.state.frecuenciaPago === '') {
                this.refFrecuenciaPago.current.focus();
            } else {
                this.onSave(this.state.selectTipoPago)
            }
        }
    }

    async onSave(selectTipoPago) {
        ModalAlertDialog("Venta", "¿Estás seguro de continuar?", async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Venta", "Procesando información...");
                    hideModal("modalVentaProceso")

                    let result = await axios.post(import.meta.env.VITE_APP_END_POINT+'/api/factura/add', {
                        "idCliente": this.state.idCliente,
                        "idUsuario": this.state.idUsuario,
                        "idComprobante": this.state.idComprobante,
                        "idMoneda": this.state.idMoneda,
                        "idMedida": this.state.idMedida,
                        "idImpuesto": this.state.idImpuesto,
                        // "tipo": this.state.selectTipoPago ? 1 : 2,
                        "tipo": selectTipoPago === 1 ? 1 : 2,
                        // "selectTipoPago": this.state.selectTipoPago,
                        "selectTipoPago": selectTipoPago === 1 ? 1
                            : selectTipoPago === 2 ? 2
                                : 3,

                        // "montoInicialCheck": this.state.montoInicialCheck,
                        "montoInicialCheck": selectTipoPago === 1 ? false
                            : selectTipoPago === 2 && this.state.montoInicialCheck ? this.state.montoInicialCheck
                                : selectTipoPago === 2 && !this.state.montoInicialCheck ? false
                                    : selectTipoPago === 3 && this.state.inicialCreditoVariableCheck ? this.state.inicialCreditoVariableCheck
                                        : selectTipoPago === 3 && !this.state.inicialCreditoVariableCheck ? false : false,

                        // "idComprobanteCobro": this.state.selectTipoPago ? this.state.idComprobanteContado : this.state.idComprobanteCredito,
                        "idComprobanteCobro": selectTipoPago === 1 ? this.state.idComprobanteContado
                            : selectTipoPago === 2 ? this.state.idComprobanteCredito : this.state.idComprobanteCreditoVariable,
                        // "idBanco": this.state.selectTipoPago ? this.state.idBancoContado : this.state.montoInicialCheck ? this.state.idBancoCredito : "",
                        "idBanco": selectTipoPago === 1 ? this.state.idBancoContado
                            : selectTipoPago === 2 && this.state.montoInicialCheck ? this.state.idBancoCredito
                                : selectTipoPago === 2 && !this.state.montoInicialCheck ? ""
                                    : selectTipoPago === 3 && this.state.inicialCreditoVariableCheck ? this.state.idBancoCreditoVariable
                                        : selectTipoPago === 3 && !this.state.inicialCreditoVariableCheck ? "" : "",

                        // "metodoPago": this.state.selectTipoPago ? this.state.metodoPagoContado : this.state.montoInicialCheck ? this.state.metodoPagoCredito : "",
                        "metodoPago": selectTipoPago === 1 ? this.state.codigoMetodoPagoContado
                            : selectTipoPago === 2 && this.state.montoInicialCheck ? this.state.codigoMetodoPagoCredito
                                : selectTipoPago === 2 && !this.state.montoInicialCheck ? ""
                                    : selectTipoPago === 3 && this.state.inicialCreditoVariableCheck ? this.state.codigoMetodoPagoCreditoVariable
                                        : selectTipoPago === 3 && !this.state.inicialCreditoVariableCheck ? "" : "",

                        // "inicial": this.state.selectTipoPago ? 0 : this.state.montoInicialCheck ? parseFloat(this.state.inicial) : 0,
                        "inicial": selectTipoPago === 1 ? 0
                            : selectTipoPago === 2 && this.state.montoInicialCheck ? parseFloat(this.state.inicial)
                                : selectTipoPago === 2 && !this.state.montoInicialCheck ? 0
                                    : selectTipoPago === 3 && this.state.inicialCreditoVariableCheck ? parseFloat(this.state.inicialCreditoVariable)
                                        : selectTipoPago === 3 && !this.state.inicialCreditoVariableCheck ? 0 : 0,

                        "fechaPago": selectTipoPago === 2 ? [this.state.yearPago, this.state.monthPago] : '',

                        // "numCuota": this.state.selectTipoPago ? 0 : parseInt(this.state.numCuota),
                        "numCuota": selectTipoPago === 1 ? 0
                            : selectTipoPago === 2 ? parseInt(this.state.numCuota)
                                : selectTipoPago === 3 ? 0 : 0,

                        // "estado": this.state.selectTipoPago ? 1 : 2,
                        "estado": selectTipoPago === 1 ? 1 : 2,
                        "frecuenciaPago": selectTipoPago === 1 ? 0
                            : selectTipoPago === 2 ? this.state.frecuenciaPagoCredito
                                : selectTipoPago === 3 ? this.state.frecuenciaPago : 0,
                        "idProyecto": this.state.idProyecto,
                        "detalleVenta": this.state.detalleVenta,
                    });

                    ModalAlertSuccess("Venta", result.data, () => {
                        this.onEventLimpiar()
                    });
                }
                catch (error) {
                    if (error.response) {
                        ModalAlertWarning("Venta", error.response.data)
                    } else {
                        ModalAlertWarning("Venta", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        });
    }

    handleSelect = async (event, idDetalle) => {
        let updatedList = [...this.state.detalleVenta];
        for (let item of updatedList) {
            if (item.idDetalle === idDetalle) {
                item.idImpuesto = event.target.value;
                break;
            }
        }

        await this.setStateAsync({ detalleVenta: updatedList })
    }

    /** */
    onEventClearInputLote = async () => {
        await this.setStateAsync({ lotes: [], idLote: '', lote: "", manzana: "" });
        this.selectItemLote = false;
    }

    handleFilterLote = async (event) => {

        const searchWord = this.selectItemLote ? "" : event.target.value;
        await this.setStateAsync({ idLote: '', lote: searchWord });
        this.selectItemLote = false;
        if (searchWord.length === 0) {
            await this.setStateAsync({ lotes: [] });
            return;
        }

        if (this.state.filterLote) return;

        try {
            await this.setStateAsync({ filterLote: true });
            let result = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/lote/listfilter", {
                params: {
                    idProyecto: this.state.idProyecto,
                    filtrar: searchWord,
                },
            });
            await this.setStateAsync({ filterLote: false, lotes: result.data });
        } catch (error) {
            await this.setStateAsync({ filterLote: false, lotes: [] });
        }
    }

    onEventSelectItemLote = async (value) => {
        await this.setStateAsync({
            lote: value.nombreLote,
            lotes: [],
            idLote: value.idLote,
            manzana: value.nombreManzana,
            precioContado: value.precio.toString()
        });
        this.selectItemLote = true;
        this.refPrecioContado.current.focus();
    }
    /** */

    onEventClearInputClient = async () => {
        await this.setStateAsync({ clientes: [], idCliente: '', cliente: "" });
        this.selectItemClient = false;
    }

    handleFilterClient = async (event) => {
        const searchWord = this.selectItemClient ? "" : event.target.value;
        await this.setStateAsync({ idCliente: '', cliente: searchWord });
        this.selectItemClient = false;
        if (searchWord.length === 0) {
            await this.setStateAsync({ clientes: [] });
            return;
        }

        if (this.state.filterCliente) return;

        try {
            await this.setStateAsync({ filterCliente: true });
            let result = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/cliente/listfiltrar", {
                params: {
                    filtrar: searchWord,
                },
            });
            await this.setStateAsync({ filterCliente: false, clientes: result.data });
        } catch (error) {
            await this.setStateAsync({ filterCliente: false, clientes: [] });
        }
    }

    onEventSelectItemClient = async (value) => {
        await this.setStateAsync({
            cliente: value.documento + " - " + value.informacion,
            clientes: [],
            idCliente: value.idCliente
        });
        this.selectItemClient = true;
    }

    render() {
        return (
            <>
                {/* Inicio modal */}
                <div className="modal fade" id="modalVentaProceso" data-bs-keyboard="false" data-bs-backdrop="static">
                    <div className="modal-dialog modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">Completar Venta</h6>
                                <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">

                                <div className="row">
                                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                        <div className="text-center">
                                            <h5>TOTAL A PAGAR: <span>{formatMoney(this.state.importeTotal)}</span></h5>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-4 col-sm-4">
                                        <hr />
                                    </div>
                                    <div className="col-md-4 col-sm-4 d-flex align-items-center justify-content-center">
                                        <h6 className="mb-0">Tipos de pagos</h6>
                                    </div>
                                    <div className="col-md-4 col-sm-4">
                                        <hr />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-4 col-sm-4">
                                        <button className={`btn ${this.state.selectTipoPago === 1 ? "btn-primary" : "btn-light"} btn-block`}
                                            type="button"
                                            title="Pago al contado"
                                            onClick={() => this.setState({ selectTipoPago: 1 })}>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <i className="bi bi-cash-coin fa-2x"></i>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <label>Contado</label>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="col-md-4 col-sm-4">
                                        <button className={`btn ${this.state.selectTipoPago === 2 ? "btn-primary" : "btn-light"} btn-block`}
                                            type="button"
                                            title="Pago al credito"
                                            onClick={() => this.setState({ selectTipoPago: 2 })}>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <i className="bi bi-boxes fa-2x"></i>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <label>Crédito fijo</label>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="col-md-4 col-sm-4">
                                        <button className={`btn ${this.state.selectTipoPago === 3 ? "btn-primary" : "btn-light"} btn-block`}
                                            type="button"
                                            title="Pago al credito"
                                            onClick={() => this.setState({ selectTipoPago: 3 })}>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <i className="bi bi-columns-gap fa-2x"></i>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <label>Crédito variable</label>
                                            </div>
                                        </button>
                                    </div>

                                </div>

                                <br />
                                {/* contado detalle */}
                                {
                                    this.state.selectTipoPago === 1 ?
                                        <div className="row">
                                            <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                                <div className="form-row">
                                                    <div className="form-group col-md-12">
                                                        <div className="input-group">
                                                            <div className="input-group-prepend">
                                                                <div className="input-group-text"><i className="bi bi-receipt"></i></div>
                                                            </div>
                                                            <select
                                                                title="Lista de caja o banco a depositar"
                                                                className="form-control"
                                                                ref={this.refComprobanteContado}
                                                                value={this.state.idComprobanteContado}
                                                                onChange={(event) => this.setState({ idComprobanteContado: event.target.value })}>
                                                                <option value="">-- Comprobante --</option>
                                                                {
                                                                    this.state.comprobantesCobro.map((item, index) => (
                                                                        <option key={index} value={item.idComprobante}>{item.nombre + " (" + item.serie + ")"}</option>
                                                                    ))
                                                                }
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group col-md-12">
                                                        <div className="input-group">
                                                            <div className="input-group-prepend">
                                                                <div className="input-group-text"><i className="bi bi-bank"></i></div>
                                                            </div>
                                                            <select
                                                                title="Lista de caja o banco a depositar"
                                                                className="form-control"
                                                                ref={this.refBancoContado}
                                                                value={this.state.idBancoContado}
                                                                onChange={(event) => this.setState({ idBancoContado: event.target.value })}>
                                                                <option value="">-- Cuenta bancaria --</option>
                                                                {
                                                                    this.state.bancos.map((item, index) => (
                                                                        <option key={index} value={item.idBanco}>{item.nombre}</option>
                                                                    ))
                                                                }
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group col-md-12">
                                                        <div className="input-group">
                                                            <div className="input-group-prepend">
                                                                <div className="input-group-text"><i className="bi bi-credit-card-2-back"></i></div>
                                                            </div>
                                                            <select
                                                                title="Lista metodo de pago"
                                                                className="form-control"
                                                                ref={this.refMetodoContado}
                                                                value={this.state.codigoMetodoPagoContado}
                                                                onChange={(event) => this.setState({ codigoMetodoPagoContado: event.target.value })}>
                                                                <option value="">-- Metodo de pago --</option>
                                                                {
                                                                    this.state.metodosPago.map((item, index) => (
                                                                        <option key={index} value={item.codigo}>{item.nombre}</option>
                                                                    ))
                                                                }
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        : null
                                }

                                {/* crédito fijo */}
                                {
                                    this.state.selectTipoPago === 2 ?
                                        <div className={`row`}>
                                            <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">

                                                <div className="form-group">
                                                    <div className="input-group">
                                                        <div className="input-group-prepend">
                                                            <div className="input-group-text"><i className="bi bi-tag-fill"></i></div>
                                                        </div>
                                                        <input
                                                            title="Monto inicial"
                                                            type="text"
                                                            className="form-control"
                                                            ref={this.refMontoInicial}
                                                            disabled={!this.state.montoInicialCheck}
                                                            placeholder='Monto inicial'
                                                            value={this.state.inicial}
                                                            onChange={async (event) => {
                                                                await this.setStateAsync({ inicial: event.target.value })
                                                                this.calcularLetraMensual()
                                                            }}
                                                            onKeyPress={keyNumberFloat} />
                                                        <div className="input-group-append">
                                                            <div className="input-group-text">
                                                                <div className="form-check form-check-inline m-0">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        checked={this.state.montoInicialCheck}
                                                                        onChange={async (event) => {
                                                                            await this.setStateAsync({ montoInicialCheck: event.target.checked })
                                                                            this.refMontoInicial.current.focus();
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {
                                                    this.state.montoInicialCheck ?
                                                        <div className="form-row">
                                                            <div className="form-group col-md-12">
                                                                <div className="input-group">
                                                                    <div className="input-group-prepend">
                                                                        <div className="input-group-text"><i className="bi bi-receipt"></i></div>
                                                                    </div>
                                                                    <select
                                                                        title="Lista de caja o banco a depositar"
                                                                        className="form-control"
                                                                        ref={this.refComprobanteCredito}
                                                                        value={this.state.idComprobanteCredito}
                                                                        onChange={(event) => this.setState({ idComprobanteCredito: event.target.value })}>
                                                                        <option value="">-- Comprobante --</option>
                                                                        {
                                                                            this.state.comprobantesCobro.map((item, index) => (
                                                                                <option key={index} value={item.idComprobante}>{item.nombre}</option>
                                                                            ))
                                                                        }
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        : null
                                                }

                                                {
                                                    this.state.montoInicialCheck ?
                                                        <div className="form-group">
                                                            <div className="input-group">
                                                                <div className="input-group-prepend">
                                                                    <div className="input-group-text"><i className="bi bi-bank"></i></div>
                                                                </div>
                                                                <select
                                                                    title="Lista de caja o banco a depositar"
                                                                    className="form-control"
                                                                    ref={this.refBancoCredito}
                                                                    value={this.state.idBancoCredito}
                                                                    onChange={(event) => this.setState({ idBancoCredito: event.target.value })}>
                                                                    <option value="">-- Cuenta bancaria --</option>
                                                                    {
                                                                        this.state.bancos.map((item, index) => (
                                                                            <option key={index} value={item.idBanco}>{item.nombre}</option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>
                                                        </div>
                                                        : null
                                                }

                                                {
                                                    this.state.montoInicialCheck ?
                                                        <div className="form-group">
                                                            <div className="input-group">
                                                                <div className="input-group-prepend">
                                                                    <div className="input-group-text"><i className="bi bi-credit-card-2-back"></i></div>
                                                                </div>
                                                                <select
                                                                    title="Lista metodo de pago"
                                                                    className="form-control"
                                                                    ref={this.refMetodoCredito}
                                                                    value={this.state.codigoMetodoPagoCredito}
                                                                    onChange={(event) => this.setState({ codigoMetodoPagoCredito: event.target.value })}>
                                                                    <option value="">-- Metodo de pago --</option>
                                                                    {
                                                                        this.state.metodosPago.map((item, index) => (
                                                                            <option key={index} value={item.codigo}>{item.nombre}</option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>
                                                        </div>
                                                        : null
                                                }

                                                <div className="form-group">
                                                    <div className="input-group">
                                                        <div className="input-group-prepend">
                                                            <div className="input-group-text"><i className="bi bi-hourglass-split"></i></div>
                                                        </div>
                                                        <input
                                                            title="Número de cuotas"
                                                            type="text"
                                                            className="form-control"
                                                            placeholder='Número de cuotas'
                                                            ref={this.refNumCutoas}
                                                            value={this.state.numCuota}
                                                            onChange={async (event) => {
                                                                await this.setStateAsync({ numCuota: event.target.value })
                                                                this.calcularLetraMensual()
                                                            }}
                                                            onKeyPress={keyNumberInteger} />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <div className="input-group">
                                                        <div className="input-group-prepend">
                                                            <div className="input-group-text"><i className="bi bi-calendar"></i></div>
                                                        </div>

                                                        <select
                                                            title="Mes"
                                                            className="form-control"
                                                            value={this.state.monthPago}
                                                            onChange={(event) => this.setState({ monthPago: event.target.value })}>
                                                            {
                                                                this.state.mmonth.map((item, index) => (
                                                                    <option key={index} value={item}>{monthName(item)}</option>
                                                                ))
                                                            }
                                                        </select>
                                                        <select
                                                            title="Año"
                                                            className="form-control"
                                                            value={this.state.yearPago}
                                                            onChange={(event) => this.setState({ yearPago: event.target.value })}>
                                                            {
                                                                this.state.year.map((item, index) => (
                                                                    <option key={index} value={item}>{item}</option>
                                                                ))
                                                            }
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <div className="input-group">
                                                        <div className="input-group-prepend">
                                                            <div className="input-group-text"><i className="bi bi-credit-card-2-back"></i></div>
                                                        </div>
                                                        <select
                                                            title="Lista frecuencia de pago"
                                                            className="form-control"
                                                            ref={this.refFrecuenciaPagoCredito}
                                                            value={this.state.frecuenciaPagoCredito}
                                                            onChange={(event) => this.setState({ frecuenciaPagoCredito: event.target.value })}
                                                        >
                                                            <option value="">-- Frecuencia de pago --</option>
                                                            <option value="15">Quinsenal</option>
                                                            <option value="30">Mensual</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <div className="input-group">
                                                        <div className="input-group-prepend">
                                                            <div className="input-group-text"><i className="bi bi-coin"></i></div>
                                                        </div>
                                                        <input
                                                            title="Letra mensual"
                                                            type="text"
                                                            className="form-control"
                                                            placeholder='0.00'
                                                            value={this.state.letraMensual}
                                                            disabled={true} />
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                        : null
                                }

                                {/* crédito variable */}
                                {
                                    this.state.selectTipoPago === 3 ?
                                        <div className={`row`}>
                                            <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">

                                                <div className="form-group">
                                                    <div className="input-group">
                                                        <div className="input-group-prepend">
                                                            <div className="input-group-text"><i className="bi bi-tag-fill"></i></div>
                                                        </div>
                                                        <input
                                                            title="Monto inicial"
                                                            type="text"
                                                            className="form-control"
                                                            ref={this.refInicialCreditoVariable}
                                                            disabled={!this.state.inicialCreditoVariableCheck}
                                                            placeholder='Monto inicial'
                                                            value={this.state.inicialCreditoVariable}
                                                            onChange={async (event) => {
                                                                await this.setStateAsync({ inicialCreditoVariable: event.target.value })

                                                            }}
                                                            onKeyPress={keyNumberFloat} />
                                                        <div className="input-group-append">
                                                            <div className="input-group-text">
                                                                <div className="form-check form-check-inline m-0">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        checked={this.state.inicialCreditoVariableCheck}
                                                                        onChange={async (event) => {
                                                                            await this.setStateAsync({ inicialCreditoVariableCheck: event.target.checked })
                                                                            this.refInicialCreditoVariable.current.focus();
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {
                                                    this.state.inicialCreditoVariableCheck ?
                                                        <>
                                                            <div className="form-row">
                                                                <div className="form-group col-md-12">
                                                                    <div className="input-group">
                                                                        <div className="input-group-prepend">
                                                                            <div className="input-group-text"><i className="bi bi-receipt"></i></div>
                                                                        </div>
                                                                        <select
                                                                            title="Lista de caja o banco a depositar"
                                                                            className="form-control"
                                                                            ref={this.refComprobanteCreditoVariable}
                                                                            value={this.state.idComprobanteCreditoVariable}
                                                                            onChange={(event) => this.setState({ idComprobanteCreditoVariable: event.target.value })}>
                                                                            <option value="">-- Comprobante --</option>
                                                                            {
                                                                                this.state.comprobantesCobro.map((item, index) => (
                                                                                    <option key={index} value={item.idComprobante}>{item.nombre}</option>
                                                                                ))
                                                                            }
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="form-group">
                                                                <div className="input-group">
                                                                    <div className="input-group-prepend">
                                                                        <div className="input-group-text"><i className="bi bi-bank"></i></div>
                                                                    </div>
                                                                    <select
                                                                        title="Lista de caja o banco a depositar"
                                                                        className="form-control"
                                                                        ref={this.refBancoCreditoVariable}
                                                                        value={this.state.idBancoCreditoVariable}
                                                                        onChange={(event) => this.setState({ idBancoCreditoVariable: event.target.value })}>
                                                                        <option value="">-- Cuenta bancaria --</option>
                                                                        {
                                                                            this.state.bancos.map((item, index) => (
                                                                                <option key={index} value={item.idBanco}>{item.nombre}</option>
                                                                            ))
                                                                        }
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="form-group">
                                                                <div className="input-group">
                                                                    <div className="input-group-prepend">
                                                                        <div className="input-group-text"><i className="bi bi-credit-card-2-back"></i></div>
                                                                    </div>
                                                                    <select
                                                                        title="Lista metodo de pago"
                                                                        className="form-control"
                                                                        ref={this.refMetodoCreditoVariable}
                                                                        value={this.state.codigoMetodoPagoCreditoVariable}
                                                                        onChange={(event) => this.setState({ codigoMetodoPagoCreditoVariable: event.target.value })}>
                                                                        <option value="">-- Metodo de pago --</option>
                                                                        {
                                                                            this.state.metodosPago.map((item, index) => (
                                                                                <option key={index} value={item.codigo}>{item.nombre}</option>
                                                                            ))
                                                                        }
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </>

                                                        : null
                                                }

                                                <div className="form-group">
                                                    <div className="input-group">
                                                        <div className="input-group-prepend">
                                                            <div className="input-group-text"><i className="bi bi-credit-card-2-back"></i></div>
                                                        </div>
                                                        <select
                                                            title="Lista frecuencia de pago"
                                                            className="form-control"
                                                            ref={this.refFrecuenciaPago}
                                                            value={this.state.frecuenciaPago}
                                                            onChange={(event) => this.setState({ frecuenciaPago: event.target.value })}
                                                        >
                                                            <option value="">-- Frecuencia de pago --</option>
                                                            <option value="15">Quinsenal</option>
                                                            <option value="30">Mensual</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <div className="input-group">
                                                        <div className="input-group-prepend">
                                                            <div className="input-group-text"><i className="bi bi-piggy-bank-fill"></i></div>
                                                        </div>
                                                        <input
                                                            title="Deuda restante"
                                                            type="text"
                                                            className="form-control"
                                                            placeholder='0.00'
                                                            value={formatMoney(this.state.importeTotal - this.state.inicialCreditoVariable)}
                                                            disabled={true} />
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                        : null
                                }

                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={() => this.onEventGuardar()}>Completar venta</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* fin modal */}

                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div> :
                        null
                }

                <div className='row pb-3'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <section className="content-header">
                            <h5>
                                <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Registrar Venta
                                <small className="text-secondary"> nueva</small>
                            </h5>
                        </section>
                    </div>
                </div>

                {
                    this.state.messageWarning === '' ? null :
                        <div className="alert alert-warning" role="alert">
                            <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                        </div>
                }

                <div className="row">
                    <div className="col-xl-8 col-lg-8 col-md-8 col-sm-12 col-12">

                        <div className="row">
                            <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
                                <SearchBarLote
                                    placeholder="Filtrar lotes..."
                                    refLote={this.refLote}
                                    lote={this.state.lote}
                                    lotes={this.state.lotes}
                                    onEventClearInput={this.onEventClearInputLote}
                                    handleFilter={this.handleFilterLote}
                                    onEventSelectItem={this.onEventSelectItemLote}
                                />
                            </div>

                            <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
                                <div className="form-group">
                                    <div className="input-group">
                                        <div className="input-group-prepend">
                                            <div className="input-group-text">
                                                <i className="bi bi-cash-coin"></i>
                                            </div>
                                        </div>
                                        <input
                                            title="Precio de venta"
                                            type="text"
                                            className="form-control"
                                            ref={this.refPrecioContado}
                                            value={this.state.precioContado}
                                            onChange={async (event) => {
                                                if (event.target.value.trim().length > 0) {
                                                    await this.setStateAsync({
                                                        precioContado: event.target.value,
                                                        messageWarning: '',
                                                    });
                                                } else {
                                                    await this.setStateAsync({
                                                        precioContado: event.target.value,
                                                        messageWarning: 'Ingrese el monto',
                                                    });
                                                }
                                            }}

                                            placeholder="Ingrese el monto"
                                            onKeyPress={keyNumberFloat} />
                                        <div className="input-group-append">
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                title="Agregar"
                                                onClick={() => this.addObjectTable()}>
                                                <i className="bi bi-plus-circle"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                <div className="form-group">
                                    <a
                                        onClick={async () => await this.setStateAsync({
                                            expandedOpciones: !(this.refCollpse.current.attributes["aria-expanded"].value.toLowerCase() === 'true')
                                        })}
                                        ref={this.refCollpse}
                                        className="icon-link collapsed"
                                        data-bs-toggle="collapse"
                                        href="#collapseOpciones"
                                        role="button"
                                        aria-expanded="false"
                                        aria-controls="collapseOpciones">
                                        Opciones {this.state.expandedOpciones ? <i className="fa fa-plus-square"></i> : <i className="fa fa-minus-square"></i>}
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div ref={this.refCollpseContent} className="collapse" id="collapseOpciones">
                            <div className="row">
                                <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
                                    <div className="form-group">
                                        <select
                                            title="Lista de lotes"
                                            className="form-control"
                                            value={this.state.idImpuesto}
                                            ref={this.refImpuesto}
                                            onChange={(event) => this.setState({ idImpuesto: event.target.value })}
                                        >
                                            <option value="">-- Impuesto --</option>
                                            {
                                                this.state.impuestos.map((item, index) => (
                                                    <option key={index} value={item.idImpuesto}>{item.nombre}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>

                                <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
                                    <div className="form-group">
                                        <select
                                            title="Lista de lotes"
                                            className="form-control"
                                            value={this.state.idMedida}
                                            ref={this.refMedida}
                                            onChange={(event) => this.setState({ idMedida: event.target.value })}
                                        >
                                            <option value="">-- Unidad --</option>
                                            {
                                                this.state.medidas.map((item, index) => (
                                                    <option key={index} value={item.idMedida}>{item.nombre}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className=" col-md-12 col-sm-12 col-12">
                                <div className="table-responsive">
                                    <table className="table table-striped table-bordered rounded">
                                        <thead>
                                            <tr>
                                                <th width="10%" className="text-center">#</th>
                                                <th width="30%">Descripción</th>
                                                <th width="10%">Cantidad </th>
                                                <th width="20%">Impuesto</th>
                                                <th width="10%">Precio </th>
                                                <th width="10%">Importe </th>
                                                <th width="5%">Quitar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                this.state.detalleVenta.length === 0 ? (
                                                    <tr className="text-center">
                                                        <td colSpan="7"> Agregar datos a la tabla </td>
                                                    </tr>
                                                ) : (
                                                    this.state.detalleVenta.map((item, index) => (
                                                        <tr key={index}>
                                                            <td className="text-center">{++index}</td>
                                                            <td>{item.nombreLote}{<br />}{<small>{item.nombreManzana}</small>}</td>
                                                            <td>{item.cantidad}{<br />}{<small>{item.medida}</small>}</td>
                                                            <td>{item.impuesto}</td>
                                                            <td>{formatMoney(item.precioContado)}</td>
                                                            <td>{formatMoney(item.precioContado * item.cantidad)}</td>
                                                            <td>
                                                                <button className="btn btn-outline-danger btn-sm" title="Eliminar" onClick={() => this.removeObjectTable(item.idDetalle)}><i className="bi bi-trash"></i></button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-4 col-lg-4 col-md-4 col-sm-12 col-12">

                        <div className="form-group">
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <div className="input-group-text"><i className="bi bi-receipt"></i></div>
                                </div>
                                <select
                                    title="Comprobantes de venta"
                                    className="form-control"
                                    ref={this.refComprobante}
                                    value={this.state.idComprobante}
                                    onChange={(event) => this.setState({ idComprobante: event.target.value })}>
                                    <option value="">-- Comprobantes --</option>
                                    {
                                        this.state.comprobantes.map((item, index) => (
                                            <option key={index} value={item.idComprobante}>{item.nombre}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>


                        <div className="form-group ">

                            <SearchBarClient
                                placeholder="Filtrar clientes..."
                                refCliente={this.refCliente}
                                cliente={this.state.cliente}
                                clientes={this.state.clientes}
                                onEventClearInput={this.onEventClearInputClient}
                                handleFilter={this.handleFilterClient}
                                onEventSelectItem={this.onEventSelectItemClient}
                            />
                            {/* <select
                                                title="Lista de clientes"
                                                className="form-control"
                                                ref={this.refCliente}
                                                value={this.state.idCliente}
                                                onChange={(event) => this.setState({ idCliente: event.target.value })}>
                                                <option value="">-- Clientes --</option>
                                                {
                                                    this.state.clientes.map((item, index) => (
                                                        <option key={index} value={item.idCliente}>{item.informacion}</option>
                                                    ))
                                                }
                                            </select> */}

                        </div>


                        <div className="form-group">
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <div className="input-group-text"><i className="bi bi-cash"></i></div>
                                </div>
                                <select
                                    title="Lista metodo de pago"
                                    className="form-control"
                                    ref={this.refMoneda}
                                    value={this.state.idMoneda}
                                    onChange={(event) => {
                                        if (event.target.value.length > 0) {
                                            this.setState({
                                                idMoneda: event.target.value,
                                                messageWarning: '',
                                            });
                                        } else {
                                            this.setState({
                                                idMoneda: event.target.value,
                                                messageWarning: "Seleccione un moneda.",
                                            });
                                        }
                                    }}>
                                    <option value="">-- Moneda --</option>
                                    {
                                        this.state.monedas.map((item, index) => (
                                            <option key={index} value={item.idMoneda}>{item.nombre}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <table width="100%">
                                <tbody>
                                    {this.renderTotal()}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>

                <div className="row">
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                        <div className="form-row">
                            <div className="form-group col-md-12">
                                <button type="button" className="btn btn-success" onClick={() => this.onEventOpenModal()}>
                                    <i className="fa fa-save"></i> Guardar
                                </button>
                                {" "}
                                <button type="button" className="btn btn-outline-info" onClick={() => this.onEventLimpiar()}>
                                    <i className="fa fa-trash"></i> Limpiar
                                </button>
                                {" "}
                                <button type="button" className="btn btn-outline-secondary" onClick={() => this.props.history.goBack()}>
                                    <i className="fa fa-close"></i> Cerrar
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.principal
    }
}

export default connect(mapStateToProps, null)(VentaProceso);